var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var clients = [];
var operator = null;

app.use(express.static(__dirname + '/assets'));

app.get('/', function(req, res){
	res.sendfile('index.html');
});

app.get('/operator', function(req, res){
	res.sendfile('operator.html');
});

io.on('connection', function(socket){
	console.log('a user connected');




	// Visitor Functions
	socket.on('visitor-connected', function(nickname){
		socket.username = nickname;
		console.log('a visitor connected with socket id:' + socket.id + ' and socket username = '+socket.username);
		clients.push({
			socketID: socket.id,
			socketUsername: socket.username
		});    
		io.emit('visitor-connected', {
			ID: socket.id,
			Nickname: socket.username,
			count: clients.length,
			operator: operator
		});
		for(var i = clients.length - 1; i >= 0; i--) {
			var clientID = clients[i].socketID;
			console.log('client position is '+i);
			io.sockets.connected[clientID].emit('visitor-queue-update', {
				ID: clientID,
				position: i
			});
		};			
	});

	socket.on('visitor-active', function(payload){
		console.log('Now speaking to socket.id ' + socket.id)
		io.sockets.connected[payload.username].emit('visitor-active');
	});


	socket.on('message-to-operator', function(payload){
		console.log("message-to-operator " + payload);
		if (io.sockets.connected[operator]) {
		    io.sockets.connected[socket.id].emit('message-to-operator', payload);
		    io.sockets.connected[operator].emit('message-to-operator', payload);
		} else {
			console.log("Operator is not connected"); 
		};
	});




	// Operator Functions
	socket.on('operator-connected',function(){
		console.log('an operator connected with socket id:' + socket.id);
		operator = socket.id;
	});
	socket.on('message-to-visitor', function(payload){
		console.log("Sending: " + payload.message + " to " + payload.username);
		if (io.sockets.connected[payload.username]) {
			io.sockets.connected[operator].emit('message-to-visitor', payload.message);
		    io.sockets.connected[payload.username].emit('message-to-visitor', payload.message);
		} else {
			console.log("User does not exist: " + payload.username); 
		};
	});


	socket.on('disconnect', function(){
		console.log('socket disconnected: ' + socket.id);
		for(var i = clients.length - 1; i >= 0; i--) {
			if(clients[i].socketID === socket.id) {
				clients.splice(i, 1);
				break;
			}
		};
		io.emit('disconnect', {
			ID: socket.id,
			count: clients.length,
			array: clients
		});		
		for(var i = clients.length - 1; i >= 0; i--) {
			var clientID = clients[i].socketID;
			console.log('client position is '+i);
			io.sockets.connected[clientID].emit('visitor-queue-update', {
				ID: clientID,
				position: i
			});
		};	
	});

});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

