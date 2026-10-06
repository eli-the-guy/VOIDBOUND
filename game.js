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
  };
  const upgradeDefs = {
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
    upgrades: { speed: 0, bullet: 0, jump: 0, size: 0 },
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
  };
  let arena = { x: 0, y: 0, w: 0, h: 0 };
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
    return dist(a, b) < a.r + b.r;
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
    playerDom.style.transform = `translate(-50%,-50%) scale(${state.player.jump > 0 ? 1.18 : 1})`;
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
      angle: 0,
      jump: 0,
      jumpMax: 0.8 + state.upgrades.jump * 0.3,
      cooldown: 0,
      alive: true,
    };
    updateDOM();
  }
  function chooseTwoRandomEnemies() {
    const t = Object.keys(enemyDefs).sort(() => Math.random() - 0.5);
    state.altarOptions = [t[0], t[1]];
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
    e.attack = 2;
    e.shotAngle = rnd(-Math.PI, Math.PI);
    e.angle = rnd(-Math.PI, Math.PI);
    e.phase = e.type === "beam" ? "cool" : e.type === "shock" ? "idle" : "idle";
    e.phaseTimer = e.type === "beam" ? 10 : e.type === "shock" ? 5 : 0;
    e.beamProgress = 0;
    e.targetX = e.x;
    e.targetY = e.y;
    e.jumpScale = 1;
    e.swordAngle = rnd(-Math.PI, Math.PI);
    e.swordTimer = 0;
    e.teleport = 5;
    e.strikeTimer = 0;
    e.wave = 0;
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
    spawnEnemy(chosen);
    state.roundEnemyIds = state.enemies.map((e) => e.id);
    state.enemyShots = [];
    state.shots = [];
    updateHud();
    updateDOM();
    showMessage("CHOSEN: " + enemyDefs[chosen].name);
  }
  function firePlayer() {
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
    if (state.player.cooldown > 0) return;
    const p = state.player,
      a = p.angle,
      speed = 500 + state.upgrades.bullet * 80;
    state.shots.push({
      x: p.x + Math.cos(a) * 18,
      y: p.y + Math.sin(a) * 18,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r: 5 + state.upgrades.size * 2,
      life: 2,
    });
    p.cooldown = 2;
  }
  function showUpgrades() {
    state.mode = "upgrade";
    upgradeChoices.innerHTML = "";
    Object.keys(upgradeDefs)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .forEach((k) => {
        const u = upgradeDefs[k],
          c = document.createElement("div");
        c.className = "choice";
        c.innerHTML = `<div class="tag">${u.icon}</div><div class="name">${u.name}</div><div class="desc">${u.desc}</div>`;
        c.onclick = () => chooseUpgrade(k);
        upgradeChoices.appendChild(c);
      });
    upgradeScreen.classList.remove("hidden");
    altarScreen.style.display = "none";
    updateDOM();
  }
  function chooseUpgrade(k) {
    state.upgrades[k]++;
    upgradeScreen.classList.add("hidden");
    if (k === "weaken") state.weaken = state.selectedEnemy;
    if (k === "jump") state.player.jumpMax = 0.8 + state.upgrades.jump * 0.3;
    state.level++;
    state.round++;
    showMessage(upgradeDefs[k].name + " ACQUIRED");
    startLevel();
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
    state.upgrades = { speed: 0, bullet: 0, jump: 0, size: 0 };
    state.weaken = null;
    resetPlayer();
    showAltar();
  }
  document.getElementById("startBtn").onclick = startGame;
  document.getElementById("restartBtn").onclick = () => location.reload();
  function startLevel() {
    if (state.level > 1 && state.level % 5 === 0) {
      showUpgrades();
      return;
    }
    state.mode = "play";
    resetPlayer();
    if (state.selectedEnemy) {
      reviveAllEnemies();
      const before = new Set(state.enemies.map((e) => e.id));
      addEnemiesForLevel();
      state.roundEnemyIds = state.enemies.map((e) => e.id);
    }
    updateHud();
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
    state.enemies.push({
      id: state.nextEnemyId++,
      alive: true,
      type,
      x,
      y,
      r: 18,
      angle: rnd(-Math.PI, Math.PI),
      attack: 2,
      shotAngle: rnd(-Math.PI, Math.PI),
      phase: type === "beam" ? "cool" : type === "shock" ? "idle" : "idle",
      phaseTimer: type === "beam" ? 10 : type === "shock" ? 5 : 0,
      beamProgress: 0,
      targetX: x,
      targetY: y,
      jumpScale: 1,
      swordAngle: rnd(-Math.PI, Math.PI),
      swordTimer: 0,
      teleport: 5,
      strikeTimer: 0,
      wave: 0,
    });
  }
  function enemySpeed(e) {
    const b =
      { shooter: 70, shotgun: 62, beam: 58, shock: 45, sword: 65 }[e.type] ||
      60;
    return state.weaken === e.type ? b * 0.62 : b;
  }
  function tryJump() {
    if (state.player.jump <= 0) state.player.jump = state.player.jumpMax;
  }
  function enemyBullet(x, y, a, speed = 210) {
    state.enemyShots.push({
      x: x + Math.cos(a) * 22,
      y: y + Math.sin(a) * 22,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r: 7,
      life: 8,
    });
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
    p.cooldown = Math.max(0, p.cooldown - dt);
    if (p.jump > 0) p.jump = Math.max(0, p.jump - dt);
    p.angle = angleTo(p, mouse);
    const mx =
        (keys.d || keys.arrowright ? 1 : 0) -
        (keys.a || keys.arrowleft ? 1 : 0),
      my =
        (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0),
      len = Math.hypot(mx, my) || 1,
      sp = 245 + state.upgrades.speed * 35;
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
    if (mouse.down) firePlayer();
    for (const s of state.shots) {
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
    for (const e of state.enemies) if (e.alive) updateEnemy(e, dt);
    for (const b of state.enemyShots) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    state.enemyShots = state.enemyShots.filter(
      (b) =>
        b.life > 0 &&
        b.x > arena.x - 60 &&
        b.x < arena.x + arena.w + 60 &&
        b.y > arena.y - 60 &&
        b.y < arena.y + arena.h + 60,
    );
    for (const e of state.enemies) {
      if (!e.alive) continue;
      for (let j = state.shots.length - 1; j >= 0; j--)
        if (circleHit(e, state.shots[j])) {
          for (let k = 0; k < 10; k++)
            particle(e.x, e.y, enemyDefs[e.type].color, 0.45);
          e.alive = false;
          state.shots.splice(j, 1);
          break;
        }
    }
    for (const b of state.enemyShots)
      if (dist(p, b) < p.r + b.r && p.jump <= 0) {
        die();
        return;
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
        e.attack = 2;
      }
    } else if (e.type === "shotgun") {
      e.attack -= dt;
      if (e.attack <= 0) {
        for (let k = -1; k <= 1; k++)
          enemyBullet(e.x, e.y, e.shotAngle + k * 0.28, 185);
        e.shotAngle += Math.PI / 4;
        e.attack = 2;
      }
    } else if (e.type === "beam") {
      // The BEAM enemy itself is stationary. The beam hazard is what travels.
      if (e.phase === "idle") {
        e.phaseTimer -= dt;
        if (e.phaseTimer <= 0) {
          e.phase = "warn";
          e.phaseTimer = 3;
          e.lockedAngle = angleTo(e, p);
          e.beamProgress = 0;
        }
      } else if (e.phase === "warn") {
        // Keep tracking the player during the warning, then lock the direction.
        e.lockedAngle = angleTo(e, p);
        e.phaseTimer -= dt;
        if (e.phaseTimer <= 0) {
          e.phase = "fire";
          e.phaseTimer = 3;
          e.beamProgress = 0;
        }
      } else if (e.phase === "fire") {
        // Slow-moving beam front: the player can outrun it.
        e.beamProgress += 175 * dt;
        if (
          beamHitTraveling(p, e, e.lockedAngle, e.beamProgress) &&
          p.jump <= 0
        ) {
          die();
          return;
        }
        e.phaseTimer -= dt;
        if (e.phaseTimer <= 0) {
          e.phase = "cool";
          e.phaseTimer = 10;
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
          e.phaseTimer = 2;
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
          if (dist(p, e) < 48 && p.jump <= 0) {
            die();
            return;
          }
        }
      } else {
        e.wave += 120 * dt;
        if (Math.abs(dist(p, e) - e.wave) < 14 && p.jump <= 0) die();
        if (e.wave > Math.max(arena.w, arena.h) * 1.25) {
          e.phase = "idle";
          e.phaseTimer = 5;
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
        if (e.swordTimer >= 6) {
          e.phase = "windup";
          e.phaseTimer = 1;
        }
      } else {
        e.phaseTimer -= dt;
        if (e.phaseTimer <= 0) {
          const sx = p.x + Math.cos(e.swordAngle) * 115,
            sy = p.y + Math.sin(e.swordAngle) * 115;
          const a = e.swordAngle,
            dx = p.x - sx,
            dy = p.y - sy;
          const forward = dx * Math.cos(a) + dy * Math.sin(a),
            side = Math.abs(dx * Math.sin(a) - dy * Math.cos(a));
          if (forward > 0 && forward < 190 && side < 22 && p.jump <= 0) die();
          e.phase = "idle";
          e.swordTimer = 0;
          e.swordAngle = rnd(-Math.PI, Math.PI);
        }
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
    // Only the enemies introduced for this round must be defeated. Other living enemies are carried forward.
    updateHud();
    state.mode = "between";
    showMessage("ALL ENEMIES DEFEATED");
    const token = ++state.transitionToken;
    setTimeout(() => {
      if (token !== state.transitionToken || state.mode !== "between") return;
      state.level++;
      state.round = state.level;
      if (state.level % 5 === 0) showUpgrades();
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
    for (const s of state.shots) drawShot(s);
  }
  function drawEnemy(e) {
    const c = enemyDefs[e.type].color;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(e.jumpScale || 1, e.jumpScale || 1);
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
    if (e.type === "sword") {
      const sx = state.player.x + Math.cos(e.swordAngle) * 115,
        sy = state.player.y + Math.sin(e.swordAngle) * 115;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(e.swordAngle);
      ctx.strokeStyle = "#f7cfff";
      ctx.lineWidth = e.phase === "windup" ? 10 : 6;
      ctx.shadowColor = "#ff2bd6";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(175, 0);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "#ff2bd655";
      ctx.setLineDash([5, 8]);
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 115, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
  function drawShot(s) {
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#ff2bd6";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  function drawEnemyShot(b) {
    ctx.save();
    ctx.fillStyle = "#a66aff";
    ctx.shadowColor = "#ff2bd6";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, TAU);
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
