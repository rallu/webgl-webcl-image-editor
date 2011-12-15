var footervisible = false;
var brushsizectx = null;
var brushctx = null;
var invertbrush = false;
var canvasdown = false;
var maskdrawmode = false;

var effects = {
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

$(window).bind('resize', function() {
  var canvasCSS = $("#canvas");
  //$.resizeCanvasCSS();
});

$(document).ready(function() {

    $("#filemenubutton").click(function(event) {
        if (footervisible) {
            $("footer").animate({
                bottom: "-300px"
            }, 500);
        } else {
            $("footer").animate({
                bottom: "0px"
            }, 500);
        }
        footervisible = !footervisible;
        event.preventDefault();
    });
    
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
    
    $("#nextimages").click(function(event) {
        var amount = 800;
        $("#imagelist").stop(true).animate({
            left: "-="+amount+"px"
        }, 200);
        event.preventDefault();
    });
    
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
    
    $("#modeselector .button").mousedown(function(event) {
        $(this).find("ul").show(); 
    });
    
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
    
    $("body").mouseup(function() {
        $("#modeselector .button ul").hide();
    });
    
    $("#menuCrop ul li").mouseup(function() {
        showCropScreen($(this).attr("data-name"));
    });
    
    
    $("#menuEffects ul li").mouseup(function() {
        showEffectsScreen($(this).attr("data-name"));
    });
    
    $(".buttoncancel").click(function() {
        showMainScreen();
    });
    
    $("#menuColorize").mouseup(function() {
        showColorSelection();
    });
    
    $("#buttonBrush").click(function() {
        if ($(this).hasClass("active")) {
            $(this).removeClass("active");
            $("#brushsettings").fadeOut('fast');
        } else {
            $(this).addClass("active");
            $("#brushsettings").fadeIn('fast');
        }
    });
    
    $("#buttonInvertBrush").click(function() {
        $(this).toggleClass("active");
        invertbrush = $(this).hasClass("active");
    });
    
    $("#buttonInvertMask").click(function() {
        
        });
    
    $("#brushsizeslider").slider({
        min: 10,
        max: 80,
        value: 20,
        start: function(event, ui) {
            drawBrush(ui.value);
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
            drawBrush(ui.value);
        }
    });
    
    $("#canvas").mousedown(function(event) {
        event.preventDefault();
        
        if (!maskdrawmode)
            return;
        
        $(".button").css("pointer-events", "none");
        canvasdown = true;
        $("#thebrush").show();
    }).mousemove(function(event) {
        event.preventDefault();
        
        if (!canvasdown)
            return;
        
        $("#thebrush").css("left", event.pageX - 85);
        $("#thebrush").css("top", event.pageY - 85);
    }).mouseup(function(event) {
        canvasdown = false;
        $("#thebrush").hide();
        event.preventDefault();
        $(".button").css("pointer-events", "auto");
    }).click(function(event) {
        event.preventDefault();
    });
    
    
    brushsizectx = document.getElementById("brushsize").getContext('2d');
    brushctx = document.getElementById("thebrush").getContext('2d');
    drawBrush(20);
});

function drawBrush(pixelsize) {
    if (invertbrush) {
        brushsizectx.clearRect(0,0,160,160);
        brushsizectx.fillRect(0,0,160,160);
        brushsizectx.globalCompositeOperation = 'xor';
        brushsizectx.beginPath();
        brushsizectx.arc(80, 80, pixelsize, 0, Math.PI*2, true);
        brushsizectx.closePath();
        brushsizectx.fill();
    } else {
        brushsizectx.globalCompositeOperation = 'source-over';
        brushsizectx.clearRect(0,0,160,160);
        brushsizectx.beginPath();
        brushsizectx.arc(80, 80, pixelsize, 0, Math.PI*2, true);
        brushsizectx.closePath();
        brushsizectx.fill();
    }
    
    
    brushctx.clearRect(0,0,170,170);
    brushctx.lineWidth = 4;
    brushctx.strokeStyle = 'rgba(254,180,28,0.5)';
    brushctx.beginPath();
    brushctx.arc(85, 85, pixelsize, 0, Math.PI*2, true);
    brushctx.stroke();
}

function showCropScreen(cropratio) {
    $("section").fadeOut();
    $("#cropselection").fadeIn();
}

function showEffectsScreen(effectName) {
    resetViewSettings()
    
    $("#effectsdialog h1").html(eval("effects."+effectName+".name"));
    
    $("section").fadeOut();
    $("#effectsdialog").fadeIn();
    $("#maskselection").fadeIn();
    
    maskdrawmode = true;
    
    var min = eval("effects."+effectName+".minval");
    var max = eval("effects."+effectName+".maxval");
    
    $("#effectslider").slider({
        min: min,
        max: max
    });
}

function showMainScreen() {
    $("section").fadeOut();
    $("#modeselector").fadeIn();
    maskdrawmode = false;
}


function showColorSelection() {
    resetViewSettings();
    
    maskdrawmode = true;
    
    $("section").fadeOut();
    $("#colorchanger").fadeIn();
    $("#maskselection").fadeIn();
    $("#hueslider").slider();
    $("#saturationslider").slider();
}

function resetViewSettings() {
    $(".dialog").css("top", 0);
    $(".hidedialog").html("▲");
    $("#brushpreview").hide();
    $("#brushsettings").hide();
    $("#maskbuttons .active").removeClass("active");
    invertbrush = false;
}

/**
 * Sets the CSS width and height of the canvas according to the
 * following rules: 1) Keep the entire image visible; 2) Retain
 * the original aspect ratio of the image; 3) Maximize the screen
 * size of the image.
 */
$.resizeCanvasCSS = function(cssCanvas) {

  var screenCanvas = cssCanvas;           // CSS (jQuery) representation of the canvas (scaled)
  var imageCanvas = cssCanvas[0];         // the HTML DOM canvas element (actual framebuffer)
  var imageWidth = imageCanvas.width;
  var imageHeight = imageCanvas.height;
  var windowWidth = $(window).width();
  var windowHeight = $(window).height();
  var imageAspectRatio = imageCanvas.width / imageCanvas.height;
  var windowAspectRatio = windowWidth / windowHeight;

  // Set the CSS width and height of the canvas so as to maximize its
  // size, while retaining original aspect ratio.

  if (imageAspectRatio > windowAspectRatio) {  

    // The image is "more widescreen" than the window,
    // so set the CSS width first, then rescale height;
    // this leaves an empty border at the bottom.
    
    screenCanvas.width(windowWidth);
    screenCanvas.height(Math.round(windowWidth / imageAspectRatio));

  } else { 

    // The image is "less widescreen" than the window,
    // so set the CSS height first, then rescale width;
    // this leaves an empty border at the right edge.
    
    screenCanvas.height(windowHeight);
    screenCanvas.width(Math.round(windowHeight * imageAspectRatio));
  }

  console.log("resizeCanvasCSS:");
  console.log("  image width/height = ", imageWidth, imageHeight);
  console.log("  window width/height = ", windowWidth, windowHeight);
  console.log("  CSS width/height = ", screenCanvas.width(), screenCanvas.height());
};

