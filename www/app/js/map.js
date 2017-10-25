Template7.module.map = (function (app) {

    /**
     * map 모듈에서 사용하기 위한 지도 객체
     */
    var map;

    return {

        /**
         * 현재 위치를 가져온 후 브이월드 지도를 생성한다.
         */
        init : function() {
            console.log('map module init');

            Template7.module.util.updatePosition(function(){
                // 지도 초기화
                Template7.module.map.initMap();
            });
        },

        /**
         * 브이월드 API를 사용한 브이월드 지도 초기화
         */
        initMap: function () {
            var _this = this;

            var clickControl = new OpenLayers.Control.LongClick({
                longclick: function(e) {
                    var routePointLayer = map.getLayersByName('routePoint')[0];
                    var features = routePointLayer.features;

                    var lonlat = this.map.getLonLatFromPixel(e.xy);
                    var feature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat));

                    var clickPointFeature = features[features.length - 1];

                    if(clickPointFeature && !clickPointFeature.attributes.name) {
                        routePointLayer.removeFeatures(features[features.length - 1]);
                    }

                    var startButton = {
                        text: '출발지',
                        lonlat: lonlat.clone().transform(this.map.projection, 'EPSG:4326'),
                        bold: Framework7.globals.directRouteStart.hasOwnProperty('x'),
                        onClick: function () {
                            // 출발지 선택한 후 다시 선택할 경우 이전 출발지 삭제
                            if(Framework7.globals.directRouteStart.feature) {
                                routePointLayer.removeFeatures(Framework7.globals.directRouteStart.feature);
                            }

                            feature.attributes.name = '출발지';

                            var lonlat = this.lonlat;
                            Template7.module.rest.daumCoord2addr(this.lonlat, function (data) {
                                Framework7.globals.directRouteStart = {
                                    fullName: data.old.name,
                                    x: lonlat.lon,
                                    y: lonlat.lat,
                                    feature: feature
                                };

                                // 길찾기 시작지에 위치 등록
                                Template7.module.util.setGlobalsRouteStart({
                                    title: data.old.name,
                                    position : {
                                        lon: lonlat.lon,
                                        lat: lonlat.lat
                                    }
                                });
                                selectedRoutePosition();
                            });
                        }
                    };

                    var endButton = {
                        text: '도착지',
                        lonlat: lonlat.clone().transform(this.map.projection, 'EPSG:4326'),
                        bold: Framework7.globals.directRouteEnd.hasOwnProperty('x'),
                        onClick: function() {
                            // 도착지 선택한 후 다시 선택할 경우 이전 도착지 삭제
                            if(Framework7.globals.directRouteEnd.feature) {
                                routePointLayer.removeFeatures(Framework7.globals.directRouteEnd.feature);
                            }

                            feature.attributes.name = '도착지';

                            var lonlat = this.lonlat;
                            Template7.module.rest.daumCoord2addr(this.lonlat, function(data) {
                                Framework7.globals.directRouteEnd = {
                                    fullName : data.old.name,
                                    x : lonlat.lon,
                                    y : lonlat.lat,
                                    feature: feature
                                };

                                // 길찾기 시작지에 위치 등록
                                Template7.module.util.setGlobalsRouteEnd({
                                    title: data.old.name,
                                    position : {
                                        lon: lonlat.lon,
                                        lat: lonlat.lat
                                    }
                                });
                                selectedRoutePosition();
                            });
                        }
                    };

                    var bikeButton = {
                        text: '따릉이 보기',
                        lonlat: lonlat.clone().transform(this.map.projection, 'EPSG:4326'),
                        onClick: function() {
                            myApp.showPreloader('따릉이 정보를 갱신합니다.');

                            var ptrContent = $$(myApp.views['bikeView'].container).find('.pull-to-refresh-content');

                            var position = {
                                lon: this.lonlat.lon,
                                lat: this.lonlat.lat
                            };

                            Template7.module.util.refreshBikeContent(ptrContent, position, function() {
                                Template7.module.map.clearBikeDrawLayer();
                                Template7.module.map.bikeDraw();
                                myApp.hidePreloader();
                            });
                        }
                    };

                    // 출발지와 도착지가 있으면 길찾기를 시작한다.
                    function selectedRoutePosition() {
                        if(Framework7.globals.directRouteStart.hasOwnProperty('x') && Framework7.globals.directRouteEnd.hasOwnProperty('x')) {
                            var start = {
                                x: Framework7.globals.directRouteStart['x'],
                                y: Framework7.globals.directRouteStart['y'],
                                name: Framework7.globals.directRouteStart['fullName'] + ' (출발지)'
                            };

                            var end = {
                                x: Framework7.globals.directRouteEnd['x'],
                                y: Framework7.globals.directRouteEnd['y'],
                                name: Framework7.globals.directRouteEnd['fullName'] + ' (도착지)'
                            };

                            Template7.module.util.route(start, end, 'nomal', function(data){
                                Template7.module.util.showBikePath({
                                    sDistance : data.startDistance,
                                    bDistance : data.bikeDistance,
                                    eDistance : data.endDistance,
                                    startPoint: start,
                                    endPoint: end,
                                    passList: data.passList || null
                                });

                                // 선택지 초기화
                                // Framework7.globals.directRouteStart = {};
                                // Framework7.globals.directRouteEnd = {};
                            });
                        }
                    }

                    var buttons = [
                        startButton,
                        endButton,
                        bikeButton,
                        {
                            text: '취소',
                            color: 'red',
                            onClick: function() {
                                var routePointLayer = map.getLayersByName('routePoint')[0];
                                var features = routePointLayer.features;
                                routePointLayer.removeFeatures(features[features.length - 1]);
                            }
                        }
                    ];

                    feature.attributes.pointType = 'PIN';
                    routePointLayer.addFeatures([feature]);

                    myApp.actions(buttons);
                }
            });

            map = new OpenLayers.Map('map', {
                theme: null,
                controls: [
                    new OpenLayers.Control.Attribution(),
                    new OpenLayers.Control.ScaleLine({bottomInUnits: '', bottomOutUnits: ''}),
                    new OpenLayers.Control.TouchNavigation({
                        dragPanOptions: {
                            enableKinetic: false
                        }
                    }),
                    clickControl
                ],
                ratio: 1.0,
                sphericalMercator: true,
                projection: new OpenLayers.Projection("EPSG:900913"),
                units: "m",
                numZoomLevels: 20,
                minZoom: 6,
                maxResolution: 156543.0339,
                maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),

                // 줌 아웃 확장
                zoomOut: function() {
                    if (this.zoomTween) {
                        this.zoomTween.stop();
                    }

                    if(this.minZoom >= this.getZoom()) {
                        return;
                    }

                    this.zoomTo(this.getZoom() - 1);
                }
            });

            clickControl.activate();

            var vWorldStreet = new OpenLayers.Layer.XYZ(
                "브이월드 지도",
                [
                    "http://xdworld.vworld.kr:8080/2d/Base/201612/${z}/${x}/${y}.png"
                ], {
                    attribution: '<a href="#"><img src="http://map.vworld.kr/images/maps/logo_openplatform_simple.png"></a>',
                    sphericalMercator: true,
                    wrapDateLine: true,
                    numZoomLevels: 20
                }
            );

            map.addLayers([vWorldStreet]);

            var style = new OpenLayers.Style({}, {
                context: {
                    pointIndex: function(feature) {
                        return feature.attributes.pointIndex || '';
                    },
                    name: function(feature) {
                        return feature.attributes.name || '';
                    }
                },
                rules: [
                    new OpenLayers.Rule({
                        filter: new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                            property: "pointType",
                            value: 'SP'
                        }),
                        symbolizer: {
                            "Point" : {
                                externalGraphic: './images/icons/start.png',
                                graphicWidth: 30,
                                graphicHeight: 39,
                                graphicXOffset: -15,
                                graphicYOffset: -39,
                                labelYOffset: -8,
                                fontSize: "14px",
                                fontWeight: "bold",
                                fontColor: '#3f4cb9',
                                label : "${name}",
                                labelOutlineWidth: 2,
                                labelOutlineColor: "white"
                            }
                        }
                    }),
                    new OpenLayers.Rule({
                        filter: new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                            property: "pointType",
                            value: 'EP'
                        }),
                        symbolizer: {
                            "Point" : {
                                externalGraphic: './images/icons/arrival.png',
                                graphicWidth: 30,
                                graphicHeight: 39,
                                graphicXOffset: -15,
                                graphicYOffset: -39,
                                labelYOffset: -8,
                                fontSize: "14px",
                                fontWeight: "bold",
                                fontColor: '#3f4cb9',
                                label : "${name}",
                                labelOutlineWidth: 2,
                                labelOutlineColor: "white"
                            }
                        }
                    }),
                    new OpenLayers.Rule({
                        filter: new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                            property: "roadType",
                            value: 'bike'
                        }),
                        symbolizer: {
                            "Line" : {
                                strokeColor: '#3e9ff0',
                                strokeWidth: 7,
                                strokeOpacity: 0.7
                            }
                        }
                    }),

                    // 경유지1 (대여)
                    new OpenLayers.Rule({
                        filter: new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                            property: "pointType",
                            value: 'PP1'
                        }),
                        symbolizer: {
                            "Point" : {
                                externalGraphic: './images/icons/t1.png',
                                graphicWidth: 30,
                                graphicHeight: 39,
                                graphicXOffset: -15,
                                graphicYOffset: -39,
                                labelYOffset: -8,
                                fontSize: "14px",
                                fontWeight: "bold",
                                fontColor: '#3f4cb9',
                                label : "${name}",
                                labelOutlineWidth: 2,
                                labelOutlineColor: "white"
                            }
                        }
                    }),

                    // 경유지2 (반납)
                    new OpenLayers.Rule({
                        filter: new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                            property: "pointType",
                            value: 'PP2'
                        }),
                        symbolizer: {
                            "Point" : {
                                externalGraphic: './images/icons/t2.png',
                                graphicWidth: 30,
                                graphicHeight: 39,
                                graphicXOffset: -15,
                                graphicYOffset: -39,
                                labelYOffset: -8,
                                fontSize: "14px",
                                fontWeight: "bold",
                                fontColor: '#3f4cb9',
                                label : "${name}",
                                labelOutlineWidth: 2,
                                labelOutlineColor: "white"
                            }
                        }
                    }),
                    new OpenLayers.Rule({
                        filter: new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                            property: "pointType",
                            value: 'PIN'
                        }),
                        symbolizer: {
                            "Point" : {
                                pointRadius: 18,
                                externalGraphic: "lib/OpenLayers-ext/img/pins.png",
                                backgroundGraphic: "lib/OpenLayers-ext/img/pinsback.png",
                                graphicYOffset:-36,
                                backgroundXOffset: 0,
                                backgroundYOffset: -24,
                                graphicZIndex: 11,
                                backgroundGraphicZIndex: 10,
                                cursor: 'pointer'
                            }
                        }
                    }),
                    /*new OpenLayers.Rule({
                        elseFilter: true,
                        minScaleDenominator: 800,
                        maxScaleDenominator: 7000,
                        symbolizer: {
                            "Point" : {
                                label: '${pointIndex}',
                                fontSize: "12px",
                                labelAlign: 'cm',
                                fontColor: '#0078ff',
                                fontWeight: 'bold',
                                pointRadius: 12,
                                fillColor: 'white',
                                strokeColor: '#ededef',
                                strokeWidth: 2,
                                cursor: 'pointer'
                            }
                        }
                    }),*/
                    new OpenLayers.Rule({
                        elseFilter: true,
                        symbolizer: {
                            "Line": {
                                strokeColor: '#3e9ff0',
                                strokeWidth: 7,
                                strokeOpacity: 0.7
                            }
                        }
                    })
                ]}
            );

            // 현재위치 레이어 스타일
            var locationLayerStyle = new OpenLayers.Style({}, {
                context: {
                    name: function(feature) {
                        return feature.attributes.name || '';
                    }
                },
                rules: [
                    new OpenLayers.Rule({
                        symbolizer: {
                            "Point" : {
                                fillColor: '#ff0e2c',
                                strokeColor: 'white',
                                strokeWidth: 2,
                                pointRadius: 7,
                                graphicName: 'square',
                                graphicZIndex: '1000'
                                /*fontSize: "14px",
                                fontWeight: "bold",
                                fontColor: '#1441a6',
                                label : "${name}",
                                labelOutlineWidth: 2,
                                labelOutlineColor: "white",
                                labelYOffset: -16*/
                            },
                            "Polygon" : {
                                fillColor: '#5ab2ff',
                                fillOpacity: 0.1,
                                strokeColor: '#5ab2ff',
                                strokeOpacity: 0.4,
                                graphicZIndex: '200'
                            }
                        }
                    })
                ]
            });

            // 위치찾기 레이어
            var searchLocationLayerStyle = new OpenLayers.Style({
                pointRadius: 18,
                // externalGraphic: "lib/OpenLayers-ext/img/pins.png",
                externalGraphic: './images/icons/map-marker.png',
                backgroundGraphic: "lib/OpenLayers-ext/img/pinsback.png",
                graphicYOffset:-36,
                backgroundXOffset: 0,
                backgroundYOffset: -24,
                graphicZIndex: 11,
                backgroundGraphicZIndex: 10,
                fontSize: "14px",
                fontWeight: "bold",
                fontColor: '#1441a6',
                label : "${name}",
                labelOutlineWidth: 2,
                labelOutlineColor: "white",
                labelYOffset: -8
            }, {
                context: {
                    name: function(feature) {
                        return feature.attributes.name || '';
                    }
                }
            });

            var bikeTracking = new OpenLayers.Layer.Vector('bikeTracking', {
                styleMap: new OpenLayers.StyleMap(new OpenLayers.Style({}, {
                    rules: [
                        new OpenLayers.Rule({
                            symbolizer: {
                                "Point" : {
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                    fontColor: '#1441a6',
                                    label : "${name}",
                                    labelOutlineWidth: 2,
                                    labelOutlineColor: "white",
                                    labelYOffset: -16,
                                    labelAlign: 'cm'
                                },
                                'Line' : {
                                    strokeColor: '#6a75ff',
                                    strokeWidth: 5
                                }
                            }
                        })
                    ]
                })),
                renderers: ["Canvas", "SVG", "VML"]
            });

            var routeLine = new OpenLayers.Layer.Vector('routeLine', {
                styleMap: new OpenLayers.StyleMap(style),
                renderers: ["Canvas", "SVG", "VML"]
            });

            var routePoint = new OpenLayers.Layer.Vector('routePoint', {
                styleMap: new OpenLayers.StyleMap(style),
                renderers: ['SVG']
            });

            var locationLayer = new OpenLayers.Layer.Vector('locationLayer', {
                styleMap: new OpenLayers.StyleMap(locationLayerStyle),
                rendererOptions: {zIndexing: true},
                renderers: ["SVG"]
            });

            var searchLocationLayer = new OpenLayers.Layer.Vector('searchLocationLayer', {
                styleMap: new OpenLayers.StyleMap(searchLocationLayerStyle),
                renderers: ["SVG"],
                eventListeners: {
                    'featureselected': function(data) {
                        var buttons = [
                            {
                                text: '출발지',
                                onClick: function() {
                                    var lon = data.feature.attributes.lon;
                                    var lat = data.feature.attributes.lat;
                                    var title = data.feature.attributes.name;

                                    Template7.module.util.registRouteStart(title, {lon: lon, lat: lat});
                                    myApp.showTab('#contentView');
                                }
                            },
                            {
                                text: '도착지',
                                onClick: function() {
                                    var lon = data.feature.attributes.lon;
                                    var lat = data.feature.attributes.lat;
                                    var title = data.feature.attributes.name;

                                    Template7.module.util.registRouteEnd(title, {lon: lon, lat: lat});
                                    myApp.showTab('#contentView');
                                }
                            },
                            {
                                text: '취소',
                                color: 'red'
                            }
                        ];

                        var layer = map.getLayersByName('searchLocationLayer')[0];
                        var features = layer.features;
                        for(var index in features) {
                            Template7.module.map.getMap().getControl('selectControl').unselect(features[index]);
                        }

                        myApp.actions(buttons);
                    }
                }
            });

            var storeLayer = new OpenLayers.Layer.Vector('storeLayer', {
                styleMap: new OpenLayers.StyleMap({ // 착한가게 레이어 스타일
                    "default": new OpenLayers.Style({}, {
                        rules: [
                            new OpenLayers.Rule({
                                minScaleDenominator: 800,
                                maxScaleDenominator: 14000,
                                symbolizer: {
                                    pointRadius: 16,
                                    graphicName: "fa-blazon",
                                    backgroundGraphic: "lib/OpenLayers-ext/img/pinsback.png",
                                    fillColor: "#3b7",
                                    symbolYOffset: -18,
                                    rotation: 0,

                                    faLabel: "none",
                                    faColor: "#3b7",
                                    faSize: 0.8,

                                    faLabel_1: "ion-android-restaurant",
                                    faColor_1: "#fff",
                                    faSize_1: 0.6,

                                    faColor_2: "red",
                                    faSize_2: 1,

                                    strokeWidth: 2,
                                    stroke: true,
                                    strokeColor: "#fff",
                                    backgroundXOffset: 0,
                                    backgroundYOffset: -24,
                                    graphicZIndex: 11,
                                    backgroundGraphicZIndex: 10
                                }
                            })
                        ]
                    }),
                    "select": new OpenLayers.Style({}, {
                        rules: [
                            new OpenLayers.Rule({
                                minScaleDenominator: 800,
                                maxScaleDenominator: 14000,
                                symbolizer: {
                                    pointRadius: 24,
                                    symbolYOffset: -24,
                                    backgroundYOffset: -32,
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                    fontColor: '#1441a6',
                                    label : "${name}",
                                    labelYOffset: -8,
                                    labelOutlineWidth: 2,
                                    labelOutlineColor: "white",
                                    graphicZIndex: 2000,
                                    backgroundGraphicZIndex: 1500
                                }
                            })
                        ]
                    })
                }),
                rendererOptions: { zIndexing: true },
                renderers: ["SVG"],
                eventListeners: {
                    'featureselected': function(data) {
                        if($$('.picker-modal').css('display') === 'none') {
                            myApp.pickerModal('.picker-info', false);
                        }
                        $$('.store-swiper-container')[0].swiper.slideTo(data.feature.attributes.index);
                    },

                    'featureunselected': function(data) {
                        var features = map.getLayersByName('storeLayer')[0].features;
                        for(var index in features) {
                            if(features[index].renderIntent === 'select') {
                                return;
                            }
                        }
                        if($$('.picker-modal.modal-in').css('display') !== 'none') {
                            myApp.closeModal('.picker-modal', false);
                        }
                    }
                }
            });

            var bikeDrawLayer = new OpenLayers.Layer.Vector('bikeDrawLayer', {
                styleMap: new OpenLayers.StyleMap({
                    "default": new OpenLayers.Style({}, {
                        rules: [
                            new OpenLayers.Rule({
                                symbolizer: {
                                    pointRadius: 16,
                                    graphicName: "fa-blazon",
                                    backgroundGraphic: "lib/OpenLayers-ext/img/pinsback.png",
                                    fillColor: "#4c5ebb",
                                    symbolYOffset: -18,
                                    rotation: 0,

                                    faLabel: "none",
                                    faColor: "#4c5ebb",
                                    faSize: 0.8,

                                    faLabel_1: "ion-android-bicycle",
                                    faColor_1: "#fff",
                                    faSize_1: 0.6,

                                    faColor_2: "red",
                                    faSize_2: 1,

                                    strokeWidth: 2,
                                    stroke: true,
                                    strokeColor: "#fff",
                                    backgroundXOffset: 0,
                                    backgroundYOffset: -24,
                                    graphicZIndex: 11,
                                    backgroundGraphicZIndex: 10
                                }
                            })
                        ]
                    }),
                    "select": new OpenLayers.Style({}, {
                        rules: [
                            new OpenLayers.Rule({
                                symbolizer: {
                                    pointRadius: 24,
                                    symbolYOffset: -24,
                                    backgroundYOffset: -32,
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                    fontColor: '#1441a6',
                                    label : "${name}",
                                    labelYOffset: -8,
                                    labelOutlineWidth: 2,
                                    labelOutlineColor: "white",
                                    graphicZIndex: 2000,
                                    backgroundGraphicZIndex: 1000
                                }
                            })
                        ]
                    })
                }),
                rendererOptions: { zIndexing: true },
                renderers: ["SVG"]
            });

            var visitDrawLayer = new OpenLayers.Layer.Vector('visitDrawLayer', {
                styleMap: new OpenLayers.StyleMap({
                    "default": new OpenLayers.Style({}, {
                        rules: [
                            new OpenLayers.Rule({
                                symbolizer: {
                                    pointRadius: 16,
                                    graphicName: "fa-blazon",
                                    backgroundGraphic: "lib/OpenLayers-ext/img/pinsback.png",
                                    fillColor: "#bb000a",
                                    symbolYOffset: -18,
                                    rotation: 0,

                                    faLabel: "none",
                                    faColor: "#bb000a",
                                    faSize: 0.8,

                                    faLabel_1: "ion-ios-heart",
                                    faColor_1: "#fff",
                                    faSize_1: 0.6,

                                    faColor_2: "red",
                                    faSize_2: 1,

                                    strokeWidth: 2,
                                    stroke: true,
                                    strokeColor: "#fff",
                                    backgroundXOffset: 0,
                                    backgroundYOffset: -24,
                                    graphicZIndex: 11,
                                    backgroundGraphicZIndex: 10
                                }
                            })
                        ]
                    }),
                    "select": new OpenLayers.Style({}, {
                        rules: [
                            new OpenLayers.Rule({
                                symbolizer: {
                                    pointRadius: 24,
                                    symbolYOffset: -24,
                                    backgroundYOffset: -32,

                                    fontSize: "14px",
                                    fontWeight: "bold",
                                    fontColor: '#1441a6',
                                    label : "${name}",
                                    labelYOffset: -8,
                                    labelOutlineWidth: 2,
                                    labelOutlineColor: "white"
                                }
                            })
                        ]
                    })
                }),
                rendererOptions: { zIndexing: true },
                renderers: ["SVG"]
            });

            map.addLayers([routeLine, routePoint, bikeTracking, visitDrawLayer, searchLocationLayer, locationLayer, storeLayer, bikeDrawLayer]);

            var lonlat = new OpenLayers.LonLat(Framework7.globals.position.lon, Framework7.globals.position.lat).transform('EPSG:4326', map.getProjection());
            map.setCenter(new OpenLayers.LonLat(lonlat.lon, lonlat.lat), 16);

            map.layers[0].events.register('loadend', map.layers[0], initLoading);

            function initLoading() {
                // setTimeout을 준 이유는 초기 로딩시 지도 조작을 하면 느려지기 때문에 1초 딜레이를 줌..
                setTimeout(function(){
                    Template7.module.util.hideCover();
                    Template7.module.db.selectAppInfo(function(appInfo){
                        if(appInfo.length < 1) {
                            tourguide.showTour();
                            Template7.module.db.insertAppinfo('init App');
                        }
                    });

                    // 초기화시 찜한 관광명소를 지도에 추가한다.
                    Template7.module.db.selectVisits(function(visits) {
                        for(var i = 0, len = visits.length; i < len; i++) {
                            Template7.module.map.addVisitFeature(visits[i]);
                        }
                    });
                }, 1000);

                var point = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
                Template7.module.map.moveLocation(point);

                this.events.unregister('loadend', this, initLoading);
            }

            var bikeSelectControl = new OpenLayers.Control.SelectFeature([searchLocationLayer, visitDrawLayer, bikeDrawLayer, storeLayer], {
                id: 'selectControl'
            });
            map.addControl(bikeSelectControl);
            bikeSelectControl.activate();
        },

        /**
         * 맵 팝업을 전체 삭제한다.
         */
        removeAllPopup: function() {
            var popups = map.popups;
            for(var i = popups.length - 1; i >= 0; i--) {
                map.removePopup(popups[i]);
            }
        },

        /**
         * 현재 위치를 지도에 표시
         *
         * @param lonlat 지도에 표시할 위치
         */
        drawLoction: function(lonlat) {
            var layer = map.getLayersByName('locationLayer')[0];
            layer.removeAllFeatures();
            var feature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat));
            layer.addFeatures(feature);
        },

        /**
         * 지도를 현재 위치로 이동
         *
         * @param point
         */
        moveLocation: function (point) {
            var lonlat = new OpenLayers.LonLat(point.x, point.y);
            var zoom = map.getZoom();
            this.moveTo(lonlat, zoom);
        },

        /**
         * 지도에 컨트롤을 추가
         *
         * @param control OpenLayers.Control
         */
        addControl: function (control) {
            map.addControl(control);
        },

        /**
         * 지도를 이동
         *
         * @param lonlat OpenLayers.LonLat
         * @param zoom number
         */
        moveTo: function (lonlat, zoom, label, options) {
            var layer = null;

            if(label) {
                layer= map.getLayersByName('searchLocationLayer')[0];
            } else {
                layer = map.getLayersByName('locationLayer')[0];
            }

            layer.removeAllFeatures();

            var feature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat));
            feature.attributes = {name: label || ''};
            feature.data = $$.extend({}, feature.attributes);

            if(options) {
                feature.attributes = $$.extend({}, feature.attributes, options);
            }

            layer.addFeatures(feature);

            if(label) {
                feature.bounce(OpenLayers.BounceEffect.SHAKE)
            }


            zoom = zoom || map.getZoom();
            map.moveTo(lonlat, zoom);
        },

        moveCurrentLocationFeature: function(lonlat) {
            var layer = layer = map.getLayersByName('locationLayer')[0];
            var feature = layer.features[0];
            var radius = layer.features[1];

            var point = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);

            if(feature) {
                feature.move(new OpenLayers.LonLat(lonlat.lon, lonlat.lat));
            } else {
                feature = new OpenLayers.Feature.Vector(point);
                layer.addFeatures(feature);
            }

            if(!radius) {
                radius = new OpenLayers.Geometry.Polygon.createRegularPolygon(point, 30, 35, 0);
                layer.addFeatures(new OpenLayers.Feature.Vector(radius));
            } else {
                radius.move(new OpenLayers.LonLat(lonlat.lon, lonlat.lat));
            }
        },

        /**
         *
         * @param lonLat
         * @param zoom
         */
        moveToLonLat: function(lonLat, zoom) {
            zoom = zoom || map.numZoomLevels - 1;
            map.moveTo(lonLat, zoom);
        },

        /**
         *
         * @param lonLat
         */
        panToLonLat: function(lonLat) {
            map.panTo(lonLat);
        },

        /**
         * 지도 컨트롤을 활성화
         *
         * @param id 활성화할 컨트롤 id
         */
        activateControl: function (id) {
            map.getControl(id).activate();
        },

        /**
         * 지도 컨트롤을 비활성화
         *
         * @param id 비활성화할 컨트롤 id
         */
        deactivateControl: function(id) {
            map.getControl(id).deactivate();
        },

        /**
         * 지도객체를 반환한다. (테스트용)
         * @returns {*}
         */
        getMap: function () {
            return map;
        },

        /**
         * 경로탐색 레이어(점, 선)을 초기화
         */
        clearRouteLayer: function() {
            map.getLayersByName('routeLine')[0].removeAllFeatures();
            map.getLayersByName('routePoint')[0].removeAllFeatures();
        },

        /**
         * 착한업소 레이어(점)을 초기화
         */
        clearStoreLayer: function() {
            map.getLayersByName('storeLayer')[0].removeAllFeatures();
        },

        /**
         *
         */
        clearBikeDrawLayer: function() {
            Template7.module.map.getMap().getLayersByName('bikeDrawLayer')[0].removeAllFeatures();
        },

        /**
         * 현재위치 레이어(점)을 초기화
         */
        clearLocationLayer: function() {
            map.getLayersByName('locationLayer')[0].removeAllFeatures();
        },

        /**
         * 위치찾기 레이어(점)을 초기화
         */
        cleanSearchLocationLayer: function() {
            map.getLayersByName('searchLocationLayer')[0].removeAllFeatures();
        },

        /**
         * 트래킹 레이어에서 지도에 실시간으로 그려지는 Feature만 제외하고 삭제한다.
         */
        clearTrackingLayer: function() {
            var layer = Template7.module.map.getMap().getLayersByName('bikeTracking')[0];
            var features = layer.features;
            var deleteFeatures = [];

            for(var i = 0, len = features.length; i < len; i++) {
                var feature = features[i];
                if(feature.attributes['gml'] || feature.geometry instanceof OpenLayers.Geometry.Point) {
                    deleteFeatures.push(feature);
                }
            }
            layer.removeFeatures(deleteFeatures);
        },

        /**
         * 트래킹 레이어에서 지도에 실시간으로 그려지는 Feature만 삭제한다.
         */
        clearTrackingLayerNoGMLFeature: function() {
            var layer = Template7.module.map.getMap().getLayersByName('bikeTracking')[0];
            var features = layer.features;
            var deleteFeatures = [];

            for(var i = 0, len = features.length; i < len; i++) {
                var feature = features[i];
                if(!feature.attributes['gml'] && feature.geometry instanceof OpenLayers.Geometry.LineString) {
                    deleteFeatures.push(feature);
                }
            }
            layer.removeFeatures(deleteFeatures);
        },

        /**
         * 맵 줌 레벨을 변경합니다.
         *
         * @param level 줌 레벨
         */
        setZoomLevel: function(level) {
            var center = map.getCenter();
            map.setCenter(center, level);
        },

        /**
         * 맵에 그리젼 레이어 데이터를 삭제한다.
         */
        cleanMap: function() {
            Template7.module.util.removePanelItem();
            this.clearRouteLayer();
            this.clearStoreLayer();
            this.cleanSearchLocationLayer();
            this.clearBikeDrawLayer();
            this.clearTrackingLayer();
            Template7.module.util.initGlobalProperty();
        },

        bikeDraw: function() {
            var layer = map.getLayersByName('bikeDrawLayer')[0];
            var features = [];
            $$('.bike-item').each(function(i, data){
                var $$a = $$(this);
                var lonlat = new OpenLayers.LonLat($$a.data('lon'), $$a.data('lat')).transform('EPSG:4326', 'EPSG:900913');
                var geometry = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
                var feature = new OpenLayers.Feature.Vector(geometry);
                feature.attributes.name = $$a.data('station-no') + '. ' + $$a.data('station-name') + '\n' + '자전거 거치대: ' +  $$a.data('rack-tot-cnt');
                features.push(feature);
            });

            layer.addFeatures(features);

            map.zoomToExtent(getExtentByPointFeatures(features));

            /**
             * 점형 피쳐들의 영역을 구함
             *
             * @param features
             * @returns {Extent}
             */
            function getExtentByPointFeatures(features) {
                var maxX = features.reduce(function(previous, current){
                    return previous.geometry.x > current.geometry.x ? previous : current;
                });

                var maxY = features.reduce(function(previous, current){
                    return previous.geometry.y > current.geometry.y ? previous : current;
                });

                var minX = features.reduce(function(previous, current){
                    return previous.geometry.x > current.geometry.x ? current: previous;
                });

                var minY = features.reduce(function(previous, current){
                    return previous.geometry.y > current.geometry.y ? current : previous;
                });

                return new OpenLayers.Bounds(minX.geometry.x, minY.geometry.y, maxX.geometry.x, maxY.geometry.y);
            }
        },

        /**
         * 찜 피쳐를 지도에 추가
         *
         * @param datas - Feature attrigutes 데이터
         */
        addVisitFeature: function(datas) {
            var layer = map.getLayersByName('visitDrawLayer')[0];

            var lonlat = new OpenLayers.LonLat(datas.lon, datas.lat).transform('EPSG:4326', 'EPSG:900913');
            var geometry = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
            var feature = new OpenLayers.Feature.Vector(geometry);
            feature.attributes.name = datas.name;
            feature.attributes.id = datas.id;

            layer.addFeatures(feature);
        },

        /**
         * 찜 피쳐를 지도에서 삭제
         *
         * @param id - Feature id
         */
        removeVisitFeature: function(id) {
            var layer = map.getLayersByName('visitDrawLayer')[0];

            for(var i = 0, len = layer.features.length; i < len; i++) {
                var feature = layer.features[i];
                if(feature.attributes.id === id) {
                    layer.removeFeatures(feature);
                    break;
                }
            }
        }
    }
}(myApp));
