var config = require('./environment.json'),
    http = require('http'),
    fs = require('fs'),
    moment = require('moment'),
    blessed = require('blessed'),
    contrib = require('blessed-contrib');

var G = {
    weatherTimeout: null,
    weatherInterval: 60 * 10000,
    server: null,
    readingInterval: 60 * 1000,
    readings: {
        numKeys: 0,
        time: 0
    },
    data: {
        table: [["Time", "Soil moisture", "Temperature", "Humidity", "Heat Index", "Solar Energy", "Outside Temperature", "Outside Humidity", "Outside Pressure x.1"]],
        weatherNow: null
    },
    consoleData: {},
    screen: blessed.screen({
        smartCSR: true
    }),

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
                callback(JSON.parse(dataStr));
            });
        });
        get.end();
    },

    getReadings() {
        var get = http.request({
            method: "GET",
            host: config.ARDUINO_HOST,
            port: config.ARDUINO_HOST_PORT,
            path: "/"
        }, res => {
            res.setEncoding('utf-8');
            res.on('data', data => {
                var d = data.toString("utf8").split('='),
                    now = new Date().getTime(),
                    key = d[0].split(' ').join(''),
                    value = Number(d[1]);

                if (!G.consoleData[key]) {
                    var c = {
                        Soilmoisture: 'blue',
                        Temperature: 'red',
                        SolarEnergy: 'yellow',
                        Humidity: 'blue',
                        HeatIndex: 'red'
                    };
                    G.consoleData[key] = {
                        label: key,
                        x: [],
                        y: [],
                        style: {
                            line: c[key]
                        }
                    };
                } else {
                    G.consoleData[key].x.push("T" + G.consoleData[key].x.length);
                    G.consoleData[key].y.push(value)
                }

                G.readingsLog.log(key, '=>', value);
                G[key + "Line"].setData([G.consoleData[key]]);
                G.screen.render();

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
                        moment(now).format('DD.MM. HH.mm'),
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
            });
            res.on('close', () => {
                G.getReadings();
            });
        });
        get.on('error', err => {
            G.readingsLog.log('-->', err, 'retrying...');
            G.screen.render();
            setTimeout(G.getReadings, 1000);
        });

        get.end();
    },
    updateWeather() {
        G.getWeather(w => {
            if (w) {
                G.data.weatherNow = w;
                G.readingsLog.log(w);
                //show in text UI
                var now = moment(),
                    table = [
                        [w.base, w.sys.country, now.format('DD.MM.YYYY'), now.format('HH:mm:ss')],
                        ["Sea level", "Ground level", "Location", "Longitude / Latitude"],
                        [w.main.sea_level.toString(), w.main.grnd_level.toString(), config.OPEN_WEATHER_LOCATION, w.coord.lon + ' / ' + w.coord.lat],
                        ["Wind", "Humidity", "Pressure", "Temperature"],
                        [w.wind.deg + " / " + w.wind.speed, w.main.humidity.toString(), w.main.pressure.toString(), w.main.temp.toString()]
                    ];
                w.weather.forEach(d => {
                    table.push([d.main, d.description]);
                });
                G.weatherTable.setData(table);
                G.screen.render();
            }
            if (G.weatherTimeout) clearTimeout(G.weatherTimeout);
            G.weatherTimeout = setTimeout(G.updateWeather, G.weatherInterval);
        });
    },
    sendJSON(res, code, object) {
        res.writeHead(code, {
            "Content-Type": "application/json"
        });
        res.write(JSON.stringify(object));
        res.end();
    },
    sendHTML(res, code, content) {
        res.writeHead(code, {
            "Content-Type": "text/html"
        });
        res.write(content);
        res.end();
    },
    startServer() {
        G.server = http.createServer((req, res) => {
            var index = fs.readFileSync('index.html', 'UTF8');
            switch (req.url) {
            case "/":
                G.sendHTML(res, 200, index);
                break;
            case "/data":
                G.sendJSON(res, 200, G.data);
                break;
            default: G.sendJSON(res, 404, '404 Error ' + req.url + ' not found');
                break;
            }
        });
        G.server.listen(config.PORT);
    },
    startUI() {
        G.screen.title = "Greenhouse climate";
        G.screen.key('q', () => {
            G.screen.destroy();
            process.exit();
        });
        G.weatherTable = blessed.table({
            parent: G.screen,
            top: '1%',
            left: '1%',
            data: null,
            border: 'line',
            align: 'center',
            width: '48%',
            style: {
                border: {
                    fg: 'blue'
                },
                header: {
                    fg: 'white',
                },
                cell: {
                    fg: 'white'
                }
            }
        });
        G.readingsLog = blessed.log({
            parent: G.screen,
            top: '50%',
            left: '1%',
            width: '49%',
            height: '48%',
            border: 'line',
            tags: true,
            keys: true,
            vi: true,
            mouse: true,
            scrollback: 100,
            scrollbar: {
                ch: ' ',
                track: {
                    bg: 'yellow'
                },
                style: {
                    inverse: true
                }
            }
        });
        G.SoilmoistureLine = contrib.line({
            left: '50%',
            top: '00%',
            width: '50%',
            height: '20%',
            label: 'Soil moisture'
        });
        G.screen.append(G.SoilmoistureLine);
        G.TemperatureLine = contrib.line({
            left: '50%',
            top: '20%',
            width: '50%',
            height: '20%',
            label: 'Temperature'
        });
        G.screen.append(G.TemperatureLine);
        G.SolarEnergyLine = contrib.line({
            left: '50%',
            top: '40%',
            width: '50%',
            height: '20%',
            label: 'Solar Energy'
        });
        G.screen.append(G.SolarEnergyLine);
        G.HumidityLine = contrib.line({
            left: '50%',
            top: '60%',
            width: '50%',
            height: '20%',
            label: 'Humidity'
        });
        G.screen.append(G.HumidityLine);
        G.HeatIndexLine = contrib.line({
            left: '50%',
            top: '80%',
            width: '50%',
            height: '20%',
            label: 'Heat Index'
        });
        G.screen.append(G.HeatIndexLine);
        G.screen.render();
    },
    start() {
        G.startUI();
        G.updateWeather();
        G.getReadings();
        G.startServer();
    }
}

G.start();

