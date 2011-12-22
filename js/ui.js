/*
 * UI code for WebGL WebCL image editor
 * 
 * Copyright (C) 2011 Juha-Pekka Rajaniemi (juha.rajaniemi 'at' gmail.com)
 *                    Tomi Aarnio (tomi.p.aarnio 'at' gmail.com)
 * 
 * 
 */

var  UI = {
  // is footer visible in mainscreen
  footervisible: false,

  // brush preview size 2d context
  brushsizectx: null,
  
  // drawing brush 2d contect
  brushctx: null,
  
  // is drawing brush inverted
  invertbrush: false,
  
  // are we currently pressing button on canvas
  canvasdown: false,
  
  // can brush be drawn top of canvas
  maskdrawmode: false,

  // are we zoomed in or not (TODO: make this a slider)
  zoomed: false,

  //effect values
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
  },

  /**
   * Inits and starts UI
   */
  init: function() {
    this.initEvents();
    this.initBrush();
  },

  /**
   * Inits all events
   */
  initEvents: function() {
    var $this = this;
    
    /**
     * Resize canvas size on browser window resize
     */
    $(window).bind('resize', function() {
      var canvas = $("#canvas")[0];
      canvas.width = $(window).width();
      canvas.height = $(window).height();
      var zoomFunc = $this.zoomed ? Editor.zoom : Editor.setupViewport;
      zoomFunc(canvas);
      Editor.render();
    });

    /**
     * Zoom in/out
     */
    $("#canvas").bind('click', function() {
      var canvas = $("#canvas")[0];
      $this.zoomed = !($this.zoomed);
      var zoomFunc = $this.zoomed ? Editor.zoom : Editor.setupViewport;
      zoomFunc(canvas);
      Editor.render();
    });
    
    /**
     * Main screen file button click
     */
    $("#filemenubutton").click(function(event) {
      if ($this.footervisible) {
        $("footer").animate({
          bottom: "-300px"
        }, 500);
      } else {
        $("footer").animate({
          bottom: "0px"
        }, 500);
      }
      $this.footervisible = !$this.footervisible;
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
        Editor.setupImage(img);
      });
      var datahref = $(this).attr("data-href");
      setTimeout(function() {
        img.src = datahref;
      }, 1000);

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
      $this.showCropScreen($(this).attr("data-name"));
    });

    /**
     * Selecting effect in dropdown
     */
    $("#menuEffects ul li").mouseup(function() {
      $this.showEffectsScreen($(this).attr("data-name"));
    });

    /**
     * All buttons with buttoncancel returns to mainmenu
     */
    $(".buttoncancel").click(function() {
      $this.showMainScreen();
    });

    /**
     * Selecting colorize button
     */
    $("#menuColorize").mouseup(function() {
      $this.showColorSelection();
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
      $this.invertbrush = $(this).hasClass("active");
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
        $this.drawBrush(ui.value);
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
        $this.drawBrush(ui.value);
      }
    });

    /**
     * Events for drawing brush on top of canvas
     */
    $("#canvas").mousedown(function(event) {
      event.preventDefault();

      if (!$this.maskdrawmode)
        return;

      $(".button").css("pointer-events", "none");
      $this.canvasdown = true;
      $("#thebrush").show();
    }).mousemove(function(event) {
      event.preventDefault();

      if (!$this.canvasdown)
        return;

      $("#thebrush").css("left", event.pageX - 85);
      $("#thebrush").css("top", event.pageY - 85);
    }).mouseup(function(event) {
      $this.canvasdown = false;
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
    this.brushsizectx = document.getElementById("brushsize").getContext('2d');
    this.brushctx = document.getElementById("thebrush").getContext('2d');
    this.drawBrush(20);
  },

  /**
   * Redraws preview brush and painting brush.
   */
  drawBrush: function(pixelsize) {
    if (this.invertbrush) {
      this.brushsizectx.clearRect(0,0,160,160);
      this.brushsizectx.fillRect(0,0,160,160);
      this.brushsizectx.globalCompositeOperation = 'xor';
      this.brushsizectx.beginPath();
      this.brushsizectx.arc(80, 80, pixelsize, 0, Math.PI*2, true);
      this.brushsizectx.closePath();
      this.brushsizectx.fill();
    } else {
      this.brushsizectx.globalCompositeOperation = 'source-over';
      this.brushsizectx.clearRect(0,0,160,160);
      this.brushsizectx.beginPath();
      this.brushsizectx.arc(80, 80, pixelsize, 0, Math.PI*2, true);
      this.brushsizectx.closePath();
      this.brushsizectx.fill();
    }


    this.brushctx.clearRect(0,0,170,170);
    this.brushctx.lineWidth = 4;
    this.brushctx.strokeStyle = 'rgba(254,180,28,0.5)';
    this.brushctx.beginPath();
    this.brushctx.arc(85, 85, pixelsize, 0, Math.PI*2, true);
    this.brushctx.stroke();
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

    this.maskdrawmode = true;

    var min = eval("this.effects."+effectName+".minval");
    var max = eval("this.effects."+effectName+".maxval");

    $("#effectslider").slider({
      min: min,
      max: max
    });
  },

  /**
   * Go back to main screen
   */
  showMainScreen: function() {
    $("section").fadeOut();
    $("#modeselector").fadeIn();
    this.maskdrawmode = false;
  },

  /**
   * After use click Colorize button on mainscreen
   */
  showColorSelection: function() {
    this.resetViewSettings();

    this.maskdrawmode = true;

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
    this.invertbrush = false;
  }
}

//start the ui after document load
$(document).ready(function() {
  UI.init();
});