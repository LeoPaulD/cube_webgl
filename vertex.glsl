attribute vec3 position;
attribute float size;
attribute vec4 aVertexColor;

uniform mat4 transformation;
uniform mat4 perspective;

varying vec4 vColor;

void main () {
  gl_Position = perspective * transformation * vec4(position, 1);
  gl_PointSize = (position[0] + 1.0) * 20.0;
  vColor = aVertexColor;
}