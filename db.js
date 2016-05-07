var config = require('./environment.json'),
	mongoose = require('mongoose');

mongoose.connect(config.DATABASE);

var readingSchema = mongoose.Schema({
	date: Date,
	type: String,
	value: Number
});

/*
var weatherSchema = mongoose.Schema({
	date: Date
});
*/

exports.Reading = mongoose.model('reading',readingSchema);
//exports.weather = mongoose.model(weatherSchema);