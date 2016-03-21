class Camera {
    constructor(w,h,fov,x,y,z,tx,ty,tz) {
        this.canvases = document.getElementsByTagName('canvas');
        this.canvas = this.canvases[0];
        this.canvas.height = h;
        this.canvas.width = w;
        this.canvas.style.height = h+'px';
        this.canvas.style.width = w+'px';
        this.ctx = this.canvas.getContext('2d');
        Object.assign(this, {w,h,fov,x,y,z,tx,ty,tz});
        this.origin = {
            x: this.w/2,
            y: this.h/2
        };
    }

    clear() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.w, this.h);
    }

    trace(map) {
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'white';
        let spoints = {};
        for (let iter in map.points) {
            let point = map.points[iter],
            // Where is it in 2D space?
                dx = point[0] - this.x,
                dy = point[1] - this.y,
                dz = point[2] - this.z,

                tx = Math.atan(dx / dz + this.tx),
                ty = Math.atan(dy / dz + this.ty),
                tz = this.tz,

                dpx = this.fov * this.h * tx,
                dpy = this.fov * this.h * ty,

                px = dpx + this.origin.x,
                py = this.origin.y - dpy;

            spoints[iter] = [px,py];
        }

        for (let line of map.lines) {
            this.ctx.beginPath();
            this.ctx.moveTo(spoints[line[0]][0], spoints[line[0]][1]);
            this.ctx.lineTo(spoints[line[1]][0], spoints[line[1]][1]);
            this.ctx.stroke();
        }
    }
}

class Map {
    constructor() {
        let file = document.getElementById('map'),
            json = file.innerText,
            obj = JSON.parse(json);
        this.points = obj.points;
        this.lines = obj.lines;
    }
}

let cam = new Camera(window.innerWidth, window.innerHeight, Math.PI / 2, 0.5, 0.3, -4, 0, 0, 0),
    map = new Map(),
    frame = () => {
        cam.clear();
        cam.x += 0.005;
        cam.z += 0.005;
        cam.tx += 0.0015;
        cam.ty = 0.1 * Math.sin(cam.tx * 32);

        cam.trace(map);
        window.requestAnimationFrame(frame);
    };

frame();
