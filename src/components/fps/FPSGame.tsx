'use client';
import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { AudioManager } from './audio';
import { WeaponState, WEAPONS } from './weapons';
import { Bot, BotConfig } from './bots';
import { buildTrainingMap, buildCompetitiveMap, buildMenuBackground } from './maps';

type GameScreen = 'main' | 'play_menu' | 'training' | 'competitive';

// ——— particle system ———
function makeParticles(scene: THREE.Scene, pos: THREE.Vector3, color: number, count = 8): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const verts = new Float32Array(count * 3);
  const velArr: number[] = [];
  for (let i = 0; i < count; i++) {
    verts[i * 3] = pos.x; verts[i * 3 + 1] = pos.y; verts[i * 3 + 2] = pos.z;
    velArr.push((Math.random() - 0.5) * 8, Math.random() * 4, (Math.random() - 0.5) * 8);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.12, transparent: true, opacity: 1 });
  const pts = new THREE.Points(geo, mat);
  (pts as any)._vel = velArr;
  (pts as any)._life = 0.5;
  scene.add(pts);
  return pts;
}

function updateParticles(pts: THREE.Points, dt: number): boolean {
  const mat = pts.material as THREE.PointsMaterial;
  (pts as any)._life -= dt;
  if ((pts as any)._life <= 0) return false;
  mat.opacity = (pts as any)._life * 2;
  const pos = pts.geometry.attributes.position.array as Float32Array;
  const vel = (pts as any)._vel as number[];
  for (let i = 0; i < vel.length / 3; i++) {
    pos[i * 3] += vel[i * 3] * dt;
    pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
    pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
    vel[i * 3 + 1] -= 9.8 * dt;
  }
  pts.geometry.attributes.position.needsUpdate = true;
  return true;
}

