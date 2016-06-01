var main = {
	opSocket: null,
	operatorConnected: false,
	visitorCount: 0,
	initialize: function () {
	},
	testForValidMessage: function(text){
		if(text != '' && text != undefined){
			return true;
		} else {
			return false;
		}
	},
	messages: function(message, who){
		if(main.testForValidMessage(message) == true){
			$('#messages').append($('<li class="'+who+'">').text(message));
			main.scrollFix('#messages');
		}		
	},
	scrollFix: function(element) {
		$(element).scrollTop(($(element).height()*2));
	}
}

//---------------------------------------------------------------------------------------------
// Visitor Side Scripts
//---------------------------------------------------------------------------------------------
var visitor = {
	Socket: null,
	activeVisitor: false,
	init: function() {
		visitor.Socket = io();
		visitor.Socket.on('connect', function(){
		});
		visitor.Socket.on('operator-connected', function(data){
			main.operatorConnected = true;
			visitor.visitorQueueUpdate(data);
		});	
		visitor.Socket.on('operator-disconnected', function(){
			main.operatorConnected = false;
		});				
		visitor.Socket.on('message-to-visitor', function(msg){
			main.messages(msg, 'them');		
		});
		visitor.Socket.on('message-to-operator', function(msg){
			main.messages(msg, 'me');
		});	
		visitor.Socket.on('visitor-connected', function(data){
			visitor.visitorWelcome(data);
		});		
		visitor.Socket.on('you-were-disconnected', function(data){
			visitor.visitorDisconnected(data);
		});			
		visitor.Socket.on('visitor-queue-update', function(data){
			visitor.visitorQueueUpdate(data);
		});				
		visitor.refreshListeners();
	},
	addListeners: function() {
		$('#editNickname').on('submit', visitor.setNickname);
		$('#sendMessage').on('submit', visitor.messageToOperator);
	},
	removeListeners: function() {
		$('#editNickname').off('submit', visitor.setNickname);
		$('#sendMessage').off('submit', visitor.messageToOperator);
	},	
	refreshListeners: function() {
		visitor.removeListeners();
		visitor.addListeners();
	},	
	setNickname: function() {
		var nickname = $('#nickname').val().trim();
		if(nickname != ''){
			$('#editNickname').addClass('hidden');
			visitor.Socket.emit('visitor-connected', nickname);
		};
		return false;
	},
	visitorWelcome: function(data) {
		main.visitorCount = data.count;
		$('#messages').empty();
		$('#messages').append($('<li class="visitor-status">'));
		if(data.operator != null){
			main.operatorConnected = true;
		}	
		if($('.modal').length > 0 && $('.modal').hasClass('visible')){
			$('.modal').removeClass('visible');
		};
	},
	testForOperator: function(){

	},
	visitorQueueUpdate: function(data){
		var operatorMessage = '';
		var number = data.position;
		//Test for operator
		if(main.operatorConnected == true){
			operatorMessage = 'An operator is connected. ';
			if(number == 0){
				$('#chat-window--visitor').addClass('chatting');
				$('.visitor-status').text(operatorMessage + 'How can we help you?');
			};
			if(number == 1){
				$('.visitor-status').text(operatorMessage + 'You are currently next in line');
			};
			if(number > 1){
				$('.visitor-status').text(operatorMessage + 'You are currently number '+ (main.visitorCount - 1) +' in line');
			};			
		} else {
			$('.visitor-status').text('There are currently no operators connected');
		};

	},
	messageToOperator: function() {
		visitor.Socket.emit('message-to-operator', $('#messageField').val());
		$('#messageField').val('');
		return false;		
	},
	visitorDisconnected: function(data){
		$('#chat-window--visitor').removeClass('chatting');
		$('#messages').append($('<li class="visitor-status">').text('You have been disconnected, please refresh to reconnect'));
	}

}


//---------------------------------------------------------------------------------------------
// Operator Side Scripts
//---------------------------------------------------------------------------------------------
var operator = {
	Socket: null,
	activeVisitor: null,
	init: function() {
		operator.Socket = io();
		operator.Socket.on('connect', function(){
			main.operatorConnected = true;
			operator.Socket.emit('operator-connected');
		});
		operator.Socket.on('operator-connected', function(clients){
			operator.visitorListPopulate(clients);
		});
		operator.Socket.on('operator-disconnected', function(){
			main.operatorConnected = false;
		});		
		operator.Socket.on('message-to-visitor', function(msg){
			main.messages(msg, 'me');		
		});
		operator.Socket.on('message-to-operator', function(msg){
			main.messages(msg, 'them');
		});		
		operator.Socket.on('visitor-connected', function(data){
			operator.visitorConnect(data);
		});
		operator.Socket.on('disconnect', function(data){
			operator.socketDisconnect(data);
		});		
		operator.refreshListeners();
	},
	addListeners: function() {
		$('#editVisitors').on('submit', operator.visitorNickname);
		$('#sendMessage').on('submit', operator.messageToVisitor);
		$('.visitors-window .window--title').on('click', operator.visitorWindowToggle);
	},
	removeListeners: function() {
		$('#editVisitors').off('submit', operator.visitorNickname);
		$('#sendMessage').off('submit', operator.messageToVisitor);
		$('.visitors-window .window--title').off('click', operator.visitorWindowToggle);
	},	
	refreshListeners: function() {
		operator.removeListeners();
		operator.addListeners();
	},	
	visitorConnect: function(visitorData) {
		$('#visitors').append($('<li data-id="'+visitorData.ID+'" data-nickname="'+visitorData.Nickname+'">').text(visitorData.Nickname));
		main.scrollFix('#visitors');
		operator.refreshListeners();
		operator.updateActiveVisitor();
	},
	visitorListPopulate: function(clients){
		$(clients).each(function(i, e){
			operator.visitorConnect(e);
		});
	},
	socketDisconnect: function(data) {
		$('#visitors li').each(function(i, e){
			if($(e).data('id') == data.ID){
				$(e).remove();
			};
			main.visitorCount = data.count;
		});
		operator.updateActiveVisitor();

	},
	updateActiveVisitor: function() {
		$('#visitors li').removeClass('active');
		$('#visitors li:first-child').addClass('active');
		operator.activeVisitor = $('#visitors li.active').data('id');
		var activeVisitorNickname = $('#visitors li.active').data('nickname');
		$('#messages').empty();
		if(activeVisitorNickname != undefined){
			$('#messages').append($('<li class="operator-status">').text('You are now connected to '+activeVisitorNickname));
		}
	},
	visitorSelect: function() {
		$('#visitors li').removeClass('active');
		$(this).addClass('active');
		operator.activeVisitor = $(this).data('id');
	},
	messageToVisitor: function(){
		var message = $('#messageField').val();
		if(message != '!next'){
			operator.Socket.emit('message-to-visitor', {
				"username": operator.activeVisitor,
				"message": message
			});
			$('#messageField').val('');			
		};
		if(message == '!next'){
			operator.Socket.emit('disconnect-visitor', {
				"ID": operator.activeVisitor
			});
			$('#messageField').val('');	
		}
		return false;
	},
	visitorWindowToggle: function() {
		var el = $(this),
		elTarget = $(el).parent('.visitors-window');
		if($(elTarget).length > 0){
			$(elTarget).toggleClass('open');
		};
	}
}



$(document).ready(function(){
	// main.initialize();
});