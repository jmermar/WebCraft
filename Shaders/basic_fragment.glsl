#version 300 es
precision mediump float;

in vec2 fragTexCoord;
in float o_light;
uniform sampler2D sampler;
out vec4 fragColor;

void main()
{
  fragColor = texture(sampler, fragTexCoord);
  float a = fragColor.a;
  fragColor = fragColor * o_light;
  fragColor.a = a;
}