export default function FPSGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<{
    screen: GameScreen;
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    menuCamera: THREE.PerspectiveCamera | null;
    menuScene: THREE.Scene | null;
    audio: AudioManager;
    keys: Set<string>;
    mouse: { dx: number; dy: number; buttons: Set<number> };
    locked: boolean;
    player: {
      pos: THREE.Vector3; vel: THREE.Vector3; yaw: number; pitch: number;
      health: number; sprint: boolean; sliding: boolean; slideTimer: number;
      grounded: boolean; jumpVel: number; stepTimer: number;
    };
    weapons: WeaponState[];
    currentWeapon: number;
    bots: Bot[];
    particles: THREE.Points[];
    coverPoints: THREE.Vector3[];
    hitmarkerTimer: number;
    teleportTimer: number;
    teleportCooldown: number;
    menuAngle: number;
    animFrame: number | null;
    lastTime: number;
    muzzleFlash: THREE.PointLight | null;
    muzzleTimer: number;
    recoilVelX: number;
    recoilVelY: number;
    isTransitioning: boolean;
  } | null>(null);

  const hudRef = useRef<{
    health: HTMLDivElement | null;
    ammo: HTMLDivElement | null;
    weapon: HTMLDivElement | null;
    hitmarker: HTMLDivElement | null;
    teleport: HTMLDivElement | null;
    crosshair: HTMLDivElement | null;
    killfeed: HTMLDivElement | null;
    reload: HTMLDivElement | null;
  }>({
    health: null, ammo: null, weapon: null, hitmarker: null,
    teleport: null, crosshair: null, killfeed: null, reload: null,
  });

  const screenRef = useRef<GameScreen>('main');
  const forceUpdate = useCallback(() => {
    const root = mountRef.current;
    if (!root) return;
    const hud = root.querySelector('#fps-hud') as HTMLDivElement;
    const menu = root.querySelector('#fps-menu') as HTMLDivElement;
    if (hud) hud.style.display = screenRef.current === 'training' || screenRef.current === 'competitive' ? 'block' : 'none';
    if (menu) menu.style.display = screenRef.current === 'main' || screenRef.current === 'play_menu' ? 'flex' : 'none';
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const audio = new AudioManager();

    // ——— renderer ———
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '0';

    // ——— menu scene ———
    const menuScene = new THREE.Scene();
    const menuCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    menuCamera.position.set(0, 8, 5);
    menuCamera.lookAt(0, 3, -20);
    buildMenuBackground(menuScene);

    // ——— game scene ———
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.05, 300);

    const muzzleFlash = new THREE.PointLight(0xffaa00, 0, 3);
    scene.add(muzzleFlash);

    const state = {
      screen: 'main' as GameScreen,
      renderer, scene, camera, menuCamera, menuScene, audio,
      keys: new Set<string>(),
      mouse: { dx: 0, dy: 0, buttons: new Set<number>() },
      locked: false,
      player: {
        pos: new THREE.Vector3(0, 1.7, 15),
        vel: new THREE.Vector3(), yaw: 0, pitch: 0,
        health: 100, sprint: false, sliding: false, slideTimer: 0,
        grounded: true, jumpVel: 0, stepTimer: 0,
      },
      weapons: [
        new WeaponState(WEAPONS.ar, 150),
        new WeaponState(WEAPONS.pistol, 60),
        new WeaponState(WEAPONS.sniper, 25),
      ],
      currentWeapon: 0,
      bots: [] as Bot[],
      particles: [] as THREE.Points[],
      coverPoints: [] as THREE.Vector3[],
      hitmarkerTimer: 0,
      teleportTimer: 10,
      teleportCooldown: 0,
      menuAngle: 0,
      animFrame: null as number | null,
      lastTime: performance.now(),
      muzzleFlash,
      muzzleTimer: 0,
      recoilVelX: 0,
      recoilVelY: 0,
      isTransitioning: false,
    };
    gameRef.current = state;

    // ——— event listeners ———
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.code;
      if (down) state.keys.add(k); else state.keys.delete(k);
      if (down && k === 'KeyR') {
        const w = state.weapons[state.currentWeapon];
        if (w.startReload()) audio.reload();
      }
      if (down && k === 'Digit1') state.currentWeapon = 0;
      if (down && k === 'Digit2') state.currentWeapon = 1;
      if (down && k === 'Digit3') state.currentWeapon = 2;
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (state.locked) {
        state.mouse.dx += e.movementX;
        state.mouse.dy += e.movementY;
      }
    };

    const onMouseDown = (e: MouseEvent) => { state.mouse.buttons.add(e.button); };
    const onMouseUp = (e: MouseEvent) => { state.mouse.buttons.delete(e.button); };

    const onPLChange = () => { state.locked = document.pointerLockElement === renderer.domElement; };

    const onWheel = (e: WheelEvent) => {
      const count = state.weapons.length;
      state.currentWeapon = (state.currentWeapon + (e.deltaY > 0 ? 1 : -1) + count) % count;
    };

    document.addEventListener('keydown', e => onKey(e, true));
    document.addEventListener('keyup', e => onKey(e, false));
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('pointerlockchange', onPLChange);
    renderer.domElement.addEventListener('wheel', onWheel);

    // ——— start training ———
    function startTraining() {
      // Clear scene
      scene.clear();
      scene.add(muzzleFlash);
      state.bots = [];
      state.particles = [];

      const { spawnPoints, coverPoints } = buildTrainingMap(scene);
      state.coverPoints = coverPoints;

      state.player.pos.set(spawnPoints[0].x, 1.7, spawnPoints[0].z);
      state.player.yaw = 0;
      state.player.pitch = 0;
      state.player.health = 100;
      state.currentWeapon = 0;
      state.weapons.forEach(w => { w.ammo = w.def.magSize; w.reloading = false; });
      state.teleportTimer = 10;
      state.teleportCooldown = 0;

      // Static bots (training dummies)
      const staticPositions: THREE.Vector3[] = [
        new THREE.Vector3(20, 0, 0), new THREE.Vector3(-20, 0, 0),
        new THREE.Vector3(0, 0, 20), new THREE.Vector3(0, 0, -20),
        new THREE.Vector3(14, 0, 14), new THREE.Vector3(-14, 0, 14),
        new THREE.Vector3(14, 0, -14), new THREE.Vector3(-14, 0, -14),
      ];
      staticPositions.forEach(pos => {
        state.bots.push(new Bot({ position: pos, mobile: false, shoots: false, health: 80 }, scene, audio));
      });

      // Mobile bots
      const mobilePositions = [
        new THREE.Vector3(30, 0, 10), new THREE.Vector3(-30, 0, -10),
        new THREE.Vector3(25, 0, -25), new THREE.Vector3(-25, 0, 25),
      ];
      mobilePositions.forEach(pos => {
        state.bots.push(new Bot({ position: pos, mobile: true, shoots: true, health: 100 }, scene, audio));
      });

      // Shooting bots (don't move but shoot)
      const shootPositions = [
        new THREE.Vector3(35, 0, 0), new THREE.Vector3(-35, 0, 0),
        new THREE.Vector3(0, 0, 35),
      ];
      shootPositions.forEach(pos => {
        state.bots.push(new Bot({ position: pos, mobile: false, shoots: true, health: 100 }, scene, audio));
      });

      state.screen = 'training';
      screenRef.current = 'training';
      forceUpdate();
      renderer.domElement.requestPointerLock();
    }

    function startCompetitive() {
      scene.clear();
      scene.add(muzzleFlash);
      state.bots = [];
      state.particles = [];

      const { spawnPoints, coverPoints } = buildCompetitiveMap(scene);
      state.coverPoints = coverPoints;

      state.player.pos.set(spawnPoints[0].x, 1.7, spawnPoints[0].z);
      state.player.yaw = 0;
      state.player.pitch = 0.1;
      state.player.health = 100;
      state.weapons = [
        new WeaponState(WEAPONS.ar, 150),
        new WeaponState(WEAPONS.pistol, 60),
        new WeaponState(WEAPONS.sniper, 25),
      ];
      state.currentWeapon = 0;
      state.teleportTimer = 10;
      state.teleportCooldown = 3;

      // Competitive bots
      const botPositions: Array<[number, number, boolean]> = [
        [10, 32, true], [-10, 28, true], [5, 30, true],
        [0, 10, true], [-15, 5, true], [15, -5, true],
        [-20, -10, true], [20, 15, true],
      ];
      botPositions.forEach(([x, z, mobile]) => {
        state.bots.push(new Bot({
          position: new THREE.Vector3(x, 0, z),
          mobile, shoots: true, health: 100,
        }, scene, audio));
      });

      state.screen = 'competitive';
      screenRef.current = 'competitive';
      forceUpdate();
    }

    // Expose to menu buttons
    (window as any).__startTraining = startTraining;
    (window as any).__startCompetitive = startCompetitive;

    // ——— shoot ———
    function shoot() {
      const w = state.weapons[state.currentWeapon];
      if (!w.fire()) return;

      // Sound
      const wName = ['ar', 'pistol', 'sniper'][state.currentWeapon];
      if (wName === 'ar') audio.shootAR();
      else if (wName === 'pistol') audio.shootPistol();
      else audio.shootSniper();

      // Muzzle flash
      muzzleFlash.intensity = 8;
      state.muzzleTimer = 0.05;

      // Add recoil velocity
      state.recoilVelX += (Math.random() - 0.5) * w.def.recoilX * 60;
      state.recoilVelY += w.def.recoilY * 60;

      // Raycast
      const spread = w.def.spread * (state.player.sprint ? 2 : 1);
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * spread * 2,
        (Math.random() - 0.5) * spread * 2,
        -1
      ).applyQuaternion(camera.quaternion).normalize();

      const raycaster = new THREE.Raycaster(camera.position.clone(), dir, 0.1, w.def.range);
      const targets = state.bots
        .filter(b => b.alive)
        .flatMap(b => [b.headMesh as THREE.Object3D, b.bodyMesh as THREE.Object3D]);

      const hits = raycaster.intersectObjects(targets);
      if (hits.length > 0) {
        const obj = hits[0].object as THREE.Mesh;
        // Find which bot
        for (const bot of state.bots) {
          if (obj === (bot as any).headMesh || obj === (bot as any).bodyMesh) {
            const headshot = obj === (bot as any).headMesh;
            const dmg = w.def.damage * (headshot ? 2.5 : 1);
            const killed = bot.hit(dmg);
            audio.hitmarker();
            state.hitmarkerTimer = 0.15;

            // Impact particles
            const color = headshot ? 0xff4400 : 0xff8800;
            const parts = makeParticles(scene, hits[0].point, color);
            state.particles.push(parts);

            // Kill feed
            const kf = hudRef.current.killfeed;
            if (kf && killed) {
              const entry = document.createElement('div');
              entry.className = 'kf-entry';
              entry.textContent = headshot ? '🎯 HEADSHOT' : '💀 KILL';
              kf.appendChild(entry);
              setTimeout(() => entry.remove(), 2500);
            }
            break;
          }
        }
      } else {
        // Impact on world
        const worldHit = raycaster.intersectObjects(scene.children.filter(c => c instanceof THREE.Mesh && !targets.includes(c)));
        if (worldHit.length > 0) {
          audio.impact();
          const parts = makeParticles(scene, worldHit[0].point, 0xaaaaaa, 5);
          state.particles.push(parts);
        }
      }
    }

    // ——— bot shoot callback ———
    function onBotShoot(origin: THREE.Vector3, dir: THREE.Vector3) {
      const dist = origin.distanceTo(state.player.pos);
      if (dist < 2) {
        state.player.health -= 5;
        state.player.health = Math.max(0, state.player.health);
      }
    }

    // ——— game loop ———
    let lastShot = 0;
    function loop(timestamp: number) {
      state.animFrame = requestAnimationFrame(loop);
      const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
      state.lastTime = timestamp;

      if (state.screen === 'main' || state.screen === 'play_menu') {
        // Animate menu background
        state.menuAngle += dt * 0.08;
        menuCamera.position.x = Math.cos(state.menuAngle) * 12;
        menuCamera.position.z = 5 + Math.sin(state.menuAngle * 0.7) * 4;
        menuCamera.position.y = 6 + Math.sin(state.menuAngle * 0.3) * 1.5;
        menuCamera.lookAt(0, 3, -15);
        renderer.render(menuScene, menuCamera);
        return;
      }

      // ——— player movement ———
      const p = state.player;
      const sprint = state.keys.has('ShiftLeft') || state.keys.has('ShiftRight');
      p.sprint = sprint && !p.sliding;
      const moveSpeed = p.sliding ? 8 : (sprint ? 9 : 5.5);

      const forward = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
      const right = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
      const moveDir = new THREE.Vector3();

      if (!p.sliding) {
        if (state.keys.has('KeyW')) moveDir.add(forward);
        if (state.keys.has('KeyS')) moveDir.sub(forward);
        if (state.keys.has('KeyA')) moveDir.sub(right);
        if (state.keys.has('KeyD')) moveDir.add(right);
        if (moveDir.length() > 0) moveDir.normalize();
      } else {
        // Slide direction
        moveDir.copy(forward);
      }

      const isMoving = moveDir.length() > 0.1;

      // Slide
      if ((state.keys.has('ControlLeft') || state.keys.has('ControlRight')) && sprint && !p.sliding && isMoving) {
        p.sliding = true;
        p.slideTimer = 0.7;
      }
      if (p.sliding) {
        p.slideTimer -= dt;
        if (p.slideTimer <= 0) p.sliding = false;
      }

      p.vel.x += (moveDir.x * moveSpeed - p.vel.x) * Math.min(dt * 12, 1);
      p.vel.z += (moveDir.z * moveSpeed - p.vel.z) * Math.min(dt * 12, 1);

      // Jump
      if (state.keys.has('Space') && p.grounded) {
        p.jumpVel = 6;
        p.grounded = false;
      }
      p.jumpVel -= 18 * dt;
      p.pos.y += p.jumpVel * dt;
      if (p.pos.y <= 1.7) { p.pos.y = 1.7; p.grounded = true; p.jumpVel = 0; }

      p.pos.x += p.vel.x * dt;
      p.pos.z += p.vel.z * dt;

      // Bound to map
      const bound = state.screen === 'training' ? 54 : 39;
      p.pos.x = Math.max(-bound, Math.min(bound, p.pos.x));
      p.pos.z = Math.max(-bound, Math.min(bound, p.pos.z));

      // Footstep sound
      if (isMoving && p.grounded) {
        p.stepTimer -= dt;
        if (p.stepTimer <= 0) {
          audio.step();
          p.stepTimer = sprint ? 0.28 : 0.42;
        }
      }

      // Mouse look
      const sens = 0.0022;
      state.recoilVelY += -state.recoilVelY * Math.min(dt * 15, 1);
      state.recoilVelX += -state.recoilVelX * Math.min(dt * 15, 1);

      p.yaw -= state.mouse.dx * sens;
      p.pitch -= state.mouse.dy * sens;
      p.pitch -= state.recoilVelY * dt * 0.3;
      p.yaw -= state.recoilVelX * dt * 0.3;

      state.recoilVelY *= Math.pow(0.05, dt);
      state.recoilVelX *= Math.pow(0.1, dt);

      p.pitch = Math.max(-1.4, Math.min(1.4, p.pitch));
      state.mouse.dx = 0;
      state.mouse.dy = 0;

      // Camera
      const eyeHeight = p.sliding ? 1.0 : (p.sprint ? 1.6 : 1.7);
      camera.position.lerp(new THREE.Vector3(p.pos.x, p.pos.y - 1.7 + eyeHeight, p.pos.z), Math.min(dt * 20, 1));
      camera.rotation.order = 'YXZ';
      camera.rotation.y = p.yaw;
      camera.rotation.x = p.pitch;

      // Breathing / bob
      if (isMoving) {
        const bobFreq = sprint ? 14 : 8;
        const bobAmt = sprint ? 0.03 : 0.015;
        camera.position.y += Math.sin(timestamp * 0.001 * bobFreq) * bobAmt;
        camera.position.x += Math.cos(timestamp * 0.001 * bobFreq * 0.5) * bobAmt * 0.5;
      }

      // Muzzle flash position
      const muzzleOffset = new THREE.Vector3(0.2, -0.15, -0.5);
      muzzleOffset.applyQuaternion(camera.quaternion);
      muzzleFlash.position.copy(camera.position).add(muzzleOffset);
      if (state.muzzleTimer > 0) {
        state.muzzleTimer -= dt;
        if (state.muzzleTimer <= 0) muzzleFlash.intensity = 0;
      }

      // Shooting input
      const w = state.weapons[state.currentWeapon];
      const shouldFire = w.def.auto
        ? state.mouse.buttons.has(0)
        : (state.mouse.buttons.has(0) && timestamp - lastShot > (60 / w.def.rpm) * 1000);

      if (shouldFire && state.locked && !w.reloading) {
        shoot();
        lastShot = timestamp;
      }

      // Update weapons
      w.update(dt);

      // Update bots
      state.bots = state.bots.filter(b => {
        b.update(dt, p.pos, onBotShoot, state.coverPoints);
        if (!b.alive && b.deathTimer <= 0) {
          b.dispose();
          return false;
        }
        return true;
      });

      // Update particles
      state.particles = state.particles.filter(pts => {
        const alive = updateParticles(pts, dt);
        if (!alive) scene.remove(pts);
        return alive;
      });

      // Hitmarker
      state.hitmarkerTimer = Math.max(0, state.hitmarkerTimer - dt);

      // Teleporter
      if (state.teleportCooldown > 0) state.teleportCooldown -= dt;

      if (state.screen === 'training' && state.teleportCooldown <= 0) {
        state.teleportTimer -= dt;

        // Countdown beep at each second
        const prevInt = Math.ceil(state.teleportTimer + dt);
        const currInt = Math.ceil(state.teleportTimer);
        if (currInt !== prevInt && currInt <= 5 && currInt > 0) {
          audio.countdown();
        }

        if (state.teleportTimer <= 0) {
          if (!state.isTransitioning) {
            state.isTransitioning = true;
            audio.teleport();
            const overlay = document.getElementById('teleport-overlay');
            if (overlay) { overlay.style.opacity = '1'; }
            setTimeout(() => {
              startCompetitive();
              state.isTransitioning = false;
              if (overlay) { overlay.style.opacity = '0'; }
            }, 1200);
          }
        }
      }

      // HUD updates
      updateHUD(state);

      renderer.render(scene, camera);
    }

    function updateHUD(state: typeof gameRef.current) {
      if (!state) return;
      const h = hudRef.current;
      const p = state.player;
      const w = state.weapons[state.currentWeapon];

      if (h.health) {
        h.health.textContent = `❤ ${Math.max(0, Math.ceil(p.health))}`;
        const pct = p.health / 100;
        h.health.style.color = pct > 0.6 ? '#00ff88' : pct > 0.3 ? '#ffaa00' : '#ff3333';
      }
      if (h.ammo) {
        h.ammo.textContent = w.reloading ? 'RELOADING...' : `${w.ammo} / ${w.reserve}`;
      }
      if (h.weapon) {
        h.weapon.textContent = w.def.name;
      }
      if (h.hitmarker) {
        h.hitmarker.style.opacity = state.hitmarkerTimer > 0 ? '1' : '0';
      }
      if (h.reload) {
        h.reload.style.display = w.reloading ? 'block' : 'none';
        if (w.reloading) {
          const pct = 1 - w.reloadTimer / w.def.reloadTime;
          h.reload.style.setProperty('--pct', `${pct * 100}%`);
        }
      }

      if (h.teleport && state.screen === 'training' && state.teleportCooldown <= 0) {
        const t = Math.max(0, Math.ceil(state.teleportTimer));
        h.teleport.textContent = t > 0 ? `TÉLÉPORTATION DANS ${t}s` : 'TÉLÉPORTATION...';
        h.teleport.style.display = 'block';
        h.teleport.style.color = t <= 3 ? '#ff4444' : '#00ffcc';
        h.teleport.style.transform = t <= 3 ? `scale(${1 + Math.sin(Date.now() * 0.01) * 0.05})` : 'scale(1)';
      } else if (h.teleport) {
        h.teleport.style.display = 'none';
      }

      if (h.crosshair) {
        const spread = w.def.spread * (p.sprint ? 2 : 1) * 300;
        const gap = 4 + (w.recoilY * 20) + spread * 0.5;
        h.crosshair.querySelectorAll('.ch-line').forEach((el, i) => {
          const e = el as HTMLElement;
          const g = `${gap}px`;
          if (i === 0) e.style.top = `calc(-8px - ${g})`;
          if (i === 1) e.style.top = g;
          if (i === 2) e.style.left = `calc(-8px - ${g})`;
          if (i === 3) e.style.left = g;
        });
      }
    }

    // Start loop
    state.animFrame = requestAnimationFrame(loop);

    // Resize
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      menuCamera.aspect = window.innerWidth / window.innerHeight;
      menuCamera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (state.animFrame) cancelAnimationFrame(state.animFrame);
      document.removeEventListener('keydown', e => onKey(e, true));
      document.removeEventListener('keyup', e => onKey(e, false));
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('pointerlockchange', onPLChange);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [forceUpdate]);

  return (
    <div ref={mountRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
      {/* ——— MENU OVERLAY ——— */}
      <div id="fps-menu" style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', pointerEvents: 'none',
      }}>
        {/* Logo */}
        <div style={{
          fontSize: 72, fontWeight: 900, letterSpacing: 12,
          fontFamily: "'Orbitron', 'Courier New', monospace",
          color: '#fff', textShadow: '0 0 40px #00eeff, 0 0 80px #0044ff',
          marginBottom: 8, pointerEvents: 'none',
        }}>
          NEXUS<span style={{ color: '#00eeff' }}>FPS</span>
        </div>
        <div style={{ fontSize: 13, letterSpacing: 6, color: '#445577', marginBottom: 56, fontFamily: 'monospace' }}>
          COMPÉTITIF · FUTURISTE · IMMERSIF
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 48, pointerEvents: 'all' }}>
          {[
            { label: 'JOUER', active: true, action: 'play' },
            { label: 'BOUTIQUE', active: false, action: 'shop' },
          ].map(tab => (
            <button
              key={tab.label}
              onClick={() => {
                if (tab.action === 'play') {
                  const g = gameRef.current;
                  if (!g) return;
                  g.audio.uiClick();
                  const menu = document.getElementById('fps-menu')!;
                  const submenu = document.getElementById('fps-submenu')!;
                  submenu.style.display = 'flex';
                  screenRef.current = 'play_menu';
                  g.screen = 'play_menu';
                } else {
                  gameRef.current?.audio.uiHover();
                }
              }}
              onMouseEnter={() => gameRef.current?.audio.uiHover()}
              style={{
                padding: '12px 40px',
                background: tab.active ? 'rgba(0,238,255,0.08)' : 'rgba(255,255,255,0.02)',
                border: tab.active ? '1px solid #00eeff' : '1px solid #223344',
                color: tab.active ? '#00eeff' : '#334455',
                fontSize: 14, letterSpacing: 4,
                fontFamily: 'monospace', cursor: tab.active ? 'pointer' : 'default',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
              {!tab.active && <span style={{ display: 'block', fontSize: 9, color: '#334455', letterSpacing: 2, marginTop: 2 }}>BIENTÔT DISPONIBLE</span>}
            </button>
          ))}
        </div>

        {/* Sub-menu */}
        <div id="fps-submenu" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: 12, pointerEvents: 'all' }}>
          <div style={{ fontSize: 11, letterSpacing: 5, color: '#334466', marginBottom: 8 }}>SÉLECTIONNER UN MODE</div>
          <button
            onClick={() => {
              const g = gameRef.current;
              if (!g) return;
              g.audio.uiClick();
              (window as any).__startTraining?.();
            }}
            onMouseEnter={() => gameRef.current?.audio.uiHover()}
            style={{
              padding: '18px 64px',
              background: 'rgba(0,238,255,0.06)',
              border: '1px solid #00eeff',
              color: '#fff', fontSize: 18, letterSpacing: 6,
              fontFamily: 'monospace', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0,238,255,0.15), inset 0 0 20px rgba(0,238,255,0.04)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.25s',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,238,255,0.15)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(0,238,255,0.4), inset 0 0 30px rgba(0,238,255,0.1)';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,238,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(0,238,255,0.15), inset 0 0 20px rgba(0,238,255,0.04)';
            }}
          >
            MODE ENTRAÎNEMENT
          </button>
          <button
            onClick={() => {
              const g = gameRef.current;
              if (!g) return;
              g.audio.uiClick();
              g.screen = 'main';
              screenRef.current = 'main';
              const sub = document.getElementById('fps-submenu')!;
              sub.style.display = 'none';
            }}
            style={{
              padding: '8px 32px', background: 'transparent',
              border: '1px solid #223344', color: '#445566',
              fontSize: 11, letterSpacing: 4, fontFamily: 'monospace', cursor: 'pointer',
            }}
          >
            RETOUR
          </button>
        </div>

        {/* Bottom hints */}
        <div style={{
          position: 'absolute', bottom: 32, fontSize: 10, color: '#223344',
          letterSpacing: 3, fontFamily: 'monospace', textAlign: 'center',
        }}>
          WASD DÉPLACER · SHIFT SPRINT · CTRL GLISSADE · R RECHARGER · 1/2/3 ARMES
        </div>
      </div>

      {/* ——— HUD ——— */}
      <div id="fps-hud" style={{ display: 'none', position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        {/* Crosshair */}
        <div
          ref={el => { hudRef.current.crosshair = el; }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 0, height: 0,
          }}
        >
          <style>{`
            .ch-line { position: absolute; background: rgba(255,255,255,0.9); }
            :root { --gap: 8px; }
          `}</style>
          {[
            { w: '2px', h: '8px', top: 'calc(-8px - var(--gap))', left: '-1px' },
            { w: '2px', h: '8px', top: 'var(--gap)', left: '-1px' },
            { w: '8px', h: '2px', top: '-1px', left: 'calc(-8px - var(--gap))' },
            { w: '8px', h: '2px', top: '-1px', left: 'var(--gap)' },
          ].map((s, i) => (
            <div key={i} className="ch-line" style={{ ...s }} />
          ))}
          <div style={{
            position: 'absolute', width: 3, height: 3, borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)', top: '-1.5px', left: '-1.5px',
          }} />
        </div>

        {/* Hitmarker */}
        <div
          ref={el => { hudRef.current.hitmarker = el; }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20, height: 20, opacity: 0, transition: 'opacity 0.05s',
            pointerEvents: 'none',
          }}
        >
          {[
            { w: '2px', h: '6px', top: '-12px', left: '-1px', transform: 'rotate(45deg)' },
            { w: '2px', h: '6px', top: '6px', left: '-1px', transform: 'rotate(45deg)' },
            { w: '6px', h: '2px', top: '-1px', left: '-12px', transform: 'rotate(45deg)' },
            { w: '6px', h: '2px', top: '-1px', left: '6px', transform: 'rotate(45deg)' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', background: '#ff4444', ...s }} />
          ))}
        </div>

        {/* Health */}
        <div
          ref={el => { hudRef.current.health = el; }}
          style={{
            position: 'absolute', bottom: 36, left: 40,
            fontSize: 28, fontWeight: 700, fontFamily: 'monospace',
            color: '#00ff88', textShadow: '0 0 12px currentColor',
            letterSpacing: 2,
          }}
        >100</div>

        {/* Ammo */}
        <div
          ref={el => { hudRef.current.ammo = el; }}
          style={{
            position: 'absolute', bottom: 36, right: 40,
            fontSize: 28, fontWeight: 700, fontFamily: 'monospace',
            color: '#fff', textShadow: '0 0 8px #00eeff',
            letterSpacing: 2, textAlign: 'right',
          }}
        />

        {/* Weapon name */}
        <div
          ref={el => { hudRef.current.weapon = el; }}
          style={{
            position: 'absolute', bottom: 70, right: 40,
            fontSize: 11, fontFamily: 'monospace', color: '#446688',
            letterSpacing: 4, textAlign: 'right',
          }}
        />

        {/* Reload bar */}
        <div
          ref={el => { hudRef.current.reload = el; }}
          style={{ display: 'none', position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)' }}
        >
          <div style={{ fontSize: 11, color: '#aaccff', letterSpacing: 3, fontFamily: 'monospace', marginBottom: 6, textAlign: 'center' }}>RECHARGEMENT</div>
          <div style={{ width: 200, height: 3, background: '#112233', borderRadius: 2 }}>
            <div style={{ height: '100%', background: '#00eeff', borderRadius: 2, width: 'var(--pct, 0%)', transition: 'width 0.05s' }} />
          </div>
        </div>

        {/* Teleport timer */}
        <div
          ref={el => { hudRef.current.teleport = el; }}
          style={{
            display: 'none', position: 'absolute', top: 24, left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 14, fontFamily: 'monospace', color: '#00ffcc',
            letterSpacing: 5, textShadow: '0 0 20px currentColor',
            textAlign: 'center',
          }}
        />

        {/* Kill feed */}
        <div
          ref={el => { hudRef.current.killfeed = el; }}
          style={{
            position: 'absolute', top: 24, right: 24,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
          }}
        >
          <style>{`
            .kf-entry {
              font-family: monospace; font-size: 12px; letter-spacing: 2px;
              color: #00ff88; background: rgba(0,0,0,0.5);
              padding: 4px 12px; border-left: 2px solid #00ff88;
              animation: fadeIn 0.15s ease;
            }
            @keyframes fadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          `}</style>
        </div>

        {/* Edge damage vignette */}
        <div id="dmg-vignette" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(255,0,0,0) 100%)',
          transition: 'background 0.1s',
        }} />

        {/* Minimap placeholder */}
        <div style={{
          position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 12,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === 0 ? '#00eeff' : '#223344',
              boxShadow: i === 0 ? '0 0 8px #00eeff' : 'none',
            }} />
          ))}
        </div>
      </div>

      {/* Teleport overlay */}
      <div
        id="teleport-overlay"
        style={{
          position: 'absolute', inset: 0, zIndex: 20,
          background: 'radial-gradient(ellipse, rgba(0,255,200,0.3) 0%, rgba(0,100,255,0.5) 50%, rgba(0,0,0,1) 100%)',
          opacity: 0, pointerEvents: 'none',
          transition: 'opacity 0.5s ease',
        }}
      >
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 48, fontFamily: 'monospace', fontWeight: 900,
          color: '#00ffcc', textShadow: '0 0 40px #00ffcc',
          letterSpacing: 8,
        }}>
          TÉLÉPORTATION
        </div>
      </div>

      {/* Lock prompt */}
      <div
        id="lock-prompt"
        onClick={() => {
          const g = gameRef.current;
          if (!g) return;
          if ((g.screen === 'training' || g.screen === 'competitive') && !g.locked) {
            g.renderer?.domElement.requestPointerLock();
          }
        }}
        style={{
          position: 'absolute', bottom: 120, left: '50%', transform: 'translateX(-50%)',
          zIndex: 15, fontSize: 11, color: '#334455', fontFamily: 'monospace',
          letterSpacing: 3, cursor: 'pointer', display: 'block',
        }}
      >
        CLIQUER POUR JOUER
      </div>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:focus { outline: none; }
      `}</style>
    </div>
  );
}
