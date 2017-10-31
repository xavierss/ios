var myApp = new Framework7({
    precompileTemplates: true, // Tell Framework7 to compile templates on app init
    template7Pages: true, // enable Template7 rendering for Ajax and Dynamic pages
    popoverCloseByOutside: false,
    modalTitle: '',

    upscroller: {text : '맨 위로'},

    onAjaxStart: function (xhr) {
        myApp.showIndicator();
    },
    onAjaxComplete: function (xhr) {
        myApp.hideIndicator();
    }
});

// Export selectors engine
var $$ = Dom7;

var tourSteps = [
    {
        step: 0,
        header: '퀵 메뉴',
        message: '현재위치 확인, 관광명소 찾기, 트래킹, 지도 초기화 기능을 빠르게 사용할 수 있는 도구를 제공합니다.',
        element: "#mapSpeedDial",
        action: function () {
            if(!$$('#mapSpeedDial').hasClass('speed-dial-opened')) {
                $$('#mapDial').click();
            }
        }
    },
    {
        step: 1,
        header: '현재위치',
        message: '지도에 현재위치(마커)를 표시합니다. 마커를 지우시려면 현재위치를 비활성화 하시면 됩니다.',
        element: "#btnCurrentLocation"
    },
    {
        step: 2,
        header: '관광명소 찾기',
        message: '관광명소를 빠르게 찾아 갈수 있도록 검색 목록을 제공하며 관광명소 선택시 빠른 길 안내를 제공합니다.',
        element: "#btnDestinationSearch"
    },
    {
        step: 3,
        header: '지도 초기화',
        message: '지도에 그려진 길찾기, 따릉이, 출발지, 도착지 등을 지웁니다. 단, 사용자 위치 마커는 지워지지 않습니다.',
        element: "#btnCleanMap",
        action: function () {
            if(!$$('#mapSpeedDial').hasClass('speed-dial-opened')) {
                $$('#mapDial').click();
            }
        }
    },
    {
        step: 4,
        header: '위치추적',
        message: '스위치를 ON 하시면 현재 위치를 추적합니다. 위치추적은 현재위치 기능이 활성화 되어 있어야합니다.',
        element: "#trackingLabel",
        action: function () {
            if($$('#mapSpeedDial').hasClass('speed-dial-opened')) {
                $$('#mapDial').click();
            }
        }
    },
    {
        step: 5,
        header: '길 안내 상세보기',
        message: '출발지에서 목적지까지의 총 거리와 시간 그리고 경로 100m 반경 내에 착한업소 목록을 확인 할 수 있습니다.',
        element: "#btnLeftMenu",
        action: function() {
            myApp.showTab('#mapView');
        }
    },
    {
        step: 6,
        header: '출발지, 도착지 검색',
        message: '주소, 명칭을 입력하여 출발지 도착지를 검색 할 수있습니다.',
        element: "#txtStart",
        action: function() {
            myApp.showTab('#contentView');
        }
    },
    {
        step: 7,
        header: '최근이용 검색',
        message: '최근에 이용한 경로를 확인 할 수있습니다.',
        element: "#routeSearchList"
    }
];

var tourguide = myApp.tourguide(tourSteps, {
    previousButton: true,
    nextButtonText: '다음',
    previousButtonText: '이전',
    endTourButtonText: '완료'
});

// 글로벌 데이터
Framework7.globals = {
    position: {},
    routeStart: {},
    routeEnd: {},
    directRouteStart: {},
    directRouteEnd: {},

    IMAGE_URL: 'http://wekits.iptime.org/images/'
};

// 모듈 초기화
Template7.module = (function(){
    return {
        init: function() {
            for(var index in Template7.module) {
                if (typeof Template7.module[index] !== "function") {
                    Template7.module[index].init();
                }
            }
            runApplication(this);

            // 팁 깜박거리는 옵션
            setInterval(function() {
                var $$li_list = $$('#tipHeader li');
                var $li_listLength = $$li_list.length;
                var $$first_li = $$('#tipHeader li[style*="display: block"]');
                $$li_list.css('display', 'none');

                if (parseInt($$first_li.data('seq')) === $li_listLength) {
                    $$('#tipHeader li').eq(0).css('display', 'block');
                } else {
                    $$first_li.next().css('display', 'block');
                }
            }, 2500);
        }
    }
}());

