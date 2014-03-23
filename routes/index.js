var bcrypt = require("bcrypt");
var mc = require('mongodb').MongoClient;
var playersCollection;
var roomsCollection;
var sessionsCollection;

var defaultRoom = {   name: "theVoid",
		      						title: "The Void",
		      						description: "You are in the Void.  How did you get here?  There are no exits.",
		      						roomExits: ['theVoid']
		  						};
var errorRoom = { name:  "error",
									title: "Error",
									description: "Sorry, No Room Found by This Name..."
								};

var connectToDBs = function(callback) {
    mc.connect('mongodb://localhost/adventure-demo', function(err, db) {
	if (err) {
	    throw err;
	}

	playersCollection = db.collection('players');
	roomsCollection = db.collection('rooms');
	sessionsCollection = db.collection('sessions');

	if (callback) {
	    callback();
	}
    });
};

var savePlayer = function(player) {
    playersCollection.update({"playername": player.playername},
			player, function(err, count) {
				   		 if (err) {
				     	 	console.log("Couldn't save player state");
				 	   	}
			     	 });
};


var index = function(req, res) {
    if (req.session.player) {
        res.redirect("/game");
    } else {
			res.render('index', { title: 'Adventure Demo', error: req.query.error });
    }
};

var register = function(req, res) {
    var playername = req.body.playeredname;
    var password = req.body.password;

    var addPlayer = function(err, players) {
	if(players.length!=0){
	    res.redirect("/?error=name already exists");
	    return;
	}

	//generate a salt, with 10 rounds (2^10 iterations)
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(password, salt, function(err, hash) {
      		var newPlayer = {
      		    playername: playername,
      		    password: hash,
		    			room: "bridge",
							online: "off"
      		};

      		playersCollection.insert(newPlayer, function(err, newPlayers){
		    if (err) {
			throw err;
		    } else {
      			res.render('registered',
				   { playername: newPlayers[0].playername });
		    }
      		});
	    });
	});
};

    playersCollection.find({playername: playername}).toArray(addPlayer);
}

var checkPass = function(req, res, name, password, sessionName, successURL) {
  playersCollection.findOne({playername: name}, function(err, name){
			if (err || !name){
	    	req.session.destroy(function(err) {
					res.redirect("/?error=invalid name or password");
	    	});
	    	return;
			}

			bcrypt.compare(password, name.password, function(err, authenticated){
	    	if (authenticated) {
					req.session[sessionName] = name;
					delete req.session[sessionName]._id;
					res.redirect(successURL);
	    	} else {
					req.session.destroy(function(err) {
		    		res.redirect("/?error=invalid name or password");
					});
	    	}
			});
    });
}

var start = function(req, res){
    var playername = req.body.playeredname;
    var password = req.body.password;
		console.log(playername);
		playersCollection.update(
					{playername: playername}, { $set: {online: "on"} }, {upsert: false},
							function(err){
								if (err){
									throw err;
								}
							});
    checkPass(req, res, playername, password, "player", "/game");
}

var quit = function(req, res){

  req.session.destroy(function(err){
		if (err) {
      console.log("Error: %s", err);
		}
		res.redirect("/");
  });
}

var quitG = function (req, res){
	console.log(req.session.player);
	playersCollection.update(
				{playername: req.session.player.playername}, { $set: {online: "off"} }, {upsert: false},
						function(err){
							if (err){
								throw err;
							}
				}
	);

	playersCollection.find().toArray(function(err, players){
			console.log(players);
	});

	req.session.destroy(function(err){
		if (err) {
			console.log("Error: %s", err);
		}
		res.redirect("/");
	});
}

var game = function(req, res) {
    if (req.session.player) {
	res.render("room.jade", {title: "AJAX Adventure Demo"});
    } else {
        res.redirect("/");
    }
}

var startEditor = function(req, res) {
    var editorName = req.body.playeredname;
    var password = req.body.password;

    checkPass(req, res, editorName, password, "editorName", "/editor");
};

var editor = function(req, res) {
    if (req.session.editorName) {
	res.render("editor.jade", {editorName:
				   req.session.editorName.playername});
    } else {
        res.redirect("/");
    }
};

var doAction = function(req, res) {
		var action = req.body.action;
		var room = req.body.room;

		if (!req.session.player) {
	res.send("Error: NotLoggedIn");
	return;
		}

		if (action === "move") {
	req.session.player.room = room;
	savePlayer(req.session.player);
	res.send("Success");
		} else {
	res.send("Error: InvalidAction");
		}
}

var getContents = function(req, res) {

	if (!req.session.player && !req.body.roomName) {
		res.send("Error: NotLoggedIn");
		return;
	}

	if (!req.body.roomName){
			roomsCollection.findOne(
				{name: req.session.player.room},
				function(err, room) {
					var players = [];
					playersCollection.find(
						{
							online: "on",
							playername: {$ne: req.session.player.playername},
							room: room.name
						}).toArray(function (err, players){
						if (err){
							throw err;
						}
					room.players = players;
					if (err || !room) {
						room = defaultRoom;
					}
					res.send(room);
				});
			});

	}else{
		var roomName = req.body.roomName.toLowerCase();
		roomsCollection.findOne(
			{name: roomName},
			function(err, room) {
				if (err || !room) {
					room = errorRoom
				}
				console.log(room.name);
				res.send(room);
		});
	}
}

var updateRoom = function (req, res) {
	var roomName = req.body.roomName;
	var description = req.body.description;
	var activity = req.body.activity;

	var exitParse = function (){
		var string = req.body.exits;
		var start=0;
		var newExit;
		var exits=[];
		for(var i = 0; i < string.length;i++){
			if (string.charAt(i) === ','){
				newExit = string.substring(start,i);
				exits.push(newExit);
				start = i+2;
			}
			if (i === string.length-1){
				newExit = string.substring(start,i+1);
				newExit = newExit.toLowerCase();
				exits.push(newExit);
			}
		}
		return exits;
	};

	var exits = exitParse();

	var newRoom = { name: roomName.toLowerCase(),
									title: roomName,
									description: description,
									activity: activity,
									roomExits: exits
								};

	console.log(newRoom.roomExits);
	roomsCollection.findOne(
		{name: newRoom.name},
		function(err, room){
			if(!room){
				roomsCollection.update(
					{name: "roomList"},
					{$push: {activeRooms: newRoom.name}},
					{upsert: false},
					function(err){
						if (err){
							throw err;
							res.send(err);
						}
					}
				);
			}
		}
	);

	roomsCollection.update(
		{name: newRoom.name},

		{
			name: newRoom.name,
			title: newRoom.title,
			description: newRoom.description,
			activity: newRoom.activity,
			roomExits: newRoom.roomExits
		},

		{upsert: true},
		function(err){
			if (err) {
				throw err;
				res.send(err)
			}
			console.log("Updated " + newRoom.name);
			res.redirect("/editor");
	});
}

var loadDropDown = function(req, res){

	roomsCollection.findOne(
		{name: "roomList"},
		function(err, roomL){
			if(err){
				throw err;
			}
			res.send(roomL.activeRooms);
		}
	);

}

exports.index = index;
exports.register = register;
exports.start = start;
exports.quit = quit;
exports.quitG = quitG;
exports.game = game;
exports.connectToDBs = connectToDBs;
exports.doAction = doAction;
exports.getContents = getContents;
exports.startEditor = startEditor;
exports.editor = editor;
exports.updateRoom = updateRoom;
exports.loadDropDown = loadDropDown;
