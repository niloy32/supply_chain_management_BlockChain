
"use strict";
//const ws = new WebSocket("ws://localhost:3500");
var HOST = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(HOST);
var this_clients_id;
var array_usersOnline;
ws.addEventListener("open", () => {
    console.log("WE Are connected");
});

function Create_chatBox(user) {
    var Created_chatBox = `    <div class="form-popup" id="chatForm_${user}">
    <div  class="form-container">
    <label for="psw"><b>Send Message to ( ${user} )</b></label>
    <input type="text" placeholder="Chat..." id="chatData_from_${user}" required>
    <button type="submit" class="btn" id="sendChat">Send</button>
    <button type="button" class="btn cancel" id="closeForm">Close</button>
    </div>
    </div>`
    return Created_chatBox;
}

function render_online_users(user) {
    var div = document.createElement("div");
    div.setAttribute("id", "replace");
    var online_users_html = document.createElement("button");
    online_users_html.setAttribute("id", `openForm_${user}`);
    online_users_html.setAttribute("class", `btn`);
    online_users_html.innerHTML = user;
    div.appendChild(online_users_html)
    document.getElementById("online_users").replaceChild(div, document.getElementById("replace"));
}



function Update_Online_Users(parseData) {
    array_usersOnline = parseData.UserOnline;;
    var div = document.createElement("div");
    div.setAttribute("id", "replace");
    var chatBox_div = document.createElement("div")
    chatBox_div.setAttribute("id", "replace2");

    array_usersOnline.map(user => {
        var online_users_html = document.createElement("button");
        online_users_html.setAttribute("id", `openForm_${user}`);
        online_users_html.setAttribute("class", `btn`);
        online_users_html.innerHTML = user;
        div.appendChild(online_users_html)
        document.getElementById("online_users").replaceChild(div, document.getElementById("replace"));
        document.getElementById(`openForm_${user}`).addEventListener("click", function sendData() {
            //console.log("clicked id " + this.innerHTML)
            var chatBox = document.createElement("div");
            chatBox.setAttribute("id", `replace2`);
            chatBox.innerHTML = `    <div class="form-popup" id="chatForm_${user}">
            <div  class="form-container">
            <label for="psw"><b>Send Message to ( ${user} ) </b></label>
            <p id="chat_history" >When you send a message the user will get a popup box like this</p >
            <input type="text" placeholder="Chat..." id="chatData_from_${user}" required>
            <button type="submit" class="btn" id="sendChat">Send</button>
            </div>
            </div>`
            document.getElementById("replace2").replaceWith(chatBox);
            document.getElementById("sendChat").addEventListener("click", function sendData() {
                console.log("send message to ( " +
                    user + " ) message =: " +
                    document.getElementById(`chatData_from_${user}`).value);
                var temp_chat = document.createElement("p")
                var chatData = document.getElementById(`chatData_from_${user}`).value
                //temp_chat.innerHTML = user + " said: " + chatData;
                document.getElementById("chat_history").appendChild(temp_chat);
                var obj_chat_data_to_send = {
                    id: this_clients_id,
                    to: user,
                    chatData: chatData
                };
                ws.send(JSON.stringify(obj_chat_data_to_send));
            })
        });
        //OLD CODE HERE
    })
}

function set_my_id(id) {
    var h1 = document.getElementById("my_id");
    h1.setAttribute("id", "set_my_id");
    h1.innerHTML = id;
}

//FORCE OPEN CHAT WINDOW
function sendData(parseData) {
    console.log("Force open by sender " + parseData.id)
    var chatBox = document.createElement("div");
    chatBox.setAttribute("id", `replace2`);
    chatBox.innerHTML = `    <div class="form-popup" id="chatForm_${parseData.id}">
    <div  class="form-container">
    <label for="psw"><b>${parseData.id} Sent a new message so this window opened</b></label>
    <p id="chat_history" ></p >
    <input type="text" placeholder="Chat..." id="chatData_from_${parseData.id}" required>
    <button type="submit" class="btn" id="sendChat">Send</button>
    </div>
    </div>`
    document.getElementById("replace2").replaceWith(chatBox);
    var temp_chat = document.createElement("p")
    temp_chat.innerHTML = parseData.id + " said: " + parseData.chatData;
    console.log("temp_chat.innerHTML " + temp_chat.innerHTML)
    document.getElementById("chat_history").appendChild(temp_chat);
    document.getElementById("sendChat").addEventListener("click", function sendData() {
        console.log("send message to ( " +
            parseData.id + " ) message =: " +
            document.getElementById(`chatData_from_${parseData.id}`).value);
        var temp_chat = document.createElement("p")
        var chatData = document.getElementById(`chatData_from_${parseData.id}`).value
        //temp_chat.innerHTML = parseData.id + " said: " + parseData.chatData;
        console.log("temp_chat.innerHTML " + temp_chat.innerHTML)
        document.getElementById("chat_history").appendChild(temp_chat);
        var obj_chat_data_to_send = {
            id: this_clients_id,
            to: parseData.id,
            chatData: chatData
        };
        ws.send(JSON.stringify(obj_chat_data_to_send));
    })
}

//Pop Function up for Global Chat 

