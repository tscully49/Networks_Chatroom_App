var socket;
var loggedIn = false;

$(document).ready(function() {
  var calculatedHeight = parseInt($('body').height()) - parseInt($('#2').outerHeight());
  var socket = io();

  $('.form-inline').css('width', $(document).find('.container').css('width'));
  $('#msgs, #people').css('height', calculatedHeight - $('#div-title').outerHeight(true) - 3);
  $('#chat').hide();

  socket.on("show", function(text) {
    console.log(text);
  });

  $("form").submit(function(event){
    event.preventDefault();
  });

  $("#lgn").keypress(function(e){
    if(e.which == 13) {
      var msg = $("#lgn").val();
      if (msg.trim()) {
        socket.emit("join", msg);
        $("#lgn").val("");
      }
    }
  });

  $("#login").click(function(){
    var msg = $("#lgn").val();
    if (msg.trim()) {
      socket.emit("join", msg);
      $("#lgn").val("");
    }
  });

  socket.on("loginError", function(message) {
    console.log(message);
  });

  socket.on("logOn", function(messages) {
    $('#join').hide();
    $('#chat').show();

    jQuery.each(messages, function(i, message) {
      if (message.type === "message") {
        $("#msgs").append($('<li class="message-list">').html("<div class='no-profile-image'></div>" + " <div class='message-text'>" + message.message + "</div>"));
      } else {
        $("#msgs").append($('<li class="updated-person">').html(message.name + message.message));
      }
    });
    $("#msgs").scrollTop($('#msgs')[0].scrollHeight);

    ready = true;
  });


  $("#send").click(function(){
    var msg = $("#msg").val();
    if (msg.trim()) {
      socket.emit("send", msg);
      $("#msg").val("");
    }
  });

  $("#msg").keypress(function(e){
    if(e.which == 13) {
      var msg = $("#msg").val();
      if (msg.trim()) {
        socket.emit("send", msg);
        $("#msg").val("");
      }
    }
  });

  socket.on("update", function(msg) {
    if(ready) {
      $("#msgs").append($('<li>').text(msg).addClass("updated-person"));
      $("#msgs").scrollTop($('#msgs')[0].scrollHeight);
    }
  });

  socket.on("update-people", function(people){
    if(ready) {
      $("#people").empty();
      $.each(people, function(clientid, person) {
        $('#people').append($('<li class=person-object>').append($('<h5 class="people-in-room">').text(person)));
      });
    }
  });

  socket.on("chat", function(person, msg){
    if(ready) {
      $("#msgs").append($('<li class="message-list">').html(" <div class='message-text'>" + person + ": " + msg + "</div>"));
      $("#msgs").scrollTop($('#msgs')[0].scrollHeight);
    }
  });

  socket.on("disconnect", function(){
    $("#msgs").append("The server is not available");
    $("#msg").attr("disabled", "disabled");
    $("#send").attr("disabled", "disabled");
  });
});
