function MusicVisualizer(obj) {
    this.source = null;

    this.count = 0;

    this.analyser = MusicVisualizer.ac.createAnalyser();
    this.size =obj.size;
    this.analyser.fftSize = this.size * 2;

    this.gainNode = MusicVisualizer.ac.createGain();

    this.gainNode.connect(MusicVisualizer.ac.destination);

    this.analyser.connect(this.gainNode);

    this.xhr = new XMLHttpRequest();

    this.visualizer = obj.visualizer;

    this.visualize();
}

MusicVisualizer.ac = new window.AudioContext();


MusicVisualizer.prototype.load = function (url,fun) {
    this.xhr.abort();
    this.xhr.open("GET", url);
    this.xhr.responseType = "arraybuffer";
    let that = this;
    this.xhr.onload = function () {
        fun(that.xhr.response);
    };
    this.xhr.send();
};


MusicVisualizer.prototype.decode = function (arraybuffer,fun) {
    MusicVisualizer.ac.decodeAudioData(arraybuffer,function (buffer) {
        fun(buffer);
    },function (err) {
        console.log(err);
    });
};

MusicVisualizer.prototype.play = function (url) {
    let n = ++ this.count;
    let that= this;
    this.source && this.source.stop();
    this.load(url,function (arraybuffer) {
        if(n!== that.count) return;
        that.decode(arraybuffer,function (buffer) {
            if(n!== that.count) return;
            let bs = MusicVisualizer.ac.createBufferSource();
            bs.connect(that.analyser);
            bs.buffer = buffer;
            bs.start(0);
            that.source = bs;
        })
    })

};

MusicVisualizer.prototype.changeVolume = function (percent) {
    this.gainNode.gain.value = percent;
};

MusicVisualizer.prototype.visualize = function () {
    let arr = new Uint8Array(this.analyser.frequencyBinCount);

    let that = this;
    function v() {
        that.analyser.getByteFrequencyData(arr);
        that.visualizer(arr);
        requestAnimationFrame(v);
    }
    requestAnimationFrame(v);

};