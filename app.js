var dht = require('node-dht-sensor');
var fs = require('fs');
var spawn = require('child_process').spawn;
var express = require('express');
var app = express();
var io = require('socket.io').listen(app.listen(8080, function () {
	var host = this.address().address;
	var port = this.address().port;

	console.log('Server listenins at http://%s:%s', host, port);
}));

// Setting global variables for video streaming
var proc;
var sockets = {};

// Setting the variable for the dht temperature sensor
var dht_type = 22; // 11 for dht11, 22 for dht22
var dht_pin = 19; // follow the number on the T-board

// Test if the program can detect the dht sensor properly
if (!dht.initialize(dht_type, dht_pin)){
	console.warn('Failed to initialize sensor');
	process.exit(1);
}


// Setting the configuration for ejs and external JavaScript in client-side
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/ressources'));
app.use(express.static(__dirname + '/stream'));


// Setting the route
app.get('/', function (req, res){
	res.render('pages/index');
});

app.get('/watch', function (req, res) {
	res.render('pages/watch')
})


// Setting the io socket
io.sockets.on('connection', function (socket) {
	sockets[socket.id] = socket;

	socket.on('disconnect', function () {
		delete sockets[socket.id];
	});

	if (Object.keys(sockets).length == 0)
		stopStreaming();

	socket.on('start-stream', function () {
		startStreaming(io);
	});

	setInterval(function () {
		socket.emit('gettemp', {
			'temp' : dht.read().temperature.toFixed(1),
			'humidity': dht.read().humidity.toFixed(1)
		});
	}, 1000);
});


// Functions to stream video
function stopStreaming() {
	app.set('watchingFile', false);
	if (proc) proc.kill();
	fs.unwatchFile('./stream/image_stream.jpg');
}

function startStreaming(io) {

	if (app.get('watchingFile')) {
		io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
		return;
	}

	var args = ["-w", "640", "-h", "480", "-o", "./stream/image_stream.jpg", "-t", "999999999", "-tl", "100"];
	proc = spawn('raspistill', args);

	console.log('Watching for changes...');

	app.set('watchingFile', true);

	fs.watchFile('./stream/image_stream.jpg', function(current, previous) {
		io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
	})

}