function sendData_everyone(parseData) {
    console.log("Pop up global chat window")
    var chatBox = document.createElement("div");
    chatBox.setAttribute("id", `replace2`);
    chatBox.innerHTML = `    <div class="form-popup" id="chatForm_${parseData.id}">
    <div  class="form-container">
    <label for="psw"><b>This window popped up because someone sent a message to everyone. This window will sent message to everyone</b></label>
    <p id="chat_history" ></p >
    <input type="text" placeholder="Chat..." id="all" required>
    <button type="submit" class="btn" id="sendChat">Send</button>
    </div>
    </div>`
    document.getElementById("replace2").replaceWith(chatBox);
    var temp_chat = document.createElement("p")
    temp_chat.innerHTML = parseData.id + " said: " + parseData.chatData;
    console.log("temp_chat.innerHTML " + temp_chat.innerHTML)
    document.getElementById("chat_history").appendChild(temp_chat);
    document.getElementById("sendChat").addEventListener("click", function sendData() {
        console.log("send message to ( " +
            parseData.id + " ) message =: " +
            document.getElementById(`all`).value);
        var temp_chat = document.createElement("p")
        var chatData = document.getElementById(`all`).value
        //temp_chat.innerHTML = parseData.id + " said: " + parseData.chatData;
        console.log("temp_chat.innerHTML " + temp_chat.innerHTML)
        document.getElementById("chat_history").appendChild(temp_chat);
        var obj_chat_data_to_send = {
            id: this_clients_id,
            to: parseData.id,
            chatData: chatData
        };
        ws.send(JSON.stringify(obj_chat_data_to_send));
    })
}

//Listens for Global messages!!!!!!!!
document.getElementById("everyone").addEventListener("click", function sendData_everyone() {
    console.log("Click on everyone")
    var chatBox = document.createElement("div");
    chatBox.setAttribute("id", `replace2`);
    chatBox.innerHTML = `    <div class="form-popup" id="chatForm_all">
    <div  class="form-container">
    <label for="psw"><b>Send message to everyone</b></label>
    <p id="chat_history" ></p >
    <input type="text" placeholder="Chat..." id="send_all" required>
    <button type="submit" class="btn" id="sendChat">Send</button>
    </div>
    </div>`
    document.getElementById("replace2").replaceWith(chatBox);
    var temp_chat = document.createElement("p")
    //temp_chat.innerHTML = parseData.id + " said: " + parseData.chatData;
    console.log("temp_chat.innerHTML " + temp_chat.innerHTML)
    document.getElementById("chat_history").appendChild(temp_chat);
    document.getElementById("sendChat").addEventListener("click", function sendData() {
        console.log("send message to ( " +
            everyone + " ) message =: " +
            document.getElementById(`send_all`).value);
        var temp_chat = document.createElement("p")
        var chatData = document.getElementById(`send_all`).value
        //temp_chat.innerHTML = parseData.id + " said: " + parseData.chatData;
        console.log("temp_chat.innerHTML " + temp_chat.innerHTML)
        document.getElementById("chat_history").appendChild(temp_chat);
        var obj_chat_data_to_send = {
            id: this_clients_id,
            to: "all",
            chatData: chatData
        };
        ws.send(JSON.stringify(obj_chat_data_to_send));
    })
}, false);
ws.onmessage

ws.addEventListener("message", ({ data }) => {
    //console.log("data from server " + data)
    var parseData = JSON.parse(data);


    if (parseData.hasOwnProperty('to')) {
        if (parseData.to == this_clients_id) {
            console.log("Got PM from " + parseData.id + " : " + parseData.chatData);
            var temp_chat = document.createElement("p")
            temp_chat.innerHTML = parseData.id + " said: " + parseData.chatData;
            try {
                document.getElementById("chat_history").appendChild(temp_chat);
            }
            catch {
                //alert(parseData.id + " said: " + parseData.chatData)
                sendData(parseData);
            }
        }
        else if (parseData.id == this_clients_id && parseData.to != "all") {
            console.log("Got PM from " + parseData.id + " : " + parseData.chatData);
            var temp_chat = document.createElement("p")
            temp_chat.innerHTML = this_clients_id + " said: " + parseData.chatData;
            try { document.getElementById("chat_history").appendChild(temp_chat); } catch (e) { console.log(e); }
        }
        else if (parseData.to == "all") {
            console.log(parseData.id + " Sent message to Everyone that " + parseData.chatData)
            sendData_everyone(parseData);
        }
    }
    if (parseData.hasOwnProperty('UserOnline')) {
        Update_Online_Users(parseData)
    }
    if (parseData.hasOwnProperty('my_id')) {
        console.log("This Client Id is : " + parseData.my_id)
        this_clients_id = parseData.my_id;
        set_my_id(this_clients_id)
    }
});






// setInterval(function print() {
//     console.log(this_clients_id)
// }, 1000);






// function openForm(user) {
//     closeForm()
//     document.getElementById(`chatForm_${user}`).style.display = "block";
//     console.log("Opened form")
// }

// function closeForm(user) {
//     console.log("closed form")
//     document.getElementById(`chatForm_${user}`).style.display = "none";
// }

//document.getElementById("openForm").addEventListener("click", openForm);
//document.getElementById("closeForm").addEventListener("click", closeForm);