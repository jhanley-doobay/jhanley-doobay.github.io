document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('vista-bg');
  if (!canvas) return;

  var gl = canvas.getContext('webgl');
  if (!gl) return;

  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '-1';

  gl.viewport(0, 0, canvas.width, canvas.height);

  var vsSource = [
    'attribute vec2 a_pos;',
    'void main() {',
    '  gl_Position = vec4(a_pos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var fsSource = [
    'precision mediump float;',
    'uniform float u_time;',
    'uniform vec2 u_resolution;',
    '',
    'vec3 palette(float t) {',
    '  vec3 a = vec3(0.10, 0.15, 0.25);',
    '  vec3 b = vec3(0.35, 0.55, 0.50);',
    '  vec3 c = vec3(0.30, 0.25, 0.45);',
    '  vec3 d = vec3(0.85, 0.80, 0.90);',
    '  return a + b * cos(6.28318 * (c * t + d));',
    '}',
    '',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
    '  float time = u_time * 0.4;',
    '',
    '  float wave = sin(time * 1.5);',
    '  vec3 finalCol = vec3(0.02, 0.03, 0.06);',
    '',
    '  for (float i = 0.0; i < 8.0; i++) {',
    '    float d = uv.y;',
    '    float w = uv.x;',
    '',
    '    d = sin(d - 0.25 * 0.15 * (wave / 6.0 + 5.0))',
    '      + sin(uv.x * 2.5 + time / 3.0) / 25.0',
    '      - sin(i * 0.8) / 12.0',
    '      + sin(uv.x * 5.0 + time * 0.8 * i * 0.15) / 25.0;',
    '    d = abs(d / 2.0);',
    '    d = 0.004 / d / 10.0 * i;',
    '',
    '    w += sin(uv.y * 2.0 + time) / 80.0;',
    '    w = abs(sin(w * 15.0 * i / 5.0 + time * sin(i * 0.7)) / 25.0',
    '        + sin(w * 12.0 * i) / 20.0) * 25.0;',
    '    w += uv.y * 2.2 - 1.4;',
    '    w /= 3.5;',
    '    w = smoothstep(0.45, 0.75, w) / 25.0;',
    '',
    '    vec3 col = palette(uv.x * 0.6 + i * 0.08 + time / 4.0);',
    '    finalCol += col * (d + w);',
    '  }',
    '',
    '  finalCol *= 0.7;',
    '  gl_FragColor = vec4(finalCol, 1.0);',
    '}'
  ].join('\n');

  function compileShader(source, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  var vs = compileShader(vsSource, gl.VERTEX_SHADER);
  var fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
  if (!vs || !fs) return;

  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  var aPos = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uTime = gl.getUniformLocation(program, 'u_time');
  var uRes = gl.getUniformLocation(program, 'u_resolution');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var startTime = performance.now();

  function render() {
    var t = (performance.now() - startTime) / 1000;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }

  canvas.style.opacity = '1';
  render();

  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  });
});
