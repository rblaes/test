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
scene.background = new THREE.Color(0x07111e);
scene.fog = new THREE.Fog(0x07111e, 22, 65);
const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 100);
camera.position.set(0, 3.2, 22);
camera.lookAt(0, 3.2, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
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
const signLight = new THREE.PointLight(0xf19b45, 28, 22, 2);
signLight.position.set(4, 6, 5);
scene.add(signLight);

const mat = (color, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const materials = {
  road: mat(0x17202b), curb: mat(0x9b6b42), blue: mat(0x174c91), darkBlue: mat(0x102c50),
  black: mat(0x10151c), skin: mat(0xc9895d), hat: mat(0x080c12), gold: mat(0xe4aa48, 0.36, 0.45),
  white: mat(0xf1e8d8), red: mat(0xc9443b), concrete: mat(0x666d77), window: mat(0x172d43, 0.35, 0.2),
  glow: new THREE.MeshStandardMaterial({ color: 0xf6bd60, emissive: 0x9c5015, emissiveIntensity: 1.4 }),
  record: new THREE.MeshStandardMaterial({ color: 0xd8a64d, metalness: 0.55, roughness: 0.3, emissive: 0x4c2608 }),
  lamp: new THREE.MeshStandardMaterial({ color: 0xffd28a, emissive: 0xff9f38, emissiveIntensity: 2.2 }),
  stair: mat(0x596273, 0.9), stairEdge: mat(0x9b7655, 0.72), rail: mat(0x252d39, 0.45, 0.55),
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

// Moon, halo and stars sit behind all city geometry.
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

// Road and lane markers occupy the middle depth plane.
box(scene, 200, 0.6, 12, materials.road, 0, -0.3, 0);
box(scene, 200, 0.13, 12.15, materials.curb, 0, 0.04, 0);
box(scene, 200, 0.13, 12.2, materials.road, 0, 0.17, 0);
const laneMarkers = [];
for (let i = 0; i < 18; i += 1) {
  const marker = box(scene, 2.2, 0.08, 0.05, materials.white, -22 + i * 4.8, 0.23, 3.8);
  marker.material = marker.material.clone();
  marker.material.transparent = true;
  marker.material.opacity = 0.45;
  laneMarkers.push(marker);
}
const curbLights = [];
for (let i = 0; i < 30; i += 1) {
  curbLights.push(box(scene, 0.42, 0.045, 0.08, i % 2 ? materials.glow : materials.red, -24 + i * 1.7, 0.25, 5.55));
}

// Keep every city piece on the far side of the road.
const CITY_Z = -5.2;
const buildings = [];
const buildingColors = [0x182338, 0x20243a, 0x25212b, 0x152a39];
for (let i = 0; i < 12; i += 1) {
  const group = new THREE.Group();
  const width = 3.7 + Math.random() * 2.7;
  const height = 5 + Math.random() * 9;
  const depth = 1.5 + Math.random() * 2;
  box(group, width, height, depth, mat(buildingColors[i % buildingColors.length]), 0, height / 2 + 0.3, CITY_Z);
  const facadeZ = CITY_Z + depth / 2 + 0.035;
  for (let row = 0; row < Math.floor(height / 1.45); row += 1) {
    for (let col = 0; col < Math.max(2, Math.floor(width / 1.15)); col += 1) {
      if (Math.random() > 0.56) continue;
      const windowMesh = box(group, 0.4, 0.55, 0.035, Math.random() > 0.25 ? materials.window : materials.glow,
        -width / 2 + 0.58 + col * 1.05, 1.2 + row * 1.35, facadeZ);
      windowMesh.material = windowMesh.material.clone();
    }
  }
  if (i % 3 === 1) {
    box(group, width * 0.62, 0.5, 0.12, materials.glow, 0, 2.25, facadeZ + 0.02);
    box(group, width * 0.66, 0.08, 0.15, materials.gold, 0, 1.94, facadeZ + 0.04);
  }
  group.position.x = -24 + i * 9;
  scene.add(group);
  buildings.push(group);
}

// Alternating flights of exterior stairs climb and descend across the skyline.
// Each flight is a row of individual treads with lit nosings and simple handrails.
const staircases = [];
function makeStairFlight(parent, startX, startY, direction, z) {
  const count = 8;
  const treadWidth = 0.48;
  const rise = 0.27;
  const treadDepth = 0.48;
  const firstCenterY = startY + rise / 2;
  for (let i = 0; i < count; i += 1) {
    const y = firstCenterY + (direction * i * rise);
    const step = box(parent, treadWidth, rise, treadDepth, materials.stair,
      startX + i * treadWidth, y, z);
    step.castShadow = false;
    box(parent, treadWidth * 0.92, 0.035, treadDepth + 0.025, materials.stairEdge,
      startX + i * treadWidth, y + rise / 2 + 0.018, z + 0.02);
  }
  // Rails follow the flight angle, one on either side of the steps.
  const length = Math.hypot((count - 1) * treadWidth, (count - 1) * rise);
  const angle = Math.atan2(direction * rise, treadWidth);
  for (const sideZ of [-0.32, 0.32]) {
    const railMesh = box(parent, length + 0.25, 0.07, 0.07, materials.rail,
      startX + (count - 1) * treadWidth / 2, startY + direction * (count - 1) * rise / 2 + 0.72, z + sideZ);
    railMesh.rotation.z = angle;
    for (const postIndex of [0, 3, 6, 7]) {
      const postX = startX + postIndex * treadWidth;
      const postY = startY + direction * postIndex * rise + 0.45;
      box(parent, 0.055, 0.68, 0.055, materials.rail, postX, postY, z + sideZ);
    }
  }
}
for (let i = 0; i < 5; i += 1) {
  const staircase = new THREE.Group();
  const stairZ = CITY_Z + 2.8;
  const baseY = 2.0 + (i % 2) * 0.28;
  // A short landing separates the ascending and descending flights.
  makeStairFlight(staircase, -3.85, baseY, 1, stairZ);
  box(staircase, 0.72, 0.22, 0.58, materials.stair, 0.35, baseY + 2.2, stairZ);
  box(staircase, 0.68, 0.035, 0.62, materials.stairEdge, 0.35, baseY + 2.33, stairZ + 0.02);
  makeStairFlight(staircase, 0.83, baseY + 2.1, -1, stairZ);
  staircase.position.x = -25 + i * 27;
  scene.add(staircase);
  staircases.push(staircase);
}

const streetLamps = [];
for (let i = 0; i < 5; i += 1) {
  const lamp = new THREE.Group();
  cylinder(lamp, 0.07, 0.11, 5.1, materials.black, 0, 2.55, -0.4, 8);
  box(lamp, 0.95, 0.1, 0.12, materials.black, 0.35, 5.1, -0.4);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), materials.lamp);
  bulb.position.set(0.76, 4.98, -0.3);
  lamp.add(bulb);
  lamp.position.set(-20 + i * 11, 0, -1.5);
  scene.add(lamp);
  streetLamps.push(lamp);
}

// Runner is deliberately in front of the road and city layers.
const runner = new THREE.Group();
runner.position.set(-5.3, 0, 2.7);
scene.add(runner);
const torso = box(runner, 0.82, 1.05, 0.46, materials.blue, 0, 1.2, 0);
box(runner, 0.08, 0.8, 0.05, materials.white, 0, 1.22, 0.25);
box(runner, 0.12, 0.13, 0.06, materials.gold, 0, 1.22, 0.29);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 12), materials.skin);
head.position.set(0, 2.03, 0.03);
runner.add(head);
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
function makeBarricade(x) {
  const group = new THREE.Group();
  box(group, 1.5, 0.28, 0.65, materials.concrete, 0, 0.22, 0);
  box(group, 1.35, 0.72, 0.38, materials.white, 0, 0.68, 0.08);
  for (let stripe = -1; stripe <= 1; stripe += 2) {
    const slash = box(group, 0.2, 0.78, 0.04, materials.red, stripe * 0.37, 0.68, 0.3);
    slash.rotation.z = stripe * -0.52;
  }
  group.position.set(x, 0.2, 3.1);
  group.userData.kind = 'jump';
  scene.add(group);
  obstacles.push(group);
}
function makeCone(x) {
  const group = new THREE.Group();
  box(group, 0.8, 0.14, 0.65, materials.black, 0, 0.08, 0);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.33, 1.05, 8), new THREE.MeshStandardMaterial({ color: 0xed7741, roughness: 0.65 }));
  cone.position.y = 0.65;
  group.add(cone);
  box(group, 0.39, 0.12, 0.4, materials.white, 0, 0.55, 0.18);
  group.position.set(x, 0.18, 3.1);
  group.userData.kind = 'jump';
  scene.add(group);
  obstacles.push(group);
}
function makeOverhead(x) {
  const group = new THREE.Group();
  cylinder(group, 0.09, 0.12, 3.65, materials.black, -1.02, 1.82, 0, 8);
  cylinder(group, 0.09, 0.12, 3.65, materials.black, 1.02, 1.82, 0, 8);
  box(group, 2.2, 0.18, 0.52, materials.gold, 0, 3.62, 0.02);
  box(group, 1.58, 0.42, 0.5, materials.red, 0, 1.66, 0.08);
  box(group, 1.36, 0.07, 0.52, materials.white, 0, 1.66, 0.35);
  for (const xMark of [-0.48, -0.16, 0.16, 0.48]) {
    box(group, 0.075, 0.42, 0.04, materials.white, xMark, 1.66, 0.39).rotation.z = -0.42;
  }
  box(group, 0.12, 1.45, 0.14, materials.black, -0.62, 2.67, 0.04);
  box(group, 0.12, 1.45, 0.14, materials.black, 0.62, 2.67, 0.04);
  group.position.set(x, 0, 3.25);
  group.userData.kind = 'duck';
  scene.add(group);
  obstacles.push(group);
}
function makeRecord(x, y = 1.8) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.09, 24), materials.record);
  disc.rotation.x = Math.PI / 2;
  group.add(disc);
  const center = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16), materials.red);
  center.rotation.x = Math.PI / 2;
  group.add(center);
  group.position.set(x, y, 3.2);
  scene.add(group);
  pickups.push(group);
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
  jumpVelocity = 10.8;
  grounded = false;
}
function setDucking(value) {
  ducking = Boolean(value && state === 'running');
  if (ducking) jumpVelocity = 0;
  duckButton.classList.toggle('active', ducking);
}
function startGame() {
  score = 0;
  records = 0;
  speed = 9;
  spawnClock = 1.1;
  pickupClock = 1.8;
  obstacleSequence = 0;
  jumpVelocity = 0;
  grounded = true;
  setDucking(false);
  runner.position.y = 0;
  runner.scale.y = 1;
  for (const obstacle of obstacles) scene.remove(obstacle);
  for (const pickup of pickups) scene.remove(pickup);
  obstacles.length = 0;
  pickups.length = 0;
  state = 'running';
  overlay.classList.add('hidden');
  updateHud();
  clock.getDelta();
}
function endGame() {
  if (state !== 'running') return;
  state = 'over';
  setDucking(false);
  runner.scale.y = 1;
  best = Math.max(best, Math.floor(score));
  try { localStorage.setItem('midnightRhythmBest', String(best)); } catch { /* Storage can be disabled. */ }
  overlayTitle.innerHTML = 'NICE RUN.<br /><em>ONE MORE?</em>';
  overlayCopy.textContent = `You covered ${Math.floor(score)} metres and collected ${records} golden ${records === 1 ? 'record' : 'records'}. The night is still young.`;
  startButton.innerHTML = 'RUN IT BACK <span>→</span>';
  overlay.classList.remove('hidden');
  updateHud();
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = 1.1;
}

