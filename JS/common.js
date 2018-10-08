"use strict";

$(function () {
    if(!isWxBrowser()){
        alert('为了获得更好的体验，请用微信打开');
        // var opened = window.open('qrcode.html', '_self');
        // opened.opener = null;
        // opened.close();
    }
});

/* 版本信息 */
var app_version = '3.1.0';

var index_status = false;

var audio = document.getElementById('voice');/* 语音组件 */

initParam();/* 初始化微信接口参数 */

/* 缓存时间24hour */
var http_cache_time = 86400000;

/* 处理不同尺寸字体/图片大小 */
var dpr = window.devicePixelRatio || 1;

/* 默认模型图片显示比例 */
var scale = {x: 1.0, y: 1.0};

/* 上传目录 */
var upLoadPath = '../';

/* api 位置 */
var host = window.location.host;
if (host.indexOf("10.0.0.11") >= 0) {
    /* connect  local network */
    $.SVE_H5_URL = "http://10.0.0.11/3dNavSystemHospitalH5/";
} else if (host.indexOf("localhost") >= 0) {
    /* other local network machines */
    $.SVE_H5_URL = "http://10.0.0.11/3dNavSystemHospitalH5/";
} else {
    /* remote network */
    $.SVE_H5_URL = "../";
}

function mSetItem(key, value) {
    window.localStorage.setItem(key, value);
}
function mGetItem(key) {
    return window.localStorage.getItem(key);
}

/* 获取当前页面位置[每个栏目页面路径必须规范命名，如#page-department-***],用于自定义浏览器前进后退，设置底部状态栏 */
var pageSymble = (location.href.indexOf('#') > -1) ? location.href.split('#')[1] : 'index';

/* 重定位当前页面位置 */
function reSetNavIcon(pageSymble) {
    $('.bottom_menu ul li a').each(function () {
        if (pageSymble.indexOf($(this).attr('pageid'))>-1) {
            $(".bottom_menu ul li").find('span').removeClass('current');
            $(this).find('span').addClass('current');
            $("title").html($(this).find('span').html());
            $(".bottom_menu ul li div").each(function () {
                var className = $(this).attr('class');
                className = className.replace('_current', '');
                $(this).attr('class', className);
            });
            var className = $(this).find('div').attr('class');
            $(this).find('div').removeClass(className);
            $(this).find('div').addClass(className + "_current");
        }
    });
}
reSetNavIcon(pageSymble); /* 首次页面加载重设底部状态栏 */

/* 监听返回事件[兼容webkit微信] */
var popped = ('state' in window.history), initialURL = location.href;
$(window).bind('popstate', function(event) {
    // Ignore inital popstate that some browsers fire on page load
    var currentURL = location.href;
    var initialPop = !popped && currentURL == initialURL;
    popped = true;

    /* 退出应用 */
    if ( !initialPop && $('.index').hasClass('ui-page-active') ) {
        wx.closeWindow();
    }

    if ( !initialPop && $('#page-self-service').hasClass('ui-page-active') ) {
        var flag1 = true;/* [图像部位]防止二级和一级退页同时发生 */
        var flag2 = true;/* [列表部位]防止二级和一级退页同时发生 */

        /* 自助导诊二级展开历史记录处理 */
        if($('#self-illness-slide').css('display')!='none'){
            flag1 = false;
            window.history.pushState({'title':'自助导诊'}, '自助导诊', '/h5/index.html#page-self-service');
            $('#self-illness-slide').css('display','none');
        }

        /* 自助导诊一级展开历史记录处理 */
        if( $('#self-model-slide').css('left') == '0px' && $('#self-illness-slide').css('display')=='none' && flag1){
            if(JSON.stringify(window.history.state) != '{"title":"自助导诊"}'){
                window.history.pushState({'title':'自助导诊'},  '自助导诊', '/h5/index.html#page-self-service');
            }
            $('.mash').trigger('touchstart');
        }

        /* 自助导诊二级展开历史记录处理 */
        if($('#self-sickness-slide').css('display')!='none'){
            flag2 = false;
            window.history.pushState({'title':'自助导诊'},  '自助导诊', '/h5/index.html#page-self-service');
            $('#self-sickness-slide').css('display','none');
            $('.self-part-sub').removeClass('self-part-sub-current');
        }

        /* 自助导诊一级展开历史记录处理 */
        if( $('#self-part-slide').css('left') == '0px' && $('#self-sickness-slide').css('display')=='none' && flag2){
            if(JSON.stringify(window.history.state) != '{"title":"自助导诊"}'){
                window.history.pushState({'title':'自助导诊'},  '自助导诊', '/h5/index.html#page-self-service');
            }
            $('.mash').trigger('touchstart');
        }
    }

    pageSymble = (location.href.indexOf('#') > -1) ? location.href.split('#')[1] : 'index';
    reSetNavIcon(pageSymble); /* 前进后退重设底部状态栏 */
});

/* 底部栏目状态切换 */
$(".bottom_menu ul li a").click(function () {
    /* 关闭语音 */
    audio.volume = 0;
    Engine.g_pInstance.m_pProject.StopAutoMotion();

    $(".bottom_menu ul li").find('span').removeClass('current');
    $(this).find('span').addClass('current');
    $("title").html($(this).find('span').html());
    $(".bottom_menu ul li div").each(function () {
        var className = $(this).attr('class');
        className = className.replace('_current', '');
        $(this).attr('class', className);
    });
    var className = $(this).find('div').attr('class');
    $(this).find('div').removeClass(className);
    $(this).find('div').addClass(className + "_current");

    /* 忽略四个同级子页的浏览器历史记录 */
    var pageid = $(this).attr('pageid');
    if( pageid != 'index' ){
        window.history.replaceState({'title':'导航'}, '导航', '/h5/index.html');
    }else if(index_status) {
        window.history.replaceState({'title':'导航'}, '导航', '/h5/index.html');
    }else if(!index_status){
        index_status = true;
    }
});

/* 关闭左栏 */
function closeLeftSide() {
    $("#left-slide").animate({right: "-60%"}, 100);
    $(".mash").hide();
}

/* 关闭左栏[全身]部位列表 */
function closePartSide() {
    $("#self-part-slide").animate({left: "-50%"}, 100);
    $(".mash").hide();
}

/* 关闭左栏[模型]部位列表 */
function closeModelSide() {
    $("#self-model-slide").animate({left: "-50%"}, 100);
    $(".mash").hide();
}

/* 获取医院信息 */
$(document).on("pageinit", "#page-hospital", function (event) {
    pageSymble = 'hospital';
    reSetNavIcon(pageSymble);
    var currentTime = new Date().valueOf();
    if (JSON.stringify(mGetItem("page-hospital")) != "null" && parseInt(mGetItem("page-hospital-time")) > currentTime - http_cache_time) {
        var data = mGetItem("page-hospital");
        renderHospital(data);
        console.info('读取医院信息缓存');
    } else {
        $.ajax({
            type: "get",
            url: $.SVE_H5_URL + "api/info/getHospitalH5.php",
            async: true,
            success: function (data) {
                if(data){
                    renderHospital(data);
                    mSetItem("page-hospital", data);
                    mSetItem("page-hospital-time", new Date().valueOf());
                }else{
                    console.info('请求数据出错.');
                }
            },
            errors: function (err) {
                console.warn("get page-hospital data error: " + err);
            }
        });
        console.info('请求医院信息数据');
    }
});

function renderHospital(data) {
    var hospitalMsg = JSON.parse(data).response.list[0];
    var titleA = hospitalMsg.titleA;
    var ContentA = hospitalMsg.ContentA;
    var titleB = hospitalMsg.titleB;
    var ContentB = hospitalMsg.ContentB;
    var titleC = hospitalMsg.titleC;
    var ContentC = hospitalMsg.ContentC;

    $("#page-hospital .hospital_name").html(titleA);
    $("#page-hospital .hospital_content").html(ContentA);
    $("#page-hospital .history .name").html(titleB);
    $("#page-hospital .history-content").html(ContentB);
    $("#page-hospital .kssz .name").html(titleC);
    $("#page-hospital .kssz-content").html(ContentC);
}

/* 获取科室列表 */
$(document).on("pageinit", "#page-departments", function (event) {
    pageSymble = 'departments';
    reSetNavIcon(pageSymble);
    var currentTime = new Date().valueOf();
    if (JSON.stringify(mGetItem("page-departments")) != "null" && parseInt(mGetItem("page-departments-time")) > currentTime - http_cache_time) {
        var data = mGetItem("page-departments");
        renderDepartments(data);
        console.info('读取科室列表缓存');
    } else {
        $.ajax({
            type: "get",
            url: $.SVE_H5_URL + "api/info/getKeShilistH5.php",
            async: true,
            success: function (data) {
                if(data){
                    renderDepartments(data);
                    mSetItem("page-departments", data);
                    mSetItem("page-departments-time", new Date().valueOf());
                    console.info('请求科室列表数据');
                }else{
                    console.info('请求数据出错.');
                }
            },
            errors: function (err) {
                console.warn("get page-departments data error: " + err);
            }
        });
    }
});

