import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const game = document.querySelector('#game');
const scoreElement = document.querySelector('#score');
const recordsElement = document.querySelector('#records');
const bestElement = document.querySelector('#best');
const overlay = document.querySelector('#overlay');
const overlayTitle = document.querySelector('#overlay-title');
const overlayCopy = document.querySelector('#overlay-copy');
const startButton = document.querySelector('#start-button');
const toast = document.querySelector('#toast');
const duckButton = document.querySelector('#duck-button');

const scene = new THREE.Scene();
const skyColor = new THREE.Color(0x07111e);
const sewerColor = new THREE.Color(0x071a1a);
scene.background = skyColor.clone();
scene.fog = new THREE.Fog(skyColor, 22, 65);
const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 150);
camera.position.set(0, 3.2, 22);
camera.lookAt(0, 3.2, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
game.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xb9d8ff, 0x22131a, 2));
const moonLight = new THREE.DirectionalLight(0xb8d9ff, 2.3);
moonLight.position.set(-5, 12, 12);
scene.add(moonLight);
scene.add(new THREE.PointLight(0xf19b45, 28, 22, 2)).position.set(4, 6, 5);
const sewerLight = new THREE.PointLight(0x35d5b0, 0, 24, 2);
sewerLight.position.set(-3, 0, 4);
scene.add(sewerLight);

const mat = (color, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const materials = {
  road: mat(0x17202b), blue: mat(0x174c91), darkBlue: mat(0x102c50), black: mat(0x10151c),
  skin: mat(0xc9895d), hat: mat(0x080c12), gold: mat(0xe4aa48, 0.36, 0.45), white: mat(0xf1e8d8),
  red: mat(0xc9443b), concrete: mat(0x666d77), window: mat(0x172d43, 0.35, 0.2),
  glow: new THREE.MeshStandardMaterial({ color: 0xf6bd60, emissive: 0x9c5015, emissiveIntensity: 1.4 }),
  record: new THREE.MeshStandardMaterial({ color: 0xd8a64d, metalness: 0.55, roughness: 0.3, emissive: 0x4c2608 }),
  lamp: new THREE.MeshStandardMaterial({ color: 0xffd28a, emissive: 0xff9f38, emissiveIntensity: 2.2 }),
  stair: mat(0x343f50, 0.88), stairTop: mat(0x596273, 0.78), stairEdge: mat(0xb18a5e, 0.62),
  rail: mat(0x252d39, 0.45, 0.55), sewer: mat(0x26494a, 0.75, 0.18), teal: mat(0x38d6bd, 0.35, 0.1),
};
function box(parent, width, height, depth, material, x, y, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
function cylinder(parent, radiusTop, radiusBottom, height, material, x, y, z = 0, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

// Moon, stars, city blocks: distant scenery stays behind the playable route.
const moon = new THREE.Mesh(new THREE.SphereGeometry(1.05, 32, 24), new THREE.MeshBasicMaterial({ color: 0xffdca1 }));
moon.position.set(7.4, 8.35, -10);
scene.add(moon);
const moonHalo = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.035, 8, 64), new THREE.MeshBasicMaterial({ color: 0xe9a75b, transparent: true, opacity: 0.45 }));
moonHalo.position.copy(moon.position);
scene.add(moonHalo);
const starPositions = [];
for (let i = 0; i < 145; i += 1) starPositions.push(-42 + Math.random() * 84, 3 + Math.random() * 12, -12);
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xd8e9ff, size: 0.075, transparent: true, opacity: 0.8 })));

