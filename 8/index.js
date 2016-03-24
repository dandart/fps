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

                objtx = Math.atan(dx / dz),
                objty = Math.atan(dy / dz),
                objtz = 0,

                tx = objtx + this.tx,
                ty = objty + this.ty,
                tz = this.tz,

                dpx = Math.sin(objtx + this.tx) / Math.sin(this.fov / 2) * (this.h / 2),
                dpy = Math.sin(objty + this.ty) / Math.sin(this.fov / 2) * (this.h / 2),

                px = dpx + this.origin.x,
                py = this.origin.y - dpy;

            spoints[iter] = {px,py,dx,dy,dz};
        }

        let orderedTriangles = [];

        for (let triangle of map.triangles) {
            let spoint0 = spoints[triangle[0]],
                spoint1 = spoints[triangle[1]],
                spoint2 = spoints[triangle[2]],
                avgdz = (spoint0.dz + spoint1.dz + spoint2.dz) / 3;
            orderedTriangles.push({avgdz, triangle});
        }

        orderedTriangles.sort((v1,v2)=>v1.avgdz<v2.avgdz);
        for (let tri of orderedTriangles) {
            let triangle = tri.triangle;
            this.ctx.beginPath();

            this.ctx.strokeStyle = 'rgb('+triangle[3]+','+triangle[4]+','+triangle[5]+')';
            this.ctx.fillStyle = this.ctx.strokeStyle;

            this.ctx.moveTo(spoints[triangle[0]].px, spoints[triangle[0]].py);
            this.ctx.lineTo(spoints[triangle[1]].px, spoints[triangle[1]].py);
            this.ctx.lineTo(spoints[triangle[2]].px, spoints[triangle[2]].py);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }
    }
}

class Map {
    constructor() {
        this.points = [];
        this.triangles = [];

        this.addCubeAt(-1,-1,-1,1,1,1);
        this.addCubeAt(2,2,2,3,3,3);
        this.addCubeAt(-10,-4,-1,10,-5,10);
    }

    addCubeAt(minx,miny,minz,maxx,maxy,maxz) {
        let points = this.points.length;

        this.points = this.points.concat([
            [minx,miny,minz], // fbl
            [minx,miny,maxz], // bbl
            [minx,maxy,minz], // ftl
            [minx,maxy,maxz], // btl
            [maxx,miny,minz], // fbr
            [maxx,miny,maxz], // bbr
            [maxx,maxy,minz], // ftr
            [maxx,maxy,maxz] // btr
        ]);

        this.triangles = this.triangles.concat([
            [points,points+1,points+2,64,0,0], // left
            [points+1,points+2,points+3,64,0,0],
            [points+4,points+5,points+6,0,64,0], // right
            [points+5,points+6,points+7,0,64,0],
            [points+2,points+3,points+6,0,0,64], // top
            [points+3,points+6,points+7,0,0,64],
            [points+2,points+6,points,64,64,0], // front
            [points+6,points,points+4,64,64,0],
            [points,points+4,points+5,0,64,64], // bottom
            [points,points+5,points+1,0,64,64],
            [points+1,points+5,points+7,64,0,64], // back
            [points+1,points+7,points+3,64,0,64]
        ]);
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

let xspeed = 0.03,
    yspeed = 0.03,
    zspeed = 0.01;

let cam = new Camera(window.innerWidth, window.innerHeight, T/4, 0, 0, -5, 0, 0, 0),
    map = new Map(),
    frame = () => {
        cam.clear();
        cam.trace(map);
        window.requestAnimationFrame(frame);
    };

frame();

window.addEventListener('keypress', (e) => {
    switch (e.code) {
        case 'KeyW':
            cam.x += 0.5 * Math.sin(cam.tx);
            cam.z += 0.5 * Math.cos(cam.tx);
            //map.apply4DMatrix(Matrix.createTransformation(0, 0, 0, 0, 0, -0.1));
            break;
        case 'KeyA':
            cam.x += 0.5 * Math.sin(cam.tx - T/4);
            cam.z += 0.5 * Math.cos(cam.tx - T/4);
            break;
        case 'KeyS':
            cam.x -= 0.5 * Math.sin(cam.tx);
            cam.z -= 0.5 * Math.cos(cam.tx);
            break;
        case 'KeyD':
            cam.x += 0.5 * Math.sin(cam.tx + T/4);
            cam.z += 0.5 * Math.cos(cam.tx + T/4);
            break;
        case 'ArrowLeft':
            //map.apply4DMatrix(Matrix.createTransformation(0, 0.1, 0, 0, 0, 0));
            cam.tx += 0.05;
            break;
        case 'ArrowRight':
            cam.tx -= 0.05;
            break;
        case 'ArrowUp':
            cam.ty -= 0.05;
            break;
        case 'ArrowDown':
            cam.ty += 0.05;
            break;
        case 'Equal':
            cam.fov += T / 32;
            break;
        case 'Minus':
            cam.fov -= T / 32;
            break;
        default:
            console.log(e.code);
            break;
    }
});
