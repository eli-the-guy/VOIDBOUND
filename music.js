/* VOIDBOUND music — original procedural dark-ambient score (Web Audio, no audio files).
   Slow evil drones, a pulsing sub bass, glitchy bit-crushed plucks and a sparse industrial beat.
   It gets denser as the run goes on and switches to a harsher mode for boss rounds. */
(() => {
  "use strict";
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) {
    window.VoidMusic = {
      start() {},
      setIntensity() {},
      setBoss() {},
      duck() {},
      stinger() {},
      death() {},
      toggleMute() {
        return true;
      },
      isMuted: () => true,
    };
    return;
  }

  let ctx = null,
    master = null,
    musicBus = null,
    delayIn = null,
    crushCurve = null,
    noiseBuf = null,
    timer = null,
    droneNodes = null;
  let muted = false,
    ducked = false,
    started = false,
    dead = false;
  let intensity = 0.15,
    target = 0.15,
    boss = false;
  // Drum & bass mode kicks in from round 15 (tier 2 from round 25).
  let round = 1,
    dnb = false,
    wantDnb = false,
    tier = 0;
  let softCurve = null;
  let step = 0,
    bar = 0,
    nextTime = 0;
  const VOL = 0.55;

  try {
    muted = localStorage.getItem("voidboundMuted") === "1";
  } catch (e) {}

  // D phrygian-ish scale: dark, with the b2 (Eb) giving the unsettling edge.
  const ROOTS = [38, 34, 31, 33, 38, 34, 36, 33]; // D2 Bb1 G1 A1 D2 Bb1 C2 A1 (midi)
  const SCALE = [0, 1, 3, 5, 7, 8, 10, 12, 13, 15];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function init() {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOL;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 5;
    master.connect(comp);
    comp.connect(ctx.destination);

    musicBus = ctx.createGain();
    musicBus.gain.value = 1;
    musicBus.connect(master);

    // feedback delay for space
    delayIn = ctx.createGain();
    const dly = ctx.createDelay(1.5);
    dly.delayTime.value = 0.375;
    const fb = ctx.createGain();
    fb.gain.value = 0.42;
    const dlp = ctx.createBiquadFilter();
    dlp.type = "lowpass";
    dlp.frequency.value = 1800;
    delayIn.connect(dly);
    dly.connect(dlp);
    dlp.connect(fb);
    fb.connect(dly);
    dlp.connect(musicBus);

    // bit-crush style shaper for glitchy plucks
    crushCurve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i / 511) * 2 - 1;
      crushCurve[i] = Math.round(x * 5) / 5;
    }

    softCurve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i / 511) * 2 - 1;
      softCurve[i] = Math.tanh(x * 3.2);
    }

    // noise buffer for percussion
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    buildDrone();
  }

  function buildDrone() {
    const out = ctx.createGain();
    out.gain.value = 0.0;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    lp.Q.value = 4;
    lp.connect(out);
    out.connect(musicBus);
    const lfo = ctx.createOscillator(),
      lfoG = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoG.gain.value = 260;
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    lfo.start();
    const oscs = [];
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator();
      o.type = i < 2 ? "sawtooth" : "square";
      o.detune.value = [-9, 9, -4, 4][i];
      const g = ctx.createGain();
      g.gain.value = i < 2 ? 0.07 : 0.035;
      o.connect(g);
      g.connect(lp);
      o.start();
      oscs.push(o);
    }
    // dissonant layer, only audible in boss mode
    const dis = ctx.createOscillator();
    dis.type = "sawtooth";
    const disG = ctx.createGain();
    disG.gain.value = 0;
    dis.connect(disG);
    disG.connect(lp);
    dis.start();
    droneNodes = { out, lp, oscs, dis, disG };
    out.gain.setTargetAtTime(0.9, ctx.currentTime, 3);
  }

  function setDroneRoot(m, t) {
    if (!droneNodes) return;
    droneNodes.oscs.forEach((o, i) => {
      const oct = i % 2 ? 12 : 0;
      o.frequency.setTargetAtTime(hz(m + oct), t, 1.2);
    });
    droneNodes.dis.frequency.setTargetAtTime(hz(m + 18), t, 0.6); // tritone+octave
  }

  function env(g, t, a, peak, d, end = 0.0001) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(end, t + a + d);
  }

  function kick(t, v = 0.9) {
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    env(g, t, 0.003, v, 0.28);
    o.connect(g);
    g.connect(musicBus);
    o.start(t);
    o.stop(t + 0.35);
  }
  function noiseHit(t, freq, q, vol, dur, type = "highpass", send = 0) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    env(g, t, 0.002, vol, dur);
    s.connect(f);
    f.connect(g);
    g.connect(musicBus);
    if (send) {
      const sg = ctx.createGain();
      sg.gain.value = send;
      g.connect(sg);
      sg.connect(delayIn);
    }
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
  }
  function bass(t, m, len, vol) {
    const o = ctx.createOscillator(),
      o2 = ctx.createOscillator(),
      g = ctx.createGain(),
      f = ctx.createBiquadFilter();
    o.type = "sawtooth";
    o2.type = "square";
    o.frequency.value = hz(m);
    o2.frequency.value = hz(m - 12);
    f.type = "lowpass";
    f.Q.value = 9;
    f.frequency.setValueAtTime(180 + 900 * intensity, t);
    f.frequency.exponentialRampToValueAtTime(110, t + len);
    env(g, t, 0.005, vol, len);
    o.connect(f);
    o2.connect(f);
    f.connect(g);
    g.connect(musicBus);
    o.start(t);
    o2.start(t);
    o.stop(t + len + 0.05);
    o2.stop(t + len + 0.05);
  }
  function pluck(t, m, vol, glitch) {
    const o = ctx.createOscillator(),
      g = ctx.createGain(),
      f = ctx.createBiquadFilter();
    o.type = pick(["triangle", "square", "sawtooth"]);
    o.frequency.value = hz(m);
    f.type = "lowpass";
    f.frequency.setValueAtTime(3200, t);
    f.frequency.exponentialRampToValueAtTime(500, t + 0.35);
    env(g, t, 0.004, vol, 0.3);
    o.connect(f);
    let node = f;
    if (glitch) {
      const ws = ctx.createWaveShaper();
      ws.curve = crushCurve;
      f.connect(ws);
      node = ws;
    }
    node.connect(g);
    g.connect(musicBus);
    const send = ctx.createGain();
    send.gain.value = 0.55;
    g.connect(send);
    send.connect(delayIn);
    o.start(t);
    o.stop(t + 0.5);
  }
  function stab(t, root) {
    // harsh boss stab: root + tritone + minor second
    [0, 6, 13].forEach((iv) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain(),
        f = ctx.createBiquadFilter();
      o.type = "sawtooth";
      o.frequency.value = hz(root + 24 + iv);
      f.type = "bandpass";
      f.frequency.value = 1400;
      f.Q.value = 2;
      env(g, t, 0.005, 0.05, 0.22);
      o.connect(f);
      f.connect(g);
      g.connect(musicBus);
      o.start(t);
      o.stop(t + 0.3);
    });
  }

  // ---- drum & bass voices ----
  function snare(t, v = 0.2) {
    noiseHit(t, 1900, 0.9, v, 0.14, "bandpass", 0.18);
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    env(g, t, 0.002, v * 0.9, 0.12);
    o.connect(g);
    g.connect(musicBus);
    o.start(t);
    o.stop(t + 0.2);
  }
  function hat(t, v = 0.045, open = false) {
    noiseHit(t, 8500, 1, v, open ? 0.16 : 0.04);
  }
  function crash(t) {
    noiseHit(t, 5200, 0.7, 0.16, 1.1, "highpass", 0.3);
  }
  function boom(t) {
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(34, t + 0.7);
    env(g, t, 0.005, 0.9, 0.9);
    o.connect(g);
    g.connect(musicBus);
    o.start(t);
    o.stop(t + 1);
  }
  function riser(t, dur) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(9000, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + dur);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.04);
    s.connect(f);
    f.connect(g);
    g.connect(musicBus);
    s.start(t);
    s.stop(t + dur + 0.1);
  }
  // Classic Reese: two detuned saws through a wobbling low-pass + a clean sub.
  function reese(t, m, len, vol, wobHz) {
    const out = ctx.createGain(),
      f = ctx.createBiquadFilter(),
      ws = ctx.createWaveShaper(),
      lfo = ctx.createOscillator(),
      lg = ctx.createGain();
    ws.curve = softCurve;
    f.type = "lowpass";
    f.Q.value = 7 + tier * 2;
    f.frequency.value = 140 + 260 * intensity;
    lfo.frequency.value = wobHz;
    lg.gain.value = 380 + intensity * 450 + tier * 160;
    lfo.connect(lg);
    lg.connect(f.frequency);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    out.gain.setValueAtTime(vol, t + Math.max(0.02, len - 0.04));
    out.gain.exponentialRampToValueAtTime(0.0001, t + len);
    [-14, 14].forEach((d) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = hz(m);
      o.detune.value = d;
      o.connect(f);
      o.start(t);
      o.stop(t + len + 0.05);
    });
    f.connect(ws);
    ws.connect(out);
    const sub = ctx.createOscillator(),
      sg = ctx.createGain();
    sub.type = "sine";
    sub.frequency.value = hz(m - 12);
    sg.gain.value = 0.5;
    sub.connect(sg);
    sg.connect(out);
    out.connect(musicBus);
    sub.start(t);
    sub.stop(t + len + 0.05);
    lfo.start(t);
    lfo.stop(t + len + 0.05);
  }
  // [step, semitones above root, length in steps]
  const REESE_PATTERNS = [
    [
      [0, 0, 6],
      [6, 12, 1.5],
      [8, 0, 5],
      [14, 10, 2],
    ],
    [
      [0, 0, 3],
      [3, 0, 3],
      [6, 7, 2],
      [8, 0, 6],
      [14, 12, 1.5],
    ],
    [
      [0, 0, 6],
      [6, 0, 2],
      [8, 5, 3],
      [11, 3, 3],
      [14, 0, 2],
    ],
    [
      [0, 0, 6],
      [6, 0, 2],
      [8, 0, 2],
      [10, 0, 2],
      [12, 0, 2],
      [14, 0, 2],
    ],
  ];
  function dnbStep(barStep, t, s16, root) {
    const I = intensity,
      b4 = bar % 4,
      fill = b4 === 3;
    // two-step kick pattern, busier every 4th bar
    const kicks = fill ? [0, 6, 10, 11] : b4 === 1 ? [0, 3, 10] : [0, 10];
    if (kicks.includes(barStep)) kick(t, 0.75);
    // backbeat snare on 2 and 4, with ghost notes
    if (barStep === 4 || (barStep === 12 && !fill)) snare(t, 0.2 + I * 0.08);
    if (
      (barStep === 7 || barStep === 9 || barStep === 15) &&
      !fill &&
      Math.random() < 0.35
    )
      snare(t, 0.05);
    // amen-style roll into the next phrase
    if (fill && barStep >= 12) snare(t, 0.07 + (barStep - 11) * 0.05);
    // hats
    if (barStep % 2 === 0) hat(t, 0.04 + I * 0.02, barStep === 14);
    if (tier >= 2 && barStep % 2 === 1 && Math.random() < 0.7) hat(t, 0.022);
    // crash at the top of every phrase
    if (b4 === 0 && barStep === 0) crash(t);
    // reese bass line
    const pat = REESE_PATTERNS[b4];
    for (const [st, semi, len] of pat)
      if (st === barStep) {
        const wob = 1 / (s16 * pick([2, 4, 4, 8]));
        reese(t, root + semi, s16 * len * 0.96, 0.2 + I * 0.07, wob);
      }
  }

  function bpm() {
    if (dnb) return 170 + intensity * 4 + (boss ? 4 : 0);
    return 88 + intensity * 38 + (boss ? 10 : 0);
  }

  function scheduleStep(i, t) {
    const sixteenth = 60 / bpm() / 4;
    const barStep = i % 16;
    const root = ROOTS[bar % ROOTS.length];
    // Switch genre on the downbeat, with a riser the bar before and a drop.
    if (wantDnb !== dnb) {
      if (wantDnb && barStep === 8) riser(t, sixteenth * 8);
      if (barStep === 0) {
        dnb = wantDnb;
        if (dnb) {
          boom(t);
          crash(t);
        }
      }
    }
    if (barStep === 0) setDroneRoot(root, t);
    const I = intensity;

    // drone follows intensity
    if (droneNodes) {
      droneNodes.lp.frequency.setTargetAtTime(
        350 + I * 1400 + (boss ? 500 : 0),
        t,
        0.5,
      );
      droneNodes.disG.gain.setTargetAtTime(boss ? 0.045 : 0, t, 0.4);
      droneNodes.out.gain.setTargetAtTime(dnb ? 0.5 : 0.9, t, 0.6);
    }

    if (dnb) {
      dnbStep(barStep, t, sixteenth, root);
      // sparser, glassier plucks over the top
      if (barStep % 2 === 0 && Math.random() < 0.1 + I * 0.16) {
        const m = root + 24 + pick(SCALE);
        pluck(t, m, 0.06, true);
        if (Math.random() < 0.25)
          pluck(t + sixteenth * 0.5, m + 12, 0.035, true);
      }
      if (boss && (barStep === 0 || barStep === 10)) stab(t, root);
      if (barStep === 15) bar++;
      return;
    }

    // kick: four on the floor-ish when intense, sparse when calm
    if (I > 0.3 && (barStep % 4 === 0 || (I > 0.7 && barStep === 14)))
      kick(t, 0.5 + I * 0.4);
    else if (I <= 0.3 && barStep === 0) kick(t, 0.45);

    // off-beat hats / noise ticks
    if (I > 0.45 && barStep % 4 === 2)
      noiseHit(t, 7500, 1, 0.06 + I * 0.05, 0.05);
    if (I > 0.6 && barStep % 2 === 1 && Math.random() < 0.5)
      noiseHit(t, 9000, 1, 0.035, 0.03);
    // industrial snare / glitch burst
    if (I > 0.35 && barStep === 8)
      noiseHit(t, 1800, 1.2, 0.16, 0.18, "bandpass", 0.25);
    if (I > 0.5 && barStep === 15 && Math.random() < 0.45)
      for (let k = 0; k < 3; k++)
        noiseHit(t + k * sixteenth * 0.33, 3000, 2, 0.08, 0.03, "bandpass");

    // sub bass pulse
    if (I > 0.18) {
      const pat = I > 0.6 ? [0, 3, 6, 8, 11, 14] : [0, 6, 10];
      if (pat.includes(barStep))
        bass(
          t,
          root + (Math.random() < 0.1 ? 12 : 0),
          sixteenth * 2.2,
          0.28 + I * 0.15,
        );
    }

    // glitchy plucks: random walk through scale, stutters sometimes
    const density = 0.12 + I * 0.38;
    if (barStep % 2 === 0 || I > 0.6) {
      if (Math.random() < density) {
        const m = root + 24 + pick(SCALE);
        const stutter = Math.random() < 0.18 + I * 0.15;
        pluck(t, m, 0.07 + I * 0.04, I > 0.4);
        if (stutter) {
          pluck(t + sixteenth * 0.5, m, 0.05, true);
          pluck(t + sixteenth * 0.75, m + 12, 0.035, true);
        }
      }
    }

    // boss stabs
    if (boss && (barStep === 0 || barStep === 10)) stab(t, root);

    if (barStep === 15) bar++;
  }

  function scheduler() {
    if (!ctx) return;
    intensity += (target - intensity) * 0.04;
    // do not schedule while the tab is suspended/ducked paused
    while (nextTime < ctx.currentTime + 0.18) {
      if (nextTime < ctx.currentTime - 0.1) nextTime = ctx.currentTime + 0.02;
      scheduleStep(step, nextTime);
      nextTime += 60 / bpm() / 4;
      step++;
    }
  }

  const api = {
    start() {
      if (started) {
        if (ctx && ctx.state === "suspended") ctx.resume();
        return;
      }
      try {
        init();
        started = true;
        dead = false;
        if (ctx.state === "suspended") ctx.resume();
        nextTime = ctx.currentTime + 0.1;
        timer = setInterval(scheduler, 25);
      } catch (e) {
        started = false;
      }
    },
    // 0 (calm) .. 1 (frantic)
    setIntensity(v) {
      target = Math.max(0.05, Math.min(1, v));
    },
    setBoss(b) {
      boss = !!b;
    },
    // Called with the current round: from round 15 the score goes drum & bass.
    setRound(n) {
      round = n;
      wantDnb = n >= 15;
      tier = n >= 25 ? 2 : wantDnb ? 1 : 0;
    },
    getState() {
      return { dnb, wantDnb, tier, bpm: Math.round(bpm()), bar };
    },
    // lower the music for menus / pause overlays
    duck(on) {
      ducked = !!on;
      if (musicBus && ctx)
        musicBus.gain.setTargetAtTime(ducked ? 0.28 : 1, ctx.currentTime, 0.12);
    },
    // short rising chord when a round is cleared
    stinger() {
      if (!started || muted) return;
      const t = ctx.currentTime + 0.02;
      [0, 7, 12, 15].forEach((iv, i) => {
        const o = ctx.createOscillator(),
          g = ctx.createGain();
        o.type = "triangle";
        o.frequency.value = hz(62 + iv);
        env(g, t + i * 0.07, 0.01, 0.09, 0.7);
        o.connect(g);
        g.connect(musicBus);
        const s = ctx.createGain();
        s.gain.value = 0.5;
        g.connect(s);
        s.connect(delayIn);
        o.start(t + i * 0.07);
        o.stop(t + 1.2);
      });
    },
    // low-pass sweep down and fade on death
    death() {
      if (!started) return;
      dead = true;
      target = 0.05;
      const t = ctx.currentTime;
      if (droneNodes) {
        droneNodes.lp.frequency.cancelScheduledValues(t);
        droneNodes.lp.frequency.setTargetAtTime(90, t, 0.6);
      }
      musicBus.gain.cancelScheduledValues(t);
      musicBus.gain.setTargetAtTime(ducked ? 0.15 : 0.45, t, 0.4);
    },
    toggleMute() {
      muted = !muted;
      try {
        localStorage.setItem("voidboundMuted", muted ? "1" : "0");
      } catch (e) {}
      if (master)
        master.gain.setTargetAtTime(muted ? 0 : VOL, ctx.currentTime, 0.1);
      return muted;
    },
    isMuted: () => muted,
    // stop wasting battery when the tab is hidden
    suspend() {
      if (ctx && ctx.state === "running") ctx.suspend();
    },
    resume() {
      if (ctx && ctx.state === "suspended") ctx.resume();
    },
  };
  window.VoidMusic = api;
})();
