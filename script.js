var playlist=[];
var equipment_port=8080;

var equipment_list={
    "LAMP": {
        "gui": "#lamp-controls",
        "warning": "#lamp-warning"
    },
    "SPOT1": {
        "gui": "#spot-controls",
        "warning": "#spot-warning"
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
    var splittedHost=host.split(".",4);
    if (splittedHost.length!=4) { alert("Can't get own IP:"+splittedHost); return null; }
    var myIpHigh=splittedHost[0]+'.'+splittedHost[1]+'.'+splittedHost[2]+'.';
    return [ myIpHigh, Number(splittedHost[3]) ];
}


var equipmentRequestCnt=0;

function doEquipmentRequestByName(equipment,cmd,onOk,onFail) {
    console.info("doEquipmentRequestByName "+equipment+" "+equipment_list[equipment].url);
    doEquipmentRequestByUrl(equipment_list[equipment].url,cmd,onOk,onFail);
}

function doEquipmentRequestByUrl(url,cmd,onOk,onFail) {
    if (url==null) {
        if (onFail!=null) onFail();
        return;
    }

    if (equipmentRequestCnt>5) {
        console.info("Drop request "+url);
        if (onFail!=null) onFail();
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
                if (onFail!=null) onFail();
            },
            "dataType": "text",
            "timeout": 1000,
            "nextRequest": null
        };

//    console.info("Send request "+url);        
    equipmentRequestCnt++;
    $.ajax(url+"/"+cmd+".", settings);
}

function equipmentTest(equipment) {
    console.info("equipmentTest("+equipment+")");
    doEquipmentRequestByName(
        equipment,
        "test",
        function() {
            console.info("Test "+equipment+" OK");
            equipment_list[equipment].errCnt=0;
            $(equipment_list[equipment].warning).fadeTo(500,0);
            setTimeout(function() { equipmentTest(equipment); },20000);
        },
        function() {
            console.info("Test "+equipment+" Fail. Cnt="+equipment_list[equipment].errCnt);
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

function isAllEquipmentConnected() {
    var result=true;
    $.each(equipment_list, function(n,s) { result=(s.url!=null); return result; });
    return result;
}

var equipmentScanningInProgress=false;

function scanForEquipment_iter(iph,ipl) {
    console.info("Scanning for equipment:"+iph+ipl);
    var url="http://"+iph+ipl+":"+equipment_port;
    $("#scan-ip").text(url);
    doEquipmentRequestByUrl(
        url,
        "test",
        function(data) {
                $.each(equipment_list, function(n,s) {
                    if (data==n) {
                        console.info("data="+data+" n="+n);
                        var needStartTest = (s.url==null);
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
                });
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
            $(s.gui).fadeTo(500,0);
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
    if (x!=null) scanForEquipment_iter(x[0], 170);
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
    $.get("", { "pause": chan } );
}
function continuePlay(chan) {
    $.get("", { "continue": chan } );
}
function play(chan, file, name) {
    $("#play-buttons"+(chan+1)+"-cell .trackname").text(name);
    $.get("", { "play": chan+","+file } );
}

$(function() {
    httpGetPlaylist();

    $("#mainvolume").get(0).oninput=function() { mainVolume(this.value) };
    $("#volume1").get(0).oninput=function() { volume1(this.value) };
    $("#volume2").get(0).oninput=function() { volume2(this.value) };
    $("#crossfade").get(0).oninput=function() { crossfade(this.value) };

    $("#pause1").click(function() { pausePlay(0); });
    $("#play1").click(function() { continuePlay(0); });
    $("#pause2").click(function() { pausePlay(1); });
    $("#play2").click(function() { continuePlay(1); });

    scanForEquipment();
    $("#lamp-on").click(function() { lampControl("on"); });
    $("#lamp-off").click(function() { lampControl("off"); });
    $("#lamp-blink").click(function() { lampControl("blink"); });
    $("#lamp-sound1").click(function() { lampControl("sound1"); });
    $("#lamp-sound2").click(function() { lampControl("sound2"); });
    $("#lamp-burn").click(function() { lampControl("burn"); });

    $("#spot-on").click(function() { spotControl("on"); });
    $("#spot-off").click(function() { spotControl("off"); });

})


