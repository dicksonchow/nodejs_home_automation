/**
 * Created by ngayinor2 on 5/18/2016.
 */
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'homeauto',
    password : 'p@ssw0rd',
    database : 'homeauto'
});

connection.connect();

connection.query('SELECT * from homeusers WHERE username = \'dickson\'', function(err, rows, fields) {
    if (!err)
        console.log('The solution is: ', rows);
    else
        console.log(err.toString());
});

connection.end();