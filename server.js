var MONGO_URI='mongodb+srv://namanis:4142mongoose@freecode-alan.1sct0.mongodb.net/freecode-alan?retryWrites=true&w=majority';
// server.js
// where your node app starts

// init project

const express = require('express');
const app = express();
const mongo= require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const dns = require('dns');
const port = process.env.PORT || 3000;

mongoose.set('useNewUrlParser', true);
//mongoose.set('useFindAndModify', false);
//mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
const { hostname } = require('os');
const { exists } = require('fs');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

//http://expressjs.com/en/starter/basic-routing.html

mongoose.connect(MONGO_URI);

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/timestamp", function(req, res){
  res.sendFile(__dirname + '/views/timestamp.html');
});
app.get("/requestHeaderParser", function(req, res){
  res.sendFile(__dirname + '/views/requestHeaderParser.html');
});

app.get("/urlShortenerParser", (req, res)=>{
  res.sendFile(__dirname + '/views/urlShortenerParser.html');
});
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  console.log({greeting: "Hello API"});
  res.json({greeting: 'hello API'});
});

app.get("/api/whoami", function(req, res){
  res.json({
    //"Value": Object.keys(req),
    "ipaddress": req.socket.remoteAddress,
    "language": req.headers["accept-language"],
    "software": req.headers["user-agent"]
    //"req-headers": req.headers
    
});
});

app.get("/api", function(req, res){
  var now = new Date();
  
 res.json({"unix": now.getTime(),
            "utc": now.toUTCString()
});
});

app.get("/api/:date_string", function(req, res){

  let dateString = req.params.date_string;

if (parseInt(dateString) > 10000){
  let unixTime = new Date(parseInt(dateString));
  res.json({
    "unix": unixTime.getTime(),
    "utc":unixTime.toUTCString()
  });
}
  let passDateValue = new Date(dateString);

  if (passDateValue == "Invalid Date" ) {
  res.json({"error": "Invalid Date"});
}
 else 
{ 
  res.json({"unix": passDateValue.getTime(),
            "utc": passDateValue.toUTCString()
})
}
});
// construi um schema e modelo para armazenar url salvada
const ShortURL = mongoose.model('ShortURL', new mongoose.Schema({
  short_url: String,
  original_url: String,
  suffix: String
}));
// analisar applicacao x-www-force-urlencoded
app.use(express.urlencoded({extended : false}));
//analisar aplicacao json
app.use(express.json());

app.post("/api/shorturl", (req, res)=>{
  let client_requested_url = req.body.url;
  let suffix = shortid.generate();
  let newShortURL = suffix;

  let urloriginal= [ client_requested_url];  
//urloriginal = newURL.original_url;

//chechar dns
const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};
  function hostnameExists(hostname) {
    return new Promise((resolve) => {
      dns.lookup(hostname, options, (err,address,family) => resolve({ hostname, exists: !err, address, family}));
 });
    }
  //exibir resuldados do dns
   Promise.all(urloriginal.map(hostnameExists)).then((listOfStatuses) => {
    // check results here
     console.log(listOfStatuses);
  });
  
 
let newURL = new ShortURL({
    short_url:__dirname + "/api/shorturl/" + suffix,
    original_url:urloriginal[0] ,
    suffix: suffix
  })

 newURL.save(( err,doc )=>{
    var rest = newURL.original_url.match( /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i);
      
   if(err || rest==null){
     res.json({error:'invalid url'})
   }
    else {res.json({
      "saved": true,
      "short_url": newURL.short_url,
      "original_url": newURL.original_url,
      "suffix": newURL.suffix
    
    }); 
  }
    
  });
});

app.get("/api/shorturl/:suffix", (req, res)=>{
  let userGeneratedSuffix = req.params.suffix;
  ShortURL.find({suffix: userGeneratedSuffix}).then((foundUrls)=> {
    
    let urlForRedirect = foundUrls[0];
   
    res.redirect(urlForRedirect.original_url);
  });
});
// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
