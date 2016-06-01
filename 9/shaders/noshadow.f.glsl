precision mediump float;

varying vec3 fragPosition;
varying vec2 fragTexCoord;
varying vec3 fragNormal;

uniform vec3 pointLightPosition;
uniform vec4 meshColour;

uniform sampler2D sampler;

void main()
{
    vec4 texel = texture2D(sampler, fragTexCoord);


    float lightIntensity = 0.4 + 0.6 * max(
        dot(
            fragNormal,
            normalize(
                pointLightPosition - fragPosition
            )
        ),
        0.0
    );
    gl_FragColor = vec4((texel.rgb + meshColour.rgb) * lightIntensity, meshColour.a);

}
