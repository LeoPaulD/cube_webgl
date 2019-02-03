function loadText(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.overrideMimeType("text/plain");
    xhr.send(null);
    if(xhr.status === 200)
        return xhr.responseText;
    else {
        return null;
    }
}

// variables globales du programme;
var canvas;
var gl; //contexte
var program; //shader program
var buffers = [];

var attribPos; //attribute position
var attribColor; //attribute color
var uniformTransformMat;
var uniformPerspectiveMat;
var uniformModelViewMat;

var mousePositions = [];
var vertexColors = [];

var translationValues = {x: 0, y: 0, z: -6.0};
var rotationValues = {x: 0, y: 0, z: 0};
var scaleFactor = 1.0;
var rotationAngle = {x: 0, y: 0, z: 0};

var selectedPrimitive;
var time = 0; // time for autoDraw & crazyAutoDraw
var direction = "right"; // direction for autoDraw
var yFov = 45 * Math.PI / 180;

function initContext() {
    canvas = document.getElementById('dawin-webgl');
    gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('ERREUR : echec chargement du contexte');
        return;
    }
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
}

//Initialisation des shaders et du program
function initShaders() {
    var vertexShaderSource = loadText("vertex.glsl");
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
    }

    var fragmentShaderSource = loadText("fragment.glsl");
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(fragmentShader));
    }

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(program));
    }

    gl.useProgram(program)
}



//Evenements
function initEvents() {
    xTranslationInput = document.getElementById('xTranslationInput');
    xTranslationInput.addEventListener('input', function () {
        translationValues.x = this.value;
    });
    yTranslationInput = document.getElementById('yTranslationInput');
    yTranslationInput.addEventListener('input', function () {
        translationValues.y = this.value;
    });
    zTranslationInput = document.getElementById('zTranslationInput');
    zTranslationInput.addEventListener('input', function () {
        translationValues.z = this.value;
    });
    xRotationInput = document.getElementById('xRotationInput');
    xRotationInput.addEventListener('input', function () {
        rotationAngle.x = this.value;
    });
    yRotationInput = document.getElementById('yRotationInput');
    yRotationInput.addEventListener('input', function () {
        rotationAngle.y = this.value;
    });
    zRotationInput = document.getElementById('zRotationInput');
    zRotationInput.addEventListener('input', function () {
        rotationAngle.z = this.value;
    });
    scaleFactorInput = document.getElementById('zoom');
    scaleFactorInput.addEventListener('input', function () {
        scaleFactor = this.value;
    });

    yFov = document.getElementById('fov');
    yFov.addEventListener('input', function () {
        yFov = this.value;
        initPerspective();
    });
}

//TODO
//Fonction initialisant les attributs pour l'affichage (position et taille)
function initAttributes() {
    attribPos = gl.getAttribLocation(program, "position");
    attribColor = gl.getAttribLocation(program, "aVertexColor");
    uniformTransformMat = gl.getUniformLocation(program, "transformation");
    uniformPerspectiveMat = gl.getUniformLocation(program, "perspective");
}


//TODO
//Initialisation des buffers
function initBuffers() {
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 12, gl.STREAM_DRAW);
    gl.vertexAttribPointer(attribColor, 4, gl.FLOAT, true, 0, 0);
    gl.enableVertexAttribArray(attribColor);
    buffers["color"] = colorBuffer;

    var posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 9, gl.STREAM_DRAW);
    gl.vertexAttribPointer(attribPos, 3, gl.FLOAT, true, 0, 0);
    gl.enableVertexAttribArray(attribPos);
    buffers["pos"] = posBuffer;
}

function initPerspective() {
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = canvas.width / canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;

    var perspectiveMat = mat4.create();
    // mat4.perspective(perspectiveMat, 90, canvas.width/canvas.height, 1, 1000);
    mat4.perspective(perspectiveMat, yFov, aspect, zNear, zFar);
    console.table(perspectiveMat);

    gl.uniformMatrix4fv(uniformPerspectiveMat, false, perspectiveMat);
}


//TODO
//Mise a jour des buffers : necessaire car les coordonnees des points sont ajoutees a chaque clic
function refreshBuffers() {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers["color"]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers["pos"]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mousePositions), gl.STATIC_DRAW);
}

var test = false;

//TODO
//Fonction permettant le dessin dans le canvas
function draw() {
    requestAnimationFrame(draw);

    if (selectedPrimitive == undefined) {
        selectedPrimitive = gl.TRIANGLES;
    }

    let transformMat = generateTransformMatrix();
    gl.uniformMatrix4fv(uniformTransformMat, false, transformMat);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.drawArrays(selectedPrimitive, 0, mousePositions.length / 3);
}


function refreshTransformations() {
    var rotationMat = mat4.create();
    mat4.rotateX(rotationMat, rotationMat, -rotationValues.x);
    mat4.rotateY(rotationMat, rotationMat, -rotationValues.y);
    mat4.rotateZ(rotationMat, rotationMat, -rotationValues.z);
    gl.uniformMatrix4fv(uniformRotationMat, false, rotationMat);

    var translationMat = mat4.create();
    var translationVec = vec3.fromValues(translationValues.x, translationValues.y, translationValues.z - 5);
    mat4.fromTranslation(translationMat, translationVec);
    gl.uniformMatrix4fv(uniformTranslationMat, false, translationMat);

    var scaleMat = mat4.create();
    var scaleVec = vec3.fromValues(scaleFactor, scaleFactor, scaleFactor, 1);
    mat4.fromScaling(scaleMat, scaleVec);
    gl.uniformMatrix4fv(uniformScaleMat, false, scaleMat);
}
function generateTransformMatrix() {
    let result = mat4.create();
    let rotationQuat = quat.create();
    quat.rotateX(rotationQuat, rotationQuat, -rotationAngle.x);
    quat.rotateY(rotationQuat, rotationQuat, -rotationAngle.y);
    quat.rotateZ(rotationQuat, rotationQuat, -rotationAngle.z);
    let translationVec = vec3.fromValues(translationValues.x, translationValues.y, translationValues.z);
    let scaleVec = vec3.fromValues(scaleFactor, scaleFactor, scaleFactor);
    mat4.fromRotationTranslationScale(result, rotationQuat, translationVec, scaleVec);
    return result;

}


function setCube() {
    mousePositions.push(...[
        // Front face
        -1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        -1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,


        // Back face
        -1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        -1.0,  1.0, -1.0,

        -1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,


        // Top face
        -1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        -1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,


        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        1.0, -1.0, -1.0,

        -1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,


        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        1.0, -1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,


        // Left face
        -1.0, -1.0, -1.0,
        -1.0,  1.0,  1.0,
        -1.0, -1.0,  1.0,

        -1.0, -1.0, -1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
    ]);

    vertexColors.push(...([
        Array(6).fill([1.0, 0.0, 0.0, 1.0]).flat(),
        Array(6).fill([0.0, 1.0, 0.0, 1.0]).flat(),
        Array(6).fill([0.0, 0.0, 1.0, 1.0]).flat(),
        Array(6).fill([1.0, 1.0, 0.0, 1.0]).flat(),
        Array(6).fill([0.0, 1.0, 1.0, 1.0]).flat(),
        Array(6).fill([1.0, 0.0, 1.0, 1.0]).flat()
    ].flat()));
    console.log(vertexColors);

    refreshBuffers();
}


function main() {
    initContext();
    initShaders();
    initAttributes();
    initPerspective();
    initBuffers();
    initEvents();
    setCube();
    draw();
    
}


