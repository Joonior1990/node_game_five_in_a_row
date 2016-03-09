$(function() {
	var socket = io.connect('http://localhost:8880');
	socket.on('newUserConnect', function(data) {
		var newUser = '<div class=" user my_login">'+data.user+'</div>';
		var parent = $('.my_login').parents('.cont_chat');
		
		parent.append(newUser);
		//console.log(data);
		var user = (data.user) ? data.user : 'guest';
		var newMessage = '<div class="mess little_mess">';
		newMessage += 'Пользователь: <b>' + user + '</b> подключился к чату';
		newMessage += '</div>';

		var parent = $('.cont_mess');
		parent.prepend(newMessage);
	});

	socket.on('newMessage', function(data) {
		var parent = $('.cont_mess');

		var newMessage = '<div class="mess">';
		newMessage += '<span class="nick">'+data.user+': </span>';
		newMessage += '<span class="text">'+data.message+'</span>';
		newMessage += '<span class="time">'+data.date+'</span>';
		newMessage += '</div>';
		
		parent.prepend(newMessage);
	});

	socket.on('newGame', function(data) {
		var parent = $('.cont_mess');

		var newMessage = '<div class="mess">';
		newMessage += '<a href="/game" data-room="'+data.room+'">игрок: <b>'+data.user+'</b> создал новую игру!</a>';
		newMessage += '</div>';
		
		parent.prepend(newMessage);
	});

	socket.on('userConnect', function(data) {
		var newUser = '<div class=" user my_login">'+data.user+'</div>';
		var parent = $('.my_login').parents('.cont_chat');
		
		parent.append(newUser);
		//console.log(data);
		var user = (data.user) ? data.user : 'guest';
		var newMessage = '<div class="mess little_mess">';
		newMessage += 'Пользователь: <b>' + user + '</b> подключился к игре';
		newMessage += '</div>';

		var parent = $('.cont_mess');
		parent.prepend(newMessage);
	});

	socket.on('userСourse', function(data) {
		if (data.user) {
			$('tr.'+data.row+' td.'+data.col).addClass('checked_last');
		} else {
			alert(data.message);

			$('tr.'+data.row+' td.'+data.col).removeClass('checked_first');
		}
	})

	socket.on('errorDataProcess', function(data) {
		$('tr.'+data.row+' td.'+data.col).removeClass('checked_first');
	});

	socket.on('userConnectToGame', function(data) {
		$('.connt_game span').text(data.user);
		alert('user ' + data.user + 'connect!');
	});

	socket.on('userWin', function(data) {
		if ($('div').hasClass('disconnect_game') ) {
			alert(data.message);
		}
	});

	socket.on('UserDisconnect', function(data) {
		var currentUser = $('.my_login');
		var check = true;

		currentUser.each(function() {
			if (check) {
				if ($(this).text() == data.user) {
					check = false;
					$(this).remove();
				}
			}
		});
		//console.log(data);
		var user = (data.user) ? data.user : 'guest';
		var newMessage = '<div class="mess little_mess">';
		newMessage += 'Пользователь: <b>' + user + '</b> покинул чат';
		newMessage += '</div>';

		var parent = $('.cont_mess');
		parent.prepend(newMessage);
	});

	var url = window.location.pathname;
	var url = url.replace('/', '') ? url.replace('/', '') : 'main';
	
	$.post('/post',
		{
			action : 'newUser',
			url    : url,
		}, 
		function(out) {
			// console.log(out.user);
			if (out) {
				if (out.user == 'guest') {
					var form = $('form');
					var parent = form.parents('.login');
					var parentGame = $('.aut');
					
					var game = '<div class="not_game"><span>Зарегестрируйтесь, чтобы создать свою игру</span></div>';					
					parentGame.find('.not_game').remove();
					parentGame.find('.new_game').remove();
					parentGame.append(game);

					var input = '<input type="text" placeholder="Логин" name="log"/>';
					input += '<input type="password" placeholder="Пароль" name="pass"/>';

					parent.find('.hello').remove();
					form.find('input[name="log"]').remove();
					form.find('input[name="pass"]').remove();
					form.find('input[type="submit"]').val('Войти');
					form.removeClass('logout');
					form.addClass('login');

					form.prepend(input);

					if (url == 'game') {
						window.location.href = "/";
					}
				}
				var parent = $('.cont_chat');

				var newUser = '<div class=" user my_login">'+out.user+'</div>';
				var parent = $('.cont_chat');
				
				parent.append(newUser);

				socket.emit('newUser', out);
			}
		}
	);

	// login logout
	$('.wrap').on('submit', 'form', function(event) {
		event.preventDefault();

		var form = $(this);

		var action = $(this).attr('class');
		var user = $(this).find('input[name="log"]').val();
		var pass = $(this).find('input[name="pass"]').val();

		$.post('/post', {
			action : action,
			user   : user,
			pass   : pass,
		}, function(out) {
			// console.log(out.user);
			// console.log(out.message);
			if (out.user) {
				var parent = form.parents('.login');
				if (action == 'login') {
					socket.emit('login', {user: out.user, room : url});

					var parentGame = $('.aut');
					var game = '<div class="new_game">Новая игра</div>';
					parentGame.find('.not_game').remove();
					parentGame.append(game);
					
					var text = '<div class="hello" ><span>Привет,<br/> <b>'+out.user+'</b>!</span></div>';

					form.find('input[name="log"]').remove();
					form.find('input[name="pass"]').remove();
					form.find('input[type="submit"]').val('Выйти');
					form.removeClass('login');
					form.addClass('logout');

					parent.prepend(text);

					var newUser = '<div class=" user my_login">'+out.user+'</div>';
					var parent = $('.my_login').parents('.cont_chat');
					
					parent.append(newUser);

					var currentUser = $('.my_login');
					var check = true;

					currentUser.each(function() {
						if (check) {
							if ($(this).text() == 'guest') {
								check = false;
								$(this).remove();
							}
						}
					});
				}
				if (action == 'logout') {
					socket.emit('logout', {user: out.user, room : url});
					
					var parentGame = $('.aut');
					var game = '<div class="not_game"><span>Зарегестрируйтесь, чтобы создать свою игру</span></div>';					
					parentGame.find('.new_game').remove();
					parentGame.append(game);

					var input = '<input type="text" placeholder="Логин" name="log"/>';
					input += '<input type="password" placeholder="Пароль" name="pass"/>';

					parent.find('.hello').remove();
					form.find('input[type="submit"]').val('Войти');
					form.removeClass('logout');
					form.addClass('login');

					form.prepend(input);

					var currentUser = $('.my_login');
					var check = true;

					currentUser.each(function() {
						if (check) {
							if ($(this).text() == out.user) {
								check = false;
								$(this).remove();
							}
						}
					});

					var newUser = '<div class=" user my_login">guest</div>';
					var parent = $('.cont_chat');
					
					parent.append(newUser);
				}

			} else {
				alert(out.message);
			}
		})
	});

	if ( $('textarea').hasClass('new_mes') ) {
		$('.new_mes').keydown(function(event) {
			if (event.keyCode == 13) {
				var message = $(this).val();
				$(this).val('');
				
				if (message) {
					var date = new Date();

					var options = {
					  hour: 'numeric',
					  minute: 'numeric',
					  second: 'numeric'
					};
					date = date.toLocaleString("ru", options);
					socket.emit('message', {user: '', room: url, message: message, date: date});
				} else {
					alert('Сообщение должно содержать минимум 1 символ');
				}
			}
		});
	}

	if ( $('div').hasClass('aut') ) {
		$('.aut').on('click', '.new_game', function() {
			$.post('/post', {action : 'newGame',}, function(data) {
				console.log(data);
				if (data.user) {
					window.location.href = '/game';
				} else {
					alert(data.message);
				}
			});
		});
	}

	if ( $('div').hasClass('all_cont_a') ) {
		$('.all_cont_a').on('click', 'a', function(event) {
			event.preventDefault();
			var parent = $(this).parents('.all_cont_a');

			var user = $(this).find('b').text();
			if (!user) {
				user = parent.find('b').text();
			}
			var room = $(this).attr('data-room');

			// console.log('user: ', user);
			// console.log('room: ', room);
			$.post('/post', {
				action: 'connectGame',
				user : user,
				room: room,
			}, function(out) {
				// console.log(out);
				if (out.user) {
					window.location.href="/game";
				} else {
					alert(out.message);
				}
			})
		});
	}
	if ( $('table').hasClass('gameTable') ) {
		$('td').click(function() {
			var row = $(this).parents('tr').attr('class');
			var col = $(this).attr('class');

			// console.log('row: ', row);
			// console.log('col: ', col);
			if ( $(this).hasClass('checked_first') || $(this).hasClass('checked_last')) {
				alert('This course is not correct');
				return false;
			}
			socket.emit('gameProcess', {row: row, col: col});
			$(this).addClass('checked_first');
		});
	}

	if ( $('div').hasClass('disconnect_game') ) {
		$('.disconnect_game a').click(function() {
			window.location.href = '/';
		});
	}
});