function renderDepartments(data) {
    var departments = JSON.parse(data);

    var kID = "";
    var roomID = "";
    var iconUrl = "";
    var roomName = "";
    var department = null;
    for (var k in departments.response) {
        department = departments.response[k];
        kID = department["ID"];
        roomID = department["roomID"];
        iconUrl = department["iconUrl"];
        roomName = department["roomName"];

        var html = "";
        html += "<li><a href='#page-dep-detail' data-id='";
        html += kID + "' data-transition='slide'><center>";
        html += `<img src="images/default.png" data-src="${upLoadPath}${iconUrl}"/></center><p>`;
        html += roomName + "</p></a></li>";

        $("#page-departments .departments_list ul").append(html);
    }
}

/* nav导航主界面初始化 */
$(document).on("pageshow", "#page-index", function (event) {
    pageSymble = 'index';
    reSetNavIcon(pageSymble);
    if (Engine.g_pInstance !== null) {
        Engine.g_pInstance.Start();
    }
    console.info("enter page page-index");
});

/* 获取专家[科室]列表 */
$(document).on("pageinit", "#page-expert", function (event) {
    pageSymble = 'expert';
    reSetNavIcon(pageSymble);
    var currentTime = new Date().valueOf();
    if (JSON.stringify(mGetItem("page-expert")) != "null" && parseInt(mGetItem("page-expert-time")) > currentTime - http_cache_time) {
        var data = mGetItem("page-expert");
        renderExpert(data);
        console.info('读取专家[科室]列表缓存');
    } else {
        $.ajax({
            type: "get",
            url: $.SVE_H5_URL + "api/info/getKeShilistH5.php",
            async: true,
            success: function (data) {
                if(data){
                    renderExpert(data);
                    mSetItem("page-expert", data);
                    mSetItem("page-expert-time", new Date().valueOf());
                }else{
                    console.info('请求数据出错.');
                }
            },
            errors: function (err) {
                console.log("get page-expert data error: " + err);
            }
        });
        console.info('请求专家[科室]列表数据');
    }
});

function renderExpert(data) {
    var departments = JSON.parse(data);

    var kID = "";
    var roomID = "";
    var iconUrl = "";
    var roomName = "";
    var department = null;
    for (var k in departments.response) {
        department = departments.response[k];
        kID = department["ID"];
        roomID = department["roomID"];
        iconUrl = department["iconUrl"];
        roomName = department["roomName"];

        var html = "";
        html += "<li><a href='#page-expert-list' data-id='";
        html += kID + "' data-transition='slide'><center>";
        html += `<img src='images/default.png' data-src='${upLoadPath}${iconUrl}'/></center><p>`;
        html += roomName + "</p></a></li>";

        $("#page-expert .departments_list ul").append(html);
    }
}

/* 获取科室详情列表 */
$(document).on("pageshow", "#page-dep-detail", function (event) {
    pageSymble = 'departments';
    reSetNavIcon(pageSymble);
    var paramID = mGetItem("paramID");
    $.ajax({
        type: "get",
        url: $.SVE_H5_URL + "api/info/getcompanyinfoH5.php?id=" + paramID,
        async: true,
        success: function (data) {
            if(data){
                renderDepDetail(data);
            }else {
                console.info('请求数据出错.');
            }
        },
        errors: function (err) {
            console.warn("get page-dep-detail data error: " + err);
        }
    });
    console.info('请求科室详情数据');
});

function renderDepDetail(data) {
    var keshi = JSON.parse(data);
    var name = keshi["Name"];
    var content = keshi["Detail"];
    var iconUrl = keshi["iconUrl"];

    $("#page-dep-detail .dep_title").html(name);
    $("#page-dep-detail .dep_detail").html(content);

    if (iconUrl === '' || (typeof iconUrl) != 'string') {
        $("#page-dep-detail img").attr("src", "images/hospital_img.png");
    } else {
        $("#page-dep-detail img").attr("src", upLoadPath+iconUrl);
    }
}

/* 获取专家列表 */
$(document).on("pageshow", "#page-expert-list", function (event) {
    pageSymble = 'expert';
    reSetNavIcon(pageSymble);
    var paramID = mGetItem("paramID");
    $.ajax({
        type: "get",
        url: $.SVE_H5_URL + "api/info/getExpertListH5.php?departmentId=" + paramID,
        async: true,
        success: function (data) {
            if(data){
                renderExpertList(data);
            }else{
                console.info('请求数据出错.');
            }
        },
        errors: function (err) {
            console.info("get page-expert-list data error: " + err);
        }
    });
    console.info('请求专家列表数据');

    var lazyLoadImg_experts = new LazyLoadImg({
        el: document.querySelector('#page-expert-list .expert_list ul'),
        mode: 'default',
        time: 300,
        complete: true,
        position: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        before: function () {

        },
        success: function (el) {
            el.classList.add('success')
        },
        error: function (el) {
            el.src = 'images/default.png'
        }
    });
});

function renderExpertList(data) {
    var experts = JSON.parse(data).response;
    var expert = null;
    var html = "";
    var name = "";
    var education = "";
    var position = "";
    var header = "";
    var ID = "";
    var content = "";
    for (var id in  experts) {
        expert = experts[id];
        name = expert["Name"];
        education = expert["Education"];
        position = expert["Position"];
        header = expert["Header"];
        ID = expert["ID"];
        content = expert["Content"];

        html += "<li><a href='#page-expert-detail' data-transition='slide' data-id='" + ID + "'>";
        html += `<img src='images/default.png' data-src='${upLoadPath}${header}' class='header'>`;
        html += "<div class='info_box'>";
        html += "<div class='name'>" + name + "</div>";

        if (position !== '0' && education !== '0') {
            html += "<div class='professor'>" + position + "," + education + "</div>";
        } else if (position !== '0' && education === '0') {
            html += "<div class='professor'>" + position + "</div>";
        } else if (position === '0' && education !== '0') {
            html += "<div class='professor'>" + education + "</div>";
        } else {
            html += "<div class='professor'>医务人员</div>";
        }
        html += "<div class='info'>" + content + "</div>";
        html += "</div></a><div class='clearfix'></div></li>";

        $("#page-expert-list .expert_list ul").html(html);
    }
}

/* 获取专家详情信息 */
$(document).on("pageshow", "#page-expert-detail", function (event) {
    pageSymble = 'expert';
    reSetNavIcon(pageSymble);
    var paramID = mGetItem("paramID");
    $.ajax({
        type: "get",
        url: $.SVE_H5_URL + "api/info/getExpertInfoH5.php?ID=" + paramID,
        async: true,
        success: function (data) {
            if(data){
                renderExpertDetail(data);
            }else{
                console.info('请求数据出错.');
            }
        },
        errors: function (err) {
            console.warn("get expert detail error: " + err);
        }
    });
    console.info('请求专家详情数据');
});

function renderExpertDetail(data) {
    var expert = JSON.parse(data);
    var content = "";
    var header = "";
    var workTime = null;
    var name = "";
    var position = "";
    var education = "";
    var roomId = "";

    name = expert["name"];
    content = expert["content"];
    header = upLoadPath+expert["header"];
    position = expert["position"];
    education = expert["education"];
    workTime = expert["workTime"];
    roomId = expert["roomId"];

    if (position !== '0' && education !== '0') {
        $("#page-expert-detail .personal-msg .expert-msg").text(position + ',' + education);
    } else if (position !== '0' && education === '0') {
        $("#page-expert-detail .personal-msg .expert-msg").text(position);
    } else if (position === '0' && education !== '0') {
        $("#page-expert-detail .personal-msg .expert-msg").text(education);
    }
    var expertMsg = $("#page-expert-detail .personal-msg .expert-msg").text();
    if(expertMsg.length<5){/* 调整table样式 */
        $("#page-expert-detail .personal-msg .expert-msg").css('padding-right','1em');
    }
    $("#page-expert-detail .expert-personal-detail .content").html(content);
    $("#page-expert-detail .department-msg .go-ahead").attr("room-id", roomId);
    $("#page-expert-detail .personal-msg .name").text(name);
    $("#page-expert-detail .head-box img").attr("src",header);

    var arrDate = new Array("Mon", "Tues", "Wed", "Thur", "Fri", "Sat", "Sun");
    if (workTime) {
        for (var idx in workTime[0]) {
            if (workTime[0][idx] === "1") {
                var currentId = arrDate.indexOf(idx) + 1;
                $(".work-table .am td").eq(currentId).children("span").css("visibility", "visible");
            }
        }
        for (var idx in workTime[1]) {
            if (workTime[1][idx] === "1") {
                var currentId = arrDate.indexOf(idx) + 1;
                $(".work-table .pm td").eq(currentId).children("span").css("visibility", "visible");
            }
        }
    }
}

$(document).on("pagehide", "#page-index", function (event) {
    /* 关闭侧边栏 */
    closeLeftSide();
    /* 停止3d场景渲染 */
    if (Engine.g_pInstance !== null) {
        Engine.g_pInstance.Stop();
    }

    /* 暂停搜索蓝牙设备 */
    wx.stopSearchBeacons({
        complete:function(res){
            console.info("close search beancons.");
        }
    });
    console.info("out page page-index");
});

