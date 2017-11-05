var websocket = require('./websocket-exam.js');

websocket.listen(9999, 'localhost', function (conn) {
	console.log('connection opened.');
	conn.on('data', function (opcode, data) {
		consoel.log('message: ', data);
		conn.send(data);
	});

	conn.on('close', function (code, reason) {
		console.log('connection closed: ', code, reason);
	})
})

console.log(111);