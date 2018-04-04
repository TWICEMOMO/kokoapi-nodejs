var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var router = express.Router();
var Client = require('node-rest-client').Client;
var client = new Client();
var request = require('request');
var urlencode = require('urlencode');
var paresString = require('xml2js').parseString;



var jd;
var wurl;
var answer;
var ans;

var calc = require('./tool/mapCalc.js');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/keyboard', function(req, res) {
  let keyboard = {
    "type": "text",
  }
  res.send(keyboard);
});
let A = (url) => new Promise((resolve)=>{
  console.log('A Executed');
  request({
    url: url,
    method: 'GET'
  }, function(error, response, body) {
    console.log('error : ', error);
    console.log(url);
    jd = JSON.parse(response.body);
    console.log(jd);
    var whe = jd.results[0].geometry.location;
    console.log('뀨뀨'+whe);
    console.log('xy좌표');
    calc.mapq(whe.lat,whe.lng);
    var Xpos = calc.returnX();
    var Ypos = calc.returnY();
    wurl = 'http://www.kma.go.kr/wid/queryDFS.jsp?gridx=' + Xpos + '&gridy=' + Ypos;
  });
  setTimeout(()=>{
    resolve({result:wurl});
  },1000);
});

let B = (wurl)=>new Promise((resolve)=>{
  console.log('B Executed');
  console.log(wurl);
  request({
    url: wurl,
    method: 'GET'
  }, function(error, response, body) {
    console.log('error : ', error);
    var data;
    paresString(response.body, function(err, result) {
      data = JSON.stringify(result);
      data = JSON.parse(data);
    })
    console.log(data.wid.body[0].data[0].temp + 1);
    ans = (data.wid.body[0].data[0].temp *1) +2;
    ans +="";
  });
  setTimeout(()=>{
    resolve({result:ans});
  },500);
});


app.post('/message', function(req, res) {
  const _obj = {
    user_key: req.body.user_key,
    type: req.body.type,
    content: req.body.content
  };
  var city = urlencode(_obj.content);
  var url = 'https://maps.google.com/maps/api/geocode/json?address='+city+'&key='+'Apikey';

  A(url)
  .then((data)=> B(data.result))
  .then((data)=> {
    console.log(data);

    answer = {
      "message": {
        "text": ans
      }
    }
    console.log('온도에요'+ans);
    res.send(answer);
  });
  return;
});


app.listen(3000, function() {
  console.log('Connect 3000 port!');
});
