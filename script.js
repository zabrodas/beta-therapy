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
            onFail();
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
                onOk(data);
                doLampRequest(next.cmd, next.onOk, next.onFail, next.url);
            },
            "error": function() {
                var next=lampRequestInProgress.nextRequest; lampRequestInProgress=null;
                onFail();
                doLampRequest(next.cmd, next.onOk, next.onFail, next.url);
            },
            "dataType": "text",
            "timeout": 1000,
            "nextRequest": null
        };
    
    lampRequestInProgress=settings;
    $.ajax((url==null ? lamp_url : url)+"/"+cmd+".", settings);
}

var lampErrCnt=0;

function lampTest() {
    doLampRequest(
        "test",
        function() {
            $("#lamp-status").hide(500);
            $("#lamp-controls").show(500);
            lampErrCnt=0; setTimeout(lampTest,20000);
        },
        function() {
            $("#lamp-status").show(500);
            $("#lamp-controls").hide(500);
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
                    $("#lamp-controls").show(500);
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
    $("#lamp-controls").hide();
    var x=getHighOfMyIp();
    if (x!=null) findDrunkenLamp_iter(x[0], x[1]>=7 ? x[1]-5 : 2);
    // if (x!=null) findDrunkenLamp_iter(x[0], 170);
}

function showImage(index) {
    $.get("",{"image":index})
}

function playVideo(index) {
    $.get("",{"video":index})
}

function playAudio(index) {
    $.get("",{"audio":index})
}

function pauseAudio() {
    $.get("", { "pauseAudio": "" } );
};
function continueAudio() {
    $.get("", { "continueAudio": "" } );
};
function pauseVideo() {
    $.get("", { "pauseVideo": "" } );
};
function continueVideo() {
    $.get("", { "continueVideo": "" } );
};

function setMainVolume(value) {
    $.get("", { "volume": value/100.0 } );
};
function setAudioVolume(value) {
    $.get("", { "volumeAudio": value/100.0 } );
};
function setVideoVolume(value) {
    $.get("", { "volumeVideo": value/100.0 } );
};


function updatePlaylist(x) {
    playlist=[];
    $.each(x, function(i,v) {
        playlist.push({"index":i,"name":v});
    });
    playlist.sort(function(a,b) { if (a.name>b.name) return 1; if (a.name<b.name) return -1; return 0; });

    var table=$("#playlist");
    table.empty();
    $.each(playlist, function(i,v) {
        var row=$("<tr><td><input type=button class=playbutton value='>'></td></tr>");
        var name=playlist[i].name;
        var splittedName=name.split(".");
        var type=splittedName[splittedName.length-1];
        var fileindex=playlist[i].index;

        var plname=null;
        if (type=="mp4") {
            row.find(".playbutton").click( function() { playVideo(fileindex); });
            plname="video";
        } else if (type=="mp3" || type=="wav") {
            row.find(".playbutton").click( function() { playAudio(fileindex); });
            plname="audio";
        } else if (type=="jpg" || type=="png" || type=="gif") {
            row.find(".playbutton").click( function() { showImage(fileindex); });
            plname="image";
        } else {
            // unknow type
        }
        if (plname!=null) {
            $("#playlist_"+plname).append(row);
            row.find(".playbutton").val(name);
        };
    });
}

function httpGetPlaylist() {
    $.getJSON(
        "",
        {"mfilelist":""}, 
        function( resp ) {  $("#errmsg").hide(); updatePlaylist(resp); }
    ).fail(
        function() {
            $("#errmsg").show().text("Can't get file list from server");
        }
    );
}

$(function() {
    httpGetPlaylist();
    $("#pauseaudio").click( pauseAudio );
    $("#continueaudio").click( continueAudio );
    $("#pausevideo").click( pauseVideo );
    $("#continuevideo").click( continueVideo );
    
//    $("#mainvolume").change(function() { setMainVolume(this.value) } );
//    $("#audiovolume").change(function() { setAudioVolume(this.value) } );
//    $("#videovolume").change(function() { setVideoVolume(this.value) } );
    $("#mainvolume").get(0).oninput=function() { setMainVolume(this.value) };
    $("#audiovolume").get(0).oninput=function() { setAudioVolume(this.value) };
    $("#videovolume").get(0).oninput=function() { setVideoVolume(this.value) };

    findDrunkenLamp();
    $("#lamp-on").click(function() { lampControl("on"); });
    $("#lamp-off").click(function() { lampControl("off"); });
    $("#lamp-blink").click(function() { lampControl("blink"); });
    $("#lamp-sound1").click(function() { lampControl("sound1"); });
    $("#lamp-sound2").click(function() { lampControl("sound2"); });
    $("#lamp-burn").click(function() { lampControl("burn"); });

})


