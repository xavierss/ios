Template7.module.event = (function (app) {
    var mapModule;
    var restModule;
    var utilModule;

    return {
        init: function () {
            console.log('event module init');

            mapModule = Template7.module.map;
            restModule = Template7.module.rest;
            utilModule = Template7.module.util;

            Template7.module.event.bind();
        },

        locationClick: function($$element) {
            if($$element.hasClass('active')) {
                var isTrackingChecked = $$('#checkTracking').is(':checked');
                if(isTrackingChecked) {
                    myApp.confirm('현재 위치를 추적중입니다. 위치추적을 종료하시겠습니까?',function() {
                        Template7.module.util.clearWatchPosition();
                        $$('#checkTracking').prop('checked', false);

                        Template7.module.util.animationMarkerStop();
                        mapModule.clearLocationLayer();

                        $$element.removeClass('color-red');
                        $$element.css({'backgroundColor' : 'white'});
                        $$element.removeClass('active');

                        $$element.find('i').removeClass('color-white');
                        $$element.find('i').addClass('color-pink');

                        // 트래킹 기능도 같이 종료한다.
                        var $$icon = $$('#btnBikeTracking i');
                        var bikeTrackingStart = $$icon.hasClass('ion-stop');
                        if(bikeTrackingStart) {
                            Template7.module.util.endBikeTracking();
                            $$icon.addClass('ion-play');
                            $$icon.removeClass('ion-stop');
                        }
                    });
                } else {
                    Template7.module.util.animationMarkerStop();
                    mapModule.clearLocationLayer();
                    $$element.removeClass('color-red');
                    $$element.css({'backgroundColor' : 'white'});
                    $$element.removeClass('active');

                    $$element.find('i').removeClass('color-white');
                    $$element.find('i').addClass('color-pink');
                }
            } else {
                myApp.showPreloader('현재 위치를 확인합니다.');
                Template7.module.util.updatePosition(function(){
                    var point = new OpenLayers.Geometry.Point(Framework7.globals.position.lon, Framework7.globals.position.lat);
                    Template7.module.map.moveLocation(point.transform('EPSG:4326', Template7.module.map.getMap().getProjection()));
                    myApp.hidePreloader();
                });

                $$element.css({'backgroundColor' : ''});
                $$element.addClass('color-red');
                $$element.addClass('active');
                $$element.find('i').removeClass('color-pink');
            }
        },

        /**
         * 이벤트 적용
         */
        bind: function () {
            /**
             * 공통 이벤트를 적용한다.
             */
            function commonEvent() {
                $$('#tabSettingView, #tabContentView, #tabTourView').on('click', function(){
                    var active = $$(this).hasClass('active');
                    if(active) {
                        var view = myApp.getCurrentView();
                        view.back();

                        /*if(view.history.length > 2) {
                            view.router.back({url: view.history[0], force: true, ignoreCache: false});
                        } else {
                            view.back();
                        }*/
                    }
                });

                // 맵뷰를 탭
                $$('#mapView').on('tab:show', function () {
                    $$('.map-speed-dial').show();
                });

                // 컨텐츠뷰를 탭
                $$('#contentView').on('tab:show', function () {
                    $$('.map-speed-dial').hide();
                    Template7.module.util.dataLabelInit();
                });

                // 따릉이 뷰가 처음 로드 되면 따릉이 데이터를 가져온다.
                $$('#bikeView').on('tab:show', function () {
                    $$('.map-speed-dial').hide();
                    var isInit = $$(this).data('init');
                    if(isInit) {
                        if($$('.bike-item').length < 1) {
                            var ptrContent = $$(myApp.getCurrentView().container).find('.pull-to-refresh-content');
                            myApp.showPreloader('따릉이 정보를 갱신합니다.');

                            var position = {
                                lon: Framework7.globals.position.lon,
                                lat: Framework7.globals.position.lat
                            };

                            Template7.module.util.refreshBikeContent(ptrContent, position, function() {
                                Template7.module.map.clearBikeDrawLayer();
                                myApp.hidePreloader();
                            });
                        }
                        $$(this).data('init', false);
                    }
                });

                // 관광명소 뷰가 로드 되면 실행한다.
                $$('#tourView').on('tab:show', function () {
                    var isInit = $$(this).data('init');
                    if(isInit) {
                        myApp.showPreloader('관광명소 정보를 불러옵니다.');
                        Template7.module.rest.selectTourList('all', function(tours){
                            var tourResultHtml = '';
                            for(var index in tours) {
                                var tour = tours[index];
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
                                    'title': '관광명소'
                                };

                                context = JSON.stringify(context);
                                var data = {
                                    image: images[0],
                                    name: tour.tourNm,
                                    address: tour.tourAddr,
                                    lon: tour.x,
                                    lat: tour.y,
                                    context: context
                                };

                                tourResultHtml += Template7.templates.tourListTemplate(data);
                            }
                            $$('#tourListResult').append(tourResultHtml);
                            myApp.hidePreloader();
                        });
                        $$(this).data('init', false);
                    }
                    $$('.map-speed-dial').hide();
                });

                // 셋팅 뷰를 탭
                $$('#settingView').on('tab:show', function () {
                    $$('.map-speed-dial').hide();
                    Template7.module.util.dataLabelInit();
                });

                // 관광명소 리스트 위치 클릭
                $$('#tourListResult, #settingView').on('click', '.tourLocation', function(){
                    var lon = $$(this).data('lon');
                    var lat = $$(this).data('lat');
                    var name = $$(this).data('name');

                    var lonlat = new OpenLayers.LonLat(lon, lat);
                    Template7.module.map.moveTo(lonlat.transform('EPSG:4326', Template7.module.map.getMap().getProjection()), 18, name, {lon: lon, lat: lat});

                    myApp.showTab('#mapView');
                });

                // 관광명소 리스트 길 안내 클릭
                $$('#tourListResult, #settingView').on('click', '.tourRoute', function(){
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

                // 알람 설정 버튼
                $$('#btnBikeTracking').on('click', function() {
                    var $$icon = $$(this).find('i');
                    var play = $$icon.hasClass('ion-play');

                    if(play) {

                        if(!$$('#checkTracking').is(':checked')) {
                            myApp.alert('트래킹은 내가 지나온 길을 기록해줍니다. 시작하려면 오른쪽 상단에 있는 버튼(위치추적)을 켜주세요.');
                            return;
                        }

                        myApp.confirm('트래킹을 시작하시겠습니까?', function() {
                            Template7.module.util.startBikeTracking();
                            $$icon.removeClass('ion-play');
                            $$icon.addClass('ion-stop');
                        });
                    } else {
                        myApp.confirm('트래킹을 종료하시겠습니까?', function() {
                            Template7.module.util.endBikeTracking();
                            $$icon.addClass('ion-play');
                            $$icon.removeClass('ion-stop');
                        });
                    }
                });

                // 목적지 검색 버튼
                $$('#btnDestinationSearch').on('click', function() {
                    myApp.popup('.destination-popup');
                });

                // 지도 초기화
                $$('#btnCleanMap').on('click', function() {
                    myApp.confirm('지도에 그려진 정보를 지우시겠습니까?', function(){
                       Template7.module.map.cleanMap();
                    });
                });

                // 현재 위치 버튼
                $$('#btnCurrentLocation').on('click', function (e) {
                    Template7.module.event.locationClick($$(this));
                });

                // 맵 다이얼 버튼을 클릭하면 오버레이를 숨긴다.
                $$('.speed-dial-buttons a').on('click', function (e) {
                    Template7.module.util.hideMapDial();
                });

                // 맵뷰에서 다이얼이 오픈 될때 오버레이를 보여준다.
                $$('#mapDial').on('click', function() {
                    var isOpen = $$('.map-speed-dial').hasClass('speed-dial-opened');
                    isOpen ? $$('#mapOverlay').hide() : $$('#mapOverlay').show();
                });

                // 맵뷰에서 오버레이를 클릭하면 다이얼을 숨긴다.
                $$('#mapOverlay').on('click', function() {
                    Template7.module.util.hideMapDial();
                });

                // 엔터키 입력시 트리거 발생
                $$('.enter-key-trigger').on('keyup', function (e) {
                    if (e.keyCode === Template7.module.event.ENTER_KEY) {
                        var target = $$(this).data('for');
                        $$('#' + target).click();
                        $$(this).blur();
                    }
                });

                // 관광명소 도착지 선택 이벤트
                $$('#tourSearchResult').on('click', '.destination-item', function(){
                    var $this = $$(this);
                    var lon = $this.data('lon');
                    var lat = $this.data('lat');
                    var title = $this.data('title');

                    myApp.confirm(title + '까지 가는길을 검색하겠습니까?', function () {
                        myApp.closeModal('.destination-popup');

                        Template7.module.rest.daumCoord2addr({lon: Framework7.globals.position.lon, lat: Framework7.globals.position.lat}, function(data) {
                            var start = {
                                y: Framework7.globals.position.lat,
                                x: Framework7.globals.position.lon,
                                name: data.old.name + ' (현재위치)'
                            };

                            var end = {
                                y: lat,
                                x: lon,
                                name: title + ' (관광명소)'
                            };

                            Template7.module.util.route(start, end, 'tour', function(data){
                                Template7.module.util.showBikePath({
                                    sDistance : data.startDistance,
                                    bDistance : data.bikeDistance,
                                    eDistance : data.endDistance,
                                    startPoint: start,
                                    endPoint: end,
                                    passList: data.passList || null
                                    // descriptions: data.description
                                });
                            });
                        });
                    });
                });

                $$('#btnCloseStorePopup').on('click', function() {
                    var map = Template7.module.map.getMap();
                    var layer = map.getLayersByName('storeLayer')[0];
                    var features = layer.features;

                    for(var index in features) {
                        if(features[index].renderIntent === 'select') {
                            Template7.module.map.getMap().getControl('selectControl').unselect(features[index]);
                        }
                    }

                    if($$('.picker-modal.modal-in').css('display') !== 'none') {
                        myApp.closeModal('.picker-modal', false);
                    }
                });
            }

            /**
             * 지도 화면 이벤트를 적용한다.
             */
            function mapViewEvent() {
                $$('#btnTipClose').on('click', function(){
                   $$('#tipPanel').hide();
                });

                // 착한 가게 업소 정보
                $$('.picker-info').on('picker:open', function () {
                    $$('.store-swiper-container')[0].swiper.update();
                });

                $$('.picker-info').on('picker:close', function () {
                    var map = Template7.module.map.getMap();
                    var layer = map.getLayersByName('storeLayer')[0];
                    var features = layer.features;

                    for(var index in features) {
                        var feature = features[index];
                        if(feature.renderIntent === 'select') {
                            Template7.module.map.getMap().getControl('selectControl').unselect(feature);
                        }
                    }
                });

                $$('#btnLeftMenu').on('click', function(){
                    if($$('.picker-modal.modal-in').css('display') !== 'none') {
                        myApp.closeModal('.picker-modal', false);
                    }
                });

                $$('#nearStoreList').on('click', '.near-store', function(){
                    var featureId = $$(this).data('feature-id');
                    var map = Template7.module.map.getMap();
                    var layer = map.getLayersByName('storeLayer')[0];
                    var features = layer.features;
                    var feature = null;

                    for(var index in features) {
                        if(features[index].attributes.index === featureId) {
                            feature = features[index];
                            break;
                        }
                    }

                    if(feature) {
                        myApp.closePanel();
                        var geometry = feature.geometry;
                        var lonlat = new OpenLayers.LonLat(geometry.x, geometry.y - 60);
                        var pixcel = map.getPixelFromLonLat(lonlat);
                        Template7.module.map.moveToLonLat(map.getLonLatFromPixel(pixcel), 18);

                        if($$('.picker-modal').css('display') === 'none') {
                            myApp.pickerModal('.picker-info', false);
                        }
                        $$('.store-swiper-container')[0].swiper.slideTo(featureId);

                        Template7.module.map.getMap().getControl('selectControl').select(feature);
                    }
                });

                $$('#btnZoomIn').on('click', function(){
                    Template7.module.map.getMap().zoomIn();
                });

                $$('#btnZoomOut').on('click', function(){
                    Template7.module.map.getMap().zoomOut();
                });

                // 왼쪽 패널이 열릴때 맵 오버레이 show
                $$('.panel-left').on('panel:open', function () {
                    $$('#mapOverlay').show();
                });

                // 왼쪽 패널이 닫힐때 맵 오버레이 hide
                $$('.panel-left').on('panel:close', function () {
                    $$('#mapOverlay').hide();
                });

                // 왼쪽메뉴 경로 이벤트(시작~끝)
                $$('#routePanel').on('click', '.btnRouteStart, .btnRouteEnd', function(){
                    var lon = $$(this).data('lon');
                    var lat = $$(this).data('lat');

                    var point = new OpenLayers.LonLat(lon, lat).transform('EPSG:4326', 'EPSG:900913');

                    Template7.module.map.moveToLonLat(point, 18);
                    myApp.closePanel();
                });

                // 트래킹 체크박스
                $$('#checkTracking').on('change', function() {
                    var checked = $$(this).is(':checked');

                    if(!checked) {
                        var $$icon = $$('#btnBikeTracking i');
                        var bikeTrackingStart = $$icon.hasClass('ion-stop');
                        if(bikeTrackingStart) {
                            myApp.confirm('트래킹 기능이 켜져 있습니다. 트래킹을 종료하시겠습니까?', function() {
                                Template7.module.util.tracking(checked);

                                // 트래킹 기능도 같이 종료한다.
                                Template7.module.util.endBikeTracking();
                                $$icon.addClass('ion-play');
                                $$icon.removeClass('ion-stop');

                            }, function() {
                                $$('#checkTracking').prop('checked', true);
                            });
                        } else {
                            Template7.module.util.tracking(checked);
                        }
                    } else {
                        Template7.module.util.tracking(checked);
                    }
                });
            }

            /**
             * 길찾기 화면 이벤트를 적용한다.
             */
            function contentViewEvent() {
                // 길찾기 출발지
                $$('#btnStart').on('click', function (e) {
                    Template7.module.event.searchRoute($$('#txtStart').val());
                });

                // 길찾기 도착지
                $$('#btnEnd').on('click', function (e) {
                    Template7.module.event.searchRoute($$('#txtEnd').val());
                });

                // 길찾기
                $$('#btnRouteSearch').on('click', function (e) {
                    var start = {
                        y: Framework7.globals.routeStart['lat'],
                        x: Framework7.globals.routeStart['lon'],
                        name: Framework7.globals.routeStart['title'] + ' (출발지)'
                    };

                    var end = {
                        y: Framework7.globals.routeEnd['lat'],
                        x: Framework7.globals.routeEnd['lon'],
                        name: Framework7.globals.routeEnd['title'] + ' (도착지)'
                    };

                    var startName = $$('#txtStart').val().trim();
                    var endName = $$('#txtEnd').val().trim();

                    if(!startName) {
                        myApp.alert('출발지를 선택하지 않으셨습니다.', '');
                        return;
                    }
                    if(!endName) {
                        myApp.alert('도착지를 선택하지 않으셨습니다.', '');
                        return;
                    }
                    if(startName === endName) {
                        myApp.alert('출발지와 도착지가 동일하므로 길찾기를 할 수 없습니다.', '');
                        return;
                    }

                    Template7.module.util.route(start, end, 'nomal', function(data){
                        Template7.module.util.showBikePath({
                            sDistance : data.startDistance,
                            bDistance : data.bikeDistance,
                            eDistance : data.endDistance,
                            startPoint: start,
                            endPoint: end,
                            passList: data.passList || null
                        });
                    });
                });

                // 길찾기 출발지
                $$('#routeResult').on('click', '.route-start', function(e){
                    var $$row = $$(this).parent().parent();
                    var lon = $$row.data('lon');
                    var lat = $$row.data('lat');
                    var title = $$row.data('title');

                    utilModule.registRouteStart(title, {lon: lon, lat: lat});

                    return e.stopImmediatePropagation();
                });

                // 길찾기 도착지
                $$('#routeResult').on('click', '.route-end', function(e){
                    var $$row = $$(this).parent().parent();
                    var lon = $$row.data('lon');
                    var lat = $$row.data('lat');
                    var title = $$row.data('title');

                    utilModule.registRouteEnd(title, {lon: lon, lat: lat});

                    return e.stopImmediatePropagation();
                });

                // 길찾기 위치보기
                $$('#routeResult').on('click', '.route-item', function(e){
                    var $$this = $$(this);
                    var lon = $$this.data('lon');
                    var lat = $$this.data('lat');
                    var title = $$this.data('title');
                    var lonlat = new OpenLayers.LonLat(lon, lat);
                    Template7.module.map.moveTo(lonlat.transform('EPSG:4326', Template7.module.map.getMap().getProjection()), 18, title, {lon: lon, lat: lat});

                    myApp.showTab('#mapView');

                    return false;
                });

                // 길찾기 초기화
                $$('#btnRouteReset').on('click', function (e) {
                    myApp.confirm('초기화 하시겠습니까?', '', function () {
                        utilModule.clearRoute();
                    });
                });

                // 길찾기 출발지 현재 위치로 지정
                $$('#btnStartMyLocation').on('click', function(e){
                    restModule.daumCoord2addr(Framework7.globals.position, function (data) {
                        utilModule.registRouteStart(data.old.name, {lon: Framework7.globals.position.lon, lat: Framework7.globals.position.lat});
                    });
                });

                // 길찾기 도착지 현재 위치로 지정
                $$('#btnEndMyLocation').on('click', function(e){
                    restModule.daumCoord2addr(Framework7.globals.position, function (data) {
                        utilModule.registRouteEnd(data.old.name, {lon: Framework7.globals.position.lon, lat: Framework7.globals.position.lat});
                    });
                });
            }

            /**
             * 따릉이 화면 이벤트를 적용한다.
             */
            function bikeViewEvent() {
                // 따릉이 새로고침
                $$('#btnBikeRefresh').on('click', function(e){
                    var ptrContent = $$(myApp.getCurrentView().container).find('.pull-to-refresh-content');
                    myApp.showPreloader('따릉이 정보를 갱신합니다.');

                    Template7.module.util.updatePosition(function() {
                        var position = {
                            lon: Framework7.globals.position.lon,
                            lat: Framework7.globals.position.lat
                        };

                        utilModule.refreshBikeContent(ptrContent, position, function() {
                            Template7.module.map.clearBikeDrawLayer();
                            myApp.hidePreloader();
                        });
                    });
                });

                /**
                 * 따릉이 길찾기
                 */
                $$('#bikeResult').on('click','.bike-item', function(e){
                    $$('.bike-item').removeClass('rsc');

                    var $this = $$(this);
                    var start = {
                        y: Framework7.globals.position.lat,
                        x: Framework7.globals.position.lon,
                        name: 'start'
                    };

                    var end = {
                        y: $this.data('lat'),
                        x: $this.data('lon'),
                        name: $this.find('.item-title').text()
                    };

                    Template7.module.rest.daumCoord2addr({lon: start.x, lat: start.y}, function(data) {
                        var routeStart = {
                            lon: start.x,
                            lat: start.y,
                            name: data.old.name + ' (현재위치)'
                        };

                        Template7.module.rest.daumCoord2addr({lon: end.x, lat: end.y}, function(data) {
                            var routeEnd = {
                                lon: end.x,
                                lat: end.y,
                                name: end.name + ' (따릉이 대여소)'
                            };

                            // 따릉이 길찾기 조회시에도 최근 길찾기 목록에 넣어준다.
                            Template7.module.db.insertRoute({
                                start: routeStart,
                                end: routeEnd,
                                route_type: 'bike'
                            });
                        });
                    });

                    myApp.showPreloader('조회중입니다.');
                    Template7.module.util.findDirections(start, end, null, function(data) {
                        myApp.hidePreloader();

                        if(data.code === Template7.module.rest.SUCCESS_CODE) {
                            // 착한업소 레이어를 삭제한다.
                            Template7.module.map.clearStoreLayer();
                            Template7.module.map.clearBikeDrawLayer();

                            $this.addClass('rsc');
                            myApp.showTab('#mapView');

                            Template7.module.util.findRouteStore(data.routeLine);

                            Template7.module.util.showBikePath({
                                sDistance : data.startDistance,
                                bDistance : data.bikeDistance,
                                eDistance : data.endDistance,
                                startPoint: start,
                                endPoint: end,
                                passList: data.passList || null
                            });
                        }
                    });
                });

            }

            function tourViewEvent(page) {
                $$('#tabParkList').on('tab:show', function() {
                    myApp.showPreloader('공원 데이터를 조회중입니다.');
                    Template7.module.rest.selectParkList(function(parks, code) {
                        $$('#parkResult').children().remove();
                        if(code === Template7.module.rest.SUCCESS_CODE) {
                            var parkTemplate = '';
                            for(var index in parks) {
                                var park = parks[index];
                                park.imageUrl = Framework7.globals.IMAGE_URL + 'park/' + park.parkImageNm;
                                parkTemplate += Template7.templates.parkListTemplate(park);
                            }
                            $$('#parkResult').append(parkTemplate);
                        }
                        myApp.hidePreloader();
                    });
                });
            }

            function settingViewEvent() {
                $$('#btnReset').on('click', function(){
                    myApp.confirm('앱 데이터를 초기화 하시면 찜 목록, 최근이용 목록, 트래킹 데이터가 초기화 됩니다. 초기화 하시겠습니까?', function(){
                        Template7.module.db.deleteRoutes();
                        Template7.module.db.deleteTrackings();
                        Template7.module.db.deleteVisits();
                        // Template7.module.db.deleteAppInfo();

                        Template7.module.util.dataLabelInit();
                    });
                });
            }

            $$('#btnBikeDraw').on('click', function(){
                Template7.module.map.clearBikeDrawLayer();
                Template7.module.map.bikeDraw();
                myApp.showTab('#mapView');
            });

            commonEvent(); // 공통 이벤트 등록
            mapViewEvent(); // 지도 화면 이벤트 등록
            contentViewEvent(); // 길찾기 화면 이벤트 등록
            bikeViewEvent(); // 따릉이 화면 이벤트 등록
            tourViewEvent(); // 관광명소 화면 이벤트 등록
            settingViewEvent(); // 셋팅 화면 이벤트 등록
        },

        /**
         * 다음 검색
         *
         * @param query 검색 단어
         */
        searchRoute: function (query) {
            utilModule.clearRouteResult();

            if (query) {
                restModule.daumLocalSearch(query, function (data) {
                    var items = data.channel.item;
                    var routeHTMl = '';
                    items.forEach(function (value) {
                        if(value.address.indexOf('서울') >= 0) {
                            value.imageUrl = value.imageUrl || './images/noimg.png';
                            routeHTMl += Template7.templates.routeResultTemplate(value);
                        }
                    });

                    if(routeHTMl) {
                        $$('#routeResult ul').append(routeHTMl);
                        $$('.route-empty-result').hide();
                    }
                });
            }
        }
    }
}(myApp));

Template7.module.event.ENTER_KEY = 13;