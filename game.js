(() => {
  "use strict";
  const canvas = document.getElementById("gameCanvas"),
    ctx = canvas.getContext("2d"),
    wrap = document.getElementById("gameWrap");
  const playerDom = document.getElementById("playerDom"),
    altarDoms = [
      document.getElementById("altarDom1"),
      document.getElementById("altarDom2"),
    ];
  const levelText = document.getElementById("levelText"),
    roundText = document.getElementById("roundText"),
    enemyText = document.getElementById("enemyText");
  const altarScreen = document.getElementById("altarScreen"),
    altarTitle = document.getElementById("altarTitle"),
    altarHint = document.getElementById("altarHint"),
    enemyChoices = document.getElementById("enemyChoices");
  const classScreen = document.getElementById("classScreen"),
    classChoices = document.getElementById("classChoices");
  const upgradeScreen = document.getElementById("upgradeScreen"),
    upgradeChoices = document.getElementById("upgradeChoices"),
    startScreen = document.getElementById("startScreen"),
    gameOverScreen = document.getElementById("gameOverScreen"),
    gameOverText = document.getElementById("gameOverText"),
    message = document.getElementById("message");
  const TAU = Math.PI * 2;
  const enemyDefs = {
    shooter: {
      name: "SHOOTER",
      desc: "Aims at the player and fires a slow bullet every 2 seconds.",
      color: "#ff3dcc",
    },
    shotgun: {
      name: "SHOTGUN",
      desc: "Shoots slow-moving bullets in three directions every 2 seconds, then turns 45°.",
      color: "#9b5cff",
    },
    beam: {
      name: "BEAM",
      desc: "The enemy stays still. It warns for 3 seconds, then sends a slow beam through the arena for 3 seconds, then cools down for 10 seconds.",
      color: "#e83cff",
    },
    shock: {
      name: "SHOCK WAVE",
      desc: "Jumps every 5 seconds, takes 2 seconds to land, marks its destination, then sends a slow wave across the arena.",
      color: "#ff67b7",
    },
    sword: {
      name: "SWORD MASTER",
      desc: "Keeps a sword at a fixed angle around you for 6 seconds, then gives a 1-second strike warning. Teleports every 5 seconds.",
      color: "#c15cff",
    },
    dasher: {
      name: "DASHER",
      desc: "Locks onto your position, warns briefly, then makes a fast straight dash.",
      color: "#ff7a3d",
    },
    burst: {
      name: "BURST",
      desc: "Fires a large radial burst of slow bullets, then waits for another opening.",
      color: "#ffd23d",
    },
    hunter: {
      name: "HUNTER",
      desc: "Slowly follows you and becomes dangerous if it reaches you.",
      color: "#4dff88",
    },
    mine: {
      name: "MINE LAYER",
      desc: "Drops armed mines that stay where they were placed until they trigger.",
      color: "#55d9ff",
    },
    orbiter: {
      name: "ORBITER",
      desc: "Creates three orbiting shots that eventually break away and fly outward.",
      color: "#8f7bff",
    },
    repeater: {
      name: "REPEATER",
      desc: "Spawns slightly behind you and copies the path you took a moment ago.",
      color: "#ff4f8b",
    },
    mirror: {
      name: "MIRROR",
      desc: "Mirrors your position across the arena and attacks from the reflected side.",
      color: "#7df9ff",
    },
    timekeeper: {
      name: "TIMEKEEPER",
      desc: "Records where you were and fires toward an earlier position, punishing predictable movement.",
      color: "#f7d354",
    },
    voidcaster: {
      name: "VOID CASTER",
      desc: "Marks several locations around you, then detonates them with a radial burst.",
      color: "#a56bff",
    },
    teleporter: {
      name: "TELEPORTER",
      desc: "Teleports around the arena and fires a rapid burst from each new position.",
      color: "#4de8ff",
    },
    splitter: {
      name: "SPLITTER",
      desc: "Fires a heavy shot that splits into five dangerous projectiles.",
      color: "#ff704d",
    },
    predictor: {
      name: "PREDICTOR",
      desc: "Leads its shots based on your current movement direction.",
      color: "#65ff7a",
    },
    pulsar: {
      name: "PULSAR",
      desc: "Creates a growing shock ring that sweeps outward through the arena.",
      color: "#c86bff",
    },
    mimic: {
      name: "MIMIC",
      desc: "Copies the attack style of the enemies already haunting the arena.",
      color: "#ffffff",
    },
    voidhunter: {
      name: "VOID HUNTER",
      desc: "Tracks you, locks on, then launches a devastating long-range lunge.",
      color: "#ff3b6b",
    },
    prism: {
      name: "PRISM",
      desc: "Rotates around the arena and fires three angled shots that constantly change direction.",
      color: "#d95cff",
    },
    rift: {
      name: "RIFT",
      desc: "Creates short-lived portals that eject dangerous bullets from unexpected locations.",
      color: "#5c7dff",
    },
    swarmcore: {
      name: "SWARM CORE",
      desc: "Periodically releases a cluster of tiny homing hazards that chase you down.",
      color: "#ff5ca8",
    },
    railgun: {
      name: "RAILGUN",
      desc: "Locks a line through the arena, warns you, then fires a very fast piercing shot.",
      color: "#6ff7ff",
    },
    gravity: {
      name: "GRAVITY WELL",
      desc: "Creates a moving gravity field that drags the player toward its center.",
      color: "#9f6bff",
    },
    decoy: {
      name: "DECOY",
      desc: "Creates false copies of itself and fires from the copies at random times.",
      color: "#f0f0ff",
    },
    ricochet: {
      name: "RICOCHET",
      desc: "Fires shots that bounce off the arena walls before disappearing.",
      color: "#ffbd4a",
    },
    seeker: {
      name: "SEEKER",
      desc: "Launches a slow homing orb that becomes faster the longer it survives.",
      color: "#66ffb3",
    },
  };
  const upgradeDefs = {
    classcore: {
      name: "CLASS CORE",
      desc: "Boosts your current class ability. DASHER: stronger dash. GRAPPLER: faster hook and pull. GHOST: faster ghost movement and shorter cooldown.",
      icon: "CORE",
    },
    speed: { name: "SPEED", desc: "Move faster.", icon: "SPD" },
    bullet: {
      name: "BULLET SPEED",
      desc: "Your shuriken travels faster.",
      icon: "SHR",
    },
    jump: { name: "JUMP HEIGHT", desc: "Stay airborne longer.", icon: "JMP" },
    weaken: {
      name: "WEAKEN",
      desc: "One enemy type becomes slower.",
      icon: "WKN",
    },
    size: {
      name: "BULLET SIZE",
      desc: "Your shuriken becomes larger.",
      icon: "SIZ",
    },
    rapid: {
      name: "RAPID FIRE",
      desc: "Reduce your 0.5-second shuriken cooldown by 0.10 seconds per level.",
      icon: "RPD",
    },
    twin: {
      name: "TWIN SHURIKEN",
      desc: "Each shot fires two shuriken at a slight angle.",
      icon: "TWN",
    },
    pierce: {
      name: "PIERCE",
      desc: "Your shuriken can pass through enemies and hit another one.",
      icon: "PRC",
    },
    homing: {
      name: "HOMING",
      desc: "Your shuriken gently curves toward the nearest enemy.",
      icon: "HOM",
    },
    range: {
      name: "LONG RANGE",
      desc: "Your shuriken stays in the arena longer before disappearing.",
      icon: "RNG",
      cost: 8,
    },
    blink: {
      name: "BLINK STEP",
      desc: "Every few seconds, your next movement burst becomes a short teleport in your facing direction.",
      icon: "BLK",
      cost: 12,
    },
    overdrive: {
      name: "OVERDRIVE",
      desc: "Move faster and gain a small permanent attack-speed boost against enemy hazards.",
      icon: "OVR",
      cost: 14,
    },
    collector: {
      name: "BINDER MAGNET",
      desc: "Binders are pulled toward you from farther away.",
      icon: "MAG",
      cost: 10,
    },
    echo: {
      name: "ECHO SHOT",
      desc: "A delayed copy of each normal shuriken follows your first shot.",
      icon: "ECHO",
      cost: 16,
    },
    phase: {
      name: "PHASE BODY",
      desc: "Jumping lasts longer and your jump visual becomes stronger.",
      icon: "PHZ",
      cost: 15,
    },
  };
  const superUpgradeDefs = {
    voidengine: {
      name: "VOID ENGINE",
      desc: "SUPER UPGRADE — Fires an additional shuriken pattern and greatly improves projectile speed.",
      icon: "SUPER",
      cost: 32,
    },
    timestop: {
      name: "TIME BREAK",
      desc: "SUPER UPGRADE — Enemy attack cycles are slowed substantially for the rest of the run.",
      icon: "SUPER",
      cost: 40,
    },
    goldrush: {
      name: "GOLD RUSH",
      desc: "SUPER UPGRADE — Binder rewards are doubled and bonus binder spawns happen more often.",
      icon: "SUPER",
      cost: 36,
    },
    voidheart: {
      name: "VOID HEART",
      desc: "SUPER UPGRADE — Gives a powerful emergency shield that can absorb one otherwise fatal hit.",
      icon: "SUPER",
      cost: 48,
    },
    overcore: {
      name: "OVERCORE",
      desc: "SUPER UPGRADE — Dramatically boosts your class core and all class-specific abilities.",
      icon: "SUPER",
      cost: 55,
    },
  };
  let W = 0,
    H = 0,
    dpr = 1,
    last = performance.now(),
    mouse = { x: 0, y: 0, down: false },
    keys = {};
  const state = {
    mode: "start",
    level: 1,
    round: 1,
    altarOptions: [null, null],
    selectedEnemy: null,
    enemies: [],
    nextEnemyId: 1,
    shots: [],
    enemyShots: [],
    particles: [],
    upgrades: {
      classcore: 0,
      speed: 0,
      bullet: 0,
      jump: 0,
      size: 0,
      rapid: 0,
      twin: 0,
      pierce: 0,
      homing: 0,
      range: 0,
    },
    weaken: null,
    player: {
      x: 0,
      y: 0,
      angle: 0,
      jump: 0,
      jumpMax: 0.8,
      cooldown: 0,
      alive: true,
    },
    altarCooldown: 0,
    transitionToken: 0,
    roundEnemyIds: [],
    altarQueued: false,
    className: null,
    classCore: 0,
    grapple: null,
    ghost: { active: false, anchorX: 0, anchorY: 0, hits: 0, cooldown: 0 },
    binders: [],
    binderCount: 0,
    roundTime: 0,
    binderBonusTimer: 10,
    sizeScale: 1,
    completedRounds: 0,
    pendingChain: false,
    chainLevels: {},
    superUpgrades: {},
    emergencyShield: 0,
  };
  let arena = { x: 0, y: 0, w: 0, h: 0 };
  const binderHud = document.createElement("div");
  binderHud.id = "voidboundBinderHud";
  binderHud.innerHTML =
    '<span class="vbBinderDot">●</span> BINDERS: <b id="vbBinderCount">0</b>';
  binderHud.style.cssText =
    "position:absolute;right:18px;bottom:18px;z-index:20;padding:10px 14px;border:1px solid #d7a83d88;border-radius:12px;background:#120d18dd;color:#ffd85a;font:700 14px system-ui;letter-spacing:1px;box-shadow:0 0 18px #d7a83d33;pointer-events:none;";
  wrap.style.position = wrap.style.position || "relative";
  wrap.appendChild(binderHud);
  const chainScreen = document.createElement("div");
  chainScreen.id = "voidboundChainScreen";
  chainScreen.style.cssText =
    "position:absolute;inset:0;z-index:30;display:none;align-items:center;justify-content:center;background:#05030bdd;backdrop-filter:blur(8px);";
  chainScreen.innerHTML =
    '<div style="width:min(920px,92%);text-align:center"><div style="font:900 34px system-ui;color:#ff5ca8;letter-spacing:4px">CHOOSE A CHAIN</div><div style="margin:8px 0 22px;color:#d8cce0">Chains are permanent modifiers that make the run harder.</div><div id="voidboundChainChoices" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px"></div></div>';
  wrap.appendChild(chainScreen);
  const chainChoices = chainScreen.querySelector("#voidboundChainChoices");
  function updateBinderHud() {
    const el = document.getElementById("vbBinderCount");
    if (el) el.textContent = Math.floor(state.binderCount);
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function angleTo(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }
  function circleHit(a, b) {
    return dist(a, b) < (a.r + b.r) * state.sizeScale;
  }
  function resize() {
    const r = wrap.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = Math.max(320, r.width);
    H = Math.max(320, r.height);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const m = Math.min(42, Math.max(18, W * 0.025));
    arena = { x: m, y: 18, w: W - m * 2, h: H - 36 };
    if (!state.player.x) resetPlayer();
    updateDOM();
  }
  window.addEventListener("resize", resize);
  function altarPos(i) {
    return {
      x: arena.x + arena.w * (i ? 0.82 : 0.18),
      y: arena.y + arena.h * 0.52,
    };
  }
  function updateDOM() {
    playerDom.style.left = state.player.x + "px";
    playerDom.style.top = state.player.y + "px";
    playerDom.style.display = state.mode === "start" ? "none" : "block";
    playerDom.style.transform = `translate(-50%,-50%) scale(${state.sizeScale * (state.player.jump > 0 ? 1.18 : 1)})`;
    document.querySelector(".player-direction").style.transform =
      `rotate(${state.player.angle}rad)`;
    for (let i = 0; i < 2; i++)
      placeAltar(
        altarDoms[i],
        ...Object.values(altarPos(i)),
        state.altarOptions[i],
      );
  }
  function placeAltar(el, x, y, type) {
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.display = state.mode === "altar" && type ? "block" : "none";
    const c = type ? enemyDefs[type].color : "#9b7cff";
    el.querySelector(".altar-pedestal").style.borderColor = c;
    el.querySelector(".altar-glow").style.background = c + "22";
    el.querySelector(".altar-name").textContent = type
      ? enemyDefs[type].name
      : "VOID ALTAR";
    el.querySelector(".altar-name").style.color = c;
    el.querySelector(".altar-desc").textContent = type
      ? enemyDefs[type].desc
      : "Awaiting enemy";
  }
  function resetPlayer() {
    state.player = {
      x: W / 2,
      y: H / 2,
      r: 14,
      angle: 0,
      jump: 0,
      jumpMax: 0.8 + state.upgrades.jump * 0.3,
      cooldown: 0,
      alive: true,
    };
    updateDOM();
  }
  function chooseTwoRandomEnemies() {
    const basic = [
      "shooter",
      "shotgun",
      "beam",
      "shock",
      "sword",
      "dasher",
      "burst",
      "hunter",
      "mine",
      "orbiter",
    ];
    const pool = state.level >= 11 ? Object.keys(enemyDefs) : basic;
    const t = [...pool].sort(() => Math.random() - 0.5);
    state.altarOptions = [t[0], t[1]];
  }
  function classDefs() {
    return {
      ninja: {
        name: "NINJA",
        tag: "SHURIKEN",
        desc: "The standard class. Aim and fire your shuriken normally.",
        icon: "NIN",
      },
      dasher: {
        name: "DASHER",
        tag: "E — DASH",
        desc: "No weapon. Press E to dash forward and kill enemies by colliding with them. While dashing, Hunters are destroyed instead of killing you.",
        icon: "DSH",
      },
      grappler: {
        name: "GRAPPLER",
        tag: "HOOK",
        desc: "Your shuriken is replaced by a grappling hook. Shoot the exact point you are aiming at and pull yourself all the way there. Grappling enemies kills them.",
        icon: "GRP",
      },
      ghost: {
        name: "GHOST",
        tag: "E — GHOST",
        desc: "Press E to enter ghost form. You become able to survive one extra hit but move slower. Press E again to return to your activation spot. 10 second cooldown.",
        icon: "GST",
      },
    };
  }
  function showClassChoice() {
    state.mode = "class";
    classChoices.innerHTML = "";
    for (const [k, cdef] of Object.entries(classDefs())) {
      const c = document.createElement("div");
      c.className = "choice";
      c.innerHTML = `<div class="tag">${cdef.tag}</div><div class="name">${cdef.name}</div><div class="desc">${cdef.desc}</div>`;
      c.onclick = () => chooseClass(k);
      classChoices.appendChild(c);
    }
    classScreen.classList.remove("hidden");
    altarScreen.style.display = "none";
    upgradeScreen.classList.add("hidden");
    updateDOM();
  }
  function chooseClass(k) {
    state.className = k;
    state.classCore = state.upgrades.classcore || 0;
    state.ghost = {
      active: false,
      anchorX: 0,
      anchorY: 0,
      hits: 0,
      cooldown: 0,
    };
    state.grapple = null;
    classScreen.classList.add("hidden");
    showAltar();
  }
  function showAltar() {
    state.mode = "altar";
    state.altarCooldown = 0;
    chooseTwoRandomEnemies();
    altarTitle.textContent = "CHOOSE AN ALTAR";
    altarHint.textContent =
      "Two random enemies have appeared. Aim at one of the physical altars and shoot it to choose that enemy.";
    enemyChoices.innerHTML = "";
    const info = document.createElement("div");
    info.className = "choice";
    info.style.gridColumn = "1/-1";
    info.innerHTML = `<div class="tag">PHYSICAL ALTARS ONLY</div><div class="name">SHOOT ONE ALTAR TO CONTINUE</div><div class="desc">There is no enemy selection menu. Each altar already contains a randomly chosen enemy.</div>`;
    enemyChoices.appendChild(info);
    altarScreen.style.display = "flex";
    upgradeScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    updateDOM();
  }
  function resetEnemyForRound(e) {
    e.alive = true;
    e.attack = attackDelay(2);
    e.shotAngle = rnd(-Math.PI, Math.PI);
    e.angle = rnd(-Math.PI, Math.PI);
    e.phase = e.type === "beam" ? "cool" : e.type === "shock" ? "idle" : "idle";
    e.phaseTimer =
      e.type === "beam"
        ? attackDelay(10)
        : e.type === "shock"
          ? attackDelay(5)
          : 0;
    e.beamProgress = 0;
    e.targetX = e.x;
    e.targetY = e.y;
    e.jumpScale = 1;
    e.swordAngle = rnd(-Math.PI, Math.PI);
    e.swordTimer = 0;
    e.swordDelay = attackDelay(6);
    e.teleport = 5;
    e.strikeTimer = 0;
    e.swordX = e.x;
    e.swordY = e.y;
    e.swordActive = false;
    e.wave = 0;
    e.dashTimer = attackDelay(5);
    e.dashPhase = "idle";
    e.dashX = e.x;
    e.dashY = e.y;
    e.dashAngle = 0;
    e.mineTimer = attackDelay(4);
    e.mines = [];
    e.orbitTimer = attackDelay(4);
    e.history = [];
    e.historyTimer = 0;
    e.mirrorTimer = attackDelay(2.5);
    e.timeHistory = [];
    e.timeTimer = 0;
    e.voidTimer = attackDelay(4);
    e.voidPhase = "mark";
    e.voidMarks = [];
    e.teleportTimer = attackDelay(3);
    e.splitterTimer = attackDelay(3);
    e.predictorTimer = attackDelay(2.5);
    e.pulseTimer = attackDelay(5);
    e.pulseRadius = 0;
    e.mimicTimer = attackDelay(3);
    e.huntTimer = attackDelay(4);
    e.huntPhase = "track";
    e.huntTargetX = e.x;
    e.huntTargetY = e.y;
    e.prismTimer = attackDelay(2.5);
    e.prismAngle = rnd(0, TAU);
    e.riftTimer = attackDelay(4);
    e.swarmTimer = attackDelay(4);
    e.railTimer = attackDelay(5);
    e.railPhase = "idle";
    e.railAngle = 0;
    e.gravityTimer = attackDelay(5);
    e.gravityLife = 0;
    e.gravityX = e.x;
    e.gravityY = e.y;
    e.decoyTimer = attackDelay(4);
    e.decoys = [];
    e.ricochetTimer = attackDelay(3);
    e.seekerTimer = attackDelay(4);
  }
  function reviveAllEnemies() {
    for (const e of state.enemies) resetEnemyForRound(e);
  }
  function selectAltar(i) {
    if (state.mode !== "altar" || state.altarCooldown > 0) return;
    const chosen = state.altarOptions[i];
    if (!chosen) return;
    state.altarCooldown = 0.3;
    state.selectedEnemy = chosen;
    // A new altar choice starts the next round. Revive every previous enemy,
    // reset its attack state, then add the newly chosen enemy.
    reviveAllEnemies();
    state.altarOptions = [null, null];
    altarDoms.forEach((el) => (el.style.display = "none"));
    altarScreen.style.display = "none";
    state.mode = "play";
    state.roundTime = 0;
    state.binderBonusTimer = 10;
    state.player.invuln = 3;
    spawnEnemy(chosen);
    if ((state.chainLevels.swarm || 0) > 0) spawnEnemy(chosen);
    state.roundEnemyIds = state.enemies.map((e) => e.id);
    spawnBinders(10);
    state.enemyShots = [];
    state.shots = [];
    updateHud();
    updateDOM();
    showMessage("CHOSEN: " + enemyDefs[chosen].name);
  }
  function firePlayer() {
    if (state.mode === "class") return;
    if (state.mode === "altar") {
      const p = state.player,
        a = p.angle;
      let best = -1,
        bestScore = 1e9;
      for (let i = 0; i < 2; i++) {
        const t = altarPos(i),
          d = dist(p, t),
          ta = Math.atan2(t.y - p.y, t.x - p.x),
          diff = Math.abs(Math.atan2(Math.sin(a - ta), Math.cos(a - ta)));
        if (diff < 0.24 && d < 900 && d < bestScore) {
          best = i;
          bestScore = d;
        }
      }
      if (best >= 0) {
        const t = altarPos(best);
        state.shots.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * 600,
          vy: Math.sin(a) * 600,
          r: 5,
          life: 0.25,
        });
        selectAltar(best);
      }
      return;
    }
    if (state.className === "grappler") {
      if (state.grapple) return;
      const p = state.player,
        targetX = mouse.x,
        targetY = mouse.y,
        a = Math.atan2(targetY - p.y, targetX - p.x);
      state.grapple = {
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * (620 + state.classCore * 70),
        vy: Math.sin(a) * (620 + state.classCore * 70),
        r: 9,
        phase: "travel",
        targetX,
        targetY,
      };
      return;
    }
    if (state.className === "dasher") return;
    if (state.player.cooldown > 0) return;
    const p = state.player,
      a = p.angle,
      speed =
        (500 + state.upgrades.bullet * 80) *
        (1 + (state.superUpgrades.voidengine || 0) * 0.28);
    const spread = state.upgrades.twin ? 0.09 : 0;
    let offsets = state.upgrades.twin ? [-spread, spread] : [0];
    if (state.superUpgrades.voidengine) offsets = offsets.concat([0.18, -0.18]);
    for (const off of offsets) {
      const aa = a + off;
      state.shots.push({
        x: p.x + Math.cos(aa) * 18,
        y: p.y + Math.sin(aa) * 18,
        vx: Math.cos(aa) * speed,
        vy: Math.sin(aa) * speed,
        r: 5 + state.upgrades.size * 2,
        life: 2 + state.upgrades.range * 0.6,
        pierces: state.upgrades.pierce,
      });
    }
    p.cooldown = Math.max(0.35, 0.5 - state.upgrades.rapid * 0.1);
  }
  const chainDefs = {
    frenzy: { name: "FRENZY", desc: "Enemies attack 18% faster per stack." },
    overclock: {
      name: "OVERCLOCK",
      desc: "Enemy bullets become 20% faster per stack.",
    },
    bulletstorm: {
      name: "BULLETSTORM",
      desc: "Enemy attacks create extra projectiles.",
    },
    swarm: {
      name: "SWARM",
      desc: "Each altar choice adds one extra copy of the chosen enemy.",
    },
    closecall: {
      name: "CLOSE CALL",
      desc: "Attack timing becomes less predictable; random timing swings up to 2.5 seconds.",
    },
    heavy: {
      name: "HEAVY",
      desc: "Enemy bodies and hazards become 18% larger per stack.",
    },
    fragile: { name: "FRAGILE", desc: "Your safe jump window is shorter." },
    relentless: {
      name: "RELENTLESS",
      desc: "Enemies recover from their attacks more quickly.",
    },
    bloodrush: {
      name: "BLOODRUSH",
      desc: "Whenever an enemy dies, surviving enemies briefly speed up.",
    },
    blackhole: {
      name: "BLACK HOLE",
      desc: "A dangerous gravity orb periodically appears in the arena.",
    },
  };
  function ensureUpgradeState() {
    for (const k of Object.keys(upgradeDefs))
      if (!(k in state.upgrades)) state.upgrades[k] = 0;
    for (const k of Object.keys(superUpgradeDefs))
      if (!(k in state.superUpgrades)) state.superUpgrades[k] = 0;
  }
  function upgradeCost(k) {
    const u = upgradeDefs[k] || superUpgradeDefs[k];
    const lvl = state.upgrades[k] || 0;
    const base = u.cost || 6;
    return Math.floor(base + lvl * base * 0.55 + state.completedRounds * 0.7);
  }
  function addBinders(n) {
    state.binderCount += n * (state.superUpgrades.goldrush ? 2 : 1);
    updateBinderHud();
  }
  function spawnBinders(n = 10) {
    for (let i = 0; i < n; i++) {
      state.binders.push({
        x: rnd(arena.x + 25, arena.x + arena.w - 25),
        y: rnd(arena.y + 25, arena.y + arena.h - 25),
        r: 4,
        life: 999,
      });
    }
  }
  function updateBinders(dt) {
    if (state.mode !== "play") return;
    state.roundTime += dt;
    const alive = aliveEnemyCount();
    if (alive > 5) {
      state.binderBonusTimer -= dt;
      if (state.binderBonusTimer <= 0) {
        spawnBinders(state.superUpgrades.goldrush ? 10 : 5);
        state.binderBonusTimer = 10;
        showMessage("BINDER SURGE +" + (state.superUpgrades.goldrush ? 10 : 5));
      }
    } else {
      state.binderBonusTimer = Math.min(state.binderBonusTimer, 10);
    }
    const p = state.player;
    const magnet = 70 + (state.upgrades.collector || 0) * 45;
    for (let i = state.binders.length - 1; i >= 0; i--) {
      const b = state.binders[i],
        d = dist(p, b);
      if (d < magnet && d > 1) {
        const a = angleTo(b, p);
        const sp = d < 100 ? 260 : 120;
        b.x += Math.cos(a) * sp * dt;
        b.y += Math.sin(a) * sp * dt;
      }
      if (d < 14 * state.sizeScale + b.r) {
        addBinders(1);
        state.binders.splice(i, 1);
      }
    }
  }
  function showChains() {
    state.mode = "chain";
    chainChoices.innerHTML = "";
    const keys = Object.keys(chainDefs)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    for (const k of keys) {
      const d = chainDefs[k],
        c = document.createElement("div");
      c.style.cssText =
        "padding:22px;border:1px solid #ff4f8b77;border-radius:16px;background:#180913;cursor:pointer;color:#fff;min-height:150px;box-shadow:0 0 20px #ff4f8b22;";
      c.innerHTML = `<div style="font:900 12px system-ui;color:#ff6fa8;letter-spacing:2px">CHAIN</div><div style="font:900 22px system-ui;margin:10px 0">${d.name}</div><div style="color:#cdbed0;font:500 14px system-ui;line-height:1.5">${d.desc}</div>`;
      c.onclick = () => chooseChain(k);
      chainChoices.appendChild(c);
    }
    chainScreen.style.display = "flex";
    upgradeScreen.classList.add("hidden");
    altarScreen.style.display = "none";
    updateDOM();
  }
  function chooseChain(k) {
    state.chainLevels[k] = (state.chainLevels[k] || 0) + 1;
    state.pendingChain = false;
    chainScreen.style.display = "none";
    showMessage(chainDefs[k].name + " CHAINED");
    if (state.pendingUpgrade) showUpgrades();
    else showAltar();
  }
  function afterProgression() {
    if (state.pendingUpgrade) {
      showUpgrades();
      return;
    }
    if (state.pendingChain) {
      showChains();
      return;
    }
    showAltar();
  }
  function showUpgrades() {
    ensureUpgradeState();
    state.mode = "upgrade";
    upgradeChoices.innerHTML = "";
    const normal = Object.keys(upgradeDefs).sort(() => Math.random() - 0.5);
    const superChance = Math.random() < 0.2;
    let choices = [];
    if (superChance) {
      const sk = Object.keys(superUpgradeDefs).sort(
        () => Math.random() - 0.5,
      )[0];
      choices.push(sk);
    }
    for (const k of normal) {
      if (choices.length >= 3) break;
      choices.push(k);
    }
    choices = choices.slice(0, 3);
    for (const k of choices) {
      const u = upgradeDefs[k] || superUpgradeDefs[k],
        superU = !!superUpgradeDefs[k],
        cost = upgradeCost(k);
      const c = document.createElement("div");
      c.className = "choice";
      c.innerHTML = `<div class="tag">${superU ? "SUPER UPGRADE" : u.icon}</div><div class="name">${u.name}</div><div class="desc">${u.desc}</div><div style="margin-top:10px;font-weight:900;color:#ffd85a">● ${cost} BINDERS</div>`;
      c.style.opacity = state.binderCount >= cost ? "1" : ".55";
      c.onclick = () => chooseUpgrade(k, cost, superU);
      upgradeChoices.appendChild(c);
    }
    upgradeScreen.classList.remove("hidden");
    altarScreen.style.display = "none";
    chainScreen.style.display = "none";
    updateDOM();
  }
  function chooseUpgrade(k, cost, isSuper) {
    ensureUpgradeState();
    if (state.binderCount < cost) {
      showMessage("NOT ENOUGH BINDERS");
      return;
    }
    state.binderCount -= cost;
    updateBinderHud();
    if (isSuper) state.superUpgrades[k] = (state.superUpgrades[k] || 0) + 1;
    if (k === "voidheart") state.emergencyShield++;
    else state.upgrades[k] = (state.upgrades[k] || 0) + 1;
    if (k === "classcore")
      state.classCore =
        state.upgrades.classcore + (state.superUpgrades.overcore || 0) * 2;
    if (k === "weaken") state.weaken = state.selectedEnemy;
    if (k === "jump" || k === "phase")
      state.player.jumpMax =
        0.8 +
        (state.upgrades.jump || 0) * 0.3 +
        (state.upgrades.phase || 0) * 0.18;
    upgradeScreen.classList.add("hidden");
    state.pendingUpgrade = false;
    showMessage(
      (isSuper ? "SUPER " : "") +
        (upgradeDefs[k] || superUpgradeDefs[k]).name +
        " ACQUIRED",
    );
    if (state.pendingChain) showChains();
    else showAltar();
  }
  function startGame() {
    startScreen.classList.add("hidden");
    state.level = 1;
    state.round = 1;
    state.selectedEnemy = null;
    state.enemies = [];
    state.nextEnemyId = 1;
    state.shots = [];
    state.enemyShots = [];
    state.upgrades = {
      classcore: 0,
      speed: 0,
      bullet: 0,
      jump: 0,
      size: 0,
      rapid: 0,
      twin: 0,
      pierce: 0,
      homing: 0,
      range: 0,
    };
    state.weaken = null;
    state.className = null;
    state.classCore = 0;
    state.grapple = null;
    state.ghost = {
      active: false,
      anchorX: 0,
      anchorY: 0,
      hits: 0,
      cooldown: 0,
    };
    state.binders = [];
    state.binderCount = 0;
    state.roundTime = 0;
    state.binderBonusTimer = 10;
    state.sizeScale = 1;
    state.completedRounds = 0;
    state.pendingChain = false;
    state.chainLevels = {};
    state.superUpgrades = {};
    state.emergencyShield = 0;
    state.blackhole = null;
    state.blackholeTimer = 7;
    state.bloodrushTimer = 0;
    chainScreen.style.display = "none";
    updateBinderHud();
    resetPlayer();
    showClassChoice();
  }
  document.getElementById("startBtn").onclick = startGame;
  document.getElementById("restartBtn").onclick = () => location.reload();
  function startLevel() {
    state.mode = "play";
    state.roundTime = 0;
    state.binderBonusTimer = 10;
    resetPlayer();
    if (state.selectedEnemy) {
      reviveAllEnemies();
      addEnemiesForLevel();
      state.roundEnemyIds = state.enemies.map((e) => e.id);
    }
    spawnBinders(10);
    updateHud();
    updateBinderHud();
    updateDOM();
  }
  function addEnemiesForLevel() {
    const stack = 1 + Math.floor((state.level - 1) / 3);
    for (let i = 0; i < stack; i++) spawnEnemy(state.selectedEnemy);
  }
  function spawnEnemy(type) {
    const pad = 90;
    let x, y;
    do {
      x = rnd(arena.x + pad, arena.x + arena.w - pad);
      y = rnd(arena.y + pad, arena.y + arena.h - pad);
    } while (Math.hypot(x - state.player.x, y - state.player.y) < 180);
    if (type === "repeater") {
      const backAngle = state.player.angle + Math.PI;
      x = clamp(
        state.player.x + Math.cos(backAngle) * 120,
        arena.x + pad,
        arena.x + arena.w - pad,
      );
      y = clamp(
        state.player.y + Math.sin(backAngle) * 120,
        arena.y + pad,
        arena.y + arena.h - pad,
      );
    }
    state.enemies.push({
      id: state.nextEnemyId++,
      alive: true,
      type,
      x,
      y,
      r: 18,
      baseR: 18,
      angle: rnd(-Math.PI, Math.PI),
      attack: attackDelay(2),
      shotAngle: rnd(-Math.PI, Math.PI),
      phase: type === "beam" ? "cool" : type === "shock" ? "idle" : "idle",
      phaseTimer:
        type === "beam"
          ? attackDelay(10)
          : type === "shock"
            ? attackDelay(5)
            : 0,
      beamProgress: 0,
      targetX: x,
      targetY: y,
      jumpScale: 1,
      swordAngle: rnd(-Math.PI, Math.PI),
      swordTimer: 0,
      swordDelay: attackDelay(6),
      teleport: 5,
      strikeTimer: 0,
      swordX: x,
      swordY: y,
      swordActive: false,
      wave: 0,
      dashTimer: attackDelay(5),
      dashPhase: "idle",
      dashX: x,
      dashY: y,
      dashAngle: 0,
      mineTimer: attackDelay(4),
      mines: [],
      orbitTimer: attackDelay(4),
      history: [],
      historyTimer: 0,
      mirrorTimer: attackDelay(2.5),
      timeHistory: [],
      timeTimer: 0,
      voidTimer: attackDelay(4),
      voidPhase: "mark",
      voidMarks: [],
      teleportTimer: attackDelay(3),
      splitterTimer: attackDelay(3),
      predictorTimer: attackDelay(2.5),
      pulseTimer: attackDelay(5),
      pulseRadius: 0,
      mimicTimer: attackDelay(3),
      huntTimer: attackDelay(4),
      huntPhase: "track",
      huntTargetX: x,
      huntTargetY: y,
      prismTimer: attackDelay(2.5),
      prismAngle: rnd(0, TAU),
      riftTimer: attackDelay(4),
      swarmTimer: attackDelay(4),
      railTimer: attackDelay(5),
      railPhase: "idle",
      railAngle: 0,
      gravityTimer: attackDelay(5),
      gravityLife: 0,
      gravityX: x,
      gravityY: y,
      decoyTimer: attackDelay(4),
      decoys: [],
      ricochetTimer: attackDelay(3),
      seekerTimer: attackDelay(4),
    });
  }
  function attackDelay(base) {
    const frenzy = Math.pow(0.82, state.chainLevels.frenzy || 0);
    const relentless = Math.pow(0.9, state.chainLevels.relentless || 0);
    const timeBreak = Math.pow(1.25, state.superUpgrades.timestop || 0);
    const swing = state.chainLevels.closecall ? 2.5 : 2;
    return Math.max(
      0.2,
      base * frenzy * relentless * timeBreak + rnd(-swing, swing),
    );
  }
  function playerJumpSafe() {
    return state.player.jump > (state.chainLevels.fragile ? 0.22 : 0);
  }
  function enemySpeed(e) {
    const b =
      {
        shooter: 70,
        shotgun: 62,
        beam: 58,
        shock: 45,
        sword: 65,
        dasher: 80,
        burst: 48,
        hunter: 42,
        mine: 52,
        orbiter: 52,
        repeater: 74,
        mirror: 60,
        timekeeper: 55,
        voidcaster: 48,
        teleporter: 58,
        splitter: 44,
        predictor: 52,
        pulsar: 42,
        mimic: 62,
        voidhunter: 50,
        prism: 52,
        rift: 45,
        swarmcore: 58,
        railgun: 42,
        gravity: 35,
        decoy: 55,
        ricochet: 48,
        seeker: 62,
      }[e.type] || 60;
    let out = state.weaken === e.type ? b * 0.62 : b;
    if ((state.bloodrushTimer || 0) > 0) out *= 1.35;
    return out;
  }
  function tryJump() {
    if (state.player.jump <= 0) state.player.jump = state.player.jumpMax;
  }
  function enemyBullet(x, y, a, speed = 210) {
    speed *= Math.pow(1.2, state.chainLevels.overclock || 0);
    const add = (aa) =>
      state.enemyShots.push({
        x: x + Math.cos(aa) * 22,
        y: y + Math.sin(aa) * 22,
        vx: Math.cos(aa) * speed,
        vy: Math.sin(aa) * speed,
        r: 7,
        life: 8,
        sizeScale: state.sizeScale,
      });
    add(a);
    const extra = state.chainLevels.bulletstorm || 0;
    for (let k = 1; k <= extra; k++) {
      const spread = 0.11 * k;
      add(a + spread);
    }
  }
  function startDash() {
    if (state.player.cooldown > 0 || (state.player.jump > 0 && false)) return;
    state.player.dashTime = 0.28;
    state.player.dashCooldown = 1.0;
    state.player.dashV = 650 + state.classCore * 100;
    state.player.dashX = state.player.x;
    state.player.dashY = state.player.y;
    state.player.dashAngle = state.player.angle;
    state.player.cooldown = state.player.dashCooldown;
  }
  function toggleGhost() {
    const g = state.ghost;
    if (!g) return;
    if (g.active) {
      g.active = false;
      state.player.x = g.anchorX;
      state.player.y = g.anchorY;
      g.cooldown = 10 - Math.min(5, state.classCore);
      g.hits = 0;
    } else if (g.cooldown <= 0) {
      g.active = true;
      g.anchorX = state.player.x;
      g.anchorY = state.player.y;
      g.hits = 1;
    }
  }
  function hurtPlayer(source) {
    const p = state.player,
      g = state.ghost;
    if ((p.invuln || 0) > 0) return false;
    if ((state.emergencyShield || 0) > 0) {
      state.emergencyShield--;
      showMessage("VOID HEART SAVED YOU");
      return false;
    }
    if (g && g.active && g.hits > 0) {
      g.hits--;
      showMessage("GHOST HIT ABSORBED");
      return false;
    }
    die();
    return true;
  }
  function update(dt) {
    state.player.angle = angleTo(state.player, mouse);
    if (state.mode === "altar") {
      state.altarCooldown = Math.max(0, state.altarCooldown - dt);
      updateDOM();
      return;
    }
    if (state.mode !== "play") {
      updateDOM();
      return;
    }
    const p = state.player;
    p.invuln = Math.max(0, (p.invuln || 0) - dt);
    state.bloodrushTimer = Math.max(0, (state.bloodrushTimer || 0) - dt);
    p.cooldown = Math.max(0, p.cooldown - dt);
    updateBinders(dt);
    if (p.jump > 0) p.jump = Math.max(0, p.jump - dt);
    p.angle = angleTo(p, mouse);
    const mx =
        (keys.d || keys.arrowright ? 1 : 0) -
        (keys.a || keys.arrowleft ? 1 : 0),
      my =
        (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0),
      len = Math.hypot(mx, my) || 1;
    let sp = 245 + state.upgrades.speed * 35;
    if (state.ghost.active) sp *= 0.62 + Math.min(0.25, state.classCore * 0.04);
    if (state.player.dashTime > 0) {
      state.player.dashTime -= dt;
      p.x += Math.cos(state.player.dashAngle) * state.player.dashV * dt;
      p.y += Math.sin(state.player.dashAngle) * state.player.dashV * dt;
      for (const e of state.enemies)
        if (e.alive && dist(p, e) < (p.r + e.r) * state.sizeScale + 8) {
          if (state.className === "dasher") {
            e.alive = false;
            state.bloodrushTimer = 2.5;
            for (let k = 0; k < 10; k++)
              particle(e.x, e.y, enemyDefs[e.type].color, 0.45);
          } else if (e.type === "hunter") {
            hurtPlayer(e);
          }
        }
      if (state.player.dashTime <= 0) state.player.cooldown = 0;
    } else {
      p.x = clamp(
        p.x + (mx / len) * sp * dt,
        arena.x + 15,
        arena.x + arena.w - 15,
      );
      p.y = clamp(
        p.y + (my / len) * sp * dt,
        arena.y + 15,
        arena.y + arena.h - 15,
      );
    }
    p.x = clamp(p.x, arena.x + 15, arena.x + arena.w - 15);
    p.y = clamp(p.y, arena.y + 15, arena.y + arena.h - 15);
    if (state.ghost.cooldown > 0)
      state.ghost.cooldown = Math.max(0, state.ghost.cooldown - dt);
    if (mouse.down) firePlayer();
    for (const s of state.shots) {
      if (state.upgrades.homing) {
        let target = null,
          best = Infinity;
        for (const e of state.enemies)
          if (e.alive) {
            const d = dist(s, e);
            if (d < best) {
              best = d;
              target = e;
            }
          }
        if (target) {
          const ta = angleTo(s, target),
            ca = Math.atan2(s.vy, s.vx),
            turn = Math.max(
              -2.2 * dt,
              Math.min(
                2.2 * dt,
                Math.atan2(Math.sin(ta - ca), Math.cos(ta - ca)),
              ),
            );
          const na = ca + turn;
          const sp = Math.hypot(s.vx, s.vy);
          s.vx = Math.cos(na) * sp;
          s.vy = Math.sin(na) * sp;
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
    }
    state.shots = state.shots.filter(
      (s) =>
        s.life > 0 &&
        s.x > arena.x - 30 &&
        s.x < arena.x + arena.w + 30 &&
        s.y > arena.y - 30 &&
        s.y < arena.y + arena.h + 30,
    );
    if (state.grapple) {
      const g = state.grapple;
      for (const e of state.enemies)
        if (e.alive && dist(g, e) < e.r + g.r) {
          e.alive = false;
          state.bloodrushTimer = 2.5;
          for (let k = 0; k < 10; k++)
            particle(e.x, e.y, enemyDefs[e.type].color, 0.45);
        }
      if (g.phase === "travel") {
        const d = dist(g, { x: g.targetX, y: g.targetY }),
          step = (620 + state.classCore * 70) * dt;
        if (d <= step) {
          g.x = g.targetX;
          g.y = g.targetY;
          g.phase = "pull";
        } else {
          g.x += g.vx * dt;
          g.y += g.vy * dt;
        }
      }
    }
    if (state.grapple && state.grapple.phase === "pull") {
      const g = state.grapple;
      const target = { x: g.targetX, y: g.targetY },
        d0 = dist(p, target),
        pull = 285 + state.classCore * 45;
      if (d0 <= pull * dt) {
        p.x = g.targetX;
        p.y = g.targetY;
        state.grapple = null;
      } else {
        const a = angleTo(p, target);
        p.x += Math.cos(a) * pull * dt;
        p.y += Math.sin(a) * pull * dt;
      }
    }
    for (const e of state.enemies) if (e.alive) updateEnemy(e, dt);
    if ((state.chainLevels.blackhole || 0) > 0) {
      state.blackholeTimer = (state.blackholeTimer || 0) - dt;
      if (state.blackholeTimer <= 0) {
        state.blackholeTimer = 7;
        state.blackhole = {
          x: rnd(arena.x + 70, arena.x + arena.w - 70),
          y: rnd(arena.y + 70, arena.y + arena.h - 70),
          life: 2.5,
        };
      }
      if (state.blackhole && state.blackhole.life > 0) {
        state.blackhole.life -= dt;
        if (dist(p, state.blackhole) < 72 && !playerJumpSafe()) {
          if (hurtPlayer(state.blackhole)) return;
        }
      }
    }
    for (const b of state.enemyShots) {
      if (b.seeker) {
        const a = angleTo(b, p);
        const sp = Math.min(360, (b.seekerSpeed || 120) + 80 * dt);
        b.vx = Math.cos(a) * sp;
        b.vy = Math.sin(a) * sp;
        b.seekerSpeed = sp;
      }
      if (b.ricochet) {
        if (b.x + b.r > arena.x + arena.w || b.x - b.r < arena.x) {
          b.vx *= -1;
          b.ricochet--;
        }
        if (b.y + b.r > arena.y + arena.h || b.y - b.r < arena.y) {
          b.vy *= -1;
          b.ricochet--;
        }
      }
      if (b.orbit && b.orbitEnemy && b.orbitEnemy.alive) {
        b.orbitAngle += b.orbitSpeed * dt;
        b.orbitTime -= dt;
        b.x = b.orbitEnemy.x + Math.cos(b.orbitAngle) * b.orbitRadius;
        b.y = b.orbitEnemy.y + Math.sin(b.orbitAngle) * b.orbitRadius;
        if (b.orbitTime <= 0) {
          b.orbit = false;
          b.vx = Math.cos(b.orbitAngle) * b.releaseSpeed;
          b.vy = Math.sin(b.orbitAngle) * b.releaseSpeed;
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.splitter && !b.splitDone && b.life < 3.9) {
        b.splitDone = true;
        const base = Math.atan2(b.vy, b.vx);
        for (let k = -2; k <= 2; k++)
          enemyBullet(b.x, b.y, base + k * 0.22, 215);
      }
      b.life -= dt;
    }
    state.enemyShots = state.enemyShots.filter(
      (b) =>
        b.life > 0 &&
        b.x > arena.x - 100 &&
        b.x < arena.x + arena.w + 100 &&
        b.y > arena.y - 100 &&
        b.y < arena.y + arena.h + 100,
    );
    for (const e of state.enemies) {
      if (!e.alive) continue;
      for (let j = state.shots.length - 1; j >= 0; j--)
        if (circleHit(e, state.shots[j])) {
          for (let k = 0; k < 10; k++)
            particle(e.x, e.y, enemyDefs[e.type].color, 0.45);
          e.alive = false;
          if (state.shots[j].pierces > 0) state.shots[j].pierces--;
          else state.shots.splice(j, 1);
          break;
        }
    }
    for (const b of state.enemyShots)
      if (dist(p, b) < (p.r + b.r) * state.sizeScale && !playerJumpSafe()) {
        if (hurtPlayer(b)) return;
      }
    if (roundEnemiesDefeated()) {
      completeLevel();
      return;
    }
    updateHud();
    updateDOM();
  }
  function beamHitTraveling(p, e, a, progress) {
    const dx = Math.cos(a),
      dy = Math.sin(a);
    const px = p.x - e.x,
      py = p.y - e.y;
    const along = px * dx + py * dy;
    const side = Math.abs(px * dy - py * dx);
    return along >= 0 && along <= progress && side < 16;
  }
  function updateEnemy(e, dt) {
    const p = state.player;
    e.angle = angleTo(e, p);
    if (e.type === "shooter") {
      e.attack -= dt;
      if (e.attack <= 0) {
        enemyBullet(e.x, e.y, e.angle, 205);
        e.attack = attackDelay(2);
      }
    } else if (e.type === "shotgun") {
      e.attack -= dt;
      if (e.attack <= 0) {
        for (let k = -1; k <= 1; k++)
          enemyBullet(e.x, e.y, e.shotAngle + k * 0.28, 185);
        e.shotAngle += Math.PI / 4;
        e.attack = attackDelay(2);
      }
    } else if (e.type === "beam") {
      // The BEAM enemy itself is stationary. The beam hazard is what travels.
      if (e.phase === "idle") {
        e.phaseTimer -= dt;
        if (e.phaseTimer <= 0) {
          e.phase = "warn";
          e.phaseTimer = attackDelay(3);
          e.lockedAngle = angleTo(e, p);
          e.beamProgress = 0;
        }
      } else if (e.phase === "warn") {
        // Keep tracking the player during the warning, then lock the direction.
        e.lockedAngle = angleTo(e, p);
        e.phaseTimer -= dt;
        if (e.phaseTimer <= 0) {
          e.phase = "fire";
          e.phaseTimer = attackDelay(3);
          e.beamProgress = 0;
        }
      } else if (e.phase === "fire") {
        // Slow-moving beam front: the player can outrun it.
        e.beamProgress += 175 * dt;
        if (
          beamHitTraveling(p, e, e.lockedAngle, e.beamProgress) &&
          !playerJumpSafe()
        ) {
          die();
          return;
        }
        e.phaseTimer -= dt;
        if (e.phaseTimer <= 0) {
          e.phase = "cool";
          e.phaseTimer = attackDelay(10);
          e.beamProgress = 0;
        }
      } else if (e.phase === "cool") {
        e.phaseTimer -= dt;
        if (e.phaseTimer <= 0) {
          e.phase = "idle";
          e.phaseTimer = 0;
        }
      }
    } else if (e.type === "shock") {
      if (e.phase === "idle") {
        e.phaseTimer -= dt;
        if (e.phaseTimer <= 0) {
          e.phase = "jump";
          e.phaseTimer = attackDelay(2);
          e.targetX = rnd(arena.x + 60, arena.x + arena.w - 60);
          e.targetY = rnd(arena.y + 60, arena.y + arena.h - 60);
          e.jumpScale = 1;
        }
      } else if (e.phase === "jump") {
        e.phaseTimer -= dt;
        e.jumpScale = 1 + Math.sin(((2 - e.phaseTimer) / 2) * Math.PI) * 0.75;
        const a = angleTo(e, { x: e.targetX, y: e.targetY }),
          d = Math.min(
            dist(e, { x: e.targetX, y: e.targetY }),
            enemySpeed(e) * dt * 1.7,
          );
        e.x += Math.cos(a) * d;
        e.y += Math.sin(a) * d;
        if (e.phaseTimer <= 0) {
          e.x = e.targetX;
          e.y = e.targetY;
          e.jumpScale = 1;
          e.phase = "wave";
          e.wave = 0;
          if (dist(p, e) < 48 && !playerJumpSafe()) {
            if (hurtPlayer(e)) return;
          }
        }
      } else {
        e.wave += 120 * dt;
        if (Math.abs(dist(p, e) - e.wave) < 14 && !playerJumpSafe()) {
          if (hurtPlayer(e)) return;
        }
        if (e.wave > Math.max(arena.w, arena.h) * 1.25) {
          e.phase = "idle";
          e.phaseTimer = attackDelay(5);
        }
      }
    } else if (e.type === "sword") {
      // The enemy teleports independently every 5 seconds. Its sword hazard is anchored
      // around the player at a fixed distance and fixed angle for 6 seconds.
      e.teleport -= dt;
      if (e.teleport <= 0) {
        e.x = rnd(arena.x + 60, arena.x + arena.w - 60);
        e.y = rnd(arena.y + 60, arena.y + arena.h - 60);
        e.teleport = 5;
      }
      if (e.phase === "idle") {
        e.swordTimer += dt;
        // While waiting, keep the smaller sword just outside the player.
        e.swordX = p.x - Math.cos(e.swordAngle) * 100;
        e.swordY = p.y - Math.sin(e.swordAngle) * 100;
        if (e.swordTimer >= 6) {
          e.phase = "windup";
          e.phaseTimer = 1;
        }
      } else if (e.phase === "windup") {
        e.swordX = p.x - Math.cos(e.swordAngle) * 100;
        e.swordY = p.y - Math.sin(e.swordAngle) * 100;
        e.phaseTimer -= dt;
        if (e.phaseTimer <= 0) {
          e.phase = "strike";
          e.swordActive = true;
        }
      } else if (e.phase === "strike") {
        // Once it attacks, the sword leaves the player and travels in the direction it points.
        const speed = 300;
        e.swordX += Math.cos(e.swordAngle) * speed * dt;
        e.swordY += Math.sin(e.swordAngle) * speed * dt;
        const dx = p.x - e.swordX,
          dy = p.y - e.swordY;
        const along = dx * Math.cos(e.swordAngle) + dy * Math.sin(e.swordAngle);
        const side = Math.abs(
          dx * Math.sin(e.swordAngle) - dy * Math.cos(e.swordAngle),
        );
        if (along >= -80 && along <= 10 && side < 16 && !playerJumpSafe()) {
          if (hurtPlayer(e)) return;
        }
        if (
          e.swordX < arena.x - 120 ||
          e.swordX > arena.x + arena.w + 120 ||
          e.swordY < arena.y - 120 ||
          e.swordY > arena.y + arena.h + 120
        ) {
          e.phase = "idle";
          e.swordActive = false;
          e.swordTimer = 0;
          e.swordDelay = attackDelay(6);
          e.swordAngle = rnd(-Math.PI, Math.PI);
        }
      }
    } else if (e.type === "dasher") {
      if (e.dashPhase === "idle") {
        e.dashTimer -= dt;
        if (e.dashTimer <= 0) {
          e.dashPhase = "warn";
          e.dashTimer = 1;
          e.dashX = p.x;
          e.dashY = p.y;
          e.dashAngle = angleTo(e, { x: e.dashX, y: e.dashY });
        }
      } else if (e.dashPhase === "warn") {
        e.dashTimer -= dt;
        if (e.dashTimer <= 0) e.dashPhase = "dash";
      } else {
        const sp = enemySpeed(e) * 5;
        e.x += Math.cos(e.dashAngle) * sp * dt;
        e.y += Math.sin(e.dashAngle) * sp * dt;
        if (dist(p, e) < (p.r + e.r) * state.sizeScale && !playerJumpSafe()) {
          if (hurtPlayer(e)) return;
        }
        if (
          e.x < arena.x - 80 ||
          e.x > arena.x + arena.w + 80 ||
          e.y < arena.y - 80 ||
          e.y > arena.y + arena.h + 80
        ) {
          e.x = clamp(e.x, arena.x + 30, arena.x + arena.w - 30);
          e.y = clamp(e.y, arena.y + 30, arena.y + arena.h - 30);
          e.dashPhase = "idle";
          e.dashTimer = attackDelay(5);
        }
      }
    } else if (e.type === "burst") {
      e.attack -= dt;
      if (e.attack <= 0) {
        for (let k = 0; k < 12; k++) enemyBullet(e.x, e.y, (k * TAU) / 12, 155);
        e.attack = attackDelay(5);
      }
    } else if (e.type === "hunter") {
      const a = angleTo(e, p),
        sp = enemySpeed(e);
      e.x += Math.cos(a) * sp * dt;
      e.y += Math.sin(a) * sp * dt;
      e.x = clamp(e.x, arena.x + 25, arena.x + arena.w - 25);
      e.y = clamp(e.y, arena.y + 25, arena.y + arena.h - 25);
      if (dist(p, e) < (p.r + e.r) * state.sizeScale && !playerJumpSafe()) {
        if (hurtPlayer(e)) return;
      }
    } else if (e.type === "mine") {
      e.mineTimer -= dt;
      if (e.mineTimer <= 0) {
        e.mines.push({ x: e.x, y: e.y, life: 12 });
        e.mineTimer = attackDelay(4);
      }
      for (const m of e.mines) m.life -= dt;
      e.mines = e.mines.filter((m) => m.life > 0);
      for (const m of e.mines)
        if (dist(p, m) < 28 && !playerJumpSafe()) {
          if (hurtPlayer(m)) return;
        }
    } else if (e.type === "orbiter") {
      e.orbitTimer -= dt;
      if (e.orbitTimer <= 0) {
        for (let k = 0; k < 3; k++) {
          const a = e.angle + (k * TAU) / 3;
          state.enemyShots.push({
            x: e.x + Math.cos(a) * 42,
            y: e.y + Math.sin(a) * 42,
            vx: 0,
            vy: 0,
            r: 7,
            life: 8,
            orbit: true,
            orbitEnemy: e,
            orbitAngle: a,
            orbitSpeed: 1.8,
            orbitRadius: 42,
            orbitTime: 2.5,
            releaseSpeed: 190,
          });
        }
        e.orbitTimer = attackDelay(5);
      }
    } else if (e.type === "repeater") {
      e.historyTimer += dt;
      if (e.historyTimer >= 0.12) {
        e.historyTimer = 0;
        e.history.push({ x: p.x, y: p.y });
        if (e.history.length > 55) e.history.shift();
      }
      if (e.history.length > 18) {
        const t = e.history[Math.max(0, e.history.length - 18)];
        const a = angleTo(e, t);
        e.x += Math.cos(a) * enemySpeed(e) * dt;
        e.y += Math.sin(a) * enemySpeed(e) * dt;
      }
      e.x = clamp(e.x, arena.x + 20, arena.x + arena.w - 20);
      e.y = clamp(e.y, arena.y + 20, arena.y + arena.h - 20);
      if (dist(p, e) < (p.r + e.r) * state.sizeScale && !playerJumpSafe()) {
        if (hurtPlayer(e)) return;
      }
    } else if (e.type === "mirror") {
      e.mirrorTimer -= dt;
      const tx = arena.x + arena.w - (p.x - arena.x);
      const ty = arena.y + arena.h - (p.y - arena.y);
      const a = angleTo(e, { x: tx, y: ty });
      e.x += Math.cos(a) * enemySpeed(e) * dt;
      e.y += Math.sin(a) * enemySpeed(e) * dt;
      e.x = clamp(e.x, arena.x + 20, arena.x + arena.w - 20);
      e.y = clamp(e.y, arena.y + 20, arena.y + arena.h - 20);
      if (e.mirrorTimer <= 0) {
        enemyBullet(e.x, e.y, angleTo(e, p), 250);
        e.mirrorTimer = attackDelay(2.5);
      }
      if (dist(p, e) < (p.r + e.r) * state.sizeScale && !playerJumpSafe()) {
        if (hurtPlayer(e)) return;
      }
    } else if (e.type === "timekeeper") {
      e.timeTimer += dt;
      if (e.timeTimer >= 0.1) {
        e.timeTimer = 0;
        e.timeHistory.push({ x: p.x, y: p.y });
        if (e.timeHistory.length > 80) e.timeHistory.shift();
      }
      e.x += Math.cos(e.angle) * enemySpeed(e) * 0.35 * dt;
      e.y += Math.sin(e.angle) * enemySpeed(e) * 0.35 * dt;
      e.x = clamp(e.x, arena.x + 25, arena.x + arena.w - 25);
      e.y = clamp(e.y, arena.y + 25, arena.y + arena.h - 25);
      if (e.timeHistory.length > 30) {
        e.attack -= dt;
        if (e.attack <= 0) {
          const t = e.timeHistory[Math.max(0, e.timeHistory.length - 30)];
          enemyBullet(e.x, e.y, angleTo(e, t), 235);
          e.attack = attackDelay(2.5);
        }
      }
    } else if (e.type === "voidcaster") {
      e.voidTimer -= dt;
      if (e.voidPhase === "mark" && e.voidTimer <= 0) {
        e.voidMarks = [];
        for (let k = 0; k < 4; k++) {
          const a = Math.random() * TAU;
          const d = rnd(70, 190);
          e.voidMarks.push({
            x: clamp(
              p.x + Math.cos(a) * d,
              arena.x + 35,
              arena.x + arena.w - 35,
            ),
            y: clamp(
              p.y + Math.sin(a) * d,
              arena.y + 35,
              arena.y + arena.h - 35,
            ),
          });
        }
        e.voidPhase = "detonate";
        e.voidTimer = 1.4;
      } else if (e.voidPhase === "detonate" && e.voidTimer <= 0) {
        for (const m of e.voidMarks) {
          for (let k = 0; k < 8; k++) enemyBullet(m.x, m.y, (k * TAU) / 8, 175);
        }
        e.voidPhase = "mark";
        e.voidTimer = attackDelay(4);
      }
    } else if (e.type === "teleporter") {
      e.teleportTimer -= dt;
      if (e.teleportTimer <= 0) {
        e.x = rnd(arena.x + 45, arena.x + arena.w - 45);
        e.y = rnd(arena.y + 45, arena.y + arena.h - 45);
        for (let k = -1; k <= 1; k++)
          enemyBullet(e.x, e.y, e.angle + k * 0.2, 270);
        e.teleportTimer = attackDelay(3);
      }
    } else if (e.type === "splitter") {
      e.splitterTimer -= dt;
      if (e.splitterTimer <= 0) {
        state.enemyShots.push({
          x: e.x + Math.cos(e.angle) * 24,
          y: e.y + Math.sin(e.angle) * 24,
          vx: Math.cos(e.angle) * 125,
          vy: Math.sin(e.angle) * 125,
          r: 12,
          life: 5,
          splitter: true,
        });
        e.splitterTimer = attackDelay(3.5);
      }
    } else if (e.type === "predictor") {
      e.predictorTimer -= dt;
      if (e.predictorTimer <= 0) {
        const mx =
          (keys.d || keys.arrowright ? 1 : 0) -
          (keys.a || keys.arrowleft ? 1 : 0);
        const my =
          (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
        const len = Math.hypot(mx, my) || 1;
        const lead = 0.7;
        const target = {
          x: p.x + (mx / len) * 245 * lead,
          y: p.y + (my / len) * 245 * lead,
        };
        enemyBullet(e.x, e.y, angleTo(e, target), 245);
        e.predictorTimer = attackDelay(2.5);
      }
    } else if (e.type === "pulsar") {
      e.pulseTimer -= dt;
      if (e.pulseTimer <= 0 && e.pulseRadius <= 0) {
        e.pulseRadius = 8;
        e.pulseTimer = attackDelay(5);
      }
      if (e.pulseRadius > 0) {
        e.pulseRadius += 210 * dt;
        if (Math.abs(dist(p, e) - e.pulseRadius) < 16 && !playerJumpSafe()) {
          if (hurtPlayer(e)) return;
        }
        if (e.pulseRadius > Math.max(arena.w, arena.h) * 1.25)
          e.pulseRadius = 0;
      }
    } else if (e.type === "mimic") {
      e.mimicTimer -= dt;
      const a = angleTo(e, p);
      e.x += Math.cos(a) * enemySpeed(e) * 0.55 * dt;
      e.y += Math.sin(a) * enemySpeed(e) * 0.55 * dt;
      if (e.mimicTimer <= 0) {
        for (let k = -2; k <= 2; k++)
          enemyBullet(e.x, e.y, e.angle + k * 0.18, 225);
        e.mimicTimer = attackDelay(3);
      }
      if (dist(p, e) < (p.r + e.r) * state.sizeScale && !playerJumpSafe()) {
        if (hurtPlayer(e)) return;
      }
    } else if (e.type === "voidhunter") {
      if (e.huntPhase === "track") {
        e.huntTimer -= dt;
        e.x += Math.cos(e.angle) * enemySpeed(e) * dt;
        e.y += Math.sin(e.angle) * enemySpeed(e) * dt;
        if (e.huntTimer <= 0) {
          e.huntTargetX = p.x;
          e.huntTargetY = p.y;
          e.huntPhase = "lunge";
          e.huntTimer = 1.2;
          e.angle = angleTo(e, { x: e.huntTargetX, y: e.huntTargetY });
        }
      } else {
        e.x += Math.cos(e.angle) * 430 * dt;
        e.y += Math.sin(e.angle) * 430 * dt;
        if (
          dist(p, e) < (p.r + e.r) * state.sizeScale + 4 &&
          !playerJumpSafe()
        ) {
          if (hurtPlayer(e)) return;
        }
        e.huntTimer -= dt;
        if (
          e.huntTimer <= 0 ||
          e.x < arena.x - 100 ||
          e.x > arena.x + arena.w + 100 ||
          e.y < arena.y - 100 ||
          e.y > arena.y + arena.h + 100
        ) {
          e.x = clamp(e.x, arena.x + 30, arena.x + arena.w - 30);
          e.y = clamp(e.y, arena.y + 30, arena.y + arena.h - 30);
          e.huntPhase = "track";
          e.huntTimer = attackDelay(4);
        }
      }
    } else if (e.type === "prism") {
      e.prismTimer -= dt;
      e.prismAngle += 0.8 * dt;
      if (e.prismTimer <= 0) {
        for (let k = 0; k < 3; k++)
          enemyBullet(e.x, e.y, e.prismAngle + (k * TAU) / 3, 230);
        e.prismTimer = attackDelay(2.5);
      }
    } else if (e.type === "rift") {
      e.riftTimer -= dt;
      if (e.riftTimer <= 0) {
        const x = rnd(arena.x + 30, arena.x + arena.w - 30),
          y = rnd(arena.y + 30, arena.y + arena.h - 30);
        for (let k = 0; k < 4; k++)
          enemyBullet(x, y, angleTo({ x, y }, p) + rnd(-0.5, 0.5), 205);
        e.riftTimer = attackDelay(4);
      }
    } else if (e.type === "swarmcore") {
      e.swarmTimer -= dt;
      if (e.swarmTimer <= 0) {
        for (let k = 0; k < 5; k++) {
          const a = angleTo(e, p) + rnd(-0.7, 0.7);
          enemyBullet(e.x, e.y, a, 150);
        }
        e.swarmTimer = attackDelay(4);
      }
    } else if (e.type === "railgun") {
      if (e.railPhase === "idle") {
        e.railTimer -= dt;
        if (e.railTimer <= 0) {
          e.railPhase = "warn";
          e.railTimer = 1.5;
          e.railAngle = angleTo(e, p);
        }
      } else if (e.railPhase === "warn") {
        e.railTimer -= dt;
        if (e.railTimer <= 0) {
          enemyBullet(e.x, e.y, e.railAngle, 650);
          e.railPhase = "idle";
          e.railTimer = attackDelay(5);
        }
      }
    } else if (e.type === "gravity") {
      e.gravityTimer -= dt;
      if (e.gravityTimer <= 0 && e.gravityLife <= 0) {
        e.gravityX = rnd(arena.x + 80, arena.x + arena.w - 80);
        e.gravityY = rnd(arena.y + 80, arena.y + arena.h - 80);
        e.gravityLife = 3;
        e.gravityTimer = attackDelay(5);
      }
      if (e.gravityLife > 0) {
        e.gravityLife -= dt;
        const d = dist(p, { x: e.gravityX, y: e.gravityY });
        if (d < 150) {
          const a = angleTo(p, { x: e.gravityX, y: e.gravityY });
          p.x += Math.cos(a) * Math.max(0, 150 - d) * 0.8 * dt;
          p.y += Math.sin(a) * Math.max(0, 150 - d) * 0.8 * dt;
        }
      }
    } else if (e.type === "decoy") {
      e.decoyTimer -= dt;
      if (e.decoyTimer <= 0) {
        e.decoys = [];
        for (let k = 0; k < 3; k++)
          e.decoys.push({
            x: clamp(
              e.x + rnd(-140, 140),
              arena.x + 25,
              arena.x + arena.w - 25,
            ),
            y: clamp(
              e.y + rnd(-140, 140),
              arena.y + 25,
              arena.y + arena.h - 25,
            ),
          });
        for (const d of e.decoys) enemyBullet(d.x, d.y, angleTo(d, p), 210);
        e.decoyTimer = attackDelay(4);
      }
    } else if (e.type === "ricochet") {
      e.ricochetTimer -= dt;
      if (e.ricochetTimer <= 0) {
        const a = angleTo(e, p);
        state.enemyShots.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(a) * 260,
          vy: Math.sin(a) * 260,
          r: 7,
          life: 9,
          ricochet: 3,
        });
        e.ricochetTimer = attackDelay(3);
      }
    } else if (e.type === "seeker") {
      e.seekerTimer -= dt;
      if (e.seekerTimer <= 0) {
        const a = angleTo(e, p);
        state.enemyShots.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(a) * 120,
          vy: Math.sin(a) * 120,
          r: 9,
          life: 8,
          seeker: true,
          seekerSpeed: 120,
        });
        e.seekerTimer = attackDelay(4);
      }
    }
  }
  function pointBeamHit(p, e, a) {
    const dx = p.x - e.x,
      dy = p.y - e.y;
    return Math.abs(dx * Math.sin(a) - dy * Math.cos(a)) < 14;
  }
  function die() {
    if (state.mode !== "play") return;
    state.mode = "dead";
    state.player.alive = false;
    gameOverText.textContent = `You reached level ${state.level}.`;
    gameOverScreen.classList.remove("hidden");
    updateDOM();
  }
  function roundEnemiesDefeated() {
    if (!state.roundEnemyIds.length) return false;
    return state.roundEnemyIds.every((id) => {
      const e = state.enemies.find((x) => x.id === id);
      return !e || !e.alive;
    });
  }
  function completeLevel() {
    updateHud();
    state.mode = "between";
    showMessage("ROUND CLEARED");
    const token = ++state.transitionToken;
    setTimeout(() => {
      if (token !== state.transitionToken || state.mode !== "between") return;
      state.completedRounds++;
      state.round++;
      state.level = state.round;
      if (state.completedRounds % 10 === 0) {
        state.sizeScale *= 0.9;
        showMessage("VOID SHRINK — 10% SMALLER");
      }
      state.pendingUpgrade = state.completedRounds % 3 === 0;
      state.pendingChain = state.completedRounds % 5 === 0;
      state.shots = [];
      state.enemyShots = [];
      state.binders = [];
      if (state.pendingUpgrade) showUpgrades();
      else if (state.pendingChain) showChains();
      else showAltar();
    }, 650);
  }
  function particle(x, y, c, life) {
    state.particles.push({
      x,
      y,
      vx: rnd(-70, 70),
      vy: rnd(-70, 70),
      life,
      max: life,
      color: c,
    });
  }
  function updateParticles(dt) {
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
  }
  function showMessage(t) {
    message.textContent = t;
    message.style.opacity = 1;
    clearTimeout(showMessage.t);
    showMessage.t = setTimeout(() => (message.style.opacity = 0), 1000);
  }
  function aliveEnemyCount() {
    let n = 0;
    for (const e of state.enemies) if (e.alive) n++;
    return n;
  }
  function updateHud() {
    updateBinderHud();
    levelText.textContent = state.level;
    roundText.textContent = state.round;
    enemyText.textContent = aliveEnemyCount();
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawArena();
    if (state.mode !== "start") drawWorld();
    drawParticles();
    requestAnimationFrame(draw);
  }
  function drawBackground() {
    const g = ctx.createRadialGradient(
      W / 2,
      H / 2,
      20,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.7,
    );
    g.addColorStop(0, "#190522");
    g.addColorStop(1, "#030106");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  function drawArena() {
    ctx.save();
    ctx.fillStyle = "#07040c";
    ctx.fillRect(arena.x, arena.y, arena.w, arena.h);
    ctx.strokeStyle = "#6b2b91";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#ff2bd6";
    ctx.shadowBlur = 18;
    ctx.strokeRect(arena.x, arena.y, arena.w, arena.h);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#21132d";
    ctx.lineWidth = 1;
    for (let x = arena.x + 58; x < arena.x + arena.w; x += 58) {
      ctx.beginPath();
      ctx.moveTo(x, arena.y);
      ctx.lineTo(x, arena.y + arena.h);
      ctx.stroke();
    }
    for (let y = arena.y + 58; y < arena.y + arena.h; y += 58) {
      ctx.beginPath();
      ctx.moveTo(arena.x, y);
      ctx.lineTo(arena.x + arena.w, y);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawWorld() {
    for (const e of state.enemies) if (e.alive) drawEnemy(e);
    for (const b of state.enemyShots) drawEnemyShot(b);
    if (state.blackhole && state.blackhole.life > 0) {
      ctx.save();
      ctx.strokeStyle = "#9f6bff";
      ctx.lineWidth = 5;
      ctx.shadowColor = "#9f6bff";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(state.blackhole.x, state.blackhole.y, 72, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    for (const s of state.shots) drawShot(s);
    for (const b of state.binders) {
      ctx.save();
      ctx.fillStyle = "#ffd84a";
      ctx.shadowColor = "#ffd84a";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * state.sizeScale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    if (state.grapple) {
      ctx.save();
      ctx.strokeStyle = "#6ff7ff";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#6ff7ff";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(state.player.x, state.player.y);
      ctx.lineTo(state.grapple.x, state.grapple.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(state.grapple.x, state.grapple.y, 8, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
  function drawEnemy(e) {
    const c = enemyDefs[e.type].color;
    ctx.save();
    ctx.translate(e.x, e.y);
    const enemyScale =
      state.sizeScale * Math.pow(1.18, state.chainLevels.heavy || 0);
    ctx.scale(enemyScale * (e.jumpScale || 1), enemyScale * (e.jumpScale || 1));
    ctx.shadowColor = c;
    ctx.shadowBlur = 22;
    ctx.fillStyle = c;
    if (e.type === "shooter") {
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#16071d";
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.fill();
    } else if (e.type === "shotgun") {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-17, -17, 34, 34);
      ctx.fillStyle = "#16071d";
      ctx.fillRect(-7, -7, 14, 14);
    } else if (e.type === "beam") {
      ctx.beginPath();
      ctx.moveTo(0, -21);
      ctx.lineTo(18, 18);
      ctx.lineTo(-18, 18);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === "shock") {
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (e.type === "dasher") {
      ctx.rotate(e.dashAngle);
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(-16, -13);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-16, 13);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === "burst") {
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, TAU);
      ctx.fill();
      for (let k = 0; k < 8; k++) {
        const a = (k * TAU) / 8;
        ctx.fillRect(Math.cos(a) * 24 - 3, Math.sin(a) * 24 - 3, 6, 6);
      }
    } else if (e.type === "hunter") {
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#06140b";
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, TAU);
      ctx.fill();
    } else if (e.type === "mine") {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-16, -16, 32, 32);
      ctx.fillStyle = "#06121a";
      ctx.fillRect(-6, -6, 12, 12);
    } else if (e.type === "orbiter") {
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 27, 0, TAU);
      ctx.stroke();
    } else {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-16, -16, 32, 32);
      ctx.fillStyle = "#16071d";
      ctx.fillRect(-5, -5, 10, 10);
    }
    ctx.restore();
    if (e.type === "beam" && (e.phase === "warn" || e.phase === "fire")) {
      ctx.save();
      ctx.strokeStyle = e.phase === "warn" ? c + "66" : c;
      ctx.lineWidth = e.phase === "warn" ? 8 : 18;
      ctx.shadowColor = c;
      ctx.shadowBlur = e.phase === "fire" ? 24 : 8;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      const len = e.phase === "fire" ? e.beamProgress : 1500;
      ctx.lineTo(
        e.x + Math.cos(e.lockedAngle) * len,
        e.y + Math.sin(e.lockedAngle) * len,
      );
      ctx.stroke();
      ctx.restore();
    }
    if (e.type === "shock" && e.phase === "jump") {
      ctx.save();
      ctx.strokeStyle = "#ff315f";
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.targetX, e.targetY, 34, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    if (e.type === "shock" && e.phase === "wave") {
      ctx.save();
      ctx.strokeStyle = "#ff315f";
      ctx.lineWidth = 7;
      ctx.shadowColor = "#ff315f";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.wave, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    if (e.type === "dasher" && e.dashPhase === "warn") {
      ctx.save();
      ctx.strokeStyle = "#ff7a3d";
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.dashX, e.dashY);
      ctx.stroke();
      ctx.restore();
    }
    if (e.type === "mine") {
      for (const m of e.mines) {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.strokeStyle = "#55d9ff";
        ctx.shadowColor = "#55d9ff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = "#55d9ff";
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    if (e.type === "repeater") {
      ctx.save();
      ctx.strokeStyle = c + "66";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const h = e.history || [];
      if (h.length) {
        ctx.moveTo(h[0].x, h[0].y);
        for (let i = 1; i < h.length; i++) ctx.lineTo(h[i].x, h[i].y);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (e.type === "voidcaster" && e.voidMarks) {
      ctx.save();
      for (const m of e.voidMarks) {
        ctx.strokeStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 18, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (e.type === "pulsar" && e.pulseRadius > 0) {
      ctx.save();
      ctx.strokeStyle = c;
      ctx.lineWidth = 8;
      ctx.shadowColor = c;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.pulseRadius, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    if (e.type === "voidhunter" && e.huntPhase === "lunge") {
      ctx.save();
      ctx.strokeStyle = c + "88";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x - Math.cos(e.angle) * 90, e.y - Math.sin(e.angle) * 90);
      ctx.stroke();
      ctx.restore();
    }
    if (e.type === "sword") {
      const sx = e.swordX,
        sy = e.swordY;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(e.swordAngle);
      ctx.strokeStyle = "#f7cfff";
      ctx.lineWidth = e.phase === "windup" ? 6 : 4;
      ctx.shadowColor = "#ff2bd6";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(80, 0);
      ctx.stroke();
      ctx.restore();
      if (e.phase !== "strike") {
        ctx.save();
        ctx.strokeStyle = "#ff2bd655";
        ctx.setLineDash([5, 8]);
        ctx.beginPath();
        ctx.arc(state.player.x, state.player.y, 100, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
    if (e.type === "gravity" && e.gravityLife > 0) {
      ctx.save();
      ctx.strokeStyle = "#9f6bff88";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(e.gravityX, e.gravityY, 150, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    if (e.type === "railgun" && e.railPhase === "warn") {
      ctx.save();
      ctx.strokeStyle = "#6ff7ff88";
      ctx.lineWidth = 7;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(
        e.x + Math.cos(e.railAngle) * 1600,
        e.y + Math.sin(e.railAngle) * 1600,
      );
      ctx.stroke();
      ctx.restore();
    }
    if (e.type === "decoy") {
      ctx.save();
      ctx.strokeStyle = "#ffffff55";
      for (const d of e.decoys || []) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 16, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  function drawShot(s) {
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#ff2bd6";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * state.sizeScale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  function drawEnemyShot(b) {
    ctx.save();
    ctx.fillStyle = "#a66aff";
    ctx.shadowColor = "#ff2bd6";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * state.sizeScale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  function drawParticles() {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function updateInputPos(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }
  canvas.addEventListener("mousemove", updateInputPos);
  canvas.addEventListener("mousedown", (e) => {
    mouse.down = true;
    updateInputPos(e);
    firePlayer();
  });
  window.addEventListener("mouseup", () => (mouse.down = false));
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (k === " ") {
      e.preventDefault();
      if (state.mode === "play") tryJump();
    }
    if (k === "e" && state.mode === "play") {
      if (state.className === "dasher") startDash();
      else if (state.className === "ghost") toggleGhost();
    }
  });
  window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      const t = e.touches[0];
      mouse.x = t.clientX - canvas.getBoundingClientRect().left;
      mouse.y = t.clientY - canvas.getBoundingClientRect().top;
      mouse.down = true;
      firePlayer();
    },
    { passive: false },
  );
  canvas.addEventListener("touchend", () => (mouse.down = false));
  resize();
  resetPlayer();
  updateHud();
  draw();
  (function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    updateParticles(dt);
    requestAnimationFrame(loop);
  })(performance.now());
})();
