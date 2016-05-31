var main = {
	opSocket: null,
	operatorConnected: false,
	visitorCount: 0,
	initialize: function () {
		main.refreshListeners();
	},
	refreshListeners: function() {
		main.removeListeners();
		main.addListeners();
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
		}		
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
		visitor.Socket.on('message-to-visitor', function(msg){
			main.messages(msg, 'them');		
		});
		visitor.Socket.on('message-to-operator', function(msg){
			main.messages(msg, 'me');
		});	
		visitor.Socket.on('visitor-connected', function(data){
			visitor.visitorWelcome(data);
		});			
		visitor.Socket.on('visitor-active', function(data){
			visitor.activateCurrentVisitor(data);
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
			$('#sendMessage').removeClass('hidden');
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
		visitor.visitorStatusUpdate(main.visitorCount);
	},
	visitorQueueUpdate: function(data){
		visitor.visitorStatusUpdate(data.position);
	},
	visitorStatusUpdate: function(number){
		console.log('number is '+number);
		var operatorMessage = '';
		//Test for operator
		if(main.operatorConnected == true){
			operatorMessage = 'An operator is connected. ';
		};
		if(number == 1){
			$('.visitor-status').text(operatorMessage + 'How can we help you?');
		};
		if(number == 2){
			$('.visitor-status').text(operatorMessage + 'You are currently next in line');
		};
		if(number > 2){
			$('.visitor-status').text(operatorMessage + 'You are currently number '+ (main.visitorCount - 1) +' in line');
		};
	},
	activateCurrentVisitor: function(data){
		visitor.activeVisitor = true;
	},
	messageToOperator: function() {
		visitor.Socket.emit('message-to-operator', $('#messageField').val());
		$('#messageField').val('');
		return false;		
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
		// $('#visitors li').on('click', operator.visitorSelect);
		$('#editVisitors').on('submit', operator.visitorNickname);
		$('#sendMessage').on('submit', operator.messageToVisitor);
	},
	removeListeners: function() {
		// $('#visitors li').off('click', operator.visitorSelect);
		$('#editVisitors').off('submit', operator.visitorNickname);
		$('#sendMessage').off('submit', operator.messageToVisitor);
	},	
	refreshListeners: function() {
		operator.removeListeners();
		operator.addListeners();
	},	
	visitorConnect: function(visitorData) {
		$('#visitors').append($('<li data-id="'+visitorData.ID+'" data-nickname="'+visitorData.Nickname+'">').text(visitorData.Nickname));
		operator.refreshListeners();
		operator.updateActiveVisitor();
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
	},
	visitorSelect: function() {
		$('#visitors li').removeClass('active');
		$(this).addClass('active');
		operator.activeVisitor = $(this).data('id');
	},
	visitorNickname: function(e){
		$('#visitors li.active').text($('#nickname').val());
		$('#nickname').val('');
		return false;
	},
	messageToVisitor: function(){
		var message = $('#messageField').val();
		operator.Socket.emit('message-to-visitor', {
			"username": operator.activeVisitor,
			"message": message
		});
		$('#messageField').val('');
		return false;
	}
}



$(document).ready(function(){
	// main.initialize();
});