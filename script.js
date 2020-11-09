var playlist=[];
var equipment_port=8080;

var equipment_list={

    "LAMP": {
        "gui": "#lamp-controls",
        "warning": "#lamp-warning"
    },

/*
    "SPOT1": {
        "gui": "#spot-controls",
        "warning": "#spot-warning"
    },
*/

    "COMBO1": {
        "gui": "#combo-controls",
        "warning": "#combo-warning"
    }
}

$.each(equipment_list, function(n,s) {
    s.ipl=null;
    s.url=null;
    s.errCnt=0;
})

function getHighOfMyIp() {
    var a=$("<a></a>");
    a.prop("href",document.location);
    var host=a.prop("hostname");
//    host='192.168.1.0';
    var splittedHost=host.split(".",4);
    if (splittedHost.length!=4) { alert("Can't get own IP:"+splittedHost); return null; }
    var myIpHigh=splittedHost[0]+'.'+splittedHost[1]+'.'+splittedHost[2]+'.';
    return [ myIpHigh, Number(splittedHost[3]) ];
}


var equipmentRequestCnt=0;

function doEquipmentRequestByName(equipment,cmd,onOk,onFail) {
//    console.info("doEquipmentRequestByName "+equipment+" "+equipment_list[equipment].url);
    if (equipment_list[equipment]) {
        doEquipmentRequestByUrl(equipment_list[equipment].url,cmd,onOk,onFail);
    }
}

function doEquipmentRequestByUrl(url,cmd,onOk,onFail,noDrop) {
    if (url==null) {
        if (onFail!=null) setTimeout(onFail,1);
        return;
    }

    if (!noDrop && equipmentRequestCnt>5) {
        console.info("Drop request "+url);
        if (onFail!=null) setTimeout(onFail,1);
        return;
    }

    var settings=
        {
            "cache": false,
            "success": function(data) {
                equipmentRequestCnt--;
                if (onOk!=null) onOk(data);
            },
            "error": function() {
                equipmentRequestCnt--;
                if (onFail!=null) setTimeout(onFail,1);
            },
            "dataType": "text",
            "timeout": 1000,
            "nextRequest": null
        };

    console.info("Send request "+url+"/"+cmd);        
    equipmentRequestCnt++;
    $.ajax(url+"/"+cmd+".", settings);
}

function equipmentTest(equipment) {
//    console.info("equipmentTest("+equipment+")");
    doEquipmentRequestByName(
        equipment,
        "test",
        function() {
//            console.info("Test "+equipment+" OK");
            equipment_list[equipment].errCnt=0;
            $(equipment_list[equipment].warning).fadeTo(500,0);
            setTimeout(function() { equipmentTest(equipment); },20000);
        },
        function() {
//            console.info("Test "+equipment+" Fail. Cnt="+equipment_list[equipment].errCnt);
            $(equipment_list[equipment].warning).fadeTo(500,1);
            if (++equipment_list[equipment].errCnt>10) {
                equipment_list[equipment].url=null;
                scanForEquipment();
            } else {
                setTimeout(function() { equipmentTest(equipment); },5000);
            }
        }
    );
}

function lampControl(cmd) {
    doEquipmentRequestByName("LAMP",cmd);
}
function spotControl(cmd) {
    doEquipmentRequestByName("SPOT1",cmd);
}
function doControl(index,value) {
    if (value=="on" || value==1) {
        cmd="on"+index;
    } else if (value=="off" || value==0) {
        cmd="off"+index;
    }
    doEquipmentRequestByName("COMBO1",cmd);
}

var b2h=[];
for (var i=0; i<16; i++) {
    for (var j=0; j<16; j++) {
        var h="0123456789ABCDEF";
        var hh=h[i]+h[j];
        b2h.push(hh);
    }
}

function dmxControl(r,g,b) {
    var rl=Math.round(expColor(r)*255);
    var gl=Math.round(expColor(g)*255);
    var bl=Math.round(expColor(b)*255);
//    $("#combo-warning").text(rl+","+gl+","+bl);
    cmd="dmx=ff"+b2h[rl]+b2h[gl]+b2h[bl]+"0000000000";
    doEquipmentRequestByName("COMBO1",cmd);
}

function dmxControl2(r1,g1,b1, r2,g2,b2) {
    var rl1=Math.round(expColor(r1)*255);
    var gl1=Math.round(expColor(g1)*255);
    var bl1=Math.round(expColor(b1)*255);

    var rl2=Math.round(expColor(r2)*255);
    var gl2=Math.round(expColor(g2)*255);
    var bl2=Math.round(expColor(b2)*255);

//    $("#combo-warning").text(rl+","+gl+","+bl);
    x1="ff"+b2h[rl1]+b2h[gl1]+b2h[bl1]+"000000000000";
    x2="ff"+b2h[rl2]+b2h[gl2]+b2h[bl2]+"000000000000";

    cmd="dmx="+x1+x2;
    doEquipmentRequestByName("COMBO1",cmd);
}


