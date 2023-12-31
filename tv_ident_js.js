var canvas;
var gl;
var points = [];
var colors = [];
var baseColors = [
  vec4(1.0, 0.0, 0.0, 0.0),
  vec4(0.0, 1.0, 0.055, 0.0),
  vec4(1.0, 1.0, 0.0, 0.0),
  vec4(0.0, 0.2, 1.0, 0.0),
];

window.onload = function init() {
  // get the canvas element, setup webgl
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  if (!gl) { alert("WebGL isn't available"); }

  // Configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.157, 0.157, 0.157, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Load shaders and initialize attribute buffers
  const program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // all the controls 
  const controls = {};
  controls.vColor = gl.getAttribLocation(program, "vColor");
  controls.vPosition = gl.getAttribLocation(program, "vPosition");
  controls.thetaLoc = gl.getUniformLocation(program, "theta");
  controls.scaleLoc = gl.getUniformLocation(program, "scale");
  controls.transLoc = gl.getUniformLocation(program, "trans");

  // the basic properties of 3D Gasket TV-Ident
  const gasket = {
    vertices: [
      vec3(0.0, 0.0, -0.25),
      vec3(0.0, 0.2357, 0.0833),
      vec3(-0.2041, -0.1179, 0.0833),
      vec3(0.2041, -0.1179, 0.0833),
    ],

    division: 3, // num of sub-division
    speed: 200, // anim_rotation speed and moving speed
    theta: [0, 0, 0], // angle of 3 axis
    degree: 180, 
    rotateXYZ: [false, false, true], // check is anim_rotation of certain axis allowed
    scale: 1, // scale of the gasket
    scaleFac: 3, // basic scale factor
    trans: [0.0, 0.0],
    transMode: 0,
    pause: true,
  };

  // animation list for 3D gasket
  const animsRegistry = obj => [
    
    // rotation animation on z-axis
    anim_rotation.bind(null, obj, -obj.degree, 2),
    anim_rotation.bind(null, obj, obj.degree, 2),
    anim_rotation.bind(null, obj, 0, 2),

    // rotation animation on x-axis, if allowed
    anim_rotation.bind(null, obj, -obj.degree, 0),
    anim_rotation.bind(null, obj, obj.degree, 0),
    anim_rotation.bind(null, obj, 0, 0),

    // rotation animation on y-axis, if allowed
    anim_rotation.bind(null, obj, -obj.degree, 1),
    anim_rotation.bind(null, obj, obj.degree, 1),
    anim_rotation.bind(null, obj, 0, 1),

    // scaling animation for enlarge and shrink
    anim_scaling.bind(null, obj, obj.scaleFac),
    anim_scaling.bind(null, obj, obj.scale),

    // animation moving and bouncing
    setDelta.bind(null, obj),
    translation.bind(null, obj),
  ];

// input settings for 3D gasket
// straight away set from input form from html
const settings = Array.from(document.querySelectorAll(".settings"));
settings.forEach(setting => {
  setting.addEventListener("change", () => {
    gasket[setting.name] = Number(setting.value);
    let textbox = document.querySelector(
      `[class="textbox"][name="${setting.name}"]`
    );

    if (textbox !== null) {
      textbox.value = setting.value;
    }

    // render animation of the gasket
    renderObject(controls, gasket);

    // update animation list of gasket
    gasket.anims = animsRegistry(gasket);
    gasket.currentAnim = gasket.anims.shift();
  });
});


// RotationBox slider that display value
const RotationBoxallRanges = document.querySelectorAll("#rotationbox");
RotationBoxallRanges.forEach(wrap => {
  const slider = wrap.querySelector(".rotation_slider");
  const bubble = wrap.querySelector("#rotation_output");

  slider.addEventListener("input", () => {
    setBubbleRotation(slider, bubble);
  });
  setBubbleRotation(slider, bubble);
});

// function that set RotationBox slider to bubble
function setBubbleRotation(slider, bubble) {
  const val = slider.value;
  bubble.innerHTML = val;
}

// SpeedBox slider that display value
const SpeedBoxallRanges = document.querySelectorAll("#speedbox");
SpeedBoxallRanges.forEach(wrap => {
  const slider = wrap.querySelector(".speed_slider");
  const bubble = wrap.querySelector("#speed_output");

  slider.addEventListener("input", () => {
    setBubbleSpeed(slider, bubble);
  });
  setBubbleSpeed(slider, bubble);
});

// function that set SpeedBox slider to bubble
function setBubbleSpeed(slider, bubble) {
  const val = slider.value;
  bubble.innerHTML = val;
}

  const tb_division = document.getElementById("subdiv_textbox");
  const tb_scale = document.getElementById("scale_textbox");
  const tb_scaleF = document.getElementById("scaleF_textbox");

  const add_subdivision = document.getElementById("subdiv_add");
  add_subdivision.addEventListener("click", () => {
    if (gasket.division < 5) {
      ++gasket.division;
    }
    tb_division.value = gasket.division;
    // render animation of the gasket
    renderObject(controls, gasket);

    // update animation list of gasket
    gasket.anims = animsRegistry(gasket);
    gasket.currentAnim = gasket.anims.shift();
  });

  const sub_subdivision = document.getElementById("subdiv_sub");
  sub_subdivision.addEventListener("click", () => {
    if (gasket.division > 0) {
      --gasket.division;
    }
    tb_division.value = gasket.division;
    // render animation of the gasket
    renderObject(controls, gasket);

    // update animation list of gasket
    gasket.anims = animsRegistry(gasket);
    gasket.currentAnim = gasket.anims.shift();
  });

  const add_scale = document.getElementById("scale_add");
  add_scale.addEventListener("click", () => {
    if (gasket.scale < 3) {
      ++gasket.scale;
    }
    tb_scale.value = gasket.scale;
    // render animation of the gasket
    renderObject(controls, gasket);

    // update animation list of gasket
    gasket.anims = animsRegistry(gasket);
    gasket.currentAnim = gasket.anims.shift();
  });

  const sub_scale = document.getElementById("scale_sub");
  sub_scale.addEventListener("click", () => {
    if (gasket.scale > 1) {
      --gasket.scale;
    }
    tb_scale.value = gasket.scale;
    // render animation of the gasket
    renderObject(controls, gasket);

    // update animation list of gasket
    gasket.anims = animsRegistry(gasket);
    gasket.currentAnim = gasket.anims.shift();
  });

  const add_scaleFactor = document.getElementById("scaleF_add");
  add_scaleFactor.addEventListener("click", () => {
    if (gasket.scaleFac < 3) {
      ++gasket.scaleFac;
    }
    tb_scaleF.value = gasket.scaleFac;
    
    // render animation of the gasket using the scaling function
    renderObject(controls, gasket);

    // update animation list of gasket
    gasket.anims = animsRegistry(gasket);
    gasket.currentAnim = gasket.anims.shift();
  });

  const sub_scaleFactor = document.getElementById("scaleF_sub");
  sub_scaleFactor.addEventListener("click", () => {
    if (gasket.scaleFac > 0) {
      --gasket.scaleFac;
    }
    tb_scaleF.value = gasket.scaleFac;

    // render animation of the gasket using the scaling function
    renderObject(controls, gasket);

    // update animation list of gasket
    gasket.anims = animsRegistry(gasket);
    gasket.currentAnim = gasket.anims.shift();
  });

  const colorPickers = Array.from(document.querySelectorAll(".colorpicker"));
  colorPickers.forEach((cP, i) => {
    cP.addEventListener("change", () => {
      baseColors[i] = hex2rgb(cP.value);
      renderObject(controls, gasket);
    });
  });

  const checkboxes = Array.from(
    document.querySelectorAll('input[type="checkbox"]')
  );
  checkboxes.forEach((checkbox, i) => {
    checkbox.checked = false;
    checkbox.addEventListener("change", e => {
      gasket.rotateXYZ[i] = e.target.checked;
    });
  });

   // concatenate all input
   const inputs = settings.concat(checkboxes);

  // set the visibility and text of Start button
  // + add function to play/stop the animation
  const btn_start = document.getElementById("play-button");
  btn_start.addEventListener("click", () => {
    if (!gasket.pause) {
      gasket.pause = true;
      btn_start.value = "Play";
      btn_start.style.background = "#04AA6D";
    } else {
      gasket.pause = false;
      animate(gasket, controls);
      inputs.forEach(i => {
        i.disabled = true;
      });


      btn_start.value = "Stop";
      btn_start.style.background = "#B03A2E";
    }
  });

  // set the visibility and text of Restart button
  // + add function to reset the animation
  btn_restart = document.getElementById("restart-button"); // global var
  btn_restart.disabled = true;
  btn_restart.addEventListener("click", () => {
    gasket.pause = true;
    gasket.theta = [0, 0, 0];
    gasket.trans = [0.0, 0.0];
    renderObject(controls, gasket);
    gasket.anims = animsRegistry(gasket);
    gasket.currentAnim = gasket.anims.shift();
    inputs.forEach(i => {
      i.disabled = false;
    });
    btn_restart.disabled = true;
    btn_start.value = "Play";
    btn_start.style.background = "#04AA6D";
  });

  // render the gasket initial state
  renderObject(controls, gasket);

  // get the animation list and update
  gasket.anims = animsRegistry(gasket);
  gasket.currentAnim = gasket.anims.shift();
};


