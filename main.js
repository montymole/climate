var config = require('./environment.json'),
    http = require('http'),
    moment = require('moment'),
    db = require('./db'),
    UI = require('./ui'),
    IO = require('./IO'),
    WEB = require('./WEB');

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
    },
    G = {
        weatherTimeout: null,
        weatherInterval: 60 * 10000,
        readingInterval: 60 * 1000,
        readings: {
            numKeys: 0,
            time: 0
        },
        data: {
            table: [["Time", "Soil moisture", "Temperature", "Humidity", "Heat Index", "Solar Energy", "Outside Temperature", "Outside Humidity", "Outside Pressure x.1"]],
            weatherNow: null
        },
        get soilMoisture() {
            return G.readings.Soilmoisture ? G.readings.Soilmoisture.result : null;
        },
        get temperature() {
            return G.readings.Temperature ? G.readings.Temperature.result : null;
        },
        get humidity() {
            return G.readings.Humidity ? G.readings.Humidity.result : null;
        },
        get heatIndex() {
            return G.readings.HeatIndex ? G.readings.HeatIndex.result : null;
        },
        get solarEnergy() {
            return G.readings.SolarEnergy ? G.readings.SolarEnergy.result : null;
        },
        get weatherTemp() {
            return G.data.weatherNow ? G.data.weatherNow.main.temp : null;
        },
        get weatherHumidity() {
            return G.data.weatherNow ? G.data.weatherNow.main.humidity : null;
        },
        get weatherPressure() {
            return G.data.weatherNow ? G.data.weatherNow.main.pressure : null;
        },
        getWeather(callback) {
            var get = http.request({
                method: "GET",
                host: "api.openweathermap.org",
                path: "/data/2.5/weather?q=" + config.OPEN_WEATHER_LOCATION + "&units=metric&appid=" + config.OPEN_WEATHER_APPID
            }, res => {
                var dataStr = "";
                res.setEncoding('utf-8');
                res.on('data', data => {
                    dataStr += data;
                });
                res.on('end', () => {
                    var data = JSON.parse(dataStr),
                        dbWeather = new db.Weather(data);
                    dbWeather.save(err => {
                        if (err) {
                            console.error('error saving weather');
                        }
                    })
                    callback(data);
                });
            });
            get.end();
        },
        updateWeather() {
            G.getWeather((w) => {
                if (w) {
                    G.data.weatherNow = w;
                    //show in text UI
                    var now = moment(),
                        table = [
                            [w.base, w.sys.country, now.format('DD.MM.YYYY'), now.format('HH:mm:ss')],
                            ["Wind", "Humidity", "Pressure", "Temperature"],
                            [w.wind.deg + " / " + w.wind.speed, w.main.humidity.toString(), w.main.pressure.toString(), w.main.temp.toString()]
                        ];
                    w.weather.forEach(d => {
                        table.unshift([d.main, d.description]);
                    });
                }
                if (G.weatherTimeout) clearTimeout(G.weatherTimeout);
                G.weatherTimeout = setTimeout(G.updateWeather, G.weatherInterval);
            });
        }
    };

G.updateWeather();

IO.init({
    TCP: false,
    onData: (data) => {
        var d = data.toString("utf8").split('='),
            now = new Date().getTime(),
            key = d[0].split(' ').join(''),
            value = Number(d[1]);
        console.log(key, value);
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



//COMMANDS
/*
#define CMD_PSU_ON  2
#define CMD_PSU_OFF 3
#define CMD_LED_ON  4
#define CMD_LED_OFF 5
#define CMD_R1_ON   6
#define CMD_R1_OFF  7
#define CMD_R2_ON   8
#define CMD_R2_OFF  9
#define CMD_R3_ON   10
#define CMD_R3_OFF  11
#define CMD_R4_ON   12
#define CMD_R4_OFF  13
*/
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
}

WEB.init({
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
                IO.sendCmd(cmd[key + value]);
                sent.push({
                    cmd: key + value,
                    value: cmd[key + value]
                });
            }
        }
        return sent;
    }
});

