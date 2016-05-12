var config = require('../environment.json'),
    http = require('http'),
    url = require('url'),
    fs = require('fs'),
    db = require('./db');

module.exports = WEB = {
    server: null,
    sendJSON(res, code, obj) {
        res.writeHead(code, {
            "Content-Type": "application/json"
        });
        res.write(JSON.stringify(obj));
        res.end();
    },
    sendHTML(res, code, content) {
        res.writeHead(code, {
            "Content-Type": "text/html"
        });
        res.write(content);
        res.end();
    },
    data: null,
    log: console.log,
    error: console.error,
    onControlStatus() {
        return null;
    },
    onData() {
        return null;
    },
    onCmd() {
        return null;
    },
    init(opts) {
        if (opts) {
            if (opts.log)
                WEB.log = opts.log;
            if (opts.error)
                WEB.error = opts.error;
            if (opts.onCmd) {
                WEB.onCmd = opts.onCmd;
            }
            if (opts.onControlStatus) {
                WEB.onControlStatus = opts.onControlStatus;
            }
            if (opts.onData) {
                WEB.onData = opts.onData;
            }
        }
        WEB.server = http.createServer((req, res) => {
            var index = fs.readFileSync('pub/index.html', 'UTF8'),
                url_parts = url.parse(req.url, true);
            switch (url_parts.pathname) {
            case "/":
                WEB.sendHTML(res, 200, index);
                break;
            case "/api/data":
                WEB.sendJSON(res, 200, WEB.onData(url_parts.query));
                break;
            case "/api/reading":
                db.Reading.find(G.createDbQuery(url_parts.query), (err, data) => {
                    if (err) {
                        WEB.sendJSON(res, 500, err);
                    } else {
                        WEB.sendJSON(res, 200, data);
                    }
                });
                break;
            case "/api/cmd":
                WEB.sendJSON(res, 200, WEB.onCmd(url_parts.query));
                break;
            case "/api/controls":
                WEB.sendJSON(res, 200, WEB.onControlStatus());
                break;
            case "/api/weather":
                db.Weather.find(G.createDbQuery(url_parts.query), (err, data) => {
                    if (err) {
                        WEB.sendJSON(res, 500, err);
                    } else {
                        WEB.sendJSON(res, 200, data);
                    }
                });
                break;
            default:
                WEB.sendJSON(res, 404, '404 Error ' + req.url + ' not found');
                break;
            }
        });
        WEB.server.listen(config.HTTP_PORT);
        WEB.log('WEB server listening in port:', config.HTTP_PORT);
    }
};