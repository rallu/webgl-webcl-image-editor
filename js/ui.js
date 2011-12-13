var footervisible = false;
var brushsizectx = null;
var invertbrush = false;

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
        $("#canvas").css("backgroundImage", "url("+$(this).attr("src")+")");
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
    
    $("#modeselector").mouseup(function() {
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
    
    brushsizectx = document.getElementById("brushsize").getContext('2d');
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
}

function showCropScreen(cropratio) {
    $("section").fadeOut();
    $("#cropselection").fadeIn();
}

function showEffectsScreen(effectName) {
    $(".dialog").css("top", 0);
    $(".hidedialog").html("▲");
    $("#maskselection .active").removeClass("active");
    invertbrush = false;
    
    $("section").fadeOut();
    $("#effectsdialog").fadeIn();
    $("#maskselection").fadeIn();
    $("#effectslider").slider();
}

function showMainScreen() {
    $("section").fadeOut();
    $("#modeselector").fadeIn();
}


function showColorSelection() {
    $(".dialog").css("top", 0);
    $(".hidedialog").html("▲")
    $("#maskselection .active").removeClass("active");
    invertbrush = false;
    
    $("section").fadeOut();
    $("#colorchanger").fadeIn();
    $("#maskselection").fadeIn();
    $("#hueslider").slider();
    $("#saturationslider").slider();
}