var CMD_BYTE_LED_ON = 4,
    CMD_BYTE_LED_OFF = 5;

var net = require('net'),
    i = 0;

var client = new net.Socket();
client.connect(1336, '127.0.0.1', function() {
    console.log('Connected');
    setInterval(() => {
        i = i ? 0 : 1;
        if (i) {
            client.write(CMD_BYTE_LED_ON + '\n');
        } else {
            client.write(CMD_BYTE_LED_OFF + '\n');
        }
    }, 5000);
});

client.on('data', function(data) {
    console.log('Client received: ', data.toString('utf8'));
//client.destroy(); // kill client after server's response
});

client.on('end', function() {
    console.log('client disconnected');
});

client.on('close', function() {
    console.log('Connection closed');
});