const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const router = express.Router();
const Client = require('node-rest-client').Client;
const client = new Client();
const request = require('request');
const urlencode = require('urlencode');
const paresString = require('xml2js').parseString;
const calc = require('./tool/mapCalc.js');

let jd;
let wurl;
let answer;
let ans;
let whe;
const arr=[];
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

app.post('/message', function(req, res) {
  const _obj = {
    user_key: req.body.user_key,
    type: req.body.type,
    content: req.body.content
  };
  console.log(_obj.content);
  if(_obj.content=='독도') arr[4]='독도는 대한민국 땅입니다.\n';
  else arr[4]=_obj.content+'를 찾을 수 없습니다\n';
  var city = urlencode(_obj.content);

  var url = 'https://maps.google.com/maps/api/geocode/json?address='+city+'&key=APIkey';
  A(url)
  .then(data=> B(data.result))
  .then(data=> {
    answer = {
      "message": {
        "text": ans
      }
    }
    res.send(answer);})
    .catch(function(){
      answer = {
        "message": {
          "text": arr[4]+'1. 서울강서\n2. 청주서원구\n3. 청주시서원구\n4. 단양군 도전리\n5. 안산고잔동\n등 형식으로 입력주세요.\n입력이 틀릴시 원하는 정보를 얻지 못할 수 있습니다.\n추가기능 or 에러발생시\n상담원톡해주세요~!\n※해외날씨버그로인해중단'
        }
      }
      res.send(answer);
    });
});

let A = (url) => new Promise((resolve, reject)=>{
  console.log('A Executed');
  request({
    url: url,
    method: 'GET'
  }, function(error, response, body) {
    console.log('error : ', error);
    jd = JSON.parse(response.body);
    console.log(jd.results[0]);
    if(jd.status=='ZERO_RESULTS') whe=-1;
    else{
      for(var i =0; i<jd.results[0].address_components.length;i++){
          if(jd.results[0].address_components[i].short_name =='KR'){
            whe = jd.results[0].geometry.location;
            calc.mapq(whe.lat,whe.lng);
            var Xpos = calc.returnX();
            var Ypos = calc.returnY();
            console.log(Xpos);
            console.log(Ypos);
            wurl = 'http://www.kma.go.kr/wid/queryDFS.jsp?gridx=' + Xpos + '&gridy=' + Ypos;
            arr[3]=jd.results[0].formatted_address.substring(5,jd.results[0].formatted_address.length)+'\n';
            break;
          }
          else whe=-1;
      }
    }
  });
  setTimeout(()=>{
    if(whe!=-1) resolve({result:wurl});
    else reject({result:new Error("fail")})
  },1200);
});

let B = (wurl)=>new Promise((resolve)=>{
  console.log('B Executed');
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
    arr[0] = '\n ~ '+(data.wid.body[0].data[0].hour*1)%24+'시 예보\n날씨 : '+ data.wid.body[0].data[0].wfKor+'\n기온 : '+data.wid.body[0].data[0].temp+'℃\n습도 : '+data.wid.body[0].data[0].reh+'%\n강수확률 : '+data.wid.body[0].data[0].pop+'%\n\n';
    arr[1] = (data.wid.body[0].data[0].hour*1)%24+' ~ '+(data.wid.body[0].data[1].hour*1)%24+'시 예보\n날씨 : '+ data.wid.body[0].data[1].wfKor+'\n기온 : '+data.wid.body[0].data[1].temp + '℃\n습도 : '+data.wid.body[0].data[1].reh+'%\n강수확률 : '+data.wid.body[0].data[1].pop+'%\n\n';
    arr[2] = (data.wid.body[0].data[1].hour*1)%24+' ~ '+(data.wid.body[0].data[2].hour*1)%24+'시 예보\n날씨 : '+ data.wid.body[0].data[2].wfKor+'\n기온 : '+data.wid.body[0].data[2].temp+ '℃\n습도 : '+data.wid.body[0].data[2].reh+'%\n강수확률 : '+data.wid.body[0].data[2].pop+'%';
    ans=arr[3]+arr[0]+arr[1]+arr[2];
  });
  setTimeout(()=>{
    resolve({result:ans});
  },500);
});

app.listen(3000, function() {
  console.log('Connect 3000 port!');
});