const ROAD_Y = 0.2;
box(scene, 500, 0.6, 12, materials.road, 100, -0.3, 0);
const laneMarkers = [];
for (let i = 0; i < 24; i += 1) {
  const marker = box(scene, 2.2, 0.08, 0.05, materials.white, -22 + i * 4.8, 0.23, 3.8);
  marker.material = marker.material.clone(); marker.material.transparent = true; marker.material.opacity = 0.4;
  laneMarkers.push(marker);
}
const buildings = [];
const buildingColors = [0x182338, 0x20243a, 0x25212b, 0x152a39];
for (let i = 0; i < 14; i += 1) {
  const group = new THREE.Group();
  const width = 3.7 + Math.random() * 2.7;
  const height = 5 + Math.random() * 9;
  const depth = 1.5 + Math.random() * 2;
  box(group, width, height, depth, mat(buildingColors[i % buildingColors.length]), 0, height / 2 + 0.3, -5.2);
  const facadeZ = -5.2 + depth / 2 + 0.04;
  for (let row = 0; row < Math.floor(height / 1.45); row += 1) {
    for (let col = 0; col < Math.max(2, Math.floor(width / 1.15)); col += 1) {
      if (Math.random() > 0.56) continue;
      box(group, 0.4, 0.55, 0.035, Math.random() > 0.25 ? materials.window : materials.glow,
        -width / 2 + 0.58 + col * 1.05, 1.2 + row * 1.35, facadeZ);
    }
  }
  group.position.x = -28 + i * 10;
  scene.add(group); buildings.push(group);
}

// Puffy cloud clusters drift through the high-altitude section.
const cloudGroups = [];
for (let i = 0; i < 9; i += 1) {
  const cloud = new THREE.Group();
  const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xb8cee0, roughness: 1, transparent: true, opacity: 0.7 });
  for (const [x, y, scale] of [[0, 0, 1.1], [0.85, 0.08, 0.8], [-0.8, 0.04, 0.72], [0.25, 0.48, 0.68]]) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(scale, 12, 10), cloudMaterial);
    puff.position.set(x, y, 0); cloud.add(puff);
  }
  cloud.position.set(-30 + i * 13, 9.2 + (i % 3) * 0.8, -7.5);
  scene.add(cloud); cloudGroups.push(cloud);
}

