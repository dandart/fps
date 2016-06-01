precision mediump float;


varying vec3 fragPosition;
varying vec2 fragTexCoord;
varying vec3 fragNormal;

uniform vec3 pointLightPosition;
uniform vec4 meshColour;

void main()
{
    float lightIntensity = 0.4 + 0.6 * max(
        dot(
            fragNormal,
            normalize(
                pointLightPosition - fragPosition
            )
        ),
        0.0
    );
    gl_FragColor = vec4(meshColour.rgb * lightIntensity, meshColour.a);

}
