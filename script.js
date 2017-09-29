var playlist=[];

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
    
    $( "#mainvolume" ).slider({ change: function(event, ui) { setMainVolume(ui.value) } });
    $( "#audiovolume" ).slider({ change: function(event, ui) { setAudioVolume(ui.value) } });
    $( "#videovolume" ).slider({ change: function(event, ui) { setVideoVolume(ui.value) } });

})