// Route consists of long floors connected by occasional flights (three to four
// flights between long stretches). It rises to rooftops, climbs into clouds,
// returns through town and descends below street level into the sewer.
const routes = [];
const STEP_WIDTH = 0.72;
const STEP_RISE = 0.3;
const ROUTE_PATTERN = [
  { type: 'platform', count: 36, theme: 'street' },
  { type: 'stairs', count: 8, direction: 1 },
  { type: 'platform', count: 42, theme: 'rooftop' },
  { type: 'stairs', count: 8, direction: 1 },
  { type: 'platform', count: 46, theme: 'clouds' },
  { type: 'stairs', count: 8, direction: -1 },
  { type: 'platform', count: 38, theme: 'rooftop' },
  { type: 'stairs', count: 8, direction: -1 },
  { type: 'platform', count: 36, theme: 'street' },
  { type: 'stairs', count: 8, direction: -1 },
  { type: 'platform', count: 42, theme: 'sewer' },
  { type: 'stairs', count: 8, direction: 1 },
  { type: 'platform', count: 30, theme: 'street' },
];
const ROUTE_LENGTH = ROUTE_PATTERN.reduce((sum, segment) => sum + segment.count * STEP_WIDTH, 0);
const ROUTE_SPACING = ROUTE_LENGTH;
const CLOUD_LEVEL = 4.8;
const SEWER_LEVEL = -2.4;
function makeRoute(startX) {
  const group = new THREE.Group();
  const surfaces = [];
  let cursor = 0;
  let level = 0;
  let currentTheme = 'street';
  for (const segment of ROUTE_PATTERN) {
    if (segment.type === 'platform') currentTheme = segment.theme;
    for (let i = 0; i < segment.count; i += 1) {
      if (segment.type === 'stairs') level += segment.direction * STEP_RISE;
      const top = level;
      const x = cursor + STEP_WIDTH / 2;
      const absoluteTop = ROAD_Y + top;
      const material = currentTheme === 'sewer' ? materials.sewer : (segment.type === 'stairs' ? materials.stairTop : materials.road);
      // Make a solid riser/support that ends exactly at the tread, both above and below street level.
      const lower = Math.min(ROAD_Y, absoluteTop);
      const upper = Math.max(ROAD_Y, absoluteTop);
      const bodyHeight = Math.max(0.06, upper - lower);
      box(group, STEP_WIDTH + 0.025, bodyHeight, 5.8, currentTheme === 'sewer' ? materials.sewer : materials.stair,
        x, (lower + upper) / 2, 3.15);
      box(group, STEP_WIDTH + 0.04, 0.075, 5.84, material, x, absoluteTop - 0.0375, 3.15);
      if (segment.type === 'stairs') box(group, STEP_WIDTH + 0.04, 0.045, 0.08, materials.stairEdge, x, absoluteTop + 0.005, 0.2);
      if (currentTheme === 'sewer' && segment.type === 'platform' && i % 4 === 1) {
        // Low teal lights and pipes identify the under-street tunnel without blocking the lane.
        box(group, 0.16, 0.08, 0.12, materials.teal, x, absoluteTop + 0.12, 0.18);
        const pipe = cylinder(group, 0.11, 0.11, STEP_WIDTH * 3.4, materials.rail, x, absoluteTop + 2.9, -1.7, 8);
        pipe.rotation.z = Math.PI / 2;
      }
      surfaces.push({ start: cursor, end: cursor + STEP_WIDTH, height: absoluteTop, type: segment.type, theme: currentTheme });
      cursor += STEP_WIDTH;
    }
  }
  // Rails only border long elevated decks, not the stair flights or running lane.
  for (let i = 0; i < surfaces.length;) {
    const s = surfaces[i];
    let end = i;
    while (end + 1 < surfaces.length && surfaces[end + 1].type === 'platform' && surfaces[end + 1].height === s.height && surfaces[end + 1].theme === s.theme) end += 1;
    if (s.type === 'platform' && s.height > ROAD_Y + 0.3) {
      const length = (end - i + 1) * STEP_WIDTH;
      const center = s.start + length / 2;
      for (const z of [0.2, 6.1]) {
        box(group, length, 0.08, 0.1, materials.rail, center, s.height + 0.5, z);
        for (let x = s.start; x <= s.end + STEP_WIDTH; x += 2.6) box(group, 0.07, 0.5, 0.07, materials.rail, x, s.height + 0.25, z);
      }
    }
    i = end + 1;
  }
  // Sewer tunnel arch pieces: repeated roof and wall segments follow the sewer deck.
  let sewerStart = -1;
  for (let i = 0; i <= surfaces.length; i += 1) {
    const isSewer = i < surfaces.length && surfaces[i].theme === 'sewer' && surfaces[i].type === 'platform';
    if (isSewer && sewerStart < 0) sewerStart = i;
    if ((!isSewer || i === surfaces.length) && sewerStart >= 0) {
      const first = surfaces[sewerStart];
      const last = surfaces[i - 1];
      for (let x = first.start + 2; x < last.end; x += 4.5) {
        box(group, 0.16, 4.6, 0.16, materials.sewer, x, first.height + 2.25, -2.7);
        box(group, 0.16, 4.6, 0.16, materials.sewer, x, first.height + 2.25, 6.2);
        box(group, 0.16, 0.16, 8.9, materials.sewer, x, first.height + 4.5, 1.75);
        box(group, 0.4, 0.12, 0.12, materials.teal, x, first.height + 3.8, 0.15);
      }
      sewerStart = -1;
    }
  }
  group.position.x = startX;
  scene.add(group); routes.push({ group, surfaces });
}
for (let i = 0; i < 4; i += 1) makeRoute(17 + i * ROUTE_SPACING);