startButton.addEventListener('click', startGame);
document.querySelector('#jump-button').addEventListener('pointerdown', (event) => { event.preventDefault(); jump(); });
duckButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  duckButton.setPointerCapture(event.pointerId);
  setDucking(true);
});
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) duckButton.addEventListener(eventName, () => setDucking(false));
renderer.domElement.addEventListener('pointerdown', () => { if (state === 'running') jump(); });
window.addEventListener('keydown', (event) => {
  if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
    event.preventDefault();
    if (state === 'ready' || state === 'over') startGame();
    else jump();
  }
  if (['ArrowDown', 'KeyS', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
    event.preventDefault();
    setDucking(true);
  }
});
window.addEventListener('keyup', (event) => {
  if (['ArrowDown', 'KeyS', 'ShiftLeft', 'ShiftRight'].includes(event.code)) setDucking(false);
});
window.addEventListener('blur', () => setDucking(false));

function updateWorld(delta) {
  const travel = speed * delta;
  for (const marker of laneMarkers) {
    marker.position.x -= travel;
    if (marker.position.x < -24) marker.position.x += 86.4;
  }
  for (const light of curbLights) {
    light.position.x -= travel;
    if (light.position.x < -26) light.position.x += 51;
  }
  for (const building of buildings) {
    building.position.x -= travel * 0.23;
    if (building.position.x < -31) building.position.x += 108;
  }
  for (const staircase of staircases) {
    staircase.position.x -= travel * 0.38;
    if (staircase.position.x < -38) staircase.position.x += 135;
  }
  for (const lamp of streetLamps) {
    lamp.position.x -= travel * 0.7;
    if (lamp.position.x < -25) lamp.position.x += 55;
  }
  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i];
    obstacle.position.x -= travel;
    if (obstacle.position.x < -13) {
      scene.remove(obstacle);
      obstacles.splice(i, 1);
      continue;
    }
    if (Math.abs(obstacle.position.x - runner.position.x) < 0.9) {
      const cleared = obstacle.userData.kind === 'duck' ? ducking : runner.position.y > 0.66;
      if (!cleared) endGame();
    }
  }
  for (let i = pickups.length - 1; i >= 0; i -= 1) {
    const pickup = pickups[i];
    pickup.position.x -= travel;
    pickup.rotation.x += delta * 2.2;
    pickup.rotation.y += delta * 1.7;
    pickup.position.y += Math.sin(performance.now() * 0.003 + i) * delta * 0.3;
    if (Math.abs(pickup.position.x - runner.position.x) < 0.85 && Math.abs(pickup.position.y - (runner.position.y + 1.5)) < 1.5) {
      scene.remove(pickup);
      pickups.splice(i, 1);
      records += 1;
      score += 100;
      showToast('♪  +100  GOLD RECORD');
      updateHud();
    } else if (pickup.position.x < -13) {
      scene.remove(pickup);
      pickups.splice(i, 1);
    }
  }
}
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;
  if (state === 'running') {
    score += delta * speed * 1.8;
    speed = Math.min(17, speed + delta * 0.12);
    spawnClock -= delta;
    pickupClock -= delta;
    if (spawnClock <= 0) {
      const x = 14 + Math.random() * 3;
      obstacleSequence += 1;
      if (obstacleSequence % 3 === 0 || Math.random() < 0.2) makeOverhead(x);
      else if (Math.random() < 0.48) makeCone(x);
      else makeBarricade(x);
      spawnClock = Math.max(1.5, 2.2 - speed * 0.025) + Math.random() * 0.65;
    }
    if (pickupClock <= 0) {
      makeRecord(15 + Math.random() * 4, 1.55 + Math.random() * 1.3);
      pickupClock = 2.5 + Math.random() * 2;
    }
    if (ducking) {
      runner.scale.y = THREE.MathUtils.lerp(runner.scale.y, 0.55, Math.min(1, delta * 18));
      runner.position.y = 0;
      grounded = true;
    } else {
      runner.scale.y = THREE.MathUtils.lerp(runner.scale.y, 1, Math.min(1, delta * 16));
      jumpVelocity -= 25 * delta;
      runner.position.y += jumpVelocity * delta;
      if (runner.position.y <= 0) {
        runner.position.y = 0;
        jumpVelocity = 0;
        grounded = true;
      }
    }
    const stride = grounded && !ducking ? Math.sin(time * speed * 1.45) : 0.25;
    leftLeg.rotation.z = ducking ? -0.78 : stride * 0.7;
    rightLeg.rotation.z = ducking ? 0.78 : -stride * 0.7;
    leftArm.rotation.z = ducking ? -1.05 : -0.28 - stride * 0.42;
    rightArm.rotation.z = ducking ? 1.05 : 0.28 + stride * 0.42;
    torso.rotation.z = ducking ? 0.18 : grounded ? Math.sin(time * 9) * 0.025 : -0.08;
    updateWorld(delta);
    updateHud();
    // Gentle camera lift/drop follows the repeating stair rhythm without affecting collisions.
    const stairMotion = Math.sin(time * 1.15) * 0.2 + Math.sin(time * 0.575) * 0.08;
    camera.position.y = 3.2 + stairMotion;
    camera.lookAt(0, 3.2 + stairMotion, 0);
  } else {
    runner.position.y = Math.abs(Math.sin(time * 2)) * 0.06;
    runner.scale.y = 1;
    leftArm.rotation.z = -0.3 + Math.sin(time * 2) * 0.08;
    rightArm.rotation.z = 0.3;
    camera.position.y = 3.2;
    camera.lookAt(0, 3.2, 0);
  }
  if (toastTimer > 0) {
    toastTimer -= delta;
    if (toastTimer <= 0) toast.classList.remove('visible');
  }
  renderer.render(scene, camera);
}
function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  const viewHeight = 12;
  camera.left = -viewHeight * aspect / 2;
  camera.right = viewHeight * aspect / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
resize();
updateHud();
animate();
