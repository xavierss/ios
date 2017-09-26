OpenLayers.Handler.LongClick = OpenLayers.Class(OpenLayers.Handler.Click, {
    sensitivity: 8,

    timer: null,

    duration: 500,

    touchstart: function(evt) {
        var that = this;

        this.startTouch();
        this.down = this.getEventInfo(evt);
        this.last = this.getEventInfo(evt);

        if(evt.touches.length === 1) {
            this.timer = window.setTimeout( function() { that.longclick(evt); }, this.duration);
        } else {
            clearTimeout(this.timer);
        }

        return true;
    },

    touchmove: function(evt) {
        this.last = this.getEventInfo(evt);
        return true;
    },

    touchend: function(evt) {
        // touchstart may not have been allowed to propagate
        if (this.down) {
            evt.xy = this.last.xy;
            evt.lastTouches = this.last.touches;
            this.handleSingle(evt);
            this.down = null;
        }

        clearTimeout(this.timer);

        return true;
    },

    mousemove: function(evt) {
        this.last = this.getEventInfo(evt);
        return true;
    },

    mousedown: function(evt) {
        var that = this;

        this.down = this.getEventInfo(evt);
        this.last = this.getEventInfo(evt);

        this.timer = window.setTimeout(function() {
            that.longclick(evt);
        }, this.duration);

        return true;
    },

    mouseup: function(evt) {
        var propagate = true;

        // Collect right mouse clicks from the mouseup
        //  IE - ignores the second right click in mousedown so using
        //  mouseup instead
        if (this.checkModifiers(evt) && this.control.handleRightClicks &&
            OpenLayers.Event.isRightClick(evt)) {
            propagate = this.rightclick(evt);
        }

        clearTimeout(this.timer);

        return propagate;
    },

    longclick: function(evt) {
        var lastX = this.last.xy.x;
        var lastY = this.last.xy.y;

        var x = evt.xy.x;
        var y = evt.xy.y;

        var xOffset = Math.abs(lastX - x);
        var yOffset = Math.abs(lastY - y);

        if(xOffset < this.sensitivity && yOffset < this.sensitivity) {
            this.callback("longclick", [evt]);
        }
    }
});