// Runner model.
const runner = new THREE.Group();
runner.position.set(-5.3, ROAD_Y, 2.7);
scene.add(runner);
const torso = box(runner, 0.82, 1.05, 0.46, materials.blue, 0, 1.2, 0);
box(runner, 0.08, 0.8, 0.05, materials.white, 0, 1.22, 0.25);
box(runner, 0.12, 0.13, 0.06, materials.gold, 0, 1.22, 0.29);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 12), materials.skin);
head.position.set(0, 2.03, 0.03); runner.add(head);
box(runner, 0.79, 0.13, 0.55, materials.hat, 0, 2.34, 0.03);
box(runner, 0.55, 0.3, 0.46, materials.hat, 0, 2.5, 0.04);
box(runner, 0.59, 0.12, 0.08, materials.black, 0, 2.03, 0.34);
box(runner, 0.24, 0.13, 0.07, materials.white, -0.15, 2.03, 0.39);
box(runner, 0.24, 0.13, 0.07, materials.white, 0.15, 2.03, 0.39);
const leftArm = box(runner, 0.22, 0.72, 0.24, materials.blue, -0.55, 1.27, 0);
const rightArm = box(runner, 0.22, 0.72, 0.24, materials.blue, 0.55, 1.27, 0);
const leftLeg = box(runner, 0.3, 0.68, 0.3, materials.darkBlue, -0.22, 0.35, 0);
const rightLeg = box(runner, 0.3, 0.68, 0.3, materials.darkBlue, 0.22, 0.35, 0);
box(runner, 0.43, 0.16, 0.46, materials.black, -0.22, 0.08, 0.08);
box(runner, 0.43, 0.16, 0.46, materials.black, 0.22, 0.08, 0.08);
cylinder(runner, 0.09, 0.09, 0.68, materials.gold, 0.68, 1.25, 0.1, 10).rotation.z = Math.PI / 2;
cylinder(runner, 0.22, 0.09, 0.26, materials.gold, 1.08, 1.25, 0.1, 10).rotation.z = Math.PI / 2;

const obstacles = [];
const pickups = [];
function obstacleGroup(x, floorY, kind) {
  const group = new THREE.Group();
  group.position.set(x, floorY, 3.1);
  group.userData.kind = kind; group.userData.floorY = floorY; group.userData.checked = false;
  scene.add(group); obstacles.push(group); return group;
}
function makeJumpHazard(x, floorY, theme) {
  const group = obstacleGroup(x, floorY, 'jump');
  if (theme === 'sewer') {
    box(group, 1.25, 0.18, 0.65, materials.black, 0, 0.09, 0);
    const pipe = cylinder(group, 0.34, 0.34, 0.9, materials.sewer, 0, 0.55, 0.05, 10);
    pipe.rotation.z = Math.PI / 2;
    box(group, 0.72, 0.12, 0.4, materials.teal, 0, 0.78, 0.22);
  } else if (theme === 'clouds') {
    box(group, 0.95, 0.14, 0.55, materials.black, 0, 0.07, 0);
    cylinder(group, 0.08, 0.25, 1.05, materials.gold, 0, 0.65, 0, 8);
    box(group, 0.5, 0.1, 0.18, materials.white, 0, 0.7, 0.22);
  } else {
    box(group, 1.5, 0.28, 0.65, materials.concrete, 0, 0.14, 0);
    box(group, 1.35, 0.72, 0.38, materials.white, 0, 0.6, 0.08);
    for (const stripe of [-1, 1]) box(group, 0.2, 0.78, 0.04, materials.red, stripe * 0.37, 0.6, 0.3).rotation.z = stripe * -0.52;
  }
}
function makeDuckHazard(x, floorY, theme) {
  const group = obstacleGroup(x, floorY, 'duck');
  const color = theme === 'sewer' ? materials.teal : materials.red;
  box(group, 2.15, 0.17, 0.46, materials.black, 0, 2.0, 0);
  box(group, 1.65, 0.55, 0.48, color, 0, 1.72, 0.08);
  for (const side of [-0.52, 0.52]) box(group, 0.12, 1.7, 0.14, materials.black, side, 2.55, 0);
  for (const stripe of [-0.45, -0.15, 0.15, 0.45]) box(group, 0.07, 0.5, 0.04, materials.white, stripe, 1.72, 0.34).rotation.z = -0.4;
}
function makeCone(x, floorY, theme) {
  const group = obstacleGroup(x, floorY, 'jump');
  box(group, 0.8, 0.14, 0.65, materials.black, 0, 0.07, 0);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.33, 1.05, 8), theme === 'sewer' ? materials.teal : new THREE.MeshStandardMaterial({ color: 0xed7741, roughness: 0.65 }));
  cone.position.y = 0.64; group.add(cone);
  box(group, 0.39, 0.12, 0.4, materials.white, 0, 0.54, 0.18);
}
function makeRecord(x, floorY, theme) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.09, 24), materials.record);
  disc.rotation.x = Math.PI / 2; group.add(disc);
  const center = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16), theme === 'sewer' ? materials.teal : materials.red);
  center.rotation.x = Math.PI / 2; group.add(center);
  group.position.set(x, floorY + 1.7, 3.2);
  group.userData.baseY = group.position.y; group.userData.phase = Math.random() * Math.PI * 2;
  scene.add(group); pickups.push(group);
}

