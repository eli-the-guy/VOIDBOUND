/*
  VOIDBOUND — FULL REBUILD
  Standalone game.js replacement.
  This file intentionally does NOT use the old upgrade/chain menu code.
  Chains and upgrades are first-class game states rendered by this file.
*/
(() => {
  "use strict";

  const canvas =
    document.getElementById("game") || document.querySelector("canvas");
  if (!canvas) throw new Error("VOIDBOUND: #game canvas not found");
  const ctx = canvas.getContext("2d");
  const wrap = document.getElementById("gameWrap") || canvas.parentElement;

  // Hide old overlays. This rebuild owns all menus itself.
  for (const id of [
    "startScreen",
    "classScreen",
    "altarScreen",
    "upgradeScreen",
    "gameOverScreen",
  ]) {
    const e = document.getElementById(id);
    if (e) e.classList.add("hidden");
  }

  const TAU = Math.PI * 2;
  const keys = new Set();
  const mouse = { x: 0, y: 0, down: false, inside: false };
  let W = 900,
    H = 650,
    dpr = 1,
    last = performance.now(),
    raf = 0;

  const ENEMIES = {
    shooter: {
      name: "SHOOTER",
      desc: "Aims at you and fires a slow bullet every 2 seconds.",
      color: "#ff4bd8",
      hp: 1,
      rate: 2,
    },
    shotgun: {
      name: "SHOTGUN",
      desc: "Fires 3 slow bullets. Rotates 45° after every shot.",
      color: "#ff9de9",
      hp: 1,
      rate: 2,
    },
    beam: {
      name: "BEAM",
      desc: "A slow tracking beam warns you, fires for 3 seconds, then cools for 10 seconds.",
      color: "#d76bff",
      hp: 1,
      rate: 13,
    },
    shock: {
      name: "SHOCK WAVE",
      desc: "Jumps every 5 seconds, relocates while airborne, then releases a wave. Jump over it.",
      color: "#a65cff",
      hp: 1,
      rate: 5,
    },
    sword: {
      name: "SWORD MASTER",
      desc: "A sword tracks around you for 6 seconds, then fires after a 1 second warning.",
      color: "#ff65bc",
      hp: 1,
      rate: 6,
    },
    repeater: {
      name: "REPEATER",
      desc: "Copies the path you took a short time ago.",
      color: "#38d9ff",
      hp: 1,
      rate: 2.4,
    },
    splitter: {
      name: "SPLITTER",
      desc: "Fires a fast shot that splits into three smaller shots.",
      color: "#ffcf55",
      hp: 1,
      rate: 2.7,
    },
    vortex: {
      name: "VORTEX",
      desc: "Creates a rotating pull field and periodically fires outward.",
      color: "#8e7bff",
      hp: 1,
      rate: 4,
    },
    hunter: {
      name: "HUNTER",
      desc: "Tracks your recent movement and lunges directly at you.",
      color: "#ff5252",
      hp: 1,
      rate: 3.4,
    },
    mine: {
      name: "MINE LAYER",
      desc: "Drops proximity mines around the arena.",
      color: "#ff7b35",
      hp: 1,
      rate: 3.2,
    },
    sniper: {
      name: "SNIPER",
      desc: "Locks your position, gives a long warning, then fires a lethal line shot.",
      color: "#ffffff",
      hp: 1,
      rate: 6,
    },
    mirror: {
      name: "MIRROR",
      desc: "Creates a delayed copy of your movement and fires mirrored shots.",
      color: "#e4a1ff",
      hp: 1,
      rate: 3,
    },
    orbit: {
      name: "ORBITAL",
      desc: "Circles the arena while releasing rotating projectiles.",
      color: "#63b5ff",
      hp: 1,
      rate: 2.5,
    },
    gravity: {
      name: "GRAVITY CORE",
      desc: "Creates temporary gravity zones that slow your movement.",
      color: "#a878ff",
      hp: 1,
      rate: 5,
    },
    laser: {
      name: "LASER GRID",
      desc: "Telegraphs a sweeping laser across the arena.",
      color: "#ff3b91",
      hp: 1,
      rate: 4,
    },
    phantom: {
      name: "PHANTOM",
      desc: "Teleports and leaves a delayed attack at its previous location.",
      color: "#b9a0ff",
      hp: 1,
      rate: 3,
    },
  };
  const ADVANCED = new Set([
    "repeater",
    "splitter",
    "vortex",
    "hunter",
    "mine",
    "sniper",
    "mirror",
    "orbit",
    "gravity",
    "laser",
    "phantom",
  ]);
  const BASIC = ["shooter", "shotgun", "beam", "shock", "sword"];

  const UPGRADES = {
    speed: { name: "SPEED", desc: "+12% movement speed.", icon: "SPD" },
    bullet: { name: "BULLET SPEED", desc: "+18% shuriken speed.", icon: "BUL" },
    jump: {
      name: "JUMP HEIGHT",
      desc: "Longer jumps; increases your invulnerability window while airborne.",
      icon: "JMP",
    },
    weaken: {
      name: "WEAKEN",
      desc: "One random enemy in the current stack becomes slower.",
      icon: "WKN",
    },
    size: {
      name: "BULLET SIZE",
      desc: "Shurikens become larger.",
      icon: "SIZ",
    },
    rapid: {
      name: "RAPID FIRE",
      desc: "Reduces your 2 second firing cooldown.",
      icon: "RPD",
    },
    twin: {
      name: "TWIN SHURIKEN",
      desc: "Fires two slightly spread shurikens.",
      icon: "2X",
    },
    pierce: {
      name: "PIERCE",
      desc: "Shurikens can pass through one extra enemy.",
      icon: "PRC",
    },
    homing: {
      name: "HOMING",
      desc: "Shurikens gently curve toward enemies.",
      icon: "HOM",
    },
    range: {
      name: "LONG RANGE",
      desc: "Shurikens survive longer.",
      icon: "RNG",
    },
    triple: {
      name: "TRIPLE SHURIKEN",
      desc: "Fires three shurikens in a tight spread.",
      icon: "3X",
    },
    bounce: {
      name: "VOID BOUNCE",
      desc: "Shurikens bounce off arena walls.",
      icon: "BNC",
    },
    voidburst: {
      name: "VOID BURST",
      desc: "Destroying an enemy creates a small outward burst.",
      icon: "BST",
    },
    orbit: {
      name: "VOID ORBIT",
      desc: "A damaging shuriken orbits you periodically.",
      icon: "ORB",
    },
    echo: {
      name: "SHOT ECHO",
      desc: "Each shot creates a delayed echo shot.",
      icon: "ECO",
    },
    time: {
      name: "TIME FRACTURE",
      desc: "Enemy attack timers are slightly slowed.",
      icon: "TIM",
    },
    phasejump: {
      name: "PHASE JUMP",
      desc: "Jump lasts longer and gives stronger avoidance.",
      icon: "PHZ",
    },
    voidtrail: {
      name: "VOID TRAIL",
      desc: "Movement leaves a short damaging trail.",
      icon: "TRL",
    },
    magnet: {
      name: "SHURIKEN MAGNET",
      desc: "Shurikens curve more strongly toward enemies.",
      icon: "MAG",
    },
    shrink: {
      name: "SHRINK",
      desc: "Shrinks enemies, bullets, and you, making the arena feel larger.",
      icon: "SML",
    },
    classcore: {
      name: "CLASS CORE",
      desc: "Boosts your starting class ability.",
      icon: "CLS",
    },
  };
  const NEW_UPGRADES = [
    "triple",
    "bounce",
    "voidburst",
    "orbit",
    "echo",
    "time",
    "phasejump",
    "voidtrail",
    "magnet",
    "shrink",
  ];

  const CHAINS = {
    frenzy: { name: "FRENZY", desc: "Enemies attack 25% faster.", icon: "FZ" },
    overclock: {
      name: "OVERCLOCK",
      desc: "Enemy projectiles move 25% faster.",
      icon: "OC",
    },
    bulletstorm: {
      name: "BULLETSTORM",
      desc: "Enemies fire one extra projectile on attacks.",
      icon: "BS",
    },
    swarm: {
      name: "SWARM",
      desc: "Every newly chosen enemy adds one extra copy.",
      icon: "SW",
    },
    closecall: {
      name: "CLOSE CALL",
      desc: "Enemy attacks are less predictable.",
      icon: "CC",
    },
    heavy: {
      name: "HEAVY",
      desc: "Enemies and their projectiles are larger.",
      icon: "HV",
    },
    fragile: {
      name: "FRAGILE",
      desc: "You have less jump forgiveness after landing.",
      icon: "FR",
    },
    relentless: {
      name: "RELENTLESS",
      desc: "Enemy attack cooldown randomness is reduced.",
      icon: "RL",
    },
    bloodrush: {
      name: "BLOODRUSH",
      desc: "Enemies speed up after another enemy dies.",
      icon: "BR",
    },
    blackhole: {
      name: "BLACK HOLE",
      desc: "A dangerous gravity well appears periodically.",
      icon: "BH",
    },
  };

  const CLASSES = {
    ninja: {
      name: "NINJA",
      desc: "Normal shuriken class. Balanced.",
      color: "#ff4bd8",
    },
    dasher: {
      name: "DASHER",
      desc: "Press E to dash in your facing direction. Dashing into enemies kills them.",
      color: "#ff9b55",
    },
    grappler: {
      name: "GRAPPLER",
      desc: "Your weapon is a grappling hook. Shoot to travel exactly to the cursor point.",
      color: "#62d8ff",
    },
    ghost: {
      name: "GHOST",
      desc: "Press E to enter ghost form. You can tank one hit, move slower, then press E to return.",
      color: "#b995ff",
    },
  };

  const state = {
    mode: "start",
    round: 1,
    level: 1,
    className: null,
    classCore: 0,
    altarOptions: [],
    enemies: [],
    nextId: 1,
    shots: [],
    enemyShots: [],
    effects: [],
    mines: [],
    chains: Object.fromEntries(Object.keys(CHAINS).map((k) => [k, 0])),
    upgrades: Object.fromEntries(Object.keys(UPGRADES).map((k) => [k, 0])),
    pendingChain: false,
    pendingUpgrade: false,
    transition: false,
    player: {
      x: 0,
      y: 0,
      r: 14,
      vx: 0,
      vy: 0,
      angle: 0,
      jump: 0,
      jumpMax: 0.8,
      inv: 0,
      cool: 0,
      alive: true,
      dash: 0,
      dashCd: 0,
      ghost: false,
      ghostCd: 0,
      anchorX: 0,
      anchorY: 0,
    },
    history: [],
    now: 0,
    flash: 0,
    deathReason: "",
    message: "",
    messageT: 0,
  };

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function ang(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function css(id) {
    return document.getElementById(id);
  }
  function announce(s, t = 1.8) {
    state.message = s;
    state.messageT = t;
  }
  function resized() {
    const r = wrap.getBoundingClientRect();
    W = Math.max(360, r.width);
    H = Math.max(360, r.height);
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resized);
  resized();

  function arenaRect() {
    return { l: 28, t: 86, r: W - 28, b: H - 28 };
  }
  function resetPlayer() {
    const a = arenaRect();
    state.player.x = (a.l + a.r) / 2;
    state.player.y = (a.t + a.b) / 2;
    state.player.r = 14;
    state.player.angle = 0;
    state.player.jump = 0;
    state.player.jumpMax = 0.8;
    state.player.inv = 0;
    state.player.cool = 0;
    state.player.alive = true;
    state.player.dash = 0;
    state.player.dashCd = 0;
    state.player.ghost = false;
    state.player.ghostCd = 0;
    state.player.vx = 0;
    state.player.vy = 0;
  }
  function baseSpeed() {
    return (
      235 * (1 + state.upgrades.speed * 0.12) * (state.player.ghost ? 0.62 : 1)
    );
  }
  function projectileSpeed() {
    return 350 * (1 + state.upgrades.bullet * 0.18);
  }
  function attackFactor(e) {
    let f = 1;
    if (state.chains.frenzy) f *= Math.pow(0.75, state.chains.frenzy);
    if (state.upgrades.time) f *= Math.pow(1.08, state.upgrades.time);
    if (state.chains.relentless) f *= Math.pow(1.05, state.chains.relentless);
    return f;
  }
  function randomDelay() {
    if (state.chains.relentless) return rnd(-0.35, 0.35);
    return rnd(-2, 2);
  }
  function nextAttack(base) {
    return Math.max(
      0.18,
      base * attackFactor(currentEnemyForTiming()) + randomDelay(),
    );
  }
  function currentEnemyForTiming() {
    return state.enemies.find((e) => e.alive) || { type: "shooter" };
  }
  function spawnEnemy(type) {
    const a = arenaRect();
    let x = rnd(a.l + 55, a.r - 55),
      y = rnd(a.t + 55, a.b - 55);
    for (let i = 0; i < 20; i++) {
      if (Math.hypot(x - state.player.x, y - state.player.y) > 170) break;
      x = rnd(a.l + 55, a.r - 55);
      y = rnd(a.t + 55, a.b - 55);
    }
    const d = ENEMIES[type];
    const e = {
      id: state.nextId++,
      type,
      x,
      y,
      r: 18,
      alive: true,
      angle: rnd(0, TAU),
      timer: rnd(0.4, 1.8),
      phase: "idle",
      phaseT: 0,
      targetX: x,
      targetY: y,
      seed: rnd(0, 100),
      path: [],
      pathIndex: 0,
      teleportT: 5,
      swordAngle: rnd(0, TAU),
      swordT: 0,
      beamAngle: 0,
      beamState: "cool",
      beamT: rnd(1, 3),
      shotAngle: rnd(0, TAU),
      weakened: false,
    };
    if (state.upgrades.weaken && Math.random() < 0.28) e.weakened = true;
    state.enemies.push(e);
    return e;
  }
  function reviveStack() {
    for (const e of state.enemies) e.alive = true;
  }
  function chooseTwoEnemies() {
    const pool = state.level > 10 ? [...Object.keys(ENEMIES)] : BASIC;
    let a = pick(pool),
      b = pick(pool);
    while (b === a) b = pick(pool);
    return [a, b];
  }

  // ---------- UI owned entirely by this rebuild ----------
  let ui = null;
  function makeUI() {
    if (ui) return;
    ui = document.createElement("div");
    ui.id = "voidboundRebuildUI";
    Object.assign(ui.style, {
      position: "fixed",
      inset: "0",
      zIndex: "999999",
      pointerEvents: "none",
      fontFamily: "Arial,system-ui,sans-serif",
      color: "#fff",
    });
    document.body.appendChild(ui);
    const style = document.createElement("style");
    style.textContent = `#vbBox{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(4,0,12,.94);pointer-events:auto}#vbPanel{width:min(1000px,94vw);max-height:90vh;overflow:auto;padding:28px;border:2px solid #ff35d0;border-radius:24px;background:linear-gradient(145deg,#1a052b,#07000d);box-shadow:0 0 70px #ff35d044;text-align:center}#vbPanel h1{margin:0 0 8px;font-size:clamp(28px,5vw,48px);letter-spacing:2px;color:#ff4bd8;text-shadow:0 0 20px #ff35d0}#vbPanel p{opacity:.8}#vbCards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}.vbCard{min-height:185px;padding:20px;border:1px solid #6d3a8d;border-radius:18px;background:#10081a;color:white;cursor:pointer;font:inherit;transition:.12s}.vbCard:hover{transform:translateY(-6px);border-color:#ff4bd8;box-shadow:0 0 25px #ff35d044}.vbName{font-size:21px;font-weight:900;margin:9px 0}.vbIcon{font-size:12px;opacity:.65;letter-spacing:2px}.vbDesc{font-size:14px;line-height:1.45;opacity:.85}.vbHud{position:absolute;left:20px;top:14px;font-weight:800;letter-spacing:1px;text-shadow:0 0 10px #ff35d0}.vbMsg{position:absolute;left:50%;top:78px;transform:translateX(-50%);font-weight:900;color:#ff8be8;text-shadow:0 0 15px #ff35d0;white-space:nowrap}.vbTip{position:absolute;right:18px;top:14px;text-align:right;font-size:12px;opacity:.7}.vbClass{position:absolute;left:20px;bottom:12px;font-size:12px;opacity:.7}`;
    document.head.appendChild(style);
  }
  function clearUI() {
    makeUI();
    ui.innerHTML = "";
  }
  function card(def, key, kind) {
    const b = document.createElement("button");
    b.className = "vbCard";
    b.type = "button";
    b.innerHTML = `<div class="vbIcon">${def.icon || "VOID"}</div><div class="vbName">${def.name}</div><div class="vbDesc">${def.desc}</div>`;
    b.onclick = () =>
      kind === "class"
        ? chooseClass(key)
        : kind === "enemy"
          ? chooseEnemy(key)
          : kind === "chain"
            ? chooseChain(key)
            : chooseUpgrade(key);
    return b;
  }
  function overlay(title, subtitle, choices, defs, kind, color = "#ff35d0") {
    clearUI();
    const box = document.createElement("div");
    box.id = "vbBox";
    const p = document.createElement("div");
    p.id = "vbPanel";
    p.style.borderColor = color;
    p.innerHTML = `<div style="font-size:12px;letter-spacing:3px;opacity:.65">VOIDBOUND</div><h1 style="color:${color}">${title}</h1><p>${subtitle}</p>`;
    const cards = document.createElement("div");
    cards.id = "vbCards";
    choices.forEach((k) => cards.appendChild(card(defs[k], k, kind)));
    p.appendChild(cards);
    box.appendChild(p);
    ui.appendChild(box);
  }
  function hud() {
    if (state.mode !== "play" && state.mode !== "between") return;
    clearUI();
    const h = document.createElement("div");
    h.className = "vbHud";
    h.innerHTML = `VOIDBOUND &nbsp; | &nbsp; LEVEL ${state.level} &nbsp; | &nbsp; ROUND ${state.round} &nbsp; | &nbsp; ENEMIES ${state.enemies.filter((e) => e.alive).length}<br><span style="font-size:11px;opacity:.65">CHAINS ${Object.values(state.chains).reduce((a, b) => a + b, 0)} • UPGRADES ${Object.values(state.upgrades).reduce((a, b) => a + b, 0)}</span>`;
    ui.appendChild(h);
    const t = document.createElement("div");
    t.className = "vbTip";
    t.innerHTML =
      "WASD / ARROWS MOVE<br>MOUSE AIM • CLICK FIRE<br>SPACE JUMP • E CLASS";
    ui.appendChild(t);
    const c = document.createElement("div");
    c.className = "vbClass";
    c.textContent = "CLASS: " + (CLASSES[state.className]?.name || "—");
    ui.appendChild(c);
    if (state.messageT > 0) {
      const m = document.createElement("div");
      m.className = "vbMsg";
      m.textContent = state.message;
      ui.appendChild(m);
    }
  }

  function startScreen() {
    state.mode = "start";
    overlay(
      "VOIDBOUND",
      "Choose your class once. Then survive an ever-growing enemy stack.",
      Object.keys(CLASSES),
      CLASSES,
      "class",
      "#ff35d0",
    );
  }
  function chooseClass(k) {
    state.className = k;
    state.classCore = 0;
    state.mode = "altar";
    announce("CLASS: " + CLASSES[k].name);
    showAltars();
  }
  function showAltars() {
    state.altarOptions = chooseTwoEnemies();
    state.mode = "altar";
    clearUI();
    const box = document.createElement("div");
    box.id = "vbBox";
    const p = document.createElement("div");
    p.id = "vbPanel";
    p.innerHTML =
      '<div style="font-size:12px;letter-spacing:3px;opacity:.65">ALTAR CHOICE</div><h1>CHOOSE YOUR ENEMY</h1><p>Two physical altars. Shoot one altar to select it. The chosen enemy is added to your existing stack.</p><div id="vbCards"></div><p style="font-size:12px;opacity:.6">The cards are also clickable as a fallback, but the arena altars are the real choice.</p>';
    const cards = p.querySelector("#vbCards");
    state.altarOptions.forEach((k) =>
      cards.appendChild(
        card(
          { name: ENEMIES[k].name, desc: ENEMIES[k].desc, icon: "ALTAR" },
          k,
          "enemy",
        ),
      ),
    );
    box.appendChild(p);
    ui.appendChild(box);
  }
  function chooseEnemy(k) {
    if (state.mode !== "altar") return;
    const idx = state.altarOptions.indexOf(k);
    if (idx < 0) return;
    state.altarOptions = [];
    clearUI();
    startRound(k);
  }
  function showChains() {
    const ks = Object.keys(CHAINS)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    overlay(
      "⛓ CHAIN — CHOOSE 1",
      "Every third completed round. Chains are permanent and make survival harder.",
      ks,
      CHAINS,
      "chain",
      "#ff35d0",
    );
    state.mode = "chain";
  }
  function showUpgrades() {
    const guaranteed = pick(NEW_UPGRADES.filter((k) => UPGRADES[k]));
    const rest = Object.keys(UPGRADES)
      .filter((k) => k !== guaranteed)
      .sort(() => Math.random() - 0.5);
    overlay(
      "✦ UPGRADE — CHOOSE 1",
      "Every fifth completed round. One of the 10 new upgrades is guaranteed to appear.",
      [guaranteed, ...rest].slice(0, 3),
      UPGRADES,
      "upgrade",
      "#a66cff",
    );
    state.mode = "upgrade";
  }
  function chooseChain(k) {
    if (state.mode !== "chain") return;
    state.chains[k]++;
    state.pendingChain = false;
    announce("CHAIN ACQUIRED: " + CHAINS[k].name);
    if (state.pendingUpgrade) showUpgrades();
    else showAltars();
  }
  function chooseUpgrade(k) {
    if (state.mode !== "upgrade") return;
    state.upgrades[k]++;
    state.pendingUpgrade = false;
    announce("UPGRADE: " + UPGRADES[k].name);
    if (k === "weaken") {
      const live = state.enemies.filter((e) => e.alive);
      if (live.length) pick(live).weakened = true;
    }
    if (state.pendingChain) showChains();
    else showAltars();
  }

  function startRound(chosen) {
    state.mode = "play";
    state.roundTransition = false;
    state.player.alive = true;
    state.player.inv = 3;
    state.shots = [];
    state.enemyShots = [];
    state.mines = [];
    state.effects = [];
    state.history = [];
    resetPlayer();
    state.player.inv = 3;
    reviveStack();
    spawnEnemy(chosen);
    if (state.chains.swarm) {
      for (let i = 0; i < state.chains.swarm; i++) spawnEnemy(chosen);
    }
    state.enemies.forEach((e) => {
      if (e.alive) e.timer = rnd(0.2, 1.4);
    });
    announce("ROUND " + state.round + " • 3 SECONDS INVINCIBLE");
    hud();
  }
  function completeRound() {
    if (state.mode !== "play" || state.transition) return;
    state.transition = true;
    state.mode = "between";
    state.pendingChain = state.round % 3 === 0;
    state.pendingUpgrade = state.round % 5 === 0;
    state.round++;
    state.level = state.round;
    state.shots = [];
    state.enemyShots = [];
    state.effects = [];
    announce("ROUND CLEARED");
    setTimeout(() => {
      state.transition = false;
      if (state.pendingChain) showChains();
      else if (state.pendingUpgrade) showUpgrades();
      else showAltars();
    }, 450);
  }

  // ---------- combat ----------
  function firePlayer() {
    if (
      state.mode !== "play" ||
      !state.player.alive ||
      state.player.inv > 0 ||
      state.player.cool > 0
    )
      return;
    const p = state.player;
    if (state.className === "dasher") return;
    if (state.className === "grappler") {
      state.grapple = { x: mouse.x, y: mouse.y };
      return;
    }
    const speed = projectileSpeed();
    let offs = [0];
    if (state.upgrades.triple) offs = [-0.12, 0, 0.12];
    else if (state.upgrades.twin) offs = [-0.08, 0.08];
    for (const o of offs) {
      const a = p.angle + o;
      state.shots.push({
        x: p.x + Math.cos(a) * 20,
        y: p.y + Math.sin(a) * 20,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: (5 + state.upgrades.size * 2) * Math.pow(0.9, state.upgrades.shrink),
        life: 2 + state.upgrades.range * 0.6,
        pierce: state.upgrades.pierce,
        bounce: state.upgrades.bounce,
        homing: state.upgrades.homing + state.upgrades.magnet * 2,
      });
      if (state.upgrades.echo)
        state.shots.push({
          x: p.x + Math.cos(a) * 20,
          y: p.y + Math.sin(a) * 20,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          r: 3,
          life: 1.3,
          delay: 0.25,
        });
    }
    p.cool = Math.max(0.3, 2 - state.upgrades.rapid * 0.25);
  }
  function hurt(reason) {
    if (state.player.inv > 0 || state.player.jump > 0 || state.player.ghost)
      return;
    if (!state.player.alive) return;
    state.player.alive = false;
    state.deathReason = reason;
    state.mode = "dead";
    announce("VOID CLAIMED YOU");
    deathScreen();
  }
  function killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    for (let i = 0; i < 12; i++)
      state.effects.push({
        x: e.x,
        y: e.y,
        vx: rnd(-80, 80),
        vy: rnd(-80, 80),
        life: 0.5,
        r: 2,
      });
    if (state.upgrades.voidburst)
      for (let i = 0; i < 8; i++) {
        const a = (i * TAU) / 8;
        state.enemyShots.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(a) * 170,
          vy: Math.sin(a) * 170,
          r: 5,
          life: 1.3,
        });
      }
    if (state.chains.bloodrush) {
      for (const q of state.enemies)
        if (q.alive) q.timer = Math.min(q.timer, 0.5);
    }
  }
  function enemyBullet(x, y, a, s = 150, r = 7, life = 5) {
    const mult = 1 + state.chains.overclock * 0.25;
    state.enemyShots.push({
      x,
      y,
      vx: Math.cos(a) * s * mult,
      vy: Math.sin(a) * s * mult,
      r: r * (state.chains.heavy ? 1.25 : 1),
      life,
    });
  }
  function aimAt(e) {
    return Math.atan2(state.player.y - e.y, state.player.x - e.x);
  }
  function enemyAttack(e) {
    const p = state.player,
      a = aimAt(e);
    switch (e.type) {
      case "shooter":
        enemyBullet(e.x, e.y, a, 145, 7);
        break;
      case "shotgun":
        for (let i = -1; i <= 1; i++)
          enemyBullet(e.x, e.y, a + i * 0.38, 125, 6);
        e.angle += Math.PI / 4;
        break;
      case "repeater": {
        const past = state.history[Math.max(0, state.history.length - 35)];
        if (past) {
          e.targetX = past.x;
          e.targetY = past.y;
        }
        enemyBullet(
          e.x,
          e.y,
          Math.atan2(e.targetY - e.y, e.targetX - e.x),
          180,
          6,
        );
        break;
      }
      case "splitter":
        enemyBullet(e.x, e.y, a, 190, 8);
        break;
      case "vortex":
        for (let i = 0; i < state.chains.bulletstorm + 1; i++)
          enemyBullet(e.x, e.y, a + (i * TAU) / 5, 115, 6);
        break;
      case "hunter":
        e.phase = "lunge";
        e.phaseT = 0.65;
        break;
      case "mine":
        state.mines.push({
          x: e.x + rnd(-100, 100),
          y: e.y + rnd(-100, 100),
          r: 10,
          life: 8,
        });
        break;
      case "sniper":
        e.phase = "warning";
        e.phaseT = 1.2;
        e.targetX = p.x;
        e.targetY = p.y;
        break;
      case "mirror":
        enemyBullet(e.x, e.y, -a, 160, 6);
        break;
      case "orbit":
        for (let i = 0; i < 3; i++)
          enemyBullet(e.x, e.y, e.angle + (i * TAU) / 3, 135, 6);
        break;
      case "gravity":
        state.effects.push({ kind: "gravity", x: p.x, y: p.y, r: 90, life: 3 });
        break;
      case "laser":
        e.phase = "warning";
        e.phaseT = 0.8;
        e.targetX = p.x;
        e.targetY = p.y;
        break;
      case "phantom": {
        const ox = e.x,
          oy = e.y;
        const ar = arenaRect();
        e.x = rnd(ar.l + 40, ar.r - 40);
        e.y = rnd(ar.t + 40, ar.b - 40);
        state.effects.push({ kind: "phantom", x: ox, y: oy, r: 28, life: 1 });
        break;
      }
      case "sword":
        e.swordAngle = rnd(0, TAU);
        e.swordT = 1;
        break;
    }
  }
  function updateEnemy(e, dt) {
    if (!e.alive) return;
    const p = state.player;
    const speed = (e.weakened ? 0.7 : 1) * (1 + state.chains.frenzy * 0.05);
    e.timer -= dt;
    if (e.phase === "lunge") {
      const a = ang(e, p);
      e.x += Math.cos(a) * 480 * dt;
      e.y += Math.sin(a) * 480 * dt;
      e.phaseT -= dt;
      if (e.phaseT <= 0) e.phase = "idle";
    }
    if (e.type === "beam") {
      e.beamAngle = ang(e, p);
      if (e.beamState === "cool") {
        e.beamT -= dt;
        if (e.beamT <= 0) {
          e.beamState = "warning";
          e.beamT = 3;
        }
      } else if (e.beamState === "warning") {
        e.beamT -= dt;
        if (e.beamT <= 0) {
          e.beamState = "fire";
          e.beamT = 3;
        }
      } else {
        e.beamT -= dt;
        if (e.beamT <= 0) {
          e.beamState = "cool";
          e.beamT = 10;
        }
      }
    }
    if (e.type === "shock") {
      e.timer -= 0;
      if (e.phase === "idle" && e.timer <= 0) {
        e.phase = "jump";
        e.phaseT = 2;
        e.targetX = rnd(arenaRect().l + 50, arenaRect().r - 50);
        e.targetY = rnd(arenaRect().t + 50, arenaRect().b - 50);
      }
      if (e.phase === "jump") {
        e.phaseT -= dt;
        e.x += ((e.targetX - e.x) * dt) / Math.max(0.01, e.phaseT + dt);
        e.y += ((e.targetY - e.y) * dt) / Math.max(0.01, e.phaseT + dt);
        if (e.phaseT <= 0) {
          e.phase = "wave";
          e.phaseT = 1.8;
          e.timer = 5;
        }
      } else if (e.phase === "wave") {
        e.phaseT -= dt;
        if (e.phaseT <= 0) e.phase = "idle";
      }
    }
    if (e.type === "sword") {
      e.swordT -= dt;
      e.teleportT -= dt;
      if (e.swordT <= 0) e.swordT = 6;
      if (e.teleportT <= 0) {
        const ar = arenaRect();
        e.x = rnd(ar.l + 40, ar.r - 40);
        e.y = rnd(ar.t + 40, ar.b - 40);
        e.teleportT = 5;
      }
    }
    if (e.timer <= 0 && e.type !== "beam" && e.type !== "shock") {
      enemyAttack(e);
      const base = ENEMIES[e.type].rate || 2;
      e.timer = Math.max(0.2, base * attackFactor(e) + randomDelay());
    }
    if (e.type === "sniper" && e.phase === "warning") {
      e.phaseT -= dt;
      if (e.phaseT <= 0) {
        e.phase = "fire";
        e.phaseT = 0.18;
        enemyBullet(
          e.x,
          e.y,
          Math.atan2(e.targetY - e.y, e.targetX - e.x),
          900,
          9,
          0.5,
        );
      }
    }
    if (e.type === "sniper" && e.phase === "fire") {
      e.phaseT -= dt;
      if (e.phaseT <= 0) e.phase = "idle";
    }
    if (e.type === "laser" && e.phase === "warning") {
      e.phaseT -= dt;
      if (e.phaseT <= 0) {
        e.phase = "fire";
        e.phaseT = 0.35;
        enemyBullet(
          e.x,
          e.y,
          Math.atan2(e.targetY - e.y, e.targetX - e.x),
          1000,
          8,
          0.6,
        );
      }
    }
    if (e.type === "laser" && e.phase === "fire") {
      e.phaseT -= dt;
      if (e.phaseT <= 0) e.phase = "idle";
    }
    const ar = arenaRect();
    e.x = clamp(e.x, ar.l + 20, ar.r - 20);
    e.y = clamp(e.y, ar.t + 20, ar.b - 20);
    // direct sword hit: player must move in sword direction during its attack
    if (e.type === "sword" && e.swordT < 0.2 && e.swordT > 0) {
      const sx = e.x + Math.cos(e.swordAngle) * 130,
        sy = e.y + Math.sin(e.swordAngle) * 130;
      if (Math.hypot(p.x - sx, p.y - sy) < 35) hurt("SWORD MASTER");
    }
    if (e.type === "shock" && e.phase === "wave" && p.jump <= 0) {
      if (Math.abs(Math.hypot(p.x - e.x, p.y - e.y) - e.r) < 70)
        hurt("SHOCK WAVE");
    }
    if (e.type === "beam" && e.beamState === "fire") {
      const dx = Math.cos(e.beamAngle),
        dy = Math.sin(e.beamAngle),
        px = p.x - e.x,
        py = p.y - e.y;
      const cross = Math.abs(px * dy - py * dx);
      const forward = px * dx + py * dy;
      if (cross < 10 && forward > 0) hurt("BEAM");
    }
    if (dist(e, p) < e.r + p.r) hurt(e.type.toUpperCase());
  }
  function updatePlayer(dt) {
    const p = state.player;
    p.inv = Math.max(0, p.inv - dt);
    p.cool = Math.max(0, p.cool - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.ghostCd = Math.max(0, p.ghostCd - dt);
    if (state.className === "ghost" && p.ghost) {
      if (keys.has("e") && !p._e) {
        p.ghost = false;
        p.x = p.anchorX;
        p.y = p.anchorY;
      }
      p._e = keys.has("e");
    } else p._e = keys.has("e");
    if (
      state.className === "ghost" &&
      !p.ghost &&
      keys.has("e") &&
      !p._ePrev &&
      p.ghostCd <= 0
    ) {
      p.ghost = true;
      p.anchorX = p.x;
      p.anchorY = p.y;
      p.ghostCd = 10;
    }
    p._ePrev = keys.has("e");
    if (
      state.className === "dasher" &&
      keys.has("e") &&
      !p._dashPrev &&
      p.dashCd <= 0
    ) {
      p.dash = 0.28;
      p.dashCd = Math.max(1.5, 2.5 - state.classCore * 0.3);
    }
    p._dashPrev = keys.has("e");
    let dx = 0,
      dy = 0;
    if (keys.has("w") || keys.has("arrowup")) dy--;
    if (keys.has("s") || keys.has("arrowdown")) dy++;
    if (keys.has("a") || keys.has("arrowleft")) dx--;
    if (keys.has("d") || keys.has("arrowright")) dx++;
    const m = Math.hypot(dx, dy) || 1;
    dx /= m;
    dy /= m;
    let sp = baseSpeed();
    if (p.dash > 0) {
      sp = 850;
      p.dash -= dt;
    }
    p.vx = dx * sp;
    p.vy = dy * sp;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const ar = arenaRect();
    p.x = clamp(p.x, ar.l + 15, ar.r - 15);
    p.y = clamp(p.y, ar.t + 15, ar.b - 15);
    if (keys.has(" ") && !p._jump && p.jump <= 0) {
      p.jump = Math.min(1.2, p.jumpMax + 0.15 * state.upgrades.phasejump);
      announce("JUMP");
    }
    p._jump = keys.has(" ");
    if (p.jump > 0) p.jump -= dt;
    if (state.className === "dasher" && p.dash > 0) {
      for (const e of state.enemies)
        if (e.alive && dist(p, e) < e.r + 22) killEnemy(e);
    }
    if (state.className === "grappler" && state.grapple) {
      const g = state.grapple;
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      if (d < 8) {
        p.x = g.x;
        p.y = g.y;
        state.grapple = null;
      } else {
        const a = Math.atan2(g.y - p.y, g.x - p.x);
        p.x += Math.cos(a) * Math.min(520 * dt, d);
        p.y += Math.sin(a) * Math.min(520 * dt, d);
        for (const e of state.enemies)
          if (e.alive && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 14)
            killEnemy(e);
      }
    }
    state.history.push({ x: p.x, y: p.y });
    if (state.history.length > 160) state.history.shift();
  }
  function updateShots(dt) {
    const ar = arenaRect();
    for (const s of state.shots) {
      if (s.delay) {
        s.delay -= dt;
        continue;
      }
      if (s.homing) {
        let target = null,
          best = 1e9;
        for (const e of state.enemies)
          if (e.alive) {
            const d = dist(s, e);
            if (d < best) {
              best = d;
              target = e;
            }
          }
        if (target) {
          const a = Math.atan2(target.y - s.y, target.x - s.x),
            cur = Math.atan2(s.vy, s.vx);
          let da = Math.atan2(Math.sin(a - cur), Math.cos(a - cur));
          const na = cur + clamp(da, -s.homing * dt, s.homing * dt);
          const v = Math.hypot(s.vx, s.vy);
          s.vx = Math.cos(na) * v;
          s.vy = Math.sin(na) * v;
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.x < ar.l || s.x > ar.r) {
        if (s.bounce) {
          s.vx *= -1;
          s.x = clamp(s.x, ar.l, ar.r);
        } else s.life = 0;
      }
      if (s.y < ar.t || s.y > ar.b) {
        if (s.bounce) {
          s.vy *= -1;
          s.y = clamp(s.y, ar.t, ar.b);
        } else s.life = 0;
      }
      for (const e of state.enemies)
        if (e.alive && dist(s, e) < s.r + e.r) {
          killEnemy(e);
          if (s.pierce > 0) s.pierce--;
          else {
            s.life = 0;
            break;
          }
        }
    }
    state.shots = state.shots.filter((s) => s.life > 0);
  }
  function updateEnemyShots(dt) {
    const p = state.player;
    for (const s of state.enemyShots) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (dist(s, p) < s.r + p.r) {
        hurt("PROJECTILE");
        s.life = 0;
      }
    }
    state.enemyShots = state.enemyShots.filter((s) => s.life > 0);
    for (const m of state.mines) {
      m.life -= dt;
      if (dist(m, p) < m.r + 18) {
        hurt("MINE");
        m.life = 0;
      }
    }
    state.mines = state.mines.filter((m) => m.life > 0);
  }
  function update(dt) {
    state.now += dt;
    if (state.messageT > 0) state.messageT -= dt;
    if (state.mode === "play") {
      updatePlayer(dt);
      for (const e of state.enemies) updateEnemy(e, dt);
      updateShots(dt);
      updateEnemyShots(dt);
      if (state.upgrades.orbit) {
        const a = state.now * 2;
        const ox = state.player.x + Math.cos(a) * 45,
          oy = state.player.y + Math.sin(a) * 45;
        for (const e of state.enemies)
          if (e.alive && Math.hypot(e.x - ox, e.y - oy) < e.r + 9) killEnemy(e);
      }
      if (
        state.upgrades.voidtrail &&
        Math.hypot(state.player.vx, state.player.vy) > 20
      ) {
        state.effects.push({
          kind: "trail",
          x: state.player.x,
          y: state.player.y,
          r: 7,
          life: 0.45,
        });
      }
      if (state.chains.blackhole && Math.floor(state.now / 7) % 2 === 0) {
        const ar = arenaRect();
        const bx = (ar.l + ar.r) / 2 + Math.cos(state.now * 0.3) * 150,
          by = (ar.t + ar.b) / 2 + Math.sin(state.now * 0.4) * 100;
        if (
          Math.hypot(state.player.x - bx, state.player.y - by) < 55 &&
          !state.player.jump
        )
          hurt("BLACK HOLE");
      }
      if (!state.enemies.some((e) => e.alive)) completeRound();
    } else if (state.mode === "dead") {
    }
    state.effects.forEach((e) => (e.life -= dt));
    state.effects = state.effects.filter((e) => e.life > 0);
  }

  // ---------- rendering ----------
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#050009";
    ctx.fillRect(0, 0, W, H);
    const ar = arenaRect();
    ctx.fillStyle = "#0d0614";
    ctx.fillRect(ar.l, ar.t, ar.r - ar.l, ar.b - ar.t);
    ctx.strokeStyle = "#4d155b";
    ctx.lineWidth = 2;
    ctx.strokeRect(ar.l, ar.t, ar.r - ar.l, ar.b - ar.t);
    if (
      state.mode === "play" ||
      state.mode === "between" ||
      state.mode === "dead"
    ) {
      for (const e of state.enemies) if (e.alive) drawEnemy(e);
      for (const m of state.mines) {
        ctx.strokeStyle = "#ff7b35";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, TAU);
        ctx.stroke();
      }
      for (const s of state.shots) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
      for (const s of state.enemyShots) {
        ctx.fillStyle = "#ff3fbd";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
      for (const e of state.effects) drawEffect(e);
      drawPlayer();
    }
    if (state.messageT > 0 && state.mode === "play") {
      ctx.fillStyle = "rgba(255,255,255,.05)";
      ctx.fillRect(ar.l, ar.t, ar.r - ar.l, 2);
    }
  }
  function drawPlayer() {
    const p = state.player;
    const scale = Math.pow(0.9, state.upgrades.shrink);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    if (p.ghost) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#b995ff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = p.inv > 0 ? "#fff" : "#ff4bd8";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#ff35d0";
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function drawEnemy(e) {
    const s = Math.pow(0.9, state.upgrades.shrink);
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(s, s);
    ctx.fillStyle = ENEMIES[e.type].color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = ENEMIES[e.type].color;
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#fff";
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (e.type === "beam") {
      ctx.rotate(e.beamAngle);
      ctx.fillStyle = e.beamState === "fire" ? "#ff2dcb" : "#d76bff";
      ctx.globalAlpha = e.beamState === "fire" ? 0.25 : 0.1;
      ctx.fillRect(0, -7, 1000, 14);
      ctx.globalAlpha = 1;
    }
    if (e.type === "sword") {
      ctx.rotate(e.swordAngle);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(135, 0);
      ctx.stroke();
      ctx.strokeStyle = "#ff65bc";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(25, -8);
      ctx.lineTo(25, 8);
      ctx.stroke();
    }
    if (e.type === "shock" && e.phase === "jump") {
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  function drawEffect(e) {
    if (e.kind === "gravity") {
      ctx.strokeStyle = "#a878ff88";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, TAU);
      ctx.stroke();
    } else if (e.kind === "phantom") {
      ctx.strokeStyle = "#b9a0ff";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, TAU);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#ff4bd8";
      ctx.globalAlpha = Math.max(0, e.life * 2);
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r || 4, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function deathScreen() {
    overlay(
      "RUN OVER",
      state.deathReason + " • Reached round " + state.round + ".",
      ["RESTART"],
      {
        RESTART: {
          name: "RESTART",
          desc: "Return to the class selection and begin a new run.",
          icon: "↻",
        },
      },
      "class",
      "#ff3b91",
    );
    state.mode = "dead";
    document.querySelectorAll(".vbCard").forEach(
      (b) =>
        (b.onclick = () => {
          state.mode = "start";
          state.round = 1;
          state.level = 1;
          state.enemies = [];
          state.shots = [];
          state.enemyShots = [];
          state.mines = [];
          state.upgrades = Object.fromEntries(
            Object.keys(UPGRADES).map((k) => [k, 0]),
          );
          state.chains = Object.fromEntries(
            Object.keys(CHAINS).map((k) => [k, 0]),
          );
          startScreen();
        }),
    );
  }

  // ---------- input ----------
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (
      [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " ",
        "w",
        "a",
        "s",
        "d",
        "e",
      ].includes(k)
    )
      e.preventDefault();
    keys.add(k);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  canvas.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.inside = true;
    if (state.player)
      state.player.angle = Math.atan2(
        mouse.y - state.player.y,
        mouse.x - state.player.x,
      );
  });
  canvas.addEventListener("mouseleave", () => (mouse.inside = false));
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    mouse.down = true;
    if (state.mode === "play") firePlayer();
  });
  window.addEventListener("mouseup", () => (mouse.down = false));
  window.addEventListener("click", (e) => {
    if (state.mode === "play" && e.target === canvas) firePlayer();
  });

  // Main loop.
  function loop(t) {
    const dt = Math.min(0.033, (t - last) / 1000);
    last = t;
    update(dt);
    draw();
    if (
      state.mode === "play" ||
      state.mode === "between" ||
      state.mode === "dead"
    )
      hud();
    raf = requestAnimationFrame(loop);
  }
  startScreen();
  raf = requestAnimationFrame(loop);
})();
