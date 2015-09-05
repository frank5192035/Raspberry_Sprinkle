//      Main Program for Sprinkle
//      by Frank Hsiung

// Loading modules {
var http = require('http');
var fs = require('fs');
// var path = require('path');
var request = require("/usr/local/lib/node_modules/request");

// }----------------------------------------------------------------------------
// set Pins {
// var RelayPin = "P9_12";                 // default Relay Pin
// b.pinMode('USR0', b.OUTPUT);            // USR0, USR1 are on/off the same as Relay
// b.pinMode('USR1', b.OUTPUT);
// b.pinMode('USR2', b.OUTPUT);            // USR2 alive toggle with USR3
// b.pinMode('USR3', b.OUTPUT);
// b.pinMode(RelayPin, b.OUTPUT);          // Relay Pin for Turn ON/OFF Motor
// b.digitalWrite(RelayPin, 0);            // turn off motor
// b.digitalWrite('USR0', 0);              // turns the LED OFF
// b.digitalWrite('USR1', 0);
// b.digitalWrite('USR2', 0);
// }----------------------------------------------------------------------------
// Global Variables and Constants {
const hours = 60*60*1000;
var downCounter = 0;                    // Main Counter of Motor ON
// var intervalObject;                     // Returns a timeoutObject for possible use with clearTimeout()
var accRain = 0.0;                      // Raining accumulation <= 14
var rainAverage;                        // average of 4 rain station
var sunriseHour = 6;                    // for comparison of sunrise time
var sunriseMinute = 0;                  // 
var sunsetHour = 18;                    // for comparison of sunset time
var sunsetMinute = 0;                   // 
var highTemp = 250;                     // Highest Temperature of the day *10
// }----------------------------------------------------------------------------
// Initialization {
// crawlKimono();
// setCounter_Log();
setTimeout(checkSchedule, 1);           // Initialization for Main State
// setTimeout(aliveSignal0, 1);            // Initialization for Toggling LED
setTimeout(crawlKimono, 1);             // Initialization for Kimono network spider
// }----------------------------------------------------------------------------
// Initialize the server on port 8168 {
// var server = http.createServer(function (req, res) {
//     var file = '/var/lib/cloud9/BeagleBone_Motor'+((req.url=='/')?'/Grundfos.html':req.url); // requesting files
//     var contentType = 'text/html';
//             // Uncoment if you want to add css to your web page
//             // var path = require('path');
//             // var fileExtension = path.extname(file);
//             // if(fileExtension == '.css') {
//             //     contentType = 'text/css';
//             // }
//     fs.exists(file, function(exists) {
//         if(exists){
//             fs.readFile(file, function(error, content) {
//                 if(!error) {
//                     res.writeHead(200,{'content-type':contentType}); // Page found, write content
//                     res.end(content);
//                 }
//             })
//         }
//         else {
//             res.writeHead(404);         // Page not found
//             res.end('Page not found');
//         }
//     })
// }).listen(8168,'192.168.0.178');
// }----------------------------------------------------------------------------
// socket.io Communication {
// var io = require('socket.io').listen(server); // Loading socket io module

// io.on('connection', function (socket) { // When communication is established
//     socket.on('pumpON', function(data) {// Clent-size signal for reset downCounter to shower.value
//         var shower = JSON.parse(data);
//         if (shower.on == 1) {
//             downCounter = shower.value; // set or reset downCounter to shower.value
//             logCounter++;
//             console.log(new Date +': Grundfos '+ logCounter +'th turn-on for '+ shower.value +' seconds'); 
//             if (1 == logCounter%2) {    // Two LED for Key Press Toggle
//                 b.digitalWrite('USR1', 1);
//                 b.digitalWrite('USR2', 0);
//             } else {
//                 b.digitalWrite('USR1', 0);
//                 b.digitalWrite('USR2', 1);
//             }
//         } else if (shower.on == 0) downCounter = 1;
        
//     }); // pumpON string from Grundfos.html; shower.on turn on Motor
// });

// server.listen(console.log('Grundfos Server is Running: http://' + getIPAddress() + ':8168'));
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
        // b.digitalWrite(RelayPin, 1);    // turn on motor
        // b.digitalWrite('USR0', 1);      // turns the LED ON
    
        setTimeout(downCounting, 1);    // state change
    }
    var d = new Date();                 // writer Log file
    var record = d.toLocaleTimeString()+': sprinkle '+downCounter+' seconds\n';
    logIt(record);
}

function downCounting() {
    if (downCounter > 0) {
        setTimeout(downCounting, 999);
    } else {
        // b.digitalWrite(RelayPin, 0);    // turn off motor
        // b.digitalWrite('USR0', 0);      // turns the LED OFF
        // b.digitalWrite('USR1', 0);
        // b.digitalWrite('USR2', 0);
        // console.log('\t\tGrundfos Hot Water Pump is the '+ logCounter +'th turn-off'); 
        // clearInterval(intervalObject);
        setTimeout(checkSchedule, 1);   // state change
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
// function aliveSignal0() {               // Two States only
//     b.digitalWrite('USR3', 0);
//     setTimeout(aliveSignal1, 800);      // Toggle LED
// }

// function aliveSignal1() {
//     b.digitalWrite('USR3', 1);
//     setTimeout(aliveSignal0, 200);      // Toggle LED
// }
// }
