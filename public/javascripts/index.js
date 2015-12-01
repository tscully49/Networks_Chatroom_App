var socket;
var loggedIn = false;
var ready = false;

$(document).ready(function() {
  var calculatedHeight = parseInt($('body').height()) - parseInt($('#2').outerHeight());
  var socket = io(); // connects the socket to the server 

  $('.form-inline').css('width', $(document).find('.container').css('width'));
  $('#msgs, #people').css('height', calculatedHeight - $('#div-title').outerHeight(true) - 3);
  $('#chat').hide(); // hide the chat until the user is logged in 

  $("form").submit(function(event){
    event.preventDefault(); // prevents the page from refreshing when you submit a request
  });

  $("#lgn").keypress(function(e){ // when the user hits the enter key when typing a request 
    if(e.which == 13) { // the key for enter 
      var msg = $("#lgn").val();
      if (msg.trim()) { // trim the message of trailing whitespaces 
        socket.emit("join", msg);
        $("#lgn").val("");
      }
    }
  });

  $("#login").click(function(){ // when someone clicks the login button 
    var msg = $("#lgn").val();
    if (msg.trim()) { // trim trailing whitespaces
      socket.emit("join", msg);
      $("#lgn").val("");
    }
  });

  socket.on("loginError", function(message) { // when there is a login error, output the message 
    $('#msgs').append($('<li class="message-list">').html("<div class='error-text'>" + message + "</div>"))
    console.log(message);
  });

  socket.on("logOn", function(messages) { // when the user successfully logs in, hide the login form and show the chats 
    $('#join').hide();
    $('#chat').show();

    jQuery.each(messages, function(i, message) {  // load all public messages that have already been posted to the user's screen
      if (message.type === "message") {
        $("#msgs").append($('<li class="message-list">').html("<div class='message-text'>" + message.name + ": " + message.message + "</div>"));
      } else {
        $("#msgs").append($('<li class="updated-person">').html(message.name + message.message)); 
      }
    });
    $("#msgs").scrollTop($('#msgs')[0].scrollHeight); // scroll to the end of the list so you see the most recent message 

    ready = true; // set variable
  });


  $("#send").click(function(){ // when a user clicks the send button 
    var msg = $("#msg").val();
    if (msg.trim()) {
      socket.emit("send", msg);
      $("#msg").val("");
    }
  });

  $("#msg").keypress(function(e){ // when a user hits the enter key when typing in the message box 
    if(e.which == 13) {
      var msg = $("#msg").val();
      if (msg.trim()) { // trim message and send to the server 
        socket.emit("send", msg);
        $("#msg").val("");
      }
    }
  });

  socket.on("update", function(msg) {
    if(ready) { // when someone leaves or enters the room and the user is logged in 
      $("#msgs").append($('<li>').text(msg).addClass("updated-person"));
      $("#msgs").scrollTop($('#msgs')[0].scrollHeight);
    }
  });

  socket.on("update-people", function(people){ // when someone enters or leaves the room, only runs if the user is logged in 
    if(ready) {
      $("#people").empty();
      $.each(people, function(clientid, person) {
        $('#people').append($('<li class=person-object>').append($('<h5 class="people-in-room">').text(person)));
      });
    }
  });

  socket.on("chat", function(person, msg){ // when the request is successful, the user will append it to the list 
    if(ready) {
      $("#msgs").append($('<li class="message-list">').html(" <div class='message-text'>" + person + ": " + msg + "</div>"));
      $("#msgs").scrollTop($('#msgs')[0].scrollHeight);
    }
  });

  socket.on("privateChat", function(person, msg){ // when the request is successful and the message is private, append the message 
    if(ready) {
      $("#msgs").append($('<li class="message-list">').html(" <div class='message-text'>" + person + " (to you): " + msg + "</div>"));
      $("#msgs").scrollTop($('#msgs')[0].scrollHeight);
    }
  });

  socket.on("who", function(msg){ // who all is in the room, append to the list of messages 
    if(ready) {
      $("#msgs").append($('<li class="message-list">').html(" <div class='message-text'>" + msg + "</div>"));
      $("#msgs").scrollTop($('#msgs')[0].scrollHeight);
    }
  });

  socket.on("disconnect", function(){ // when the server disconnects 
    $("#msgs").append("The server is not available.  Please refresh the page");
    $("#msg").attr("disabled", "disabled");
    $("#lgn").attr("disabled", "disabled");
    $("#send").attr("disabled", "disabled");
  });

  socket.on("disconnected", function() { // when the user chooses to logout and the server approves 
    socket.disconnect();
    $("#msg").attr("disabled", "disabled");
    $("#lgn").attr("disabled", "disabled");
    $("#send").attr("disabled", "disabled");
    ready = false;
    $('#people').empty();
    $('#msgs').empty();
    $("#msgs").append("You have disconnected from the server.  Please refresh the page to reconnect");
  });
});
