//      Main Program for oneShot
//      直接灑水6分鐘
//      by Frank Hsiung         Jun 19, 2016

var b = require('bonescript');

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

var downCounter = 360;                    // Main Counter of Motor ON

function downCounting() {
    if (downCounter-- > 0) {
        setTimeout(downCounting, 1000);
    } else {
        downCounter = 0;                // else downCounter=-1 will remain its value
        b.digitalWrite(RelayPin, 1);    // turn off motor
    }
}
downCounting();
