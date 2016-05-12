var dht = require('node-dht-sensor');
var express = require('express');
var app = express();

var dht_type = 22; // 11 for dht11, 22 for dht22
var dht_pin = 4; // follow the number on the T-board

if (!dht.initialize(dht_type, dht_pin)){
	console.warn('Failed to initialize sensor');
	process.exit(1);
}

app.set('view engine', 'ejs');

app.get('/', function (req, res){
	res.render('index');
})

app.get('/gettemperature', function (req, res){
	res.setHeader('Content-Type', 'application/json');
	res.json({ 'temp' : dht.read().temperature.toFixed(1),
				'humidity': dht.read().humidity.toFixed(1)});
})

var server = app.listen(8080, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listenins at http://%s:%s', host, port);
})
