#version 300 es
precision mediump float;

layout(location = 0) in vec3 vertPosition;
layout(location = 1) in vec3 normalPosition;
layout(location = 2) in vec2 vertTexCoord;
out vec2 fragTexCoord;
out float o_light;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;

void main()
{
  vec3 unitNormal = (modelMatrix * vec4(normalPosition, 0)).xyz;
  o_light = min(1.0, max(0.5, dot(vec3(1, 2, 0.5), unitNormal)));
  fragTexCoord = vertTexCoord;
  gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(vertPosition, 1.0);
}