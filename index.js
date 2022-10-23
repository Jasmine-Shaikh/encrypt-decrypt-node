const fs = require("fs");
const express = require("express");
const multer = require("multer");
const app = express();
const port = process.env.port || 8000;
const path = require("path");
const crypto = require("crypto");
const bodyParser= require("body-parser")
app.use(bodyParser.urlencoded({extended:true}))
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "documents");
  },
  filename: function (req, file, cb) {
    cb(null, 'file.txt');
  },
});
const upload = multer({ storage: storage }).single("avatar");
const algo = 'AES-256-ECB';

// ----------------------------Encrpytion ----------------------------
const encryptFile = (password) => {
  const cipherKey = crypto.createHash("sha256").update(password).digest();
  const cipher = crypto.createCipheriv(algo, cipherKey, null);
  let readStream = fs.createReadStream("./documents/file.txt");
  let writeStream = fs.createWriteStream("./documents/encrypted.txt.enc");

  
  readStream.pipe(cipher).pipe(writeStream);
  writeStream.on("close", () => {
    console.log("Encryption success!");
  });
 
};

// --------------------------------Decryption -----------------------------------
const decryptFile = (password) => {

  
  const readInitVect = fs.createReadStream("./documents/encrypted.txt.enc", {
    end: 15,
  });

  let initVect;
  readInitVect.on("data", (chunk) => {
    initVect = chunk;
  });

  readInitVect.on("close", () => {
    const cipherKey = crypto
      .createHash("sha256")
      .update(password)
      .digest();
    const readStream = fs.createReadStream("./documents/encrypted.txt.enc");
    const decipher = crypto.createDecipheriv(algo, cipherKey, null);
    let writeStream = fs.createWriteStream("./documents/decrypted.txt");

 
    readStream.pipe(decipher).pipe(writeStream);
    writeStream.on("close", () => {
      console.log("Decryption success!");
    });

  });

};


//--------------------------------Routes----------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});
app.get("/encrypt-download",(req,res)=>{

  res.status(200).sendFile(path.join(__dirname + "/documents/encrypted.txt.enc"));
})
app.get("/decrypt-download",(req,res)=>{

  res.status(200).sendFile(path.join(__dirname + "/documents/decrypted.txt"));
})

app.post("/encryption_complete", upload, function (req, res) {
   
  let password = req.body.password
  console.log(password)
  try { 
    encryptFile(password)
    console.log(path.join(__dirname + "/encrypt.html"))
    res.status(200).sendFile(path.join(__dirname + "/encrypt.html"));
   
    
  } catch (error) {
    console.log(error);
    res.status(400).send("Whoops! Something went wrong!");
  }
});

app.post("/decryption_complete", upload, function (req, res) {
  
  let password = req.body.password
  try {
    decryptFile(password);
    res.status(200).sendFile(path.join(__dirname + "/decrypt.html"));
  } catch (error) {
    process.on('uncaughtException', function (err) {
      console.log('UNCAUGHT EXCEPTION - ', err);

 });
    res.status(400).send(error.message);
  }
});


app.listen(port, () => {
  console.log("SERVER RUNING AT", port);
});
