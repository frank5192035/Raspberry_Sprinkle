//      Main Program for Motor Control
//      by Frank Hsiung

// Loading modules {
var http = require('http');
var fs = require('fs');
var path = require('path');
var b = require('bonescript');
// }----------------------------------------------------------------------------
// set Pins {
var RelayPin = "P9_12";                 // default Relay Pin
b.pinMode('USR0', b.OUTPUT);            // USR0, USR1 are on/off the same as Relay
b.pinMode('USR1', b.OUTPUT);
b.pinMode('USR2', b.OUTPUT);            // USR2 alive toggle with USR3
b.pinMode('USR3', b.OUTPUT);
b.pinMode(RelayPin, b.OUTPUT);          // Relay Pin for Turn ON/OFF Motor
b.digitalWrite(RelayPin, 0);            // turn off motor
b.digitalWrite('USR0', 0);              // turns the LED OFF
b.digitalWrite('USR1', 0);
b.digitalWrite('USR2', 0);
// }----------------------------------------------------------------------------
// Global Variables and Constants {
const ShowerTime = 1200;                // 20 Minutes = 1200 Seconds
var downCounter = 0;                    // Main Counter of Motor ON
var logCounter = 0;                     // for turn on log
var intervalObject;                     // Returns a timeoutObject for possible use with clearTimeout()
// }----------------------------------------------------------------------------
// Initialization {
setTimeout(stateCheckCounter, 1000);    // Initialization for Main State
setTimeout(aliveSignal0, 500);          // Initialization for Toggling LED
// }----------------------------------------------------------------------------


var request = require("request");

request("https://www.kimonolabs.com/api/6ucbaoiy?apikey=lcE98jpR1ZSfMv1hY8eB9cTgEUAnhoTn", 
function(err, response, body) {         // average rain of pass 24 hours
    var rain = JSON.parse(body);
    var rainAverage = (parseFloat(rain.results.Rain[0].mm)+
        parseFloat(rain.results.Rain[1].mm)+parseFloat(rain.results.Rain[2].mm)+
        parseFloat(rain.results.Rain[3].mm))/4;
    console.log(rainAverage);
});






// Initialize the server on port 8888 {
var server = http.createServer(function (req, res) {
    // requesting files
    var file = '.'+((req.url=='/')?'/Grundfos.html':req.url);
    var fileExtension = path.extname(file);
    var contentType = 'text/html';
    // Uncoment if you want to add css to your web page
    // if(fileExtension == '.css') {
    //     contentType = 'text/css';
    // }
    fs.exists(file, function(exists) {
        if(exists){
            fs.readFile(file, function(error, content) {
                if(!error) {
                    res.writeHead(200,{'content-type':contentType}); // Page found, write content
                    res.end(content);
                }
            })
        }
        else {
            res.writeHead(404);         // Page not found
            res.end('Page not found');
        }
    })
}).listen(8888);
// }----------------------------------------------------------------------------
// socket.io Communication {
var io = require('socket.io').listen(server); // Loading socket io module

io.on('connection', function (socket) { // When communication is established
    socket.on('changeState', showerON);
});

server.listen(console.log("Server Running ..."));
// }----------------------------------------------------------------------------
// State Machine and Function Call {
function showerON(data) { // Clent-size signal for reset downCounter to ShowerTime
    var shower = JSON.parse(data);
    if (shower.on == 1) {
        downCounter = ShowerTime;       // set or reset downCounter to ShowerTime
        logCounter++;
        console.log(new Date().getTime() +":  Grundfos Hot Water Pump is the "+ logCounter +"th turn-on"); 
        // XXX: Log
        if (1 == logCounter%2) {        // Key Press Toggle
            b.digitalWrite('USR1', 1);
            b.digitalWrite('USR2', 0);
        } else {
            b.digitalWrite('USR1', 0);
            b.digitalWrite('USR2', 1);
        }
    }
}

function countDown() {
    downCounter--;                      // downcounting 
    // socket.emit('changeState', '{"state":1}'); // pass downCounter value to client
}

function stateCheckCounter() {
    if (downCounter > 180) {            // at least 3 minutes
        b.digitalWrite(RelayPin, 1);    // turn on motor
        b.digitalWrite('USR0', 1);      // turns the LED ON
        intervalObject = setInterval(countDown, 999); // one second interval count down
        setTimeout(stateDownCounting, 1);// state change
    } else {
        setTimeout(stateCheckCounter, 1000);
    }
}

function stateDownCounting() {
    if (downCounter > 0) {
        setTimeout(stateDownCounting, 999);
    } else {
        b.digitalWrite(RelayPin, 0);    // turn off motor
        b.digitalWrite('USR0', 0);      // turns the LED OFF
        b.digitalWrite('USR1', 0);
        b.digitalWrite('USR2', 0);
        clearInterval(intervalObject);
        setTimeout(stateCheckCounter, 1);// state change
    }
}

function aliveSignal0() {               // Two States only
    b.digitalWrite('USR3', 0);
    setTimeout(aliveSignal1, 800);      // Toggle LED
}

function aliveSignal1() {
    b.digitalWrite('USR3', 1);
    setTimeout(aliveSignal0, 200);      // Toggle LED
}
// }