// main function to animate gasket
function animate(obj, controls) {
  if (obj.pause === true) {
    return;
  }
  // enable restart button if it is the last animation (translation)
  if (obj.anims.length === 1) {
    btn_restart.disabled = false;
  }

  // current animation completes, switch animation
  if (obj.currentAnim()) {
    obj.currentAnim = obj.anims.shift(); // get first animation from list
  } else {
    // handle all rotation, scaling and move animations
    // current animation has not completed, proceeds with same animation
    gl.uniform3fv(controls.thetaLoc, flatten(obj.theta));
    gl.uniform1f(controls.scaleLoc, obj.scale);
    gl.uniform2fv(controls.transLoc, obj.trans);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
  }
  requestAnimationFrame(() => animate(obj, controls));
}

// function to rotate gasket
function anim_rotation(obj, degree, axis) {
  // checked if rotaion of certain axis is allowed
  if (obj.rotateXYZ[axis] === true) {
    
    //check whether the gasket rotated 180 or not
    let difference = degree - obj.theta[axis];
    if (Math.abs(difference) > obj.speed * 0.01) {
      // constantly update the theta(angle) of the gasket
      //    return false means havent finish current rotation
      obj.theta[axis] += Math.sign(difference) * obj.speed * 0.01;
      return false;
    } else {
      // return true means that finished current animation
      obj.theta[axis] = degree;
      return true;
    }
  } else {
    return true;
  }
}

