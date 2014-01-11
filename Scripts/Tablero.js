function Tablero(canvasId) {
    var mouseDown = false;
    var canvas = null;
    var context = null;
    var thisCanvasId = canvasId;
    
    var init = function () {
        
        canvas = document.getElementById(thisCanvasId);
        
        context = canvas.getContext("2d");

        if (context)
            context.strokeStyle = "White";

        hookEvents();

    };

    var hookEvents = function () {
        $(document).on('mousedown', '#' + thisCanvasId, function (e) {
            mouseDown = true;
            canvas = document.getElementById(thisCanvasId);
            context = canvas.getContext("2d");
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(e.offsetX, e.offsetY);
        });

        $(document).on('mouseup', '#' + thisCanvasId, function (e) {
            mouseDown = false;
        });

        $(document).on('mousemove', '#' + thisCanvasId, function (e) {
            
            var x = Math.floor(e.offsetX) + 0.5;
            var y = Math.floor(e.offsetY) + 0.5;
            context.lineTo(x, y);
            if (mouseDown)
                context.stroke();
        });
    };

    if (thisCanvasId)
        init();

    
    this.createNew = function (width, height, id) {
        var parent = $('#' + thisCanvasId).parent();
        $('<canvas id="' + id + '" width="' + width + '" height="' + height + '" style="border:1px #000 solid;cursor:pointer;background-color:black;"></canvas>').appendTo(parent);
        $('#' + thisCanvasId).remove();
        thisCanvasId = id;
        init();
    };

    this.getCurrentContext = function () {
        return context;
    };

    this.changeColor = function (color) {
        var ctx = this.getCurrentContext();
        ctx.strokeStyle = color;
    };
}
