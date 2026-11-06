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

scene.add(new THREE.HemisphereLight(0xb9d8ff, 0x22131a, 2.0));
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

// Road and repeating lane markers give the scene its endless forward motion.
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

// Handmade, low-poly city blocks, lit windows and club signs; no external art assets.
const buildings = [];
const buildingColors = [0x182338, 0x20243a, 0x25212b, 0x152a39];
for (let i = 0; i < 12; i += 1) {
  const group = new THREE.Group();
  const width = 3.7 + Math.random() * 2.7;
  const height = 5 + Math.random() * 9;
  const depth = 1.5 + Math.random() * 2;
  box(group, width, height, depth, mat(buildingColors[i % buildingColors.length]), 0, height / 2 + 0.3, -3.2);
  for (let row = 0; row < Math.floor(height / 1.45); row += 1) {
    for (let col = 0; col < Math.max(2, Math.floor(width / 1.15)); col += 1) {
      if (Math.random() > 0.56) continue;
      const windowMesh = box(group, 0.4, 0.55, 0.035, Math.random() > 0.25 ? materials.window : materials.glow,
        -width / 2 + 0.58 + col * 1.05, 1.2 + row * 1.35, depth / 2 + 0.03);
      windowMesh.material = windowMesh.material.clone();
    }
  }
  if (i % 3 === 1) {
    box(group, width * 0.62, 0.5, 0.12, materials.glow, 0, 2.25, depth / 2 + 0.1);
    box(group, width * 0.66, 0.08, 0.15, materials.gold, 0, 1.94, depth / 2 + 0.12);
  }
  group.position.x = -24 + i * 9;
  scene.add(group);
  buildings.push(group);
}

// The runner is an original, toy-like blues musician, built entirely from geometry.
const runner = new THREE.Group();
runner.position.set(-5.3, 0, 1);
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
leftArm.rotation.z = -0.28;
rightArm.rotation.z = 0.28;
const leftLeg = box(runner, 0.3, 0.68, 0.3, materials.darkBlue, -0.22, 0.35, 0);
const rightLeg = box(runner, 0.3, 0.68, 0.3, materials.darkBlue, 0.22, 0.35, 0);
box(runner, 0.43, 0.16, 0.46, materials.black, -0.22, 0.08, 0.08);
box(runner, 0.43, 0.16, 0.46, materials.black, 0.22, 0.08, 0.08);
// A small brass horn silhouette sits at the musician's side.
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
  group.position.set(x, 0.2, 1.1);
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
  group.position.set(x, 0.18, 1);
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
  group.position.set(x, y, 1);
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
let jumpVelocity = 0;
let grounded = true;
let toastTimer = 0;
const clock = new THREE.Clock();

function updateHud() {
  scoreElement.textContent = String(Math.floor(score)).padStart(5, '0');
  recordsElement.textContent = String(records);
  bestElement.textContent = String(best).padStart(5, '0');
}
function jump() {
  if (state !== 'running' || !grounded) return;
  jumpVelocity = 10.8;
  grounded = false;
}
function startGame() {
  score = 0;
  records = 0;
  speed = 9;
  spawnClock = 1.1;
  pickupClock = 1.8;
  jumpVelocity = 0;
  grounded = true;
  runner.position.y = 0;
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
renderer.domElement.addEventListener('pointerdown', () => { if (state === 'running') jump(); });
window.addEventListener('keydown', (event) => {
  if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
    event.preventDefault();
    if (state === 'ready' || state === 'over') startGame();
    else jump();
  }
});

function updateWorld(delta) {
  const travel = speed * delta;
  for (const marker of laneMarkers) {
    marker.position.x -= travel;
    if (marker.position.x < -24) marker.position.x += 86.4;
  }
  for (const building of buildings) {
    building.position.x -= travel * 0.23;
    if (building.position.x < -31) building.position.x += 108;
  }
  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i];
    obstacle.position.x -= travel;
    if (obstacle.position.x < -13) {
      scene.remove(obstacle);
      obstacles.splice(i, 1);
      continue;
    }
    const dx = Math.abs(obstacle.position.x - runner.position.x);
    if (dx < 0.78 && runner.position.y < 0.66) endGame();
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
      const x = 14 + Math.random() * 5;
      if (Math.random() > 0.42) makeBarricade(x); else makeCone(x);
      if (Math.random() > 0.58) makeCone(x + 2.4);
      spawnClock = Math.max(0.85, 1.75 - speed * 0.035) + Math.random() * 0.7;
    }
    if (pickupClock <= 0) {
      makeRecord(15 + Math.random() * 4, 1.55 + Math.random() * 1.3);
      pickupClock = 2.5 + Math.random() * 2;
    }
    jumpVelocity -= 25 * delta;
    runner.position.y += jumpVelocity * delta;
    if (runner.position.y <= 0) {
      runner.position.y = 0;
      jumpVelocity = 0;
      grounded = true;
    }
    const stride = grounded ? Math.sin(time * speed * 1.45) : 0.25;
    leftLeg.rotation.z = stride * 0.7;
    rightLeg.rotation.z = -stride * 0.7;
    leftArm.rotation.z = -0.28 - stride * 0.42;
    rightArm.rotation.z = 0.28 + stride * 0.42;
    torso.rotation.z = grounded ? Math.sin(time * 9) * 0.025 : -0.08;
    updateWorld(delta);
    updateHud();
  } else {
    runner.position.y = Math.abs(Math.sin(time * 2)) * 0.06;
    leftArm.rotation.z = -0.3 + Math.sin(time * 2) * 0.08;
    rightArm.rotation.z = 0.3;
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
