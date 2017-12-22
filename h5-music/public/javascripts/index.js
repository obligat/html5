function $(s) {
    return document.querySelectorAll(s);
}

let line;
let size = 128;
let lis = $("#list li");
let types = $("#type li");
let volume = $("#volume")[0];
let box = $("#box")[0];
let height, width;
let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
box.appendChild(canvas);

let Dots = [];

let mv = new MusicVisualizer({
    size, visualizer: draw,

});

function random(m, n) {
    return Math.round(Math.random() * (m - n) + n);
}


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
    for (let i = 0; i < size; i++) {
        let x = random(0, width);
        console.log(x);
        let y = random(0, height);
        let color = `rgba(${random(0, 255)},${random(0, 255)},${random(0, 255)},0)`;
        Dots.push({
            x, y, color,
            dy: random(0, 4),
            dx: random(0, 4),
        });
    }
}

getDots();

function draw(arr) {

    ctx.clearRect(0, 0, width, height);
    let w = width / size;

    ctx.fillStyle = line;
    for (let i = 0; i < size; i++) {

        if (draw.type !== "stripe") {

            let h = arr[i] / 256 * height;
            ctx.fillRect(w * i, height - h, w * 0.6, h); // w*0.6 jianxi
        } else if (draw.type !== "dot") {
            ctx.beginPath();
            let o = Dots[i];
            let r = arr[i] / 256 * (Math.min(height, width) / 10);
            ctx.arc(o.x, o.y, r, 0, Math.PI * 2, true);
            /*ctx.strokeStyle = "#fff";
            ctx.stroke();*/

            let g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
            g.addColorStop(0, "#fff");
            g.addColorStop(1, o.color);
            ctx.fillStyle = g;
            ctx.fill();

            o.y += o.dy;
            o.y = o.y > height ? 0 : o.y;

            o.x += o.dx;
            o.x = o.x > width ? 0 : o.x;
        }
    }
}

draw.type = "stripe";

for (let i = 0; i < types.length; i++) {
    types[i].onclick = function () {
        for (let j = 0; j < types.length; j++) {
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
        // load("/media/" + this.title);
        mv.play("/media/" + this.title);
    }

}


volume.onchange = function () {
    mv.changeVolume(this.value / this.max);
};