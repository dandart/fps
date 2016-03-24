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
    }

    addCubeAt(minx,miny,minz,maxx,maxy,maxz) {
        let tris = this.triangles.length;

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
            [tris,tris+1,tris+2,64,0,0], // left
            [tris+1,tris+2,tris+3,64,0,0],
            [tris+4,tris+5,tris+6,0,64,0], // right
            [tris+5,tris+6,tris+7,0,64,0],
            [tris+2,tris+3,tris+6,0,0,64], // top
            [tris+3,tris+6,tris+7,0,0,64],
            [tris+2,tris+6,tris,64,64,0], // front
            [tris+6,tris,tris+4,64,64,0],
            [tris,tris+4,tris+5,0,64,64], // bottom
            [tris,tris+5,tris+1,0,64,64],
            [tris+1,tris+5,tris+7,64,0,64], // back
            [tris+1,tris+7,tris+3,64,0,64]
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
