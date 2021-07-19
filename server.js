

// server.js
// where your node app starts

// init project
//const beautifyUnique = require('mongoose-beautiful-unique-validation');
const express = require('express');
const app = express();
const mongo= require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const dns = require('dns');
let multer = require('multer');
const port = process.env.PORT || 3000;
var moment = require('moment'); // require
moment().format(); 
require('dotenv').config();

mongoose.set('useFindAndModify', false);


// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
const { hostname } = require('os');
const { exists } = require('fs');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

//http://expressjs.com/en/starter/basic-routing.html

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }).then(() => {
  console.log('Database connection successful')
}).catch(err => {
    console.error('Cannot connect to mongoDB', err);
  });

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

app.get("/tracker", (req, res)=>{
  res.sendFile(__dirname + '/views/tracker.html');
});

app.get("/filemetadata", (req, res)=>{
  res.sendFile(__dirname + '/views/filemetadata.html');
});
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  console.log({greeting: "Hello API"});
  res.json({greeting: 'hello API'});
});

app.get("/requestHeaderParser/api/whoami", function(req, res){
  res.json({
    //"Value": Object.keys(req),
    "ipaddress": req.socket.remoteAddress,
    "language": req.headers["accept-language"],
    "software": req.headers["user-agent"]
    //"req-headers": req.headers
    
});
});

app.get("/timestamp/api", function(req, res){
  var now = new Date();
  
 res.json({"unix": now.getTime(),
            "utc": now.toUTCString()
});
});

app.get("/timestamp/api/:date_string", function(req, res){

  let dateString = req.params.date_string;
  let passDateValue = new Date(dateString);

if (parseInt(dateString) > 10000){
  let unixTime = new Date(parseInt(dateString));
  res.json({
    "unix": unixTime.getTime(),
    "utc":unixTime.toUTCString(),
    
  });
  return;
}


  if (passDateValue === "Invalid Date" ) {
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

app.post("/urlShortenerParser/api/shorturl", (req, res)=>{
  let client_requested_url = req.body.url;
  let suffix = shortid.generate();
  let newShortURL = suffix;

  let urloriginal= [ client_requested_url];  
//urloriginal = newURL.original_url;

//chechar dns
const options = {
  family: 4,
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
    short_url:__dirname + "/urlShortenerParser/api/shorturl/" + suffix,
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

app.get("/urlShortenerParser/api/shorturl/:suffix", (req, res)=>{
  let userGeneratedSuffix = req.params.suffix;
  ShortURL.find({suffix: userGeneratedSuffix}).then((foundUrls)=> {
    
    let urlForRedirect = foundUrls[0];
   
    res.redirect(urlForRedirect.original_url);
  });
});

// exercise tracker

const exerciseSchema = new mongoose.Schema({
 _id: String,
  description: String,
  duration: Number,
  date: Date
})


const usuarioSchema = new mongoose.Schema({
 username: {type: String, require: true, unique: false},
 log:[exerciseSchema]
  
});

/*exerciseSchema.plugin(beautifyUnique, {
  defaultMessage: "This custom message will be used as the default"
});*/
let Info = mongoose.model('Info', exerciseSchema);
//let InfoAux = mongoose.model('InfoAux', exerciseSchemaAux);
//mongoose.deleteModel('Info');

let Usuario = mongoose.model('Usuario', usuarioSchema);
//mongoose.deleteModel('Usuario');

/* mongoose.model('ExerciseUser', new mongoose.Schema({
  _id: String,
  username: {type: String, unique:true}
  
}));*/

app.get('/tracker/api/users', function(req, res){
  //  let allUsers =ExerciseUser.all()
    //console.log(allUsers);
    Usuario.find({},(err, dados)=>{
      if(!dados){
    res.send("No users")
      }else{
        res.json(dados)
      }
  })
  });

app.post("/tracker/api/users", function(req, res) {
  console.log("Acessing post request");
  //let mongooseGenerateID = mongoose.Types.ObjectId();
 // console.log(mongooseGenerateID, " <=> mongoosegenerateID");
 let username = req.body.username;
 if (!username || username.length === 0) {
   res.json({ error: "Invalid username" });
 }
 
 const user = new Usuario({
    username: username
   //_id: mongooseGenerateID
  });
//console.log(exerciseUser, " <=> exerciseUser");
  user.save((err, dados)=>{
    if(err){
    res.send("username taken")
  } else {
     res.json({
      saved: true,
      username: dados.username,
    _id: dados._id
      })
    }
  })
});

app.post('/tracker/api/users/:_id/exercises', function(req, res){
  let{ _id, description, duration, date } = req.body;
   _id = req.params._id;
   
   if(!date){
  date = new Date();
    }
    
  Usuario.findById(_id, (err, dados)=>{
    if(!dados){
      res.send("usuario desconecido!");
    }else{
      const username = dados.username;
      let info = new Info({ _id, description, duration, date});
  //  _id=  info._id instanceof mongoose.Types.ObjectId;
    
     info.save((err, dados) => {
        if(err){
          console.log(err);
  
        }else{   
          res.json({_id, username, date: new Date(date).toDateString(), duration: +duration, description});
        }
      })
    }
  })
  });

app.get('/tracker/api/users/:_id/logs', function(req, res){
  let {_id, from, to, limit} = req.query;
  _id = req.params._id;
  
  Usuario.findById(_id, (err, dados)=>{

    if(!dados){
      res.send("Usuario desconhecido")
    }else{
      const username = dados.username;
      console.log({"from": from, "to": to , "limit": limit})
      let fromDate = new Date(from);
      fromDate = moment(fromDate).format("YYYY-MM-DD");
      let toDate = new Date(to);
      toDate = moment(toDate).format("YYYY-MM-DD");

      Info.find({_id}, {date: {$gte: fromDate, $lte: toDate}})
      .select(["_id", "description", "duration", "date"])
      .limit(+limit).exec((err, dados)=>{
        let logDados = dados.map(exer=>{
          let formatDate = new Date(exer.date)
            formatDate = moment(formatDate).format("YYYY-MM-DD");
            return {_id: exer._id, description: exer.description, duration: exer.duration, date: formatDate}
        })
        if(!dados){
          res.json({
            "_id": _id,
            "username": username,
            "count":0,
            "log":[]
          })
        }else{
          res.json({
            "_id": _id,
            "username":username,
            "count": dados.length,
            "log": logDados
          })
        }
         
      })
      
    }
  })
});
// Filemetadata

app.post('/filemetadata/api/fileanalyse', multer().single('upfile'),(request, response) =>{
  let responseObject = {}
  responseObject['name'] = request.file.originalname
  responseObject['type'] = request.file.mimetype
  responseObject['size']=request.file.size
  
  response.json(responseObject)
  });



// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
