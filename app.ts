var express = require("express");
const app = express();
const PORT = 3500 || process.env.PORT;
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const passport = require("passport");
const bcrypt = require("bcrypt");
const initializePassport = require("./passport-config");
const rp = require("request-promise");
const Blockchain = require("./public/blockchain.js");
var ReadUsersList: any = fs.readFileSync("./public/users.json");
const { v4: uuidv4 } = require("uuid");
const nodeAddress = uuidv4().split("-").join("");
var users = JSON.parse(ReadUsersList);
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
//Initializes new BlockChain
const student_blockchain = new Blockchain();

initializePassport(
  passport,
  (name: any) => users.find((user: any) => user.name === name),
  (password: any) => users.find((user: any) => user.password === password)
);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req: any, res: any) => {});

app.get("/login", (req: any, res: any) => {
  res.sendFile("./public/index.html", { root: __dirname });
});

app.get("/blockchain", (req: any, res: any) => {
  res.send(student_blockchain);
});
app.get("/userI", (req: any, res: any) => {
  res.sendFile("./public/userI.html", { root: __dirname });
});

//BLOCK CHAIN FUNCTIONS

app.post("/transaction", function (req: any, res: any) {
  const newTransaction = req.body;
  const blockIndex = student_blockchain.addTransactionToPendingTransaction(
    newTransaction
  );
  res.json({
    note: `Transaction will be added in block ${blockIndex}.`,
  });
});

app.post("/transaction/broadcast", function (req: any, res: any) {
  var course1 =
    {
      id: req.body.course1,
      grade: req.body.courseGrade1,
    } || "1 null";
  var course2 =
    {
      id: req.body.course2,
      grade: req.body.courseGrade2,
    } || "2 null";
  var course3 =
    {
      id: req.body.course3,
      grade: req.body.courseGrade3,
    } || "3 null";
  const newTransaction = student_blockchain.createNewStudentResult(
    req.body.studentName,
    course1,
    course2,
    course3
  );
  student_blockchain.addTransactionToPendingTransaction(newTransaction);
  //makes a promise that will push the new transaction info to other nodes
  const requestPromise: any = [];
  // gets all the node info from student_blockchain.networkNodes and sends them the transaction info
  // one by one to other nodes
  student_blockchain.networkNodes.forEach((networkNodeUrl: any) => {
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

app.get("/mine", function (req: any, res: any) {
  console.log("Mining");
  const LastBlock = student_blockchain.getLastBlock();
  const previousBlockHash = LastBlock["hash"];

  const currentBlockData = {
    transaction: student_blockchain.PendingTransactions,
    index: LastBlock["index"] + 1,
  };

  const nonce = student_blockchain.ProofOfWork(
    previousBlockHash,
    currentBlockData
  );
  const blockHash = student_blockchain.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );

  //student_blockchain.createNewTransaction(12.5, "00", nodeAddress, "mined added data");
  const newBlock = student_blockchain.createNewBlock(
    nonce,
    previousBlockHash,
    blockHash
  );

  const requestPromises: any = [];
  student_blockchain.networkNodes.forEach((networkNodeUrl: any) => {
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
        uri: student_blockchain.currentNodeUrl + "/transaction/broadcast",
        method: "POST",
        body: {
          studentName: "asd",
          course1: "asd",
          course2: "asd",
          course3: "asd",
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

app.listen(PORT, () => {
  console.log("server running on port" + PORT);
});
