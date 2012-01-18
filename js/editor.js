(function() {
  if (window.Editor !== undefined) return;
  (function(srcUrl) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.onload = function() { 
      console.log(srcUrl, "loaded and initialized");
      Editor.setup($('#canvas')[0]);
    }
    script.src = srcUrl;
    head.appendChild(script);
  })("./js/glimr.js");
})();

Editor = (function() {

  var GL = WebGLRenderingContext;

  var locals = {
    canvas         : null,
    gl             : null,
    viewport       : { topx:0, topy:0, width:0, height:0 },
    magnification  : 1.0,
    baseOffsetX    : 0.0,
    baseOffsetY    : 0.0,
    offsetX        : 0.0,
    offsetY        : 0.0,
    imageWidth     : 0,
    imageHeight    : 0,
  };

  var API = {};

  API.setup = function setup (canvas) {
    locals.canvas = canvas;
    locals.gl = gl = glimr.getContext(canvas);
    glimr.textures.original = new Texture(gl);
    glimr.textures.filtered = new Texture(gl);
    glimr.textures.mask = new Texture(gl);
    glimr.textures.result = new Texture(gl);
  };

  API.setupImage = function setupImage (image) {
    var gl = locals.gl;
    var canvas = locals.canvas;
    LOG("previous canvas size:", canvas.width, canvas.height);
    canvas.width = $(window).width();
    canvas.height = $(window).height();
    LOG("new canvas size:", canvas.width, canvas.height);
    locals.imageWidth = image.width;
    locals.imageHeight = image.height;
    API.setViewport(canvas.width, canvas.height);
    API.setZoom(1.0);
    API.setOffset(0.0, 0.0);

    glimr.textures.original.texImage2D(gl, gl.RGB, true, image);
    glimr.textures.filtered.texImage2D(gl, gl.RGB, true, image);
    glimr.textures.mask.texImage2D(gl, gl.RGBA, true, image);
    glimr.textures.result.texImage2D(gl, gl.RGBA, true, image);
    LOG("Created a new texture:", glimr.textures.original);
    LOG("Created a new texture:", glimr.textures.filtered);
    LOG("Created a new texture:", glimr.textures.mask);
    LOG("Created a new texture:", glimr.textures.result);
  };

  /**
   * Sets the viewport to the given width and height.
   */
  API.setViewport = function setupViewport (vpWidth, vpHeight, vpTopX, vpTopY) {

    var vp = locals.viewport;
    vp.width = vpWidth;
    vp.height = vpHeight;
    vp.topx = vpTopX || 0;
    vp.topy = vpTopY || 0;
    gl.viewport(vp.topx, vp.topy, vp.width, vp.height);

    LOG("Editor.setViewport:");
    LOG("  image width/height = ", locals.imageWidth, locals.imageHeight);
    LOG("  canvas width/height = ", locals.canvas.width, locals.canvas.height);
    LOG("  viewport width/height = ", vp.width, vp.height); 
  };

  API.setZoom = function setZoom (zoomFactor) {
    locals.magnification = zoomFactor;
  };

  API.setOffset = function setOffset (offsetX, offsetY) {
    locals.baseOffsetX = offsetX;
    locals.baseOffsetY = offsetY;
    locals.offsetX = locals.baseOffsetX;
    locals.offsetY = locals.baseOffsetY;
  };

  API.addOffset = function addOffset (offsetX, offsetY) {
    locals.offsetX = locals.baseOffsetX + offsetX;
    locals.offsetY = locals.baseOffsetY + offsetY;
  };

  API.setBaseOffset = function setBaseOffset () {
    locals.baseOffsetX = locals.offsetX;
    locals.baseOffsetY = locals.offsetY;
  };

  API.render = function render (texture) {
    
    if (!texture) {
      texture = glimr.textures.original;
    }

    var uniforms = {
      'viewportSize' : [locals.viewport.width, locals.viewport.height],
      'imageSize' : [locals.imageWidth, locals.imageHeight],
      'zoom' : locals.magnification,
      'offset' : [2*locals.offsetX, -2*locals.offsetY],
      'src' : texture,
    };
    LOG("render, uniforms = ", uniforms);

    var gl = locals.gl;
    gl.clear(GL.COLOR_BUFFER_BIT);
    glimr.render(gl, 'fragmentshader', texture, uniforms);
  };

  API.setDebug = function setDebug (enableDebug) {
    locals.debugEnabled = enableDebug;
  };

  function LOG () {
    if (locals.debugEnabled !== false) {
      var args = Array.prototype.slice.call(arguments, 0);
      switch (args.length) {
      case 1:
        console.log(args[0]);
        break;
      case 2:
        console.log(args[0], args[1]);
        break;
      case 3:
        console.log(args[0], args[1], args[2]);
        break;
      case 4:
        console.log(args[0], args[1], args[2], args[3]);
        break;
      case 5:
        console.log(args[0], args[1], args[2], args[3], args[4]);
        break;
      default:
        console.log(args);
        break;
      }
    }
  };

  return API;

})();
