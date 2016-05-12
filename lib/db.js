var config = require('../environment.json'),
    mongoose = require('mongoose');
mongoose.connect(config.DATABASE);
var readingSchema = mongoose.Schema({
        date: Date,
        type: String,
        value: Number
    }),
    weatherSchema = mongoose.Schema({
        date: Date,
        coord: Object,
        weather: Object,
        base: String,
        main: Object,
        wind: Object,
        clouds: Object,
        sys: Object
    });
exports.Reading = mongoose.model('reading', readingSchema);
exports.Weather = mongoose.model('weather', weatherSchema);