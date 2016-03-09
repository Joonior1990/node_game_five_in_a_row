var config  = require('./config'),
	mysql     = config.mysql,
	cript     = config.CryptoJS,
	secretKey = config.key,
	pool      = mysql.createPool(config.configuration);

var async = require('async');
var otherFunction = require('./otherFunction');
var constant = require('../modules/constant');

module.exports = {
	newUser : function(req, res, data) {
		if (req.session.login != constant.user_guest) {
			pool.getConnection(function(err, connection) {
				if (err) {
					console.error('Error db connection newUser');
					return;
				}
				var sql = "select * from `online` where `login` = ?";

				connection.query(sql, req.session.login, function(err, result) {
					if (err) {
						console.error('Error SQL newUser 01');
						return;
					}
					
					if (result[0]) {
						req.session.login = constant.user_guest;
					}
					console.log('post: ', {
						user : req.session.login,
						room : data.url,
					});
					res.send(
						{
							user : req.session.login,
							room : data.url,
						}
					);
					connection.release();
				});
			});
		} else {
			console.log('post: ', {
				user : req.session.login,
				room : data.url,
			});
			res.send(
				{
					user : req.session.login,
					room : data.url,
				}
			);
		}
	},

	login : function(req, res, data) {
		async.waterfall(
			[
		    function correctData(callback) {
		    	if (data.user == constant.user_guest) {
		    		res.send({user: '', message: 'Not correct login'});
		    		return;
		    	}
		    	if (data.user && data.pass) {
		    		callback(null, data.user, data.pass);
		    	} else {
		    		res.send({user: '', message: 'Not correct data'});		    		
		    	}
		    },
		    function connectDB(user, pass, callback) {
		    	pool.getConnection(function(err, connection) {
						if (err) {
							console.error('Error db connection');
							return;
						}
						
						callback(null, user, pass, connection);
					});
		    },
		    function userOnline(user, pass, connection, callback) {
	        var sql = "select * from `online` where `login` = ?";

					connection.query(sql, user, function(err, result) {
						if (err) {
							console.error('Error SQL question 01');
							return;
						}
						
						if (result[0]) {
							res.send({user: '', message: 'user online'});
							return;

						} else {
							callback(null, user, pass, connection);
						}
					});
		    },
		    function userHas(user, pass, connection, callback) {
	        var sql = "select * from `users` where `login` = ?";

					connection.query(sql, user, function(err, result) {
						if (err) {
							console.error('Error SQL question 02');
							return;
						}
						
						if (!result[0]) {
							var sql = "insert into `users`(`login`, `pass`) values (?, ?)";

							connection.query(sql, 
								[
									user,
									otherFunction.objToString( cript.HmacSHA1(pass, secretKey) ),
								], 
								function(err, result) {
									if (err) {
										console.error('Error SQL question 03');
										return;
									}
									callback(null, user, connection);
								}
							);
						} else {
							var cur_pass = otherFunction.objToString( cript.HmacSHA1(pass, secretKey) );

							if (cur_pass == result[0].pass) {
								callback(null, user, connection);
							} else {
								callback(null, '', connection);
							}
						}
					});
		    }
			], 
			function addSession(err, login, connection) {
				var message = "Error pass";
		    if (login) {
		    	req.session.login = login;
		    	message = 'User login';
		    }

		    res.send({user: login, message: message});
		    connection.release();
		  }
		);
	},

	logout : function(req, res) {
		var login = req.session.login;

		req.session.login = constant.user_guest;
		res.send({user: login, message: 'user logout'});

	},

	newGame : function(req, res) {
		var user = req.session.login;

		if (user == constant.user_guest) {
			res.send({user: user.login, message: 'only registration users'});
		} else {
			async.waterfall(
				[
					function connectDB(callback) {
						pool.getConnection(function(err, connection) {
							if (err) {
								console.error('Error db connection newGame');
								return;
							}
							callback(null, connection);
						});
					},
					function activeGame(connection, callback) {
						var sql = "select * from `game_online` where `status` = '1' OR `status` = '2'";
						connection.query(sql, function(err, result) {
							if (err) {
								console.error('Error SQL question activeGame');
								return;
							}
							callback(null, result, connection);
						});
					}
				], 
				function dataAnalize(err, data, connection) {
					var result = false; 
					if (data[0]) {
						for (var i = 0; i < data.length; i++) {
							if (data[i].user_create == user || data[i].user_connect == user) result = true;
						}
					}

					if (result) {
						res.send({user: '', message: 'this user gamed in current time'});
						connection.release();
					} else {
						var sql = "insert into `game_online`(`user_create`) values (?)";
						connection.query(sql, user, function(err, result) {
							if (err) {
								console.error('Error SQL question dataAnalize');
								console.log(err);
								return;
							}
							var room = result.insertId;
							res.send({user: user, room: room, message: 'user create a new game'});
							connection.release();
						});
					}
				}
			);
		}
	},

	connectGame: function(req, res, data) {
		var user = req.session.login;
		var room = data.room;
		var user_create = data.user;

		if (user == constant.user_guest) {
			res.send({user: '', message: 'only registration users'});
		} else {
			if (room && user_create) {	
				async.waterfall(
					[
						function connectDB(callback) {
							pool.getConnection(function(err, connection) {
								if (err) {
									console.error('Error db connection newGame');
									return;
								}
								callback(null, connection);
							});
						},
						function searchGame(connection, callback) {
							var sql = "select * from `game_online` where `status` = 1 AND `user_create` = ?";
							connection.query(sql, user_create, function(err, result) {
								if (err) {
									console.error('Error SQL question dataAnalize');
									console.log(err);
									return;
								}
								if (result[0]) {
									callback(null, result[0], connection);
								} else {
									res.send({user: '', message: 'game started'});
									connection.release();
								}
							});
						},
						function connectUser(data, connection, callback) {
							var sql = "update `game_online` set `user_connect` = ?, `status` = 2 where `id` = ?";
							connection.query(sql, [user, data.id], function(err, result) {
								if (err) {
									console.error('Error SQL question dataAnalize');
									console.log(err);
									return;
								}
								callback(null, connection);
							});
						}
					], function(err, connection) {
						res.send({user: user, room: room, message: 'user connect'});
						connection.release();
					}
				);
			} else {
				res.send({user: '', message: 'data error'});
			}
		}
	},
}