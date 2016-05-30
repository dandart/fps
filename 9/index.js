let T = 2 * Math.PI,
    canvas = document.querySelector('canvas'),
    h = window.innerHeight,
    w = window.innerWidth,
    angleX = 0,
    angleY = 0;

canvas.height = h;
canvas.width = w;
canvas.style.height = h+'px';
canvas.style.width = w + 'px';

let gl = canvas.getContext('webgl'),
    loadAjax = (name) => new Promise((res, rej) => {
        let x = new XMLHttpRequest();
        x.open('GET', name, true);
        x.onreadystatechange = () => {
            if (4 == x.readyState) {
                if (200 !== x.status)
                    return rej('Error loading '+name);
                return res(x.responseText);
            }
        };
        x.send();
    }),
    pVertexText = loadAjax('vertex.v.glsl'),
    pFragmentText = loadAjax('fragment.f.glsl'),
    pVerticesText = loadAjax('vinski1.json'),
    clear = () => {
        gl.clearColor(0.5, 0.5, 0.5, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },
    draw = (arrVertices, arrIndices) => gl.drawElements(
        gl.TRIANGLES,
        arrIndices.length,
        gl.UNSIGNED_SHORT,
        0
    ),
    program,
    compileProgram = (vertexText, fragmentText) => {
        let vertexShader = gl.createShader(gl.VERTEX_SHADER),
            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, vertexText);
        gl.shaderSource(fragmentShader, fragmentText);

        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(vertexShader));
            throw new Error('Error compiling vertex shader');
        }

        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(fragmentShader));
            throw new Error('Error compiling fragment shader');
        }

        program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.log(gl.getProgramInfoLog(program));
            throw new Error('Error linking program');
        }

        gl.validateProgram(program);
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
            console.log(gl.getProgramInfoLog(program));
            throw new Error('Error validating program');
        }

        return program;
    },
    applySettings = () => {
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);
    },
    enablePositionBuffer = (arrVertices) => {
        let posVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posVertexBuffer);
        let positionAttributeLocation = gl.getAttribLocation(program, 'vertPosition');
        gl.vertexAttribPointer(
            posVertexBuffer,
            3, gl.FLOAT,
            gl.FALSE,
            3 * Float32Array.BYTES_PER_ELEMENT,
            0
        );
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrVertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
    },
    enableTexCoordBuffer = (arrTexCoords) => {
        let texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        let texCoordAttributeLocation = gl.getAttribLocation(program, 'vertTexCoord');
        gl.vertexAttribPointer(
            texCoordAttributeLocation,
            2, gl.FLOAT,
            gl.FALSE,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0
        );
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrTexCoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texCoordAttributeLocation);
    },
    enableIndexBuffer = (arrIndices) => {
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrIndices), gl.STATIC_DRAW);
    },
    enableNormalBuffer = (arrNormals) => {
        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        let normalAttribLocation = gl.getAttribLocation(program, 'vertNormal');
        gl.vertexAttribPointer(
            normalAttribLocation,
            3, gl.FLOAT,
            gl.TRUE,
            3 * Float32Array.BYTES_PER_ELEMENT,
            0
        );
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrNormals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(normalAttribLocation);
    },
    enableTexture = (texId) => {
        let tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            document.getElementById(texId)
        );
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return tex;
    },
    getUL = (name) => gl.getUniformLocation(program, name),
    setUM4fv = (name, value) => gl.uniformMatrix4fv(getUL(name), gl.FALSE, value),
    setU3f = (name, x, y, z) => gl.uniform3f(getUL(name), x, y, z),
    World = class World {
        constructor() {
            this.mWorld = mat4.create();
            mat4.identity(this.mWorld);
        }

        rotate() {
            mat4.rotate(this.mWorld, this.mWorld, 0.01, [0, 1, 0]);
            refresh();
        }

        getMat4() {
            return this.mWorld;
        }

        setMat4(mat4) {
            this.mWorld = mat4;
        }
    },
    world,
    enableLights = () => {
        setU3f('ambientLightIntensity', 0.2, 0.2, 0.2);
        setU3f('sun.direction', 3.0, 4.0, -2.0);
        setU3f('sun.intensity', 0.9, 0.9, 0.9);
    },
    useTexture = (tex) => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.activeTexture(gl.TEXTURE0);
    },
    Proj = class Proj {
        constructor(fov = T / 8, aspect = w / h, near = 0.1, far = 1000.0) {
            this.fov = fov;
            this.aspect = aspect;
            this.near = near;
            this.far = far;
            this.mProj = mat4.create();
            this.apply();
        }

        apply() {
            mat4.perspective(this.mProj, this.fov, this.aspect, this.near, this.far);
            refresh();
        }

        getMat4() {
            return this.mProj;
        }
    },
    proj,
    Camera = class Camera {
        constructor(position = [0, 0, -5], lookAt = [0, 0, 0], up = [0, 1, 0]) {
            this.forward = vec3.create();
            this.up = vec3.create();
            this.right = vec3.create();

            this.position = position;

            this.mView = mat4.create();

            // get what I'm looking at from my perspective
            vec3.subtract(this.forward, lookAt, this.position);
            vec3.add(this.up, this.up, up);

            this.renorm();

            this.rotSpeed = 0.001;
            this.moveSpeed = 0.01;
            this.slowSpeed = 0.01;
            this.fastSpeed = 0.02;
        }

        setFast() {
            this.moveSpeed = this.fastSpeed;
        }

        setSlow() {
            this.moveSpeed = this.slowSpeed;
        }

        renorm() {
            vec3.cross(this.right, this.forward, this.up);
            vec3.cross(this.up, this.right, this.forward);

            vec3.normalize(this.forward, this.forward);
            vec3.normalize(this.right, this.right);
            vec3.normalize(this.up, this.up);
        }

        getMat4() {
            let lookAt = vec3.create();
            vec3.add(lookAt, this.position, this.forward);
            mat4.lookAt(this.mView, this.position, lookAt, this.up);
            return this.mView;
        }

        moveForward() {
            vec3.scaleAndAdd(this.position, this.position, this.forward, this.moveSpeed);
            this.apply();
        }

        moveBack() {
            vec3.scaleAndAdd(this.position, this.position, this.forward, -this.moveSpeed);
            this.apply();
        }

        strafeLeft() {
            vec3.scaleAndAdd(this.position, this.position, this.right, -this.moveSpeed);
            this.apply();
        }

        strafeRight() {
            vec3.scaleAndAdd(this.position, this.position, this.right, this.moveSpeed);
            this.apply();
        }

        yawLeft() {
            let mRight = mat4.create();
            mat4.rotate(mRight, mRight, this.rotSpeed, vec3.fromValues(0, 1, 0));
            vec3.transformMat4(this.forward, this.forward, mRight);
            this.renorm();
            this.apply();
        }

        yawRight() {
            let mRight = mat4.create();
            mat4.rotate(mRight, mRight, -this.rotSpeed, vec3.fromValues(0, 1, 0));
            vec3.transformMat4(this.forward, this.forward, mRight);
            this.renorm();
            this.apply();
        }

        pitchUp() {
            let mUp = mat4.create();
            mat4.rotate(mUp, mUp, -this.rotSpeed, vec3.fromValues(1, 0, 0));
            vec3.transformMat4(this.forward, this.forward, mUp);
            this.renorm();
            this.apply();
        }

        pitchDown() {
            let mUp = mat4.create();
            mat4.rotate(mUp, mUp, this.rotSpeed, vec3.fromValues(1, 0, 0));
            vec3.transformMat4(this.forward, this.forward, mUp);
            this.renorm();
            this.apply();
        }

        yawAndPitch(x, y) {
            let mRot = mat4.create();
            mat4.rotate(mRot, mRot, -this.rotSpeed * x, vec3.fromValues(0, 1, 0));
            mat4.rotate(mRot, mRot, this.rotSpeed * y, vec3.fromValues(1, 0, 0));
            vec3.transformMat4(this.forward, this.forward, mRot);
            this.renorm();
            this.apply();
        }

        apply() {
            refresh();
        }
    },
    camera,
    ready,
    refresh = () => {
        if (!ready) return;
        let mPos = mat4.create();
        mat4.identity(mPos);
        setUM4fv('mWorld', world.getMat4());
        //setUM4fv('mView', camera.getMat4());
        //setUM4fv('mProj', proj.getMat4());

        mat4.multiply(mPos, world.getMat4(), mPos);
        mat4.multiply(mPos, camera.getMat4(), mPos);
        mat4.multiply(mPos, proj.getMat4(), mPos);
        setUM4fv('mPos', mPos);
        return mPos;
    },
    Model = class Model {
        constructor(arrVertices, arrIndices, arrTexCoords, arrNormals, v4Trans) {
            this.vertices = arrVertices;
            this.texCoords = arrTexCoords;
            this.indices = arrIndices;
            this.normals = arrNormals;
            this.v4Trans = v4Trans;
        }

        use() {
            enablePositionBuffer(this.vertices);
            enableTexCoordBuffer(this.texCoords);
            enableIndexBuffer(this.indices);
            enableNormalBuffer(this.normals);
        }

        getVertices() {
            return this.vertices;
        }

        getIndices() {
            return this.indices;
        }

        getMat4() {
            return this.v4Trans;
        }
    },
    addObjects = (arr) => {
        let models = [];

        for (let child of arr.rootnode.children) {
            console.log('Adding child', child.name);
            let trans = mat4.fromValues(...child.transformation);
            console.log(trans)

            if ('undefined' !== typeof child.meshes) {
                for (let meshId of child.meshes) {
                    console.log('Needs mesh ID', meshId);
                    let mesh = arr.meshes[meshId];
                    console.log('Adding mesh', mesh.name);

                    let model = new Model(
                        mesh.vertices,
                        [].concat.apply([], mesh.faces),
                        mesh.texturecoords[0],
                        mesh.normals,
                        trans
                    );
                    console.log(trans)
                    models.push(model);
                }
            }
        }
        return models;
    },
    createProgram = (vertexText, fragmentText, verticesText) => {
        let arr = JSON.parse(verticesText),
            program = compileProgram(vertexText, fragmentText),
            tex = enableTexture('texture');

        let models = addObjects(arr);

        console.log(arr);

        applySettings();

        gl.useProgram(program);
        camera = new Camera();
        proj = new Proj();
        world = new World();
        enableLights();
        ready = true;
        refresh();

        loop = () => {
            clear();
            useTexture(tex);
            for (let model of models) {
                model.use();
                //world.setMat4(model.getMat4());
                refresh();

                draw(model.getVertices(), model.getIndices());
                keycheck();
            }
            //draw(...indsverts);

            requestAnimationFrame(loop);
        };
        loop();
    },
    load = () => {
        Promise.all([
            pVertexText,
            pFragmentText,
            pVerticesText
        ]).then((r) => createProgram(...r)).catch((err) => console.log(err));

        window.addEventListener('keydown', keydown);
        window.addEventListener('keyup', keyup);
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
        window.addEventListener('mousemove', mousemove);
    },
    keys = new Set(),
    keydown = (ev) => keys.add(ev.key.toLowerCase());
    keyup = (ev) => keys.delete(ev.key.toLowerCase());
    keycheck = () => {
        if (keys.has('shift'))
            camera.setFast();
        else
            camera.setSlow();

        if (keys.has('w') && !keys.has('s'))
            camera.moveForward();
        if (keys.has('s') && !keys.has('w'))
            camera.moveBack();
        if (keys.has('a') && !keys.has('d'))
            camera.strafeLeft();
        if (keys.has('d') && !keys.has('a'))
            camera.strafeRight();
        if (keys.has('arrowup') && !keys.has('arrowdown'))
            camera.pitchUp();
        if (keys.has('arrowdown') && !keys.has('arrowup'))
            camera.pitchDown();
        if (keys.has('arrowleft') && !keys.has('arrowright'))
            camera.yawLeft();
        if (keys.has('arrowright') && !keys.has('arrowleft'))
            camera.yawRight()
    };
    mousemove = (ev) => {
        ev.movementX = ev.movementX || ev.mozMovementX;
        ev.movementY = ev.movementY || ev.mozMovementY;
        camera.yawAndPitch(ev.movementX, ev.movementY);
    }

load();