// function to scale gasket
function anim_scaling(obj, scaleFac) {

  let difference = scaleFac - obj.scale;

  // check whether gasket is scaled to required scaleFac
  if (Math.abs(difference) > obj.speed * 0.0005) {
    // constantly update the scale(size) of the gasket
      //    return false means havent finish current scaling animation
    obj.scale += Math.sign(difference) * obj.speed * 0.0005;
    return false;
  } else {
    // return true means that finished current animation
    obj.scale = scaleFac;
    return true;
  }
}

function translation(obj) {
  // rotate about z axis
  if (obj.transMode === 1) {
    obj.theta[2] -= obj.speed * 0.01;
  } // rotate about y axis
  else if (obj.transMode === 2) {
    obj.theta[1] += obj.speed * 0.01;
  } // rotate about x axis
  else if (obj.transMode === 3) {
    obj.theta[0] += obj.speed * 0.01;
  } // rotate about all axes
  else if (obj.transMode === 4) {
    // shaking, alternate between 2 directions
    if (Math.random() > 0.5) {
      obj.theta[0] += obj.speed * 0.01;
      obj.theta[1] += obj.speed * 0.01;
      obj.theta[2] -= obj.speed * 0.01;
    } else {
      obj.theta[0] -= obj.speed * 0.01;
      obj.theta[1] -= obj.speed * 0.01;
      obj.theta[2] += obj.speed * 0.01;
    }
  }
  // reverse x when any vertex hits left/right
  if (
    obj.vertices.some(
      v => Math.abs(v[0] + obj.trans[0] / obj.scale) > 0.97 / obj.scale
    )
  ) {
    obj.deltaX = -obj.deltaX;
  }
  // reverse y when any vertex hits top/bottom
  if (
    obj.vertices.some(
      v => Math.abs(v[1] + obj.trans[1] / obj.scale) > 0.97 / obj.scale
    )
  ) {
    obj.deltaY = -obj.deltaY;
  }

  // constantly update delta of the gasket
  obj.trans[0] += obj.deltaX;
  obj.trans[1] += obj.deltaY;
  return false;
}

// convert colour picker hex code to vec4
function hex2rgb(hex) {
  let bigint = parseInt(hex.substring(1), 16);
  let R = ((bigint >> 16) & 255) / 255;
  let G = ((bigint >> 8) & 255) / 255;
  let B = (bigint & 255) / 255;
  return vec4(R, G, B, 1.0);
}

// adjust delta (displacement) based on object's speed
function setDelta(obj) {
  obj.deltaX = obj.speed * Math.cos(Math.PI / 3) * 0.00004;
  obj.deltaY = obj.speed * Math.sin(Math.PI / 3) * 0.00004;
  return true;
}

// render 3d gasket object on canvas
function renderObject(controls, obj) {
  points = [];
  colors = [];
  divideTetra(
    obj.vertices[0],
    obj.vertices[1],
    obj.vertices[2],
    obj.vertices[3],
    obj.division
  );

  // Sending colour from application
  let cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
  gl.vertexAttribPointer(controls.vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(controls.vColor);

  let vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
  gl.vertexAttribPointer(controls.vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(controls.vPosition);

  gl.uniform3fv(controls.thetaLoc, flatten(obj.theta));
  gl.uniform1f(controls.scaleLoc, obj.scale);
  gl.uniform2fv(controls.transLoc, obj.trans);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

function triangle(a, b, c, color) {
  colors.push(baseColors[color]);
  points.push(a);
  colors.push(baseColors[color]);
  points.push(b);
  colors.push(baseColors[color]);
  points.push(c);
}

function tetra(a, b, c, d) {
  triangle(a, c, b, 0);
  triangle(a, c, d, 1);
  triangle(a, b, d, 2);
  triangle(b, c, d, 3);
}

function divideTetra(a, b, c, d, count) {
  if (count === 0) {
    tetra(a, b, c, d);
  } else {
    let ab = mix(a, b, 0.5);
    let ac = mix(a, c, 0.5);
    let ad = mix(a, d, 0.5);
    let bc = mix(b, c, 0.5);
    let bd = mix(b, d, 0.5);
    let cd = mix(c, d, 0.5);

    --count;
    divideTetra(a, ab, ac, ad, count);
    divideTetra(ab, b, bc, bd, count);
    divideTetra(ac, bc, c, cd, count);
    divideTetra(ad, bd, cd, d, count);
  }
}


