var MAXCLIENTS = 3;

module.exports = function (io) {
	var people = {};
	var knownAccounts =	{"Tom": {"Password": "Tom11"}, "David": {"Password": "David22"}, "Beth": {"Password": "Beth33"}, "John": {"Password": "John44"}, "tps9tb": {"Password": "test"}};
	var messages = [];

	io.on('connection', function (client) {

		client.emit("show", knownAccounts);

	  	client.on('join', function(profile) {
	  		var loginString = profile.split(" ");
	  		if (loginString.length != 3) {
	  			client.emit("loginError", "Incorrect login format, please use ex. 'login (username) (password)'");
	  		} else if (loginString[0] != "login") {
	  			client.emit("loginError", "Denied!  Please login first");
	  		} else if (knownAccounts[loginString[1]] == undefined) {
	  			client.emit("loginError", "Username does not exists");
	  		} else if (knownAccounts[loginString[1]].Password != loginString[2]) {
	  			client.emit("loginError", "Password is incorrect");
	  		} else if (knownAccounts[loginString[1]].Password == loginString[2]) {
	  			console.log("Logged in!!!");
	  			var cachedMessages = {"name": loginString[1], "message": " has joined the server."};
        		messages.push(cachedMessages);

	  			people[client.id] = loginString[1];
	  			client.emit("logOn", messages);
	  		}

	  		client.broadcast.emit('update', profile.name + " has joined the server.");
	  		io.emit('update-people', people);

	  		client.on("send", function(msg){
		  		if (msg === "read") {
		        	io.emit("chat", people[client.id], messages.length);
	    		} else {
			  		var cachedMessages = {"name": people[client.id].name, "message": msg, "type": "message"};
		        	io.emit("chat", people[client.id], msg, people);
		        	console.log(people[client.id].name+":  "+msg);
		        	messages.push(cachedMessages);
		        	console.log(people);
		        	console.log(io.engine.clientsCount);
		        }
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

};
