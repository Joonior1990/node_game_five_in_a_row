var constant = require('./constant');
var dbFunction = require('./dbFunction');

var async = require('async');

var getMethod = {
	general : function(res, req) {
		async.waterfall([
			function selectUserOnline(callback) {
				dbFunction.allUserOnChat(callback);
			},
			function selectCurrentGame(userOnline, callback) {
				dbFunction.selectGameOnline(userOnline, callback);
			}
			], function(err, userOnline, gameOnline) {
				var userOn = '';
				if (userOnline[0]) {
					
					var check = true;
					for (var key in userOnline) {
						if (check) {
							if (userOnline[key].login == req.session.login) {
								check = false;
								continue;
							}
						}
						userOn += '<div class=" user my_login">'+userOnline[key].login+'</div>';
					}
				}

				var userGuest = false;
				if (req.session.login != constant.user_guest) {
					userGuest = true;
				}

				if (!userGuest) {
					var data = '<form action="" class="login"><div class="inOut"><input type="text" placeholder="Логин" name="log"/><input type="password" placeholder="Пароль" name="pass"/></div><input type="submit" value="Войти" class="in" /></form>';
					var game = '<div class="not_game"><span>Зарегестрируйтесь, чтобы создать свою игру</span></div>';
				} else {
					var data = '<div class="hello" ><span>Привет,<br/> <b>'+req.session.login+'</b>!</span></div><form action="" class="logout"><div class="inOut"></div><input type="submit" value="Выйти" class="out" /></form>';
					var game = '<div class="new_game">Новая игра</div>';
				}

				var gameCurrent = '';
				if (gameOnline[0]) {
					for (var i = 0; i < gameOnline.length; i++) {
						var date = '' +gameOnline[i].datecreated;
						date = date.split(' ');

						gameCurrent += '<div class="game all_cont_a">';
						gameCurrent += '<p>Игрок <b>'+gameOnline[i].user_create+'</b> создал игру<p>';
						gameCurrent += '<a href="/game" class="connect_to_game" data-room="'+gameOnline[i].id+'">Подключиться</a>';
						gameCurrent += '<div class="time">'+date[4]+'</div>';
						gameCurrent += '</div>';						
					}
				}
				res.render('general', {
					userOnline : userOn,
					auth : data,
					game : game,
					gameCurrent : gameCurrent,
				});
			}
		);


	},

	game : function(res, req) {
		var user = req.session.login;
			async.waterfall([
			function selectGameUser(callback) {
				dbFunction.selectUserGame(user, callback);
			}], function(err, user_create, user_connect) {
				console.log('user_create: ', user_create);
		  	console.log('user_connect: ', user_connect);
				res.render('game', {
					user_create : user_create,
					user_connect : user_connect,
				});
			}
		);
	},
	
	notFound : function(res) {
		res.render('err404');
	}
}
module.exports = {
	'/'     : getMethod.general,
	'/game' : getMethod.game,
	'/404'  : getMethod.notFound
}