function terrainAt(worldX) {
  for (const route of routes) {
    const localX = worldX - route.group.position.x;
    if (localX >= 0 && localX < ROUTE_LENGTH) return route.surfaces[Math.min(route.surfaces.length - 1, Math.floor(localX / STEP_WIDTH))];
  }
  return { height: ROAD_Y, type: 'road', theme: 'street' };
}
function findFlatSpawn(startX) {
  // Hazards/collectibles never spawn on stair treads; flat floors can be street,
  // rooftop, cloud deck, or sewer, and each carries its own actual elevation.
  for (let x = startX; x < startX + ROUTE_SPACING * 1.5; x += 0.35) {
    const surface = terrainAt(x);
    if (surface.type === 'platform' || surface.type === 'road') return { x, floorY: surface.height, theme: surface.theme };
  }
  return null;
}
function biomeFor(height) {
  if (height <= SEWER_LEVEL + 0.45) return 'sewer';
  if (height >= CLOUD_LEVEL - 0.35) return 'clouds';
  if (height >= 2.2) return 'rooftop';
  return 'street';
}

let state = 'ready';
let score = 0;
let records = 0;
let best = 0;
try { best = Number(localStorage.getItem('midnightRhythmBest') || 0); } catch { /* Storage can be disabled. */ }
bestElement.textContent = String(best).padStart(5, '0');
let speed = 9;
let spawnClock = 0;
let pickupClock = 1.5;
let obstacleSequence = 0;
let jumpVelocity = 0;
let jumpHeight = 0;
let groundHeight = ROAD_Y;
let grounded = true;
let ducking = false;
let toastTimer = 0;
const clock = new THREE.Clock();
function updateHud() {
  scoreElement.textContent = String(Math.floor(score)).padStart(5, '0');
  recordsElement.textContent = String(records);
  bestElement.textContent = String(best).padStart(5, '0');
}
function jump() {
  if (state !== 'running' || !grounded || ducking) return;
  jumpVelocity = 10.8; grounded = false;
}
function setDucking(value) {
  ducking = Boolean(value && state === 'running');
  if (ducking) { jumpVelocity = 0; jumpHeight = 0; }
  duckButton.classList.toggle('active', ducking);
}
function startGame() {
  score = 0; records = 0; speed = 9; spawnClock = 1.1; pickupClock = 1.8;
  obstacleSequence = 0; jumpVelocity = 0; jumpHeight = 0; groundHeight = ROAD_Y; grounded = true;
  setDucking(false); runner.position.y = ROAD_Y; runner.scale.y = 1;
  for (const obstacle of obstacles) scene.remove(obstacle);
  for (const pickup of pickups) scene.remove(pickup);
  obstacles.length = 0; pickups.length = 0;
  routes.forEach((route, index) => { route.group.position.x = 17 + index * ROUTE_SPACING; });
  state = 'running'; overlay.classList.add('hidden'); updateHud(); clock.getDelta();
}
function endGame() {
  if (state !== 'running') return;
  state = 'over'; setDucking(false); runner.scale.y = 1;
  best = Math.max(best, Math.floor(score));
  try { localStorage.setItem('midnightRhythmBest', String(best)); } catch { /* Storage can be disabled. */ }
  overlayTitle.innerHTML = 'NICE RUN.<br /><em>ONE MORE?</em>';
  overlayCopy.textContent = `You covered ${Math.floor(score)} metres and collected ${records} golden ${records === 1 ? 'record' : 'records'}. The night is still young.`;
  startButton.innerHTML = 'RUN IT BACK <span>→</span>';
  overlay.classList.remove('hidden'); updateHud();
}
function showToast(message) { toast.textContent = message; toast.classList.add('visible'); toastTimer = 1.1; }

