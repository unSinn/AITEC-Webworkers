var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var path = require('path');

var adminChallengePw;
var pwclear;

var userlist = {};

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
	    
	    //Get the clear password and resetting the user list
	    pwclear = data.pwclear;
	    userlist = {};
	    
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

    socket.on('client-started-cracking', function(data) {
	if (!userlist[this.id]) {
	    userlist[this.id] = {
		name : data.name,
		status : "cracking"
	    };
	}
	io.sockets.emit('userlist', userlist);
    });

    socket.on('client-found-password', function(data) {
	var user = userlist[this.id];
	if (pwclear == data.password) {
	    console.log("Client " + data.name + "found the correct password!!!");
	    user.status = "success";
	    socket.emit('log', {
		text : 'Congratulations, you found the correct password!!!'
	    });
	} else {
	    user.status = "fail";
	    socket.emit('log', {
		text : 'Sorry, you found a wrong password :('
	    });
	}
	io.sockets.emit('userlist', userlist);
    });
});
