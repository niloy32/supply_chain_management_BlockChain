var express = require("express");
var app = express();
var PORT = process.argv[2] || 3501;
var path = require("path");
var fs = require("fs");
var bodyParser = require("body-parser");
var passport = require("passport");
var bcrypt = require("bcrypt");
var initializePassport = require("./passport-config");
var rp = require("request-promise");
var Blockchain = require("./public/blockchain.js");
var ReadUsersList = fs.readFileSync("./public/users.json");
var uuidv4 = require("uuid").v4;
var nodeAddress = uuidv4().split("-").join("");
var users = JSON.parse(ReadUsersList);
const http = require("http");
const WebSocket = require("ws");
const server = http.createServer(app);
const wss = new WebSocket.Server({
    server,
  }),
  clients = [];
app.use(passport.initialize());
app.use(passport.session());
initializePassport(
  passport,
  (name) => users.find((user) => user.name === name),
  (password) => users.find((user) => user.password === password)
);
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

//Initializes new BlockChain
var BlockChain_Meta_info = new Blockchain();
//fs.writeFileSync('./public/block_Data.json', JSON.stringify(BlockChain_Meta_info.chain));
var ReadBlock_ChainData = fs.readFileSync("./public/block_Data3.json");
// https BlockChain_Meta_info.push(JSON.parse(ReadBlock_ChainData));
var temp = JSON.parse(ReadBlock_ChainData);
BlockChain_Meta_info.chain = temp.chain;
//console.log(BlockChain_Meta_info);
//fs.writeFileSync('./public/block_Data.json', JSON.stringify(BlockChain_Meta_info));
//json_BlockChain_Meta_info.push(BlockChain_Meta_info)
//temp.chain.dd = "setCacheAdda"
//console.log(temp);

initializePassport(
  passport,
  function (name) {
    return users.find(function (user) {
      return user.name === name;
    });
  },
  function (password) {
    return users.find(function (user) {
      return user.password === password;
    });
  }
);
app.use(express.static(path.join(__dirname, "public")));
app.get("/", function (req, res) {});
app.get("/login", function (req, res) {
  res.sendFile("./public/index.html", {
    root: __dirname,
  });
});
app.get("/blockchain", function (req, res) {
  res.send(BlockChain_Meta_info);
});
app.get("/userI", function (req, res) {
  res.sendFile("./public/userI.html", {
    root: __dirname,
  });
});
app.get("/block-explorer", function (req, res) {
  res.sendFile("./Block-explorer/index.html", {
    root: __dirname,
  });
});
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/userI",
    failureRedirect: "/login",
    failureFlash: true,
  })
);
//BLOCK CHAIN FUNCTIONS
app.post("/transaction", function (req, res) {
  var newTransaction = req.body;
  var blockIndex =
    BlockChain_Meta_info.addTransactionToPendingTransaction(newTransaction);
  res.json({
    note: "Transaction will be added in block " + blockIndex + ".",
  });
});
app.post("/transaction/broadcast", function (req, res) {
  var product_Details = {
    name: req.body.ProductName,
    Description: req.body.Description,
    Manufacture_location: req.body.Manufacture_location,
    Batch: req.body.Batch,
    img_url: req.body.img_url,
    Manufacture_date: new Date().toISOString().slice(0, 10),
  };
  //var newTransaction = BlockChain_Meta_info.createNewStudentResult();
  var newTransaction =
    BlockChain_Meta_info.createNewStudentResult(product_Details);
  BlockChain_Meta_info.addTransactionToPendingTransaction(newTransaction);
  //makes a promise that will push the new transaction info to other nodes
  var requestPromise = [];
  // gets all the node info from BlockChain_Meta_info.networkNodes and sends them the transaction info
  // one by one to other nodes
  BlockChain_Meta_info.networkNodes.forEach(function (networkNodeUrl) {
    var requestOption = {
      uri: networkNodeUrl + "/transaction",
      method: "POST",
      body: newTransaction,
      json: true,
    };
    requestPromise.push(rp(requestOption));
  });
  Promise.all(requestPromise).then(function (data) {
    res.json({
      note: "Data Added and broadcasted successfully",
    });
  });
  // fs.writeFileSync(
  //   "./public/block_Data.json",
  //   JSON.stringify(BlockChain_Meta_info.chain)
  // );
  fs.writeFileSync(
    "./public/block_Data2.json",
    JSON.stringify(BlockChain_Meta_info)
  );
});