startButton.addEventListener('click', startGame);
document.querySelector('#jump-button').addEventListener('pointerdown', (event) => { event.preventDefault(); jump(); });
duckButton.addEventListener('pointerdown', (event) => { event.preventDefault(); duckButton.setPointerCapture(event.pointerId); setDucking(true); });
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) duckButton.addEventListener(name, () => setDucking(false));
renderer.domElement.addEventListener('pointerdown', () => { if (state === 'running') jump(); });
window.addEventListener('keydown', (event) => {
  if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
    event.preventDefault();
    if (state === 'ready' || state === 'over') startGame(); else jump();
  }
  if (['ArrowDown', 'KeyS', 'ShiftLeft', 'ShiftRight'].includes(event.code)) { event.preventDefault(); setDucking(true); }
});
window.addEventListener('keyup', (event) => { if (['ArrowDown', 'KeyS', 'ShiftLeft', 'ShiftRight'].includes(event.code)) setDucking(false); });
window.addEventListener('blur', () => setDucking(false));

function updateBiome(height, delta) {
  const biome = biomeFor(height);
  const target = biome === 'sewer' ? sewerColor : skyColor;
  scene.background.lerp(target, Math.min(1, delta * 1.5));
  scene.fog.color.copy(scene.background);
  scene.fog.near = biome === 'sewer' ? 12 : 22;
  scene.fog.far = biome === 'sewer' ? 42 : 65;
  sewerLight.intensity = THREE.MathUtils.damp(sewerLight.intensity, biome === 'sewer' ? 15 : 0, 3, delta);
  for (const cloud of cloudGroups) {
    const nearCloudAltitude = height > 3.4;
    cloud.visible = nearCloudAltitude;
    cloud.position.y = THREE.MathUtils.damp(cloud.position.y, height + 4.2 + (cloud.position.x % 3) * 0.1, 2, delta);
  }
  return biome;
}
function updateWorld(delta, time) {
  const travel = speed * delta;
  for (const marker of laneMarkers) { marker.position.x -= travel; if (marker.position.x < -24) marker.position.x += 115.2; }
  for (const building of buildings) { building.position.x -= travel * 0.23; if (building.position.x < -32) building.position.x += 140; }
  for (const cloud of cloudGroups) { cloud.position.x -= travel * 0.16; if (cloud.position.x < -38) cloud.position.x += 117; }
  for (const route of routes) {
    route.group.position.x -= travel;
    if (route.group.position.x + ROUTE_LENGTH < runner.position.x) route.group.position.x += ROUTE_SPACING * routes.length;
  }
  const surface = terrainAt(runner.position.x);
  groundHeight = surface.height;
  const biome = updateBiome(groundHeight, delta);

  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i]; obstacle.position.x -= travel;
    if (obstacle.position.x < -13) { scene.remove(obstacle); obstacles.splice(i, 1); continue; }
    if (Math.abs(obstacle.position.x - runner.position.x) < 0.9 && !obstacle.userData.checked) {
      obstacle.userData.checked = true;
      const sameFloor = Math.abs(groundHeight - obstacle.userData.floorY) < 0.25;
      const cleared = obstacle.userData.kind === 'duck' ? ducking : jumpHeight > 0.66;
      if (sameFloor && !cleared) endGame();
    }
  }
  for (let i = pickups.length - 1; i >= 0; i -= 1) {
    const pickup = pickups[i]; pickup.position.x -= travel;
    pickup.rotation.x += delta * 2.2; pickup.rotation.y += delta * 1.7;
    pickup.position.y = pickup.userData.baseY + Math.sin(time * 3 + pickup.userData.phase) * 0.12;
    if (Math.abs(pickup.position.x - runner.position.x) < 0.85 && Math.abs(pickup.position.y - (runner.position.y + 1.5)) < 1.5) {
      scene.remove(pickup); pickups.splice(i, 1); records += 1; score += 100; showToast('♪  +100  GOLD RECORD'); updateHud();
    } else if (pickup.position.x < -13) { scene.remove(pickup); pickups.splice(i, 1); }
  }
  return biome;
}
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;
  if (state === 'running') {
    score += delta * speed * 1.8; speed = Math.min(17, speed + delta * 0.12);
    spawnClock -= delta; pickupClock -= delta;
    if (spawnClock <= 0) {
      const spawn = findFlatSpawn(14 + Math.random() * 3);
      if (spawn) {
        obstacleSequence += 1;
        const theme = spawn.theme || biomeFor(spawn.floorY);
        const duck = obstacleSequence % 3 === 0 || Math.random() < 0.2;
        if (duck) makeDuckHazard(spawn.x, spawn.floorY, theme);
        else if (Math.random() < 0.42) makeCone(spawn.x, spawn.floorY, theme);
        else makeJumpHazard(spawn.x, spawn.floorY, theme);
        spawnClock = Math.max(1.6, 2.2 - speed * 0.025) + Math.random() * 0.65;
      } else spawnClock = 0.4;
    }
    if (pickupClock <= 0) {
      const spawn = findFlatSpawn(15 + Math.random() * 4);
      if (spawn) makeRecord(spawn.x, spawn.floorY, spawn.theme);
      pickupClock = 2.5 + Math.random() * 2;
    }
    if (ducking) {
      runner.scale.y = THREE.MathUtils.lerp(runner.scale.y, 0.55, Math.min(1, delta * 18));
      jumpHeight = 0; jumpVelocity = 0; grounded = true;
    } else {
      runner.scale.y = THREE.MathUtils.lerp(runner.scale.y, 1, Math.min(1, delta * 16));
      if (!grounded || jumpHeight > 0) { jumpVelocity -= 25 * delta; jumpHeight += jumpVelocity * delta; }
      if (jumpHeight <= 0) { jumpHeight = 0; jumpVelocity = 0; grounded = true; }
    }
    const biome = updateWorld(delta, time);
    runner.position.y = groundHeight + jumpHeight;
    const stride = grounded && !ducking ? Math.sin(time * speed * 1.45) : 0.25;
    leftLeg.rotation.z = ducking ? -0.78 : stride * 0.7;
    rightLeg.rotation.z = ducking ? 0.78 : -stride * 0.7;
    leftArm.rotation.z = ducking ? -1.05 : -0.28 - stride * 0.42;
    rightArm.rotation.z = ducking ? 1.05 : 0.28 + stride * 0.42;
    torso.rotation.z = ducking ? 0.18 : grounded ? Math.sin(time * 9) * 0.025 : -0.08;
    const cameraY = 3.2 + (groundHeight - ROAD_Y) * 0.68;
    camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraY, 5, delta);
    camera.lookAt(0, camera.position.y, 0);
    if (biome === 'clouds') moonLight.intensity = 1.2;
    else moonLight.intensity = 2.3;
    updateHud();
  } else {
    runner.position.y = ROAD_Y + Math.abs(Math.sin(time * 2)) * 0.06;
    runner.scale.y = 1; leftArm.rotation.z = -0.3 + Math.sin(time * 2) * 0.08; rightArm.rotation.z = 0.3;
    camera.position.y = 3.2; camera.lookAt(0, 3.2, 0);
    for (const cloud of cloudGroups) cloud.visible = false;
  }
  if (toastTimer > 0 && (toastTimer -= delta) <= 0) toast.classList.remove('visible');
  renderer.render(scene, camera);
}
function resize() {
  const aspect = window.innerWidth / window.innerHeight;
  const viewHeight = 12;
  camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2;
  camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize(); updateHud(); animate();
