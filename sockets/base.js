var MAXCLIENTS = 3;
var numClients = 0;
var people = {};
var knownAccounts =	{"Tom": {"Password": "Tom11"}, "David": {"Password": "David22"}, "Beth": {"Password": "Beth33"}, "John": {"Password": "John44"}, "tps9tb": {"Password": "test"}};
var messages = [];


module.exports = function (io) {

	io.on('connection', function (client) {

		client.emit("show", knownAccounts);

  	client.on('join', function(profile) {
  		var loginString = profile.split(" ");
  		var loggedIn = false;

  		for (var person in people) {
  			if (people[person] === loginString[1]) {
  				loggedIn = true;
  			}
  		}

  		if (loginString.length != 3) {
  			client.emit("loginError", "Incorrect login format, please use ex. 'login (username) (password)'");
  			return;
  		} else if (loginString[0] != "login") {
  			client.emit("loginError", "Denied!  Please login first");
  			return;
  		} else if (knownAccounts[loginString[1]] == undefined) {
  			client.emit("loginError", "Username does not exists");
  			return;
  		} else if (knownAccounts[loginString[1]].Password != loginString[2]) {
  			client.emit("loginError", "Password is incorrect");
  			return;
  		} else if (numClients >= 3) {
  			client.emit("loginError", "Too many people are logged in, please wait for someone to leave");
  			return;
  		} else if (knownAccounts[loginString[1]].Password == loginString[2] && loggedIn === false) {
  			numClients = numClients + 1;
  			console.log(numClients);
  			console.log(loginString[1] + " logged in.");
  			var cachedMessages = {"name": loginString[1], "message": " has joined the server.", "type": "connection"};
      	messages.push(cachedMessages);

  			people[client.id] = loginString[1];
  			client.broadcast.emit('update', loginString[1] + " has joined the server.");
  			client.emit("logOn", messages);
  		} else {
  			client.emit("loginError", "This user is already logged in");
  			return;
  		}

  		io.emit('update-people', people);

  		client.on("send", function(message){
  			var msg = message.split(" ");
  			if (msg.length === 1) {
		  		if (msg[0] === "who") {
	  				var peopleArray = "";
	  				for(var key in people) {
	  					peopleArray = peopleArray + people[key] + ", ";
	  				}
	  				console.log(people);
	  				peopleArray = peopleArray.slice(0, -2);
	        	client.emit("who", peopleArray);
	    		} else if (msg[0] === "logout") {
	    			client.emit("disconnected");
	    		} else {
			    	client.emit("loginError", "Invalid command input.  Please try again");
	    		}
		    } else if (msg.length >= 3) {
		    	if (msg[0] === "send") {
		    		var thisMessage = "";

		    		for (var i = 2; i < msg.length; i++) {
		    			thisMessage = thisMessage + msg[i] + " ";
		    		}

		    		if (msg[1] === "all") {
		    			var cachedMessages = {"name": people[client.id], "message": thisMessage, "type": "message"};
		    			messages.push(cachedMessages);
		    			console.log(people[client.id] + ": " + thisMessage);
		    			io.emit("chat", people[client.id], thisMessage);
		    		} else {
		    			var socketId = in_array(people, msg[1]);
		    			if (socketId != false) {
		    				var cachedMessages = {"name": people[client.id] + "(to " + msg[1] + "): " , "message": thisMessage, "type": "message"};
		    				messages.push(cachedMessages);
		    				console.log(people[client.id] + "(to " + msg[1] + "): " + thisMessage);
			    			client.emit("chat", people[client.id] + "(to " + msg[1] + ")", thisMessage);
			    			io.sockets.connected[socketId].emit("privateChat", people[client.id], thisMessage);
			    		} else {
			    			client.emit("loginError", "The user you want to talk to does not exist in this room");
			    		}
			    	}
		    	} else {
			    	client.emit("loginError", "Invalid command input.  Please try again");
		    	}
		    } else {
		    	client.emit("loginError", "Invalid command input.  Please try again");
		    }
    	});
		
			client.on('disconnect', function(){
				numClients = numClients - 1;
			});
  	});
  	
  	client.on('disconnect', function(){
	    if (typeof people[client.id] != 'undefined') {    	
	    	io.emit('update', people[client.id] + " has left the server.");
	    	var cachedMessages = {"name": people[client.id], "message": " has left the server.", "type": "connection"};
      		console.log(cachedMessages.name + cachedMessages.message);
      		messages.push(cachedMessages);
	    }
	    delete people[client.id];
	    io.emit('update-people', people);
		});	
	});

	function in_array(array, name) {
	    for(var i in array) {
	      if (array[i] === name) {
	       	return i;
	    	}
	    }
	    return false;
	}
};
