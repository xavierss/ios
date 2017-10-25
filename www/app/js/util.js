Template7.module.util = (function (app) {
    var watchId = null;
    var animationMarkerIntervalId = null;
    var bikeTrackingIntervalId = null;
    var bikeTrackingPoints = [];
    var stopwatch = null;

    var geolocationOptions = {
        maximumAge: 500,   // 갱신주기(1/1000초 단위)
        timeout: 10000,     // 타임아웃(1/1000초 단위)
        enableHighAccuracy: true // 높은 정확도 사용
    };

    return {

        /**
         * util 모듈 초기화 함수 (지금은 딱히 하는게 없음..)
         */
        init : function() {
            console.log('util module init');
        },

        /**
         * 길찾기 결과 화면 초기화
         */
        clearRouteResult: function() {
            $$('.route-empty-result').show();
            $$('#routeResult ul li[class="route-result"]').remove();
        },

        /**
         * 길찾기 글로벌 변수, 출발지, 도착지 텍스트 초기화
         */
        clearRoute: function() {
            $$('#txtStart').val('');
            $$('#txtEnd').val('');

            Framework7.globals.routeStart = {};
            Framework7.globals.routeEnd = {};

            Template7.module.util.clearRouteResult();
        },

        /**
         * 내 위치에서 가장 가까운 따릉이 20개를 조회하여 화면에 갱신함
         *
         * @param page Framework7 Page
         * @param position 좌표(lon, lat)
         * @param callback 콜백함수
         */
        refreshBikeContent: function(page, position, callback) {
            $$(page).find('li').remove();

            Template7.module.rest.nearBike(position, function(bikes, code){

                if(code !== Template7.module.rest.FAIL_CODE) {
                    var bikeTemplate = '';

                    for(var index in bikes) {
                        var bike = bikes[index];
                        var distance = bike['distance'];
                        var time = '(도보 ' + Math.round(distance / 2000 * 60) + '분)';
                        bike['distance'] = (distance > 999 ? '약 ' + (distance / 1000) + 'km' + ' ' + time : '약 ' + distance + 'm' + ' ' + time);
                        bikeTemplate += Template7.templates['bikeTemplate'](bike);
                    }
                    page.find('ul').prepend(bikeTemplate);
                }

                typeof callback === 'function' && callback();
            });
        },

        /**
         * 현재 위치를 조회한다.
         *
         * @param callback 콜백함수
         */
        getCurrentPosition: function(callback) {
            navigator.geolocation.getCurrentPosition(function(position) {
                typeof callback === 'function' && callback(position);
            }, function(error){
                typeof callback === 'function' && callback(0, error);
            }, geolocationOptions);
        },

        /**
         * 현재 위치를 트래킹한다.
         * @param callback
         */
        startWatchPosition: function(callback) {
            watchId = navigator.geolocation.watchPosition(function(position) {
                Framework7.globals.position = {
                    lon: position.coords.longitude,
                    lat: position.coords.latitude
                };

                /*var myPoint = new OpenLayers.Geometry.Point(Framework7.globals.position.lon, Framework7.globals.position.lat).transform('EPSG:4326', 'EPSG:900913');

                if(!Template7.module.map.getMap().getExtent().containsLonLat(new OpenLayers.LonLat(myPoint.x, myPoint.y))) {
                    Template7.module.map.moveLocation(myPoint);
                }*/

                /*var baseLayer = Template7.module.map.getMap().baseLayer;
                baseLayer.events.register('moveend', baseLayer, Template7.module.util.moveEvent);*/

                typeof callback === 'function' && callback(position);
            }, function(error){
                // timeout에 대해서만 처리하도록 변경
                if(error.code === 3) {
                    console.log(watchId);
                    Template7.module.util.clearWatchPosition();
                    var tracking = $$('#checkTracking').is(':checked');
                    if(tracking) {
                        Template7.module.util.startWatchPosition(callback);
                    }
                }
                // typeof callback === 'function' && callback(0, error);
            }, geolocationOptions);
        },

        /**
         *
         * @param e
         */
        moveEvent: function(e) {
            console.log(e);
            var $$checkTracking = $$('#checkTracking');
            var isTracking = $$checkTracking.is(':checked');
            if(isTracking) {
                if(!e.zoomChanged) {
                    $$checkTracking.prop('checked', false);
                    Template7.module.util.tracking($$checkTracking.is(':checked'))
                }
            }
        },

        /**
         * 위치 트래킹을 종료한다.
         */
        clearWatchPosition: function() {
            navigator.geolocation.clearWatch(watchId);
            var layer = Template7.module.map.getMap().getLayersByName('locationLayer')[0];
            var radius = layer.features[1];

            if(radius) {
                layer.removeFeatures([radius]);
            }

            /*var baseLayer = Template7.module.map.getMap().baseLayer;
            baseLayer.events.unregister('moveend', baseLayer, Template7.module.util.moveEvent);*/
        },

        /**
         * 받아온 현재 위치로 글로벌 영역에 저장. 위치를 찾지 못했을 경우 지금은 서울시청이 기본 위치
         *
         * @param callback 콜백함수
         */
        updatePosition: function(callback) {
            Template7.module.util.getCurrentPosition(function(position, message){
                if(message) {
                    console.log(message);
                    // myApp.alert('위치정보를 가져올수 없습니다.', '알림');

                    // 위치를 못 가져왔을경우 기본위치 (서울시청)
                    Framework7.globals.position = {
                        lon: 126.978657298739,
                        lat: 37.56682663199102
                    }
                } else {
                    Framework7.globals.position = {
                        lon: position.coords.longitude,
                        lat: position.coords.latitude
                    }
                }

                // 따릉이 위치 텍스트 변경
                Template7.module.rest.daumCoord2addr(Framework7.globals.position, function(data){
                    Template7.module.util.bikeLocationChange(data.old.name);
                });

                typeof callback === 'function' && callback();
            });
        },

        /**
         * 따릉이 위치텍스트를 변경
         *
         * @param locationAddress 주소
         */
        bikeLocationChange: function(locationAddress) {
            $$(myApp.views['bikeView'].container).find('#txtCurrentLocation').text(locationAddress);
        },

        /**
         * 길찾기 출발지 데이터를 글로벌 영역에 저장
         *
         * @param title 제목
         * @param position 좌표(lon, lat)
         */
        registRouteStart: function(title, position) {
            var routeStart = Framework7.globals.routeStart;

            if(routeStart.lon || routeStart.lat) {
                myApp.confirm('출발지를 이미 선택하셨습니다. <br/>"'+ title +'" 을 출발지로 변경하시겠습니까?', '', function(e){
                    Template7.module.util.setGlobalsRouteStart({title: title, position: position});
                    Template7.module.util.pageTop($$(".page-content", myApp.getCurrentView().container));
                });
            } else {
                myApp.confirm('"' + title + '"' + ' 을 출발지로 선택하시겠습니까?', '', function(e){
                    Template7.module.util.setGlobalsRouteStart({title: title, position: position});
                    Template7.module.util.pageTop($$(".page-content", myApp.getCurrentView().container));
                });
            }
        },

        /**
         * 길찾기 도착지 데이터를 글로벌 영역에 저장
         *
         * @param title 제목
         * @param position 좌표(lon, lat)
         */
        registRouteEnd: function(title, position) {
            var routeEnd = Framework7.globals.routeEnd;

            if(routeEnd.lon || routeEnd.lat) {
                myApp.confirm('도착지를 이미 선택하셨습니다. <br/>"'+ title +'" 을 도착지로 변경하시겠습니까?', '', function(e){
                    Template7.module.util.setGlobalsRouteEnd({title: title, position: position});
                    Template7.module.util.pageTop($$(".page-content", myApp.getCurrentView().container));
                });
            } else {
                myApp.confirm('"' + title + '"' + ' 을 도착지로 선택하시겠습니까?', '', function(e) {
                    Template7.module.util.setGlobalsRouteEnd({title: title, position: position});
                    Template7.module.util.pageTop($$(".page-content", myApp.getCurrentView().container));
                });
            }
        },

        /**
         *
         * @param info
         */
        setGlobalsRouteStart: function(info) {
            $$('#txtStart').val(info.title);
            Framework7.globals.routeStart['lon'] = info.position.lon;
            Framework7.globals.routeStart['lat'] = info.position.lat;
            Framework7.globals.routeStart['title'] = info.title;
        },

        /**
         *
         * @param info
         */
        setGlobalsRouteEnd: function(info) {
            $$('#txtEnd').val(info.title);
            Framework7.globals.routeEnd['lon'] = info.position.lon;
            Framework7.globals.routeEnd['lat'] = info.position.lat;
            Framework7.globals.routeEnd['title'] = info.title;
        },

        /**
         * 출발지와 도착지를 가지고 길찾기를 조회한다.
         * 필요에따라 경유지(passList) 를 포함할 수 있다.
         *
         * @param start 출발지 좌표(x, y)
         * @param end 도착지 좌표(x, y)
         * @param passList 경유지
         * @param callback 콜백함수
         */
        findDirections: function(start, end, passList, callback) {
            // 길찾기 벡터레이어 초기화
            Template7.module.map.clearRouteLayer();

            var params = {
                startName: start.name,
                startX: start.x,
                startY: start.y,
                endName: end.name,
                endX: end.x,
                endY: end.y,
                passList: passList
            };

            Template7.module.rest.route(params, function(xml, code){
                if(code === Template7.module.rest.SUCCESS_CODE) {
                    var format = new OpenLayers.Format.KML();
                    var routeFeatures = format.read(xml);
                    var startGeometry = routeFeatures[0].geometry;
                    var endGeometry = routeFeatures[routeFeatures.length - 1].geometry;

                    var points = [],
                        lines = [],
                        startLines = [], // 출발 ~ 대여
                        endLines = [], // 반납 ~ 도착
                        bikeLines = [], // 대여 ~ 반납
                        lineString = [], // 출발 ~ 도착
                        distance = 0,
                        bikeDistance = 0,
                        startDistance = 0,
                        endDistance = 0,
                        routeBounds,
                        routeLine,
                        startPoint,
                        endPoint,
                        description = [];

                    var isWaypoint = false; // 경유지

                    for(var index in routeFeatures) {
                        var feature = routeFeatures[index];

                        if(feature.geometry instanceof OpenLayers.Geometry.Point) {

                            // 일반포인트를 넣으려면 여기를 수정하시오.
                            if(feature.attributes.pointType !== 'GP') {
                                points.push(feature);
                            }

                            description.push(feature.attributes.description);

                            // 경유지를 체크하기위한 부분
                            if(feature.attributes.pointType === 'PP1') {
                                startDistance = distance;
                                startLines = lineString.slice();
                                isWaypoint = true;
                            } else if((feature.attributes.pointType === 'PP2') ) {
                                isWaypoint = false;
                            }
                        } else {
                            distance += parseInt(feature.data.distance);
                            lines.push(feature);
                            lineString.push(feature.geometry);

                            if(isWaypoint) {
                                bikeLines.push(feature.geometry);
                                bikeDistance += parseInt(feature.data.distance);
                                feature.attributes.roadType = 'bike';
                                feature.data.roadType = 'bike';
                            }
                        }
                    }

                    endDistance = distance - ( startDistance + bikeDistance );
                    endLines = lineString.slice(bikeLines.length + startLines.length);

                    // 착한업소 찾기 위한 멀티라인
                    var multiLineString = new OpenLayers.Geometry.MultiLineString(lineString);

                    var polygon = new OpenLayers.Geometry.Polygon([new OpenLayers.Geometry.LinearRing([
                        new OpenLayers.Geometry.Point(startGeometry.x, startGeometry.y),
                        new OpenLayers.Geometry.Point(startGeometry.x, endGeometry.y),
                        new OpenLayers.Geometry.Point(endGeometry.x, endGeometry.y),
                        new OpenLayers.Geometry.Point(endGeometry.x, startGeometry.y)
                    ])]);

                    var wktFormat = new OpenLayers.Format.WKT();
                    routeBounds = wktFormat.write(new OpenLayers.Feature.Vector(polygon));
                    routeLine = wktFormat.write(new OpenLayers.Feature.Vector(multiLineString));
                    startPoint = wktFormat.write(new OpenLayers.Feature.Vector(startGeometry));
                    endPoint = wktFormat.write(new OpenLayers.Feature.Vector(endGeometry));

                    Template7.module.map.getMap().zoomToExtent(polygon.getBounds());
                    Template7.module.map.setZoomLevel(Template7.module.map.getMap().getZoom() - 1);

                    var routeLineLayer = Template7.module.map.getMap().getLayersByName('routeLine')[0];
                    var routePointLayer = Template7.module.map.getMap().getLayersByName('routePoint')[0];
                    routeLineLayer.addFeatures(lines);
                    routePointLayer.addFeatures(points);
                } else {
                    myApp.alert(xml || '해당 경로는 길찾기를 지원하지 않습니다.', '');
                }

                var callbackData = {
                    distance: distance,
                    routeBounds: routeBounds,
                    routeLine: routeLine,
                    startLines: startLines,
                    endLines: endLines,
                    bikeLines: bikeLines,
                    startPoint: startPoint,
                    endPoint: endPoint,
                    bikeDistance: bikeDistance,
                    startDistance: startDistance,
                    endDistance: endDistance,
                    description: description,
                    code: code
                };

                typeof callback === 'function' && callback(callbackData);
            });
        },

        /**
         *
         * @param start
         * @param end
         * @param callback
         */
        route: function(start, end, route_type, callback) {
            myApp.showPreloader('조회중입니다.');
            Template7.module.util.findDirections(start, end, null, function(routeData) {
                Template7.module.map.clearStoreLayer();
                Template7.module.map.cleanSearchLocationLayer();

                if(routeData.code === Template7.module.rest.SUCCESS_CODE) {

                    // 길찾기 성공시 DB에 데이터 저장
                    Template7.module.db.insertRoute({
                        start: {
                            lon: start.x,
                            lat: start.y,
                            name: start.name
                        },

                        end: {
                            lon: end.x,
                            lat: end.y,
                            name: end.name
                        },

                        route_type: route_type
                    });

                    myApp.hidePreloader();

                    // 따릉이 하이라이트 제거
                    var bikeViewContainer = myApp.views.bikeView.container;
                    $$(bikeViewContainer).find('.bike-item').removeClass('rsc');

                    // 찾은길 경로에 따릉이가 있는지 확인한다.
                    Template7.module.rest.selectRouteBike(routeData, function(data) {
                        // 따릉이가 두개 이면서 따릉이의 거리가 250 이상일 경우
                        if(data.length === 2 && data[0].distance > 250) {
                            myApp.confirm('경로에 따릉이가 있습니다. 따릉이를 이용하시겠습니까?', '', function () {
                                var startPoint = new OpenLayers.Geometry.Point(data[1].x, data[1].y).transform('EPSG:900913', 'EPSG:4326');
                                var endPoint = new OpenLayers.Geometry.Point(data[0].x, data[0].y).transform('EPSG:900913', 'EPSG:4326');
                                var startPointName = data[1].stationNo + '.' + data[1].stationName;
                                var endPointName = data[0].stationNo + '.' + data[0].stationName;

                                var passList = [];
                                passList.push([startPoint.x, startPoint.y]);
                                passList.push([endPoint.x, endPoint.y]);

                                myApp.showPreloader('조회중입니다.');
                                Template7.module.util.findDirections(start, end, passList, function(data) {
                                    if(data.code === Template7.module.rest.SUCCESS_CODE) {
                                        Template7.module.util.findRouteStore(data.routeLine);
                                        myApp.hidePreloader();
                                        myApp.showTab('#mapView');

                                        var routePointLayer = Template7.module.map.getMap().getLayersByName('routePoint')[0];
                                        var features = routePointLayer.features;
                                        for(var index in features) {
                                            var feature = features[index];
                                            if(feature.attributes.pointType === 'PP1') {
                                                feature.attributes.name = startPointName;
                                            } else if(feature.attributes.pointType === 'PP2') {
                                                feature.attributes.name = endPointName;
                                            }
                                        }

                                        routePointLayer.redraw();
                                    }
                                    typeof callback === 'function' && callback($$.extend({}, data, {passList: passList}));
                                });
                            }, function(){
                                Template7.module.util.findRouteStore(routeData.routeLine);
                                myApp.showTab('#mapView');
                                typeof callback === 'function' && callback(routeData);
                            });
                        } else {
                            Template7.module.util.findRouteStore(routeData.routeLine);
                            myApp.showTab('#mapView');
                            typeof callback === 'function' && callback(routeData);
                        }
                    });
                } else {
                    myApp.hidePreloader();
                }
            });
        },

        /**
         *
         * @param line
         */
        findRouteStore: function(line) {
            // 찾은길 100m 버퍼에 착한업소가 있는지 검색한다.
            Template7.module.rest.selectRouteStore(line, function(items){

                // 착한 업소 리스트를 삭제한다.
                $$('.store-card-content').children().remove();

                var storeCardHtml = '';
                var nearStoreHtml = '';

                var features = [];
                for(var index in items) {
                    var item = items[index];
                    item.storeInfo = item.storeInfo || '식당 정보가 없습니다.';

                    var point = new OpenLayers.Geometry.Point(item.x, item.y);
                    var feature = new OpenLayers.Feature.Vector(point);

                    feature.attributes.index = index;
                    feature.attributes.type = 'store';
                    feature.attributes.name = item.storeNm;
                    feature.attributes.imageUrl = item.storeImage || './images/noimg.png';

                    feature.attributes.storeAddr = item.storeAddr;
                    feature.attributes.storeGood = item.storeGood;
                    feature.attributes.storeInfo = item.storeInfo.trim().replace(/\n\n/g, '<br />');
                    feature.attributes.storeTel = item.storeTel;
                    feature.attributes.storeWayCome = item.storeWayCome;

                    features.push(feature);

                    // 착한 업소 카드를 추가한다.
                    storeCardHtml += Template7.templates.storeCardTemplate(feature.attributes);
                    nearStoreHtml += Template7.templates.nearStoreTemplate({
                        id: feature.attributes.index,
                        name : feature.attributes.name
                    });
                }

                $$('.store-card-content').append(storeCardHtml);

                if(nearStoreHtml) {
                    $$('#nearStoreList ul').append(nearStoreHtml);
                    $$('#nearStoreList').show();
                    $$('#emptyNearStoreList').hide();
                } else {
                    $$('#nearStoreList').hide();
                    $$('#emptyNearStoreList').show();
                }

                var layer = Template7.module.map.getMap().getLayersByName('storeLayer')[0];
                layer.addFeatures(features);
            });
        },

        /**
         *
         * @param data
         */
        showBikePath: function(data) {
            this.removePanelItem();

            var result = '', sTime = '', sInfo = '',
                bTime = '', bInfo = '', eTime = '',
                eInfo = '';

            var sDistance = data.sDistance;
            var bDistance = data.bDistance;
            var eDistance = data.eDistance;
            var descriptions = data.descriptions;

            if(bDistance !== 0) { // 경유지가 없을 경우 자전거 거리가 없다
                sTime = '<br />' + '(도보 ' + Math.round(sDistance / 2000 * 60) + '분)';
                sInfo = (sDistance > 999 ? '약 ' + (sDistance / 1000) + 'km' + ' ' + sTime : '약 ' + sDistance + 'm' + ' ' + sTime);
                result = Template7.templates.routePanelTemplate({
                    imageFirst: './images/icons/start.png',
                    imageSecond: './images/icons/t1.png',
                    info: sInfo,
                    // color: 'color-green',
                    startLon: data.startPoint.x,
                    startLat: data.startPoint.y,
                    endLon: data.passList[0][0],
                    endLat: data.passList[0][1]
                });

                bTime = '<br />' + '(자전거 ' + Math.round(bDistance / 8000 * 60) + '분)';
                bInfo = (bDistance > 999 ? '약 ' + (bDistance / 1000) + 'km' + ' ' + bTime : '약 ' + bDistance + 'm' + ' ' + bTime);
                result += Template7.templates.routePanelTemplate({
                    imageFirst: './images/icons/t1.png',
                    imageSecond: './images/icons/t2.png',
                    info: bInfo,
                    startLon: data.passList[0][0],
                    startLat: data.passList[0][1],
                    endLon: data.passList[1][0],
                    endLat: data.passList[1][1]
                });

                eTime = '<br />' + '(도보 ' + Math.round(eDistance / 2000 * 60) + '분)';
                eInfo = (eDistance > 999 ? '약 ' + (eDistance / 1000) + 'km' + ' ' + eTime : '약 ' + eDistance + 'm' + ' ' + eTime);
                result += Template7.templates.routePanelTemplate({
                    imageFirst: './images/icons/t2.png',
                    imageSecond: './images/icons/arrival.png',
                    info: eInfo,
                    // color: 'color-green',
                    startLon: data.passList[1][0],
                    startLat: data.passList[1][1],
                    endLon: data.endPoint.x,
                    endLat: data.endPoint.y
                });
            } else {
                eTime = '<br />' + '(도보 ' + Math.round(eDistance / 2000 * 60) + '분)';
                eInfo = (eDistance > 999 ? '약 ' + (eDistance / 1000) + 'km' + ' ' + eTime : '약 ' + eDistance + 'm' + ' ' + eTime);
                result += Template7.templates.routePanelTemplate({
                    imageFirst: './images/icons/start.png',
                    imageSecond: './images/icons/arrival.png',
                    info: eInfo,
                    // color: 'color-green',
                    startLon: data.startPoint.x,
                    startLat: data.startPoint.y,
                    endLon: data.endPoint.x,
                    endLat: data.endPoint.y
                });
            }

            // 총거리는 소수점 3자리까지만 표현하도록 함
            $$('#labelTotalDistance').text(Math.round(((sDistance / 1000) + (bDistance / 1000) + (eDistance / 1000)) * 1000) / 1000 + 'km');

            /*var descriptionResult = '';
            if(descriptions) {
                for(var i = 0, len = descriptions.length; i < len; i ++) {
                    var description = descriptions[i];
                    descriptionResult += Template7.templates.routeDescriptionTemplate({
                        index: i,
                        description: description
                    })
                }

                $$('#routeDescription').append(descriptionResult);
            }*/

            $$('#routePanel').append(result);
            $$('#routeInfoPanel').show();
            myApp.openPanel('left');
        },

        /**
         * 어플리케이션 커버 이미지를 숨김
         */
        hideCover: function() {
            if(navigator.splashscreen) {
                navigator.splashscreen.hide();
            }
        },

        /**
         * 페이지를 최상위로 이동한다.
         *
         * @param page Framework7 Page
         */
        pageTop: function(page) {
            $$(page).scrollTop(0, Math.round($$(page).scrollTop() / 4));
        },

        /**
         *
         */
        hideMapDial: function() {
            $$('.map-speed-dial').removeClass('speed-dial-opened');
            $$('#mapOverlay').hide();
        },

        /**
         *
         */
        removePanelItem: function() {
            $$('#routePanel').children().remove();
            $$('#routeDescription').children().remove();
            $$('#nearStoreList ul').children().remove();
            $$('#routeInfoPanel').hide();
        },

        /**
         *
         */
        initGlobalProperty: function() {
            Framework7.globals.directRouteStart = {};
            Framework7.globals.directRouteEnd = {};
        },

        /**
         *
         */
        tracking: function(isChecked) {
            if(isChecked) {
                var isCurrentLocationActive = $$('#btnCurrentLocation').hasClass('active');
                if(!isCurrentLocationActive) {
                    myApp.confirm('현재 위치가 활성화 되어 있지 않습니다. 활성화하시겠습니까?', function(){
                        Template7.module.event.locationClick($$('#btnCurrentLocation'));
                        Template7.module.map.moveToLonLat(new OpenLayers.LonLat(Framework7.globals.position.lon, Framework7.globals.position.lat).transform('EPSG:4326', 'EPSG:900913'), 19);

                        animationMarkerStart();
                        Template7.module.util.startWatchPosition(function(position, message) {
                            if(!message) {
                                console.log(position);
                                Template7.module.map.moveCurrentLocationFeature(new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude).transform('EPSG:4326', 'EPSG:900913'));
                            } else {
                                Template7.module.util.clearWatchPosition();
                            }
                        });

                    }, function() {
                        $$('#checkTracking').prop('checked', false);
                    });
                } else {
                    myApp.showPreloader('현재 위치를 확인합니다.');

                    Template7.module.util.updatePosition(function(){
                        Template7.module.map.moveToLonLat(new OpenLayers.LonLat(Framework7.globals.position.lon, Framework7.globals.position.lat).transform('EPSG:4326', 'EPSG:900913'));

                        animationMarkerStart();
                        setTimeout(function(){
                            myApp.hidePreloader();
                            Template7.module.util.startWatchPosition(function(position, message) {
                                if(!message) {
                                    console.log(position);
                                    Template7.module.map.moveCurrentLocationFeature(new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude).transform('EPSG:4326', 'EPSG:900913'));
                                } else {
                                    Template7.module.util.clearWatchPosition();
                                }
                            });
                        }, 500);
                    });
                }

                function animationMarkerStart() {
                    var layer = Template7.module.map.getMap().getLayersByName('locationLayer')[0];
                    var feature = layer.features[0];
                    var style = $$.extend({}, layer.styleMap.styles.default.rules[0].symbolizer.Point, {
                        pointRadius: 7
                    });

                    var rMin = 7, rMax = 8;
                    var direction = 1;

                    animationMarkerIntervalId = setInterval(function(){
                        if(feature) {
                            var radius = style.pointRadius;
                            if ((radius > rMax) || (radius < rMin)) {
                                direction *= -1;

                            }
                            style.pointRadius = direction + style.pointRadius * 1;
                            feature.style = style;
                            layer.drawFeature(feature);
                        } else {
                            feature = layer.features[0];
                        }
                    }, 80);
                }
            } else {
                Template7.module.util.animationMarkerStop();
                Template7.module.util.clearWatchPosition();
            }
        },

        /**
         * 현재 위치 애니메이션 마커 동작
         */
        animationMarkerStop: function() {
            clearInterval(animationMarkerIntervalId);
            var layer = Template7.module.map.getMap().getLayersByName('locationLayer')[0];
            var feature = layer.features[0];
            var style = layer.styleMap.styles.default.rules[0].symbolizer.Point;
            feature.style = style;
            layer.drawFeature(feature);
        },

        /**
         * 트래킹 시작
         */
        startBikeTracking: function() {
            stopwatch = new Stopwatch();
            stopwatch.start();

            bikeTrackingIntervalId = setInterval(function() {
                console.log('bikeTracking..');

                var layer = Template7.module.map.getMap().getLayersByName('bikeTracking')[0];
                layer.data = layer.data || {};

                var lastPoint = bikeTrackingPoints[bikeTrackingPoints.length - 1];
                var lonlat = new OpenLayers.LonLat(Framework7.globals.position.lon, Framework7.globals.position.lat).transform('EPSG:4326', 'EPSG:900913');
                var point = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
                var feature = null;
                if(lastPoint) {
                    if(!lastPoint.equals(point)) {
                        layer.data.endPoint = point;
                        bikeTrackingPoints.push(point);
                    }
                } else {
                    layer.data.startPoint = point;
                    bikeTrackingPoints.push(point);
                }

                var line = new OpenLayers.Geometry.LineString(bikeTrackingPoints);
                var lastFeature = layer.features[layer.features.length - 1];

                if(lastFeature) {
                    if(!lastFeature.geometry.equals(line)) {
                        feature = new OpenLayers.Feature.Vector(line);
                        Template7.module.map.clearTrackingLayerNoGMLFeature();
                        layer.addFeatures(feature);
                    }
                } else {
                    feature = new OpenLayers.Feature.Vector(line);
                    Template7.module.map.clearTrackingLayerNoGMLFeature();
                    layer.addFeatures(feature);
                }
            }, 1000);
        },

        /**
         * 트래킹 종료
         */
        endBikeTracking: function() {
            clearInterval(bikeTrackingIntervalId);
            bikeTrackingPoints = [];
            stopwatch.stop();

            var layer = Template7.module.map.getMap().getLayersByName('bikeTracking')[0];
            var feature = layer.features[layer.features.length - 1];
            var geometry = feature.geometry;
            var lineGML = new OpenLayers.Format.GML().write(feature);

            var startFeature = new OpenLayers.Feature.Vector(layer.data.startPoint);
            startFeature.attributes.name = '출발지';
            var startPointGML = new OpenLayers.Format.GML().write(startFeature);

            var endFeature = new OpenLayers.Feature.Vector(layer.data.endPoint || layer.data.startPoint);
            endFeature.attributes.name = '도착지';
            var endPointGML = new OpenLayers.Format.GML().write(endFeature);

            Template7.module.db.insertTracking({
                gml: lineGML,
                start: startPointGML,
                end: endPointGML,
                time: stopwatch.toString(),
                length: geometry.getLength()
            });

            Template7.module.map.clearTrackingLayerNoGMLFeature();
        },

        dataLabelInit: function() {
            Template7.module.db.selectVisitCount(function(data){
                $$('#myVisitCountLabel').text(data.count);
            });

            Template7.module.db.selectTrackingCount(function(data){
                $$('#myTrackingCountLabel').text(data.count);
            });

            Template7.module.db.selectRouteCount(function(data){
                $$('#myRouteCountLabel').text(data.count);
            });
        }
    }
}(myApp));