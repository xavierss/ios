Template7.module.db = (function (app) {
    var db = WebSQL('mydb');
    var ROUTE_DATABASE_NAME = 'route';
    var VISIT_DATABASE_NAME = 'visit';
    var APP_INFO_DATABASE_NAME = 'app_info';
    var TRACKING_DATABASE_NAME = 'tracking';

    return {
        init : function() {
            console.log('db module init');

            this.createDatabase();
        },

        /**
         * DB 를 초기화합니다. 현재 사용 DB는 길찾기, 찜, 앱데이터 총 3가지 입니다.
         */
        createDatabase: function() {
            db.query(
                // 'drop table if exists ' + ROUTE_DATABASE_NAME,
                // 'drop table if exists ' + APP_INFO_DATABASE_NAME,
                // 'drop table if exists ' + VISIT_DATABASE_NAME,
                // 'drop table if exists ' + TRACKING_DATABASE_NAME,

                'create table if not exists ' + ROUTE_DATABASE_NAME + '(' +
                '   id integer primary key, ' +
                '   start_lon real, ' +
                '   start_lat real, ' +
                '   start_name text, ' +
                '   end_lon real, ' +
                '   end_lat real, ' +
                '   end_name text,' +
                '   route_type text,' +
                '   update_dt text,' +
                '   regist_dt text)',

                'create table if not exists ' + APP_INFO_DATABASE_NAME + '(' +
                '   init text primary key)',

                'create table if not exists ' + VISIT_DATABASE_NAME + '(' +
                '   id integer primary key, ' +
                '   lon real, ' +
                '   lat real, ' +
                '   name text, ' +
                '   type text,' +
                '   update_dt text,' +
                '   regist_dt text)',

                'create table if not exists ' + TRACKING_DATABASE_NAME + '(' +
                '   id integer primary key, ' +
                '   gml text, ' +
                '   start text, ' +
                '   end text, ' +
                '   length real, ' +
                '   tracking_time text, ' +
                '   update_dt text,' +
                '   regist_dt text)'
            ).fail(function(tx, err) {
                console.log('데이터베이스 초기화에 실패했습니다. -> ' + err.message);
            });
        },

        /**
         * 길찾기 데이터 입력
         *
         * @param datas
         */
        insertRoute: function(datas) {
            db.query('insert into ' + ROUTE_DATABASE_NAME + '(' +
                '   id, ' +
                '   start_lon, ' +
                '   start_lat, ' +
                '   start_name, ' +
                '   end_lon, ' +
                '   end_lat, ' +
                '   end_name,' +
                '   route_type,' +
                '   regist_dt) ' +
                ' values (' +
                '   ( select ifnull(max(id) + 1,  1) from ' + ROUTE_DATABASE_NAME + ' )' +
                '   , ?, ?, ?, ?, ?, ?, ?,' +
                '   datetime(strftime("%s", "now"), "unixepoch", "localtime"))',
                [
                    [ datas.start.lon, datas.start.lat, datas.start.name, datas.end.lon, datas.end.lat, datas.end.name, datas.route_type ]
                ]
            ).fail(function(tx, err) {
                console.log(ROUTE_DATABASE_NAME + ' 테이블 데이터 저장중 오류가 발생했습니다. -> ' + err.message);
            }).done(function(){
                console.log(ROUTE_DATABASE_NAME + ' 테이블에 정상적으로 데이터가 저장되었습니다.');
            });
        },

        insertTracking: function(datas) {
            db.query('insert into ' + TRACKING_DATABASE_NAME + '(' +
                '   id, ' +
                '   gml, ' +
                '   start, ' +
                '   end, ' +
                '   length, ' +
                '   tracking_time, ' +
                '   regist_dt) ' +
                ' values (' +
                '   ( select ifnull(max(id) + 1,  1) from ' + TRACKING_DATABASE_NAME + ' )' +
                '   , ?, ?, ?, ?, ? ,' +
                '   datetime(strftime("%s", "now"), "unixepoch", "localtime"))',
                [
                    [ datas.gml, datas.start, datas.end, datas.length, datas.time ]
                ]
            ).fail(function(tx, err) {
                console.log(TRACKING_DATABASE_NAME + ' 테이블 데이터 저장중 오류가 발생했습니다. -> ' + err.message);
            }).done(function(){
                console.log(TRACKING_DATABASE_NAME + ' 테이블에 정상적으로 데이터가 저장되었습니다.');
            });
        },

        /**
         * 찜 데이터 등록
         *
         * @param datas 찜 데이터
         * @param callback 콜백함수
         */
        insertVisit: function(datas, callback) {
            db.query('insert into ' + VISIT_DATABASE_NAME + '(' +
                '   id, ' +
                '   lon, ' +
                '   lat, ' +
                '   name, ' +
                '   regist_dt) ' +
                ' values (' +
                '   ?, ?, ?, ?, ' +
                '   datetime(strftime("%s", "now"), "unixepoch", "localtime"))',
                [
                    [ datas.id, datas.lon, datas.lat, datas.name ]
                ]
            ).fail(function(tx, err) {
                console.log(VISIT_DATABASE_NAME + ' 테이블 데이터 저장중 오류가 발생했습니다. -> ' + err.message);
            }).done(function(){
                console.log(VISIT_DATABASE_NAME + ' 테이블에 정상적으로 데이터가 저장되었습니다.');
                Template7.module.map.addVisitFeature(datas);
                typeof callback === 'function' && callback();
            });
        },

        /**
         * 처음 실행한 앱인지 판단하기 위하여 DB에 데이터를 저장
         *
         * @param data 데이터
         */
        insertAppinfo: function(data) {
            db.query('insert into ' + APP_INFO_DATABASE_NAME + '(init) values (?)',
                [
                    [ data ]
                ]
            ).fail(function(tx, err) {
                console.log(APP_INFO_DATABASE_NAME + ' 테이블 데이터 저장중 오류가 발생했습니다. -> ' + err.message);
            }).done(function(){
                console.log(APP_INFO_DATABASE_NAME + ' 테이블에 정상적으로 데이터가 저장되었습니다.');
            });
        },

        /**
         * 길찾기 데이터 조회
         *
         * @param id 길찾기 아이디
         * @param callback 콜백함수
         */
        selectRouteById: function(id, callback) {
            db.query('select id, start_lon, start_lat, start_name, end_lon, end_lat, end_name, route_type, update_dt,' +
                ' (select ' +
                '    case ' +
                '    WHEN TIME = 0 THEN' +
                '        \'바로 전\'' +
                '    when time < 1440 then ' +
                '        CASE WHEN TIME < 60 ' +
                '               THEN time || \'분 전\'' +
                '               ELSE (TIMe / 60) || \'시간 전\'' +
                '           END' +
                '    else (TIME / 1440) || \'일 전\'' +
                '    end' +
                '   from (select (strftime(\'%s\',\'now\', \'localtime\') - strftime(\'%s\',regist_dt)) / 60 time)) as regist_dt_str ' +
                ' from ' + ROUTE_DATABASE_NAME + ' where id = ?', [id] ).fail(function(tx, err) {
                console.log(ROUTE_DATABASE_NAME + ' 데이터 조회를 실패했습니다. -> ' + err.message);
            }).done(function(route) {
                typeof callback === 'function' && callback(route[0]);
            });
        },

        /**
         * 길찾기 목록 조회
         *
         * @param callback 콜백함수
         */
        selectRoutes: function(callback) {
            db.query('select id, start_lon, start_lat, start_name, end_lon, end_lat, end_name, route_type, update_dt, ' +
                ' (select ' +
                '    case ' +
                '    WHEN TIME = 0 THEN' +
                '        \'바로 전\'' +
                '    when time < 1440 then ' +
                '        CASE WHEN TIME < 60 ' +
                '               THEN time || \'분 전\'' +
                '               ELSE (TIMe / 60) || \'시간 전\'' +
                '           END' +
                '    else (TIME / 1440) || \'일 전\'' +
                '    end' +
                '   from (select (strftime(\'%s\',\'now\', \'localtime\') - strftime(\'%s\',regist_dt)) / 60 time)) as regist_dt_str ' +
                ' from ' + ROUTE_DATABASE_NAME + ' order by id desc', [] ).fail(function(tx, err) {
                console.log(ROUTE_DATABASE_NAME + ' 전체 데이터 조회를 실패했습니다. -> ' + err.message);
            }).done(function(routes) {
                typeof callback === 'function' && callback(routes);
            });
        },

        /**
         * 찜 아이디로 찜데이터 조회
         *
         * @param id 찜 아이디
         * @param callback 콜백함수
         */
        selectVisitById: function(id, callback) {
            db.query('select id, lon, lat, name, type, update_dt, ' +
                ' (select ' +
                '    case ' +
                '    WHEN TIME = 0 THEN' +
                '        \'바로 전\'' +
                '    when time < 1440 then ' +
                '        CASE WHEN TIME < 60 ' +
                '               THEN time || \'분 전\'' +
                '               ELSE (TIMe / 60) || \'시간 전\'' +
                '           END' +
                '    else (TIME / 1440) || \'일 전\'' +
                '    end' +
                '   from (select (strftime(\'%s\',\'now\', \'localtime\') - strftime(\'%s\',regist_dt)) / 60 time)) as regist_dt_str ' +
                ' from ' + VISIT_DATABASE_NAME + ' where id = ?', [id] ).fail(function(tx, err) {
                console.log(VISIT_DATABASE_NAME + ' 데이터 조회를 실패했습니다. -> ' + err.message);
            }).done(function(visit) {
                typeof callback === 'function' && callback(visit[0]);
            });
        },

        /**
         * 찜 목록 조회
         *
         * @param callback 콜백함수
         */
        selectVisits: function(callback) {
            db.query('select id, lon, lat, name, type, update_dt, ' +
                ' (select ' +
                '    case ' +
                '    WHEN TIME = 0 THEN' +
                '        \'바로 전\'' +
                '    when time < 1440 then ' +
                '        CASE WHEN TIME < 60 ' +
                '               THEN time || \'분 전\'' +
                '               ELSE (TIMe / 60) || \'시간 전\'' +
                '           END' +
                '    else (TIME / 1440) || \'일 전\'' +
                '    end' +
                '   from (select (strftime(\'%s\',\'now\', \'localtime\') - strftime(\'%s\',regist_dt)) / 60 time)) as regist_dt_str ' +
                ' from ' + VISIT_DATABASE_NAME + ' order by regist_dt desc', [] ).fail(function(tx, err) {
                console.log(VISIT_DATABASE_NAME + ' 전체 데이터 조회를 실패했습니다. -> ' + err.message);
            }).done(function(visits) {
                typeof callback === 'function' && callback(visits);
            });
        },

        /**
         * 트래킹 목록 조회
         *
         * @param callback 콜백함수
         */
        selectTrackings: function(callback) {
            db.query('select id, gml, start, end, length, tracking_time, ' +
                ' (select ' +
                '    case ' +
                '    WHEN TIME = 0 THEN' +
                '        \'바로 전\'' +
                '    when time < 1440 then ' +
                '        CASE WHEN TIME < 60 ' +
                '               THEN time || \'분 전\'' +
                '               ELSE (TIMe / 60) || \'시간 전\'' +
                '           END' +
                '    else (TIME / 1440) || \'일 전\'' +
                '    end' +
                '   from (select (strftime(\'%s\',\'now\', \'localtime\') - strftime(\'%s\',regist_dt)) / 60 time)) as regist_dt_str ' +
                ' from ' + TRACKING_DATABASE_NAME + ' order by regist_dt desc', [] ).fail(function(tx, err) {
                console.log(TRACKING_DATABASE_NAME + ' 전체 데이터 조회를 실패했습니다. -> ' + err.message);
            }).done(function(trackings) {
                typeof callback === 'function' && callback(trackings);
            });
        },

        /**
         * 트래킹 조회
         *
         * @param callback 콜백함수
         */
        selectTrackingById: function(id, callback) {
            db.query('select id, gml, start, end, length, tracking_time, ' +
                ' (select ' +
                '    case ' +
                '    WHEN TIME = 0 THEN' +
                '        \'바로 전\'' +
                '    when time < 1440 then ' +
                '        CASE WHEN TIME < 60 ' +
                '               THEN time || \'분 전\'' +
                '               ELSE (TIMe / 60) || \'시간 전\'' +
                '           END' +
                '    else (TIME / 1440) || \'일 전\'' +
                '    end' +
                '   from (select (strftime(\'%s\',\'now\', \'localtime\') - strftime(\'%s\',regist_dt)) / 60 time)) as regist_dt_str ' +
                ' from ' + TRACKING_DATABASE_NAME + ' where id = ?', [id] ).fail(function(tx, err) {
                console.log(TRACKING_DATABASE_NAME + ' 데이터 조회를 실패했습니다. -> ' + err.message);
            }).done(function(tracking) {
                typeof callback === 'function' && callback(tracking[0]);
            });
        },

        /**
         * 길찾기 데이터 삭제
         *
         * @param id 길찾기 아이디
         */
        deleteRouteById: function(id) {
            db.rawTx(function(tx) {
               tx.executeSql('delete from ' + ROUTE_DATABASE_NAME + ' where id = ?', [id], function(tx, res) {
                   console.log(ROUTE_DATABASE_NAME + ' 테이블 데이터 삭제에 성공했습니다. -> ' + id);
               }, function(tx, err){
                   console.log(ROUTE_DATABASE_NAME + ' 테이블 데이터 삭제에 실패했습니다. -> ' + err.message);
               })
            });
        },

        /**
         * 트래킹 데이터 삭제
         * @param id 트래킹 아이디
         */
        deleteTrackingById: function(id) {
            db.rawTx(function(tx) {
                tx.executeSql('delete from ' + TRACKING_DATABASE_NAME + ' where id = ?', [id], function(tx, res) {
                    console.log(TRACKING_DATABASE_NAME + ' 테이블 데이터 삭제에 성공했습니다. -> ' + id);
                }, function(tx, err){
                    console.log(TRACKING_DATABASE_NAME + ' 테이블 데이터 삭제에 실패했습니다. -> ' + err.message);
                })
            });
        },

        /**
         * 트래킹 데이터 전체삭제
         */
        deleteTrackings: function() {
            db.rawTx(function(tx) {
                tx.executeSql('delete from ' + TRACKING_DATABASE_NAME, [], function(tx, res) {
                    console.log(TRACKING_DATABASE_NAME + ' 테이블 전체 데이터 삭제에 성공했습니다.');
                }, function(tx, err){
                    console.log(TRACKING_DATABASE_NAME + ' 테이블 전체 데이터 삭제에 실패했습니다. -> ' + err.message);
                })
            });
        },

        /**
         * 길찾기 데이터를 전체 삭제합니다.
         */
        deleteRoutes: function() {
            db.rawTx(function(tx) {
                tx.executeSql('delete from ' + ROUTE_DATABASE_NAME, [], function(tx, res) {
                    console.log(ROUTE_DATABASE_NAME + ' 테이블 전체 데이터 삭제에 성공했습니다.');
                }, function(tx, err){
                    console.log(ROUTE_DATABASE_NAME + ' 테이블 전체 데이터 삭제에 실패했습니다. -> ' + err.message);
                })
            });
        },

        /**
         * 찜 데이터를 전체 삭제합니다.
         */
        deleteVisits: function() {
            db.rawTx(function(tx) {
                tx.executeSql('delete from ' + VISIT_DATABASE_NAME, [], function(tx, res) {
                    console.log(VISIT_DATABASE_NAME + ' 테이블 전체 데이터 삭제에 성공했습니다.');
                }, function(tx, err){
                    console.log(VISIT_DATABASE_NAME + ' 테이블 전체 데이터 삭제에 실패했습니다. -> ' + err.message);
                })
            });
        },

        /**
         * 앱 정보 데이터를 전체 삭제합니다.
         */
        deleteAppInfo: function() {
            db.rawTx(function(tx) {
                tx.executeSql('delete from ' + APP_INFO_DATABASE_NAME, [], function(tx, res) {
                    console.log(APP_INFO_DATABASE_NAME + ' 테이블 전체 데이터 삭제에 성공했습니다.');
                }, function(tx, err){
                    console.log(APP_INFO_DATABASE_NAME + ' 테이블 전체 데이터 삭제에 실패했습니다. -> ' + err.message);
                })
            });
        },

        /**
         * 찜 데이터 삭제
         *
         * @param id 찜 아이디
         * @param callback 콜백함수
         */
        deleteVisitById: function(id, callback) {
            db.rawTx(function(tx) {
                tx.executeSql('delete from ' + VISIT_DATABASE_NAME  + ' where id = ?', [id], function(tx, res) {
                    console.log(VISIT_DATABASE_NAME + ' 테이블 데이터 삭제에 성공했습니다.');
                    Template7.module.map.removeVisitFeature(id);
                    typeof callback === 'function' && callback();
                }, function(tx, err){
                    console.log(VISIT_DATABASE_NAME + ' 테이블 데이터 삭제에 실패했습니다. -> ' + err.message);
                })
            });
        },

        /**
         * 앱 초기화 데이터를 조회합니다.
         *
         * @param callback 콜백함수
         */
        selectAppInfo: function(callback) {
            db.query('select * from ' + APP_INFO_DATABASE_NAME, [] ).fail(function(tx, err) {
                console.log(APP_INFO_DATABASE_NAME + ' 데이터 조회를 실패했습니다. -> ' + err.message);
            }).done(function(appInfo) {
                typeof callback === 'function' && callback(appInfo);
            });
        },

        selectVisitCount: function(callback) {
            db.query('select count(*) as count from ' + VISIT_DATABASE_NAME, [] ).fail(function(tx, err) {
                console.log(VISIT_DATABASE_NAME + ' 방문 카운트 데이터 조회를 실패했습니다. -> ' + err.message);
            }).done(function(datas) {
                typeof callback === 'function' && callback(datas[0]);
            });
        },

        selectTrackingCount: function(callback) {
            db.query('select count(*) as count from ' + TRACKING_DATABASE_NAME, [] ).fail(function(tx, err) {
                console.log(TRACKING_DATABASE_NAME + ' 트래킹 카운트 데이터 조회를 실패했습니다. -> ' + err.message);
            }).done(function(datas) {
                typeof callback === 'function' && callback(datas[0]);
            });
        },

        selectRouteCount: function(callback) {
            db.query('select count(*) as count from ' + ROUTE_DATABASE_NAME, [] ).fail(function(tx, err) {
                console.log(ROUTE_DATABASE_NAME + ' 길찾기 카운트 데이터 조회를 실패했습니다. -> ' + err.message);
            }).done(function(datas) {
                typeof callback === 'function' && callback(datas[0]);
            });
        }
    };
}(myApp));