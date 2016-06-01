let addChild = (models, arr, child) => {
        let trans = mat4.create(),
            colour = vec4.create();
        mat4.identity(trans);
        // sadly the original file's translations I didn't understand
        switch(child.name) {
            case 'Thingy':
                mat4.translate(trans, trans, mat3.fromValues(0, 10, 0));
                colour = vec4.fromValues(0.7, 0, 0.7, 1);
                break;
            case 'Floor':
                mat4.scale(trans, trans, mat3.fromValues(40, 40, 0));
                colour = vec4.fromValues(0.6, 0.6, 0.6, 1);
                break;
            case 'Trunk':
                mat4.translate(trans, trans, mat3.fromValues(3, 5, 0));
                colour = vec4.fromValues(0.5, 0.5, 0.1, 1);
                break;
            case 'Trunk.001':
                mat4.translate(trans, trans, mat3.fromValues(3, -5, 0));
                colour = vec4.fromValues(0.5, 0.5, 0.1, 1);
                break;
            case 'Trunk.002':
                mat4.translate(trans, trans, mat3.fromValues(-6, 5, 0));
                colour = vec4.fromValues(0.5, 0.5, 0.1, 1);
                break;
            case 'Trunk.003':
                mat4.translate(trans, trans, mat3.fromValues(-6, -5, 0));
                colour = vec4.fromValues(0.5, 0.5, 0.1, 1);
                break;
            case 'Tree':
                mat4.scale(trans, trans, mat3.fromValues(3, 3, 3));
                mat4.translate(trans, trans, mat3.fromValues(2/3, 5/3, 8/3));
                colour = vec4.fromValues(0, 0.5, 0, 1);
                break;
            case 'Tree.001':
                mat4.scale(trans, trans, mat3.fromValues(3, 3, 3));
                mat4.translate(trans, trans, mat3.fromValues(3/3, -5/3, 8/3));
                colour = vec4.fromValues(0, 0.5, 0, 1);
                break;
            case 'Tree.002':
                mat4.scale(trans, trans, mat3.fromValues(3, 3, 3));
                mat4.translate(trans, trans, mat3.fromValues(-6/3, 5/3, 8/3));
                colour = vec4.fromValues(0, 0.5, 0, 1);
                break;
            case 'Tree.003':
                mat4.scale(trans, trans, mat3.fromValues(3, 3, 3));
                mat4.translate(trans, trans, mat3.fromValues(-6/3, -5/3, 8/3));
                colour = vec4.fromValues(0, 0.5, 0, 1);
                break;
            case 'Tunnel':
                mat4.rotate(trans, trans, T/4, mat3.fromValues(1, 0, 0));
                mat4.rotate(trans, trans, T/4, mat3.fromValues(0, 1, 0));
                mat4.translate(trans, trans, mat3.fromValues(0, 4, -30));
                colour = vec4.fromValues(0.4, 0.2, 0.2, 1);
                break;
            case 'Text':
                mat4.rotate(trans, trans, T/4, mat3.fromValues(1, 0, 0));
                mat4.rotate(trans, trans, T/4, mat3.fromValues(0, 1, 0));
                mat4.translate(trans, trans, mat3.fromValues(-1.5, 7, -16));
                colour = vec4.fromValues(0.8, 0.6, 0.4, 1);
                break;
            case 'Lamp':
            case 'Camera':
            case 'Sun':
                break;
            default:
                console.log('Dunno what to do with', child.name);
        }

        if ('undefined' !== typeof child.meshes) {
            for (let meshId of child.meshes) {
                let mesh = arr.meshes[meshId];

                let model = new Model(
                    child.name,
                    mesh.vertices,
                    [].concat.apply([], mesh.faces),
                    mesh.texturecoords?mesh.texturecoords[0]:[],
                    mesh.normals,
                    trans,
                    colour
                );
                models.push(model);
            }
        }

        if ('undefined' !== typeof child.children) {
            for (let child2 of child.children) {
                addChild(models, arr, child2);
            }
        }
    },
    addObjects = (models, arr) => {
        console.log(arr)
        for (let child of arr.rootnode.children) {
            addChild(models, arr, child);
        }
        return models;
    };
