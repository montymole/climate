var config = require('./environment.json'),
    http = require('http'),
    url = require('url'),
	fs = require('fs'),
    db = require('./db'),
	ui = require('./ui'),
    moment = require('moment');


function sendJSON(res, code, object) {
	res.writeHead(code, {
		"Content-Type": "application/json"
	});
	res.write(JSON.stringify(object));
	res.end();
}

function sendHTML(res, code, content) {
	res.writeHead(code, {
		"Content-Type": "text/html"
	});
	res.write(content);
	res.end();
}

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
                    value = Number(d[1]),
                    dbReading = new db.Reading({date: now, type: key, value, value});
                dbReading.save( err => {
                    if (err) {
                        console.error('error saving reading');
                    }
                });
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
                ui.readingsLog.log(key, '=>', value);
                ui[key + "Line"].setData([G.consoleData[key]]);
                ui.screen.render();
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
        G.getWeather((w) => {
            if (w) {
	            G.data.weatherNow = w;
	            ui.readingsLog.log(w);
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
	            ui.weatherTable.setData(table);
	            ui.weatherIcon(__dirname + '/ansi/' + w.weather[0].icon);
            }
	        if (G.weatherTimeout) clearTimeout(G.weatherTimeout);
            G.weatherTimeout = setTimeout(G.updateWeather, G.weatherInterval);
        });
    },
    startServer() {
        G.server = http.createServer((req, res) => {
            var index = fs.readFileSync('pub/index.html', 'UTF8'),
                url_parts = url.parse(req.url, true);
            switch (url_parts.pathname) {
            case "/":
                sendHTML(res, 200, index);
                break;
            case "/data":
                sendJSON(res, 200, G.data);
                break;
            case "/find":
	            var q = {};
	            if (url_parts.query.startDate) {
		            q.date = {
			            $gte : moment(url_parts.query.startDate).toDate()
		            }
	            }
	            if (url_parts.query.endDate) {
		            if (!q.date) {
			            q.date = {};
		            }
		            q.date.$lt = moment(url_parts.qyery.endDate).toDate();
	            }
	            if (url_parts.query.reading) {
		            q.type = url_parts.query.reading;
	            }
	            ui.readingsLog.log('QUERY',q);
	            db.Reading.find(q, (err, data) => {
	                if (err) {
		                sendJSON(res, 500, err);
	                } else {
		                sendJSON(res, 200, data);
	                }
                });
                break;
            default: sendJSON(res, 404, '404 Error ' + req.url + ' not found');
                break;
            }
        });
        G.server.listen(config.PORT);
    },
    start() {
	    ui.init();
        G.updateWeather();
        G.getReadings();
        G.startServer();
    }
}

G.start();

