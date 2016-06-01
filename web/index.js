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


// Visitor Functions
var visitorPosition = function(socket) {
	console.log('operator status is '+operator);
	for(var i = clients.length - 1; i >= 0; i--) {
		var clientID = clients[i].ID;
		console.log('client position is '+i);
		io.sockets.connected[clientID].emit('visitor-queue-update', {
			ID: clientID,
			position: i
		});
	};	
}
var newVisitorConnected = function(socket, nickname){
	socket.username = nickname;
	console.log('a visitor connected with socket id:' + socket.id + ' and socket username = '+socket.username);
	clients.push({
		ID: socket.id,
		Nickname: socket.username
	});    
	io.emit('visitor-connected', {
		ID: socket.id,
		Nickname: socket.username,
		count: clients.length,
		operator: operator
	});
	visitorPosition(socket);
}
var youWereDisconnected = function(socket, data){
	io.sockets.connected[socket.id].emit('you-were-disconnected', data);
}

// Operator Functions
var messageOperator = function(socket, payload){
	console.log("message-to-operator " + payload);
	if (io.sockets.connected[operator]) {
		io.sockets.connected[socket.id].emit('message-to-operator', payload);
		io.sockets.connected[operator].emit('message-to-operator', payload);
	} else {
		console.log("Operator is not connected"); 
	};
}
var operatorConnected = function(socket) {
	console.log('an operator connected with socket id:' + socket.id);
	operator = socket.id;	
	io.emit('operator-connected', clients);
	visitorPosition(socket);
}
var operatorDisconnected = function(socket) {
	console.log('an operator disconnected with socket id:' + socket.id);
	operator = null;
	io.emit('operator-disconnected');
}
var messageVisitor = function(socket, payload){
	console.log("Sending: " + payload.message + " to " + payload.username);
	if (io.sockets.connected[payload.username]) {
		io.sockets.connected[operator].emit('message-to-visitor', payload.message);
		io.sockets.connected[payload.username].emit('message-to-visitor', payload.message);
	} else {
		console.log("User does not exist: " + payload.username); 
	};	
}
var disconnectVisitor = function(socket, data){
	console.log("Disconnecting: " + data.ID);
	removeSocketFromClients(data.ID);
	io.emit('you-were-disconnected', data);
	io.emit('disconnect', {
		ID: data.ID,
		count: clients.length,
		array: clients
	});		
	visitorPosition(socket);	
}
var socketDisconnected = function(socket){
	console.log('socket disconnected: ' + socket.id);
	removeSocketFromClients(socket.id);	
	io.emit('disconnect', {
		ID: socket.id,
		count: clients.length,
		array: clients
	});		
	if(socket.id == operator){
		console.log('the operator disconnected');
		operator = null;
		io.emit('operator-disconnected');
	};
	visitorPosition(socket);

}
var removeSocketFromClients = function(userID){
	for(var i = clients.length - 1; i >= 0; i--) {
		if(clients[i].ID === userID) {
			clients.splice(i, 1);
			break;
		}
	};	
}



io.on('connection', function(socket){
	console.log('a user connected');
	// Visitor Functions
	socket.on('visitor-connected', function(nickname){
		newVisitorConnected(socket, nickname);
	});
	socket.on('message-to-operator', function(payload){
		messageOperator(socket, payload);
	});
	socket.on('you-were-disconnected', function(data){
		youWereDisconnected(socket, data);
	});

	// Operator Functions
	socket.on('operator-connected',function(){
		operatorConnected(socket, clients);
	});
	socket.on('operator-disconnected',function(){
		operatorDisconnected(socket);
	});	
	socket.on('message-to-visitor', function(payload){
		messageVisitor(socket, payload)
	});
	socket.on('disconnect-visitor', function(data){
		disconnectVisitor(socket, data);
	});
	socket.on('disconnect', function(){
		socketDisconnected(socket);
	});

});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

