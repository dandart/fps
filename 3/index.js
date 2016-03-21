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

    applyMatrix(rotMatrix) {
        for (let iter in this.points) {
            let point = this.points[iter],
            // apply matrix transformation
                origMatrix = new Matrix(1, 3, point),
                resMatrix = rotMatrix.mul(origMatrix);

            this.points[iter] = resMatrix.toArray()[0];
        }
    }
}

class Matrix {
    constructor(w, h, els) {
        Object.assign(this, {w, h, els});
    }

    get(c,r) {
        return this.els[r * this.h + c];
    }

    mul(m2) {
        if (this.w != m2.h)
            throw new Error('Cannot multiply this matrix: '+this.w + ' by '+m2.h);

        let resEls = [];

        for (let lCol = 0; lCol < this.h; lCol++) {
            for (let rRow = 0; rRow < m2.w; rRow++) {
                let intSum = 0;
                for (let n = 0; n < this.w; n++) {
                    intSum += this.get(lCol, n) * m2.get(n, rRow);
                }
                resEls[lCol * this.h + rRow] = intSum;
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

    static createRot(tx, ty, tz) {
        let sx = Math.sin(tx),
            sy = Math.sin(ty),
            sz = Math.sin(tz),

            cx = Math.cos(tx),
            cy = Math.cos(ty),
            cz = Math.cos(tz);

        return new Matrix(3, 3, [
            // yay magic numbers
            cz*cy,            -sz*cy,             sy,
            sy*sx*cz + cx*sz,  -sy*sx*sz + cx*cz, -sx*cy,
            -sy*cx*cz + sx*sz, sy*cx*sz + cz*sx,  cx*cy
        ]);
    }
}


let cam = new Camera(window.innerWidth, window.innerHeight, Math.PI / 2, 0.5, 0.5, -4, 0, 0, 0),
    map = new Map(),
    rotMatrix = Matrix.createRot(0.01, 0.01, 0.01),
    frame = () => {
        map.applyMatrix(rotMatrix);
        cam.clear();
        cam.trace(map);
        window.requestAnimationFrame(frame);
    };

frame()
