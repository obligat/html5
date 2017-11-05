var events = require('events');
var http = require('http');
var crypto = require('crypto');
var util = require('util');

var opcodes = {
	TEXT: 1,
	BINARY: 2,
	CLOSE: 8,
	PING: 9,
	PONG: 10
};

var WebSocketConnection = function (req, socket, upgradeHead) {
	var self = this;
	var key = hashWebSocketKey(req.headers['sec-websocket-key']);

	socket.write(`HTTP/1.1 101 Web Socket Protocol Handshake\r\nUpgrade: WebSocket\r\nConnection: Upgrade\r\nsec-websocket-accept: ${key}\r\n\r\n`);

	socket.on('data', function (buf) {
		self.buffer = Buffer.concat([self.buffer, buf]);
		while (self._processBuffer()) {

		}
	});

	socket.on('close', function (had_error) {
		if (!self.closed) {
			self.emit('close', 1006);
			self.closed = true;
		}
	});

	this.socket = socket;
	this.buffer = new Buffer(0);
	this.closed = false;
}

util.inherits(WebSocketConnection, events.EventEmitter);

WebSocketConnection.prototype.send = function (obj) {
	var opcode, payload;
	if (Buffer.isBuffer(obj)) {
		opcode = opcodes.BINARY;
		payload = obj;
	} else if (typeof obj == 'string') {
		opcode = opcodes.TEXT;
		payload = new Buffer(obj, 'utf8');
	} else {
		throw new Error('Cannot send object. Must be string or Buffer');
	}

	this._doSend(opcode, payload);
}

WebSocketConnection.prototype.close = function (code, reason) {
	var opcode = opcodes.CLOSE;
	var buffer;

	if (code) {
		buffer = new Buffer(Buffer.byteLength(reason) + 2);
		buffer.writeUInt16BE(code, 0);
		buffer.write(reason, 2);
	} else {
		buffer = new Buffer(0);
	}

	this._doSend(opcode, buffer);
	this.closed = true;
}

WebSocketConnection.prototype._processBuffer = function () {
	var buf = this.buffer;

	if (buf.length < 2) {
		return;
	}

	var idx = 2;
	var b1 = buf.readUInt8(0);
	var fin = b1 & 0x80;
	var opcode = b1 & 0x0f;
	var b2 = buf.readUInt8(1);
	var mask = b2 & 0x80;
	var length = b2 & 0x7f;

	if (length > 125) {
		if (buf.length < 8) {
			return;
		}


		if (length == 126) {
			length = buf.readUInt16BE(2);
			idx += 2;
		} else if (length == 127) {
			var highBits = buf.readUInt32BE(2);
			if (highBits != 0) {
				this.close(1009, '');
			}
			length = buf.readUInt32BE(6);
			idx += 8;
		}
	}

	if (buf.length < idx + 4 + length) {
		return;
	}

	maskBytes = buf.slice(idx, idx + 4);
	idx += 4;
	var payload = buf.slice(idx, idx + length);
	payload = unmask(maskBytes, payload);
	this._handleFrame(opcode, payload);

	this.buffer = buf.slice(idx + length);
	return true;
}

WebSocketConnection.prototype._handleFrame = function (opcode, buffer) {
	var payload;
	switch (opcode) {
	case opcodes.TEXT:
		payload = buffer.toString('utf8');
		this.emit('data', opcode, payload);
		break;
	case opcodes.BINARY:
		payload = buffer;
		this.emit('data', opcode, payload);
		break;
	case opcodes.PING:
		this._doSend(opcodes.PONG, buffer);
		break;
	case opcodes.CLOSE:
		var code, reason;
		if (buffer.length >= 2) {
			code = buffer.readUInt16BE(0);
			reason = buffer.toString('utf8', 2);
		}
		this.close(code, reason);
		this.emit('close', code, reason);
		break;
	case opcodes.PONG:
		break;
	default:
		this.close(1002, 'unknown opcode');
	}
}

WebSocketConnection.prototype._doSend = function (opcode, payload) {
	this.socket.write(encodeMessage(opcode, payload));
}

var KEY_SUFFIX = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
var hashWebSocketKey = function (key) {
	var sha1 = crypto.createHash('sha1');
	sha1.update(key + KEY_SUFFIX, 'ascii');
	return sha1.digest('base64');
}

var unmask = function (maskBytes, data) {
	var payload = new Buffer(data.length);
	for (var i = 0; i < data.length; i++) {
		payload[i] = maskBytes[i % 4] ^ data[i];
	}
	return payload;
}

var encodeMessage = function (opcode, payload) {
	var buf;
	var b1 = 0x80 | opcode;
	var b2 = 0;
	var length = payload.length;
	if (length < 126) {
		buf = new Buffer(payload.length + 2 + 0);
		b2 |= length;
		buf.writeUInt8(b1, 0);
		buf.writeUInt8(b2, 1);
		payload.copy(buf, 2);
	} else if (length < (1 << 16)) {
		buf = new Buffer(payload.length + 2 + 2);
		b2 |= 126;
		buf.writeUInt8(b1, 0);
		buf.writeUInt8(b2, 1);
		buf.writeUInt16BE(length, 2);
		payload.copy(buf, 4);
	} else {
		buf = new Buffer(payload.length + 2 + 8);
		b2 |= 127
		buf.writeUInt8(b1, 0);
		buf.writeUInt8(b2, 1);
		buf.writeUInt32BE(0, 2);
		buf.writeUInt32BE(length, 6);
		payload.copy(buf, 10);
	}
	return buf;
}

exports.listen = function (port, host, connectionHandler) {
	var srv = http.createServer(function (req, res) {

	});

	srv.on('upgrade', function (req, socket, upgradeHead) {
		var ws = new WebSocketConnection(req, socket, upgradeHead);
		connectionHandler(ws);
	});

	srv.listen(port, host, 100, function () {
		console.log('listening ', port, host)
	});
}