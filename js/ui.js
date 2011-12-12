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
    
    $("#modeselector .button").mousedown(function() {
       $(this).find("ul").show(); 
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
    
    $(".buttonmaskdisplay").click(function() {
        showMaskSelection();
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
    $("section").fadeOut();
    $("#effectsdialog").fadeIn();
    $("#effectslider").slider();
}

function showMainScreen() {
    $("section").fadeOut();
    $("#modeselector").fadeIn();
}

function showMaskSelection() {
    $("section").fadeOut();
    $("#maskselection").fadeIn();
}

function showColorSelection() {
    $("section").fadeOut();
    $("#colorchanger").fadeIn();
    
    $("#hueslider").slider();
    $("#saturationslider").slider();
}