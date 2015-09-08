//      Main Program for Sprinkle
//      by Frank Hsiung

// Loading modules {
// var http = require('http');
// var path = require('path');
var fs = require('fs');
var request = require('/usr/local/lib/node_modules/request');
var gpio = require('/usr/local/lib/node_modules/onoff').Gpio;
// }----------------------------------------------------------------------------
// set Pins {
var RelayPin = new gpio(18, 'out');     // default Relay Pin
RelayPin.writeSync(1);                  // turn off motor: active low
// }----------------------------------------------------------------------------
// Global Variables and Constants {
const hours = 60*60*1000;
var downCounter = 0;                    // Main Counter of Motor ON
var accRain = 0.0;                      // Raining accumulation <= 14
var rainAverage;                        // average of 4 rain station
var sunriseHour = 6;                    // for comparison of sunrise time
var sunriseMinute = 0;                  // 
var sunsetHour = 18;                    // for comparison of sunset time
var sunsetMinute = 0;                   // 
var highTemp = 250;                     // Highest Temperature of the day *10
// }----------------------------------------------------------------------------
// Initialization {
setTimeout(checkSchedule, 1);           // Initialization for Main State
setTimeout(crawlKimono, 1);             // Initialization for Kimono network spider
// }----------------------------------------------------------------------------
// }----------------------------------------------------------------------------
// State Machine and Function Call {
function crawlKimono() {
    request("https://www.kimonolabs.com/api/6ucbaoiy?apikey=lcE98jpR1ZSfMv1hY8eB9cTgEUAnhoTn", 
    function(err, response, body) {     // average rain of pass 24 hours
        var hsinchu = JSON.parse(body);
        var tt = 0;
        rainAverage = 0;
        for (var i=0; i<4; i++) {
            tt = parseFloat(hsinchu.results.Rain[i].mm);
            if (isNaN(tt)) tt = 0;
            rainAverage += tt;
        }
        rainAverage = Math.round(rainAverage*30) / 100; // 20% higher than average
        if (rainAverage > 14) rainAverage = 14; // maximum setting for rainAverage = 1 week
        if (rainAverage > accRain) accRain = rainAverage
    });
    request("https://www.kimonolabs.com/api/78dba3cq?apikey=lcE98jpR1ZSfMv1hY8eB9cTgEUAnhoTn",
    function(err, response, body) {     // Highest Temperature
        var hsinchu = JSON.parse(body);
        var str = hsinchu.results.Sun[0].temp;
        for (var i=2; i < str.length; i++) { 
          if (str[i] == "~") {
              highTemp = parseInt(str.substring(i+2, str.length))*10; // for down counting second
          }
        }
        if (highTemp > 360) highTemp = 360; // 120~360 Second
        if (highTemp < 120) highTemp = 120;
        
        // console.log('sun error: '+ err);
        str = hsinchu.results.Sun[0].sunrise;
        sunriseHour = parseInt(str.substring(0,2))+1;   // Sprinkle one hour later
        sunriseMinute = parseInt(str.substring(3,5)); 
        str = hsinchu.results.Sun[0].sunset;
        sunsetHour = parseInt(str.substring(0,2))-1;    // Sprinkle before sunset
        sunsetMinute = parseInt(str.substring(3,5));
        var record = new Date()+': '+highTemp+' C, '+rainAverage+' mm, '+sunriseHour+':'+sunriseMinute+', '+sunsetHour+':'+sunsetMinute+'\n';
        logIt(record);
    });
    setTimeout(crawlKimono, 1*hours); // 1 hour period; no other state
}
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
        if (rainAverage < 1) {          // no more raining
            accRain -= 1;               // reduce 1mm each time
        }
        downCounter = 0;                // by pass Sprinkle
        setTimeout(checkSchedule, 1*hours); // avoid state loop
    } else {
        downCounter = Math.floor((highTemp * (1-accRain))); // set downCounter
        accRain = 0;
        RelayPin.writeSync(0);          // turn on motor
        setTimeout(downCounting, 1);    // state change
    }
    var d = new Date();                 // writer Log file
    var record = d.toLocaleTimeString()+': sprinkle '+downCounter+' second(accRain='+accRain+'）\n';
    logIt(record);
}

function downCounting() 
    if (downCounter-- > 0) {
        setTimeout(downCounting, 1000);
    } else {
        RelayPin.writeSync(1);          // turn off motor
        // console.log('\t\tGrundfos Hot Water Pump is the '+ logCounter +'th turn-off'); 
        setTimeout(checkSchedule, 1);   // state change; sprinkle finished
    }
}
// .............................................................................
function logIt(data) {                  // writer Log file out
    fs.open('daily.txt', 'a+', function(err, fd) {
        if (err) {
            return console.error(err);
        }   
        // console.log("File opened successfully!"); 
        fs.appendFile('daily.txt', data,  function(err) {
           if (err) {
                return console.error(err);
           }
        //   console.log("Data written successfully!");
        });
        fs.close(fd, function(err){
            if (err) {
                console.log(err);
            } 
            // console.log("File closed successfully.");
        });
    });
}
// .............................................................................
