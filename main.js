var config = require('./environment.json'),
    moment = require('moment'),
    //db = require('./lib/db'),
    // UI = require('./lib/ui'),
    io = require('./lib/io'),
    web = require('./lib/web'),
    G = require('./lib/g');

var controls = {
    'PSU': {
        alias: 'Power supply',
        toggle: 0
    },
    'LED': {
        alias: 'Led',
        toggle: 1

    },
    'RELAY1': {
        alias: 'not in use',
        toggle: 1
    },
    'RELAY2': {
        alias: 'not in use',
        toggle: 1
    },
    'RELAY3': {
        alias: 'Lights',
        toggle: 1
    },
    'RELAY4': {
        alias: 'Fans',
        toggle: 1
    }
};

var cmd = {
    PSU_ON: 2,
    PSU_OFF: 3,
    LED_ON: 4,
    LED_OFF: 5,
    RELAY1_ON: 6,
    RELAY1_OFF: 7,
    RELAY2_ON: 8,
    RELAY2_OFF: 9,
    RELAY3_ON: 10,
    RELAY3_OFF: 11,
    RELAY4_ON: 12,
    RELAY4_OFF: 13
};

G.updateWeather();

io.init({
    TCP: false,
    onData: (data) => {
        var d = data.toString("utf8").split('='),
            now = new Date().getTime(),
            key = d[0].split(' ').join(''),
            value = Number(d[1]);
        if (controls[key]) {
            //it's a control
            controls[key].status = value;
            controls[key].toggle = value ? 0 : 1;
        } else {
            //it's a sensor
            if (G.readings[key]) {
                G.readings[key].values.push(value);
                G.readings[key].sum += value;
                G.readings[key].result = G.readings[key].sum / G.readings[key].values.length;
            } else {
                G.readings.numKeys++;
                G.readings[key] = {
                    values: [value],
                    sum: value,
                    result: value
                };
            }
            if (now - G.readings.time > G.readingInterval && G.readings.numKeys >= 5) {
                G.data.table.push([
                    moment(now).format('DD.MM. HH:mm'),
                    G.soilMoisture,
                    G.temperature,
                    G.humidity,
                    G.heatIndex,
                    G.solarEnergy,
                    G.weatherTemp,
                    G.weatherHumidity,
                    G.weatherPressure * 0.1
                ]);
                G.readings = {
                    time: now,
                    numKeys: 0
                };
            }
        }
    }
});

//UI.init();
//TODO create control buttons to text ui

web.init({
    onControlStatus() {
        return controls;
    },
    onData(query) {
        return G.data;
    },
    onCmd(query) {
        var sent = [];
        for (k in query) {
            var key = k.toUpperCase(),
                value = Number(query[k]) ? '_ON' : '_OFF';
            if (cmd[key + value]) {
                io.sendCmd(cmd[key + value]);
                sent.push({
                    cmd: key + value,
                    value: cmd[key + value]
                });
            }
        }
        return sent;
    }
});

