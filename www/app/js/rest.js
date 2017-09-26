Template7.module.rest = (function (app) {

    /**
     * 다음 API 키
     *  좌표 -> 주소변환, 주소 -> 좌표변환시 필요
     *
     * @type {string}
     */
    var DAUM_API = '5c5c3245-ede6-3b05-af5a-9000475ec70c';

    /**
     * 서버주소
     *  프록시 및 공간쿼리를 사용하기 위해서 필요
     *
     * @type {string}
     */
    // var SERVER_URL = 'http://192.168.1.192';
    var SERVER_URL = 'http://wekits.iptime.org';

    return {

        /**
         * rest 모듈 초기화 함수 (지금은 딱히 하는게 없음..)
         */
        init : function() {
            console.log('rest module init');
        },

        /**
         * 다음 키워드로 장소 검색
         *
         * @param query 키워드
         * @param callback 콜백함수
         */
        daumLocalSearch: function(query, callback) {
            $$.ajax({
                url: SERVER_URL + '/proxy.jsp',
                method: 'post',
                dataType: 'json',
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                data: {
                    url: 'http://apis.daum.net/local/v1/search/keyword.json?apikey=55db3d92bdb23d1f59befd515e13b3ba&query=' + encodeURI(query)
                },
                success: function (data) {
                    typeof callback === 'function' && callback(data, Template7.module.rest.SUCCESS_CODE);
                },
                error: function(error) {
                    typeof callback === 'function' && callback(error, Template7.module.rest.FAIL_CODE);
                }
            });
        },

        /**
         * 다음 좌표로 주소 검색
         *
         * @param position 좌표(lon, lat)
         * @param callback 콜백함수
         */
        daumCoord2addr: function(position, callback) {
            $$.ajax({
                url: SERVER_URL + '/proxy.jsp',
                method: 'post',
                dataType: 'json',
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                data: {
                    // 좌표 -> 주소반환
                    // url: 'https://apis.daum.net/local/geo/coord2addr?apikey=55db3d92bdb23d1f59befd515e13b3ba&longitude=' + position.lon + '&latitude=' + position.lat + '&inputCoordSystem=WGS84&output=json'

                    // 좌표 -> 상세주소반환
                    url: 'https://apis.daum.net/local/geo/coord2detailaddr?apikey=55db3d92bdb23d1f59befd515e13b3ba&x=' + position.lon + '&y=' + position.lat + '&inputCoordSystem=WGS84&output=json'
                },
                success: function (data) {
                    typeof callback === 'function' && callback(data, Template7.module.rest.SUCCESS_CODE);
                },
                error: function(error) {
                    typeof callback === 'function' && callback(error, Template7.module.rest.FAIL_CODE);
                }
            });
        },

        /**
         * 해당 위치에 가까운 따릉이 20건을 조회
         *
         * @param position 좌표(lon, lat)
         * @param callback 콜백함수
         */
        nearBike: function(position, callback) {
            $$.ajax({
                url: SERVER_URL + '/bike/selectNearBikeList',
                method: 'post',
                dataType: 'json',
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                data: {
                    currLon: Framework7.globals.position.lon,
                    currLat: Framework7.globals.position.lat,
                    lat: position.lat,
                    lon: position.lon
                },
                success: function (data) {
                    typeof callback === 'function' && callback(data, Template7.module.rest.SUCCESS_CODE);
                },
                error: function(error) {
                    typeof callback === 'function' && callback(error, Template7.module.rest.FAIL_CODE);
                }
            });
        },

        /**
         * 출발지에서 가까운 따릉이와 도착지에서 가까운 따릉이 각 1건씩 조회
         *
         * @param wkt 검색 폴리곤 WKT
         * @param callback 콜백함수
         */
        selectRouteBike: function(data, callback) {
            $$.ajax({
                url: SERVER_URL + '/bike/selectRouteBike',
                method: 'post',
                dataType: 'json',
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                data: {
                    bounds: data.routeBounds,
                    start: data.startPoint,
                    end: data.endPoint
                },
                success: function (data) {
                    typeof callback === 'function' && callback(data, Template7.module.rest.SUCCESS_CODE);
                },
                error: function(error) {
                    typeof callback === 'function' && callback(error, Template7.module.rest.FAIL_CODE);
                }
            });
        },

        /**
         * 경로에 반경 100m에 있는 착한업소 조회
         *
         * @param wkt 검색 라인 WKT
         * @param callback 콜백함수
         */
        selectRouteStore: function(wkt, callback) {
            $$.ajax({
                url: SERVER_URL + '/store/selectRouteStore',
                method: 'post',
                dataType: 'json',
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                data: {
                    wkt: wkt
                },
                success: function (data) {
                    typeof callback === 'function' && callback(data, Template7.module.rest.SUCCESS_CODE);
                },
                error: function(error) {
                    typeof callback === 'function' && callback(error, Template7.module.rest.FAIL_CODE);
                }
            });
        },

        /**
         * 길찾기 조회
         *
         * @param params SK Route Parameter
         * @param callback 콜백함수
         */
        route: function(params, callback) {
            var data = [];

            data.push("format=xml");
            data.push("version=1");
            data.push("appKey=" + DAUM_API);
            data.push("endX=" + params.endX);
            data.push("endY=" + params.endY);
            data.push("startX=" + params.startX);
            data.push("startY=" + params.startY);
            data.push("startName=" + encodeURI(params.startName));

            if(params.passList) {
                data.push("passList=" + params.passList.join('_'));
            }

            data.push("endName=" + encodeURI(params.endName));
            data.push("reqCoordType=WGS84GEO");

            $$.ajax({
                url: SERVER_URL + '/proxy.jsp',
                method: 'post',
                dataType: 'xml',
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                data: {
                    url: 'https://apis.skplanetx.com/tmap/routes/pedestrian?' + data.join('&')
                },
                success: function (data) {
                    typeof callback === 'function' && callback(data, Template7.module.rest.SUCCESS_CODE);
                },

                error: function(error) {
                    typeof callback === 'function' && callback('길안내를 제공하지 않는 지역입니다', Template7.module.rest.FAIL_CODE);
                }
            });
        },

        selectTourList: function(type, callback) {
            $$.ajax({
                url: SERVER_URL + '/tour/selectTourList',
                method: 'post',
                dataType: 'json',
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                data: {
                    type: type
                },
                success: function (tours) {
                    typeof callback === 'function' && callback(tours, Template7.module.rest.SUCCESS_CODE);
                },
                error: function(error) {
                    typeof callback === 'function' && callback(error, Template7.module.rest.FAIL_CODE);
                }
            });
        },

        selectParkList: function(callback) {
            $$.ajax({
                url: SERVER_URL + '/park/selectParkList',
                method: 'post',
                dataType: 'json',
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                data: {
                    x: Framework7.globals.position.lon,
                    y: Framework7.globals.position.lat
                },
                success: function (parks) {
                    typeof callback === 'function' && callback(parks, Template7.module.rest.SUCCESS_CODE);
                },
                error: function(error) {
                    typeof callback === 'function' && callback(parks, Template7.module.rest.FAIL_CODE);
                }
            });
        }
    }
}(myApp));

/**
 * 서버 통신 성공 코드
 * @type {number}
 */
Template7.module.rest.SUCCESS_CODE = 0;

/**
 * 서버 통신 실패 코드
 * @type {number}
 */
Template7.module.rest.FAIL_CODE = 1;