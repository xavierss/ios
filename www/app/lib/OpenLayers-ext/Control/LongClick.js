OpenLayers.Control.LongClick = OpenLayers.Class(OpenLayers.Control, {
    callbacks: null,

    defaultHandlerOptions: {
        'single': true,
        'double': false,
        'pixelTolerance': 0,
        'stopSingle': false,
        'stopDouble': false
    },
    initialize: function(options) {
        this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);

        OpenLayers.Control.prototype.initialize.apply(this, arguments);

        var callbacks = {
            longclick: options.longclick,
            click: options.click
        };

        this.callbacks = OpenLayers.Util.extend(callbacks, this.callbacks);

        this.handler = new OpenLayers.Handler.LongClick(this, callbacks, this.handlerOptions);
    }
});