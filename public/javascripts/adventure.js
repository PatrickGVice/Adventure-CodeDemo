// Patrick Vice
// adventure.js
// client-side code for adventure AJAX demo

(function() {  // setup local scope

    var getRoom = function() {
	    $.getJSON("/getContents", function(room) {
  	    var exits;
  	    $('#title').replaceWith('<h1 id="title">'+room.title+'</h1>');

  	    $('#description').replaceWith('<p id="description">' +
  					      room.description + '</p>');

  	    if (room.activity) {
  		      $('#activity').replaceWith('<p id="activity">' +
  					       room.activity + '</p>');
  	    } else {
          $('#activity').replaceWith('<p id="activity"></p>');
  	    }

  	    $('.exits').remove();
  	    room.roomExits.forEach(function(theExit) {
  		       $('#exitList').append(
  		           '<button type="button" id="' + theExit +
  			         '" class="btn btn-default exits">'
  			            + theExit + '</button>');
  		  $('#'+theExit).on('click', function() {
  		    $.post("/doAction", {action: "move",
  					 room: theExit}, getRoom);
  		  });
  	   });

       var c = 0;
       $('#players').replaceWith('<p id="players">')
       room.players.forEach(function(player) {
         console.log(c+" "+room.players.length);
         if(c !== room.players.length-1){
           $('#players').append(player.playername+", ");
         }else{
           $('#players').append(player.playername);
         }
         c++;
       });

  	});
  }

  $(window).load(getRoom());

})();
