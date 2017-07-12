/* global window,WeixinJSBridge,AlipayJSBridge*/
(function ( window, undefined ) {
    'use strict';

    var

        document        = window.document,

        location        = window.location,

        sessionStorage  = window.sessionStorage,

        localStorage    = window.localStorage,

        XMLHttpRequest  = window.XMLHttpRequest,

        swal            = window.swal,  //弹出框sweetalert

        Vue             = window.Vue,   //vue框架对象

        Stolg           = {};

    window.bus = new Vue();

    /**
     * 消除字符串两端的空格
     * @param str: 需要操作的字符串
     * @returns string
     */
    Stolg.trim = function( str ) {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };

    //得到基本路径，调用一次则存在session中
    Stolg.getBasePath = function () {
        if( sessionStorage.basePath ) {
            return sessionStorage.basePath;
        }
        var url = location.href.split('/p/');
        if( url.length > 1 ) {
            sessionStorage.basePath = url[0] + '/p/';
            return url[0] + '/p/';
        }
        else {
            url = location.href.split('/test/');
            if( url.length > 1 ) {
                sessionStorage.basePath = url[0] + '/test/';
                return url[0] + '/test/';
            } else {
                sessionStorage.basePath = location.protocol + '://'+location.hostname + '/';
                return location.protocol + '://' + location.hostname + '/';
            }
        }
    };

    //获得一个随机数，发送ajax请求时用到
    Stolg.getRandomId = function() {
        return parseInt( Math.random() * 10000 );
    };

    Stolg.blankFunc = function () {};

    /**
     * @param formObj
     * @returns {string}:格式化的字符串
     */
    Stolg.param = function ( formObj ) {
        var str = '';
        for( var i in formObj ) {
            if( formObj.hasOwnProperty(i) ) {
                str += i + '=' + formObj[i] + '&';
            }
        }
        str = str.substring( 0, str.length - 1 );
        return str;
    };

    //得到href中的参数，转换为一个对象
    Stolg.getParam = function ( url ) {
        var str;
        if( url ) {
            str = '?' +url;
        } else {
            str = location.search;
        }
        if( str === '' || str == null ) {
            return;
        }
        str = str.split('&');
        str[0] = str[0].substring( 1 );
        var obj = {};
        for( var i=0;i<str.length;i++ ) {
            var tmp = str[i].split('=');
            obj[ tmp[0] ] = tmp[1];
        }
        return obj;
    };

    /**
     * ajax方法
     * @param obj:一个对象,里面包含
     * 1.data:          可选,传入参数,默认为空对象
     * 2.urlName:       必填,接口的绝对路径的别名[Store,Auth,WxConfig,WxPay,AliPay,User]或者自定义路径
     * 3.ifName         必填,接口名(interfaceName)
     * 4.async:         可选,false为同步,true为异步,默认为true
     * 5.beforeSend:    可选,发送请求前的函数
     * 6.success:       可选,成功时的回调(接口内content里的id为0)
     * 7.fail:          可选,失败的回调,不填则为空方法(接口内content里的id不为0)
     * 8.error:         可选,服务器或者网络出错时的回调
     * 9.pageRefresh    可选,当服务器返回id为40000(用户未登录)时执行的方法，默认为刷新本页
     * 8.complete:      可选,完成时的回调
     * 9.header:        可选,自定义请求头
     * 10.method:       可选,默认POST
     * **注意：此ajax函数不能玩jsonp，若有需求请改写。
     * 不能提交文件。提交文件请另写原生ajax，比这个好用。
     * 此ajax最常用法为请求接口，静态文件和普通表单提交
     */
    Stolg.ajax = function ( obj ) {
        var isFile = false;
        //非空判断
        if( !obj ) {
            throw new Error('ajax函数传入参数为空');
        }
        if( obj.data && typeof obj.data !== 'object' ) {
            throw new Error('ajax函数参数中data属性不是一个对象');
        }
        if( obj.header && typeof obj.header !== 'object' ) {
            throw new Error('ajax函数参数中header属性不是一个对象');
        }
        if( !obj.urlName ) {
            throw new Error('ajax函数参数中urlName为空');
        }

        //初始化参数
        if( !obj.data ) {
            obj.data = {};
        }
        if( !obj.fail ) {
            obj.fail = this.onFail;
        }
        if( !obj.success ) {
            obj.success = function () {};
        }
        if( !obj.complete ) {
            obj.complete = function () {};
        }
        if( !obj.error ) {
            obj.error = this.onFail;
        }
        if( !obj.beforeSend ) {
            obj.beforeSend = function () {};
        }
        if( !obj.pageRefresh ) {
            obj.pageRefresh = function () {
                location.reload( true );
            };
        }
        if( !obj.header ) {
            obj.header = {};
        }
        if( !obj.method ) {
            obj.method = 'POST';
        }
        if( typeof obj.async === 'undefined' ) {
            obj.async = true;
        } else {
            obj.async = !!obj.async;
        }

        //重置urlName
        var basePath = sessionStorage.basePath || Stolg.getBasePath(),
            ifUrl ='';
        switch( obj.urlName ) {
            case 'Store':
                ifUrl = basePath + 'Interface/StoreHandler.ashx';
                break;
            case 'User':
                ifUrl = basePath + 'Interface/UsersHandler.ashx';
                break;
            case 'Auth':
                ifUrl = basePath + 'Interface/StoreAuth.aspx';
                break;
            case 'WxConfig':
                ifUrl = basePath + 'Interface/wxconfig.ashx';
                break;
            case 'WxPay':
                ifUrl = basePath + 'Interface/WeixinPayHandler.ashx';
                break;
            case 'AliPay':
                ifUrl = basePath + 'Interface/AliPayHandler.ashx';
                break;
            case 'Referee':
                ifUrl = basePath + 'r.aspx';
                break;
            default:
                isFile = true;
                ifUrl = obj.urlName;
        }

        //调用请求
        var http = new XMLHttpRequest();
        var resTemp = {};
        if( obj.method === 'POST' ) {
            http.open( obj.method, ifUrl, obj.async);
        }
        if( obj.method === 'GET' ) {
            if( Stolg.isEmptyObject( obj.data ) ) {
                http.open( obj.method, ifUrl, obj.async);
            } else {
                http.open( obj.method, ifUrl + '?' + Stolg.param( obj.data ), obj.async);
            }
        }
        if( obj.ifName && !isFile ) {
            http.setRequestHeader( 'X-JSON-RPC', obj.ifName );
        }
        var hasContentType = false;
        for( var i in obj.header ) {
            if( obj.header.hasOwnProperty(i) ) {
                if( i === 'Content-Type' ) {
                    hasContentType = true;
                }
                http.setRequestHeader( i, obj.header[i] );
            }
        }
        if( !hasContentType ) {
            http.setRequestHeader( 'Content-Type', 'text/plain;charset=utf-8' );
        }

        //监听请求事件
        http.onreadystatechange = function () {
            if( http.readyState === 4 ) {
                var stat = http.status;
                if( stat === 200 ) {
                    try{
                        JSON.parse( http.responseText );
                    } catch (e) {
                        resTemp.id = 0;
                        resTemp.msg = '';
                        resTemp.data = http.responseText;
                        obj.success( resTemp );
                        obj.complete( resTemp );
                        return;
                    }
                    Stolg.handleRes( http.responseText, obj.success, obj.fail, obj.error, obj.pageRefresh, obj.urlName );
                } else if( stat >= 400 ) {
                    resTemp.id = http.status;
                    resTemp.msg = '请求错误：' + stat;
                    resTemp.data = '';
                    obj.fail( resTemp );
                }
                obj.complete( resTemp );
            }
        };

        obj.beforeSend( http );
        if( !hasContentType ) {
            //普通访问接口
            if( obj.method === 'POST' ) {
                http.send('{\"id\":' + Stolg.getRandomId() + ',\"method\":\"' + (obj.ifName || "" ) + '\",\"params\":' + JSON.stringify( obj.data ) + '}');
            } else {
                http.send( null );
            }
        } else {
            //提交表单数据
            if( obj.header['Content-Type'] === 'application/x-www-form-urlencoded' ) {
                if( obj.method === 'POST' ) {
                    http.send( Stolg.param(obj.data) );
                } else {
                    http.send( null );
                }
            }
        }
    };

    /**
     * 把服务器返回的json数据改成指定的格式
     * @param resText:原始数据
     * @param succ:成功回调
     * @param fail:失败回调
     * @param error:服务器、网络错误回调
     * @param pageRefresh:当服务器返回id为40000(用户未登录)时执行的方法，默认为刷新本页
     * @param urlName:用于判断请求的是哪个接口链接
     */
    Stolg.handleRes = function ( resText, succ, fail, error, pageRefresh, urlName ) {
        var resTemp = {};
        var res = JSON.parse( resText );
        if( res.error ) {
            resTemp.id = -1;
            resTemp.msg = res.error.message;
            resTemp.data = res.error.name;
            resTemp.ext = '';
            error( resTemp );
        } else if( res.result ) {
            resTemp.id = res.result.code;
            resTemp.msg = res.result.msg;
            if( res.result.code > 0 ) {
                if( urlName === 'User' && res.result.code === 40000 ) {
                    sessionStorage.userLogin = 'false';
                    sessionStorage.urlPassed = 'false';
                    sessionStorage.goto = location.href.split('?')[0];
                    location.href = Stolg.getBasePath() + 'Content/user/logPage.html';
                    return;
                } else if( urlName === 'Store' && res.result.code === 40000 ) {
                    //商户如果服务器没有session，本地有的话，就让它重新登录
                    var dt = localStorage.storeLogin || sessionStorage.storeLogin,
                        isLog = false;
                    if( dt ) {
                        dt = JSON.parse( dt );
                        isLog = Stolg.storeLogin( dt.acc, dt.pwd, dt.storeCode );
                    }
                    if( !isLog ) {
                        //如果没有登录，则跳转到index页面，并且清除所有本地缓存
                        sessionStorage.removeItem('storeLogin');
                        sessionStorage.removeItem('storeHome');
                        localStorage.removeItem('storeLogin');
                        document.onreadystatechange = function() {
                            if ( document.readyState === 'complete' ) {
                                swal({
                                    title: '提示',
                                    text: '请先登录',
                                    showCancelButton: false,
                                    confirmButtonColor: '#e7464e',
                                    confirmButtonText: '确定',
                                    closeOnConfirm: true
                                }, function () {
                                    location.replace( Stolg.getBasePath() + 'Content/business/index.html' );
                                });
                            }
                        };
                    } else {
                        //如果登录成功，则自动刷新该页面
                        pageRefresh();
                    }
                    return;
                }
                resTemp.data = '';
                resTemp.ext = '';
                fail( resTemp );
            } else {
                if( res.result.content ) {
                    if( !res.result.content.ds ) {
                        resTemp.data = res.result.content;
                    } else {
                        resTemp.data = Stolg.handleDs( res.result.content );
                    }
                } else {
                    resTemp.data = '';
                }
                if ( res.result.ext ) {
                    resTemp.ext = res.result.ext;
                } else {
                    resTemp.ext = '';
                }
                succ( resTemp );
            }
        } else {
            succ( resText );
        }
    };

    //ajax请求错误后的一般性提示
    Stolg.onFail = function ( res ) {
        swal({
            title: '提示',
            text: res.msg,
            showCancelButton: false,
            confirmButtonColor: '#e7464e',
            confirmButtonText: '确定',
            closeOnConfirm: true
        });
    };

    /**
     * 处理服务器返回数据中，含有ds的对象。
     * @param content content内含有ds，ds内有columns数组和rows数组，columns内为键名，rows内为值
     * @returns {Array} 返回数组内每项都是对象，每个对象的键为columns内的键名，值为rows内的值
     */
    Stolg.handleDs = function ( content ) {
        var col = content.ds.columns;
        var row = content.ds.rows;
        var list = [];
        for (var i = 0; i < row.length; i++) {
            var obj = {};
            for (var j = 0; j < col.length; j++) {
                obj[col[j]] = row[i][j];
            }
            list.push(obj);
        }
        return list;
    };

    /**
     * 格式化日期
     * @param date: 日期的字符串(后台传来的未处理的日期)
     * @returns {string}
     */
    Stolg.dateFormat = function ( date ) {
        var d;
        if( /\s{1}/.test( date ) ) {
            d = ( date || '0000/0/0' ).split(' ')[0].split('/');
        } else if ( /T{1}/.test( date ) ) {
            d = ( date || '0000/0/0' ).split('.')[0].replace('T',' ');
            return d;
        } else {
            d[0] = '0000';
            d[1] = '00';
            d[2] = '00';
        }
        return d.join('/');
    };

    //日期加天数的计算，结果为日期的字符串
    Stolg.calcDate = function ( dateStr, plusDay ) {
        var d = new Date( dateStr ).getTime();
        var plusMills = parseInt( plusDay )*86400000;
        var date = new Date( d + plusMills );
        return date.getFullYear() + '/' + ( date.getMonth() + 1 ) + '/' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();
    };

    //关闭当前页面
    Stolg.closeWindow = function () {
        if( typeof  WeixinJSBridge !== 'undefined' ) {
            WeixinJSBridge.call('closeWindow');
        } else if ( typeof  AlipayJSBridge !== 'undefined' ) {
            AlipayJSBridge.call('closeWebview');
        } else {
            window.close();
        }
    };

    /**
     * 请与getAllAddressInfo方法配合使用，此方法为生成一个对象模板，用于初始化vue里的data
     * @returns {{provinceName: string, cityName: string, districtName: string, streetName: string, detail: string, provinceList: Array, cityList: Array, districtList: Array, streetList: Array}}
     */
    Stolg.getAddressObjTemplate = function () {
        return {
            provinceName: '',
            cityName: '',
            districtName: '',
            streetName: '',
            detail: '',
            provinceList: [],
            cityList: [],
            districtList: [],
            streetList: []
        };
    };

    /**
     * 得到地址列表
     * @param code: 地址编码
     * @param obj: 初始对象
     * @param prop: 对象中的属性名
     * *注意：内部方法，外部请直接调用接口
     */
    Stolg.getAddrList = function ( code, obj, prop ) {
        this.ajax({
            urlName: 'User',
            ifName: 'GetAddress',
            data: { code: code },
            success: function ( res ) {
                obj[prop] = res.data;
            }
        });
    };

    /**
     * 此方法实现了前端页面与后台ajax数据的直接绑定，只要请求成功，则可以立即获取全部的地址信息
     * @param vueObj:vue中data内的地址模板对象，请用getAddressObjTemplate方法获取
     * @param provinceId:省code
     * @param cityId:市code
     * @param districtId:区县code
     * @param streetId:街道code
     * @param detail:详细地址
     */
    Stolg.getAllAddressInfo = function ( vueObj, provinceId, cityId, districtId, streetId, detail ) {
        var info = {
            set pn( x ) {
                vueObj.provinceName = x;
            },
            get pn() {
                return vueObj.provinceName;
            },
            set cn( x ) {
                vueObj.cityName = x;
            },
            get cn() {
                return vueObj.cityName;
            },
            set dn( x ) {
                vueObj.districtName = x;
            },
            get dn() {
                return vueObj.districtName;
            },
            set sn( x ) {
                vueObj.streetName = x;
            },
            get sn() {
                return vueObj.streetName;
            },
            set pl( x ) {
                vueObj.provinceList = x;
                this.pn = Stolg.selectName( x, provinceId );
            },
            get pl() {
                return vueObj.provinceList;
            },
            set cl( x ) {
                vueObj.cityList = x;
                this.cn = Stolg.selectName( x, cityId );
            },
            get cl() {
                return vueObj.cityList;
            },
            set dl( x ) {
                vueObj.districtList = x;
                this.dn = Stolg.selectName( x, districtId );
            },
            get dl() {
                return vueObj.districtList;
            },
            set sl( x ) {
                vueObj.streetList = x;
                this.sn = Stolg.selectName( x, streetId );
            },
            get sl() {
                return vueObj.streetList;
            }
        };
        if( detail ) {
            vueObj.detail = detail;
        }
        this.getAddrList( 0, info, 'pl' );
        this.getAddrList( provinceId, info, 'cl' );
        this.getAddrList( cityId, info, 'dl' );
        this.getAddrList( districtId, info, 'sl' );
    };

    //根据地址code得到地址的name
    Stolg.selectName = function ( x, id ) {
        for( var i=0;i<x.length;i++ ) {
            if( x[i].code === id+'' ) {
                return x[i].name;
            }
        }
    };

    //获取用户地址信息
    Stolg.getUserAddress = function () {
        if( sessionStorage.userAddress ) {
            return JSON.parse( sessionStorage.userAddress );
        } else {
            var tmp = Stolg.getAddressObjTemplate();
            var homeData;
            if( sessionStorage.userHome ) {
                homeData = JSON.parse( sessionStorage.userHome );
            } else {
                homeData = Stolg.userHome();
            }
            Stolg.getAllAddressInfo( tmp, homeData.Province, homeData.City, homeData.DistrictCounty, homeData.StreetTown, homeData.Address );
            return tmp;
        }
    };

    //获取商户地址信息
    Stolg.getStoreAddress = function () {
        if( sessionStorage.storeAddress ) {
            return JSON.parse( sessionStorage.storeAddress );
        } else {
            var tmp = Stolg.getAddressObjTemplate();
            var homeData;
            if( sessionStorage.storeHome ) {
                homeData = JSON.parse( sessionStorage.storeHome );
            } else {
                return '';
            }
            Stolg.getAllAddressInfo( tmp, homeData.province, homeData.city, homeData.districtCounty, homeData.streetTown, homeData.address );
            return tmp;
        }
    };

    /**
     * 会员信息
     * @returns {*}
     */
    Stolg.userHome = function () {
        var homeData;
        this.ajax({
            urlName: 'User',
            ifName: 'Home',
            async: false,
            success: function ( res ) {
                homeData = res.data;
            }
        });
        return homeData;
    };

    /**
     * 得到微信配置
     * @param url: string,注册链接
     * @param jsApiList: array,需要调用的微信接口
     * @returns {{debug: boolean, appId: null, timestamp: null, nonceStr: null, signature: null, jsApiList: *}}
     */
    Stolg.configWx = function ( url, jsApiList ) {
        var wxconfig = {
            appId: null,
            timestamp: null,
            nonceStr: null,
            signature: null,
            jsApiList: jsApiList
        };
        Stolg.ajax({
            urlName: 'WxConfig',
            ifName: 'getWXJssdkUrlConfig',
            async: false,
            data: {
                url: url
            },
            success: function ( res ) {
                var cfgList = JSON.parse( res.data );
                wxconfig.appId = cfgList.AppId;
                wxconfig.timestamp = cfgList.Timestamp;
                wxconfig.nonceStr = cfgList.NonceStr;
                wxconfig.signature = cfgList.Signature;
            },
            fail: function () {
                swal({
                    title: '提示',
                    text: '获取微信配置信息失败',
                    showCancelButton: false,
                    confirmButtonColor: '#e7464e',
                    confirmButtonText: '确定',
                    closeOnConfirm: true
                },function () {
                    wxconfig = null;
                });
            }
        });
        return wxconfig;
    };

    /**
     * 保留两位小数
     * @param x 数字或者内容为数字的字符串
     * @returns 2位小数的数字的字符串
     */
    Stolg.toDecimal2 = function(x) {
        var f = parseFloat(x);
        if (isNaN(f)) {
            return false;
        }
        f = Math.round(x*100)/100;
        var s = f.toString();
        var rs = s.indexOf('.');
        if (rs < 0) {
            rs = s.length;
            s += '.';
        }
        while (s.length <= rs + 2) {
            s += '0';
        }
        return s;
    };

    //商家自动登录
    Stolg.storeSelfLogin = function () {
        var islog = false;
        if( localStorage.storeLogin && !sessionStorage.storeLogin ) {
            var dt = JSON.parse( localStorage.storeLogin );
            islog = this.storeLogin( dt.acc, dt.pwd, dt.storeCode );
        } else if( !localStorage.storeLogin && !sessionStorage.storeLogin ) {
            document.onreadystatechange = function() {
                if ( document.readyState === 'complete' ) {
                    swal({
                        title: '提示',
                        text: '请先登录',
                        showCancelButton: false,
                        confirmButtonColor: '#e7464e',
                        confirmButtonText: '确定',
                        closeOnConfirm: true
                    }, function () {
                        location.replace( Stolg.getBasePath() + 'Content/business/index.html' );
                    });
                }
            };
        } else if( sessionStorage.storeLogin ){
            islog = true;
        }
        return islog;
    };

    //商户登录
    Stolg.storeLogin = function ( acc, pwd, storeCode ) {
        var isLog = false;
        if( !acc ) {
            throw new Error('acc is not defined');
        }
        if( !pwd ) {
            throw new Error('pwd is not defined');
        }
        if( !storeCode ) {
            storeCode = '';
        }
        Stolg.ajax({
            urlName: 'Store',
            ifName: 'Login',
            async: false,
            data: {
                LogName: acc,
                PWD: pwd,
                StoreCode: storeCode
            },
            success: function ( res ) {
                sessionStorage.allStores = JSON.stringify( res.ext );
                var homeData = {};
                if( res.ext.length === 1 ) {
                    homeData = res.ext[0];
                } else {
                    for( var i=0; i<res.ext.length; i++ ) {
                        if( res.msg === res.ext[i].storeCode ) {
                            homeData = res.ext[i];
                        }
                    }
                }
                sessionStorage.storeHome = JSON.stringify( homeData );
                sessionStorage.storeLogin = JSON.stringify({
                    acc: acc,
                    pwd: pwd,
                    storeCode: storeCode
                });
                isLog = true;
            }
        });
        return isLog;
    };

    //用户自动登录
    Stolg.userSelfLogin = function () {
        if( sessionStorage.userLogin !== 'true' ) {
            sessionStorage.goto = location.href;
            location.href = this.getBasePath() + 'Content/user/logPage.html';
            return true;
        }
        return false;
    };

    //用户登陆后获取信息
    Stolg.userGetInfo = function ( RefereeCode ) {
        var param = Stolg.getParam();
        var client = param.client;
        if( client === 'Wechat' ) {
            if( param && param.code ) {
                Stolg.ajax({
                    urlName: 'User',
                    ifName: 'sub_GetOpenidAndAccessToken',
                    async: false,
                    data:{ code: param.code },
                    fail: function ( res ) {
                        document.onreadystatechange = function() {
                            sessionStorage.userLogin = 'false';
                            if ( document.readyState === 'complete' ) {
                                swal({
                                    title: '提示',
                                    text: res.msg,
                                    showCancelButton: false,
                                    confirmButtonColor: '#e7464e',
                                    confirmButtonText: '确定',
                                    closeOnConfirm: true
                                });
                            }
                        };
                    }
                });
                var data = typeof RefereeCode === 'undefined' ?
                    {} : { RefereeCode: RefereeCode };
                Stolg.ajax({
                    urlName: 'User',
                    ifName: 'NoPWDLogin',
                    async: false,
                    data: data,
                    success: function () {
                        sessionStorage.userLogin = 'true';
                    },
                    fail: function ( res ) {
                        sessionStorage.userLogin = 'false';
                        document.onreadystatechange = function () {
                            sessionStorage.userLogin = 'false';
                            if (document.readyState === 'complete') {
                                swal({
                                    title: '提示',
                                    text: res.msg,
                                    showCancelButton: false,
                                    confirmButtonColor: '#e7464e',
                                    confirmButtonText: '确定',
                                    closeOnConfirm: true
                                });
                            }
                        };
                    }
                });
            }
        } else if ( client === 'Ali' ) {
            if (param && param.auth_code) {
                Stolg.ajax({
                    urlName: 'User',
                    ifName: 'GetAlipayUserid',
                    async: false,
                    data: {
                        code: param.auth_code
                    },
                    fail: function (res) {
                        document.onreadystatechange = function () {
                            sessionStorage.userLogin = 'false';
                            if (document.readyState === 'complete') {
                                swal({
                                    title: '提示',
                                    text: res.msg,
                                    showCancelButton: false,
                                    confirmButtonColor: '#e7464e',
                                    confirmButtonText: '确定',
                                    closeOnConfirm: true
                                });
                            }
                        };
                    }
                });
                Stolg.ajax({
                    urlName: 'User',
                    ifName: 'AliNoPWDLogin',
                    async: false,
                    success: function () {
                        sessionStorage.userLogin = 'true';
                    },
                    fail: function (res) {
                        sessionStorage.userLogin = 'false';
                        document.onreadystatechange = function () {
                            if (document.readyState === 'complete') {
                                swal({
                                    title: '提示',
                                    text: res.msg,
                                    showCancelButton: false,
                                    confirmButtonColor: '#e7464e',
                                    confirmButtonText: '确定',
                                    closeOnConfirm: true
                                });
                            }
                        };
                    }
                });
            }
        }
    };

    //获取用户信息
    Stolg.getUserHome = function () {
        if( sessionStorage.userHome ) {
            return JSON.parse( sessionStorage.userHome );
        } else {
            return Stolg.userHome();
        }
    };

    //判断用户登录跳转是否成功
    Stolg.isPassed = function () {
        if( sessionStorage.urlPassed === 'true' ) {
            return true;
        } else {
            var param = this.getParam();
            if( param && param.state === 'pass' ) {
                sessionStorage.urlPassed = 'true';
                return true;
            }
        }
        return false;
    };

    //动态加载js
    Stolg.loadScript = function(url, callback){
        var script = document.createElement('script');
        if( typeof callback === 'function' ) {
            script.onload = function(){
                callback();
            };
        }
        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    };

    //动态加载css
    Stolg.loadCss = function(url, callback){
        var css = document.createElement('link');
        if( typeof callback === 'function' ) {
            css.onload = function(){
                callback();
            };
        }
        css.rel = 'stylesheet';
        css.type = 'text/css';
        css.href = url;
        document.getElementsByTagName('head')[0].appendChild( css );
    };

    //得到系统配置
    Stolg.getSysConfig = function () {
        if( !sessionStorage.sysConfig ) {
            this.ajax({
                urlName: 'Store',
                ifName: 'SysConfig',
                async: false,
                success: function ( res ) {
                    sessionStorage.sysConfig = JSON.stringify( res.data );
                }
            });
        }
        return JSON.parse( sessionStorage.sysConfig );
    };

    //判断一个对象是否为空(内含非枚举类型属性则失效)
    /* jshint ignore:start */
    Stolg.isEmptyObject = function(e) {
        for (var t in e) {
            return !1;
        }
        return !0;
    };
    /* jshint ignore:end */

    //商家优惠券数据规范
    Stolg.getStoreTicketObject = function () {
        return {
            //商家优惠券主要信息
            ticket: {
                ticketId: 0,
                showId: 0,
                salticketId: 0,
                tied: 0,
                ticketName: '',
                ticketType: null,
                storeName: false,
                price: 0,
                limitPrice: 0,
                value: 0,
                discount: 0,
                distance: false
            },
            //右侧按钮
            btn: {
                btnText: '',
                btnDisable: false
            },
            //单号
            billCode: {
                show: false,
                code: ''
            },
            img: {
                id: 0,
                url: Stolg.getBasePath() + 'aspx/ImageThumbnail.aspx',
                height: 100,
                width: 100,
                defaultShow: false  //懒加载最初显示的几张图片为true
            },
            //优惠券下面的添加信息。rows内最大三条，内传入如下形式的数组：
            /*
            [{
                key: 'xxx',     //一栏中左侧显示的内容的名字
                value: 'xxx'    //一栏中左侧显示内容的值
            },{
                key: 'xxx',     //一栏中右侧显示的内容的名字
                value: 'xxx'    //一栏中右侧显示内容的值
            }]
            */
            rows: []
        };
    };

    //获得商家优惠券模板
    Stolg.getStoreTicketComponent = function ( conf ) {
        if( !conf ) {
            conf = {
                clickTicket: Stolg.blankFunc,
                clickBtn: Stolg.blankFunc
            };
        } else {
            if( !conf.clickTicket ) {
                conf.clickTicket = Stolg.blankFunc;
            }
            if( !conf.clickBtn ) {
                conf.clickBtn = Stolg.blankFunc;
            }
        }
        var tmp = sessionStorage.storeTicket;
        if( !tmp ) {
            var basePath = this.getBasePath();
            this.ajax({
                urlName: basePath + 'Content/coupons/template/storeTicketTemplate.html',
                method: 'GET',
                async: false,
                success: function ( res ) {
                    sessionStorage.storeTicket = res.data;
                    tmp = res.data;
                }
            });
        }
        return {
            template: tmp,
            props: {
                model: Object,
                scroll: {
                    type: Number,
                    default: 0
                }
            },
            data: function () {
                return {
                    shown: false
                };
            },
            methods: {
                clickTicket: conf.clickTicket,
                clickBtn: conf.clickBtn,
                clickImg: function ( e ) {
                    window.bus.$emit( 'showDetailPic', e );
                },
                imgErr: Stolg.imgErr
            },
            computed: {
                getSrc: Stolg.getTicketSrc
            }
        };
    };

    //用户优惠券数据规范
    Stolg.getUserTicketObject = function () {
        return {
            ticket: {
                ticketId: 0,
                showId: 0,
                salticketId: 0,
                tied: 0,
                ticketName: '',
                storeName: '',
                ticketType: 1,
                price: 0,
                value: 0,       //减多少元
                limitPrice: 0,
                distance: false
            },
            btn: {
                btnShow: true,
                btnText: '',
                btnDisabled: false,
                textOnBtn: false
            },
            img: {
                id: 0,
                url: Stolg.getBasePath() + 'aspx/ImageThumbnail.aspx',
                height: 100,
                width: 100,
                defaultShow: false  //懒加载最初显示的几张图片为true
            }
        };
    };

    /**
     * 获取用户优惠券的组件
     * @param conf：conf内应该传入clickTicket与clickBtn两个方法
     * @returns 返回一个vue组件对象，直接放入vue内使用
     */
    Stolg.getUserTicketComponent = function ( conf ) {
        if( !conf ) {
            conf = {
                clickTicket: Stolg.blankFunc,
                clickBtn: Stolg.blankFunc
            };
        } else {
            if( !conf.clickTicket ) {
                conf.clickTicket = Stolg.blankFunc;
            }
            if( !conf.clickBtn ) {
                conf.clickBtn = Stolg.blankFunc;
            }
        }
        var tmp = sessionStorage.UserTicket;
        if( !tmp ) {
            var basePath = this.getBasePath();
            this.ajax({
                urlName: basePath + 'Content/coupons/template/userTicketTemplate.html',
                method: 'GET',
                async: false,
                success: function ( res ) {
                    sessionStorage.UserTicket = res.data;
                    tmp = res.data;
                }
            });
        }
        return {
            template: tmp,
            props: {
                model: Object,
                scroll: {
                    type: Number,
                    default: 0
                }
            },
            data: function () {
                return {
                    shown: false
                };
            },
            methods: {
                clickTicket: conf.clickTicket,
                clickBtn: conf.clickBtn,
                clickImg: function ( e ) {
                    window.bus.$emit( 'showDetailPic', e );
                },
                getTicketType: function ( type ) {
                    if( type === 1 ) {
                        return '代金券';
                    } else if ( type === 2 ) {
                        return '实物券';
                    } else {
                        return '折扣券';
                    }
                },
                imgErr: Stolg.imgErr
            },
            computed: {
                getSrc: Stolg.getTicketSrc
            }
        };
    };

    /**
     * 点击查看大图组件
     * @param el: 父组件的id
     * @returns 返回一个可以直接使用的component对象，直接放入vue中使用
     */
    Stolg.getDetailPicComponent = function ( el ) {
        var tmp = sessionStorage.preview;
        if( !tmp ) {
            var basePath = this.getBasePath();
            this.ajax({
                urlName: basePath + 'Content/coupons/template/detailPicTemplate.html',
                method: 'GET',
                async: false,
                success: function ( res ) {
                    sessionStorage.preview = res.data;
                    tmp = res.data;
                }
            });
        }
        var child = document.createElement('show-detail');
        document.getElementById( el ).appendChild( child );
        return {
            template: tmp,
            data: function () {
                return {
                    show: false,
                    src: Stolg.getBasePath() + 'Content/images/blank.png'
                };
            },
            mounted: function () {
                window.bus.$on( 'showDetailPic', function ( e ) {
                    var selectImg = e.target.src,
                        search = selectImg.split('?')[1],
                        paras;
                    if( search ) {
                        paras = Stolg.getParam( search );
                    }
                    if( !selectImg ) {
                        return;
                    } else if( /ImageThumbnail.aspx/.test( selectImg ) ) {
                        if( search ) {
                            this.src = selectImg.split('?')[0] + '?FilesID=' + paras.FilesID;
                        } else {
                            this.src = selectImg;
                        }
                    } else {
                        this.src = selectImg;
                    }
                    this.show = true;
                }.bind(this));
            },
            methods: {
                imgErr: Stolg.imgErr,
                close: function () {
                    this.show = false;
                }
            }
        };
    };

    //用户买券方法
    Stolg.buyTicketWx = function ( model ) {
        if (typeof WeixinJSBridge === 'undefined') {
            document.addEventListener('WeixinJSBridgeReady', Stolg.wxPayApi, false);
        } else {
            this.ajax({
                urlName: 'User',
                ifName: 'GetTicketOrder',
                data: {
                    TicketId: model.ticket.ticketId,
                    ShowID: model.ticket.showId,
                    PayType: 1
                },
                success: function(res) {
                    var wxpar = res.data[0];
                    var tradeNo = res.data[1];
                    wxpar = JSON.parse(wxpar);
                    Stolg.wxPayApi( wxpar, tradeNo, model );
                },
                fail: function ( res ) {
                    swal({
                        title: '提示',
                        text: res.msg,
                        showCancelButton: false,
                        confirmButtonColor: '#e7464e',
                        confirmButtonText: '确定',
                        closeOnConfirm: true
                    });
                    model.btn.btnDisabled= false;
                }
            });
        }
    };

    //微信买券
    Stolg.wxPayApi = function(  wxpar, tradeNo, model  ) {
        WeixinJSBridge.invoke('getBrandWCPayRequest', wxpar,
            function( res ) {
                if ( res.err_msg === 'get_brand_wcpay_request:ok' ) {
                    swal({
                        title: '提示',
                        text: '购买成功!',
                        showCancelButton: false,
                        confirmButtonColor: '#e7464e',
                        confirmButtonText: '确定',
                        closeOnConfirm: false
                    },function () {
                        window.location.replace('random_reduce.html?tradeNo=' + tradeNo );
                    });
                } else {
                    swal({
                        title: '提示',
                        text: '支付失败',
                        showCancelButton: false,
                        confirmButtonColor: '#e7464e',
                        confirmButtonText: '确定',
                        closeOnConfirm: true
                    });
                    if( model ) {
                        model.btn.btnDisabled= false;
                    }
                }
            });
    };

    //支付宝买券
    Stolg.buyTicketAli = function ( model ) {
        this.ajax({
            urlName: 'User',
            ifName: 'GetTicketOrder',
            data: {
                TicketId: model.ticket.ticketId,
                ShowID: model.ticket.showId,
                PayType: 2
            },
            success: function( res ) {
                document.write( res.data );
            },
            fail: function ( res ) {
                swal({
                    title: '提示',
                    text: res.msg,
                    showCancelButton: false,
                    confirmButtonColor: '#e7464e',
                    confirmButtonText: '确定',
                    closeOnConfirm: true
                });
                model.btn.btnDisabled= false;
            },
            error: function ( res ) {
                swal({
                    title: '提示',
                    text: res.msg,
                    showCancelButton: false,
                    confirmButtonColor: '#e7464e',
                    confirmButtonText: '确定',
                    closeOnConfirm: true
                });
                model.btn.btnDisabled= false;
            }
        });
    };

    //用户优惠券图片懒加载
    Stolg.getTicketSrc = function () {
        //真实的缩略图地址
        var src = this.model.img.url +
            '?FilesID=' + this.model.img.id +
            '&Height=' + this.model.img.height +
            '&Width=' + this.model.img.width;
        //如果此图片已经显示了真实图片，则不需要再次请求
        if( this.shown === true ) {
            return src;
        }
        var scroll = this.scroll;
        //优惠券组件的真实dom对象
        var ticket = this.$refs.userTicket || this.$refs.storeTicket;
        if( !ticket ) {
            //未找到dom对象(一般不存在) => 用占位图
            if( this.model.img.defaultShow ) {
                this.shown = true;
                return src;
            } else {
                return Stolg.getBasePath() + 'Content/img/zhanweitu.png';
            }
        } else {
            if( this.model.img.defaultShow ) {
                //默认显示的图片
                this.shown = true;
                return src;
            } else {
                //节点到顶部的距离
                var top = ticket.offsetTop,
                    //是否显示真实图片
                    show = scroll + top < window.innerHeight;
                if( show ) {
                    this.shown = true;
                    return src;
                }
            }
        }
    };

    //优惠券加载图片出错时触发的函数(显示占位图)
    Stolg.imgErr = function ( e ) {
        var img = e.target;
        img.src = Stolg.getBasePath() + 'Content/img/zhanweitu.png';
        img.onerror = null;
    };

    //将工具库挂载到S对象与Stolg对象上
    window.S = window.Stolg = Stolg;

    //vue过滤器：格式化日期为 yyyy-mm-dd hh:MM:ss
    Vue.filter( 'dateFormat', function ( date ) {
        return Stolg.dateFormat( date );
    });

    //vue过滤器：格式化日期为 yyyy-mm-dd
    Vue.filter( 'dateFormatToDay', function ( date ) {
        return Stolg.dateFormat( date ).split(' ')[0];
    });

    //vue过滤器：金钱过滤器
    Vue.filter( 'currency', function ( num, symbol ) {
        symbol = symbol || '¥';
        return symbol + Stolg.toDecimal2( num );
    });

})( window );