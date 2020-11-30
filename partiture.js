$(function() {
    var n=1;
    $(".part-cell-number").each(function(i,e) {
        $(e).text(n); n=n+1;
    });

    $("a[f]").each(function(i,e) {
        e=$(e);
        var f=e.attr("f");
        e.attr("href","javascript:void(0)");
        e.click(function() { eval(f); return false; });
    });
});

// rgb1 - 

var partTransitionTimer=null;
let do1cmd;
function doControl1(cmd, force) {
    if (do1cmd!=cmd || force) {
        do1cmd=cmd;
        doControl(1,cmd);
    }
}

function coloredLights(r1,g1,b1, r2,g2,b2) {
    dmxControl2(r1,g1,b1, r2,g2,b2);
    if (g1>=0.0 && b1>=0.1) {
        doControl1(1);
    } else {
        doControl1(0);
    }
}

function partStopTransition() {
    if (partTransitionTimer) {
        clearTimeout(partTransitionTimer);
        partTransitionTimer=null;
    }
}

function partTransition(start, end, duration, func, done) {
    partStopTransition()

    var tstep=500;

    if (duration<=2*tstep || start==end) {
        func(end);
        done()
        return;
    }

    var nsteps=duration/tstep;
    var vstep=(end-start)/nsteps;
    var next=start+vstep;
    if ( (vstep>0 && next<=end) || (vstep<0 || next>=end) ) {
        func(start);
        partTransitionTimer=setTimeout(function() { partTransition(next,end,duration-tstep,func,done); }, tstep);
    } else {
        func(end);
        done();
    }
}

function setAllLights(r1,g1,b1, r2,b2,g2, lamp, spot1, spot2) {
    partStopTransition();
    coloredLights(r1,g1,b1, r2,b2,g2);
    lampControl(lamp);
    doControl(2,spot1);
    doControl(3,spot2);
}

function partBlackout() {
    stopLampaTiming();
    setAllLights(0,0,0, 0,0,0, "off", "off", "off");
    playByName(1, "i3");
    doControl1(0,true); doControl(2,0); doControl(3,0); doControl(4,0);
}

function partDark() {
    stopLampaTiming();
    setAllLights(0,0,0, 0,0,0, "off", "off", "off");
    playByName(1, "i3");
}

function partSilent() {
    pausePlay(0); pausePlay(1);
    mainVolume(100);
    $("#crossfade").val(50);
    volume1(75); volume2(75);
}

function partStopMusic() {
    pausePlay(0); pausePlay(1);
}

function partPark() {
    partStopTransition(); lampControl("off"); doControl(2,"off"); doControl(3,"off");
    playByName(1,"i1"); 
    partTransition(0, 1, 10000,
        function(v) { coloredLights(0,v/2,v, 0,0,0); },
        function() { }
    );
}

function partInit() {
    partSilent();
    partBlackout();
}

function partBegin() {
    setAllLights(0,0,0, 0,0,0, "off", "off", "off")
    volume1(100); playByName(0, "a1");
    setTimeout(function() { partPark() },10000);
}

let lampaTimer=null;
let lampaTimerIndex1,lampaTimerIndex2;
lampaTimig=[
    [ "0:00", "on" ],
    [ "0:18", "sound1" ],
    [ "0:26", "sound1" ],
    [ "0:33", "sound2" ],
    [ "0:44", "sound1" ],
    [ "0:54", "sound2" ],
    [ "1:03", "sound1" ],
    [ "1:11", "sound1" ],
    [ "1:26", "sound1" ],
    [ "1:35", "off" ],
    [ "1:38", "blink" ],
    [ "1:42", "sound1" ],
    [ "1:49", "sound2" ],
    [ "1:55", "sound1" ],
    [ "2:00", "sound2" ],
    [ "2:09", "burn" ],
    [ "2:11", null ]
]
for (let e of lampaTimig) { // convert to ms
    let x=e[0].split(":");
    e[0]=parseInt(x[0],10)*60+parseInt(x[1],10);
}
function stopLampaTiming(dontCtrl) {
    console.info('stopLampaTiming');
    if (lampaTimer) {
        clearInterval(lampaTimer);
        lampaTimer=null;
    }
    if (!dontCtrl) lampControl("off");
}
function lampTimingAction() {
    console.info(`lampTimingAction=${lampaTimerIndex1}, ${lampaTimerIndex2}`);
    for (;;) {
        let e=lampaTimig[lampaTimerIndex1];
        if (!e) {
            stopLampaTiming(true);
            break;
        }
        if (lampaTimerIndex2<e[0]) break;
        if (e[1]) {
            lampControl(e[1]);
        } else {
            playByName(1, "i3");
        }
        lampaTimerIndex1++;
    }
    lampaTimerIndex2++;
}
function startLampaTiming() {
    stopLampaTiming();
    console.info('startLampaTiming');
    lampaTimerIndex1=lampaTimerIndex2=0;
    lampaTimer=setInterval(lampTimingAction,1000);
}


