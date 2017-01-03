var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var schedule = require('node-schedule');
var db = require('diskdb');
var fs = require('fs');

console.log('StudyGroup Server');

var numCli = 0;
var PORT = 8080;

var cmdFile = JSON.parse(fs.readFileSync("./cfg/cmds.json"));
var serverConfig = JSON.parse(fs.readFileSync("./cfg/server.json"));
var cmds = cmdFile.commands;
console.log('\n' + "configured cmds:");
console.log(JSON.stringify(cmdFile, null, 2));
console.log('\n' + "server configuration:");
console.log(JSON.stringify(serverConfig, null, 2));
console.log('\n');

db.connect(__dirname + '/db', ['users', 'channels', 'messages']);

/*
var clrMsgBank = schedule.scheduleJob('0 0 * * * *', function () {
    // check every hour
    // if server exceeds 1,000,000 messages, purge message storage

    if (db.articles.count() > 1000000) {
        console.log('Message cap reached! clearing messages...');
        db.messages.remove();
        db.connect(__dirname + '/db', ['messages']);
    }
});
*/

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/frontend/index.html');
});

app.use(express.static(__dirname + "/public"));

io.sockets.on('connection', function (socket) {
    numCli = numCli + 1;
    var clientID = numCli;
    console.log('Client ' + clientID + ' has connected' + '\n');

    var loggedIn = false;
    var userInfo = {
        "username": "",
        "channel": "",
        "history": []
    };
    var message = {
        "username": "",
        "channel": "",
        "message": ""
    };
    var response = {
        "result": "",
        "error": []
    };

    socket.emit('motd', serverConfig.motd);

    socket.on('register', function (user, fn) {
        console.log('registering user: ' + JSON.stringify(user, null, 2));
        console.log(db.users.findOne({ "username": user.username, "id": user.id }));
        var isFoundUsername = db.users.findOne({ "username": user.username });
        var isFoundID = db.users.findOne({ "id": user.id });

        if (!(isFoundUsername || isFoundID)) {
            db.users.save({ "username": user.username, "id": user.id, "key": user.key, "online": true, "permission": [] });
            userInfo.username = user.username;
            message.username = user.username;
            loggedIn = true;

            response.result = "success";
            response.error = [];
            fn(response);
            console.log('register success');
        } else {
            response.result = "error";
            response.error = [];
            if (isFoundUsername) {
                response.error.push("username");
            }
            if (isFoundID) {
                response.error.push("id");
            }
            fn(response);
            console.log('register failed: ' + JSON.stringify(response, null, 2) + '\n');
        }
    });

    socket.on('login', function (user, fn) {
        var isFound = db.users.findOne(user);

        if (isFound) {
            userInfo.username = user.username;
            message.username = user.username;
            loggedIn = true;
            db.users.update(user, { "online": true });

            response.result = "success";
            response.error = [];
            fn(response);
            console.log('Client ' + clientID + ' has logged in as:' + JSON.stringify(isFound, null, 2) + '\n');
        } else {
            response.result = "error";
            response.error = [];
            fn(response);
            console.log('login fail: ' + JSON.stringify(response, null, 2) + '\n');
        }
    });

    socket.on('sendmsg', function (msg, fn) {
        if (loggedIn == true) {
            message.message = msg.message;
            response.result = "sent";
            response.error = [];
            fn(response);
            socket.broadcast.emit('message', message);
            console.log('[' + message.username + '][' + message.channel + '] ' + message.message);
        } else {
            console.log('message not sent not logged in');
            response.result = "error";
            response.error = ["login"];
            fn(response);
        }
    });

    socket.on('disconnect', function () {
        console.log('Client ' + clientID + ' has disconnected' + '\n');
        db.users.update({ "username": userInfo.username }, { "online": false });
        numCli = numCli - 1;
        loggedIn = false;
        userInfo = {
            "username": "",
            "channel": "",
            "history": []
        };
        message = {
            "username": "",
            "channel": "",
            "message": ""
        };
        response = {
            "result": "",
            "error": []
        };
    });
});

http.listen(PORT);
console.log('loading looks good! Server started on port 80.');