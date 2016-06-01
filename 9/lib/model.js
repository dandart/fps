class Model {
    constructor(name, arrVertices, arrIndices, arrTexCoords, arrNormals, v4Trans, colour) {
        this.vertices = arrVertices;
        this.texCoords = arrTexCoords;
        this.indices = arrIndices;
        this.normals = arrNormals;
        this.v4Trans = v4Trans;
        this.colour = colour;

        //mat4.invert(this.v4Trans, this.v4Trans);

        //this.v4Trans = mat4.create();
        //mat4.translate(this.v4Trans, this.v4Trans, vec3.fromValues(Math.random() * 20, Math.random() * 20, Math.random() * 20));

        this.posVertexBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.posVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrVertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrTexCoords), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrIndices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrNormals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    use(program) {
        gl.useProgram(program);
        enablePositionBuffer(program, this.posVertexBuffer);
        enableIndexBuffer(program, this.indexBuffer);
        //enableTexCoordBuffer(program, this.texCoordBuffer);
        enableNormalBuffer(program, this.normalBuffer);

        //let tex = enableTexture('grass');
        //useTexture(tex);
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

    getColour() {
        return this.colour;
    }
}
