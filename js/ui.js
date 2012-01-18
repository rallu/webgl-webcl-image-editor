/*
 * UI code for WebGL WebCL image editor
 * 
 * Copyright (C) 2011 Juha-Pekka Rajaniemi (juha.rajaniemi 'at' gmail.com)
 *                    Tomi Aarnio (tomi.p.aarnio 'at' gmail.com)
 * 
 * 
 */

// requestAnimationFrame compatibility wrapper by Paul Irish
  
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame  || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame    || 
    window.oRequestAnimationFrame      || 
    window.msRequestAnimationFrame     || 
    function(/* function */ callback, /* DOMElement */ element){
      window.setTimeout(callback, 1000 / 60);
     };
})();

UI = (function() {

  var locals = {
    footervisible: false,      // is footer visible in mainscreen
    brushsizectx: null,        // 2d context for brush size preview
    brushctx: null,            // drawing brush 2d context
    invertbrush: false,        // is drawing brush inverted
    canvasdown: false,         // are we currently pressing the mouse button on canvas
    mousedown: false,          // is the mouse button currently pressed
    maskdrawmode: false,       // can brush be drawn on top of canvas
    zoomWidth: 1.0,            // zoom window width relative to full width
    effects: {
      sharpen: {
        name: "Sharpen",
        minval: 0,
        maxval: 100
      },
      blur: {
        name: "Blur",
        minval: 0,
        maxval: 100
      },
      findedges: {
        name: "Find edges",
        minval: 0,
        maxval: 100
      },
      effect3: {
        name: "Effect 3",
        minval: 0,
        maxval: 100
      },
      effect4: {
        name: "Effect 4",
        minval: 0,
        maxval: 100
      }
    }
  };

  var API = {

    /**
     * Inits and starts UI
     */
    init: function() {
      API.initEvents();
      API.initBrush();
      API.initDocument();
    },

    /**
     * Init document changes on startup
     */
    initDocument: function() {
      //wrap imagelist images with span
      $("#imagelist img").each(function() {
        $(this).wrap(function() {
          return '<span style="background:url(' + $(this).attr('src') + ') no-repeat center center; width: ' + $(this).width() + 'px; height: ' + $(this).height() + 'px;" />';
        });
        $(this).css("opacity", "0");
      });
    },

    /**
     * Inits all events
     */
    initEvents: function() {

      /**
       * Resize canvas & viewport on browser window resize
       */
      $(window).bind('resize', function() {
        var width = $(window).width();
        var height = $(window).height();
        var canvas = $("#canvas")[0];
        canvas.width = width;
        canvas.height = height;
        Editor.setViewport(width, height);
        Editor.render();
      });

      /**
       * Zoom in/out
       */
      $("#canvas").bind('mousewheel', function(event, delta) {
        var dir = delta > 0 ? 'In' : 'Out';
        var vel = Math.abs(delta);
        API.animateZoom(delta);
      });

      $("#canvas").bind('mousedown', function(event) {
        if (event.which == 1) {  // left mouse button pressed?
          console.log("mouse down: ", event.pageX, event.pageY);
          locals.mousedown = true;
          locals.mousePathStartX = event.pageX;
          locals.mousePathStartY = event.pageY;
        }
      });

      $(window).bind('mousemove', function(event) {
        if (locals.mousedown == true) {
          var pixelOffsetX = event.pageX - locals.mousePathStartX;
          var pixelOffsetY = event.pageY - locals.mousePathStartY;
          var relativeOffsetX = pixelOffsetX / $(window).width();
          var relativeOffsetY = pixelOffsetY / $(window).height();
          //Editor.setOffset(relativeOffsetX, relativeOffsetY);
          Editor.addOffset(relativeOffsetX, relativeOffsetY);
          Editor.render();
        }
      });

      $(window).bind('mouseup', function(event) {
        if (locals.mousedown == true) {
          console.log("mouse up: ", event.pageX, event.pageY);
          Editor.setBaseOffset();
          locals.mousedown = false;
        }
      });
      
      /**
       * Main screen file button click
       */
      $("#filemenubutton").click(function(event) {
        if (locals.footervisible) {
          $("footer").animate({
            bottom: "-310px"
          }, 500);
        } else {
          $("footer").animate({
            bottom: "0px"
          }, 500);
        }
        locals.footervisible = !locals.footervisible;
        event.preventDefault();
      });

      /**
       * Clicking the image in file menu
       */
      $("#imagelist img").click(function(event) {
        var img = new Image();
        $("#canvas").css("backgroundImage", "none");
        $("#spinner").show();
        $(img).load(function() {
          //$("#canvas").css("backgroundImage", "url("+img.src+")");
          $("#spinner").fadeOut('slow');
          locals.zoomWidth = 1.0;
          Editor.setupImage(img);
          Editor.render();
        });
        var datahref = $(this).attr("data-href");
        img.src = datahref;

        $("#filemenubutton").click();
        event.preventDefault();
      });

      /**
       * Clicking arrow right on file menu
       */
      $("#nextimages").click(function(event) {
        var amount = 800;
        $("#imagelist").stop(true).animate({
          left: "-="+amount+"px"
        }, 200);
        event.preventDefault();
      });

      /**
       * Cliking left arrow on file menu
       */
      $("#previmages").click(function(event) {
        var amount = 800;
        if (parseInt($("#imagelist").css("left")) * -1 < amount) {
          amount = -1 * parseInt($("#imagelist").css("left"));
        }
        $("#imagelist").stop(true).animate({
          left: "+="+amount+"px"
        }, 200);
        event.preventDefault();
      });

      /**
       * Mouse down on main screen buttons (colorize, effect, crop)
       */
      $("#modeselector .button").mousedown(function(event) {
        $(this).find("ul").show(); 
      });

      /**
       * Closes dropdown on main menu on every mouse up event
       */
      $("body").mouseup(function() {
        $("#modeselector .button ul").hide();
      });

      /**
       * Showing and hiding effect and colorize dialog
       */
      $(".hidedialog").click(function() {
        var top = parseInt($(this).parent().css("top"));
        var pheight = $(this).parent().height() + 40;
        if (top == 0) {
          $(this).html("▼");
          $(this).parent().animate({
            top: -pheight
          }, 500);
        } else {
          $(this).html("▲");
          $(this).parent().animate({
            top: 0
          }, 500);
        }
      });

      /**
       * Selecting cropping type in dropdown
       */
      $("#menuCrop ul li").mouseup(function() {
        API.showCropScreen($(this).attr("data-name"));
      });

      /**
       * Selecting effect in dropdown
       */
      $("#menuEffects ul li").mouseup(function() {
        API.showEffectsScreen($(this).attr("data-name"));
      });

      /**
       * All buttons with buttoncancel returns to mainmenu
       */
      $(".buttoncancel").click(function() {
        API.showMainScreen();
      });

      /**
       * Selecting colorize button
       */
      $("#menuColorize").mouseup(function() {
        API.showColorSelection();
      });

      /**
       * In mask view pressing Brush Size button
       */
      $("#buttonBrush").click(function() {
        if ($(this).hasClass("active")) {
          $(this).removeClass("active");
          $("#brushsettings").fadeOut('fast');
        } else {
          $(this).addClass("active");
          $("#brushsettings").fadeIn('fast');
        }
      });

      /**
       * In mask view pressing brush invert button
       */
      $("#buttonInvertBrush").click(function() {
        $(this).toggleClass("active");
        locals.invertbrush = $(this).hasClass("active");
      });

      /**
       * In mask view pressing Invert mask button
       */
      $("#buttonInvertMask").click(function() {

      });

      /**
       * Create brush size slider
       */
      $("#brushsizeslider").slider({
        min: 10,
        max: 80,
        value: 20,
        start: function(event, ui) {
          API.drawBrush(ui.value);
          $("#brushpreview").fadeIn('fast');
          var offset = $("#brushsizeslider .ui-slider-handle").offset();
          $("#brushpreview").css("left", offset.left - 90);
        },
        stop: function(event, ui) {
          $("#brushpreview").fadeOut('fast');
          $("#brushsettings").fadeOut('fast');
          $("#buttonBrush").removeClass('active');
        },
        slide: function(event, ui) {
          var offset = $("#brushsizeslider .ui-slider-handle").offset();
          $("#brushpreview").css("left", offset.left - 90);
          API.drawBrush(ui.value);
        }
      });

      /**
       * Events for drawing brush on top of canvas
       */
      $("#canvas").mousedown(function(event) {
        event.preventDefault();

        if (!locals.maskdrawmode)
          return;

        $(".button").css("pointer-events", "none");
        locals.canvasdown = true;
        $("#thebrush").show();
      }).mousemove(function(event) {
        event.preventDefault();

        if (!locals.canvasdown)
          return;

        $("#thebrush").css("left", event.pageX - 85);
        $("#thebrush").css("top", event.pageY - 85);
      }).mouseup(function(event) {
        locals.canvasdown = false;
        $("#thebrush").hide();
        event.preventDefault();
        $(".button").css("pointer-events", "auto");
      }).click(function(event) {
        event.preventDefault();
      });
    },
    
    /**
     * Inits brush 2d context's
     */
    initBrush: function() {
      locals.brushsizectx = document.getElementById("brushsize").getContext('2d');
      locals.brushctx = document.getElementById("thebrush").getContext('2d');
      this.drawBrush(20);
    },

    /**
     * Redraws preview brush and painting brush.
     */
    drawBrush: function(pixelsize) {
      if (locals.invertbrush) {
        locals.brushsizectx.clearRect(0,0,160,160);
        locals.brushsizectx.fillRect(0,0,160,160);
        locals.brushsizectx.globalCompositeOperation = 'xor';
        locals.brushsizectx.beginPath();
        locals.brushsizectx.arc(80, 80, pixelsize, 0, Math.PI*2, true);
        locals.brushsizectx.closePath();
        locals.brushsizectx.fill();
      } else {
        locals.brushsizectx.globalCompositeOperation = 'source-over';
        locals.brushsizectx.clearRect(0,0,160,160);
        locals.brushsizectx.beginPath();
        locals.brushsizectx.arc(80, 80, pixelsize, 0, Math.PI*2, true);
        locals.brushsizectx.closePath();
        locals.brushsizectx.fill();
      }


      locals.brushctx.clearRect(0,0,170,170);
      locals.brushctx.lineWidth = 4;
      locals.brushctx.strokeStyle = 'rgba(254,180,28,0.5)';
      locals.brushctx.beginPath();
      locals.brushctx.arc(85, 85, pixelsize, 0, Math.PI*2, true);
      locals.brushctx.stroke();
    },

    /**
     * After selecting crop ratio in main screen
     * 
     * @param (cropratio) cropratio value received from ul li menu.
     */
    showCropScreen: function(cropratio) {
      $("section").fadeOut();
      $("#cropselection").fadeIn();
    },

    /**
     * After selecing effect in main screen
     * 
     * @param (effectName) Effects name received from ul li menu. 
     */
    showEffectsScreen: function(effectName) {
      this.resetViewSettings()

      $("#effectsdialog h1").html(eval("this.effects."+effectName+".name"));

      $("section").fadeOut();
      $("#effectsdialog").fadeIn();
      $("#maskselection").fadeIn();

      locals.maskdrawmode = true;

      var min = eval("this.effects."+effectName+".minval");
      var max = eval("this.effects."+effectName+".maxval");

      $("#effectslider").slider({
        min: min,
        max: max
      });
    },

    animateZoom: function(delta) {

      if (locals.animationComplete == false) {
        console.log("previous zoom ongoing, bailing out...");
        return;
      }

      var prevZoom = 1.0 / locals.zoomWidth;
      locals.zoomWidth *= (1.0 - 0.2*delta);
      locals.zoomWidth = Math.min(locals.zoomWidth, 1.0);
      locals.zoomWidth = Math.max(locals.zoomWidth, 0.01);
      var newZoom = 1.0 / locals.zoomWidth;
      console.log("prev, new zoom: ", prevZoom, newZoom);
      var startTime = new Date().getTime();

      window.requestAnimFrame(function() {
        var elapsed = new Date().getTime() - startTime;
        var tStep = Math.min(elapsed / 200, 1.0);
        var aStep = (newZoom - prevZoom) * tStep;
        //console.log("steps: ", tStep, aStep);
        Editor.setZoom(prevZoom + aStep);
        Editor.setDebug(false);
        Editor.render();
        Editor.setDebug(true);
        if (elapsed < 200) {
          locals.animationComplete = false;
          window.requestAnimFrame(this);
        } else {
          locals.animationComplete = true;
        }
      });
    },

    /**
     * Go back to main screen
     */
    showMainScreen: function() {
      $("section").fadeOut();
      $("#modeselector").fadeIn();
      locals.maskdrawmode = false;
    },

    /**
     * After use click Colorize button on mainscreen
     */
    showColorSelection: function() {
      this.resetViewSettings();

      locals.maskdrawmode = true;

      $("section").fadeOut();
      $("#colorchanger").fadeIn();
      $("#maskselection").fadeIn();
      $("#hueslider").slider();
      $("#saturationslider").slider();
    },

    /**
     * Resets Mask display with default values.
     */
    resetViewSettings: function() {
      $(".dialog").css("top", 0);
      $(".hidedialog").html("▲");
      $("#brushpreview").hide();
      $("#brushsettings").hide();
      $("#maskbuttons .active").removeClass("active");
      locals.invertbrush = false;
    }
  };

  return API;

})();

//start the ui after document load
$(document).ready(function() {
  UI.init();
})
