import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { createWorld, ROAD_Y, ROUTE_SPACING, CLOUD_LEVEL, SEWER_LEVEL } from './world.js?v=20261107-sewer-visibility';
import { createRunner } from './runner.js';
import { createHazards } from './hazards.js?v=20260620-2';

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
const CAMERA_FOCUS_OFFSET = 3.2;
const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 150);
camera.position.set(0, CAMERA_FOCUS_OFFSET, 22);
camera.lookAt(0, CAMERA_FOCUS_OFFSET, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
game.prepend(renderer.domElement);

const world = createWorld(scene);
const { runner, leftArm, rightArm, leftLeg, rightLeg } = createRunner(scene);
const hazards = createHazards(scene);
const obstacles = hazards.obstacles;
const pickups = hazards.pickups;

let state = 'ready';
let score = 0;
let records = 0;
let best = 0;
try { best = Number(localStorage.getItem('midnightRhythmBest') || 0); } catch { /* Storage can be disabled. */ }
bestElement.textContent = String(best).padStart(5, '0');
let speed = 9;
let spawnClock = 1.1;
let pickupClock = 1.8;
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
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = 1.1;
}
function setDucking(value) {
  ducking = Boolean(value && state === 'running');
  if (ducking) { jumpVelocity = 0; jumpHeight = 0; }
  duckButton.classList.toggle('active', ducking);
}
function jump() {
  if (state !== 'running' || !grounded || ducking) return;
  jumpVelocity = 10.8;
  grounded = false;
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
function startGame() {
  score = 0; records = 0; speed = 9; spawnClock = 1.1; pickupClock = 1.8; obstacleSequence = 0;
  jumpVelocity = 0; jumpHeight = 0; groundHeight = ROAD_Y; grounded = true;
  setDucking(false); runner.position.y = ROAD_Y; runner.scale.y = 1;
  hazards.clear();
  world.routes.forEach((route, index) => { route.group.position.x = 17 + index * ROUTE_SPACING; });
  state = 'running'; overlay.classList.add('hidden'); updateHud(); clock.getDelta();
}
function findFlatSpawn(startX) {
  for (let x = startX; x < startX + ROUTE_SPACING * 1.5; x += 0.35) {
    const surface = world.terrainAt(x);
    if (surface.type === 'platform' || surface.type === 'road') return { x, floorY: surface.height, theme: surface.theme };
  }
  return null;
}
function biomeFor(height) {
  if (height <= SEWER_LEVEL + 0.4) return 'sewer';
  if (height >= CLOUD_LEVEL - 0.5) return 'clouds';
  if (height >= 2.2) return 'rooftop';
  return 'street';
}
function updateWorld(delta, time) {
  const travel = speed * delta;
  const surface = world.terrainAt(runner.position.x);
  groundHeight = surface.height;
  const theme = world.update(delta, groundHeight, travel);

  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i];
    obstacle.position.x -= travel;
    if (obstacle.position.x < -13) { hazards.removeObstacle(i); continue; }
    if (Math.abs(obstacle.position.x - runner.position.x) < 0.9 && !obstacle.userData.checked) {
      obstacle.userData.checked = true;
      const sameFloor = Math.abs(groundHeight - obstacle.userData.floorY) < 0.25;
      const cleared = obstacle.userData.kind === 'duck' ? ducking : jumpHeight > 0.66;
      if (sameFloor && !cleared) endGame();
    }
  }
  for (let i = pickups.length - 1; i >= 0; i -= 1) {
    const pickup = pickups[i];
    pickup.position.x -= travel;
    pickup.rotation.x += delta * 2.2; pickup.rotation.y += delta * 1.7;
    pickup.position.y = pickup.userData.baseY + Math.sin(time * 3 + pickup.userData.phase) * 0.12;
    if (Math.abs(pickup.position.x - runner.position.x) < 0.85 && Math.abs(pickup.position.y - (runner.position.y + 1.5)) < 1.5) {
      hazards.removePickup(i); records += 1; score += 100;
      showToast('♪  +100  GOLD RECORD'); updateHud();
    } else if (pickup.position.x < -13) { hazards.removePickup(i); }
  }
  return theme;
}
function spawnContent() {
  if (spawnClock <= 0) {
    const spawn = findFlatSpawn(14 + Math.random() * 3);
    if (spawn) {
      obstacleSequence += 1;
      const theme = spawn.theme || biomeFor(spawn.floorY);
      const kind = obstacleSequence % 3 === 0 || Math.random() < 0.2 ? 'duck' : 'jump';
      hazards.addObstacle(spawn.x, spawn.floorY, kind, theme);
      spawnClock = Math.max(1.6, 2.2 - speed * 0.025) + Math.random() * 0.65;
    } else spawnClock = 0.4;
  }
  if (pickupClock <= 0) {
    const spawn = findFlatSpawn(15 + Math.random() * 4);
    if (spawn) hazards.addRecord(spawn.x, spawn.floorY);
    pickupClock = 2.5 + Math.random() * 2;
  }
}

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

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;
  if (state === 'running') {
    score += delta * speed * 1.8; speed = Math.min(17, speed + delta * 0.12);
    spawnClock -= delta; pickupClock -= delta; spawnContent();
    if (ducking) {
      runner.scale.y = THREE.MathUtils.lerp(runner.scale.y, 0.55, Math.min(1, delta * 18));
      jumpHeight = 0; jumpVelocity = 0; grounded = true;
    } else {
      runner.scale.y = THREE.MathUtils.lerp(runner.scale.y, 1, Math.min(1, delta * 16));
      if (!grounded || jumpHeight > 0) { jumpVelocity -= 25 * delta; jumpHeight += jumpVelocity * delta; }
      if (jumpHeight <= 0) { jumpHeight = 0; jumpVelocity = 0; grounded = true; }
    }
    const theme = updateWorld(delta, time);
    runner.position.y = groundHeight + jumpHeight;
    const stride = grounded && !ducking ? Math.sin(time * speed * 1.45) : 0.25;
    leftLeg.rotation.z = ducking ? -0.78 : stride * 0.7;
    rightLeg.rotation.z = ducking ? 0.78 : -stride * 0.7;
    leftArm.rotation.z = ducking ? -1.05 : -0.28 - stride * 0.42;
    rightArm.rotation.z = ducking ? 1.05 : 0.28 + stride * 0.42;
    runner.children[0].rotation.z = ducking ? 0.18 : grounded ? Math.sin(time * 9) * 0.025 : -0.08;

    const cameraY = CAMERA_FOCUS_OFFSET + (groundHeight - ROAD_Y);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraY, 8, delta);
    camera.lookAt(0, camera.position.y, 0);
    world.moonLight.intensity = theme === 'clouds' ? 1.2 : 2.3;
    updateHud();
  } else {
    runner.position.y = ROAD_Y + Math.abs(Math.sin(time * 2)) * 0.06;
    runner.scale.y = 1; leftArm.rotation.z = -0.3 + Math.sin(time * 2) * 0.08; rightArm.rotation.z = 0.3;
    camera.position.y = CAMERA_FOCUS_OFFSET; camera.lookAt(0, CAMERA_FOCUS_OFFSET, 0);
    for (const cloud of world.cloudGroups) cloud.visible = false;
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
