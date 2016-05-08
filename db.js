var config = require('./environment.json'),
	mongoose = require('mongoose');

mongoose.connect(config.DATABASE);

var readingSchema = mongoose.Schema({
	date: Date,
	type: String,
	value: Number
});

/*

 "weatherNow":{"coord":{"lon":16.58,"lat":63.37},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"id":2725073,"name":"As","c
 "base":"cmc stations","main":{"temp":16.67,"pressure":1004.6,"humidity":51,"temp_min":16.67,"temp_max":16.67,"sea_level":1037.12,"grnd_level":1004.6},
 "wind":{"speed":2.79,"deg":309.502},"clouds":{"all":0},"dt":1462728781,"sys":{"message":0.0023,"country":"SE","sunrise":1462673138,"sunset":1462736212},od":200}}
 */

var weatherSchema = mongoose.Schema({
	date: Date,
	coord: Object,
	weather: Object,
	base: String,
	main: Object,
	wind: Object,
	clouds: Object,
	sys: Object
});

exports.Reading = mongoose.model('reading',readingSchema);
exports.Weather = mongoose.model('weather',weatherSchema);