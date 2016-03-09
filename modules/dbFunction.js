var constant = require('./constant');
var config  = require('./config'),
	mysql     = config.mysql,
	pool      = mysql.createPool(config.configuration);

var async = require('async');

module.exports = {
	allUserOnChat : function(cb) {
		async.waterfall(
			[
			function connectDB(callback) {
				pool.getConnection(function(err, connection) {
					if (err) {
						console.error('Error db connection newUser');
						return;
					}
					callback(null, connection);
				});
			},
			function userOnline(connection, callback) {
				var sql = "select * from `online` where `room` = 'main'";
				connection.query(sql, function(err, result) {
						if (err) {
							console.error('Error SQL question newUser');
							return;
						}
						callback(null, result, connection);
					});
			}
		  ], function (err, result, connection) {
				cb(null, result);
				connection.release();
		  });
	},
	
	selectGameOnline : function(userOnline, cb) {
		async.waterfall(
			[
			function connectDB(callback) {
				pool.getConnection(function(err, connection) {
					if (err) {
						console.error('Error db connection connectDB');
						return;
					}
					callback(null, connection);
				});
			},
			function gameOnline(connection, callback) {
				var sql = "select * from `game_online` where `status` = '1'";
				connection.query(sql, function(err, result) {
						if (err) {
							console.error('Error SQL question gameOnline');
							return;
						}
						callback(null, result, connection);
					});
			}
		  ], function (err, gameOnline, connection) {
				cb(null, userOnline, gameOnline);
				connection.release();
		  });
	},

	clearUserOnline : function() {
		async.waterfall(
			[
			function connectDB(callback) {
				pool.getConnection(function(err, connection) {
					if (err) {
						console.error('Error db connection newUser');
						return;
					}
					callback(null, connection);
				});
			},
			function deleteUserOnline(connection, callback) {
				var sql = "delete from `online`";
				connection.query(sql, function(err, result) {
					if (err) {
						console.error('Error SQL question newUser');
						return;
					}
					callback(null, connection);
				});
			}], function(err, connection) {
				connection.release();
			});
	},

	updateGameOnline : function() {
		async.waterfall(
			[
			function connectDB(callback) {
				pool.getConnection(function(err, connection) {
					if (err) {
						console.error('Error db connection newUser');
						return;
					}
					callback(null, connection);
				});
			},
			function updateGameOnline(connection, callback) {
				var sql = "update `game_online` set `status` = 3";
				connection.query(sql, function(err, result) {
					if (err) {
						console.error('Error SQL question newUser');
						return;
					}
					callback(null, connection);
				});
			}], function(err, connection) {
				connection.release();
			});
	},

	selectUserGame : function(user, cb) {
		async.waterfall(
			[
			function connectDB(callback) {
				pool.getConnection(function(err, connection) {
					if (err) {
						console.error('Error db connection connectDB');
						return;
					}
					callback(null, connection);
				});
			},
			function selectGameOnline(connection, callback) {
				var sql = "select * from `game_online` where `status` != 3";
				connection.query(sql, function(err, result) {
						if (err) {
							console.error('Error SQL question selectGameOnline');
							return;
						}
						callback(null, result, connection);
					});
			}
		  ], function (err, result, connection) {
				if (result) {
					for (var i = 0; i < result.length; i++) {

						if (result[i].user_create == user || result[i].user_connect == user) {
		  			// console.log('user_create: ', result[i].user_create);
		  			// console.log('user_connect: ', result[i].user_connect);
							cb(null, result[i].user_create, result[i].user_connect);
							break;
						}
						connection.release();
					}
				}
		  }
		);
	}
}
