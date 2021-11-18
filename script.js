
// Creating webgl canvas
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error('WebGL not supported');
}

// Initialize a texture and load an image.
// When the image finishes loading, copy it into the texture.
function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);
  
      // WebGL1 has different requirements for power of 2 images
      // vs non power of 2 images so check if the image is a
      // power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
         // Yes, it's a power of 2. Generate mips.
         gl.generateMipmap(gl.TEXTURE_2D);
      } else {
         // No, it's not a power of 2. Turn off mips and set
         // wrapping to clamp to edge
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      
      // Only load the triangles after the image and the mipmap were loaded.
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      console.log(5+6);
    };

    image.src = url;
    return texture;
  }
  
  function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
  }
  

// Defining vertices and geometry
const vertices = [
    -0.5, 0,  0,  // left
    0,    1,  0,  // top
    0.5,  0,  0,  // right
    0.5,  0,  0,  // right
    0,    -1, 0,  // bottom
    -0.5, 0,  0,  // left
];

// Load texture and define coordinates
const texture = loadTexture(gl, 'wood.png');
const textureCoordinates = [
    0,  0,  // left
    0,  1,  // top
    1,  1,  // right
    1,  1,  // right
    1,  0,  // bottom
    0,  0,  // left
];

// Create, bind, and pass vertex buffer
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// Create, bind, and pass texture buffer
const textureCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

// Tell WebGL we want to affect texture unit 0
gl.activeTexture(gl.TEXTURE0);

// Bind the texture to texture unit 0
gl.bindTexture(gl.TEXTURE_2D, texture);

// Create and compile vertex shader
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
precision mediump float;

attribute vec3 position;
attribute vec2 textureCoord;

varying vec2 vTextureCoord;

void main() {
    vTextureCoord = textureCoord;
    gl_Position = vec4(position, 1);
}
`);
gl.compileShader(vertexShader);

// Create and compile fragment shader
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
`);
gl.compileShader(fragmentShader);
console.log(gl.getShaderInfoLog(fragmentShader));

// Create and link shader program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

// Create and enable positionLocation
const positionLocation = gl.getAttribLocation(program, `position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

// Create and enable textureLocation
const textureLocation = gl.getAttribLocation(program, `textureCoord`);
gl.enableVertexAttribArray(textureLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
gl.vertexAttribPointer(textureLocation, 2, gl.FLOAT, false, 0, 0);

// Run and draw program
gl.useProgram(program);

// Create and tell the shader we bound the texture to texture unit 0
uniformLocations = {
  uSampler: gl.getUniformLocation(program, 'uSampler'),
};

gl.uniform1i(uniformLocations.uSampler, 0);

// Drawing occurs in the image onload as the image takes more to load than for the script to execute.