$(document).on("pagehide", "#page-self-service", function (event) {
    /* 关闭侧边栏 */
    closePartSide();
    closeModelSide();
});

$(document).on("pageshow", "#page-expert", function () {
    var lazyLoadImg_zjlb = new LazyLoadImg({
        el: document.querySelector('#page-expert .dep_box .departments_list ul'),
        mode: 'default', //默认模式，将显示原图，diy模式，将自定义剪切，默认剪切居中部分
        time: 300, // 设置一个检测时间间隔
        complete: true, //页面内所有数据图片加载完成后，是否自己销毁程序，true默认销毁，false不销毁
        position: { // 只要其中一个位置符合条件，都会触发加载机制
            top: 0, // 元素距离顶部
            right: 0, // 元素距离右边
            bottom: 0, // 元素距离下面
            left: 0 // 元素距离左边
        },
        before: function () { // 图片加载之前执行方法

        },
        success: function (el) { // 图片加载成功执行方法
            el.classList.add('success')
        },
        error: function (el) { // 图片加载失败执行方法
            el.src = 'images/dep_icon1.png'
        }
    });
});

$(document).on("pageshow", "#page-departments", function () {
    var lazyLoadImg_kslb = new LazyLoadImg({
        el: document.querySelector('#page-departments .dep_box .departments_list ul'),
        mode: 'default',
        time: 300,
        complete: true,
        position: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        before: function () {

        },
        success: function (el) {
            el.classList.add('success');
        },
        error: function (el) {
            el.src = 'images/dep_icon1.png'
        }
    });
});

/* 初始化自助诊导 */
$(document).on("pageshow", "#page-self-service", function () {
    pageSymble = 'self';
    reSetNavIcon(pageSymble);
    initPeoplePic();
});

/* 切换男女图片模型 */
$(document).on('touchstart', '.self-sex-tag li', function () {
    $(this).addClass('self-tag-current').removeClass('self-tag-normal').siblings().removeClass('self-tag-current').addClass('self-tag-normal');
    changePicModel();
});

/* 切换成人儿童图片模型 */
$(document).on('touchstart', '.self-adult-tag li', function () {
    $(this).addClass('self-tag-current').removeClass('self-tag-normal').siblings().removeClass('self-tag-current').addClass('self-tag-normal');
    changePicModel();
});

