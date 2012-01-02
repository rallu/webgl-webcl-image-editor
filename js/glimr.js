/*
 * This file is part of GLIMR - GL Image Manipulator and Renderer - a
 * JavaScript utility library for efficient 2D image processing on the
 * web browser, based on WebGL.
 *
 * https://projects.forum.nokia.com/glimr
 *
 * Copyright (C) 2011 Tomi Aarnio (tomi.p.aarnio 'at' gmail.com)
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public License
 * version 2.1 as published by the Free Software Foundation.
 */

if (!window.WebGLRenderingContext) {
  alert("This page requires a browser with WebGL support.");
  window.location = "http://get.webgl.org";
}


/**
 * WebGL texture abstraction.
 */

Texture = function (gl) {

  var GL = window.WebGLRenderingContext;

  ///////////////////////////////////////////////////////////////////////////////////////
  //
  // Public interface
  //
  ///////////////////////////////////////////////////////////////////////////////////////

  var API = {
    gltexture : undefined,   // the GL texture object
    width : 0,
    height : 0,
    format : 0,
  };

  API.texImage2D = function texImage2D (gl, format, flipY, image) {
    try {
      API.format = format;
      API.width = image.width;
      API.height = image.height;
      gl.bindTexture(GL.TEXTURE_2D, API.gltexture);
      gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, flipY);
      gl.texImage2D(GL.TEXTURE_2D, 0, format, format, GL.UNSIGNED_BYTE, image);
      gl.bindTexture(GL.TEXTURE_2D, null);
    } catch (e) {
      console.log("Exception in", arguments.callee.name, ":", e);
      console.log("Attempted to create a texture from", image);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////
  //
  // Private implementation
  //
  ///////////////////////////////////////////////////////////////////////////////////////

  return construct(gl);

  function construct(gl) {
    API.gltexture = gl.createTexture();
    gl.bindTexture(GL.TEXTURE_2D, API.gltexture);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    gl.bindTexture(GL.TEXTURE_2D, null);
    return API;
  };

};

/**
 * Creates a new Shader object. A Shader is constructed by loading its
 * source code from the given URI. If the type of shader is not given,
 * it is autodetected from the source code.  The shader can be
 * compiled and linked later when a WebGl context is available.
 */

Shader = function (uri, type) {

  var GL = window.WebGLRenderingContext;

  ///////////////////////////////////////////////////////////////////////////////////////
  //
  // Public interface
  //
  ///////////////////////////////////////////////////////////////////////////////////////

  var API = {
    uri : uri,               // URI to the shader source code
    type : type,             // GL.FRAGMENT_SHADER or GL.VERTEX_SHADER
    source : undefined,      // shader source (loaded at construction)
    shader : undefined,      // the GL shader object (when compiled)
    program : undefined,     // the GL program object (when linked)
    linkedWith : undefined,  // the Shader that is linked with this one
    compiled : false,        // 'true' if compiled successfully
    linked : false,          // 'true' if linked successfully
  };

  /**
   * Compiles this Shader.
   *
   * @param {WebGLRenderingContext} gl the GL context to use
   * @return {Boolean} 'true' if compilation succeeded, 'false' if not
   */

  API.compile = function compile (gl) {
    if (!API.compiled && API.source) {
      API.shader = gl.createShader(API.type);
      gl.shaderSource(API.shader, API.source);
      gl.compileShader(API.shader);
      console.log("Shader compiler info log for " + API.uri + ":", gl.getShaderInfoLog(API.shader));
      var success = gl.getShaderParameter(API.shader, GL.COMPILE_STATUS);
      if (!success) API.shader = undefined;
      API.compiled = success;
    }
    return API.compiled;
  };

  /**
   * Links this Shader with the given vertex or fragment shader. Both
   * shaders must be already compiled.
   *
   * @param {WebGLRenderingContext} gl the GL context to use
   * @param {Shader} shaderToLinkWith the other shader to link
   * @return {Boolean} 'true' if linking succeeded, 'false' if not
   */
  API.link = function link (gl, shaderToLinkWith) {
    if (!API.linked && API.compiled && shaderToLinkWith.compiled) {
      API.program = gl.createProgram();
      gl.attachShader(API.program, API.shader);
      gl.attachShader(API.program, shaderToLinkWith.shader);
      gl.linkProgram(API.program);
      console.log("Shader linker info log:", gl.getProgramInfoLog(API.program));
      var success = gl.getProgramParameter(API.program, GL.LINK_STATUS);
      if (success) {
        API.linked = true;
        API.linkedWith = shaderToLinkWith;
        shaderToLinkWith.linked = true;
        shaderToLinkWith.linkedWith = API;
        shaderToLinkWith.program = API.program;
      } else {
        API.linked = false;
        API.program = undefined;
      }
    }
    return API.linked;
  };

  /**
   * Compiles this shader and the given other shader, and links them
   * together into a complete shader program. This shader must be a
   * vertex shader and the other a fragment shader, or vice versa.
   *
   * @param {WebGLRenderingContext} gl the GL context to use
   * @param {Shader} shaderToLinkWith the other shader to build
   * @return {Boolean} 'true' if build succeeded, 'false' if not
   */
  API.build = function build (gl, shaderToLinkWith) {
    var success = shaderToLinkWith.compile(gl) && API.compile(gl) && API.link(gl, shaderToLinkWith);
    return success;
  };

  ///////////////////////////////////////////////////////////////////////////////////////
  //
  // Private implementation
  //
  ///////////////////////////////////////////////////////////////////////////////////////

  return construct(uri, type);

  /**
   * Constructs a new Shader object from the given URI and type. Does
   * not automatically compile or link the shader, because there is no
   * GL context available at this time. If the type of shader is not
   * given, it is autodetected from source code by scanning for the
   * string "gl_Position".
   * 
   * @param {String} uri a URI to load the shader source code from
   * @param {GLenum} type [optional] GL.VERTEX_SHADER or GL.FRAGMENT_SHADER
   *
   * @return {Shader} a new Shader object
   */
  function construct(uri, type) {
    var source = loadSource(uri);
    var isVS = (!type && source && source.indexOf("gl_Position") !== -1);
    API.type = type || (isVS ? GL.VERTEX_SHADER : GL.FRAGMENT_SHADER);
    API.source = source;
    return API;
  };

  /**
   * Loads a shader from the given URI, either synchronously or
   * asynchronously.
   *
   * @param {String} uri the URI to load the shader source from;
   * for example, "shaders/myShader.gl"
   *
   * @param {function} callback a function to call when the shader
   * source code has been successfully loaded.  The source code is
   * passed as an argument to this function.  If no function is
   * provided, the shader is loaded synchronously.
   *
   * @return {String} the source code of the specified shader,
   * or 'null' if not found
   */
  function loadSource (uri, callback) {
    var source = null;
    console.log("Loading shader source from " + uri + "...");
    if (callback) {
      console.log("  asynchronous XMLHttpRequest, callback to ", callback);
      XMLHttpRequestGetAsync(uri, callback);
    } else {
      source = XMLHttpRequestGet(uri);
    }
    return source;
  };

  /**
   * Loads the given URI synchronously over HTTP.
   *
   * @param uri a String containing the URI to load, e.g. "myShader.gl"
   *
   * @return the HTTP response text, or null in case of error
   */

  //mHttpReq : new XMLHttpRequest(),

  function XMLHttpRequestGet (uri) {
    try {
      var mHttpReq = new XMLHttpRequest();
      mHttpReq.open("GET", uri, false);
      mHttpReq.send(null);
      return mHttpReq.responseText;
    } catch (e) {
      console.log("glimr.XMLHttpRequestGet: ", e);
      return null;
    }
  };

  function XMLHttpRequestGetAsync (uri, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          callback(xhr.responseText);
        }
      }
    };
    xhr.open("GET", uri, true);
    xhr.send(null);
  };

};

