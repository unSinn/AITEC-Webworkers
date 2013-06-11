var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var path = require('path');

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
	socket.on('client-found-password', function(data) {
		console.log(data);
	});
});
