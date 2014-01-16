(function ($) {

    $.fn.Tablero = function (options) {


        var canvas = null;
        var context = null;

        var getCurrentContext = function () {
            var selector = $(this).attr('id');
            canvas = document.getElementById(selector);
            context = canvas.getContext("2d");
            return context;
        };

        init.call(this, options);

        this.lock = function () {
            this.locked = true;
        };

        this.unlock = function () {
            this.locked = false;
        };

        this.reset = function () {
            window.location.reload();
        };

        this.changeColor = function (color) {
            getCurrentContext.call(this).strokeStyle = color;
        };

        ///These are all methods that are called remotely if the user provides
        this.startPaint = function (x, y) {

            startPaintRemote(x, y);
        };

        this.endPaint = function () {

            endPaintRemote();
        };

        this.draw = function (x, y) {

            drawRemote(x, y);
        };

        return this;

    };

    var getCoordinates = function (e) {
        var event = window.event;
        var x = e.offsetX;
        var y = e.offsetY;
        if (event.touches) {
            x = event.touches[0].pageX;
            y = event.touches[0].pageY;
        }
        return { x: x, y: y };
    };

    var hookEvents = function (options) {
        

        $(this).on('mousedown touchstart', function (e) {

            var coords = getCoordinates(e);
            startPaint(coords.x, coords.y);
            if (options.remoteStartPaint !== undefined) {
                options.remoteStartPaint.call(this, coords.x, coords.y);
            }
        });

        $(this).on('mouseup touchend',function (e) {
            endPaint();
            if (options.remoteEndPaint !== undefined) {
                options.remoteEndPaint.call();
            }
        });

        $(this).on('mousemove touchmove',  function (e) {
            var coords = getCoordinates(e);
            //console.log(this);
            draw(coords.x, coords.y);
            if (options.remoteDraw !== undefined) {
                options.remoteDraw.call(this, coords.x, coords.y);
            }
        });

    };

    var init = function (options) {
        var selector = $(this).attr('id');
        canvas = document.getElementById(selector);
        context = canvas.getContext("2d");
        if (context)
            context.strokeStyle = "White";
        hookEvents.call(this, options);
    };

    var startPaint = function (x, y) {

        this.mouseDown = true;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x, y);
    };

    var endPaint = function () {
        this.mouseDown = false;

    };

    var draw = function (x1, y1) {
        //console.log((this));

        var x = Math.floor(x1) + 0.5;
        var y = Math.floor(y1) + 0.5;
        context.lineTo(x, y);
        if (this.mouseDown)
            context.stroke();

    };


    var startPaintRemote = function (x, y) {
        this.mouseDownRemote = true;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x, y);
    };

    var endPaintRemote = function () {
        this.mouseDownRemote = false;

    };

    var drawRemote = function (x1, y1) {
        var x = Math.floor(x1) + 0.5;
        var y = Math.floor(y1) + 0.5;
        context.lineTo(x, y);
        if (this.mouseDownRemote)
            context.stroke();

    };


}(jQuery));