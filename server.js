if (process.env.NODE_ENV !== 'production') {
    require("dotenv").config()
}
const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const path = require("path");
const http = require("http");
const passport = require("passport");
const server = http.createServer(app);
const helmet = require("helmet");
const initializePassport = require("./passport-config");
const methodOverride = require("method-override")
const session = require("express-session")
const flash = require("express-flash")
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const fs = require('fs');
const { format } = require("path");
app.use(require("body-parser").urlencoded());
initializePassport(passport,
    name => users.find(user => user.name === name),
    password => users.find((user) => user.password === password));
app.use(express.static(path.join(__dirname, "public")))
app.use(helmet());
app.use(flash());
app.use(methodOverride('_method'))
app.use(session({
    secret: process.env.SESSION_SECRET,
    reSave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
let ws;

let ReadUsersList = fs.readFileSync('./public/users.json');
let users = JSON.parse(ReadUsersList);




const wss = new WebSocket.Server({ server }), clients = [];


const PORT = 3500 || process.env.PORT;

app.get("/login", checkNotAuthenticated, (req, res) => {
    res.sendFile('./public/login.html', { root: __dirname })
});

app.get("/register", (req, res) => {
    res.sendFile('./public/register.html', { root: __dirname })
});
app.get("/dashboard", checkAuthenticated, async (req, res) => {
    try {
        this_userName = req.user.name
    } catch { this_userName = "TEST ID" }
    if (req.user.admin) {
        res.sendFile('./public/Dashboard_admin.html', { root: __dirname })
    } else {

        res.sendFile('./public/Dashboard.html', { root: __dirname })
    }
    //res.sendFile('./public/Dashboard.html', { root: __dirname })
});

//checkNotAuthenticated,
app.post("/register", async (req, res) => {
    try {
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(req.body.password, salt);
        console.log(salt);
        console.log(hashPassword);
        const user = { name: req.body.name, password: hashPassword, admin: req.body.admin };
        users.push(user);
        fs.writeFileSync('./public/users.json', JSON.stringify(users));
        res.redirect("./dashboard");
        //res.sendFile('./public/users.html', { root: __dirname })
    } catch {
        res.redirect("./register");
    }
    console.log(users);
});




//CHECKS IF LOGGED IN OR NOT


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

app.post("/login", checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}
));




app.get("/", checkAuthenticated, (req, res) => {
    res.sendFile('./public/register.html', { root: __dirname })
})


app.delete('/logout', async (req, res) => {

    req.logOut()
    res.redirect("./login")
})


let this_userName;
var obj_user_that_logged_in;
var UserOnline = [];

var UserOnline_objects = {
    UserOnline: UserOnline
}
//let json_UserOnline = JSON.stringify(UserOnline_objects)


app.get("/chat_app", checkAuthenticated, async (req, res) => {
    console.log("this is user logged in : " + req.user.name)
    this_userName = await req.user.name
    obj_user_that_logged_in = {
        id: this_userName,
        chatData: "null"
    };
    if (UserOnline.indexOf(this_userName) != false) {
        UserOnline.push(this_userName);
    }

    console.log(this_userName)
    UserOnline_objects = {
        UserOnline: UserOnline
    }
    console.log(UserOnline_objects);
    if (req.user.admin) {
        res.sendFile('./public/chat_app_admin.html', { root: __dirname })
    } else {

        res.sendFile('./public/chat_app.html', { root: __dirname })
    }
    console.log("req.user.admin " + req.user.admin)
    //sendAll(JSON.stringify(UserOnline_objects));

    sendAll(JSON.stringify(obj_user_that_logged_in));
});
wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};
d = new Date();
var connected_client_array

// TEST CODE COPY PASTED

wss.on("connection", (ws) => {
    clients.push(ws);
    ws.id = this_userName || "NO ID FOUND. CHECK HERE";
    console.log(`${ws.id} Connected`);
    connected_client_array = [];

    var obj_data_to_send = {
        my_id: ws.id
    }
    ws.send(JSON.stringify(obj_data_to_send));
    //ws.send('Connected as ' + ws.id)
    wss.clients.forEach(function each(client) {
        if (connected_client_array.indexOf(client.id) != false) {
            connected_client_array.push(client.id)
        }

        UserOnline_objects = {
            UserOnline: connected_client_array
        }
        client.send(JSON.stringify(UserOnline_objects));
        console.log("sent")
    });

    //clients["dashboard"].send("hello dashboard");
    console.log(connected_client_array)
    //sendAll(JSON.stringify(obj_user_that_logged_in));
    sendAll(JSON.stringify(UserOnline_objects));
    ws.on("message", function (message) {
        console.log("received:", message);
        let parseData = JSON.parse(message);

        wss.clients.forEach(function each(client) {
            if (client.id == parseData.to || client.id == parseData.id) {
                client.send(JSON.stringify(parseData));
                console.log("matched client is " + client.id)
            }
        });
        //Sends data to everyone if its global
        if (parseData.to == "all") {
            sendAll(JSON.stringify(parseData));
        }


    });

    ws.on("message", (data) => {
        //sendAll(data);
        //console.log("this is from client data " + data);
        let parseData = JSON.parse(data);
        ThisClientId = parseData.id;
        //console.log(`Client has sent us Message :${parseData.chatData}`);

        wss.clients.forEach(function each(client) {
            //console.log("Client.ID: " + parseData.id);
        });
    });

    ws.on("close", () => {
        console.log(`client ${ws.id} has disconnected`)
        connected_client_array.pop(ws.id)
        UserOnline_objects = {
            UserOnline: connected_client_array
        }
        sendAll(JSON.stringify(UserOnline_objects));
        console.log(connected_client_array)
    });
});
function sendAll(data) {
    for (let i = 0; i < clients.length; i++) {
        clients[i].send(data);
    }
}

// TEST CODE COPY PASTED

server.listen(process.env.PORT || 3500, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});


//Export Things test


