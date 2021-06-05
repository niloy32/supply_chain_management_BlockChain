var HOST = location.origin.replace(/^http/, "ws");
var ws = new WebSocket(HOST);
var card_div = document.getElementById("cards");


ws.addEventListener("open", () => {
    console.log("WE Are connected");
});



function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    };
    rawFile.send(null);
}

var ReadBlock_ChainData;
readTextFile("block_Data3.json", function (text) {

    ReadBlock_ChainData = JSON.parse(text);
    console.log(ReadBlock_ChainData);
    for (var index = 1; index < 5; index++) {
        if (ReadBlock_ChainData.chain[index].ShippedToStore == false) {
            var Card_template = document.createElement("div");
            Card_template.setAttribute("class", "icards");
            Card_template.innerHTML = `<div class="card" style="width: 18rem;">
        <img src="${ReadBlock_ChainData.chain[index].product_info[0].img_url}" alt="...">
    <div class="card-body">
      <h5 class="card-title">${ReadBlock_ChainData.chain[index].product_info[0].name}</h5>
      <p class="card-text">${ReadBlock_ChainData.chain[index].product_info[0].Description}</p>
      <a href="#" class="btn btn-primary">Go somewhere</a>
    </div>
    </div>`;
            card_div.append(Card_template);
        }
    }
});



ws.addEventListener("message", ({
    data
}) => {
    let parseData = JSON.parse(data);
    //console.log("received:", parseData);
    var product_data = [];

    for (var property in parseData) {
        if (parseData[property].index != 0) {
            //   product_data = parseData[property].courses;
            var xx = parseData[property].courses;
            product_data[property] = xx;
        }
    }

    var something = [];
    for (i = 1; i < 5; i++) {
        something.push(parseData[i]);
    }
    console.log(something);

    for (var index = 1; index < 5; index++) {
        var Card_template = document.createElement("div");
        Card_template.innerHTML = `<div class="card" style="width: 18rem;">
    <img src="..." class="card-img-top" alt="...">
    <div class="card-body">
      <h5 class="card-title">${something[index].courses[index].name}</h5>
      <p class="card-text">${something[index].courses[index].Description}</p>
      <a href="#" class="btn btn-primary">Go somewhere</a>
    </div>
    </div>`;
        card_div.append(Card_template);
    }
    for (var property in product_data) {
        console.log(product_data);
    }
    for (var property in parseData) {
        if (parseData[property].index != 1) {
            console.log(parseData[property].courses);
        }
    }

    parseData.chain.courses.forEach((element) => {
        console.log(element);
    });
});