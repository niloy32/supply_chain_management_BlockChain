var HOST = location.origin.replace(/^http/, "ws");
var ws = new WebSocket(HOST);

var card_div = document.getElementById("cards");

// for (let index = 0; index < 3; index++) {
//   var Card_template = document.createElement("div");
//   Card_template.innerHTML = `<div class="card" style="width: 18rem;">
// <img src="..." class="card-img-top" alt="...">
// <div class="card-body">
//   <h5 class="card-title">Card title</h5>
//   <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
//   <a href="#" class="btn btn-primary">Go somewhere</a>
// </div>
// </div>`;
//   card_div.append(Card_template);
// }

ws.addEventListener("open", () => {
  console.log("WE Are connected");
});

ws.addEventListener("message", ({ data }) => {
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
  //console.log(something);

  // for (var index = 0; index < 5; index++) {
  //   var Card_template = document.createElement("div");
  //   Card_template.innerHTML = `<div class="card" style="width: 18rem;">
  // <img src="..." class="card-img-top" alt="...">
  // <div class="card-body">
  //   <h5 class="card-title">${something[index].courses[index].name}</h5>
  //   <p class="card-text">${something[index].courses[index].Description}</p>
  //   <a href="#" class="btn btn-primary">Go somewhere</a>
  // </div>
  // </div>`;
  //   card_div.append(Card_template);
  // }

  for (var property in product_data) {
    //console.log(product_data);
  }
  // for (var property in parseData) {
  //   if (parseData[property].index != 1) {
  //     console.log(parseData[property].courses);
  //   }
  // }

  // parseData.chain.courses.forEach((element) => {
  //   console.log(element);
  // });
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
//usage:
var ReadBlock_ChainData;
readTextFile("block_Data.json", function (text) {
  ReadBlock_ChainData = JSON.parse(text);

  ////////////////////////////////////////////////////////////////
  for (var index = 1; index < ReadBlock_ChainData.length; index++) {
    var Card_template = document.createElement("div");
    Card_template.setAttribute("class", "icards");
    Card_template.innerHTML = `<div class="card" style="width: 18rem;">
    <img src="${ReadBlock_ChainData[index].product_info[0].img_url}" alt="...">
    <div class="card-body">
      <h5 class="card-title">${ReadBlock_ChainData[index].product_info[0].name}</h5>
      <p class="card-text">${ReadBlock_ChainData[index].product_info[0].Description}</p>
      <a href="#" class="btn btn-primary">Ship to Retail Store</a>
    </div>
    </div>`;
    card_div.append(Card_template);
  }
});
