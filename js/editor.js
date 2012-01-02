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

  API = {
    canvas         : null,
    gl             : null,
    viewport       : { topx:0, topy:0, width:0, height:0 },
    magnification  : 1.0,
    imageWidth     : 0,
    imageHeight    : 0,
  };

  API.setup = function setup (canvas) {
    API.canvas = canvas;
    API.gl = gl = glimr.getContext(canvas);
    glimr.textures.original = new Texture(gl);
    glimr.textures.filtered = new Texture(gl);
    glimr.textures.mask = new Texture(gl);
    glimr.textures.result = new Texture(gl);
  };

  API.setupImage = function setupImage (image) {
    var gl = API.gl;
    var canvas = API.canvas;
    console.log("previous canvas size:", canvas.width, canvas.height);
    canvas.width = $(window).width();
    canvas.height = $(window).height();
    console.log("new canvas size:", canvas.width, canvas.height);
    API.imageWidth = image.width;
    API.imageHeight = image.height;
    API.setViewport(canvas.width, canvas.height);
    API.setZoom(1.0);

    glimr.textures.original.texImage2D(gl, gl.RGB, true, image);
    glimr.textures.filtered.texImage2D(gl, gl.RGB, true, image);
    glimr.textures.mask.texImage2D(gl, gl.RGBA, true, image);
    glimr.textures.result.texImage2D(gl, gl.RGBA, true, image);
    console.log("Created a new texture:", glimr.textures.original);
    console.log("Created a new texture:", glimr.textures.filtered);
    console.log("Created a new texture:", glimr.textures.mask);
    console.log("Created a new texture:", glimr.textures.result);
  };

  /**
   * Sets the viewport to the given width and height.
   */
  API.setViewport = function setupViewport (vpWidth, vpHeight) {

    var vp = API.viewport;
    vp.width = vpWidth;
    vp.height = vpHeight;
    vp.topx = 0;
    vp.topy = 0;
    gl.viewport(vp.topx, vp.topy, vp.width, vp.height);

    console.log("Editor.setViewport:");
    console.log("  image width/height = ", API.imageWidth, API.imageHeight);
    console.log("  canvas width/height = ", API.canvas.width, API.canvas.height);
    console.log("  viewport width/height = ", vp.width, vp.height); 
  };

  API.setZoom = function setZoom (zoomFactor) {
    API.magnification = zoomFactor;
  };

  API.render = function render (texture) {
    
    if (!texture) {
      texture = glimr.textures.original;
    }

    var uniforms = {
      'viewportSize' : [API.viewport.width, API.viewport.height],
      'imageSize' : [API.imageWidth, API.imageHeight],
      'zoom' : API.magnification,
      'src' : texture,
    };
    console.log("render, uniforms = ", uniforms);

    var gl = API.gl;
    gl.clear(GL.COLOR_BUFFER_BIT);
    glimr.render(gl, 'fragmentshader', texture, uniforms);
  };

  return API;

})();
