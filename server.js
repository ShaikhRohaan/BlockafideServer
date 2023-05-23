const express = require('express');

var mysql = require('mysql');
var bodyParser = require('body-parser');
var cors = require('cors');
const res = require('express/lib/response');
const port = process.env.PORT || 8080;
const qr = require("qrcode");
const { name } = require('ejs');
// app.set("view engine", "ejs");
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// var request = require('request');
var app = express();
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
//transfer nft
require('dotenv').config();
const { createAlchemyWeb3 } = require('@alch/alchemy-web3');
const { isValidAddress } = require('ethereumjs-util');

const contractABI = require('./contractAbi');

var app = express();
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'rohan',
    password: 'rohanlocalhost',
    database: 'scd101'
});

connection.connect();
console.log("Connect");

app.get('/registerexist', async function (req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
    connection.query(`select * from registration where email='${req.query.email}' or phone='${req.query.phone}'`, function (err, result) {
        if (err) throw err;
        res.send(result);
    })
})

app.get('/login',async function (req,res){
  res.setHeader('Access-Control-Allow-Origin', '*');
    connection.query(`select * from registration where email='${req.query.email}' and password='${req.query.password}'`, function (err, result) {
    if (err) throw err;
    res.send(result);
  });
})

//forgetpswrd
app.get('/forgetpswrd',async function (req,res){
  res.setHeader('Access-Control-Allow-Origin', '*');
    connection.query(`select * from registration where email='${req.query.email}'`, function (err, result) {
    if (err) throw err;
    res.send(result);
  });
})

//contact us
app.post('/contactus', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let record = {
      name : req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      subject: req.body.subject,
      yourmsg: req.body.msg,
  };
  let sql = "INSERT INTO contacus SET ?";
  console.log("successfully inserted");
  //alert for showing that record is inserted
  connection.query(sql, record, (err) => {
      if (err) throw err;
      // console.log(err);
      res.end();
  });
})

app.post('/changpswrd', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const newpswrd = req.body.newpswrd;
  const user =req.body.user;

connection.query(`UPDATE registration SET password=${newpswrd} where email='${user}'`,function (err,result) {
  if (err) throw err;
  // console.log(err);
  res.end();

})
});

app.post('/register', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let record = {
      name : req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
  };
  let sql = "INSERT INTO registration SET ?";
  console.log("successfully inserted");
  connection.query(sql, record, (err) => {
      if (err) throw err;
      // console.log(err);
      res.end();
  });
})

app.post('/buynft', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let record = {
        token_id : req.body.tokenid,
        token_address: req.body.tokenad,
        nft_name: req.body.nftname,
        description: req.body.desc,
        nft_price: req.body.price,
        nft: req.body.img,
        owner_of:req.body.owner,
    };
    console.log(record.token_id);
    console.log(record.token_address);

    let sql = "INSERT INTO buynfts SET ?";
    console.log("successfully inserted");
    connection.query(sql, record, (err) => {
        if (err) throw err;
        // console.log(err);
        res.end();
    });
})

app.get('/displaynft', async function (req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
    connection.query(`select * from buynfts where nft_status='sell'`, function (err, result) {
        if (err) throw err;
        res.send(result);
    })
})

app.post('/updatenft', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const startAtTokenId = req.body.tokenid
    const NFT_CONTRACT_ADDRESS = req.body.caddress
     const add= req.body.rcvwlt;
    // const ADDRESS_LIST.add;
    //run kru?
    const ADDRESS_LIST = [];
    ADDRESS_LIST.push(add);
    console.log(ADDRESS_LIST.push(add));
    console.log(req.body.rcvwlt);


    console.log(ADDRESS_LIST.address);
    const { API_URL, PUBLIC_KEY, PRIVATE_KEY } = process.env;
    const web3 = createAlchemyWeb3(API_URL);
    let initialNonce = null;
    
    const sendSignedTransaction = (signedTx) =>
      new Promise((resolve, reject) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction, (err, hash) => {
          if (!err) {
            console.log(
              'The hash of your transaction is: ',
              hash,
              "\nCheck Alchemy's Mempool to view the status of your transaction!",
            );
            return resolve(hash);
          }
    
          console.log(
            'Something went wrong when submitting your transaction:',
            err,
          );
          return reject(err);
        });
      });
    
    const transferNFT = async (toAddress, tokenId, index) => {
      const nftContract = new web3.eth.Contract(contractABI, NFT_CONTRACT_ADDRESS);
      
      if (!initialNonce) {
        initialNonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); // get latest nonce
      }
      
      const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); // nonce starts counting from 0 // nonce starts counting from 0
    console.log(nonce ," nonce")
      const tx = {
        from: PUBLIC_KEY,
        to: NFT_CONTRACT_ADDRESS,
        gas: 500000,
        nonce,
        maxPriorityFeePerGas: 2999999987,
        value: 0,
        data: nftContract.methods
          .transferFrom(PUBLIC_KEY, toAddress, tokenId)
          .encodeABI(),
      };
    
      const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    
      const hash = await sendSignedTransaction(signedTx);
      return hash;
    };
    
    const main = async () => {
      if (!ADDRESS_LIST || !ADDRESS_LIST.length || !Array.isArray(ADDRESS_LIST)) {
        console.log('Invalid ADDRESS_LIST, must be an array');
        process.exit(1);
      }
    
      let hasInvalidAddresses = false;
      const invalidAddressList = [];
    
      ADDRESS_LIST.forEach((address) => {
        if (!address || !isValidAddress(address)) {
          hasInvalidAddresses = true;
          invalidAddressList.push(address);
        }
      });
    
      if (hasInvalidAddresses) {
        console.log('Has invalid addresses =>', invalidAddressList);
        process.exit(1);
      }
    
      const result = [];
    
      try {
        for (let index = 0; index < ADDRESS_LIST.length; index++) {
          try {
            const address = ADDRESS_LIST[index];
            const tokenId = index + startAtTokenId; 
    
            const transactionID = await transferNFT(address, tokenId, index);
            const time = new Date().toLocaleString();
    
            result.push({
              address,
              time,
              transactionID,
              tokenId,
            });
            console.log(result);
          } catch (error) {
            console.log('Error inside the for loop:', error);
          }
        }
      } catch (error) {
        console.log('Error:', error);
        process.exit(1);
      }
    };
    
    main();

    connection.query(`UPDATE buynfts SET nft_status='sold' where token_id='${startAtTokenId}'`,function (err,result) {
        if (err) throw err;
        // console.log(err);
        res.end();
    });
})

//port
app.listen(port, () =>{
    console.log('server is running');
})
const PORT = 3000

app.listen(PORT, () => console.log(`Server working on: ${PORT}`))


