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
const student_blockchain = new Blockchain();
fs.writeFileSync('./public/block_Data.json', JSON.stringify(student_blockchain));
console.log(student_blockchain)
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
        root: __dirname
    });
});
app.get("/blockchain", function (req, res) {
    res.send(student_blockchain);
});
app.get("/userI", function (req, res) {
    res.sendFile("./public/userI.html", {
        root: __dirname
    });
});
app.get("/block-explorer", function (req, res) {
    res.sendFile("./Block-explorer/index.html", {
        root: __dirname
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
    var blockIndex = student_blockchain.addTransactionToPendingTransaction(
        newTransaction
    );
    res.json({
        note: "Transaction will be added in block " + blockIndex + ".",
    });
});
app.post("/transaction/broadcast", function (req, res) {
    var course1 = {
        id: req.body.course1,
        grade: req.body.courseGrade1,
    } || "1 null";
    var course2 = {
        id: req.body.course2,
        grade: req.body.courseGrade2,
    } || "2 null";
    var course3 = {
        id: req.body.course3,
        grade: req.body.courseGrade3,
    } || "3 null";
    var newTransaction = student_blockchain.createNewStudentResult(
        req.body.studentName,
        course1,
        course2,
        course3
    );
    student_blockchain.addTransactionToPendingTransaction(newTransaction);
    //makes a promise that will push the new transaction info to other nodes
    var requestPromise = [];
    // gets all the node info from student_blockchain.networkNodes and sends them the transaction info
    // one by one to other nodes
    student_blockchain.networkNodes.forEach(function (networkNodeUrl) {
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
    fs.writeFileSync('./public/block_Data.json', JSON.stringify(student_blockchain));
});

//register and brodcast node to the network
app.post("/register_brodcast_node", function (req, res) {
    //loop that bordcasts this nodes url to all other nodes in the network
    const newNodeUrl = req.body.newNodeUrl;
    // Searches the whole network index of the input index is present or not.
    //if not present return -1 .
    if (student_blockchain.networkNodes.indexOf(newNodeUrl) == -1)
        student_blockchain.networkNodes.push(newNodeUrl);

    const regNodesPromises = [];
    student_blockchain.networkNodes.forEach((networkNodeUrl) => {
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
                        ...student_blockchain.networkNodes,
                        student_blockchain.currentNodeUrl,
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
        student_blockchain.networkNodes.indexOf(newNodeUrl) == -1;
    const NotCurrentNode = student_blockchain.currentNodeUrl !== newNodeUrl;
    if (nodeNoteAlreaadyPresent && NotCurrentNode) {
        student_blockchain.networkNodes.push(newNodeUrl);
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
            student_blockchain.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = student_blockchain.currentNodeUrl !== networkNodeUrl;
        if (nodeNotAlareadyPresent && notCurrentNode)
            student_blockchain.networkNodes.push(networkNodeUrl);
    });
    res.json({
        note: "new node register_node_bulk Successful. ",
    });
});

// consensus
app.get("/consensus", function (req, res) {
    const requestPromises = [];
    student_blockchain.networkNodes.forEach((networkNodeUrl) => {
        const requestOptions = {
            uri: networkNodeUrl + "/blockchain",
            method: "GET",
            json: true,
        };
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises).then((blockchains) => {
        const currentChainLength = student_blockchain.chain.length;
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

        if (!newLongestChain || (newLongestChain && !student_blockchain.chainIsValid(newLongestChain))) {
            res.json({
                note: "Current chain has not been replaced.",
                chain: student_blockchain.chain,
            });
        } else {
            student_blockchain.chain = newLongestChain;
            student_blockchain.pendingTransactions = newPendingTransactions;
            res.json({
                note: "This chain has been replaced.",
                chain: student_blockchain.chain,
            });
        }
    });
});

app.post("/receieve_new_block", function (req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = student_blockchain.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock["index"] + 1 === newBlock["index"];
    if (correctHash && correctIndex) {
        student_blockchain.chain.push(newBlock);
        student_blockchain.PendingTransactions = [];
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
    var LastBlock = student_blockchain.getLastBlock();
    var previousBlockHash = LastBlock["hash"];
    var currentBlockData = {
        transaction: student_blockchain.pending_results,
        index: LastBlock["index"] + 1,
    };
    var nonce = student_blockchain.ProofOfWork(
        previousBlockHash,
        currentBlockData
    );
    var blockHash = student_blockchain.hashBlock(
        previousBlockHash,
        currentBlockData,
        nonce
    );
    //student_blockchain.createNewTransaction(12.5, "00", nodeAddress, "mined added data");
    var newBlock = student_blockchain.createNewBlock(
        nonce,
        previousBlockHash,
        blockHash
    );
    var requestPromises = [];
    // student_blockchain.networkNodes.forEach(function (networkNodeUrl) {
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
    // console.log(student_blockchain.currentNodeUrl);
    // Promise.all(requestPromises)
    //     .then(function (data) {
    //         var requestOptions = {
    //             uri: student_blockchain.currentNodeUrl + "/transaction/broadcast",
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
});

app.get("/block/:blockHash", function (req, res) {
    const blockHash = req.params.blockHash;
    const correctBlock = student_blockchain.getBlock(blockHash);

    res.json({
        block: correctBlock,
        data: "something correctBlock",
    });
});

app.get("/transaction/:transactionId", function (req, res) {
    const transactionId = req.params.transactionId;
    const TransactionData = student_blockchain.getTransactionId(transactionId);
    res.json({
        transaction: TransactionData.transaction,
        block: TransactionData.block,
        //data: "something correctTransactionID",
    });
});

app.get("/address/:address", function (req, res) {
    const address = req.params.address;
    const addressData = student_blockchain.getAddressData(address);
    res.json({
        addressData: addressData,
    });
});

app.listen(PORT, function () {
    console.log("server running on port" + PORT);
});