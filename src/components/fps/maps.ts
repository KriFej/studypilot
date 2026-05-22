import * as THREE from 'three';

function neonMat(color: number, emissive?: number) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: emissive ?? color,
    emissiveIntensity: 0.6,
    metalness: 0.9,
    roughness: 0.1,
  });
}

function metalMat(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.95,
    roughness: 0.15,
  });
}

function box(scene: THREE.Scene, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addNeonStrip(scene: THREE.Scene, start: THREE.Vector3, end: THREE.Vector3, color: number) {
  const dir = end.clone().sub(start);
  const len = dir.length();
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(len, 0.05, 0.05),
    neonMat(color)
  );
  mesh.position.copy(mid);
  mesh.lookAt(end);
  scene.add(mesh);
  const light = new THREE.PointLight(color, 1.5, 8);
  light.position.copy(mid);
  scene.add(light);
}

export function buildTrainingMap(scene: THREE.Scene): { spawnPoints: THREE.Vector3[], coverPoints: THREE.Vector3[] } {
  scene.fog = new THREE.FogExp2(0x000a1a, 0.015);
  scene.background = new THREE.Color(0x000a1a);

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a1628, metalness: 0.8, roughness: 0.3 });
  const wallMat = metalMat(0x0d1f35);
  const accentMat = neonMat(0x00eeff);
  const accent2Mat = neonMat(0xff00aa);

  // Floor - large arena
  const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 64), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Floor grid lines
  for (let i = -50; i <= 50; i += 5) {
    addNeonStrip(scene, new THREE.Vector3(i, 0.01, -50), new THREE.Vector3(i, 0.01, 50), 0x0033ff);
    addNeonStrip(scene, new THREE.Vector3(-50, 0.01, i), new THREE.Vector3(50, 0.01, i), 0x0033ff);
  }

  // Outer walls - 12 segments forming a dodecagon
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const nx = Math.cos(angle) * 55;
    const nz = Math.sin(angle) * 55;
    const wallMesh = box(scene, 30, 15, 1, nx, 7.5, nz, wallMat);
    wallMesh.rotation.y = angle;

    // Neon strips on walls
    const stripColor = i % 2 === 0 ? 0x00eeff : 0xff00aa;
    const p1 = new THREE.Vector3(nx - 14, 0.1, nz);
    const p2 = new THREE.Vector3(nx + 14, 0.1, nz);
    addNeonStrip(scene, p1, p2, stripColor);
    addNeonStrip(scene, new THREE.Vector3(nx, 14, nz - 0.5), new THREE.Vector3(nx, 14, nz + 0.5), 0x00ffaa);
  }

  // Central platform / teleporter base
  const platMat = new THREE.MeshStandardMaterial({ color: 0x001122, metalness: 0.95, roughness: 0.05 });
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.3, 64), platMat);
  plat.receiveShadow = true;
  scene.add(plat);

  // Teleporter ring
  const ringGeo = new THREE.TorusGeometry(8, 0.15, 16, 80);
  const ringMesh = new THREE.Mesh(ringGeo, neonMat(0x00ffcc, 0x00ffcc));
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = 0.3;
  scene.add(ringMesh);

  // Second ring
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(7, 0.08, 16, 60), neonMat(0x0088ff));
  ring2.rotation.x = Math.PI / 2;
  ring2.position.y = 0.35;
  scene.add(ring2);

  // Holographic floor disc for teleporter
  const holoGeo = new THREE.CircleGeometry(7.8, 64);
  const holoMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
  const holoDisc = new THREE.Mesh(holoGeo, holoMat);
  holoDisc.rotation.x = -Math.PI / 2;
  holoDisc.position.y = 0.31;
  scene.add(holoDisc);

  // Point light for teleporter
  const tpLight = new THREE.PointLight(0x00ffcc, 3, 20);
  tpLight.position.set(0, 3, 0);
  scene.add(tpLight);

  // Training posts / target stands
  const postMat = metalMat(0x223344);
  const coverPoints: THREE.Vector3[] = [];
  const targetPositions = [
    [20, 0, 0], [-20, 0, 0], [0, 0, 20], [0, 0, -20],
    [14, 0, 14], [-14, 0, 14], [14, 0, -14], [-14, 0, -14],
    [30, 0, 10], [-30, 0, -10], [25, 0, -25],
    [35, 0, 0], [-35, 0, 0], [0, 0, 35], [0, 0, -35],
  ];

  for (const [x, , z] of targetPositions) {
    box(scene, 0.3, 2.5, 0.3, x, 1.25, z, postMat);
    coverPoints.push(new THREE.Vector3(x, 0, z));
  }

  // Holographic screens on walls
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x002244, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const sx = Math.cos(angle) * 52;
    const sz = Math.sin(angle) * 52;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), screenMat);
    screen.position.set(sx, 6, sz);
    screen.lookAt(0, 6, 0);
    scene.add(screen);

    // Screen border
    const borderMat = neonMat(i % 2 === 0 ? 0x00eeff : 0xff00aa);
    const border = new THREE.Mesh(new THREE.EdgesGeometry(new THREE.PlaneGeometry(6.2, 4.2)), borderMat);
    border.position.set(sx, 6, sz);
    border.lookAt(0, 6, 0);
    scene.add(border);
  }

  // Ceiling lights
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const lx = Math.cos(angle) * 30;
    const lz = Math.sin(angle) * 30;
    const light = new THREE.PointLight(i % 2 === 0 ? 0x0066ff : 0xff0066, 2, 25);
    light.position.set(lx, 12, lz);
    scene.add(light);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3), neonMat(i % 2 === 0 ? 0x0066ff : 0xff0066));
    bulb.position.set(lx, 12, lz);
    scene.add(bulb);
  }

  // Ambient
  scene.add(new THREE.AmbientLight(0x020810, 1));
  const dirLight = new THREE.DirectionalLight(0x4488ff, 0.5);
  dirLight.position.set(10, 30, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const spawnPoints = [
    new THREE.Vector3(15, 1, 0),
    new THREE.Vector3(-15, 1, 0),
    new THREE.Vector3(0, 1, 15),
    new THREE.Vector3(0, 1, -15),
  ];

  return { spawnPoints, coverPoints };
}

