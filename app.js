// var dht = require('node-dht-sensor');
var fs = require('fs');
var spawn = require('child_process').spawn;
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var io = require('socket.io').listen(app.listen(8080, function () {
	var host = this.address().address;
	var port = this.address().port;

	console.log('Server listening at http://%s:%s', host, port);
}));

// Setting global variables for video streaming
var proc;
var sockets = {};

var mysql      = require('mysql');
var connection = mysql.createConnection({
	host     : '10.37.1.83',
	user     : 'homeauto',
	password : 'p@ssw0rd',
	database : 'homeauto'
	});

// Setting the variable for the dht temperature sensor
// var dht_type = 22; // 11 for dht11, 22 for dht22
// var dht_pin = 19; // follow the number on the T-board

// Test if the program can detect the dht sensor properly
// if (!dht.initialize(dht_type, dht_pin)){
// 	console.warn('Failed to initialize sensor');
// 	process.exit(1);
// }


// Setting the configuration for ejs and external JavaScript in client-side
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/ressources'));
app.use(express.static(__dirname + '/stream'));


// Setting the route
app.get('/', function (req, res){
	res.render('pages/login');
});

app.get('/live', function (req, res){
	res.render('pages/index');
});

app.get('/watch', function (req, res) {
	res.render('pages/watch')
});

app.post('/auth', function (req, res) {

	console.log(req.body.username);
	console.log(req.body.password);

	var username = req.body.username;
	var password = req.body.password;
	
	connection.connect();

	// const crypto = require('crypto');
	// const hash = crypto.createHash('sha256');

	// const input = hash.update(password);

	var crypto = require('crypto');
	var hash = crypto.createHash('sha256').update(password).digest("hex");

	var SQL_select = "SELECT * FROM homeusers WHERE username = '" + username + "' AND password ='"+hash + "';";

	connection.query(SQL_select, function(err, rows, fields) {
		if (!err)
			//console.log('The solution is: ', rows);
			res.render('pages/index');
		else
			console.log('Error while performing Query.');
	});

	connection.end();
});

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
		'temp' : 10, //dht.read().temperature.toFixed(1),
		'humidity': 10 //dht.read().humidity.toFixed(1)
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

	var args = ["-w", "640", "-h", "480", "-o", "stream/image_stream.jpg", "-t", "999999999", "-tl", "0.01"];
	proc = spawn('raspistill', args);
	console.log('Watching for changes...');

	app.set('watchingFile', true);
	
	var file_path = 'stream/image_stream.jpg';

	fs.watchFile(file_path,
	{
		persistent: true,
		interval: 0.01
	},
	(curr, prev) => {
		var frame = new Buffer(fs.readFileSync(file_path)).toString('base64');
		io.sockets.emit('canvas', frame);
	});
}
