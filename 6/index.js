const T = 2 * Math.PI;

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
            y: this.h/2,
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

            spoints[iter] = [px,py, dz];
        }

        for (let line of map.lines) {
            this.ctx.beginPath();
            let col = Math.min(255,Math.max(0,Math.floor(92 - (spoints[line[0]][2] - 4)/4 * 128)));

            this.ctx.strokeStyle = 'rgb('+col+','+col+','+col+')';
            this.ctx.fillStyle = this.ctx.strokeStyle;

            this.ctx.moveTo(spoints[line[0]][0], spoints[line[0]][1]);
            this.ctx.lineTo(spoints[line[1]][0], spoints[line[1]][1]);
            this.ctx.stroke();
        }
    }
}

class Map {
    constructor() {
        this.points = [];
        for (let theta = 0; theta < T/4; theta += T/2000) {
            let r = 1,
                theta2 = theta * 64,
                y = Math.sqrt(1-theta*theta),
                x = theta * Math.cos(theta2),
                z = theta * Math.sin(theta2);
            this.points.push([x,y,z]);
        }
        for (let i in this.points) {
            let point = this.points[i];
            this.points.push([-point[0], -point[1], -point[2]]);
        }

        this.lines = [];
        for (let i = 0; i < this.points.length - 1; i++) {
            this.lines.push([i, i+1]);
        }
    }

    apply4DMatrix(transMatrix) {
        for (let iter in this.points) {
            let point = this.points[iter],
            // apply matrix transformation
                origMatrix = new Matrix(1, 4, [point[0],point[1],point[2],1]),
                resMatrix = transMatrix.mul(origMatrix),
                arrOut = resMatrix.toArray()[0];
            this.points[iter] = [arrOut[0],arrOut[1],arrOut[2]];
        }
    }
}

class Matrix {
    constructor(w, h, els) {
        Object.assign(this, {w, h, els});
    }

    get(c,r) {
        return this.els[r * this.w + c];
    }

    mul(m2) {
        if (this.w != m2.h)
            throw new Error('Cannot multiply this matrix: '+this.w + ' by '+m2.h);

        let resEls = [];

        for (let lCol = 0; lCol < this.h; lCol++) {
            for (let rRow = 0; rRow < m2.w; rRow++) {
                let intSum = 0;
                for (let n = 0; n < this.w; n++) {
                    intSum += this.get(n, lCol) * m2.get(rRow, n);
                }
                resEls[lCol * m2.w + rRow] = intSum;
            }
        }

        return new Matrix(m2.w, this.h, resEls);
    }

    toArray() {
        let arr = [];
        for (let x = 0; x < this.w; x++) {
            arr[x] = [];
            for (let y = 0; y < this.h; y++) {
                arr[x][y] = this.get(x,y);
            }
        }
        return arr;
    }

    static createTransformation(tx, ty, tz, dx, dy, dz) {
        let sx = Math.sin(tx),
            sy = Math.sin(ty),
            sz = Math.sin(tz),

            cx = Math.cos(tx),
            cy = Math.cos(ty),
            cz = Math.cos(tz);

        return new Matrix(4,4, [
            // yay magic numbers
            cz*cy,            -sz*cy,             sy,     dx,
            sy*sx*cz + cx*sz,  -sy*sx*sz + cx*cz, -sx*cy, dy,
            -sy*cx*cz + sx*sz, sy*cx*sz + cz*sx,  cx*cy,  dz,
            0,                 0,                 0,      0
        ]);
    }
}

let xspeed = 0,
    yspeed = 0,
    zspeed = 0;

let cam = new Camera(window.innerWidth, window.innerHeight, Math.PI / 2, 0, 0, -5, 0, 0, 0),
    map = new Map(),
    frame = () => {
        cam.clear();
        let transMatrix = Matrix.createTransformation(xspeed, yspeed, zspeed, 0, 0, 0);
        map.apply4DMatrix(transMatrix);
        cam.trace(map);
        window.requestAnimationFrame(frame);
    };

frame();


window.addEventListener('keypress', (e) => {
    switch (e.code) {
        case 'ArrowRight':
            yspeed += 0.01;
            break;
        case 'ArrowLeft':
            yspeed -= 0.01;
            break;
        case 'ArrowUp':
            xspeed -= 0.01;
            break;
        case 'ArrowDown':
            xspeed += 0.01;
            break;
        case 'KeyD':
            zspeed -= 0.01;
            break;
        case 'KeyA':
            zspeed += 0.01;
            break;
        case 'Equal':
            cam.fov += T/32;
            break;
        case 'Minus':
            cam.fov -= T/32;
            break;
        default:
            console.log(e.code);
            break;
    }
});
