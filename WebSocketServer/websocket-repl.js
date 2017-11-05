var websocket = require('./websocket-exam');
var repl = require('repl');

var connections = Object.create(null);
console.log(connections);

var remoteMultiEval = function (cmd, context, filename, callback) {
	for (var c in connections) {
		connections[c].send(cmd);
	}

	callback(null, '(result pending)');
}

websocket.listen(9999, 'localhost', function (conn) {
	// console.log(conn);
	conn.id = Math.random().toString().substr(2);
	connections[conn.id] = conn;
	console.log('new connection :' + conn.id);

	conn.on('data', function (opcode, data) {
		console.log('\t' + conn.id + ':\t' + data);
	});

	conn.on('close', function () {
		delete connections[conn.id];
	});
});

repl.start({
	'eval': remoteMultiEval
});