(function ($) {

    $.fn.Tablero = function (options) {
        
        var canvas = null;
        var context = null;
        var currentColor = null;
        //this is the list of users to ignore
        var ignore = [];

        var getCurrentContext = function () {
            var selector = $(this).attr('id');
            canvas = document.getElementById(selector);
            context = canvas.getContext("2d");
            return context;
        };

        $.extend(this, { coordinates: [] });


        this.getCurrentColor = function () {
            return currentColor;
        };
        

        this.changeColor = function (color) {
            currentColor = color;
            getCurrentContext.call(this).strokeStyle = color;
        };

        this.isUserIgnored = function(user) {
            
            return !($.inArray(user, ignore) == -1);
        };

        this.reset = function (from) {
            if (!this.isUserIgnored(from)) {
                context = getCurrentContext.call(this);
                context.clearRect(0, 0, $(this).width(), $(this).height());
            }
        };

        this.changeBackgroundColor = function (color) {
            $(this).css('background-color', color);
        };
       
        this.draw = function (shape,from) {
            if(!this.isUserIgnored(from))
              drawRemote(shape);
        };

        this.block = function (name) {
            
            if(!this.isUserIgnored(name))
                ignore.push(name);
           
        };

        this.unblock = function (name) {
            ignore.splice($.inArray(name, ignore), 1);
            
        };
        this.eraser = function () {

            var con = getCurrentContext.call(this);
            
           if(con.lineWidth==1)
               con.lineWidth = 20;
            else
               con.lineWidth = 1;
        };
        
        this.exportImage = function () {
            var dataURL = canvas.toDataURL();
            window.open(dataURL);
        };

        init.call(this, options);

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
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        $.extend(this,coordinates);
        if (context) {
            this.changeColor('yellow');
        }
        hookEvents.call(this, options);
    };

    var hookEvents = function (options) {
        var color = this.getCurrentColor;
        var context = canvas.getContext("2d");
        //we need to handle window resizes to accomodate for canvas width and height properly
        $(window).resize(function () {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            context.strokeStyle = color();            
        });

        $(this).on('mousedown touchstart', this.coordinates,function (e) {
            var coords = getCoordinates(e);
            startPaint(coords.x, coords.y);
            e.data.push(coords);         
        });

        $(this).on('mouseup touchend',this.coordinates,function (e) {
            endPaint();
            
            if (options!==undefined && options.remoteDraw !== undefined) {
                options.remoteDraw.call(this, { Coordinates: e.data, LineWidth: context.lineWidth, Color: color() });
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



    var drawRemote = function (shape) {
        
        var currentWidth = context.lineWidth;
        var currentColor = context.strokeStyle;
        context.lineWidth = shape.LineWidth;
        context.strokeStyle = shape.Color;
        context.beginPath();
        for (var i = 0; i < shape.Coordinates.length; i++) {
            context.lineTo(Math.floor(shape.Coordinates[i].X) + 0.5, Math.floor(shape.Coordinates[i].Y) + 0.5);
        }
        context.stroke();
        context.lineWidth = currentWidth;
        context.strokeStyle = currentColor;
    };


}(jQuery));