function changePicModel() {
    var isAdult = $('.self-adult-tag li:first-child').hasClass('self-tag-current');
    /* 默认选择成人选项，如果选择了儿童，isAdult则为false */
    var isMale = $('.self-sex-tag li:first-child').hasClass('self-tag-current');
    /* 默认选择男选项，如果选择了女，isMale则为false */
    var htmlContent = '';
    if (isMale) {
        if (isAdult) {
            htmlContent += `<div class="person-model">
						<img src="images/male_face.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
                        <map name="Map" id="Map">
                            <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="482,161,524,153,565,150,595,161,632,177,640,208,645,238,641,259,636,278,639,299,629,320,620,330,611,343,597,366,572,388,552,392,531,394,513,385,490,368,474,329,462,319,452,302,450,284,450,257,448,210,459,187" />
                            <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="598,375,592,381,585,385,578,392,564,395,549,397,531,397,521,393,503,384,496,380,487,374,490,385,491,400,491,411,488,416,473,423,465,428,451,432,491,435,527,437,559,437,585,435,607,436,621,431,623,422,605,415,596,407" />
                            <area dataid="xiongbu" alt="" title="" href="#胸部" shape="poly" coords="362,557,354,531,361,508,377,471,389,452,416,445,438,436,457,438,487,443,532,443,570,447,601,444,627,437,642,428,668,437,697,444,694,463,692,500,702,534,713,556,705,572,702,608,694,638,683,649,640,652,595,655,532,632,521,648,494,658,455,659,414,663,387,656,374,578" />
                            <area dataid="fubu" alt="" title="" href="#腹部" shape="poly" coords="392,664,407,665,421,666,437,666,456,667,481,665,500,663,514,659,530,650,539,642,558,647,568,651,584,660,603,659,625,658,650,658,670,658,687,654,685,670,680,683,674,701,670,717,664,732,665,749,672,768,678,791,681,814,684,836,687,857,687,876,663,875,634,873,603,874,576,878,537,879,511,877,480,877,454,873,426,871,409,876,398,878,400,822,408,785,416,760,415,728" />
                            <area dataid="shengzhibuwei" alt="" title="" href="#生殖部位" shape="poly" coords="395,884,434,879,453,879,492,884,508,884,540,884,593,884,622,879,654,881,684,883,685,906,685,931,684,947,695,973,694,998,697,1026,695,1033,659,1028,641,1029,615,1032,592,1036,576,1047,552,1047,546,1024,545,1018,536,1018,529,1018,524,1022,523,1032,522,1047,507,1046,478,1042,457,1038,434,1038,405,1039,385,1044,377,1045" />
                            <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="384,1099,386,1074,386,1057,386,1050,404,1049,424,1047,445,1046,460,1043,474,1045,489,1049,504,1052,516,1056,529,1056,527,1046,538,1038,545,1048,555,1058,567,1059,585,1052,602,1049,612,1041,637,1038,657,1037,674,1037,691,1040,698,1045,699,1053,694,1067,690,1089,690,1124,688,1150,679,1183,682,1198,682,1236,676,1266,674,1295,675,1324,678,1351,678,1385,678,1423,665,1484,655,1520,651,1553,645,1580,649,1609,651,1633,646,1657,647,1686,655,1713,666,1733,659,1750,647,1759,618,1756,589,1755,576,1753,577,1718,582,1689,581,1654,589,1625,594,1607,584,1550,577,1496,579,1441,575,1359,569,1285,567,1243,559,1205,560,1138,555,1072,554,1062,524,1060,521,1071,519,1106,518,1149,516,1187,516,1210,509,1262,503,1300,500,1338,499,1380,496,1439,499,1491,496,1535,487,1579,481,1615,489,1632,494,1649,494,1677,498,1708,500,1728,508,1747,500,1759,471,1756,446,1756,430,1759,414,1753,419,1714,430,1686,430,1649,429,1556,418,1504,402,1415,400,1265,398,1183" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="383,659,368,675,357,696,337,729,319,762,304,801,293,827,273,869,250,908,221,951,199,976,202,1018,198,1049,198,1087,190,1099,182,1059,179,1052,170,1075,164,1106,151,1121,149,1089,159,1053,146,1076,135,1105,115,1130,113,1109,127,1067,132,1046,116,1058,101,1082,83,1099,91,1069,112,1032,120,1012,113,1002,96,1011,78,1013,74,1006,93,991,122,973,146,961,161,943,171,915,183,863,209,814,227,777,258,698,283,632,303,593,316,575,319,552,330,526,366,468,377,459,365,480,357,503,347,532,364,572,373,593" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="704,447,700,464,699,484,702,516,715,549,716,562,713,574,710,588,707,603,703,620,699,636,698,648,721,676,737,712,763,754,783,803,796,819,815,864,842,908,869,950,883,967,879,995,886,1030,885,1065,889,1094,896,1087,900,1056,904,1046,909,1065,916,1089,924,1112,936,1107,926,1062,925,1048,931,1060,941,1081,958,1122,968,1124,972,1113,958,1075,948,1038,954,1036,993,1093,1001,1088,999,1075,980,1047,983,1050,965,1002,971,997,983,1003,998,1013,1014,1004,985,983,940,958,915,922,887,833,849,741,793,604,740,491" />
                        </map>
					</div>`;
            console.info('male-adult');
        } else {
            htmlContent += `<div class="person-model">
						<img src="images/child_male_face.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
						    <map name="Map" id="Map">
                                <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="492,505,464,473,457,462,433,451,422,432,426,404,430,397,424,364,430,332,440,296,445,276,439,244,461,258,485,245,511,234,577,230,598,235,626,255,650,284,665,322,668,360,659,393,669,410,667,435,647,457,625,472,607,500,585,511,544,527" />
                                <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="452,570,480,557,499,536,501,516,521,525,535,532,554,530,569,524,581,520,584,530,599,546,621,559,636,570" />
                                <area dataid="xiongbu" alt="" title="" href="#胸部" shape="poly" coords="434,712,428,669,417,628,415,597,418,578,436,574,455,581,493,578,536,578,590,576,631,576,653,576,669,577,665,597,661,619,657,633,650,667,646,697,638,715,627,724,472,722" />
                                <area dataid="fubu" alt="" title="" href="#腹部" shape="poly" coords="420,925,437,855,437,791,434,727,437,720,476,727,535,728,599,733,634,730,647,719,647,741,642,795,646,856,663,913,665,919,596,901,496,901" />
                                <area dataid="shengzhibuwei" alt="" title="" href="#生殖部位" shape="poly" coords="411,930,436,926,464,919,491,912,523,907,554,906,587,906,610,914,627,912,644,922,663,923,673,930,682,945,682,964,668,970,621,977,584,998,558,1021,535,1027,517,1017,476,998,426,976,406,972" />
                                <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="406,1094,404,1038,403,995,402,975,423,978,442,989,472,999,493,1014,524,1031,544,1033,560,1028,578,1015,601,996,630,985,651,978,677,973,680,996,681,1041,667,1113,660,1199,649,1254,660,1305,665,1385,655,1465,639,1527,639,1583,665,1630,703,1658,699,1685,667,1699,621,1696,587,1654,558,1627,566,1572,572,1505,556,1445,556,1366,567,1297,550,1238,546,1153,548,1073,550,1040,532,1037,529,1070,534,1233,517,1309,524,1353,529,1418,514,1489,512,1544,526,1600,530,1623,514,1653,490,1659,484,1668,453,1697,412,1700,387,1689,378,1659,411,1635,444,1591,443,1530,424,1442,418,1379,426,1282,427,1215" />
                                <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="413,578,413,592,411,635,420,669,428,711,424,724,401,781,366,872,333,935,299,1012,278,1053,257,1098,250,1090,224,1103,220,1098,202,1101,212,1069,189,1079,207,1020,184,1011,220,992,246,969,271,923,299,857,362,693,369,641,395,588" />
                                <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="686,582,718,681,738,740,762,795,787,867,810,924,838,974,878,998,900,1004,893,1016,867,1017,881,1050,895,1083,874,1070,862,1051,869,1064,882,1094,868,1106,856,1106,832,1088,828,1101,799,1053,776,1017,766,968,713,860,661,724,653,712,650,705,676,579" />
                            </map>
					</div>`;
            console.info('male-child');
        }
    } else {
        if (isAdult) {
            htmlContent += `<div class="person-model">
						<img src="images/female_face.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
						    <map name="Map" id="Map">
                             <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="436,246,419,248,412,242,403,233,386,217,377,194,397,206,397,194,394,175,411,186,415,172,424,162,439,153,456,146,470,143,489,153,498,170,503,192,506,199,517,198,528,197,522,179,510,148,514,141,543,156,557,191,576,190,625,204,666,246,676,264,686,301,688,334,681,358,668,383,653,413,641,432,626,451,600,445,580,450,570,456,552,463,532,470,514,463,496,452,479,438,469,444,452,444,428,399,419,381,409,346,413,281" />
                             <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="462,498,485,493,495,487,501,479,505,466,510,467,524,472,538,472,549,471,561,467,571,463,576,459,580,459,582,471,584,482,587,487,596,490,607,496,622,501,629,504" />
                             <area dataid="xiongbu" alt="" title="" href="#胸部" shape="poly" coords="443,500,442,511,434,609,429,642,428,676,449,694,498,698,538,689,593,701,641,692,659,660,651,605,641,557,641,504,623,510" />
                             <area dataid="fubu" alt="" title="" href="#腹部" shape="poly" coords="450,794,461,732,455,700,481,701,510,701,536,694,591,706,633,700,623,739,633,793,668,868,639,878,595,888,545,891,504,887,470,882,439,875,418,867" />
                             <area dataid="shengzhibuwei" alt="" title="" href="#生殖部位" shape="poly" coords="406,895,412,869,423,876,445,881,465,886,497,889,518,892,556,895,597,894,621,889,643,881,663,877,671,873,677,890,678,899,623,924,560,968,518,965" />
                             <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="398,1017,397,961,408,898,528,975,555,972,565,971,677,906,686,968,684,1038,670,1170,660,1243,669,1304,663,1435,658,1507,639,1584,634,1628,638,1656,636,1679,658,1725,671,1742,653,1756,625,1757,597,1756,578,1749,584,1719,578,1669,576,1630,576,1537,581,1347,585,1288,550,982,530,983,522,1117,499,1290,496,1313,499,1345,505,1637,507,1660,501,1680,501,1725,507,1746,494,1755,470,1753,453,1753,437,1756,424,1749,419,1737,437,1712,447,1671,449,1623,442,1597,427,1510,414,1354,417,1278,416,1186" />
                             <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="435,504,434,522,431,553,431,590,426,621,423,645,422,670,421,689,402,718,361,767,340,800,329,820,320,844,259,916,246,958,241,993,233,1018,221,1040,212,1052,206,1044,212,1019,212,1010,206,1023,194,1040,190,1052,175,1062,173,1051,188,1019,181,1030,170,1053,166,1060,156,1055,164,1025,164,1017,153,1036,148,1041,142,1037,144,1016,158,992,163,972,152,968,132,962,129,953,153,952,177,940,187,927,202,915,210,902,375,613,410,521" />
                             <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="647,506,646,523,645,558,653,596,660,634,662,674,662,687,680,709,718,761,747,806,766,847,800,888,829,923,835,960,837,998,853,1024,864,1046,877,1051,866,1009,888,1050,905,1069,906,1056,890,1011,907,1048,918,1063,927,1058,909,1004,928,1035,938,1038,929,1002,916,970,946,970,952,958,931,952,899,936,874,920,857,864,705,611,696,551,666,508" />
                         </map>
					</div>`;
            console.info('female-adult');
        } else {
            htmlContent += `<div class="person-model">
						<img src="images/child_female_face.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
						  <map name="Map" id="Map">
                            <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="615,515,547,540,492,526,461,509,445,474,421,439,414,496,420,556,380,622,378,534,381,494,367,440,372,325,388,300,410,304,439,263,485,238,541,222,578,233,623,252,654,281,668,301,688,302,706,324,711,359,704,408,702,455,704,504,707,582,707,596,707,606,712,619,661,564,666,512,677,484,664,444,638,475" />
                            <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="505,533,505,549,505,564,476,583,460,588,444,591,491,593,533,593,574,592,609,590,636,590,589,565,579,545,576,535,557,540,534,543" />
                            <area dataid="xiongbu" alt="" title="" href="#胸部" shape="poly" coords="414,618,436,650,442,671,450,758,469,764,533,770,584,773,627,759,634,744,642,659,649,645,664,614,649,599,626,596,543,597,484,599,442,599,429,603" />
                            <area dataid="fubu" alt="" title="" href="#腹部" shape="poly" coords="436,852,451,802,451,765,462,767,485,771,514,774,538,777,571,777,595,778,612,771,626,765,633,762,634,784,640,829,646,854,662,889,670,929,618,946,549,952,490,952,447,941,418,931,416,919" />
                            <area dataid="shengzhibuwei" alt="" title="" href="#生殖部位" shape="poly" coords="412,933,435,941,466,951,488,955,574,959,614,953,667,937,672,936,673,997,671,1037,668,1064,668,1079,622,1087,571,1087,552,1052,542,1037,531,1048,522,1059,513,1085,502,1093,463,1087,416,1078" />
                            <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="469,1573,449,1494,438,1418,432,1334,435,1275,424,1223,416,1141,415,1084,441,1091,490,1099,512,1097,575,1095,612,1094,667,1086,666,1133,663,1221,655,1273,649,1336,648,1409,618,1564,616,1608,633,1662,613,1692,580,1691,557,1638,554,1584,562,1539,564,1472,570,1367,567,1279,569,1187,570,1097,510,1099,514,1291,521,1546,528,1599,527,1635,515,1668,508,1692,472,1695,458,1680,452,1660" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="409,622,424,642,437,671,441,709,445,748,425,790,395,835,357,908,312,987,319,995,311,1020,301,1039,269,1040,255,1048,236,1038,239,990,253,975,307,857,346,805" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="672,614,687,666,701,721,721,764,742,815,784,876,810,929,828,976,843,988,846,1018,844,1033,820,1044,810,1038,780,1035,761,993,772,987,752,949,638,747,644,675,653,648" />
                         </map>
					</div>`;
            console.info('female-child');
        }
    }
    $('#page-self-service .container').html(htmlContent);
    initPeoplePic();
}

/* 显示或者关闭人体部位列表 */
$(document).on("touchstart", ".self-head-tag", function () {
    window.history.replaceState({'title':'自助导诊'},'自助导诊','/h5/index.html#page-self-service');
    window.history.pushState({'title':'导航'},'导航','/h5/index.html');

    $('#self-part-slide').scrollTop(0);
    var currentTime = new Date().valueOf();
    if (JSON.stringify(mGetItem("body-info")) != "null" && parseInt(mGetItem("body-info-time")) > currentTime - http_cache_time) {
        var data = mGetItem("body-info");
        renderSelfPartSlide(data);
        console.info('读取人体部位列表缓存');
    } else {
        $.ajax({
            type: "get",
            url: $.SVE_H5_URL + `api/info/getBodyInfoList.php`,
            async: true,
            success: function (data) {
                if(data){
                    renderSelfPartSlide(data);
                    mSetItem("body-info", data);
                    mSetItem("body-info-time", new Date().valueOf());
                }else {
                    console.info('请求数据出错.');
                }
            },
            errors: function (err) {
                console.warn("get body-info error: " + err);
            }
        });
        console.info('请求人体部位列表');
    }
    $('#self-part-slide').animate({left: '0'}, 'fast');
    $('.mash').show();
});

function renderSelfPartSlide(data) {
    var parts = JSON.parse(data).response;
    var htmlContent = '';
    for (var i in parts) {
        htmlContent += `<li dataid="${parts[i]['BodyID']}">${parts[i]['Name']}</li>`;
    }
    $('#self-part-slide ul').html(htmlContent);
}

