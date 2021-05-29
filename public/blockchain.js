const sha256 = require("sha256");
const currentNodeUrl = process.argv[3] || "http://localhost:3501";
const {
  v4: uuidv4
} = require("uuid");
const randomWords = require("random-words");

function Blockchain() {
  this.chain = [];
  this.PendingTransactions = [];
  this.ReadyToShip = [];
  // Genesis BLock
  //CHange later to add data
  this.currentNodeUrl = currentNodeUrl;
  console.log("inside blockchain " + currentNodeUrl);
  this.networkNodes = [];
  this.createNewBlock(100, "0", "0", "This is Genesis Block");
}

Blockchain.prototype.createNewBlock = function (
  nonce,
  previousBlockHash,
  hash,
  data
) {
  const newBlock = {
    index: this.chain.length + 1,
    timeStamp: new Date().toLocaleTimeString() + " May 2021",
    transaction: this.PendingTransactions,
    product_info: this.ReadyToShip,
    nonce: nonce,
    hash: hash,
    previousBlockHash: previousBlockHash,
    data: data,
  };
  this.PendingTransactions = [];
  this.ReadyToShip = [];
  this.chain.push(newBlock);

  return newBlock;
};

Blockchain.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1];
};

//creates new transaction onject and pushes it to pending transaction.
//and renturns the number of block it will be added to.
//you should change this later to add data suited to your need instead of $$
Blockchain.prototype.createNewTransaction = function (
  amount,
  sender,
  recipient,
  data
) {
  const newTransaction = {
    amount: amount,
    sender: sender,
    recipient: recipient,
    // data: data || `this data was added at ${new Date().toLocaleTimeString()}` + " ",
    // transactionId: "Administrator Name" || randomWords(5).join("-").toUpperCase(),
  };

  return newTransaction;
};

//Created new student result;
Blockchain.prototype.createNewStudentResult = function (studentName) {
  const newTransaction = {
    // studentName: studentName,
    studentName,
    // data: `this data was added at ${new Date().toLocaleTimeString()}` + " ",
    // transactionId: "Administrator Name" || randomWords(5).join("-").toUpperCase(),
  };

  return studentName;
};

Blockchain.prototype.addTransactionToPendingTransaction = function (
  transactionObj
) {
  this.ReadyToShip.push(transactionObj);
  return this.getLastBlock()["index"] + 1;
};

//this converts the data to fixed size string using sha256
var data_as_string;
Blockchain.prototype.hashBlock = function (
  previousBlockhash,
  currentBlockData,
  nonce
) {
  data_as_string =
    previousBlockhash + nonce.toString() + JSON.stringify(currentBlockData);
  var xd = data_as_string;
  const hash = sha256(data_as_string);
  //console.log("inside hash funtion: " + data_as_string);
  return hash;
};

Blockchain.prototype.ProofOfWork = function (
  previousBlockhash,
  currentBlockData
) {
  let nonce = 0;
  let hash = this.hashBlock(previousBlockhash, currentBlockData, nonce);
  while (hash.substring(0, 4) !== "2021") {
    nonce++;
    hash = this.hashBlock(previousBlockhash, currentBlockData, nonce);
    //console.log(hash);
  }
  //console.log(data_as_string);
  return nonce;
};

Blockchain.prototype.chainIsValid = function (blockChain) {
  let validChain = true;
  for (let i = 1; i < blockChain.length; i++) {
    const currentBlock = blockChain[i];
    const prevBlock = blockChain[i - 1];

    // const blockHash = this.hashBlock(prevBlock['hash'], {
    //         transaction: currentBlock['transactions'],
    //         index: currentBlock['index']
    //     },
    //     currentBlock['nonce']
    // );

    //const blockHash = this.hashBlock(prevBlock['hash'], { transaction: currentBlock['transaction'], index: currentBlock['index'] }, currentBlock['nonce']);
    const blockHash = this.hashBlock(
      prevBlock["hash"], {
        transaction: currentBlock.product_info,
        index: currentBlock.index,
      },
      currentBlock["nonce"]
    );
    if (blockHash.substring(0, 4) !== "2021") {
      console.log("blockHash is not same. its: " + blockHash);
      //console.log("prevBlock['hash'] " + prevBlock['hash'])
      //console.log(currentBlock['nonce'])
      console.log(
        "currentBlock['transaction'] " +
        JSON.stringify(currentBlock["transaction"])
      );
      console.log("currentBlock['index'] " + currentBlock["index"]);
      console.log("prevBlock['hash'] " + prevBlock["hash"]);
      validChain = false;
    } else {
      console.log(" right index number ===" + currentBlock["index"]);
    }
    if (currentBlock["previousBlockHash"] !== prevBlock["hash"]) {
      console.log("2");
      validChain = false;
    }
  }

  //Checks if the genesis Block is correct or not
  const genesisBlock = blockChain[0];
  const correctNone = genesisBlock["nonce"] === 100;
  const corretPreviousBlockHash = genesisBlock["previousBlockHash"] === "0";
  const corrrectHash = genesisBlock["hash"] === "0";
  const correctTransactions = genesisBlock["transaction"].length === 0;
  const corretData = genesisBlock["data"] === "This is Genesis Block";
  if (
    !correctNone ||
    !corretPreviousBlockHash ||
    !corrrectHash ||
    !correctTransactions ||
    !corretData
  ) {
    console.log("correctNone " + correctNone);
    console.log("corretPreviousBlockHash " + corretPreviousBlockHash);
    console.log("corrrectHash " + corrrectHash);
    console.log("correctTransactions " + correctTransactions);
    console.log("corretData " + corretData);

    validChain = false;
  }

  return validChain;
};

Blockchain.prototype.getBlock = function (blockHash) {
  let correctBlock = null;
  this.chain.forEach((block) => {
    if (block.hash === blockHash) {
      correctBlock = block;
    }
  });
  return correctBlock;
};
Blockchain.prototype.getTransactionId = function (transactionId) {
  let correctTransaction = null;
  let correctBlock = null;
  this.chain.forEach((block) => {
    block.transaction.forEach((transaction) => {
      if (transaction.transactionId === transactionId) {
        correctTransaction = transaction;
        correctBlock = block;
      }
    });
  });
  return {
    transaction: correctTransaction,
    block: correctBlock,
  };
};

Blockchain.prototype.getAddressData = function (address) {
  const addressTransaction = [];
  this.chain.forEach((block) => {
    block.transaction.forEach((transaction) => {
      if (transaction.sender === address || transaction.recipient === address) {
        addressTransaction.push(transaction);
      }
    });
  });

  let balance = 0;
  addressTransaction.forEach((transaction) => {
    if (transaction.recipient === address) {
      balance += transaction.amount;
    } else if (transaction.sender === address) {
      balance -= transaction.amount;
    }
  });
  return {
    addressTransaction: addressTransaction,
    addressBalance: balance,
  };
};

module.exports = Blockchain;