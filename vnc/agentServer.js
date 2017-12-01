var websocket = require('../WebSocketServer/websocket-exam');
var net = require('net');

var remotePort = 5900;
var remoteHost = '192.168.56.101';

websocket.listen(8080, 'localhost', function (websocket) {
	var tcpsocket = new net.Socket({
		type: 'tcp4'
	});
	tcpsocket.connect(remotePort, remoteHost);

	tcpsocket.on('connect', function () {
		console.log('TCP connection open.');
	});

	tcpsocket.on('data', function (data) {
		websocket.send(data);
	});

	tcpsocket.on('error', function () {
		console.log('TCP connection error', arguments);
	});

	websocket.on('data', function (opcode, data) {
		tcpsocket.write(data);
	});

	websocket.on('close', function (code, reason) {
		console.log('WebSocket closed.');
		tcpsocket.end();
	});

	console.log('WebSocket connection open.');
})