/* [列表]点击部位列表展开二级选项 */
$(document).on('click', '#self-part-slide ul li', function () {
    $('.mash').show();
    $('#self-sickness-slide').hide();
    if (!$(this).hasClass('self-part-sub')) { /* 剔除之前展开的二级选项 */
        $('#self-part-slide ul li.self-part-sub').each(function () {
            $(this).remove();
        });

        var bodyId = $(this).attr('dataid');
        var currentEL = $(this);
        var htmlContent = '';
        var isLastTag = false;
        if($("#self-part-slide ul li:last").is(currentEL)){
            isLastTag = true;
        }

        $.ajax({
            type: "get",
            url: $.SVE_H5_URL + `api/info/getSymptomList.php?bodyId=${bodyId}&sex=0`,
            async: true,
            success: function (data) {
                var subItems = JSON.parse(data).response;
                for (var i in subItems) {
                    htmlContent += `<li class="self-part-sub" dataid="${subItems[i]['ID']}">${subItems[i]['Name']}</li>`;
                }
                currentEL.after(htmlContent);

                if(isLastTag){/* 向上滚动到底，优化体验 */
                    $("#self-part-slide").animate({scrollTop:$("#self-part-slide").height()}, 'fast');
                }
            },
            errors: function (err) {
                console.warn("get self-part-sub-data error: " + err);
            }
        });
    }
});

/* [列表]展开二级选项可能的疾病列表 */
$(document).on('click', '.self-part-sub', function () {
    $(this).addClass('self-part-sub-current').siblings().removeClass('self-part-sub-current');
    var id = $(this).attr('dataid');
    $.ajax({
        type: "get",
        url: $.SVE_H5_URL + `api/info/getSicknessList.php?Id=${id}`,
        async: true,
        success: function (data) {
            if(data){
                $('#self-sickness-slide').show();
                renderSicknessSlide(data);
            }else {
                console.info('请求数据出错.');
            }
        },
        errors: function (err) {
            console.warn("get self-sickness-data error: " + err);
        }
    });
});

function renderSicknessSlide(data) {
    var sickness = JSON.parse(data).response;
    var htmlContent = '';
    var sicknesses = sickness['SicknessList'];
    for (var i in sicknesses) {
        htmlContent += `<a href="#page-self-service-rusult" data-transition="slide"><li dataid="${sicknesses[i]['ID']}">${sicknesses[i]['Name']}</li></a>`;
    }
    $('#self-sickness-slide ul').html(htmlContent);
    mSetItem('sickness', JSON.stringify(sickness['SicknessList']));
}

/* 点击[列表]二级选项后的疾病查找对应的科室 */
$(document).on('click', '#self-sickness-slide li', function () {
    closePartSide();
    $('#self-sickness-slide').hide();

    var sicknessId = $(this).attr('dataid');
    var sickness = JSON.parse(mGetItem('sickness'));
    var rooms = null;
    var htmlContent = `<li class="list-head">自助导诊结果</li>`;
    for (var i in sickness) {
        if (sickness[i]['ID'] == sicknessId) {
            rooms = sickness[i]['RoomList'];
            for (var j in rooms) {
                htmlContent += `<li><span class="self-advice"><span>建议科室：</span><span class="room-name">${rooms[j]['Room_Name']}</span></span><div class="self-go"><span dataid="${rooms[j]['Room_ID']}" class="self-go-ahead">直达科室</span></div></li>`;
            }
            htmlContent += `<div class="self-result-content">${sickness[i]['Content']}</div>`;
        }
    }
    $('#page-self-service-rusult ul').html(htmlContent);
});

/* 点击[图片]中的大致部位显示出有可能想选的部位列表 */
$(document).on('click', '#self-model-slide ul li', function () {
    $(this).addClass('self-model-current').siblings().removeClass('self-model-current');
    var id = $(this).attr('dataid');
    $.ajax({
        type: "get",
        url: $.SVE_H5_URL + `api/info/getSicknessList.php?Id=${id}`,
        async: true,
        success: function (data) {
            if(data){
                $('#self-illness-slide').show();
                renderSelfIllnessSlide(data);
            }else{
                console.log('请求数据出错.');
            }
        },
        errors: function (err) {
            console.warn("get self-illness-data error: " + err);
        }
    });
});

function renderSelfIllnessSlide(data) {
    var illness = JSON.parse(data).response;
    var htmlContent = '';
    for (var i in illness) {
        if (typeof illness[i] == 'object') {
            var ill = null;
            for (var j in illness[i]) {
                ill = illness[i][j];
                htmlContent += `<a href="#page-self-service-rusult" data-transition="slide"><li dataid="${ill['ID']}">${ill['Name']}</li></a>`;
            }
            mSetItem('illness', JSON.stringify(illness[i]));
            /* 缓存疾病列表 */
        }
    }
    $('#self-illness-slide ul').html(htmlContent);
}

/* [图片]点击疾病保存记录 */
$(document).on('click', '#self-illness-slide ul li', function () {
    var illnessId = $(this).attr('dataid');
    closeModelSide();
    $('#self-illness-slide').hide();

    var illness = JSON.parse(mGetItem('illness'));
    var htmlContent = `<li class="list-head">自助导诊结果</li>`;
    var rooms = null;
    for (var i in illness) {
        if (illness[i]['ID'] == illnessId) {
            rooms = illness[i]['RoomList'];
            for (var j in rooms) {
                htmlContent += `<li><span class="self-advice"><span>建议科室：</span><span class="room-name">${rooms[j]['Room_Name']}</span></span><div class="self-go"><span dataid="${rooms[j]['Room_ID']}" class="self-go-ahead">直达科室</span></div></li>`;
            }
            htmlContent += `<div class="self-result-content">${illness[i]['Content']}</div>`;
        }
    }
    $('#page-self-service-rusult ul').html(htmlContent);
});

$(document).on('pageshow', '#page-self-service-rusult', function () {
    pageSymble = 'self';
    reSetNavIcon(pageSymble);
    console.info('enter page-self-service-rusult.');
});

/* 离开自助导诊页面关闭所有当前窗口 */
$(document).on('pagehide', '#page-self-service', function () {
    closePartSide();
    closeModelSide();
    $('#self-illness-slide').hide();
    $('#self-sickness-slide').hide();
});

function initPeoplePic(newScaleX = 0.0, newScaleY = 0.0) {
    if (newScaleX <= 1.0 || newScaleX === 0.0) {
        scale.x = $(window).width() / 1080;
        scale.y = $(window).height() / 1920;
    } else {
        scale.x = newScaleX;
        scale.y = newScaleY;
    }

    $('.container img,.container map').css({"transform": `scale(${scale.x},${scale.y})`});
    var windowWidth = $('#page-self-service img').width() * scale.x;
    var windowHeight = $('#page-self-service img').height() * scale.y;
    $('#page-self-service .person-model').width(windowWidth).height(windowHeight);
}

$(document).on('touchstart', '#page-self-service map area', function () {
    window.history.replaceState({'title':'自助导诊'},'自助导诊','/h5/index.html#page-self-service');
    window.history.pushState({'title':'导航'},'导航','/h5/index.html');

    $('#self-model-slide').scrollTop(0);/* 第二次点击网页不刷新重置位置 */
    var isAdult = $('.self-adult-tag li:first-child').hasClass('self-tag-current');
    var isMale = $('.self-sex-tag li:first-child').hasClass('self-tag-current');
    var bodyId = $(this).attr('dataid') || 'all';
    var peopleType;
    /* 0,1,2,3,4 普通大众，成年男性，成年女性，儿童男性，儿童女性 */
    if (isAdult && isMale) {
        peopleType = 1;
    } else if (isAdult && !isMale) {
        peopleType = 2;
    } else if (!isAdult && isMale) {
        peopleType = 3;
    } else if (!isAdult && !isMale) {
        peopleType = 4;
    } else {
        peopleType = 0;
    }

    $.ajax({
        type: "get",
        url: $.SVE_H5_URL + `api/info/getSymptomList.php?bodyId=${bodyId}&sex=${peopleType}`,
        async: true,
        success: function (data) {
            if(data){
                renderSelfModelSlide(data);
            }else{
                console.info('请求数据出错.');
            }
        },
        errors: function (err) {
            console.warn("get self-part-data error: " + err);
        }
    });
    console.info('请求人体部位相应疾病数据');

    $('#self-model-slide').animate({left: '0%'}, 'fast');
    $('.mash').show();
});

function renderSelfModelSlide(data) {
    var htmlContent = '';
    var bodyParts = JSON.parse(data).response;
    for (var i in bodyParts) {
        htmlContent += `<li dataid="${bodyParts[i]['ID']}">${bodyParts[i]['Name']}</li>`;
    }
    $('#self-model-slide ul').html(htmlContent);
}

