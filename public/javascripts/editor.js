//Patrick Vice
// editor.js
// client-side code for adventure demo, editor part
$(function () {
	$("#menu").on('change', function (){ //change will not fire
		var opt = $("#menu option:selected").text();
		$(window).load(getRoom (opt));
	});

	$("#quit").on('click',function(){
		var $form = $("form");
		$form.attr("action", "/quit");
		$form.submit();
	});

	$("#loadRoom").on('click', function(){
		console.log("here")
		$(window).load(getRoom( $('#roomName').val() ) );
	});

});

var getRoom = function (room){
	$.post("/getContents",{roomName: room}, function(room) {
		$('#roomName').replaceWith('<textarea id="roomName" name="roomName">'+room.title
																+'</textarea>');
		if (room.description){
			$('#description').replaceWith('<textarea id="description" name="description">' +
																	room.description + '</textarea>');
		}else{
			$('#description').replaceWith('<textarea id="description" name="description">'+
																		'</textarea>');
		}
		if (room.activity) {
			$('#activity').replaceWith('<textarea id="activity" name="activity">' +
																	room.activity + '</textarea>');
		} else {
			$('#activity').replaceWith('<textarea id="activity" name="activity"></textarea>');
		}

		$('#exits').replaceWith('<textarea id="exits" name="exits">');
		var c=0;
		room.roomExits.forEach(function(theExit) {
			if (room.roomExits.length-1 !== c){
				$('#exits').append (theExit +", ");
			}else{
				$('#exits').append (theExit);
			}
			c++;
		});
		$('#exits').append('</textarea>');
	});
};

var loadRooms = function(){
	$.getJSON("/loadDropDown", function(roomList) {
		var c = 0;
		var s = $('<select id="menu" name="roomNames" />');
		roomList.forEach(function(room) {
				c++;
		    $('<option />', {text: room}).appendTo(s);
		});
		$('#menu').replaceWith(s);
		var opt = $("#menu option:selected").text();
		console.log(opt);
		$(window).load(getRoom (opt));
	});
};

$(window).load(loadRooms());
