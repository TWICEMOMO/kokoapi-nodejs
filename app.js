var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var router = express.Router();
var Client = require('node-rest-client').Client;
var client = new Client();
var request = require('request');
var urlencode = require('urlencode');
//var parseString=require('paresString');
var paresString = require('xml2js').parseString;
//..var parser = new xml2js.Parser();


var jd;
var wurl;
var answer;
var ans;
var X;
var Y;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/keyboard', function(req, res) { // '/keyboard'
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
    go(whe.lat, whe.lng);
    wurl = 'http://www.kma.go.kr/wid/queryDFS.jsp?gridx=' + X + '&gridy=' + Y;
  });
  setTimeout(()=>{
    resolve({result:wurl});
  },2000);
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
  },1000);
});


app.post('/message', function(req, res) { // '/message'
  const _obj = {
    user_key: req.body.user_key,
    type: req.body.type,
    content: req.body.content
  };
  var city = urlencode(_obj.content);
  var url = 'https://maps.google.com/maps/api/geocode/json?address='+city+APIkey;

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
var go = function(a, b) {
  var RE = 6371.00877; // 지구 반경(km)
  var GRID = 5.0; // 격자 간격(km)
  var SLAT1 = 30.0; // 투영 위도1(degree)
  var SLAT2 = 60.0; // 투영 위도2(degree)
  var OLON = 126.0; // 기준점 경도(degree)
  var OLAT = 38.0; // 기준점 위도(degree)
  var XO = 43; // 기준점 X좌표(GRID)
  var YO = 136; // 기1준점 Y좌표(GRID)
  var DEGRAD = Math.PI / 180.0;
  var re = RE / GRID;
  var slat1 = SLAT1 * DEGRAD;
  var slat2 = SLAT2 * DEGRAD;
  var olon = OLON * DEGRAD;
  var olat = OLAT * DEGRAD;
  var sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  var sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  console.log(sn);
  console.log(sf);
  var ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);
  var ra = Math.tan(Math.PI * 0.25 + (a) * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  var theta = b * DEGRAD - olon;
  if (theta > Math.PI)
    theta -= 2.0 * Math.PI;
  if (theta < -Math.PI)
    theta += 2.0 * Math.PI;
  theta *= sn;
  X = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  Y = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
  console.log(X);
  console.log(Y);
}

app.listen(3000, function() {
  console.log('Connect 3000 port!');
});