$(document).on('touchstart', '.reversal', function () {
    var currentStr = $('.person-model img').attr('src');
    var currentSrc = $('.person-model img').attr('src').split('/');
    var currentPic = currentSrc[currentSrc.length - 1];
    var basePath = currentStr.substr(0, currentStr.length - currentPic.length);

    var male_face = 'male_face.jpg';
    var male_back = 'male_back.jpg';
    var female_face = 'female_face.jpg';
    var female_back = 'female_back.jpg';
    var child_male_face = 'child_male_face.jpg';
    var child_male_back = 'child_male_back.jpg';
    var child_female_face = 'child_female_face.jpg';
    var child_female_back = 'child_female_back.jpg';
    var htmlContent = '';
    switch (currentPic) {
        case male_face:
            htmlContent += `<div class="person-model">
                            <img src="images/male_back.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
                            <map name="Map" id="Map">
                            <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="447,205,483,160,563,145,632,176,645,240,638,273,639,298,623,323,613,342,599,365,539,364,493,363,471,329,450,302" />
                            <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="494,410,595,411,598,369,496,367" />
                            <area dataid="yaobeibu" alt="" title="" href="#腰背部" shape="poly" coords="360,553,372,566,375,589,380,611,388,645,395,669,401,694,413,718,419,742,413,778,405,801,397,828,397,872,427,873,472,869,518,871,562,875,609,876,643,877,665,877,682,874,682,828,674,779,668,727,682,689,692,655,695,627,704,595,709,557,717,545,702,498,694,466,687,445,685,441,654,426,625,417,609,415,541,417,493,414,478,415,438,431,396,444" />
                            <area dataid="tunbugangmen" alt="" title="" href="#臀部及肛门" shape="poly" coords="395,882,387,913,385,945,383,973,379,1003,378,1030,381,1036,425,1029,477,1032,520,1032,543,1035,567,1036,613,1033,651,1031,694,1033,699,992,688,939,685,909,684,882,495,873" />
                            <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="381,1046,415,1040,438,1037,489,1038,522,1039,546,1041,562,1043,597,1043,623,1040,674,1040,695,1042,700,1048,694,1067,692,1096,689,1119,688,1152,683,1181,680,1203,680,1238,678,1263,675,1295,675,1335,677,1382,674,1427,672,1457,666,1492,656,1518,649,1555,645,1586,646,1614,645,1632,649,1652,649,1667,650,1690,650,1703,650,1720,654,1731,659,1743,652,1759,636,1763,618,1772,603,1774,581,1773,568,1752,571,1722,572,1694,578,1665,590,1633,582,1574,577,1465,576,1391,569,1300,565,1257,558,1216,556,1161,557,1123,556,1075,553,1055,541,1055,534,1090,525,1138,521,1170,520,1202,514,1228,509,1261,503,1300,504,1329,501,1358,499,1393,500,1432,497,1478,495,1528,493,1563,490,1597,483,1632,484,1651,496,1664,499,1683,499,1705,502,1727,499,1748,485,1768,468,1778,441,1777,424,1762,415,1738,422,1681,428,1621,411,1507,402,1408,402,1275" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="387,449,384,472,380,485,369,508,365,523,358,547,355,563,362,573,368,599,378,618,383,639,386,654,367,675,352,707,341,729,329,743,315,766,307,786,298,809,287,825,276,854,262,881,242,911,223,940,202,970,202,988,202,1016,198,1034,201,1067,196,1091,187,1094,184,1072,181,1045,174,1071,165,1108,152,1119,148,1097,157,1051,143,1080,134,1112,126,1124,115,1129,112,1113,130,1041,119,1052,102,1079,87,1097,81,1091,107,1035,116,1005,107,1006,93,1011,72,1012,103,978,158,953,189,848,263,687,298,595,313,570,321,540,345,489,364,463" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="695,442,700,462,705,480,713,505,719,532,724,550,716,563,711,587,706,613,698,642,714,664,729,691,739,714,754,737,769,758,778,788,793,817,806,846,839,896,859,928,884,967,882,1004,885,1031,882,1073,891,1089,900,1063,905,1043,913,1068,919,1094,930,1112,936,1092,924,1044,935,1066,947,1088,958,1117,968,1123,972,1109,962,1077,951,1035,963,1045,975,1065,998,1089,998,1070,974,1032,965,997,972,993,981,1002,997,1008,1007,999,985,978,949,960,918,937,898,852,835,718,796,610,750,506,716,453" />
                         </map>
					 </div>`;
            break;
        case male_back:
            htmlContent += `<div class="person-model">
						<img src="images/male_face.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
                        <map name="Map" id="Map">
                            <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="482,161,524,153,565,150,595,161,632,177,640,208,645,238,641,259,636,278,639,299,629,320,620,330,611,343,597,366,572,388,552,392,531,394,513,385,490,368,474,329,462,319,452,302,450,284,450,257,448,210,459,187" />
                            <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="598,375,592,381,585,385,578,392,564,395,549,397,531,397,521,393,503,384,496,380,487,374,490,385,491,400,491,411,488,416,473,423,465,428,451,432,491,435,527,437,559,437,585,435,607,436,621,431,623,422,605,415,596,407" />
                            <area dataid="xiongbu" alt="" title="" href="#胸部" shape="poly" coords="362,557,354,531,361,508,377,471,389,452,416,445,438,436,457,438,487,443,532,443,570,447,601,444,627,437,642,428,668,437,697,444,694,463,692,500,702,534,713,556,705,572,702,608,694,638,683,649,640,652,595,655,532,632,521,648,494,658,455,659,414,663,387,656,374,578" />
                            <area dataid="fubu" alt="" title="" href="#腹部" shape="poly" coords="392,664,407,665,421,666,437,666,456,667,481,665,500,663,514,659,530,650,539,642,558,647,568,651,584,660,603,659,625,658,650,658,670,658,687,654,685,670,680,683,674,701,670,717,664,732,665,749,672,768,678,791,681,814,684,836,687,857,687,876,663,875,634,873,603,874,576,878,537,879,511,877,480,877,454,873,426,871,409,876,398,878,400,822,408,785,416,760,415,728" />
                            <area dataid="shengzhibuwei" alt="" title="" href="#生殖部位" shape="poly" coords="395,884,434,879,453,879,492,884,508,884,540,884,593,884,622,879,654,881,684,883,685,906,685,931,684,947,695,973,694,998,697,1026,695,1033,659,1028,641,1029,615,1032,592,1036,576,1047,552,1047,546,1024,545,1018,536,1018,529,1018,524,1022,523,1032,522,1047,507,1046,478,1042,457,1038,434,1038,405,1039,385,1044,377,1045" />
                            <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="384,1099,386,1074,386,1057,386,1050,404,1049,424,1047,445,1046,460,1043,474,1045,489,1049,504,1052,516,1056,529,1056,527,1046,538,1038,545,1048,555,1058,567,1059,585,1052,602,1049,612,1041,637,1038,657,1037,674,1037,691,1040,698,1045,699,1053,694,1067,690,1089,690,1124,688,1150,679,1183,682,1198,682,1236,676,1266,674,1295,675,1324,678,1351,678,1385,678,1423,665,1484,655,1520,651,1553,645,1580,649,1609,651,1633,646,1657,647,1686,655,1713,666,1733,659,1750,647,1759,618,1756,589,1755,576,1753,577,1718,582,1689,581,1654,589,1625,594,1607,584,1550,577,1496,579,1441,575,1359,569,1285,567,1243,559,1205,560,1138,555,1072,554,1062,524,1060,521,1071,519,1106,518,1149,516,1187,516,1210,509,1262,503,1300,500,1338,499,1380,496,1439,499,1491,496,1535,487,1579,481,1615,489,1632,494,1649,494,1677,498,1708,500,1728,508,1747,500,1759,471,1756,446,1756,430,1759,414,1753,419,1714,430,1686,430,1649,429,1556,418,1504,402,1415,400,1265,398,1183" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="383,659,368,675,357,696,337,729,319,762,304,801,293,827,273,869,250,908,221,951,199,976,202,1018,198,1049,198,1087,190,1099,182,1059,179,1052,170,1075,164,1106,151,1121,149,1089,159,1053,146,1076,135,1105,115,1130,113,1109,127,1067,132,1046,116,1058,101,1082,83,1099,91,1069,112,1032,120,1012,113,1002,96,1011,78,1013,74,1006,93,991,122,973,146,961,161,943,171,915,183,863,209,814,227,777,258,698,283,632,303,593,316,575,319,552,330,526,366,468,377,459,365,480,357,503,347,532,364,572,373,593" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="704,447,700,464,699,484,702,516,715,549,716,562,713,574,710,588,707,603,703,620,699,636,698,648,721,676,737,712,763,754,783,803,796,819,815,864,842,908,869,950,883,967,879,995,886,1030,885,1065,889,1094,896,1087,900,1056,904,1046,909,1065,916,1089,924,1112,936,1107,926,1062,925,1048,931,1060,941,1081,958,1122,968,1124,972,1113,958,1075,948,1038,954,1036,993,1093,1001,1088,999,1075,980,1047,983,1050,965,1002,971,997,983,1003,998,1013,1014,1004,985,983,940,958,915,922,887,833,849,741,793,604,740,491" />
                        </map>
					</div>`;
            break;
        case female_face:
            htmlContent += `<div class="person-model">
						<img src="images/female_back.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
						<map name="Map" id="Map">
                            <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="489,446,528,450,558,450,586,464,598,468,615,456,623,463,638,439,664,380,670,337,677,350,687,332,640,208,593,191,552,189,543,165,506,143,513,168,525,183,515,194,498,196,484,175,445,168,421,179,407,191,391,209,382,202,374,201,377,221,386,235,376,231,366,219,363,235,385,264,401,274,403,290,398,327,404,364,418,400,439,435,467,460,482,464,520,459" />
                            <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="492,467,511,466,525,461,533,457,548,457,561,459,580,471,590,474,590,486,602,496,616,499,602,506,532,507,510,507,486,502,466,501" />
                            <area dataid="yaobeibu" alt="" title="" href="#腰背部" shape="poly" coords="453,503,425,599,433,614,441,635,442,662,445,709,455,761,436,833,414,883,480,878,599,874,670,881,644,807,638,710,644,656,641,616,656,582,650,522,644,505,626,498,612,503,592,509,530,512" />
                            <area dataid="tunbugangmen" alt="" title="" href="#臀部及肛门" shape="poly" coords="410,896,403,924,401,954,398,986,396,1001,412,1010,455,1009,484,1004,516,999,542,998,550,993,569,995,585,1004,595,1011,658,1016,677,1015,685,1007,693,962,683,910,676,887,636,884,573,881,484,885,436,887" />
                            <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="415,1098,404,1014,451,1014,503,1006,536,1005,559,1004,596,1019,632,1019,673,1025,682,1022,680,1061,676,1224,686,1330,695,1388,685,1464,683,1568,686,1772,656,1777,622,1769,621,1695,623,1633,617,1531,604,1465,604,1361,602,1270,573,1191,549,1012,535,1009,530,1084,515,1203,497,1261,483,1301,483,1362,490,1431,480,1511,468,1602,469,1658,476,1685,467,1727,470,1772,436,1781,408,1781,396,1404" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="446,504,438,530,431,566,422,586,420,610,430,633,435,660,434,682,387,744,301,868,260,925,251,988,218,1048,208,1036,182,1064,179,1049,158,1062,166,1032,148,1040,169,973,132,953,186,930,215,909,266,806,373,623,404,523" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="654,505,661,541,662,564,659,601,653,603,648,633,646,666,667,706,730,780,757,830,787,869,820,915,836,1000,865,1047,877,1042,904,1062,910,1059,919,1059,921,1031,939,1036,914,966,953,955,898,933,869,912,759,710,715,634,693,572,676,522" />
                        </map>
					</div>`;
            break;
        case female_back:
            htmlContent += `<div class="person-model">
						    <img src="images/female_face.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
						    <map name="Map" id="Map">
                             <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="436,246,419,248,412,242,403,233,386,217,377,194,397,206,397,194,394,175,411,186,415,172,424,162,439,153,456,146,470,143,489,153,498,170,503,192,506,199,517,198,528,197,522,179,510,148,514,141,543,156,557,191,576,190,625,204,666,246,676,264,686,301,688,334,681,358,668,383,653,413,641,432,626,451,600,445,580,450,570,456,552,463,532,470,514,463,496,452,479,438,469,444,452,444,428,399,419,381,409,346,413,281" />
                             <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="462,498,485,493,495,487,501,479,505,466,510,467,524,472,538,472,549,471,561,467,571,463,576,459,580,459,582,471,584,482,587,487,596,490,607,496,622,501,629,504" />
                             <area dataid="xiongbu" alt="" title="" href="#胸部" shape="poly" coords="443,500,442,511,434,609,429,642,428,676,449,694,498,698,538,689,593,701,641,692,659,660,651,605,641,557,641,504,623,510" />
                             <area dataid="fubu" alt="" title="" href="#腹部" shape="poly" coords="450,794,461,732,455,700,481,701,510,701,536,694,591,706,633,700,623,739,633,793,668,868,639,878,595,888,545,891,504,887,470,882,439,875,418,867" />
                             <area dataid="shengzhibuwei" alt="" title="" href="#生殖部位" shape="poly" coords="406,895,412,869,423,876,445,881,465,886,497,889,518,892,556,895,597,894,621,889,643,881,663,877,671,873,677,890,678,899,623,924,560,968,518,965" />
                             <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="398,1017,397,961,408,898,528,975,555,972,565,971,677,906,686,968,684,1038,670,1170,660,1243,669,1304,663,1435,658,1507,639,1584,634,1628,638,1656,636,1679,658,1725,671,1742,653,1756,625,1757,597,1756,578,1749,584,1719,578,1669,576,1630,576,1537,581,1347,585,1288,550,982,530,983,522,1117,499,1290,496,1313,499,1345,505,1637,507,1660,501,1680,501,1725,507,1746,494,1755,470,1753,453,1753,437,1756,424,1749,419,1737,437,1712,447,1671,449,1623,442,1597,427,1510,414,1354,417,1278,416,1186" />
                             <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="435,504,434,522,431,553,431,590,426,621,423,645,422,670,421,689,402,718,361,767,340,800,329,820,320,844,259,916,246,958,241,993,233,1018,221,1040,212,1052,206,1044,212,1019,212,1010,206,1023,194,1040,190,1052,175,1062,173,1051,188,1019,181,1030,170,1053,166,1060,156,1055,164,1025,164,1017,153,1036,148,1041,142,1037,144,1016,158,992,163,972,152,968,132,962,129,953,153,952,177,940,187,927,202,915,210,902,375,613,410,521" />
                             <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="647,506,646,523,645,558,653,596,660,634,662,674,662,687,680,709,718,761,747,806,766,847,800,888,829,923,835,960,837,998,853,1024,864,1046,877,1051,866,1009,888,1050,905,1069,906,1056,890,1011,907,1048,918,1063,927,1058,909,1004,928,1035,938,1038,929,1002,916,970,946,970,952,958,931,952,899,936,874,920,857,864,705,611,696,551,666,508" />
                         </map>
					    </div>`;
            break;
        case child_male_face:
            htmlContent += `<div class="person-model">
						    <img src="images/child_male_back.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
						    <map name="Map" id="Map">
                            <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="501,508,459,458,433,445,419,431,427,399,434,399,429,375,444,280,464,257,512,237,563,230,606,241,624,255,643,239,646,275,658,300,665,334,664,375,653,404,670,403,669,427,660,445,632,464,591,512" />
                            <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="501,513,525,514,562,514,588,516,585,526,589,543,605,556,634,571,578,575,465,569,457,569,495,540" />
                            <area dataid="yaobeibu" alt="" title="" href="#腰背部" shape="poly" coords="452,668,451,645,454,601,460,572,473,576,512,579,585,580,630,576,632,592,636,643,640,676,651,700,651,709,647,800,642,846,664,917,584,900,528,900,462,909,415,921,436,841,437,773,437,708" />
                            <area dataid="tunbugangmen" alt="" title="" href="#臀部及肛门" shape="poly" coords="414,930,447,919,480,912,508,910,542,907,572,906,594,908,621,913,647,913,657,919,667,922,675,934,679,951,670,963,647,987,628,1007,599,1018,574,1027,549,1027,522,1027,495,1029,463,1023,438,1012,419,998,403,981" />
                            <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="415,1138,407,1084,403,1032,402,996,402,988,413,1002,431,1016,455,1025,486,1032,512,1035,530,1033,545,1032,564,1030,583,1031,609,1024,633,1011,652,998,671,980,679,966,683,994,683,1042,670,1104,657,1195,654,1238,662,1320,663,1393,647,1488,639,1540,637,1585,647,1609,642,1627,640,1645,642,1676,631,1688,599,1688,570,1684,551,1674,553,1633,556,1605,572,1559,572,1502,559,1443,555,1388,560,1345,567,1302,558,1271,552,1222,548,1038,532,1039,533,1250,517,1302,520,1338,528,1388,525,1444,509,1514,515,1580,526,1607,530,1646,536,1671,515,1687,485,1692,442,1679,442,1625,443,1565,428,1452,429,1237,425,1354,425,1421" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="451,568,447,671,426,713,401,794,362,875,302,1010,277,1055,257,1099,250,1088,238,1098,220,1107,204,1105,200,1094,210,1064,191,1080,211,1018,185,1005,209,992,229,977,256,963,287,892,310,816,340,755,359,699,389,597,417,571" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="641,570,677,576,703,614,723,707,749,761,776,833,788,874,820,961,847,977,896,1001,890,1018,868,1015,876,1041,895,1076,892,1083,863,1054,874,1080,885,1100,874,1106,863,1095,859,1108,838,1094,824,1094,800,1055,782,1011,758,941,722,877,680,783,659,720,649,674,639,618" />
                          </map>
					    </div>`;
            break;
        case child_male_back:
            htmlContent += `<div class="person-model">
						    <img src="images/child_male_face.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
						    <map name="Map" id="Map">
                                <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="492,505,464,473,457,462,433,451,422,432,426,404,430,397,424,364,430,332,440,296,445,276,439,244,461,258,485,245,511,234,577,230,598,235,626,255,650,284,665,322,668,360,659,393,669,410,667,435,647,457,625,472,607,500,585,511,544,527" />
                                <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="452,570,480,557,499,536,501,516,521,525,535,532,554,530,569,524,581,520,584,530,599,546,621,559,636,570" />
                                <area dataid="xiongbu" alt="" title="" href="#胸部" shape="poly" coords="434,712,428,669,417,628,415,597,418,578,436,574,455,581,493,578,536,578,590,576,631,576,653,576,669,577,665,597,661,619,657,633,650,667,646,697,638,715,627,724,472,722" />
                                <area dataid="fubu" alt="" title="" href="#腹部" shape="poly" coords="420,925,437,855,437,791,434,727,437,720,476,727,535,728,599,733,634,730,647,719,647,741,642,795,646,856,663,913,665,919,596,901,496,901" />
                                <area dataid="shengzhibuwei" alt="" title="" href="#生殖部位" shape="poly" coords="411,930,436,926,464,919,491,912,523,907,554,906,587,906,610,914,627,912,644,922,663,923,673,930,682,945,682,964,668,970,621,977,584,998,558,1021,535,1027,517,1017,476,998,426,976,406,972" />
                                <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="406,1094,404,1038,403,995,402,975,423,978,442,989,472,999,493,1014,524,1031,544,1033,560,1028,578,1015,601,996,630,985,651,978,677,973,680,996,681,1041,667,1113,660,1199,649,1254,660,1305,665,1385,655,1465,639,1527,639,1583,665,1630,703,1658,699,1685,667,1699,621,1696,587,1654,558,1627,566,1572,572,1505,556,1445,556,1366,567,1297,550,1238,546,1153,548,1073,550,1040,532,1037,529,1070,534,1233,517,1309,524,1353,529,1418,514,1489,512,1544,526,1600,530,1623,514,1653,490,1659,484,1668,453,1697,412,1700,387,1689,378,1659,411,1635,444,1591,443,1530,424,1442,418,1379,426,1282,427,1215" />
                                <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="413,578,413,592,411,635,420,669,428,711,424,724,401,781,366,872,333,935,299,1012,278,1053,257,1098,250,1090,224,1103,220,1098,202,1101,212,1069,189,1079,207,1020,184,1011,220,992,246,969,271,923,299,857,362,693,369,641,395,588" />
                                <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="686,582,718,681,738,740,762,795,787,867,810,924,838,974,878,998,900,1004,893,1016,867,1017,881,1050,895,1083,874,1070,862,1051,869,1064,882,1094,868,1106,856,1106,832,1088,828,1101,799,1053,776,1017,766,968,713,860,661,724,653,712,650,705,676,579" />
                            </map>
					    </div>`;
            break;
        case child_female_face:
            htmlContent += `<div class="person-model">
						    <img src="images/child_female_back.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
						   <map name="Map" id="Map">
                                <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="425,587,404,598,384,612,375,594,375,559,378,515,377,494,363,460,362,427,363,350,372,315,394,299,412,298,428,279,464,251,519,232,554,225,591,237,619,255,650,274,669,300,688,305,708,326,707,414,707,462,705,523,711,586,716,637,712,660,693,612,678,582,665,557,664,536,674,500,677,476,670,453,650,469,642,488,630,507,572,529,553,528,511,525,496,525,475,520,460,509,447,485,440,464,425,450,419,444,411,469" />
                                <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="504,531,519,530,537,530,552,533,573,533,580,536,579,554,578,565,593,578,605,584,573,586,489,586,476,586,504,563" />
                                <area dataid="yaobeibu" alt="" title="" href="#腰背部" shape="poly" coords="443,600,440,619,435,647,441,666,445,697,446,757,453,807,437,859,417,917,428,942,456,945,501,954,620,951,649,942,670,930,661,889,633,785,632,747,637,662,646,642,654,610,639,592,620,588,461,594,452,594,449,594" />
                                <area dataid="tunbugangmen" alt="" title="" href="#臀部及肛门" shape="poly" coords="416,938,435,946,470,957,491,959,617,958,651,950,668,939,673,958,678,989,676,1014,668,1053,662,1085,610,1093,567,1092,556,1055,540,1040,529,1052,522,1063,518,1080,500,1096,461,1094,417,1083,410,978,413,941" />
                                <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="420,1237,417,1088,444,1095,476,1102,509,1098,576,1099,628,1096,667,1092,667,1184,658,1244,653,1293,655,1355,636,1504,620,1555,625,1576,621,1644,577,1648,556,1638,566,1573,566,1534,575,1292,572,1107,510,1102,510,1297,519,1556,523,1565,518,1583,529,1638,504,1652,478,1653,462,1638,460,1578,458,1547,441,1466,430,1317,428,1269" />
                                <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="353,809,375,746,402,652,414,614,440,599,437,620,428,651,435,669,440,697,440,722,442,755,311,987,312,998,322,999,310,1038,305,1043,271,1044,258,1050,235,1040,241,991,255,973,296,890" />
                                <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="637,749,669,808,775,987,771,993,764,994,764,1009,774,1037,813,1039,826,1047,847,1038,843,989,826,974,792,899,748,827,718,755,702,718,684,665,671,615,661,608,649,648,640,699" />
                            </map>
					    </div>`;
            break;
        case child_female_back:
            htmlContent += `<div class="person-model">
						  <img src="images/child_female_face.jpg" alt="" width="1080" height="1920" usemap="#Map"/>
						  <map name="Map" id="Map">
                            <area dataid="toubu" alt="" title="" href="#头部" shape="poly" coords="615,515,547,540,492,526,461,509,445,474,421,439,414,496,420,556,380,622,378,534,381,494,367,440,372,325,388,300,410,304,439,263,485,238,541,222,578,233,623,252,654,281,668,301,688,302,706,324,711,359,704,408,702,455,704,504,707,582,707,596,707,606,712,619,661,564,666,512,677,484,664,444,638,475" />
                            <area dataid="yanjingbu" alt="" title="" href="#咽颈部" shape="poly" coords="505,533,505,549,505,564,476,583,460,588,444,591,491,593,533,593,574,592,609,590,636,590,589,565,579,545,576,535,557,540,534,543" />
                            <area dataid="xiongbu" alt="" title="" href="#胸部" shape="poly" coords="414,618,436,650,442,671,450,758,469,764,533,770,584,773,627,759,634,744,642,659,649,645,664,614,649,599,626,596,543,597,484,599,442,599,429,603" />
                            <area dataid="fubu" alt="" title="" href="#腹部" shape="poly" coords="436,852,451,802,451,765,462,767,485,771,514,774,538,777,571,777,595,778,612,771,626,765,633,762,634,784,640,829,646,854,662,889,670,929,618,946,549,952,490,952,447,941,418,931,416,919" />
                            <area dataid="shengzhibuwei" alt="" title="" href="#生殖部位" shape="poly" coords="412,933,435,941,466,951,488,955,574,959,614,953,667,937,672,936,673,997,671,1037,668,1064,668,1079,622,1087,571,1087,552,1052,542,1037,531,1048,522,1059,513,1085,502,1093,463,1087,416,1078" />
                            <area dataid="tuibu" alt="" title="" href="#腿部" shape="poly" coords="469,1573,449,1494,438,1418,432,1334,435,1275,424,1223,416,1141,415,1084,441,1091,490,1099,512,1097,575,1095,612,1094,667,1086,666,1133,663,1221,655,1273,649,1336,648,1409,618,1564,616,1608,633,1662,613,1692,580,1691,557,1638,554,1584,562,1539,564,1472,570,1367,567,1279,569,1187,570,1097,510,1099,514,1291,521,1546,528,1599,527,1635,515,1668,508,1692,472,1695,458,1680,452,1660" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="409,622,424,642,437,671,441,709,445,748,425,790,395,835,357,908,312,987,319,995,311,1020,301,1039,269,1040,255,1048,236,1038,239,990,253,975,307,857,346,805" />
                            <area dataid="shoubu" alt="" title="" href="#手部" shape="poly" coords="672,614,687,666,701,721,721,764,742,815,784,876,810,929,828,976,843,988,846,1018,844,1033,820,1044,810,1038,780,1035,761,993,772,987,752,949,638,747,644,675,653,648" />
                         </map>
					    </div>`;
            break;
    }
    $('#page-self-service .container').html(htmlContent);
    initPeoplePic();
});

/* page-departments 传参 */
$("#page-departments .departments_list a").live("click", function () {
    mSetItem("paramID", $(this).attr("data-id"));
});

/* page-expert 传参 */
$("#page-expert .departments_list a").live("click", function () {
    mSetItem("paramID", $(this).attr("data-id"));
});

/* page-expert-list 传参 */
$("#page-expert-list .expert_list a").live("click", function () {
    mSetItem("paramID", $(this).attr("data-id"));
});

/* 计算字符个数(含中英) */
function getByteLen(val) {
    var len = 0;
    if(val){
        for (var i = 0; i < val.length; i++) {
            var a = val.charAt(i);
            if (a.match(/[^\x00-\xff]/ig) != null) {
                len += 2;
            } else {
                len += 1;
            }
        }
    }
    return len;
}

function isWxBrowser() {
    var ua =  window.navigator.userAgent.toLowerCase();
    if(ua.match(/MicroMessenger/i) == 'micromessenger'){
        return true;
    }else{
        return false;
    }
}