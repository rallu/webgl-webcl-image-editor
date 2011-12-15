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

  API = {
    canvas : null,
    gl : null,
  };

  API.setup = function setup (canvas) {
    API.canvas = canvas;
    API.gl = gl = glimr.getContext(canvas);
    glimr.textures.original = new Texture(gl);
    glimr.textures.filtered = new Texture(gl);
    glimr.textures.mask = new Texture(gl);
    glimr.textures.result = new Texture(gl);
  }

  API.setupImage = function setupImage (image) {
    var gl = API.gl;
    var canvas = API.canvas;
    console.log("previous canvas size:", canvas.width, canvas.height);
    console.log("new canvas size:", $(window).width(), $(window).height());
    canvas.width = $(window).width();
    canvas.height = $(window).height();
    gl.viewport(0, 0, canvas.width, canvas.height);

    glimr.textures.original.texImage2D(gl, gl.RGB, true, image);
    glimr.textures.filtered.texImage2D(gl, gl.RGB, true, image);
    glimr.textures.mask.texImage2D(gl, gl.RGBA, true, image);
    glimr.textures.result.texImage2D(gl, gl.RGBA, true, image);
    console.log("Created a new texture:", glimr.textures.original);
    console.log("Created a new texture:", glimr.textures.filtered);
    console.log("Created a new texture:", glimr.textures.mask);
    console.log("Created a new texture:", glimr.textures.result);
    API.renderOriginal();
  };

  API.renderOriginal = function renderOriginal () {
    var gl = API.gl;

    var uniforms = {
      'resolution' : [API.canvas.width, API.canvas.height],
      'src' : glimr.textures.original,
    };
    console.log("renderOriginal, resolution = ", uniforms.resolution);

    glimr.render(gl, 'fragmentshader', 'original', uniforms);
  };

  return API;

})();
