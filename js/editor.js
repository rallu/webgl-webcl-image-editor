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
   * is filled with pixels. Discard pixel rows or columns depending on
   * the aspect ratio.
   */
  API.zoom = function zoom (canvas) {

    var imageWidth = API.imageWidth;
    var imageHeight = API.imageHeight;
    var imageAspectRatio = imageWidth / imageHeight;
    var canvasAspectRatio = canvas.width / canvas.height;
    var zoom = API.zoomWindow;

    // Make the viewport fill the entire canvas

    var vp = API.viewport;
    vp.topx = 0;
    vp.topy = 0;
    vp.width = canvas.width;
    vp.height = canvas.height;
    gl.viewport(vp.topx, vp.topy, vp.width, vp.height);

    if (imageAspectRatio > canvasAspectRatio) {  

      // The image is "more widescreen" than the canvas, so we show
      // the full image in the Y direction and clip from the left and
      // right.
      
      zoom.topy = 0;
      zoom.height = imageHeight;
      zoom.width = Math.round(imageHeight * canvasAspectRatio);
      zoom.topx = Math.round((imageWidth - zoom.width) / 2);

    } else {

      // The image is "less widescreen" than the canvas, so we show
      // the full image in the X direction and clip from the top and
      // bottom.

      zoom.topx = 0;
      zoom.width = imageWidth;
      zoom.height = Math.round(imageWidth / canvasAspectRatio);
      zoom.topy = Math.round((imageHeight - zoom.height) / 2);
    }

    console.log("Editor.zoom:");
    console.log("  image width/height = ", imageWidth, imageHeight);
    console.log("  viewport width/height = ", vp.width, vp.height); 
    console.log("  zoom width/height = ", zoom.width, zoom.height); 
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
