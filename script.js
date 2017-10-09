var playlist=[];
var lamp_port=8080;
var lamp_url=null;

function getHighOfMyIp() {
    var a=$("<a></a>");
    a.prop("href",document.location);
    var host=a.prop("hostname");
    var splittedHost=host.split(".",4);
    if (splittedHost.length!=4) { alert("Can't get own IP:"+splittedHost); return null; }
    var myIpHigh=splittedHost[0]+'.'+splittedHost[1]+'.'+splittedHost[2]+'.';
    return [ myIpHigh, Number(splittedHost[3]) ];
}

var lampRequestInProgress=null;

function doLampRequest(cmd,onOk,onFail,url) {
    if (lampRequestInProgress!=null) {
        if (lampRequestInProgress.nextRequest!=null) {
            if (onFail!=null) onFail();
            return;
        }
        lampRequestInProgress.nextRequest={
            "cmd":cmd, "onOk":onOk, "onFail":onFail, "url":url
        }
        return;
    }

    var settings=
        {
            "cache": false,
            "success": function(data) {
                var next=lampRequestInProgress.nextRequest; lampRequestInProgress=null;
                if (onOk!=null) onOk(data);
                if (next!=null) doLampRequest(next.cmd, next.onOk, next.onFail, next.url);
            },
            "error": function() {
                var next=lampRequestInProgress.nextRequest; lampRequestInProgress=null;
                if (onOk!=onFail) onFail();
                if (next!=null) doLampRequest(next.cmd, next.onOk, next.onFail, next.url);
            },
            "dataType": "text",
            "timeout": 1000,
            "nextRequest": null
        };
    
    lampRequestInProgress=settings;
    var u=url==null ? lamp_url : url;
    $("#lamp-ip").text(u);
    $.ajax(u+"/"+cmd+".", settings);
}

var lampErrCnt=0;

function lampTest() {
    doLampRequest(
        "test",
        function() {
            $("#lamp-status").hide(500);
            $("#lamp-controls").fadeTo(500,1);
            lampErrCnt=0; setTimeout(lampTest,20000);
        },
        function() {
            $("#lamp-status").show(500);
            $("#lamp-controls").fadeTo(500,0);
            if (++lampErrCnt>10) findDrunkenLamp();
            setTimeout(lampTest,5000);
        }
    );
}

function lampControl(cmd) {
    doLampRequest(cmd);
}

function findDrunkenLamp_iter(iph,ipl) {
    console.info("LAMP_SEARCH try:"+iph+ipl);
    doLampRequest(
        "test",
        function(data) {
                if (data=="LAMP") {
                    lamp_url="http://"+iph+ipl+":"+lamp_port;
                    console.info("LAMP_FOUND URL="+lamp_url)
                    $("#lamp-status").hide(500);
                    $("#lamp-controls").fadeTo(500,1);
                    lampErrCnt=0;
                    setTimeout(lampTest,20000);
                } else {
                    setting.error();
                }
        },
        function() {
            findDrunkenLamp_iter(iph, ipl<254 ? ipl+1 : 2);
        },
        "http://"+iph+ipl+":"+lamp_port
     );
}


function findDrunkenLamp() {
    $("#lamp-status").show();
    $("#lamp-controls").fadeTo(500,0);
    var x=getHighOfMyIp();
//    if (x!=null) findDrunkenLamp_iter(x[0], x[1]>=7 ? x[1]-5 : 2);
     if (x!=null) findDrunkenLamp_iter(x[0], 170);
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

        row.find(".playbutton1").click(function() { play(0,playlist[i].index); });
        row.find(".playbutton2").click(function() { play(1,playlist[i].index); });

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
function play(chan, file) {
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

    findDrunkenLamp();
    $("#lamp-on").click(function() { lampControl("on"); });
    $("#lamp-off").click(function() { lampControl("off"); });
    $("#lamp-blink").click(function() { lampControl("blink"); });
    $("#lamp-sound1").click(function() { lampControl("sound1"); });
    $("#lamp-sound2").click(function() { lampControl("sound2"); });
    $("#lamp-burn").click(function() { lampControl("burn"); });

})


