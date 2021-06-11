var HOST = location.origin.replace(/^http/, "ws");
var ws = new WebSocket(HOST);
var card_div = document.getElementById("cards");

ws.addEventListener("open", () => {
  console.log("WE Are connected");
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

let requestURL = 'https://mdn.github.io/learning-area/javascript/oojs/json/superheroes.json';
let request = new XMLHttpRequest();


//usage:
var ReadBlock_ChainData;
readTextFile("block_Data3.json", function (text) {

  ReadBlock_ChainData = JSON.parse(text);
  console.log(ReadBlock_ChainData);

  ////////////////////////////////////////////////////////////////
  for (var index = 1; index < ReadBlock_ChainData.chain.length; index++) {
    var Card_template = document.createElement("div");
    Card_template.setAttribute("class", "icards");
    Card_template.innerHTML = `<div class="card" style="width: 18rem;">
    <img src="${ReadBlock_ChainData.chain[index].product_info[0].img_url}" alt="...">
    <div class="card-body">
      <h5 class="card-title">${ReadBlock_ChainData.chain[index].product_info[0].name}</h5>
      <p class="card-text">${ReadBlock_ChainData.chain[index].product_info[0].Description}</p>
      <a href="#" class="btn btn-primary">Ship to Retail Store</a>
    </div>
    </div>`;
    //card_div.append(Card_template);
  }

  function render_list() {
    for (var index = 1; index < ReadBlock_ChainData.chain.length; index++) {
      if (ReadBlock_ChainData.chain[index].ShippedToStore != true) {
        console.log(ReadBlock_ChainData.chain[index].ShippedToStore);

        //var Card_template = document.createElement("div");
        var table = document.getElementById("table_data");
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(-1);
        var cell2 = row.insertCell(-1);
        var cell3 = row.insertCell(-1);
        var cell4 = row.insertCell(-1);
        var cell5 = row.insertCell(-1);
        var cell6 = row.insertCell(-1);
        var cell7 = row.insertCell(-1);
        cell5.setAttribute("href", "www.google.com");
        cell1.innerHTML = ReadBlock_ChainData.chain[index].hash;
        cell2.innerHTML = ReadBlock_ChainData.chain[index].product_info[0].name;
        cell3.innerHTML =
          ReadBlock_ChainData.chain[index].product_info[0].Description;
        cell4.innerHTML =
          ReadBlock_ChainData.chain[index].product_info[0].Manufacture_location;

        var link = `<td>
    <a href=${ReadBlock_ChainData.chain[index].product_info[0].img_url}>
      <div style="height:100%;width:100%">
      </div>
    </a>
    <select name="city" id="Retail_store" class="form-select form-select-lg mb-3" >
  <option value="Dhaka">Dhaka</option>
  <option value="CTG">CTG</option>
  <option value="Rajshahi">Rajshahi</option>
  <option value="Barisal">Barisal</option>
</select>
    <button id="${ReadBlock_ChainData.chain[index].hash}" class="btn btn-info">Ship To Store</button>
    <button id="Damaged${index}" class="btn btn-danger">Damaged</button>
  </td>`;
        cell6.innerHTML =
          ReadBlock_ChainData.chain[index].product_info[0].Manufacture_date;
        cell5.innerHTML = link;
        cell7.innerHTML = ReadBlock_ChainData.chain[index].product_info[0].Batch;
        var something2 = ReadBlock_ChainData.chain[index];

        document.getElementById("Damaged" + index).addEventListener("click", function () {
          this.parentElement.parentElement.remove();
        })

        //template function for later uses
        function something(block, index) {
          console.log("this " + index);
          Object.assign(block, {
            ShippedToStore: "Yes",
          });
          console.log(ReadBlock_ChainData);
        }

        //document.getElementById(ReadBlock_ChainData.chain[index].hash).addEventListener("click", something(something2), false);
        // document.getElementById(ReadBlock_ChainData.chain[index].hash).addEventListener("click", function () {
        //   something(ReadBlock_ChainData.chain[0], index)
        // });
        document.getElementById(ReadBlock_ChainData.chain[index].hash).addEventListener("click", function () {
          ReadBlock_ChainData.chain.forEach(element => {
            if (element.hash == this.id) {
              element.ShippedToStore = false;
              element.Retail_store = document.getElementById("Retail_store").value;
              console.log(document.getElementById("Retail_store").value);
              console.log(element);
              ws.send(JSON.stringify(ReadBlock_ChainData));
              document.getElementById(this.id).parentElement.parentElement.remove();
              //render_list();
            }
          });
        });


        //console.log(ReadBlock_ChainData);
        var row = table.insertRow(0);
        // Object.assign(ReadBlock_ChainData.chain[index], { key3: "value3" });
        // console.log(ReadBlock_ChainData);
        //Card_template.setAttribute("class", "icards");

        //document.getElementById("table_data").append(Card_template);
      }
    }
  }
  render_list();
});

// $(function () {
//   $("#table_data").bootstrapTable();
// });