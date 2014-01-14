function Tablero(canvasId) {
    var mouseDown = false;
    var canvas = null;
    var context = null;
    var thisCanvasId = canvasId;

    var startPaint = function (x, y) {
        mouseDown = true;
        canvas = document.getElementById(thisCanvasId);
        context = canvas.getContext("2d");
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x, y);
    };

    var endPaint = function () {
        mouseDown = false;
    };

    var draw = function (x1, y1) {
        var x = Math.floor(x1) + 0.5;
        var y = Math.floor(y1) + 0.5;
        context.lineTo(x, y);
        if (mouseDown)
            context.stroke();
    };
    
    var init = function () {
        
        canvas = document.getElementById(thisCanvasId);
        
        context = canvas.getContext("2d");

        if (context)
            context.strokeStyle = "White";

        hookEvents();

    };

    this.startPaint = function(x, y) {
        startPaint(x, y);
    };

    this.endPaint = function () {
        endPaint();
    };

    this.draw = function (x, y) {
        draw(x, y);
    };

    var hookEvents = function () {
        $(document).on('mousedown', '#' + thisCanvasId, function (e) {
            startPaint(e.offsetX, e.offsetY);
            if (onMouseDown != null && typeof(onMouseDown) === 'function') {
                onMouseDown(e.offsetX, e.offsetY);
            }
                
        });

        $(document).on('mouseup', '#' + thisCanvasId, function (e) {
            endPaint();
            if (onMouseUp != null && typeof (onMouseUp) === 'function') {
                onMouseUp();
            }
        });

        $(document).on('mousemove', '#' + thisCanvasId, function (e) {
            draw(e.offsetX, e.offsetY);
            if (onMouseMove != null && typeof(onMouseMove) === 'function') {
                onMouseMove(e.offsetX, e.offsetY);
            }
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
    
    var onMouseDown = null;
    Object.defineProperty(this, "onMouseDown", {
        get: function() {
            return onMouseDown;
        },
        set: function(value) {
            onMouseDown = value;
        }
    });
    var onMouseUp = null;
    Object.defineProperty(this, "onMouseUp", {
        get: function() {
            return onMouseUp;
        },
        set: function(value) {
            onMouseUp = value;
        }
    });
    
    var onMouseMove = null;
    Object.defineProperty(this, "onMouseMove", {
        get: function() {
            return onMouseMove;
        },
        set: function(value) {
            onMouseMove = value;
        }
    });
}