export function buildCompetitiveMap(scene: THREE.Scene): { spawnPoints: THREE.Vector3[], coverPoints: THREE.Vector3[] } {
  scene.fog = new THREE.Fog(0x05080f, 30, 120);
  scene.background = new THREE.Color(0x05080f);

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0c1520, metalness: 0.7, roughness: 0.4 });
  const concMat = metalMat(0x1a2030);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x003366, transparent: true, opacity: 0.4, metalness: 0.95, roughness: 0.0 });

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Outer boundary walls
  const wallMat = metalMat(0x111825);
  [
    [80, 0.1, 0.8, 0, 4, -40],
    [80, 0.1, 0.8, 0, 4, 40],
    [0.8, 0.1, 80, -40, 4, 0],
    [0.8, 0.1, 80, 40, 4, 0],
  ].forEach(([w, , d, x, y, z]) => box(scene, w as number, 8, d as number, x as number, y as number, z as number, wallMat));

  // Main cover structures
  const covers: Array<[number, number, number, number, number, number]> = [
    // Center cross structure
    [12, 2, 1.5, 0, 1, 0],
    [1.5, 2, 12, 0, 1, 0],
    // Flanking boxes
    [3, 2, 2, -12, 1, -12],
    [3, 2, 2, 12, 1, -12],
    [3, 2, 2, -12, 1, 12],
    [3, 2, 2, 12, 1, 12],
    // Long walls
    [8, 2, 1, -20, 1, 5],
    [8, 2, 1, 20, 1, -5],
    [1, 2, 8, -5, 1, -18],
    [1, 2, 8, 5, 1, 18],
    // Side buildings
    [6, 6, 6, -28, 3, 0],
    [6, 6, 6, 28, 3, 0],
    [4, 4, 4, -18, 2, -25],
    [4, 4, 4, 18, 2, 25],
    // Ramps/elevated
    [5, 1, 3, -8, 0.5, 8],
    [5, 1, 3, 8, 0.5, -8],
  ];

  const coverPoints: THREE.Vector3[] = [];
  covers.forEach(([w, h, d, x, y, z]) => {
    box(scene, w, h, d, x, y, z, concMat);
    coverPoints.push(new THREE.Vector3(x, 0, z));
  });

  // Elevated platforms on side buildings
  [-28, 28].forEach(bx => {
    box(scene, 6, 0.3, 6, bx, 6, 0, glassMat);
    const railMat = neonMat(bx < 0 ? 0x00aaff : 0xff4400);
    box(scene, 6.2, 0.6, 0.1, bx, 6.3, 3, railMat);
    box(scene, 6.2, 0.6, 0.1, bx, 6.3, -3, railMat);
  });

  // Neon accents on cover objects
  const neonColors = [0x00eeff, 0xff0066, 0xffaa00, 0x00ff88];
  covers.forEach(([w, h, , x, , z], i) => {
    const color = neonColors[i % neonColors.length];
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.06, 0.06), neonMat(color));
    strip.position.set(x, h + 0.03, z);
    scene.add(strip);
    const l = new THREE.PointLight(color, 1, 6);
    l.position.set(x, h + 0.5, z);
    scene.add(l);
  });

  // Spawn zone markers
  const spawnMat = neonMat(0x00ff88);
  [-32, 32].forEach(sz => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.1, 8, 32), spawnMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.05, sz);
    scene.add(ring);
  });

  // Street lights
  for (let i = -3; i <= 3; i++) {
    const px = i * 12;
    const pole = box(scene, 0.2, 8, 0.2, px, 4, -35, metalMat(0x223344));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.4), neonMat(0xaaddff));
    bulb.position.set(px, 8.2, -35);
    scene.add(bulb);
    const l = new THREE.PointLight(0x88aaff, 2, 18);
    l.position.set(px, 8, -35);
    scene.add(l);

    const bulb2 = new THREE.Mesh(new THREE.SphereGeometry(0.4), neonMat(0xaaddff));
    bulb2.position.set(px, 8.2, 35);
    scene.add(bulb2);
    const l2 = new THREE.PointLight(0x88aaff, 2, 18);
    l2.position.set(px, 8, 35);
    scene.add(l2);
  }

  // Overhead spotlights
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const sl = new THREE.SpotLight(0x6699ff, 1.5, 40, Math.PI / 6, 0.5);
      sl.position.set(i * 16, 20, j * 16);
      sl.target.position.set(i * 16, 0, j * 16);
      scene.add(sl);
      scene.add(sl.target);
    }
  }

  scene.add(new THREE.AmbientLight(0x050a18, 1.5));
  const dir = new THREE.DirectionalLight(0x3355aa, 0.8);
  dir.position.set(20, 40, 20);
  dir.castShadow = true;
  scene.add(dir);

  return {
    spawnPoints: [
      new THREE.Vector3(-10, 1, -32),
      new THREE.Vector3(0, 1, -32),
      new THREE.Vector3(10, 1, -32),
      new THREE.Vector3(-5, 1, -28),
      new THREE.Vector3(5, 1, -28),
    ],
    coverPoints,
  };
}

