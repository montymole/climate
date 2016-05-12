var blessed = require('blessed'),
    contrib = require('blessed-contrib'),
    fs = require('fs');
module.exports = ui = {
    graphColors: {
        Soilmoisture: 'blue',
        Temperature: 'red',
        SolarEnergy: 'yellow',
        Humidity: 'blue',
        HeatIndex: 'red'
    },
    screen: blessed.screen({
        smartCSR: true
    }),
    getWeatherIcon(fd) {
        fs.exists(fd, exists => {
            if (!exists) {
                fs.writeFileSync(fd, blessed.ansiimage.curl('http://openweathermap.org/img/w/' + w.weather[0].icon + '.png'));
            }
            ui.weatherIcon = blessed.image({
                parent: ui.screen,
                left: '0%',
                top: '0%',
                width: '50%',
                height: '50%',
                type: 'ansi',
                file: fd
            });
            ui.screen.render();
        });
    },
    log: console.log,
    error: console.error,
    init() {
        ui.screen.title = "Greenhouse climate";
        ui.screen.key('q', () => {
            ui.screen.destroy();
            process.exit();
        });
        ui.weatherTable = blessed.table({
            parent: ui.screen,
            top: '40%',
            left: '0%',
            data: null,
            border: 'line',
            align: 'center',
            width: '50%',
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
        ui.readingsLog = blessed.log({
            parent: ui.screen,
            top: '70%',
            left: '0%',
            width: '50%',
            height: '30%',
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
        ui.log = () => {
            console.log('PERKELE');
            console.log.apply(this, arguments);
        }
        ui.SoilmoistureLine = contrib.line({
            left: '50%',
            top: '00%',
            width: '50%',
            height: '20%',
            label: 'Soil moisture'
        });
        ui.screen.append(ui.SoilmoistureLine);
        ui.TemperatureLine = contrib.line({
            left: '50%',
            top: '20%',
            width: '50%',
            height: '20%',
            label: 'Temperature'
        });
        ui.screen.append(ui.TemperatureLine);
        ui.SolarEnergyLine = contrib.line({
            left: '50%',
            top: '40%',
            width: '50%',
            height: '20%',
            label: 'Solar Energy'
        });
        ui.screen.append(ui.SolarEnergyLine);
        ui.HumidityLine = contrib.line({
            left: '50%',
            top: '60%',
            width: '50%',
            height: '20%',
            label: 'Humidity'
        });
        ui.screen.append(ui.HumidityLine);
        ui.HeatIndexLine = contrib.line({
            left: '50%',
            top: '80%',
            width: '50%',
            height: '20%',
            label: 'Heat Index'
        });
        ui.screen.append(ui.HeatIndexLine);
        ui.screen.render();
    }
}