/*
  desc: Compile a fragment or vertex shader
  in: gl: WebGLContext, type: (gl.VERTEX_SHADER | gl.FRAGMENT_SHADER), source: String (vertex or fragment source)
  out: Shader
*/
const compileShader = (gl, type, source) => {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;
    console.log(source);
    throw new Error(gl.getShaderInfoLog(shader));
};

/*
  desc: Compile a WebGL program
  in: gl: WebGLContext, vert: Compiled vertex shader, frag: Compiled fragment shader
  out: WebGLProgram
*/
const compileProgram = (gl, vert, frag) => {
    var program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) return program;
    throw new Error(gl.getProgramInfoLog(program));
};

/*
  desc: ShaderClass for managing shaders
  in: gl: WebGLContext, vertSource: String (vertex source), fragSource: String (fragment source)
  out: Shader class
*/
export function Shader(gl, vertSource, fragSource) {
    let vert = compileShader(gl, gl.VERTEX_SHADER, vertSource);
    let frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
    let program = compileProgram(gl, vert, frag);
    gl.useProgram(program);

    this.attributes = {};
    this.uniforms = {};
    
    //retrive all uniforms for the shader, and store them with their associated type
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; ++i) {
        const info = gl.getActiveUniform(program, i);
        console.log("uniform name:", info.name, "type:", info.type, "size:", info.size);
        this.uniforms[info.name] = [gl.getUniformLocation(program, info.name), info.type];
    }

    //retrive all attributes for the shader, and store them
    const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttributes; i++) {
        const info = gl.getActiveAttrib(program, i);
        console.log("attribute name:", info.name, "type:", info.type, "size:", info.size);
        this.attributes[info.name] = gl.getAttribLocation(program, info.name);
    }
    
    //return the underlying program for the shader
    this.getProgram = function () {
        return program;
    };

    //enable shader, and all of its attributes
    this.use = function () {
        gl.useProgram(program);

        for (const attr in this.attributes) {
            //console.log("Enabling attrib: ", attr, this.attributes[attr]);
            gl.enableVertexAttribArray(this.attributes[attr]);
        }
        return this;
    };

    //bind the currently bound buffer to an attribute
    this.bindAttribute = function (name, size, type, normalized, stride, offset) {
        if (!this.attributes.hasOwnProperty(name)) throw new Error(`doesnt have attribute ${name}`);
        let attrib = this.attributes[name];
        gl.vertexAttribPointer(attrib, size, type, normalized, stride, offset);
        return this;
    };

    //set the data of a uniform for the shader
    this.setUniform = function (name, value) {
        let info = this.uniforms[name];
        if (!info) throw new Error(`Unknwon uniform ${name}`);
        switch (info[1]) {
            case gl.FLOAT_VEC2:
                gl.uniform2fv(info[0], value);
                break;
            case gl.FLOAT_MAT3:
                gl.uniformMatrix3fv(info[0], false, value);
                break;
            case gl.FLOAT:
                if (Array.isArray(value)) {
                    gl.uniform1fv(info[0], value);
                } else {
                    gl.uniform1f(info[0], value);
                }
                break;
            default:
                throw new Error(`Unknown un data-type ${info[1]} ${gl.FLOAT}`);
                break;
        }
    };
}
