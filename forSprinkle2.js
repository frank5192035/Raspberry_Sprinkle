//      Main Program for Sprinkle
//      by Frank Hsiung         Sep 20, 2015
//      change to BBB since raspberry pi is unstable on running node
//                              Oct 23, 2015
//      www.kimonolabs.com 不再提供服務，直接從網頁抓資料
//                              Jun 12, 2016 端午假期

// Loading modules {
var b = require('bonescript');
var fs = require('fs');
var request = require('request');
var cheerio = require("cheerio");
// }----------------------------------------------------------------------------
// set Pins {
var RelayPin = 'P9_12';                 // default Relay Pin
b.pinMode(RelayPin, b.OUTPUT);          // Relay Pin for Turn ON/OFF Motor
b.digitalWrite(RelayPin, 1);            // turn off motor; for low active relay

b.pinMode('USR0', b.OUTPUT);            // USR0, USR1 are on/off the same as Relay
b.pinMode('USR1', b.OUTPUT);
b.pinMode('USR2', b.OUTPUT);            // USR2 alive toggle with USR3
b.pinMode('USR3', b.OUTPUT);
b.digitalWrite('USR0', 0);              // turns the LED OFF
b.digitalWrite('USR1', 0);
b.digitalWrite('USR2', 0);
// }----------------------------------------------------------------------------
// Global Variables and Constants {
const hours = 60*60*1000;
var downCounter = 0;                    // Main Counter of Motor ON
var accRain = 0.0;                      // Raining accumulation <= 14
var rainAverage;                        // average of 4 rain station
var sunriseHour = 6;                    // for comparison of sunrise time
var sunriseMinute = 0;                  // 日出後一小時灑水
var sunsetHour = 23;                    // for comparison of sunset time
var sunsetMinute = 52;                   // 日落前一小時灑水
var highTemp = 250;                     // Highest Temperature of the day *10
// }----------------------------------------------------------------------------
// Initialization {
setTimeout(checkSchedule, 1);           // 20秒檢查一次灑水時間
// setTimeout(CrawCWB, 1);                 // 15分鐘爬一次中央氣象局網頁
setTimeout(aliveSignal0, 1);            // Initialization for Toggling LED; 主機是否當機
// }----------------------------------------------------------------------------
// State Machine and Function Call {
function CrawCWB() {
    // var record;
    // // 新竹市雨量
    // var uri = "http://www.cwb.gov.tw/V7/observe/rainfall/Rain_Hr/4.htm";
    // request({url: uri, method: "GET"}, function(error, response, body) {
    //     if (error || !body) {
    //         console.log(error);
    //         record = new Date()+': network error, bypass this hour\n';
    //         logIt(record);
    //         return;
    //     }
    //     if (response.statusCode == 200) {
    //         var $ = cheerio.load(body); // 用 cheerio 解析 html 資料
    //         var rain = $('font', 'tbody').map(function(i, el) {
    //             return $(this).text();
    //         }).get();   // www.npmjs.com/package/cheerio 的sample code
    //         rainAverage = 0;
    //         for (var i=24; i<106; i=i+27) {
    //             if (!isNaN(rain[i])) rainAverage += parseFloat(rain[i]);
    //         }
    //         rainAverage = Math.round(rainAverage*30) / 100; // 20% higher than average
    //         if (rainAverage > 14) rainAverage = 14;         // maximum setting for rainAverage = 1 week
    //         if (rainAverage > accRain) accRain = rainAverage;
    //     // console.log(  rain[24],rain[51],rain[78],rain[105], rainAverage, accRain  );
    //     }
    // });

    // // 新竹市日出日落
    // uri = "http://www.cwb.gov.tw/V7/forecast/taiwan/Hsinchu_City.htm";
    // request({url: uri, method: "GET"}, function(error, response, body) {
    //     if (error || !body) {
    //         console.log(error);
    //         return;
    //     }
    //     if (response.statusCode == 200) {
    //         var $ = cheerio.load(body); // 用 cheerio 解析 html 資料
    //         // 有3個table, 最高溫在1st個table
    //         var sun = $("table.FcstBoxTable01");
    //         var tt = sun.eq(0).map(function(i, el) {
    //             return $(this).text();
    //         }).get().join(' ');         // 不加空白或逗號，輸出會連載一起
    //         tt = tt.split(' ~ ');       // 切開成Array
    //         highTemp = parseInt(tt[1].slice(0,2), 10); // 當日最高溫切出來
    //         if ( (highTemp < 12) || isNaN(highTemp) ) highTemp = 12;
    //         if (highTemp >36) highTemp = 36;
    //         highTemp = highTemp * 10;
    //         if (highTemp > 360) highTemp = 360; // 120~360 Second
    //         if (highTemp < 120) highTemp = 120;
    //     // console.log(highTemp);

    //         // 日出和日落在3rd個table
    //         tt = sun.eq(2).map(function(i, el) {
    //             return $(this).text();
    //         }).get().join(' ');
    //         tt = tt.split('新竹\n\t');  // 切開成Array
    //         tt = tt[1].split('\n\t');   // 切開成Array
    //         sunriseHour = parseInt(tt[0].substring(0,2), 10);
    //         sunriseMinute = parseInt(tt[0].substring(3,5), 10);
    //         sunsetHour = parseInt(tt[1].substring(0,2), 10);
    //         sunsetMinute = parseInt(tt[1].substring(3,5), 10);
    //     // console.log(sunriseHour, sunriseMinute, sunsetHour, sunsetMinute);
    //         record = new Date()+': '+highTemp+' C, '+rainAverage+' mm, '+sunriseHour+':'+sunriseMinute+', '+sunsetHour+':'+sunsetMinute+'\n';
    //         logIt(record);
    //     }
    // });

    // // 15 minutes period; no other state
    // setTimeout(CrawCWB, 15*60*1000); 
}
// }
// .............................................................................
function checkSchedule() {
    var d = new Date();                 // get present time
    var hour = d.getHours();
    var minute = d.getMinutes();
    if (((sunriseHour == hour) && (sunriseMinute == minute)) ||
        ((sunsetHour  == hour) && (sunsetMinute  == minute))) {
        setTimeout(setCounter_Log, 1);
    } else setTimeout(checkSchedule, 20000); // 20 seconds cycle
}

