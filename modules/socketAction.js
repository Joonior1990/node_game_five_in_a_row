var constant = require('./constant');
var config  = require('./config'),
	mysql     = config.mysql,
	pool      = mysql.createPool(config.configuration);

var async = require('async');
var gameLogic = require('./gameLogic');

module.exports = function(socket) {

	socket.on('newUser', function(data) {
		socket.state.user = data.user;

		var user = data.user;
		async.waterfall(
			[
		    function connectDB(callback) {
					pool.getConnection(function(err, connection) {
						if (err) {
							console.error('Error db connection newUser');
							return;
						}
						callback(null, user, connection);
					});
				},
		    function addUserOnline(user, connection, callback) {
		    	var sql = "insert into `online`(`login`, `socket_id`, `room`) values (?, ?, ?)";
		    	connection.query(sql, [user, socket.id, data.room], 
						function(err, result) {
							if (err) {
								console.error('Error SQL question newUser');
								return;
							}
							callback(null, connection);
						}
					);
		    }
		  ], function (err, connection) {
				if (data.room == 'main') {
					socket.join(data.room);
					socket.broadcast.to(data.room).emit('newUserConnect', data);
					connection.release();
				} else {
					if (data.user != constant.user_guest) {
							
						var sql = "select * from `game_online` where `status` = 1 OR `status` = 2";
						connection.query(sql, [socket.state.user, socket.state.user], function(err, result) {
							if (err) {
								console.error('Error select socket on game online');
								return;
							}
							if (result[0]) {
								var room = '';
								for (var i = 0; i < result.length; i++){
									if (result[i].user_create == socket.state.user || result[i].user_connect == socket.state.user) {
										room = result[i].id;
										break;
									}
								}
								socket.state.game = true;
								console.log('room: ', room);
					 			socket.broadcast.to('main').emit('newGame', {user: socket.state.user, room: room, message: 'user creat new game'});
								socket.join(room);
								socket.broadcast.to(room).emit('userConnectToGame', {user: socket.state.user, message : 'User connect!'});
								connection.release();
							}
						});
					} else {
						connection.release();
					}
				}
		  });
	});

	socket.on('login', function(data) {
		async.waterfall(
			[
		    function connectDB(callback) {
					pool.getConnection(function(err, connection) {
						if (err) {
							console.error('Error db connection login');
							return;
						}
						callback(null, data.user, connection);
					});
				},
		    function updateUserOnline(user, connection, callback) {
		    	var sql = "update `online` set `login`= ? WHERE `socket_id` = ?";

		    	connection.query(sql, [user, socket.id], 
						function(err, result) {
							if (err) {
								console.error('Error SQL question login');
								return;
							}
							callback(null, connection);
						}
					);
		    }
		  ], function (err, connection) {
				socket.state.user = data.user;
				socket.broadcast.to(data.room).emit('newUserConnect', data);
				socket.broadcast.to(data.room).emit('UserDisconnect', {user: constant.user_guest, message: 'user disconnect'});
		  	connection.release();
		  });
	});

	socket.on('logout', function(data) {
		async.waterfall(
			[
		    function connectDB(callback) {
					pool.getConnection(function(err, connection) {
						if (err) {
							console.error('Error db connection logout');
							return;
						}
						callback(null, connection);
					});
				},
		    function updateUserOnline(connection, callback) {
		    	var sql = "update `online` set `login`= ? WHERE `socket_id` = ?";

		    	connection.query(sql, [constant.user_guest, socket.id], 
						function(err, result) {
							if (err) {
								console.error('Error SQL question logout');
								return;
							}
							callback(null, connection);
						}
					);
		    }
		  ], function (err, connection) {
				socket.state.user = constant.user_guest;

				socket.broadcast.to(data.room).emit('UserDisconnect', {user: data.user, message: 'user disconnect'});
				socket.broadcast.to(data.room).emit('newUserConnect', {user: constant.user_guest, room : data.room});
		  	connection.release();
		  });
	});

	socket.on('message', function(data) {
		socket.emit('newMessage', 
			{
				user: socket.state.user, 
				room: data.room,
				message : data.message,
				date: data.date,
			});
		socket.broadcast.to(data.room).emit('newMessage', 
			{
				user: socket.state.user, 
				room: data.room,
				message : data.message,
				date: data.date,
			});
	});

	socket.on('gameProcess', function(data) {
		var rooms = socket.adapter.rooms;
		var user = socket.state.user;
		var room = '';
		var row = data.row;
		var col = data.col;

		for (var key in rooms) {
			if (key) {
				room = key;
				break;
			}
		}
		console.log('room: ', room);
		//console.log('rooms: ', rooms);
		if (rooms) {
			async.waterfall(
				[
			    function connectDB(callback) {
						pool.getConnection(function(err, connection) {
							if (err) {
								console.error('Error db connection disconnect');
								return;
							}
							callback(null, connection);
						});
					},
					function selectAllGameWith(connection, callback) {
			    	var sql = "select * from `game_online` where `id` = ?";

			    	connection.query(sql, room, function(err, result) {
							if (err) {
								console.error('Error SQL question disconnect');
								return;
							}
							if (result[0]) {
								if (result[0].status == 3) {
									room = result[0].room;

									socket.emit('game', {user: '', message: 'You loose', row: row, col: col});
									socket.leave(room);
								} else {
									callback(null,  result[0], connection);
								}
							}
						});
			    },
			    function selectAllGameWith(gameProperty, connection, callback) {
			    	var sql = "select * from `bind_game_users` where `room` = ?";

			    	connection.query(sql, room, function(err, result) {
							if (err) {
								console.error('Error SQL question disconnect');
								return;
							}
							callback(null,  result, gameProperty, connection);
						});
			    },
			    function analizeRezult(data, gameProperty, connection, callback) {
			    	var current_user = '';
			    	if (data.length) {
			    		current_user = gameProperty.user_create;
			    	} 
			    	if (data.length % 2) {
			    		current_user = gameProperty.user_connect;
			    	} else {
			    		current_user = gameProperty.user_create;			    		
			    	}

			    	console.log('user: ', user);
			    	console.log('current_user: ', current_user);
			    	if (user == current_user) {
			    		var player = (gameProperty.user_create == current_user) ? 'user_01' : 'user_02';
			    		var dataArr = [[], []];
			    		if (data[0]) {
			    			for (var i = 0; i < data.length; i++) {
		    					var dataCourse = data[i][player];

		    					if (dataCourse) {
		    						var arr = dataCourse.split(',');
			    					dataArr[0].push(arr[0]);
			    					dataArr[1].push(arr[1]);
		    					}
			    			}
			    		}

			   			var sql = "insert into `bind_game_users`(??, `room`) values (?, ?)";
			   			var course = col + ',' + row;
			   			// console.log("insert into `bind_game_users`(`"+player+"`, `room`) values ('"+col + ',' + row,+"', '"+room+"')");
			   			connection.query(sql, [player, course, room], function(err, result) {
			   					if (err) {
			   						console.error('error question add new course in bind_game_user');
			   						console.error(err);
			   						return;
			   					}
			   					dataArr[0].push(col);
			    				dataArr[1].push(row);

			    				callback(null, dataArr, connection);
			   			});
			    	} else {
			    		socket.emit('userСourse', {user: '', message: 'Course your opponent', row: row, col: col});
			    	}
			    },
			  ], function(err, data, connection) { //data - все ходы текущего пользователя
			  	// игровая логика
			  	var result = gameLogic(data);

			  	if (result) {
			  		var sql = "update `game_online` set `status` = 3 where `id` = ?";
			  		connection.query(sql, room, function(err, result){
			  			if (err) {
			  				console.error('Error update game status');
			  				return;
			  			}
			  			socket.emit('userWin', {user: user, message: 'usre win!'});
							socket.broadcast.to(room).emit('userWin', {user: user, message: 'user win!'});
			  			socket.leave(room);
				  		connection.release();
			  		});
			  	} else {
			  		socket.broadcast.to(room).emit('userСourse', {user: user, row: row, col: col});
			  		connection.release();
			  	}
		  });

		} else {
			socket.emit('errorDataProcess', data);
		}
	});

	socket.on('disconnect', function() {
		async.waterfall(
			[
		    function connectDB(callback) {
					pool.getConnection(function(err, connection) {
						if (err) {
							console.error('Error db connection disconnect');
							return;
						}
						callback(null, connection);
					});
				},
		    function deleteUserOnline(connection, callback) {
		    	var sql = "delete from `online` where `socket_id` = ?";

		    	connection.query(sql, socket.id, 
						function(err, result) {
							if (err) {
								console.error('Error SQL question disconnect');
								return;
							}
							callback(null, connection);
						}
					);
		    },
		    function updateGameOnline(connection, callback) {
		    	if (socket.state.game) {
			    	var sql = "update `game_online` SET `status` = 3 where `user_create` = ? OR `user_connect` = ?";

			    	connection.query(sql, [socket.state.user, socket.state.user], 
							function(err, result) {
								if (err) {
									console.error('Error SQL question disconnect');
									return;
								}
								var rooms = socket.adapter.rooms;
								var roomsArr = [];

								if (rooms) {
									for (var key in rooms) {
										roomsArr.push(key);
									}

									var roomCurrent = roomsArr[roomsArr.length - 1];
									var data = {
										user: socket.state.user,
										message : 'User '+socket.state.user+' disconnect!',
									};

									socket.broadcast.to(roomCurrent).emit('userWin', data);
									socket.leave(roomCurrent);
								}
								callback(null, connection);
							}
						);
		    	}
					callback(null, connection);
		    }
		  ], function (err, connection) {
				var rooms = socket.adapter.rooms;
				var roomsArr = [];

				if (rooms) {
					for (var key in rooms) {
						roomsArr.push(key);
					}

					var roomCurrent = roomsArr[roomsArr.length - 1];
					var data = {
						user: socket.state.user,
						message : 'User disconnect',
					};
					socket.broadcast.to(roomCurrent).emit('UserDisconnect', {user: socket.state.user, message: 'user disconnect'});
					socket.leave(roomCurrent);
				}
				connection.release();
		  });
	});
};