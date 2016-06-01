let runPrograms = (program, shadowProgram, shadowGenProgram, arrVinski1, arrTunnel) => {
        let models = [];
        addObjects(models, arrVinski1);
        addObjects(models, arrTunnel);
        applySettings();
        gl.useProgram(program);
        camera = new Camera(program);

        gl.useProgram(program);
        proj = new Proj(program);
        world = new World(program);
        enableLights(program);

        resize(program);
        events(program);

        ready = true;
        loop = () => {
            clear();
            gl.useProgram(program);
            vec3.rotateY(pointLightPosition, pointLightPosition, vec3.fromValues(0, 2, 0), 0.01);
            enableLights(program);

            camera.gravitateTo(0);

            //useTexture(tex);
            for (let model of models) {
                model.use(program);
                setColour(program, model.getColour());
                refresh(
                    program,
                    model.getMat4(),
                    camera.getMat4(),
                    proj.getMat4()
                );

                draw(model.getIndices());
                keycheck();
            }

            requestAnimationFrame(loop);
        };
        loop();
    }