var runApplication = function (moduls) {
    /**
     * 초기화 함수
     */
    ~function appInit() {
        // 뷰 초기화
        initView();

        // 페이지 초기화
        initPage();

        // Framework7 Component 초기화
        initComponent();
    }();

    /**
     * 지도 뷰
     */
    function initView() {
        var mapView = myApp.addView('#mapView', {
            name: 'mapView',
            domCache: true
        });

        var contentView = myApp.addView('#contentView', {
            name: 'contentView',
            dynamicNavbar: true,
            domCache: true
        });

        var bikeView = myApp.addView('#bikeView', {
            name: 'bikeView',
            domCache: true
        });

        var tourView = myApp.addView('#tourView', {
            name: 'tourView',
            dynamicNavbar: true,
            domCache: true
        });

        var settingView = myApp.addView('#settingView', {
            name: 'settingView',
            dynamicNavbar: true,
            domCache: true
        });

        myApp.onPageInit('tourItemIndex', function(page) {

            Template7.module.db.selectVisitById(page.context.id, function(visit) {
                if(visit) {
                    $$(page.container).find('#btnRemoveVisit').show();
                } else {
                    $$(page.container).find('#btnAddVisit').show();
                }
            });

           // 찜 하기
           $$(page.container).on('click', '#btnAddVisit', function() {
               var $$element = $$(this);
               var name = $$(this).data('name');

               Template7.module.db.insertVisit({
                   id: $$element.data('id'),
                   lon: $$element.data('lon'),
                   lat: $$element.data('lat'),
                   name: name
               }, function () {
                   $$(myApp.getCurrentView().container).find('#btnRemoveVisit').show();
                   $$(page.container).find('#btnAddVisit').hide();
               });

           });

           // 찜 해제
           $$(page.container).on('click', '#btnRemoveVisit', function() {
               var $$element = $$(this);
               var id = $$element.data('id');
               var name = $$element.data('name');

               Template7.module.db.deleteVisitById(id, function() {
                   $$(myApp.getCurrentView().container).find('#btnRemoveVisit').hide();
                   $$(page.container).find('#btnAddVisit').show();
               });
           });

           // 위치
           $$(page.container).on('click', '#btnTourLocation', function(){
               var lon = $$(this).data('lon');
               var lat = $$(this).data('lat');
               var name = $$(this).data('name');

               var lonlat = new OpenLayers.LonLat(lon, lat);
               Template7.module.map.moveTo(lonlat.transform('EPSG:4326', Template7.module.map.getMap().getProjection()), 18, name);

               myApp.showTab('#mapView');
           });

           // 길안내
           $$(page.container).on('click', '#btnTourRoute', function(){
               var $this = $$(this);
               var lon = $this.data('lon');
               var lat = $this.data('lat');
               var name = $this.data('name');

               myApp.confirm(name + '까지 가는길을 검색하겠습니까?', function() {
                   Template7.module.rest.daumCoord2addr({lon: Framework7.globals.position.lon, lat: Framework7.globals.position.lat}, function(data) {
                       var start = {
                           y: Framework7.globals.position.lat,
                           x: Framework7.globals.position.lon,
                           name: data.old.name + ' (현재위치)'
                       };

                       var end = {
                           y: lat,
                           x: lon,
                           name: name + ' (관광명소)'
                       };

                       Template7.module.util.route(start, end, 'tour', function(data) {
                           Template7.module.util.showBikePath({
                               sDistance : data.startDistance,
                               bDistance : data.bikeDistance,
                               eDistance : data.endDistance,
                               startPoint: start,
                               endPoint: end,
                               passList: data.passList || null
                           });
                           myApp.showTab('#mapView');
                       });
                   });
               });
           });
        });

        myApp.onPageInit('myRouteIndex', function(page) {
            function initMyRouteIndex() {
                $$('#dbRouteResult ul.reoute-datas').children().remove();

                Template7.module.db.selectRoutes(function(routes) {
                    if(routes.length < 1) {
                        $$('#dbRouteResult ul.empty-route-datas').show();
                        $$('#dbRouteResult ul.reoute-datas').show();
                    } else {
                        $$('#dbRouteResult ul.empty-route-datas').hide();
                        $$('#dbRouteResult ul.reoute-datas').show();
                    }

                    var html = '';
                    for(var i = 0, len = routes.length; i < len; i++) {
                        var route = routes[i];
                        var type = route.route_type;

                        switch(type) {
                            case 'bike':
                                route.imageUrl = './images/icons/bike.png';
                                route.title = '따릉이 대여소';
                                break;
                            case 'tour':
                                route.imageUrl = './images/icons/photo-camera.png';
                                route.title = '관광명소';
                                break;
                            case 'park':
                                route.imageUrl = './images/icons/park.png';
                                route.title = '공원';
                                break;
                            case 'nomal':
                            default:
                                route.imageUrl = './images/icons/route.png';
                                route.title = '길찾기';
                                break;
                        }

                        html += Template7.templates.dbRouteTemplate($$.extend({}, {seq: i + 1}, route));
                    }
                    $$('#dbRouteResult ul.reoute-datas').append(html);
                });
            }

            // 최근 길찾기 아이템 클릭
            $$(page.container).on('click', '.db-route-item', function() {
                var id = $$(this).data('id');
                // myApp.showPreloader('조회중입니다.');
                Template7.module.db.selectRouteById(id, function(route){
                    var start = {
                        y: route.start_lat,
                        x: route.start_lon,
                        name: route.start_name
                    };

                    var end = {
                        y: route.end_lat,
                        x: route.end_lon,
                        name: route.end_name
                    };

                    if(route.route_type === 'bike') {
                        myApp.showPreloader('조회중입니다.');
                        Template7.module.util.findDirections(start, end, null, function(data) {
                            if(data.code === Template7.module.rest.SUCCESS_CODE) {
                                // 착한업소 레이어를 삭제한다.
                                Template7.module.map.clearStoreLayer();
                                Template7.module.map.clearBikeDrawLayer();
                                Template7.module.util.findRouteStore(data.routeLine);
                                Template7.module.util.showBikePath({
                                    sDistance : data.startDistance,
                                    bDistance : data.bikeDistance,
                                    eDistance : data.endDistance,
                                    startPoint: start,
                                    endPoint: end,
                                    passList: data.passList || null
                                });
                                myApp.hidePreloader();
                                myApp.showTab('#mapView');
                            }
                        });
                    } else {
                        Template7.module.util.route(start, end, route.route_type, function(data){
                            Template7.module.util.showBikePath({
                                sDistance : data.startDistance,
                                bDistance : data.bikeDistance,
                                eDistance : data.endDistance,
                                startPoint: start,
                                endPoint: end,
                                passList: data.passList || null
                            });

                            Template7.module.db.selectRoutes(function(routes){
                                Template7.module.db.deleteRouteById(routes[0].id)
                            });

                            myApp.showTab('#mapView');
                        });
                    }
                    // myApp.hidePreloader();
                });
            });

            // 최근 길찾기 아이템 전체 삭제
            $$(page.navbarInnerContainer).on('click', '#btnDeleteRoutes', function() {
                myApp.confirm('길찾기 데이터를 전체 삭제하시겠습니까?', function(){
                    Template7.module.db.deleteRoutes();
                    refreshRouteResult();
                });
            });

            // 최근 길찾기 아이템 삭제
            $$(page.container).on('swipeout:delete', '.swipeout', function () {
                var id = $$(this).find('.db-route-item').data('id');
                Template7.module.db.deleteRouteById(id);
                refreshRouteResult();
            });

            /**
             * 길찾기 결과 새로고침
             */
            function refreshRouteResult() {
                Template7.module.db.selectRoutes(function(routes) {
                    $$('#dbRouteResult ul.reoute-datas').children().remove();

                    if(routes.length < 1) {
                        $$('#dbRouteResult ul.empty-route-datas').show();
                        $$('#dbRouteResult ul.reoute-datas').show();
                    } else {
                        $$('#dbRouteResult ul.empty-route-datas').hide();
                        $$('#dbRouteResult ul.reoute-datas').show();
                    }


                    var html = '';
                    for(var i = 0, len = routes.length; i < len; i++) {
                        var route = routes[i];
                        var type = route.route_type;

                        switch(type) {
                            case 'bike':
                                route.imageUrl = './images/icons/bike.png';
                                route.title = '따릉이 대여소';
                                break;
                            case 'tour':
                                route.imageUrl = './images/icons/photo-camera.png';
                                route.title = '관광명소';
                                break;
                            case 'park':
                                route.imageUrl = './images/icons/park.png';
                                route.title = '공원';
                                break;
                            case 'nomal':
                            default:
                                route.imageUrl = './images/icons/route.png';
                                route.title = '길찾기';
                                break;
                        }
                        html += Template7.templates.dbRouteTemplate($$.extend({}, {seq: i + 1}, route));
                    }
                    $$('#dbRouteResult ul.reoute-datas').append(html);
                });
            }

            initMyRouteIndex();
        });

        myApp.onPageInit('trackingListIndex', function(page) {

            // 트래킹 아이템 삭제
            $$(page.container).on('swipeout:delete', '.swipeout', function () {
                var id = $$(this).find('.delete-tracing-item').data('id');
                Template7.module.db.deleteTrackingById(id);
                refreshTrackingResult();
            });

            // 트래킹 전체삭제
            $$(page.navbarInnerContainer).on('click', '#btnDeleteTrackings', function(){
                myApp.confirm('트래킹 데이터를 전체 삭제하시겠습니까?', function(){
                    Template7.module.db.deleteTrackings();
                    refreshTrackingResult();
                });
            });

            // 트래킹 클릭 이벤트
            $$(page.container).on('click', '.tracking-item', function(){
                Template7.module.map.clearTrackingLayer();

                var layer = Template7.module.map.getMap().getLayersByName('bikeTracking')[0];
                var id = $$(this).data('id');
                Template7.module.db.selectTrackingById(id, function(tracking) {
                    var lineFeature = new OpenLayers.Format.GML().read(tracking.gml);
                    var startFeature = new OpenLayers.Format.GML().read(tracking.start);
                    var endFeature = new OpenLayers.Format.GML().read(tracking.end);
                    lineFeature[0].attributes.gml = true;
                    layer.addFeatures([lineFeature[0], startFeature[0], endFeature[0]]);
                    Template7.module.map.getMap().zoomToExtent(lineFeature[0].geometry.getBounds());
                    myApp.showTab('#mapView');
                });
            });

            /**
             * 트래킹 결과 새로고침
             */
            function refreshTrackingResult() {
                Template7.module.db.selectTrackings(function(trackings) {
                    $$('#trackingListResult').children().remove();
                    var html = '';
                    if(trackings.length > 0) {
                        for(var i = 0, len = trackings.length; i < len; i++) {
                            var tracking = trackings[i];
                            var length = Math.round(tracking.length);

                            if(length > 999) {
                                length = (length / 1000) + 'km';
                            } else {
                                length += 'm';
                            }
                            tracking.length = length;

                            html += Template7.templates.trackingTemplate(tracking);
                        }
                        $$('#trackingListResult').append(html);
                        $$('#trackingListConteinr').show();
                        $$('#trackingEmpty').hide();
                    } else {
                        $$('#trackingEmpty').show();
                        $$('#trackingListConteinr').hide();
                    }
                });
            }
        });
    }

    /**
     * 다음 키워드로 장소검색 API를 이용하여 길찾기(출발지, 도착지) 자동완성 기능 구현
     */
    function initComponent() {
        var routeStartAutocomplete = getRouteAutocomplete('#txtStart', function(autocomplete, value){
            Template7.module.util.registRouteStart(value.title, {lon: value.longitude, lat: value.latitude});
            Template7.module.event.searchRoute(value.title);
        });
        var routeEndAutocomplete = getRouteAutocomplete('#txtEnd', function(autocomplete, value){
            Template7.module.util.registRouteEnd(value.title, {lon: value.longitude, lat: value.latitude});
            Template7.module.event.searchRoute(value.title);
        });

        var stroeSwiper = myApp.swiper('.store-swiper-container', {
            preloadImages: false,
            lazyLoading: true
        });

        // 착한가게 스크롤 뷰가 변경되면 발생하는 이벤트
        stroeSwiper.on('slideChangeStart', function(e){
            var map = Template7.module.map.getMap();
            var layer = map.getLayersByName('storeLayer')[0];
            var features = layer.features;
            var feature = features[$$('.store-swiper-container')[0].swiper.activeIndex];
            var geometry = feature.geometry;
            var lonlat = new OpenLayers.LonLat(geometry.x, geometry.y);
            var pixcel = map.getPixelFromLonLat(lonlat);
            pixcel = new OpenLayers.Pixel(pixcel.x, pixcel.y + 120);

            Template7.module.map.moveToLonLat(map.getLonLatFromPixel(pixcel), map.getZoom());

            if(feature.renderIntent !== 'select') {
                Template7.module.map.getMap().getControl('selectControl').select(feature);
            }

            for(var index in features) {
                if(feature !== features[index]) {
                    if(features[index].renderIntent === 'select') {
                        Template7.module.map.getMap().getControl('selectControl').unselect(features[index]);
                    }
                }
            }
        });

        function getRouteAutocomplete(id, onChange) {
            return myApp.autocomplete({
                input: id,
                openIn: 'dropdown',
                limit: 20,
                valueProperty: 'title',
                textProperty: 'title',
                source: function (autocomplete, query, render) {
                    var results = [];

                    if (query.length === 0) {
                        render(results);
                        return;
                    }

                    autocomplete.showPreloader();
                    Template7.module.rest.daumLocalSearch(query, function(data){
                        var items = data.channel.item;
                        items.forEach(function (value) {
                            if(value.address.indexOf('서울') >= 0) {
                                if (value.title.indexOf(query.toLowerCase()) >= 0) {
                                    results.push(value);
                                }
                            }
                        });
                        autocomplete.hidePreloader();
                        render(results);
                    });
                },
                onChange: onChange
            });
        }

        /**
         * 지도 -> 투어 검색 리스트를 초기화
         */
        function initTourSearch() {
            Template7.module.rest.selectTourList('search', function(tours){
                var tourResultHtml = '';
                for(var index in tours) {
                    var tour = tours[index];
                    var data = {
                        image: Framework7.globals.IMAGE_URL + tour.tourImageList[0].imageName,
                        lat: tour.y,
                        lon: tour.x,
                        title: tour.tourNm,
                        tel: tour.tourTel,
                        info: tour.tourInfo,
                        address: tour.tourAddr
                    };
                    tourResultHtml += Template7.templates['tourResultTemplate'](data);
                }
                $$('#tourSearchResult').find('ul').prepend(tourResultHtml);
            });
        }

        initTourSearch();
    }

    function initPage() {
        contentPageInit(myApp.views['contentView']);
        bikePageInit(myApp.views['bikeView']);
        tourPageInit(myApp.views['tourView']);
        settingPageInit(myApp.views['settingView']);

        function contentPageInit(page) {
            $$(page.container).on('page:back', '.page[data-page="myRouteIndex"]', function (e) {
                Template7.module.util.dataLabelInit();
            });
        }

        function tourPageInit(page) {

            // 공원 위치 클릭
            $$(page.container).on('click', '.parkLocation', function(){
                var x = $$(this).data('x');
                var y = $$(this).data('y');
                var title = $$(this).data('title');

                var lonlat = new OpenLayers.LonLat(x, y);
                Template7.module.map.moveTo(lonlat.transform('EPSG:4326', Template7.module.map.getMap().getProjection()), 18, title, {lon: x, lat: y});

                myApp.showTab('#mapView');
            });

            // 공원 길안내 클릭
            $$(page.container).on('click', '.parkRoute', function(){
                var x = parseFloat($$(this).data('x'));
                var y = parseFloat($$(this).data('y'));
                var title = $$(this).data('title');

                myApp.confirm(title + '까지 가는길을 검색하겠습니까?', function() {
                    Template7.module.rest.daumCoord2addr({lon: Framework7.globals.position.lon, lat: Framework7.globals.position.lat}, function(data) {
                        var start = {
                            y: Framework7.globals.position.lat,
                            x: Framework7.globals.position.lon,
                            name: data.old.name + ' (현재위치)'
                        };

                        var end = {
                            x: x,
                            y: y,
                            name: title + ' (공원)'
                        };

                        Template7.module.util.route(start, end, 'park', function(data) {
                            Template7.module.util.showBikePath({
                                sDistance : data.startDistance,
                                bDistance : data.bikeDistance,
                                eDistance : data.endDistance,
                                startPoint: start,
                                endPoint: end,
                                passList: data.passList || null
                            });
                            myApp.showTab('#mapView');
                        });
                    });
                })
            });
        }

        function bikePageInit(page) {
            var ptrContent = $$(page.container).find('.pull-to-refresh-content');

            ptrContent.on('refresh', function (e) {
                myApp.showPreloader('따릉이 정보를 갱신합니다.');

                Template7.module.util.updatePosition(function() {
                    var position = {
                        lon : Framework7.globals.position.lon,
                        lat : Framework7.globals.position.lat
                    };
                    Template7.module.util.refreshBikeContent(ptrContent, position, function() {
                        Template7.module.map.clearBikeDrawLayer();

                        myApp.pullToRefreshDone();
                        myApp.hidePreloader();
                    });
                });
            });
        }

        function settingPageInit(page) {

            $$(page.container).on('page:back', '.page[data-page="visitListIndex"]', function (e) {
                Template7.module.util.dataLabelInit();
            });

            $$(page.container).on('page:back', '.page[data-page="trackingListIndex"]', function (e) {
                Template7.module.util.dataLabelInit();
            });

            // 설정 -> 찜 목록 초기화
            $$(page.container).on('page:beforeanimation', '.page[data-page="visitListIndex"]', function (e) {
                // 결과 리스트 삭제
                $$('#visitListResult').children().remove();
                Template7.module.db.selectVisits(function(visits) {
                    if(visits.length > 0) {
                        myApp.showPreloader('찜 목록을 불러옵니다.');
                        Template7.module.rest.selectTourList('all', function(tours) {
                            var tourResultHtml = '';
                            for(var visits_index = 0, visits_len = visits.length; visits_index < visits_len; visits_index++) {
                                var visit = visits[visits_index];
                                for(var tour_index = 0, tour_len = tours.length; tour_index < tour_len; tour_index++) {
                                    var tour = tours[tour_index];
                                    if(parseInt(tour.tourId) === visit.id) {
                                        var images = [];

                                        for(var index in tour.tourImageList) {
                                            var tourImage = tour.tourImageList[index];
                                            images.push(Framework7.globals.IMAGE_URL + tourImage.imageName);
                                        }

                                        var context = {
                                            'id': tour.tourId,
                                            'name': tour.tourNm,
                                            'tel': tour.tourTel,
                                            'address': tour.tourAddr,
                                            'info': tour.tourInfo,
                                            'x': tour.x,
                                            'y': tour.y,
                                            "images": images,
                                            'title': '찜 목록'
                                        };

                                        context = JSON.stringify(context);
                                        var data = {
                                            image: images[0],
                                            name: tour.tourNm,
                                            address: tour.tourAddr,
                                            context: context,
                                            lon: tour.x,
                                            lat: tour.y,
                                            registDt: visit.regist_dt_str
                                        };

                                        tourResultHtml += Template7.templates.tourListTemplate(data);
                                    }
                                }
                            }
                            $$('#visitListResult').append(tourResultHtml);
                            myApp.hidePreloader();
                        });
                    } else {
                        $$('#visitEmpty').show();
                    }
                });
            });

            // 설정 -> 트래킹 목록 초기화
            $$(page.container).on('page:beforeanimation', '.page[data-page="trackingListIndex"]', function (e) {
                // 결과 리스트 삭제
                $$('#trackingListResult').children().remove();
                Template7.module.db.selectTrackings(function(trackings) {
                    var html = '';
                    if(trackings.length > 0) {
                        for(var i = 0, len = trackings.length; i < len; i++) {
                            var tracking = trackings[i];
                            var length = Math.round(tracking.length);

                            if(length > 999) {
                                length = (length / 1000) + 'km';
                            } else {
                                length += 'm';
                            }
                            tracking.length = length;

                            html += Template7.templates.trackingTemplate(tracking);
                        }
                        $$('#trackingListResult').append(html);
                        $$('#trackingListConteinr').show();
                    } else {
                        $$('#trackingEmpty').show();
                    }
                });
            });
        }
    }
};