export function buildMenuBackground(scene: THREE.Scene) {
  scene.fog = new THREE.FogExp2(0x000a1a, 0.012);
  scene.background = new THREE.Color(0x000a1a);

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x080f1a, metalness: 0.95, roughness: 0.1 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 40, 40), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid
  for (let i = -50; i <= 50; i += 4) {
    addNeonStrip(scene, new THREE.Vector3(i, 0.02, -50), new THREE.Vector3(i, 0.02, 50), 0x001144);
    addNeonStrip(scene, new THREE.Vector3(-50, 0.02, i), new THREE.Vector3(50, 0.02, i), 0x001144);
  }

  // Buildings
  const bldgConfigs = [
    [4, 20, 4, -15, 10, -20, 0x001133, 0x0066ff],
    [6, 30, 6, 20, 15, -25, 0x001133, 0x00ffaa],
    [5, 15, 5, -25, 7.5, -15, 0x001133, 0xff0066],
    [3, 25, 3, 15, 12.5, -18, 0x001133, 0x00eeff],
    [8, 12, 8, 30, 6, -30, 0x001133, 0xff6600],
    [4, 35, 4, -30, 17.5, -30, 0x001133, 0xaa00ff],
    [10, 8, 5, -5, 4, -25, 0x001133, 0x00aaff],
    [3, 18, 3, 5, 9, -22, 0x001133, 0xff2288],
  ];

  bldgConfigs.forEach(([w, h, d, x, y, z, color, neon]) => {
    box(scene, w as number, h as number, d as number, x as number, y as number, z as number, metalMat(color as number));
    const bl = new THREE.PointLight(neon as number, 1.5, 15);
    bl.position.set(x as number, (y as number) + 1, z as number);
    scene.add(bl);
    const glow = new THREE.Mesh(new THREE.BoxGeometry((w as number) + 0.1, 0.08, (d as number) + 0.1), neonMat(neon as number));
    glow.position.set(x as number, (h as number) + 0.04, z as number);
    scene.add(glow);
  });

  // Floating orbs
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = 20 + Math.random() * 15;
    const ox = Math.cos(angle) * r;
    const oz = -20 + Math.sin(angle) * r;
    const color = [0x00eeff, 0xff0066, 0x00ff88, 0xaa00ff][i % 4];
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), neonMat(color));
    orb.position.set(ox, 5 + Math.random() * 10, oz);
    scene.add(orb);
    const ol = new THREE.PointLight(color, 1, 8);
    ol.position.copy(orb.position);
    scene.add(ol);
  }

  scene.add(new THREE.AmbientLight(0x020810, 1));
  const dir = new THREE.DirectionalLight(0x2244aa, 0.4);
  dir.position.set(10, 30, 10);
  scene.add(dir);
}