function partEtudeLampa() {
    setAllLights(0,0.5,1, 0,0,0, "off", "off", "off")
    partTransition(1, 0, 5000, 
        function(v) {
            volume1(v*100); 
            coloredLights(0,v/2,v, 0,0,0);
        }, 
        function() {
            coloredLights(0,0,0, 0,0,0);
            playByName(0,"a2"); startLampaTiming();
            volume1(100); playByName(1,"i2");
        }
    );
}
function partLampSnd1() {
    lampControl("sound1");
}
function partLampSnd2() {
    lampControl("sound2");
}
function partLampExplosion() {
    lampControl("burn"); setTimeout(function() { playByName(1,"i3"); }, 2000);
}
function partLightIn() {
    partStopTransition(); lampControl("off");
    doControl(2,"off"); doControl(3,"off");
    partTransition(0, 1, 15000, 
        function(v) { coloredLights(0,0,0, v,v,v); }, 
        function() {
            setAllLights(0,0,0, 1,1,1, "off", "on", "off")
        }
    );
}

function partPreapringTea() {
    playByName(0,"a9"); volume1(75);
}

function partPreparingTeaFadeOut() {
    partTransition(75, 0, 10000, 
        function(v) { volume1(v); }, 
        function() {
            pausePlay(0);
        }
    );
}
function partIntermedia1() {
    volume1(100); playByName(0, "a1");
    partPark();
}

function partAct2() {
    pausePlay(0); playByName(1, "i3");
    setAllLights(0,0,0, 1,1,1, "off", "on", "on")
}

function partIntermedia2() {
    doControl(2,"off"); doControl(3,"off");
    volume1(50); playByName(0, "a1");
    partTransition(0, 0.5, 3000, 
      function(v) {
        coloredLights(0,v/2,v, 1-v,1-v,1-v);
      },
      function() {
        playByName(1,"i1"); 
      }
    );
}

function partIntermedia2End() {
    pausePlay(0); playByName(1, "i3");
    setAllLights(0,0,0, 1,1,1, "off", "on", "on")
}

function partMonologMama() {
    setAllLights(0,0,0, 1,1,1, "off", "on", "on")
    volume1(50); playByName(0, "a5");
}

function partMonologMamaEnd() {
    partTransition(50, 0, 3000, 
        function(v) { volume1(v); }, 
        function() {
            pausePlay(0);
        }
    );
}

function partMonologFinal() {
    setAllLights(0,0,0, 1,1,1, "off", "on", "on")
    volume1(50); playByName(0, "a1");
}

function partMonologFinalEnd() {
    partStopTransition(); lampControl("off"); doControl(2,"off"); doControl(3,"off");
    partTransition(1, 0, 30000, 
        function(v) { volume1(v*50); coloredLights(0,0,0, v,v,v); }, 
        function() {
            pausePlay(0); coloredLights(0,0,0, 0,0,0);
        }
    );
}

function partMonologFinalEndImmediate() {
    setAllLights(0,0,0, 0,0,0, "off", "off", "off")
    pausePlay(0);
}

function partLampEdute2() {
    setAllLights(0,0,0, 0,0,0, "on", "off", "off")
}

function partFinalDance() {
    partStopTransition(); lampControl("off"); doControl(2,"off"); doControl(3,"off");
    volume1(100); playByName(0, "a8");
    partTransition(0, 1, 10000,
        function(v) { coloredLights(0,v/2,v, 0,0,0); },
        function() { }
    );
}

function partPoklony() {
    volume2(0); playByName(1, "a5");
    partStopTransition(); lampControl("off"); doControl(3,"off");
    partTransition(0, 1, 10000, 
        function(v) {
            volume1((1-v)*100); volume2((v)*100);
            coloredLights(0,(1-v)/2,1-v, v,v,v);
        }, 
        function() {
            playByName(0, "i3"); coloredLights(0,0,0, 1,1,1); doControl(2,"on"); doControl(3,"on");
        }
    );
}