//register and brodcast node to the network
app.post("/register_brodcast_node", function (req, res) {
  //loop that bordcasts this nodes url to all other nodes in the network
  const newNodeUrl = req.body.newNodeUrl;
  // Searches the whole network index of the input index is present or not.
  //if not present return -1 .
  if (BlockChain_Meta_info.networkNodes.indexOf(newNodeUrl) == -1)
    BlockChain_Meta_info.networkNodes.push(newNodeUrl);

  const regNodesPromises = [];
  BlockChain_Meta_info.networkNodes.forEach((networkNodeUrl) => {
    const requestOption = {
      uri: networkNodeUrl + "/register_node",
      method: "POST",
      body: {
        newNodeUrl: newNodeUrl,
      },
      json: true,
    };
    regNodesPromises.push(rp(requestOption));
  });
  Promise.all(regNodesPromises)
    .then((data) => {
      const bulkRegisterOption = {
        uri: newNodeUrl + "/register_node_bulk",
        method: "POST",
        body: {
          allNetworkNodes: [
            ...BlockChain_Meta_info.networkNodes,
            BlockChain_Meta_info.currentNodeUrl,
          ],
        },
        json: true,
      };
      return rp(bulkRegisterOption);
    })
    .then((data) => {
      res.json({
        note: "new node registered succesful",
      });
    });
});

//just register node
app.post("/register_node", function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  const nodeNoteAlreaadyPresent =
    BlockChain_Meta_info.networkNodes.indexOf(newNodeUrl) == -1;
  const NotCurrentNode = BlockChain_Meta_info.currentNodeUrl !== newNodeUrl;
  if (nodeNoteAlreaadyPresent && NotCurrentNode) {
    BlockChain_Meta_info.networkNodes.push(newNodeUrl);
  }
  res.json({
    note: "new node Resgister Scucesfully. ",
  });
});

//when a new node registers to a single node this funtion sends registration
//info to other nodes too.
app.post("/register_node_bulk", function (req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach((networkNodeUrl) => {
    const nodeNotAlareadyPresent =
      BlockChain_Meta_info.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = BlockChain_Meta_info.currentNodeUrl !== networkNodeUrl;
    if (nodeNotAlareadyPresent && notCurrentNode)
      BlockChain_Meta_info.networkNodes.push(networkNodeUrl);
  });
  res.json({
    note: "new node register_node_bulk Successful. ",
  });
});

// consensus
app.get("/consensus", function (req, res) {
  const requestPromises = [];
  BlockChain_Meta_info.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + "/blockchain",
      method: "GET",
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises).then((blockchains) => {
    const currentChainLength = BlockChain_Meta_info.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newPendingTransactions = null;
    //console.log("requestPromises : " + JSON.stringify(requestPromises));
    blockchains.forEach((blockchain) => {
      console.log("look : " + JSON.stringify(blockchain.chain));
      if (blockchain.chain.length > maxChainLength) {
        maxChainLength = blockchain.chain.length;
        newLongestChain = blockchain.chain;
        newPendingTransactions = blockchain.pendingTransactions;
      }
    });

    if (
      !newLongestChain ||
      (newLongestChain && !BlockChain_Meta_info.chainIsValid(newLongestChain))
    ) {
      res.json({
        note: "Current chain has not been replaced.",
        chain: BlockChain_Meta_info.chain,
      });
    } else {
      BlockChain_Meta_info.chain = newLongestChain;
      BlockChain_Meta_info.pendingTransactions = newPendingTransactions;
      res.json({
        note: "This chain has been replaced.",
        chain: BlockChain_Meta_info.chain,
      });
    }
  });
});

