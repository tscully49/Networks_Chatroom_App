var MAXCLIENTS = 3;
var numClients = 0;
var people = {};
var knownAccounts =	{"Tom": {"Password": "Tom11"}, "David": {"Password": "David22"}, "Beth": {"Password": "Beth33"}, "John": {"Password": "John44"}, "tps9tb": {"Password": "test"}};
var messages = [];


module.exports = function (io) {

	// Event listener for when a client connects to the server
	io.on('connection', function (client) {

		// When a client attempts to connect to the chat room
  	client.on('join', function(profile) {
  		// Take their request and break it up into strings
  		var loginString = profile.split(" ");
  		var loggedIn = false;

  		// Check to make sure this user is not already logged in
  		for (var person in people) {
  			if (people[person] === loginString[1]) {
  				loggedIn = true;
  			}
  		}

  		// Error check the login, check for the correct length of request
  		if (loginString.length != 3) {
  			client.emit("loginError", "Incorrect login format, please use ex. 'login (username) (password)'");
  			return;
  		} else if (loginString[0] != "login") { // make sure the first word in the requets is "login"
  			client.emit("loginError", "Denied!  Please login first");
  			return;
  		} else if (knownAccounts[loginString[1]] == undefined) { // make sure the name is under the list of known users
  			client.emit("loginError", "Username does not exists");
  			return;
  		} else if (knownAccounts[loginString[1]].Password != loginString[2]) { // make sure the password is correct
  			client.emit("loginError", "Password is incorrect");
  			return;
  		} else if (numClients >= 3) {	// make sure that too many people aren't logged in 
  			client.emit("loginError", "Too many people are logged in, please wait for someone to leave");
  			return;
  		} else if (knownAccounts[loginString[1]].Password == loginString[2] && loggedIn === false) { // if the user is not already logged in and the password is correct
  			numClients = numClients + 1;
  			console.log(loginString[1] + " logged in.");
  			var cachedMessages = {"name": loginString[1], "message": " has joined the server.", "type": "connection"};
      	messages.push(cachedMessages);  // cache the message 

  			people[client.id] = loginString[1]; // set the username to the socket.id
  			client.broadcast.emit('update', loginString[1] + " has joined the server."); // log to the server what happened
  			client.emit("logOn", messages);
  		} else {
  			client.emit("loginError", "This user is already logged in"); // the user is already logged in 
  			return;
  		}

  		io.emit('update-people', people); // add the person to the list of people in the room 

  		client.on("send", function(message){ // when a user sends a request after being logged in 
  			var msg = message.split(" "); // split up the message into seperate strings 
  			if (msg.length === 1) { // if there is only one string, check to make sure it's either "who" or "logout" otherwise, error
		  		if (msg[0] === "who") {
	  				var peopleArray = "";
	  				for(var key in people) {
	  					peopleArray = peopleArray + people[key] + ", ";
	  				}
	  				peopleArray = peopleArray.slice(0, -2);
	        	client.emit("who", peopleArray);
	    		} else if (msg[0] === "logout") {
	    			client.emit("disconnected");  // disconnect from the server
	    		} else {
			    	client.emit("loginError", "Invalid command input.  Please try again");
	    		}
		    } else if (msg.length >= 3) { // If the request has three or more strings in it, make sure they are known commands, otherwise error out and don't do anything else 
		    	if (msg[0] === "send") {
		    		var thisMessage = "";

		    		for (var i = 2; i < msg.length; i++) { // the first two strings tell you "send" and who to send to, then take the rest of the strings as the message body 
		    			thisMessage = thisMessage + msg[i] + " ";
		    		}

		    		if (msg[1] === "all") { // emits to all clients 
		    			var cachedMessages = {"name": people[client.id], "message": thisMessage, "type": "message"};
		    			messages.push(cachedMessages);
		    			console.log(people[client.id] + ": " + thisMessage);
		    			io.emit("chat", people[client.id], thisMessage);
		    		} else { // ELSE emits to only the person that was specified
		    			var socketId = in_array(people, msg[1]);
		    			if (socketId != false) { // checks to make sure that the user specified exists before it sends the message 
		    				var cachedMessages = {"name": people[client.id] + "(to " + msg[1] + "): " , "message": thisMessage, "type": "message"};
		    				//messages.push(cachedMessages);  // cache the message 
		    				console.log(people[client.id] + "(to " + msg[1] + "): " + thisMessage);  // log the message to the server 
			    			client.emit("chat", people[client.id] + "(to " + msg[1] + ")", thisMessage);
			    			io.sockets.connected[socketId].emit("privateChat", people[client.id], thisMessage); // send the message to the client 
			    		} else {
			    			client.emit("loginError", "The user you want to talk to does not exist in this room");  // different errors 
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
				numClients = numClients - 1; // if the user is joined and disconnects, reduce the number of clients connected to the server
			});
  	});
  	
  	client.on('disconnect', function(){ // if the user disconnects from the server
	    if (typeof people[client.id] != 'undefined') {    	
	    	io.emit('update', people[client.id] + " has left the server."); 
	    	var cachedMessages = {"name": people[client.id], "message": " has left the server.", "type": "connection"};
      		console.log(cachedMessages.name + cachedMessages.message);
      		messages.push(cachedMessages); // cache the message 
	    }
	    delete people[client.id];
	    io.emit('update-people', people); // update the people in the room 
		});	
	});

	function in_array(array, name) { // check if the value is in the array 
	    for(var i in array) {
	      if (array[i] === name) {
	       	return i;
	    	}
	    }
	    return false;
	}
};
