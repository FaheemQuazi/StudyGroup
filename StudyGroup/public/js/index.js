var input = document.getElementById("inputText");
var inputEvent = new CustomEvent("keyup", { "keycode": 13 });
var output = document.getElementById("messages");
var socket = io();

socket.on('connect', function () {

});

socket.on('motd', function (motd) {
    output.innerHTML += "<p class='motd'>[MOTD] " + motd + "</p>";
});

socket.on('message', function (msg) {
    output.innerHTML += "<p>[" + msg.username + "][" + msg.channel + "] " + msg.message + "</p>";
});

input.addEventListener("keyup", function (e) {
    if (e.keyCode == 13) {
        console.log('enter');
        if (input.value.charAt(0) == '/') {
            // interpret as command
            var str = input.value.substring(1);
            var cmd = str.substring(0, str.indexOf(' '));
            var args = (str.substring(str.indexOf(' ') + 1)).split(' ');
            output.innerHTML += "<p class='you'>[you cmd] " + str + "</p>";
            switch (cmd) {
                case "register":
                    // register
                    var x = document.getElementsByClassName("you");
                    var y = x[x.length - 1];
                    if (args.length == 3) {
                        var regUser = {
                            "username": args[0],
                            "id": args[1],
                            "key": args[2]
                        };
                        socket.emit('register', regUser, function (response) {
                            
                            if (response.result == "success") {
                                // user creation successful
                                y.classList.add("sent");
                                y.innerHTML += "<br />Your account has been successfully created! You are now logged in."
                            } else {
                                // user creation failed
                                y.classList.add("error");
                                y.innerHTML += "<br />Your account could not be created: ";
                                console.log(response.error);
                                for (i = 0; i < response.error.length; i++){
                                    if (response.error[i] == "username") {
                                        console.log("username");
                                        y.innerHTML += "<br />- username taken";
                                    } else if (response.error[i] == "id") {
                                        console.log("id");
                                        y.innerHTML += "<br />- ID already exists";
                                    }

                                }
                            }
                        });
                    } else {
                        y.innerHTML += "<br />Error: The command could not be run: ";
                        if (args.length < 3) {
                            y.innerHTML += "missing argument(s)";
                        } else if (args.length > 3) {
                            y.innerHTML += "too many arguments";
                        }
                    }
                case "login":
                    // login
                    var x = document.getElementsByClassName("you");
                    var y = x[x.length - 1];
                    if (args.length == 3) {
                        var regUser = {
                            "username": args[0],
                            "id": args[1],
                            "key": args[2]
                        };
                        socket.emit('login', regUser, function (response) {

                            if (response.result == "success") {
                                // user creation successful
                                y.classList.add("sent");
                                y.innerHTML += "<br />You are now logged in!"
                            } else {
                                // user creation failed
                                y.classList.add("error");
                                y.innerHTML += "<br />No account can be found with that combination of username, id, and password.<br /> verify that your credentials are correct!";
                                console.log(response.error);
                            }
                        });
                    } else {
                        y.innerHTML += "<br />Error: The command could not be run: ";
                        if (args.length < 3) {
                            y.innerHTML += "missing argument(s)";
                        } else if (args.length > 3) {
                            y.innerHTML += "too many arguments";
                        }
                    }
                default:
                    // everything else
                    
            }
        } else {
            // interpret as message
            output.innerHTML += "<p class='you'>[you] " + input.value + "</p>";
            var message = {
                "message": input.value
            }
            socket.emit('sendmsg', message, function (response) {
                var x = document.getElementsByClassName("you");
                var y = x[x.length - 1];
                if (response.result == 'sent') {
                    y.classList.add("sent");
                } else if (response.result == 'error') {
                    if (response.error[0] == 'login') {
                        y.innerHTML += "<br />you are currently not logged in; you cannot send messages!";
                    } else {
                        y.innerHTML += "<br />An error has occured";
                    }
                }
            });
        }
        input.value = "";
    }

});


