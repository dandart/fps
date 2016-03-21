class Camera {
    constructor(w,h,fov,x,y,z,tx,ty,tz) {
        this.canvases = document.getElementsByTagName('canvas');
        this.canvas = this.canvases[0];
        this.canvas.height = h;
        this.canvas.width = w;
        this.canvas.style.height = h+'px';
        this.canvas.style.width = w+'px';
        this.ctx = this.canvas.getContext('2d')
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

    trace(map, res, maxdepth) {
        for (let y = 0; y <= this.h; y += res) {
            for (let x = 0; x <= this.w; x += res) {
                // first get angle
                let tx = this.tx + (this.fov / this.w) * (x - this.origin.x),
                    ty = this.ty + (this.fov / this.h) * (this.origin.y - y)

                // get real colour
                let depth = 1;
                while (depth < maxdepth) {
                    let dz = Math.floor(depth),
                        dx = Math.floor(depth * Math.sin(tx)),
                        dy = Math.floor(depth * Math.sin(ty)),
                        newx = this.x + dx,
                        newy = this.y + dy,
                        newz = this.z + dz;

                    if (0 > newx || map.x <= newx ||
                        0 > newy || map.y <= newy ||
                        0 > newz || map.z <= newz) {
                        depth++;
                        continue;
                    }

                    let voxel = map.get(newx, newy, newz);

                    if (0 == voxel.r &&
                        0 == voxel.g &&
                        0 == voxel.b) {
                        depth++;
                        continue;
                    }

                    let style = 'rgb('+voxel.r+','+voxel.g+','+voxel.b+')';
                    this.ctx.fillStyle = style;
                    this.ctx.fillRect(x, y, res, res);
                    break;
                }
            }
        }
    }
}

class Map {
    constructor(x,y,z) {
        this.grid = [];
        Object.assign(this, {x,y,z});
    }

    get(x,y,z) {
        if (x < 0 || x >= this.x ||
            y < 0 || y >= this.y ||
            z < 0 || z >= this.z) {
            return {
                r: 0,
                g: 0,
                b: 0
            }
        }

        x = Math.floor(x);
        y = Math.floor(y);
        z = Math.floor(z);

        let res = this.grid[x][y][z];

        return {
            r: res[0],
            g: res[1],
            b: res[2]
        };
    }

    random() {
        this.grid = [];
        for (let x = 0; x < this.x; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.y; y++) {
                this.grid[x][y] = [];
                for (let z = 0; z < this.z; z++) {
                    this.grid[x][y][z] = [
                        Math.floor(Math.random() * 255),
                        Math.floor(Math.random() * 255),
                        Math.floor(Math.random() * 255)
                    ];
                }
            }
        }
    }
}

let cam = new Camera(window.innerWidth, window.innerHeight, Math.PI / 2, -10, 5, -10, 0, 0, 0);
cam.clear();
let map = new Map(10, 10, 10);
map.random();

let frame = () => {
    cam.clear()
    cam.tx += 0.05;
    cam.trace(map, 10, 15);
    window.requestAnimationFrame(frame);
};

frame();