app.post("/receieve_new_block", function (req, res) {
  const newBlock = req.body.newBlock;
  const lastBlock = BlockChain_Meta_info.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock["index"] + 1 === newBlock["index"];
  if (correctHash && correctIndex) {
    BlockChain_Meta_info.chain.push(newBlock);
    BlockChain_Meta_info.PendingTransactions = [];
    res.json({
      note: "new block Recieved andd acccepted",
      newBlock: newBlock,
    });
  } else {
    res.json({
      note: "new block Rejected ",
      newBlock: newBlock,
    });
  }
});
app.get("/mine", function (req, res) {
  console.log("Mining");
  var LastBlock = BlockChain_Meta_info.getLastBlock();
  var previousBlockHash = LastBlock["hash"];
  var currentBlockData = {
    transaction: BlockChain_Meta_info.ReadyToShip,
    index: LastBlock["index"] + 1,
  };
  var nonce = BlockChain_Meta_info.ProofOfWork(
    previousBlockHash,
    currentBlockData
  );
  var blockHash = BlockChain_Meta_info.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );
  //BlockChain_Meta_info.createNewTransaction(12.5, "00", nodeAddress, "mined added data");
  var newBlock = BlockChain_Meta_info.createNewBlock(
    nonce,
    previousBlockHash,
    blockHash
  );
  var requestPromises = [];
  // BlockChain_Meta_info.networkNodes.forEach(function (networkNodeUrl) {
  //     var requestOptions = {
  //         uri: networkNodeUrl + "/receieve_new_block",
  //         method: "POST",
  //         body: {
  //             newBlock: newBlock,
  //         },
  //         json: true,
  //     };
  //     requestPromises.push(rp(requestOptions));
  // });
  // console.log(BlockChain_Meta_info.currentNodeUrl);
  // Promise.all(requestPromises)
  //     .then(function (data) {
  //         var requestOptions = {
  //             uri: BlockChain_Meta_info.currentNodeUrl + "/transaction/broadcast",
  //             method: "POST",
  //             json: true,
  //         };
  //         return rp(requestOptions);
  //     })
  //     .then(function (data) {
  res.json({
    note: "new block mined && broadcasted successful",
    block: newBlock,
  });
  //     });
  fs.writeFileSync(
    "./public/block_Data3.json",
    JSON.stringify(BlockChain_Meta_info)
  );
});

app.get("/block/:blockHash", function (req, res) {
  const blockHash = req.params.blockHash;
  const correctBlock = BlockChain_Meta_info.getBlock(blockHash);

  res.json({
    block: correctBlock,
    data: "something correctBlock",
  });
});

app.get("/transaction/:transactionId", function (req, res) {
  const transactionId = req.params.transactionId;
  const TransactionData = BlockChain_Meta_info.getTransactionId(transactionId);
  res.json({
    transaction: TransactionData.transaction,
    block: TransactionData.block,
    //data: "something correctTransactionID",
  });
});

app.get("/address/:address", function (req, res) {
  const address = req.params.address;
  const addressData = BlockChain_Meta_info.getAddressData(address);
  res.json({
    addressData: addressData,
  });
});

app.get("/warehouse", function (req, res) {
  res.sendFile("./public/warehouse.html", {
    root: __dirname,
  });
});
app.get("/store_dhaka", function (req, res) {
  res.sendFile("./public/store.html", {
    root: __dirname,
  });
});
// app.listen(PORT, function () {
//     console.log("server running on port" + PORT);
// });
wss.on("connection", (ws) => {
  ws.id = "Someone COnnected to network" + "NO ID FOUND. CHECK HERE";
  console.log(`${ws.id} Connected`);
  ws.send(JSON.stringify(BlockChain_Meta_info.chain));

  //   ws.on("message", function (message) {
  //     sendAll(JSON.stringify(ReadBlock_ChainData));
  //     console.log("send data");
  //   });
  //ws.send(ReadBlock_ChainData);

  ws.on("message", (data) => {
    //sendAll(data);
    //console.log("this is from client data " + data);
    let parseData = JSON.parse(data);
    console.log(parseData.chain);
    if (parseData.hasOwnProperty("chain")) {
      fs.writeFileSync(
        "./public/block_Data3.json",
        JSON.stringify(parseData)
      );
      console.log("yes");
    }
    //console.log(`Client has sent us Message :${parseData.chatData}`);
  });
});


function sendAll(data) {
  for (let i = 0; i < clients.length; i++) {
    clients[i].send(data);
  }
}

server.listen(process.env.PORT || PORT, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});