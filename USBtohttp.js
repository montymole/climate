var SerialPort = require("serialport").SerialPort,
    port = new SerialPort("/dev/ttyUSB0", {
        baudrate: 9600
    }),
    http = require('http');

port.on('open', () => {
    console.log('Serial Port ->');
    var server = http.createServer((req, res) => {
        port.pipe(res);
    });
    server.listen(8000);
    console.log('listening at localhost:8000');
});

