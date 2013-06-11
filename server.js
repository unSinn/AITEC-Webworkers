var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var path = require('path');

var adminChallengePw;
var pwclear;

require('crypto').randomBytes(10, function(ex, buf) {
	adminChallengePw = buf.toString('hex');
	console.log(adminChallengePw);
});

// listen for new web clients:
server.listen(8080);

app.get('/', function(req, res) {
	res.sendfile('webroot/index.html');
});

app.use(express.static(path.join(__dirname, 'webroot')));

io.sockets.on('connection', function(socket) {

	socket.emit('log', {
		text : 'Socket.io connected.'
	});

	socket.on('admin-start-cracking', function(data) {
		if (adminChallengePw == data.adminpw) {
			console.log("Sending start to clients: " + data.pwmd5);
			pwclear = data.pwclear;
			socket.broadcast.emit('clients-start-cracking', {
				text : 'Start cracking.',
				pwmd5 : data.pwmd5
			});
		} else {
			socket.emit('log', {
				text : 'Admin password was wrong!'
			});
		}
	});

	socket.on('client-found-password', function(data) {
		if (pwclear == data.password) {
			console
					.log("Client " + data.name
							+ "found the correct password!!!");
			socket.emit('log', {
				text : 'Congratulations, you found the correct password!!!'
			});
		} else {
			socket.emit('log', {
				text : 'Sorry, you found a wrong password :('
			});
		}
	});
});
