var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var PORT = 8880;

var cookieSession = require('cookie-session');
var constant = require('./modules/constant');

var async = require('async');
var routerGet = require('./modules/routerGet');
var routerPost = require('./modules/routerPost');
var routerSocket = require('./modules/routerSocket');
var dbFuncion = require('./modules/dbFunction');
dbFuncion.clearUserOnline(); // clear table `online`
dbFuncion.updateGameOnline(); // update table `game_online`

var exphbs  = require('express-handlebars'); // require hbs
var hbs = exphbs.create({defaultLayout: 'index'}); // initiation layout dafault 

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

app.use(express.static(__dirname + '/public')); // get .css/.js

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.get(/\/*/g, function (req, res,next) {
	if (req.session.login == undefined) {
		req.session.login = constant.user_guest;
	}

	var url = req.url;
	routerGet(req, res, url);	
});

app.post('/post', function(req, res) {
	req.on('data', function(chunk) {
	  var data = chunk.toString().split('&');
	  var objData = {};

	  for (var i = 0; i < data.length; i++) {
	  	var arr = data[i].split('=');
	  	objData[arr[0]] = arr[1];
	  }

	  routerPost(req, res, objData);
	});
})

io.on('connection', function (socket) {
	socket.state = {};
	routerSocket(socket);
});

server.listen(PORT);
console.log('Server started on port ', PORT);