var glimr = (function() {

  var GL = window.WebGLRenderingContext;

  ///////////////////////////////////////////////////////////////////////////////////////
  //
  // Public interface
  //
  ///////////////////////////////////////////////////////////////////////////////////////

  var API = {
    'version'  : { 'major' : 0, 'minor' : 1, 'revision' : 2 },
    'shaders'  : {},
    'textures' : {},
    'ready'    : false,
    'caps'     : { 'MAX_VIEWPORT_DIM' : 0 },
  };

  API.shaders['vertexshader'] = new Shader("./shaders/vertexshader.gl");
  API.shaders['fragmentshader'] = new Shader("./shaders/fragmentshader.gl");

  API.setReadyState = function setReadyState (readyState) {
    API.ready = readyState;
  };

  API.getReadyState = function getReadyState () {
    return API.ready;
  };

  /**
   * Retrieves a WebGL context for the given canvas.  If the canvas
   * already has a 2D context, or WebGL is not available for some
   * reason, this function will fail and return 'null'.
   *
   * @param {HTMLCanvasElement} canvas the canvas to get a WebGL
   * context from; must not have a 2d context associated with it
   *
   * @return {WebGLRenderingContext} the WebGL context, or 'null' in
   * case of failure
   */
  API.getContext = function getContext (canvas) {
    var gl = null;
    var preferredAttribs = { alpha:true, 
                             depth:false,
                             stencil:false, 
                             antialias:false, 
                             premultipliedAlpha:true };

    try { 
      gl = canvas.getContext("experimental-webgl", preferredAttribs); 
    } catch (e) {}

    API.getCaps(gl);
    return gl;
  };

  API.getCaps = function getCaps (gl) {
    var vpMaxDims = gl.getParameter(GL.MAX_VIEWPORT_DIMS);
    var vpMinMaxDim = Math.min(vpMaxDims[0], vpMaxDims[1]);
    API.caps['MAX_VIEWPORT_DIM'] = vpMinMaxDim;
  };

  API.createRenderTarget = function createRenderTarget (gl, texture) {
    return;
  };

  API.setRenderTarget = function setRenderTarget (gl, renderTarget) {
    // target can be an FBO or the default framebuffer
    return;
  };

  API.render = function render (gl, fsname, texture, uniforms) {
    var program = API.shaders[fsname].program;
    var gltexture = texture.gltexture;
    if (!program || !gltexture) return;

    gl.useProgram(program);
    for (var uname in uniforms) {
      var uniform = uniforms[uname];
      if (uniform.gltexture instanceof WebGLTexture) {
        setUniformi(gl, program, uname, 0); 
      } else {
        setUniformf(gl, program, uname, uniform);
      }
    }
    bindTextures(gl, gltexture);
    bindDefaultGeometry(gl);
    drawRect(gl);
    return;
  };

  return API;

  ///////////////////////////////////////////////////////////////////////////////////////
  //
  // Private implementation
  //
  ///////////////////////////////////////////////////////////////////////////////////////

  function bindDefaultGeometry(gl) {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Int8Array([-1, -1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.BYTE, false, 0, 0);
    gl.enableVertexAttribArray(0);
  };

  function bindTextures(gl, textures) {
    var textureArray;
    if (textures.length) {
      textureArray = textures;
    } else {
      textureArray = Array.prototype.slice.call(arguments, 1);
    }
  
    for (var i=0, names = ""; i < textureArray.length; i++) {
      //names += ", '" + textureArray[i].name + "'";
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, textureArray[i]);
    }
    //console.log("  bindTextures(gl" + names + ")");    return;
  };

  /**
   * Sets the value of the given floating-point uniform. The type of
   * the uniform must be float, vec2, vec3 or vec4.
   * 
   * @param {WebGLRenderingContext} gl the WebGL context to use
   *
   * @param {WebGLProgram} program the WebGL program to set the
   * uniforms for
   *
   * @param {String} name the name of the uniform to set
   *
   * @param value an array or a variable number of arguments, for
   * a total of 1, 2, 3 or 4 numeric values
   *
   * @example
   * setUniformf(gl, program, name, [0.3, 0.7, 100]);
   * setUniformf(gl, program, name, 0.3, 0.7, 100);
   */
  function setUniformf(gl, program, name, value) {
    
    var values;
    if (value.length) {
      values = value;
    } else {
      values = Array.prototype.slice.call(arguments, 3);
    }

    //console.log("  setUniformf(gl, program, " + name + ", " + values.join(", ") + ")");

    try {
      var location = gl.getUniformLocation(program, name);
      if (location == -1 || location == null) {
        throw new Error("Not active in the current shader program.");
      }
    
      switch (values.length) {
      case 1: gl.uniform1f(location, values[0]);  break;
      case 2: gl.uniform2f(location, values[0], values[1]); break;
      case 3: gl.uniform3f(location, values[0], values[1], values[2]); break;
      case 4: gl.uniform4f(location, values[0], values[1], values[2], values[3]); break;
      default: gl.uniform1fv(location, values); break;
      }
    } catch (e) {
      console.log("  Warning: setUniformf failed to set uniform '" + name + "': " + e);
    }
  };

  /**
   * Sets the value of the given integer uniform. The type of the
   * uniform must be int, ivec2, ivec3, ivec4, or sampler.
   *
   * @param {WebGLRenderingContext} gl the WebGL context to use
   *
   * @param {WebGLProgram} program the WebGL program to set the
   * uniforms for
   *
   * @param {String} name the name of the uniform to set
   *
   * @param value an array or a variable number of arguments, for
   * a total of 1, 2, 3 or 4 numeric values
   */
  function setUniformi(gl, program, name, value) {

    var values;
    if (value.length) {
      values = value;
    } else {
      values = Array.prototype.slice.call(arguments, 3);
    }

    //console.log("  setUniformi(gl, program, " + name + ", " + values.join(", ") + ")");

    try {
      var location = gl.getUniformLocation(program, name);
      if (location == -1 || location == null) {
        throw new Error("Not active in the current shader program.");
      }

      switch (values.length) {
      case 1: gl.uniform1i(location, values[0]);  break;
      case 2: gl.uniform2i(location, values[0], values[1]); break;
      case 3: gl.uniform3i(location, values[0], values[1], values[2]); break;
      case 4: gl.uniform4i(location, values[0], values[1], values[2], values[3]);   break;
      default: throw new Error("Invalid number of parameters.");
      }
    } catch (e) {
      console.log("  Warning: setUniformi failed to set uniform '" + name + "': " + e);
    }
  };

  /**
   * Draws a screen-aligned quad consisting of two triangles.  Assumes
   * that the vertex attributes, shaders and all other GL state have
   * been set up correctly.
   *
   * This function serves as an abstraction layer for GL draw calls,
   * making it easier to switch between <tt>drawArrays</tt> and
   * <tt>drawElements</tt>, or <tt>TRIANGLE_STRIP</tt> and
   * <tt>TRIANGLES</tt>.  This is often necessary to circumvent bugs
   * in different WebGL implementations.
   *
   * @param {WebGLRenderingContext} gl the WebGL context to use
   */
  function drawRect(gl) {
    //gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    //gl.flush();
  };

})();

//////////////////////////////////////////////////////
//
// GLIMR Automatic Startup Suite
//
//////////////////////////////////////////////////////

(function() {
  var version = glimr.version;
  console.log("GLIMR version: " + version.major + "." + version.minor);
  console.log("glimr: ", glimr);

  var canvas = document.querySelector("#canvas");
  var gl = glimr.getContext(canvas);
  console.log("GL context for", canvas, ":", gl);

  console.log("GL capabilities: ", glimr.caps);

  var success = glimr.shaders.fragmentshader.build(gl, glimr.shaders.vertexshader);
  if (!success) 
    console.log("Failed to compile and link", glimr.shaders.fragmentshader);
  
  glimr.setReadyState(true);

})();