function smokeControl(dur) {
    cmd="smoke"+dur;
    doEquipmentRequestByName("COMBO1",cmd);
}

function isAllEquipmentConnected() {
    var result=true;
    $.each(equipment_list, function(n,s) { result=(s.url!=null); return result; });
    return result;
}

var equipmentScanningInProgress=false;

async function sleep(ms) {
    let p=new Promise((resolve,reject) => {
        setTimeout(resolve,ms);
    });
    await p;
}

async function fastScanForEquipment() {
    var x=getHighOfMyIp();
    iph=x[0];
    console.info("Fast scanning for equipment:"+iph);
    $("#scan-ip").text("Fast scanning for equipment:"+iph+".*");
    let requestsInProgress=0;
    for (let ipl=1; ipl<=255; ipl++) {
        sleep(10);
        let url="http://"+iph+ipl+":"+equipment_port;
        requestsInProgress++;
        doEquipmentRequestByUrl(
            url,"test",
            function (data) {
                requestsInProgress--;
                let s=equipment_list[data];
                if (s) {
                    let n=data;
                    let needStartTest = (s.url==null);
                    s.url=url;
                    s.ipl=ipl;
                    s.errCnt=0;
                    if (needStartTest) {
                        setTimeout(function() { equipmentTest(n); },1000);
                        console.info("Equipment "+n+" found: "+url);
                    } else {
                        console.info("Equipment "+n+" update: "+url);
                    }
                }
            },
            function() {
                requestsInProgress--;
            },
            true
        );
    }
}

function scanForEquipment_iter(iph,ipl) {
    console.info("Scanning for equipment:"+iph+ipl);
    let url="http://"+iph+ipl+":"+equipment_port;
    $("#scan-ip").text(url);
    doEquipmentRequestByUrl(
        url,
        "test",
        function(data) {
                let s=equipment_list[data];
                if (s) {
                    let n=data;
                    console.info("data="+data+" n="+n);
                    let needStartTest = (s.url==null);
                    s.url=url;
                    s.ipl=ipl;
                    s.errCnt=0;
                    if (needStartTest) {
                        setTimeout(function() { equipmentTest(n); },1000);
                        console.info("Equipment "+n+" found: "+url);
                    } else {
                        console.info("Equipment "+n+" update: "+url);
                    }
                };
                equipmentGuiCtrl();
                if (isAllEquipmentConnected()) {
                    $("#equipmentScanning").hide(500);
                    equipmentScanningInProgress=false;
                } else {
                    scanForEquipment_iter(iph, ipl<254 ? ipl+1 : 2);
                }
        },
        function() {
            scanForEquipment_iter(iph, ipl<254 ? ipl+1 : 2);
        }
     );
}

function equipmentGuiCtrl() {
    $.each(equipment_list, function(n,s) {
        if (s.url==null) {
//            $(s.gui).fadeTo(500,0);
            $(s.gui).fadeTo(500,1);
        } else {
            $(s.gui).fadeTo(500,1);
        }
    });
}

function scanForEquipment() {
    equipmentGuiCtrl();
    if (equipmentScanningInProgress) return;
    equipmentScanningInProgress=true;
    $("#equipmentScanning").show();
    var x=getHighOfMyIp();
//    if (x!=null) scanForEquipment_iter(x[0], x[1]>=7 ? x[1]-5 : 2);
    if (x!=null) {
//        scanForEquipment_iter(x[0], x[1]>=7 ? x[1]-5 : 2);
        scanForEquipment_iter(x[0], 100);
    } else {    // test mode
        $.each(equipment_list, function(n,s) {
            $(s.gui).fadeTo(500,1);
        });
    }
}

function playByName(chan, name) {
    $.each(playlist, function(i,v) {
        if (playlist[i].name.startsWith(name)) {
            play(chan,playlist[i].index, playlist[i].name);
        }
    });
}

function updatePlaylist(x) {
    playlist=[];
    $.each(x, function(i,v) {
        playlist.push({"index":i,"name":v});
    });
    playlist.sort(function(a,b) { if (a.name>b.name) return 1; if (a.name<b.name) return -1; return 0; });

    var table=$("#playlist");
//    table.empty();
    $.each(playlist, function(i,v) {
        var row=$("<div><input type=button class='playbutton playbutton1' value='>'><input type=button class='playbutton playbutton2' value='>'></div>");
        var name=playlist[i].name;
        var splittedName=name.split(".");
        var type=splittedName[splittedName.length-1];
        var fileindex=playlist[i].index;
        var name1=name.substring(0,name.length/2);
        var name2=name.substring(name1.length);
        row.find(".playbutton1").val("<-- "+name1);
        row.find(".playbutton2").val(name2+" -->");

        row.find(".playbutton1").click(function() { play(0,playlist[i].index, playlist[i].name); });
        row.find(".playbutton2").click(function() { play(1,playlist[i].index, playlist[i].name); });

        $("#playlist").append(row);
    });
    onResizeWindow();
}

