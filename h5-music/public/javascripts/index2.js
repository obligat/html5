function $(s) {
    return document.querySelectorAll(s);
}

let size = 128;
let lis = $("#list li");
let types = $("#type li");
let volume = $("#volume")[0];
let box = $("#box")[0];
let height,width;
let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
box.appendChild(canvas);

let Dots = [];

function random(m,n) {
    return Math.round(Math.random() * (m - n) + n);
}


let line ;

function resize() {
    height = box.clientHeight;
    width = box.clientWidth;
    canvas.height = height;
    canvas.width = width;

    line = ctx.createLinearGradient(0, 0, 0, height);
    line.addColorStop(0, "red");
    line.addColorStop(0.5, "yellow");
    line.addColorStop(1, "green");
}

resize();

window.onresize = resize;


function getDots() {
    for(let i = 0; i < size; i++){
        let x = random(0, width);
        console.log(x);
        let y = random(0, height);
        let color = `rgb(${random(0,255)},${random(0,255)},${random(0,255)})`
        Dots.push({
            x,y,color
        });
    }
}

getDots();

function draw(arr) {

    ctx.clearRect(0,0,width,height);
    let w= width / size;

    ctx.fillStyle = line;
    for(let i = 0; i<size;i++){

        if(draw.type === "stripe"){

            let h = arr[i]/ 256 * height;
            ctx.fillRect(w * i, height - h, w*0.6, h); // w*0.6 jianxi
        }else if(draw.type === "dot"){
            ctx.beginPath();
            let o = Dots[i];
            let r = arr[i] / 256 * 50;
            ctx.arc(o.x, o.y, r/2, 0, Math.PI * 2, true);
            /*ctx.strokeStyle = "#fff";
            ctx.stroke();*/

            let g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
            g.addColorStop(0,"#fff");
            g.addColorStop(1,o.color);
            ctx.fillStyle = g;
            ctx.fill();
        }
    }
}

draw.type = "stripe";

for(let i=0; i < types.length; i++){
    types[i].onclick = function () {
        for(let j = 0; j < types.length; j++){
            types[j].className = "";
        }
        this.className = "selected";
        draw.type = this.getAttribute("data-type");
    }
}

for (let i = 0; i < lis.length; i++) {
    lis[i].onclick = function () {
        for (let j = 0; j < lis.length; j++) {
            lis[j].className = "";
        }

        this.className = "selected";
        load("/media/" + this.title);
    }

}

let xhr = new XMLHttpRequest();
let ac = new window.AudioContext();
let gainNode = ac.createGain();

gainNode.connect(ac.destination);


let analyser = ac.createAnalyser();
analyser.fftSize = size * 2;
analyser.connect(gainNode);

let source = null;

let count = 0;

function load(url) {
    let n = ++count;
    source && source.stop();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";
    xhr.abort();
    xhr.onload = function () {
        if(n !== count ) return;
        ac.decodeAudioData(xhr.response, function (buffer) {
            if(n !== count ) return;
            let bufferSource = ac.createBufferSource();
            bufferSource.buffer = buffer;
            bufferSource.connect(analyser);
            bufferSource[bufferSource.start ? "start" : "noteOn"](0);
            gainNode.gain.value = (volume.value/ volume.max);
            source = bufferSource;
            visualizer();
        }, function (err) {
            console.log(err);
        });
    };

    xhr.send();
}


function visualizer() {
    let arr = new Uint8Array(analyser.frequencyBinCount);

    function v() {
        analyser.getByteFrequencyData(arr);
        draw(arr);
        requestAnimationFrame(v);
    }

    requestAnimationFrame(v);

}

function changeVolume(percent) {
    gainNode.gain.value = percent;
}

volume.onchange = function () {
    changeVolume(this.value / this.max);
};