function setCounter_Log() {             // one-time state; only enter once
    if (accRain >= 1) {                 // check raining status
        accRain -= 1;                   // reduce 1mm each time
        setTimeout(checkSchedule, 1*hours); // avoid state loop
    } else {
        downCounter = Math.floor((highTemp * (1-accRain))); // set downCounter
        accRain = 0;
        b.digitalWrite(RelayPin, 0);    // turn on motor
        setTimeout(downCounting, 1);    // state change
    }
    var d = new Date();                 // writer Log file
    var record = d+': sprinkle '+downCounter+' second(accRain='+accRain+'）\n';
    // var record = d.toLocaleTimeString()+': sprinkle '+downCounter+' second(accRain='+accRain+'）\n';
    logIt(record);
}

function downCounting() {
    if (downCounter-- > 0) {
        setTimeout(downCounting, 1000);
    } else {
        downCounter = 0;                // else downCounter=-1 will remain its value
        b.digitalWrite(RelayPin, 1);    // turn off motor
        setTimeout(checkSchedule, 1*hours); // state change; sprinkle finished
    }
}
// .............................................................................
function logIt(data) {                  // writer Log file out
    fs.open('daily.txt', 'a+', function(err, fd) {
        if (err) {
            return console.error(err);
        }
        fs.appendFile('daily.txt', data,  function(err) {
          if (err) {
                return console.error(err);
          }
        });
        fs.close(fd, function(err){
            if (err) {
                console.log(err);
            }
        });
    });
}
// }............................................................................
function aliveSignal0() {               // Two States only
    b.digitalWrite('USR3', 0);
    setTimeout(aliveSignal1, 1800);     // Toggle LED
}

function aliveSignal1() {
    b.digitalWrite('USR3', 1);
    setTimeout(aliveSignal0, 200);      // Toggle LED
}