function httpGetPlaylist() {
    $("#errmsg").show().text("Загрузка списка треков...");

    $.getJSON(
        "",
        {"mfilelist":""}, 
        function( resp ) {  $("#errmsg").hide(); updatePlaylist(resp); }
    ).fail(
        function() {
            $("#errmsg").show().text("Ошибка при загрузке списка треков");
        }
    );
}

function mainVolume(value) {
    $.get("", { "setMainVolume": value/100.0 } );
};

var setVolume1Request=null;
var setVolume1Inprogress=false;
function volume1(value) {
    if (setVolume1Inprogress) {
        setVolume1Request=value;
    } else {
        setVolume1Inprogress=true;
        var cf=$("#crossfade").val()/100.0;
        cf = (cf<=0.5) ? 1.0 : (1.0-cf)*2.0;
        var v=value/100.0*cf;
        $.get("", { "setVolume": "0,"+v })
        .always(function() {
            setVolume1Inprogress=false;
            if (setVolume1Request!=null) { var r=setVolume1Request; setVolume1Request=null; volume1(r); }
        });
    }
};

var setVolume2Request=null;
var setVolume2Inprogress=false;
function volume2(value) {
    if (setVolume2Inprogress) {
        setVolume2Request=value;
    } else {
        setVolume2Inprogress=true;
        var cf=$("#crossfade").val()/100.0;
        cf = (cf>=0.5) ? 1.0 : cf*2.0;
        var v=value/100.0*cf;
        $.get("", { "setVolume": "1,"+v })
        .always(function() {
            setVolume2Inprogress=false;
            if (setVolume2Request!=null) { var r=setVolume2Request; setVolume2Request=null; volume2(r); }
        });
    }
};
function crossfade(value) {
    volume1($("#volume1").val());
    volume2($("#volume2").val());
}

function pausePlay(chan) {
    $.get("", { "pause": chan } )
    .fail(
        () =>{ $.get("", { "pause": chan } ); }
    );
}
function continuePlay(chan) {
    $.get("", { "continue": chan } )
    .fail(
        () =>{ $.get("", { "continue": chan } ); }
    );
}
function play(chan, file, name) {
    $("#play-buttons"+(chan+1)+"-cell .trackname").text(name);
    $.get("", { "play": chan+","+file } )
    .fail(
        () => { $.get("", { "play": chan+","+file } ); }
    );
}

function onChangeDmx(c) {
    var r=c._r/255;
    var g=c._g/255;
    var b=c._b/255;
    dmxControl(r,g,b);
}

function onResizeWindow() {
    var w=$(window).width();
    var h=$(window).height();
    var hh=4; // $("#tabs ul").height();
    $("#leftColon").height(h-6-hh);
    $("#playlist").height(h-$("#controls").height()-6-hh);
}



$(function() {

//    $("#ver").text("v1");

    $( "#tabs" ).tabs();

    $("#dmx").spectrum({
        color: "#000",
        flat: true,
        showInput: true,
        showPalette: true,
        showInput: false,
        palette: [
            ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
            ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
            ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
            ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
            ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
            ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
            ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
            ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
        ],
        clickoutFiresChange: true,
        showButtons: false,
        move: function(c) { onChangeDmx(c); },
        show: function(c) { onChangeDmx(c); },
        hide: function(c) { onChangeDmx(c); },
        beforeShow: function(c) { onChangeDmx(c); },
    });

    httpGetPlaylist();

    $("#mainvolume").get(0).oninput=function() { mainVolume(this.value) };
    $("#volume1").get(0).oninput=function() { volume1(this.value) };
    $("#volume2").get(0).oninput=function() { volume2(this.value) };
    $("#crossfade").get(0).oninput=function() { crossfade(this.value) };

    $("#pause1").click(function() { pausePlay(0); });
    $("#play1").click(function() { continuePlay(0); });
    $("#pause2").click(function() { pausePlay(1); });
    $("#play2").click(function() { continuePlay(1); });

//    fastScanForEquipment();
    scanForEquipment();
    $("#lamp-on").click(function() { lampControl("on"); });
    $("#lamp-off").click(function() { lampControl("off"); });
    $("#lamp-blink").click(function() { lampControl("blink"); });
    $("#lamp-sound1").click(function() { lampControl("sound1"); });
    $("#lamp-sound2").click(function() { lampControl("sound2"); });
    $("#lamp-burn").click(function() { lampControl("burn"); });

    $("#spot-on").click(function() { spotControl("on"); });
    $("#spot-off").click(function() { spotControl("off"); });

    $("#do1").change(function() { doControl(1,$(this).get(0).checked); });
    $("#do2").change(function() { doControl(2,$(this).get(0).checked); });
    $("#do3").change(function() { doControl(3,$(this).get(0).checked); });
    $("#do4").change(function() { doControl(4,$(this).get(0).checked); });

    $("#smoke input").click(function() { smokeControl(this.value); });

    $(window).resize(onResizeWindow);
    onResizeWindow();
})

