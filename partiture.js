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

function partTransition(start, end, duration, func, done) {
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
        setTimeout(function() { partTransition(next,end,duration-tstep,func,done); }, tstep);
    } else {
        func(end);
        done();
    }
}

function partBlackout() {
    lampControl("off");
    spotControl("off");
    dmxControl2(0,0,0, 0,0,0);
    playByName(1, "i3");
    doControl(0,0); doControl(1,0); doControl(2,0); doControl(3,0);
}

function partDark() {
    dmxControl2(0,0,0, 0,0,0);
    playByName(1, "i3");
    lampControl("off");
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
    playByName(1,"i1"); dmxControl2(0,0.25,0.5, 0,0,0);
}

function partInit() {
    partSilent();
    partBlackout();
}

function partBegin() {
    volume1(100); playByName(0, "a1");
    setTimeout(function() { partPark() },10000);
}

function partEtudeLampa() {
    partTransition(100, 0, 3000, 
        function(v) { volume1(v); }, 
        function() {
            dmxControl2(0,0,0, 0,0,0); playByName(0,"a2"); volume1(100); playByName(1,"i2"); 
            lampControl("blink"); 
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
    partTransition(0, 0.75, 7000, 
        function(v) { dmxControl2(0,0,0, v,v,v); }, 
        function() {
        }
    );
}

function partPreapringTea() {
    playByName(0,"a2"); volume1(75);
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
    dmxControl2(0,0,0, 1,1,1);
}

function partIntermedia2() {
    volume1(50); playByName(0, "a1");
    partTransition(0, 0.5, 3000, 
      function(v) {
        dmxControl2(0,v/2,v, 1-v,1-v,1-v);
      },
      function() {
        playByName(1,"i1"); 
      }
    );
}

function partIntermedia2End() {
    pausePlay(0); playByName(1, "i3");
    dmxControl2(0,0,0, 1,1,1);
}

function partMonologMama() {
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
    volume1(50); playByName(0, "a1");
}

function partMonologFinalEnd() {
    partTransition(1, 0, 20000, 
        function(v) { volume1(v*50); dmxControl2(0,0,0, v,v,v); }, 
        function() {
            pausePlay(0); dmxControl2(0,0,0, 0,0,0);
        }
    );
}

function partMonologFinalEndImmediate() {
    pausePlay(0); dmxControl2(0,0,0, 0,0,0);
}

function partLampEdute2() {
    lampControl("on");
}

function partFinalDance() {
    lampControl("off");
    volume1(100); playByName(0, "a8");
}

function partPoklony() {
    volume2(0); playByName(1, "a5");
    partTransition(0, 1, 3000, 
        function(v) { volume1((1-v)*100); volume2((v)*100); }, 
        function() {
            playByName(0, "i3"); dmxControl2(0,0,0, 1,1,1);
        }
    );
}

