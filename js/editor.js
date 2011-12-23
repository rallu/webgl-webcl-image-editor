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
    canvas      : null,
    gl          : null,
    viewport    : { topx:0, topy:0, width:0, height:0 },
    zoomWindow  : { topx:0, topy:0, width:0, height:0 },
    imageWidth  : 0,
    imageHeight : 0,
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
    console.log("new canvas size:", $(window).width(), $(window).height());
    canvas.width = $(window).width();
    canvas.height = $(window).height();
    API.imageWidth = image.width;
    API.imageHeight = image.height;
    API.setupViewport(canvas);

    glimr.textures.original.texImage2D(gl, gl.RGB, true, image);
    glimr.textures.filtered.texImage2D(gl, gl.RGB, true, image);
    glimr.textures.mask.texImage2D(gl, gl.RGBA, true, image);
    glimr.textures.result.texImage2D(gl, gl.RGBA, true, image);
    console.log("Created a new texture:", glimr.textures.original);
    console.log("Created a new texture:", glimr.textures.filtered);
    console.log("Created a new texture:", glimr.textures.mask);
    console.log("Created a new texture:", glimr.textures.result);
    API.render(glimr.textures.original);
  };

  API.setupViewport = function setupViewport (canvas) {

    var vp = API.viewport;
    var imageWidth = API.imageWidth;
    var imageHeight = API.imageHeight;
    var imageAspectRatio = imageWidth / imageHeight;
    var canvasAspectRatio = canvas.width / canvas.height;

    // Set the zoom window to cover the whole image

    API.zoomWindow.width = API.imageWidth;
    API.zoomWindow.height = API.imageHeight;
    API.zoomWindow.topx = 0;
    API.zoomWindow.topy = 0;

    // Set the width and height of the viewport so as to maximize its
    // area while matching the aspect ratio of the image

    if (imageAspectRatio > canvasAspectRatio) {  

      // The image is "more widescreen" than the canvas, so set the
      // viewport width to max, then rescale height; this leaves an
      // empty border at the top and bottom edges.
      
      vp.width = canvas.width;
      vp.height = Math.round(canvas.width / imageAspectRatio);
      vp.topy = Math.round((canvas.height - vp.height) / 2);
      vp.topx = 0;

    } else { 

      // The image is "less widescreen" than the window, so set the
      // viewport height to max, then rescale width; this leaves an
      // empty border at the left and right edges.
      
      vp.height = canvas.height;
      vp.width = Math.round(canvas.height * imageAspectRatio);
      vp.topx = Math.round((canvas.width - vp.width) / 2);
      vp.topy = 0;
    }

    gl.viewport(vp.topx, vp.topy, vp.width, vp.height);

    console.log("Editor.setupViewport:");
    console.log("  image width/height = ", imageWidth, imageHeight);
    console.log("  canvas width/height = ", canvas.width, canvas.height);
    console.log("  viewport width/height = ", vp.width, vp.height); 
    console.log("  viewport x/y = ", vp.topx, vp.topy);
  };

  /**
   * Zoom towards the center of the image, such that the entire canvas
   * gets filled with pixels. Zooming is achieved by extending the GL
   * viewport beyond the canvas borders; the maximum zoom is dictated
   * by the maximum viewport size allowed by each WebGL implementation.
   *
   * NOTE: Due to a known bug in ANGLE, extending the viewport does not
   * work on Firefox and Chrome on Windows. TODO: find out when the bug
   * is going to get fixed, create a workaround if necessary.
   *
   * @param {Number} zoomFactor zoom area size relative to whole image
   */

  API.zoom = function zoom (canvas, zoomFactor) {

    var imageWidth = API.imageWidth;
    var imageHeight = API.imageHeight;
    var imageAspectRatio = imageWidth / imageHeight;
    var canvasAspectRatio = canvas.width / canvas.height;
    var vp = API.viewport;

    if (canvasAspectRatio > imageAspectRatio) {
      vp.height = Math.min(canvas.height / zoomFactor, glimr.caps.MAX_VIEWPORT_DIMS[1]);
      vp.width = Math.min(vp.height * imageAspectRatio, glimr.caps.MAX_VIEWPORT_DIMS[0]);
      vp.height = vp.width / imageAspectRatio;
    } else {
      vp.width = Math.min(canvas.width / zoomFactor, glimr.caps.MAX_VIEWPORT_DIMS[0]);
      vp.height = Math.min(vp.width / imageAspectRatio, glimr.caps.MAX_VIEWPORT_DIMS[1]);
      vp.width = vp.height * imageAspectRatio;
    }

    vp.topx = (canvas.width - vp.width) / 2;
    vp.topy = (canvas.height - vp.height) / 2;

    gl.viewport(vp.topx, vp.topy, vp.width, vp.height);

    console.log("Editor.zoom (factor =", zoomFactor, "):");
    console.log("  image width/height = ", imageWidth, imageHeight);
    console.log("  viewport width/height = ", vp.width, vp.height); 
  };

  API.render = function render (texture) {
    
    if (!texture) {
      texture = glimr.textures.original;
    }

    var zoomMinU = API.zoomWindow.topx / API.imageWidth;
    var zoomMaxU = 1.0 - zoomMinU;
    var zoomMinV = API.zoomWindow.topy / API.imageHeight;
    var zoomMaxV = 1.0 - zoomMinV;

    var uniforms = {
      //'viewport' : [API.viewport.topx, API.viewport.topy, API.viewport.width, API.viewport.height],
      'zoom' : [zoomMinU, zoomMaxU, zoomMinV, zoomMaxV],
      'src' : texture,
    };
    console.log("render, zoomWindow = ", uniforms.zoom);

    var gl = API.gl;
    gl.clear(GL.COLOR_BUFFER_BIT);
    glimr.render(gl, 'fragmentshader', texture, uniforms);
  };

  return API;

})();
