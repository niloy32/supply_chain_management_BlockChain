const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain.js");
const rp = require("request-promise");
const { v4: uuidv4 } = require("uuid");
const bitcoin = new Blockchain();
const port = process.argv[2];
const nodeAdress = uuidv4().split("-").join("");

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

// get entire
app.get("/blockchain", function (req, res) {
  res.send(bitcoin);
});

// create a new transaction
app.post("/transaction", function (req, res) {
  const newTransaction = req.body;
  const blockIndex = bitcoin.addTransactionToPendingTransaction(newTransaction);
  res.json({
    note: `Transaction will be added in block ${blockIndex}.`,
  });
});

app.post("/transaction/broadcast", function (req, res) {
  const newTransaction = bitcoin.createNewTransaction(
    req.body.amount,
    req.body.sender,
    req.body.recipient,
    req.body.data
  );
  bitcoin.addTransactionToPendingTransaction(newTransaction);
  //makes a promise that will push the new transaction info to other nodes
  const requestPromise = [];
  // gets all the node info from bitcoin.networkNodes and sends them the transaction info
  // one by one to other nodes
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOption = {
      uri: networkNodeUrl + "/transaction",
      method: "POST",
      body: newTransaction,
      json: true,
    };
    requestPromise.push(rp(requestOption));
  });
  Promise.all(requestPromise).then((data) => {
    res.json({
      note: "transaction created and broadcasted successfully",
    });
  });
});

app.get("/mine", function (req, res) {
  const LastBlock = bitcoin.getLastBlock();
  const previousBlockHash = LastBlock["hash"];

  const currentBlockData = {
    transaction: bitcoin.PendingTransactions,
    index: LastBlock["index"] + 1,
  };

  const nonce = bitcoin.ProofOfWork(previousBlockHash, currentBlockData);
  const blockHash = bitcoin.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );

  //bitcoin.createNewTransaction(12.5, "00", nodeAdress, "mined added data");
  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

  const requestPromises = [];
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + "/receieve_new_block",
      method: "POST",
      body: {
        newBlock: newBlock,
      },
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
    .then((data) => {
      const requestOptions = {
        uri: bitcoin.currentNodeUrl + "/transaction/broadcast",
        method: "POST",
        body: {
          amount: 12.5,
          sender: "00",
          recipient: nodeAdress,
          data: "data from mined from node",
        },
        json: true,
      };
      return rp(requestOptions);
    })
    .then((data) => {
      res.json({
        note: "new block mined && broadcasted successful",
        block: newBlock,
      });
    });
});

app.post("/receieve_new_block", function (req, res) {
  const newBlock = req.body.newBlock;
  const lastBlock = bitcoin.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock["index"] + 1 === newBlock["index"];
  if (correctHash && correctIndex) {
    bitcoin.chain.push(newBlock);
    bitcoin.PendingTransactions = [];
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

//register and brodcast node to the network
app.post("/register_brodcast_node", function (req, res) {
  //loop that bordcasts this nodes url to all other nodes in the network
  const newNodeUrl = req.body.newNodeUrl;
  // Searches the whole network index of the input index is present or not.
  //if not present return -1 .
  if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1)
    bitcoin.networkNodes.push(newNodeUrl);

  const regNodesPromises = [];
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
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
          allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl],
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
    bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
  const NotCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
  if (nodeNoteAlreaadyPresent && NotCurrentNode) {
    bitcoin.networkNodes.push(newNodeUrl);
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
      bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
    if (nodeNotAlareadyPresent && notCurrentNode)
      bitcoin.networkNodes.push(networkNodeUrl);
  });
  res.json({
    note: "new node register_node_bulk Successful. ",
  });
});

// consensus
app.get("/consensus", function (req, res) {
  const requestPromises = [];
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + "/blockchain",
      method: "GET",
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises).then((blockchains) => {
    const currentChainLength = bitcoin.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newPendingTransactions = null;
    console.log("requestPromises : " + JSON.stringify(requestPromises));
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
      (newLongestChain && !bitcoin.chainIsValid(newLongestChain))
    ) {
      res.json({
        note: "Current chain has not been replaced.",
        chain: bitcoin.chain,
      });
    } else {
      bitcoin.chain = newLongestChain;
      bitcoin.pendingTransactions = newPendingTransactions;
      res.json({
        note: "This chain has been replaced.",
        chain: bitcoin.chain,
      });
    }
  });
});

// sends data :(data) like this and return hash, future note : use data to add something
app.get("/block/:blockHash", function (req, res) {
  const blockHash = req.params.blockHash;
  const correctBlock = bitcoin.getBlock(blockHash);
  res.json({
    block: correctBlock,
    data: "something correctBlock",
  });
});

app.get("/transaction/:transactionId", function (req, res) {
  const transactionId = req.params.transactionId;
  const TransactionData = bitcoin.getTransactionId(transactionId);
  res.json({
    transaction: TransactionData.transaction,
    block: TransactionData.block,
    //data: "something correctTransactionID",
  });
});

app.get("/address/:address", function (req, res) {
  const address = req.params.address;
  const addressData = bitcoin.getAddressData(address);
  res.json({
    addressData: addressData,
  });
});

app.get("/block-explorer", function (req, res) {
  res.sendFile("./Block-explorer/index.html", { root: __dirname });
});

// app.listen(process.env.PORT, function () {
//   console.log(`listening to port ${port}...`);
// });

//"test": "echo \"Error: no test specified\" && exit 1",

app.listen(process.env.PORT, function () {
  console.log(`listening to port ${process.env.PORT}...`);
});
