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
    var hash_array = [];
    for (var index = 1; index < ReadBlock_ChainData.chain.length; index++) {

        if (ReadBlock_ChainData.chain[index].ShippedToStore == false) {
            var Card_template = document.createElement("div");
            Card_template.setAttribute("class", "icards");
            Card_template.innerHTML = `<div class="card" style="width: 18rem;">
        <img src="${ReadBlock_ChainData.chain[index].product_info[0].img_url}" alt="...">
    <div class="card-body">
      <h5 class="card-title">${ReadBlock_ChainData.chain[index].product_info[0].name}</h5>
      <p class="card-text">${ReadBlock_ChainData.chain[index].product_info[0].Description}</p>
      <!-- Button trigger modal -->
      <button type="button" id="${ReadBlock_ChainData.chain[index].hash}" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal" data-bs-whatever="@${ReadBlock_ChainData.chain[index].hash}">   More Information  </button>

      </button>
    </div>
    </div>`;
            card_div.append(Card_template);

            // hash_array.push(ReadBlock_ChainData.chain[index].product_info[0].name);
            // document.getElementById(ReadBlock_ChainData.chain[index].hash).addEventListener("click", function () {
            //     ReadBlock_ChainData.chain.forEach(element => {
            //         asd = document.getElementById("cards");
            //         var dsa;
            //         if (element.hash == this.id) {
            //             console.log(this.id);
            //         }
            //     });
            // });
            var exampleModal = document.getElementById('exampleModal')
            exampleModal.addEventListener('show.bs.modal', function (event) {
                // Button that triggered the modal
                var button = event.relatedTarget
                // Extract info from data-bs-* attributes
                var recipient = button.getAttribute('data-bs-whatever')
                // If necessary, you could initiate an AJAX request here
                // and then do the updating in a callback.
                //
                // Update the modal's content.
                var modalTitle = exampleModal.querySelector('.modal-title')
                var modalBodyInput = exampleModal.querySelector('.modal-body input')
                var modalBodyDes = exampleModal.querySelector('.modal-des')
                var modalBodyloca = exampleModal.querySelector('.modal-loca')
                var modalBodybatch = exampleModal.querySelector('.modal-batch')
                var modalBodydate = exampleModal.querySelector('.modal-date')
                var mod_img = exampleModal.querySelector('#modal-img')
                ReadBlock_ChainData.chain.forEach(element => {
                    if ("@" + element.hash == recipient) {
                        var title = element.product_info[0].name;
                        var hash = element.hash;
                        modalTitle.textContent = title;
                        modalBodyInput.value = hash;
                        modalBodyDes.textContent = "Description : " + element.product_info[0].Description;
                        modalBodyloca.textContent = "Manufacture Location : " + element.product_info[0].Manufacture_location;
                        modalBodybatch.textContent = "Batch #" + element.product_info[0].Batch;
                        modalBodydate.textContent = "Manufacture Date : " + element.product_info[0].Manufacture_date;
                        mod_img.setAttribute("src", element.product_info[0].img_url)
                    }
                });


            })
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
});


if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

web3.eth.defaultAccount = web3.eth.accounts[0];


var CorContact = web3.eth.contact([{
        "constant": false,
        "inputs": [{
            "name": "_value",
            "type": "string"
        }],
        "name": "set",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "get",
        "outputs": [{
            "name": "",
            "type": "string"
        }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
    }
])


var corset = CorContact.at()