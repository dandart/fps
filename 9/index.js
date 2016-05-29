let T = 2 * Math.PI,
    canvas = document.querySelector('canvas'),
    h = window.innerHeight,
    w = window.innerWidth,
    angleX = 0,
    angleY = 0,
    camera,
    proj;

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
    pVerticesText = loadAjax('susan.json'),
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

        let program = gl.createProgram();

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
    enablePositionBuffer = (program, arrVertices) => {
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
    enableTexCoordBuffer = (program, arrTexCoords) => {
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
    enableIndexBuffer = (program, arrIndices) => {
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrIndices), gl.STATIC_DRAW);
    },
    enableNormalBuffer = (program, arrNormals) => {
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
    enableTexture = (program, texId) => {
        let tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById(texId))
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return tex;
    },
    getUL = (program, name) => {
        try {
            return gl.getUniformLocation(program, name);
        } catch (err) {
            console.log(err.stack);
        }
    },
    setUM4fv = (program, name, value) => {
        try {
            return gl.uniformMatrix4fv(getUL(program, name), gl.FALSE, value);
        } catch (err) {
            console.log(err.stack)
        }
    },
    setU3f = (program, name, x, y, z) => gl.uniform3f(getUL(program, name), x, y, z),
    enableWorld = (program) => {
        let mWorld = mat4.create();
        mat4.identity(mWorld);
        setUM4fv(program, 'mWorld', mWorld);
    },
    enableLights = (program) => {
        setU3f(program, 'ambientLightIntensity', 0.2, 0.2, 0.2);
        setU3f(program, 'sun.direction', 3.0, 4.0, -2.0);
        setU3f(program, 'sun.intensity', 0.9, 0.9, 0.9);
    },
    useTexture = (tex) => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.activeTexture(gl.TEXTURE0);
    },
    Proj = class Proj {
        constructor(gl, program, fov = T / 8, aspect = w / h, near = 0.1, far = 1000.0) {
            this.gl = gl;
            this.program = program;
            this.fov = fov;
            this.aspect = aspect;
            this.near = near;
            this.far = far;
            this.mProj = mat4.create();
            this.apply();
        }

        apply() {
            mat4.perspective(this.mProj, this.fov, this.aspect, this.near, this.far);
            setUM4fv(this.program, 'mProj', this.mProj);
        }

        getProgram() {
            return this.program;
        }
    },
    Camera = class Camera {
        constructor(gl, program, eye = [0, 0, -5], center = [0, 0, 0]) {
            this.program = program;
            this.mView = mat4.create();
            this.eye = eye;
            this.center = center;
            this.up = [0, 1, 0];

            this.apply();
        }

        moveForward() {
            this.eye[2] += 0.2;
            this.center[2] += 0.2;
            this.apply();
        }

        moveBack() {
            this.eye[2] -= 0.2;
            this.center[2] -= 0.2;
            this.apply();
        }

        moveLeft() {
            this.eye[0] += 0.2;
            this.center[0] += 0.2;
            this.apply();
        }

        moveRight() {
            this.eye[0] -= 0.2;
            this.center[0] -= 0.2;
            this.apply();
        }

        yawLeft() {
            this.center[0] -= 0.2;
            this.apply();
        }

        yawRight() {
            this.center[0] += 0.2;
            this.apply();
        }

        pitchUp() {
            this.center[1] += 0.2;
            this.apply();
        }

        pitchDown() {
            this.center[1] -= 0.2;
            this.apply();
        }

        apply() {
            mat4.lookAt(this.mView, this.eye, this.center, this.up);
            setUM4fv(this.program, 'mView', this.mView);
        }

        getProgram() {
            return this.program;
        }
    }
    createProgram = (vertexText, fragmentText, verticesText) => {
        let arr = JSON.parse(verticesText),
            arrVertices = arr.meshes[0].vertices,
            arrIndices = [].concat.apply([], arr.meshes[0].faces),
            arrTexCoords = arr.meshes[0].texturecoords[0],
            arrNormals = arr.meshes[0].normals,
            program = compileProgram(vertexText, fragmentText),
            tex = enableTexture(program, 'texture');

        applySettings();
        enablePositionBuffer(program, arrVertices);
        enableTexCoordBuffer(program, arrTexCoords);
        enableIndexBuffer(program, arrIndices);
        enableNormalBuffer(program, arrNormals);
        gl.useProgram(program);
        camera = new Camera(gl, program);
        program = camera.getProgram();
        proj = new Proj(gl, program);
        program = proj.getProgram();
        enableWorld(program);
        enableLights(program);

        loop = () => {
            clear();
            useTexture(tex);
            draw(arrVertices, arrIndices);

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
    },
    keypress = (ev) => {
        switch (ev.key) {
            case 'w':
                camera.moveForward();
                break;
            case 's':
                camera.moveBack();
                break;
            case 'a':
                camera.moveLeft();
                break;
            case 'd':
                camera.moveRight();
                break;
            case 'ArrowUp':
                camera.pitchUp();
                break;
            case 'ArrowDown':
                camera.pitchDown();
                break;
            case 'ArrowLeft':
                camera.yawLeft();
                break;
            case 'ArrowRight':
                camera.yawRight();
                break;
            default:
                console.log(ev.key);
                break;
        }

    };

load();
addEventListener('keypress', keypress);
