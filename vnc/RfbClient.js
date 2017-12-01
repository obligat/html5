RfbProtocolClient = function () {

};

$prototype = RfbProtocolClient.prototype;

$prototype.connect = function (url) {
	this.socket = new WebSocket(url);
	this.socket.binaryType = 'arraybuffer';
	this.stream = new CompositeStream();

	bindSocketHandlers(this, this.socket);

	this.buttonMask = 0;
	this.readHandler = versionHandler;
}

var bindSocketHandlers = function ($this, socket) {
	socket.onopen = function (e) {

	}

	var stream = $this.stream;

	socket.onmessage = function messageHandler(e) {
		stream.append(e.data);
		while ($this.readHandler($this, stream) {

			});
	}

	socket.onclose = socket.onerror = function () {
		console.log('Connection closed', arguments);
	}
}

var versionHandler = function ($this, stream) {
	if (stream.length < 12) {
		return false;
	}

	var version = new Uint8Array(stream.consume(12));

	sendBytes($this, version.buffer);

	$this.readHandler = numSecurityTypesHandler;

	return true;
}

var doUpdateRequest = function doUpdateRequest($this, incremental) {
	var request = new CompositeStream();

	request.appendBytes(3);
	request.appendBytes(1);

	request.appendBytes(0, 0, 0, 0);
	request.appendUint16($this.width);
	request.appendUint16($this.height);

	sendBytes($this, request.consume(request.length));
}