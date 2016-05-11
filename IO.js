var config = require('./environment.json'),
    SerialPort = require("serialport").SerialPort,
    net = require('net');

module.exports = IO = {
    log: console.log,
    error: console.error,
    sensPort: new SerialPort(config.ARDUINO_SENS_DEV),
    ctrlPort: new SerialPort(config.ARDUINO_CTRL_DEV),
    onData: null,
    socket: null,
    tcpServer: null,
    createTCPServer() {
        IO.tcpServer = net.createServer(socket => {
            IO.socket = socket;
            IO.log('CONNECTED:', socket.remoteAddress, socket.remotePort);
            socket.on('data', data => {
                IO.log('CMD:', socket.remoteAddress, socket.remotePort, data);
                IO.sendCmd(data);
            });
            socket.on('error', err => error);
            socket.on('close', data => {
                IO.log('CLOSED:', socket.remoteAddress, socket.remotePort);
            });
        })
    },
    toDataStream(data) {
        if (IO.tcpServer && IO.socket) {
            IO.log('TO TCP', data.toString('utf8'));
            IO.socket.write(data);
        }
        if (IO.onData) {
            IO.onData(data);
        }
    },
    sendCmd(cmd) {
        IO.ctrlPort.write(cmd + '\n');
    },
    init(opts) {
        if (opts) {
            if (opts.log) {
                IO.log = opts.log;
            }
            if (opts.error) {
                IO.error = opts.error;
            }
            if (opts.TCP) {
                IO.createTCPServer();
                IO.tcpServer.listen(config.TCP_SERVER_PORT, '127.0.0.1');
            }
            if (opts.onData) {
                IO.onData = opts.onData;
            }
        }
        IO.sensPort.on("open", () => {
            IO.log('OPEN SENSOR:', config.ARDUINO_SENS_DEV);
        });
        IO.sensPort.on('data', IO.toDataStream);
        IO.ctrlPort.on("open", () => {
            IO.log('OPEN CONTROL:', config.ARDUINO_CTRL_DEV);
        });
        IO.ctrlPort.on('data', IO.toDataStream);
    }
}