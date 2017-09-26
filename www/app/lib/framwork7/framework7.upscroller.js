Framework7.prototype.plugins.upscroller = function (app, params) {
    'use strict';
    params = params || {text: 'Go up'};
    //Export selectors engine
    var $$ = window.Dom7;

    var arrowScrollPages = {
        contentIndex: true,
        bikeIndex: true
        // tourIndex: true
    };

    return {
        hooks : {
            pageBeforeInit: function (pageData) {
                if(!arrowScrollPages[pageData['name']]) {
                    return;
                }

                var $$btn = $$('<div class="upscroller">↑ ' + params.text + '</div>');
                $$(pageData.container).prepend($$btn);

                $$btn.click(function(event) {
                    event.stopPropagation();
                    event.preventDefault();
                    var curpage = $$(".page-content", myApp.getCurrentView().container);
                    $$(curpage).scrollTop(0, Math.round($$(curpage).scrollTop()/4));
                });

                var timer;
                $$(".page-content", pageData.container).scroll(function(event){
                    clearTimeout(timer);
                    var e = $$(event.target).scrollTop();
                    if(e > 300) {
                        $$btn.addClass('show').css({opacity: 1});
                        timer = setTimeout( refresh , 800 );
                    }
                    else {
                        $$btn.removeClass('show');
                    }
                });

                var refresh = function () {
                    $$btn.animate({
                        opacity: 0
                    }, 3500);
                };
            }
        }
    };
};