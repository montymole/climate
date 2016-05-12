var config = require('../environment.json'),
    http = require('http'),
    moment = require('moment'),
    db = require('./db');

module.exports = G = {
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