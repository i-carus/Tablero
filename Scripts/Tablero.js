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

        $.extend(this, { coordinates: [] });

        
        init.call(this, options);

      

        this.reset = function () {
            window.location.reload();
        };

        this.changeColor = function (color) {
            getCurrentContext.call(this).strokeStyle = color;
        };

        this.changeBackgroundColor = function (color) {
            $(this).css('background-color', color);
        };
       
        this.draw = function (coords, lineWidth) {
            drawRemote(coords,lineWidth);
        };

        this.eraser = function () {

            var con = getCurrentContext.call(this);
            console.log(con.lineWidth);
           if(con.lineWidth==1)
               con.lineWidth = 20;
            else
               con.lineWidth = 1;
        };
        
        this.exportImage = function () {
            var dataURL = canvas.toDataURL();
            window.open(dataURL);
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

    var init = function (options) {
       
        var selector = $(this).attr('id');
        var coordinates = [];
        canvas = document.getElementById(selector);
        context = canvas.getContext("2d");
        $.extend(this,coordinates);
        if (context)
            context.strokeStyle = "White";
        hookEvents.call(this, options);
    };

    var hookEvents = function (options) {
        
        $(this).on('mousedown touchstart', this.coordinates,function (e) {
            var coords = getCoordinates(e);
            startPaint(coords.x, coords.y);
            e.data.push(coords);
            
          
        });

        $(this).on('mouseup touchend',this.coordinates,function (e) {
            endPaint();
            
            if (options.remoteDraw !== undefined) {
                options.remoteDraw.call(this,e.data, context.lineWidth);
            }
            e.data.length = 0;//reset the points
        });

        $(this).on('mousemove touchmove', this.coordinates, function (e) {
            
            var coords = getCoordinates(e);

            if (draw(coords.x, coords.y))
                e.data.push(coords);
           
        });

    };

  

    var startPaint = function (x, y) {

        this.mouseDown = true;
        //context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x, y);
    };

    var endPaint = function () {
        this.mouseDown = false;

    };

    //returns true or false to indicate whether the action really drew something or not.
    var draw = function (x1, y1) {
        var x = Math.floor(x1) + 0.5;
        var y = Math.floor(y1) + 0.5;
        context.lineTo(x, y);
        if (this.mouseDown)
            context.stroke();
        return this.mouseDown;
    };



    var drawRemote = function (coordinates, lineWidth) {
        console.log(lineWidth);
        var currentWidth = context.lineWidth;
        context.lineWidth = lineWidth;
        context.beginPath();
        for (var i = 0; i < coordinates.length; i++) {
            context.lineTo(Math.floor(coordinates[i].X) + 0.5, Math.floor(coordinates[i].Y) + 0.5);
        }
        context.stroke();
        context.lineWidth = currentWidth;
    };


}(jQuery));