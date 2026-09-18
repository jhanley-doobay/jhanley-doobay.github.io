document.addEventListener('DOMContentLoaded', function() {
  var heroContainer = document.querySelector('.hero-container');
  if (!heroContainer) return;

  var canvas = document.createElement('canvas');
  canvas.classList.add('vhs-canvas');
  heroContainer.insertBefore(canvas, heroContainer.querySelector('.rain-container'));

  var gl = canvas.getContext('webgl');
  if (!gl) return;

  var video = heroContainer.querySelector('video');
  var img = heroContainer.querySelector('img');

  var source = null;
  var isVideo = !!video;
  var initialized = false;

  if (isVideo) {
    video.addEventListener('canplay', function onCanPlay() {
      video.removeEventListener('canplay', onCanPlay);
      source = video;
      video.playbackRate = 0.1;
      requestAnimationFrame(resize);
    });
    if (video.readyState >= 3) {
      source = video;
      video.playbackRate = 0.1;
      requestAnimationFrame(resize);
    }
  } else if (img) {
    var imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = function() {
      source = imgEl;
      requestAnimationFrame(resize);
    };
    imgEl.src = img.src;
  }

  function resize() {
    var rect = heroContainer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (source && !initialized) {
      initialized = true;
      init();
    }
  }

  function init() {
    var vsSource = [
      'attribute vec2 a_pos;',
      'varying vec2 v_uv;',
      'void main() {',
      '  v_uv = a_pos * 0.3 + 0.5;',
      '  gl_Position = vec4(a_pos, 0.4, 0.95);',
      '}'
    ].join('\n');

    var fsSource = [
      'precision mediump float;',
      'uniform float u_time;',
      'uniform vec2 u_resolution;',
      'uniform sampler2D u_texture;',
      'varying vec2 v_uv;',
      '',
      '#define INTERLACING_SEVERITY 0.001',//0.0005
      '#define TRACKING_HEIGHT 0.05',
      '#define TRACKING_SEVERITY 0.1',//0.025
      '#define TRACKING_SPEED 0.3',
      '#define SHIMMER_SPEED 50.0',//30.0
      '#define RGB_MASK_SIZE 3.0',
      '',
      'void main() {',
      '  vec2 uv = v_uv;',
      '  uv.y = 1.0 - uv.y;',
      '  uv = uv * vec2(1.2, 1.2) - vec2(0.15, 0.22);',
      '',
      '  vec2 fragCoord = gl_FragCoord.xy;',
      '  uv.x -= sin(uv.y * 500.0 + u_time) * INTERLACING_SEVERITY;',
      '',
      '  float scan = mod(fragCoord.y, 3.0);',
      '',
      '  float yOffset = floor(sin(u_time * SHIMMER_SPEED));',
      '  float pix = (fragCoord.y + yOffset) * u_resolution.x + fragCoord.x;',
      '  pix = floor(pix);',
      '',
      '  vec4 colMask = vec4(mod(pix, RGB_MASK_SIZE), mod((pix + 1.0), RGB_MASK_SIZE), mod((pix + 2.0), RGB_MASK_SIZE), 1.0);',
      '  colMask = colMask / (RGB_MASK_SIZE - 1.0) + 0.5;',
      '',
      '  float t = -u_time * TRACKING_SPEED;',
      '  float fractionalTime = (t - floor(t)) * 1.3 - TRACKING_HEIGHT;',
      '  if (fractionalTime + TRACKING_HEIGHT >= uv.y && fractionalTime <= uv.y) {',
      '    uv.x -= fractionalTime * TRACKING_SEVERITY;',
      '  }',
      '',
      '  vec4 src = texture2D(u_texture, uv);',
      '  gl_FragColor = src * colMask * scan;',
      '}'
    ].join('\n');

    function compileShader(src, type) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, src);
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
    var uTexture = gl.getUniformLocation(program, 'u_texture');

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var startTime = performance.now();

    function render() {
      if (isVideo) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      }

      var t = (performance.now() - startTime) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uTexture, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(render);
    }

    render();
  }

    window.addEventListener('resize', function() {
      var rect = heroContainer.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
      gl.viewport(0, 0, canvas.width, canvas.height);
    });
});
