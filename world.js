import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const mat = (color, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
export const materials = {
  road: mat(0x17202b), blue: mat(0x174c91), darkBlue: mat(0x102c50), black: mat(0x10151c),
  skin: mat(0xc9895d), hat: mat(0x080c12), gold: mat(0xe4aa48, 0.36, 0.45), white: mat(0xf1e8d8),
  red: mat(0xc9443b), concrete: mat(0x666d77), window: mat(0x172d43, 0.35, 0.2),
  glow: new THREE.MeshStandardMaterial({ color: 0xf6bd60, emissive: 0x9c5015, emissiveIntensity: 1.4 }),
  record: new THREE.MeshStandardMaterial({ color: 0xd8a64d, metalness: 0.55, roughness: 0.3, emissive: 0x4c2608 }),
  stair: mat(0x343f50, 0.88), stairTop: mat(0x596273, 0.78), stairEdge: mat(0xb18a5e, 0.62),
  rail: mat(0x252d39, 0.45, 0.55), sewer: mat(0x26494a, 0.75, 0.18), teal: mat(0x38d6bd, 0.35, 0.1),
};

export function box(parent, width, height, depth, material, x, y, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
export function cylinder(parent, radiusTop, radiusBottom, height, material, x, y, z = 0, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export const ROAD_Y = 0.2;
export const STEP_WIDTH = 0.72;
export const STEP_RISE = 0.3;
const UP_FLIGHTS = 6;
const DOWN_FLIGHTS = 6;
const UP_STEPS_PER_FLIGHT = 3;
const DOWN_STEPS_PER_FLIGHT = 4;
const PLATFORM_TILES = 32;
const ROUTE_PATTERN = [{ type: 'platform', count: PLATFORM_TILES, theme: 'street' }];
for (let i = 0; i < UP_FLIGHTS; i += 1) {
  ROUTE_PATTERN.push({ type: 'stairs', count: UP_STEPS_PER_FLIGHT, direction: 1 });
  const level = (i + 1) * UP_STEPS_PER_FLIGHT * STEP_RISE;
  ROUTE_PATTERN.push({ type: 'platform', count: PLATFORM_TILES, theme: level >= 4.2 ? 'clouds' : level >= 2.1 ? 'rooftop' : 'street' });
}
for (let i = 0; i < DOWN_FLIGHTS; i += 1) {
  ROUTE_PATTERN.push({ type: 'stairs', count: DOWN_STEPS_PER_FLIGHT, direction: -1 });
  const level = UP_FLIGHTS * UP_STEPS_PER_FLIGHT * STEP_RISE - (i + 1) * DOWN_STEPS_PER_FLIGHT * STEP_RISE;
  ROUTE_PATTERN.push({ type: 'platform', count: PLATFORM_TILES, theme: level < 0 ? 'sewer' : level >= 4.2 ? 'clouds' : level >= 2.1 ? 'rooftop' : 'street' });
}
export const ROUTE_LENGTH = ROUTE_PATTERN.reduce((sum, segment) => sum + segment.count * STEP_WIDTH, 0);
export const ROUTE_SPACING = ROUTE_LENGTH;
export const CLOUD_LEVEL = ROAD_Y + UP_FLIGHTS * UP_STEPS_PER_FLIGHT * STEP_RISE;
export const SEWER_LEVEL = ROAD_Y + (UP_FLIGHTS * UP_STEPS_PER_FLIGHT - DOWN_FLIGHTS * DOWN_STEPS_PER_FLIGHT) * STEP_RISE;

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const dummy = new THREE.Object3D();
function instancedBoxes(parent, material, items) {
  if (!items.length) return;
  const mesh = new THREE.InstancedMesh(unitBox, material, items.length);
  mesh.frustumCulled = false;
  items.forEach((item, index) => {
    dummy.position.set(item.x, item.y, item.z);
    dummy.scale.set(item.w, item.h, item.d);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
}

function createRoute(scene, startX) {
  const group = new THREE.Group();
  const supports = { street: [], sewer: [] };
  const tops = { road: [], stair: [], sewer: [] };
  const edges = [];
  const arches = [];
  const surfaces = [];
  let cursor = 0;
  let level = 0;
  let theme = 'street';
  for (const segment of ROUTE_PATTERN) {
    if (segment.type === 'platform') theme = segment.theme;
    for (let i = 0; i < segment.count; i += 1) {
      if (segment.type === 'stairs') level += segment.direction * STEP_RISE;
      const top = ROAD_Y + level;
      const x = cursor + STEP_WIDTH / 2;
      const lower = Math.min(ROAD_Y, top);
      const height = Math.max(0.06, Math.abs(top - ROAD_Y));
      supports[theme === 'sewer' ? 'sewer' : 'street'].push({ x, y: (lower + Math.max(ROAD_Y, top)) / 2, z: 3.15, w: STEP_WIDTH + 0.025, h: height, d: 5.8 });
      const topGroup = theme === 'sewer' ? 'sewer' : segment.type === 'stairs' ? 'stair' : 'road';
      tops[topGroup].push({ x, y: top - 0.0375, z: 3.15, w: STEP_WIDTH + 0.04, h: 0.075, d: 5.84 });
      if (segment.type === 'stairs') edges.push({ x, y: top + 0.005, z: 0.2, w: STEP_WIDTH + 0.04, h: 0.045, d: 0.08 });
      if (theme === 'sewer' && segment.type === 'platform' && i % 4 === 1) {
        edges.push({ x, y: top + 0.12, z: 0.18, w: 0.16, h: 0.08, d: 0.12 });
      }
      surfaces.push({ start: cursor, end: cursor + STEP_WIDTH, height: top, type: segment.type, theme });
      cursor += STEP_WIDTH;
    }
  }
  // Semi-transparent tunnel ribs sit behind the runner. No opaque near-side walls or ceiling cover the play view.
  const sewerArch = new THREE.MeshStandardMaterial({ color: 0x39716d, roughness: 0.9, transparent: true, opacity: 0.22, depthWrite: false });
  for (let i = 0; i < surfaces.length; i += 1) {
    const s = surfaces[i];
    if (s.theme !== 'sewer' || s.type !== 'platform' || i % 10 !== 2) continue;
    const x = s.start;
    arches.push({ x, y: s.height + 2.5, z: -4.4, w: 0.14, h: 5, d: 0.14 });
    arches.push({ x, y: s.height + 5.0, z: -2.0, w: 0.14, h: 0.14, d: 4.8 });
    edges.push({ x, y: s.height + 3.8, z: -1.7, w: 0.35, h: 0.11, d: 0.08 });
  }
  instancedBoxes(group, materials.stair, supports.street);
  instancedBoxes(group, materials.sewer, supports.sewer);
  instancedBoxes(group, materials.road, tops.road);
  instancedBoxes(group, materials.stairTop, tops.stair);
  instancedBoxes(group, materials.sewer, tops.sewer);
  instancedBoxes(group, materials.stairEdge, edges);
  instancedBoxes(group, sewerArch, arches);
  group.position.x = startX;
  scene.add(group);
  return { group, surfaces };
}

export function createWorld(scene) {
  const skyColor = new THREE.Color(0x07111e);
  const sewerColor = new THREE.Color(0x071a1a);
  scene.background = skyColor.clone();
  scene.fog = new THREE.Fog(skyColor, 22, 65);
  scene.add(new THREE.HemisphereLight(0xb9d8ff, 0x22131a, 2));
  const moonLight = new THREE.DirectionalLight(0xb8d9ff, 2.3);
  moonLight.position.set(-5, 12, 12); scene.add(moonLight);
  const sewerLight = new THREE.PointLight(0x35d5b0, 0, 24, 2);
  sewerLight.position.set(-3, 0, 4); scene.add(sewerLight);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.05, 32, 24), new THREE.MeshBasicMaterial({ color: 0xffdca1 }));
  moon.position.set(7.4, 8.35, -10); scene.add(moon);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.035, 8, 64), new THREE.MeshBasicMaterial({ color: 0xe9a75b, transparent: true, opacity: 0.45 }));
  halo.position.copy(moon.position); scene.add(halo);
  const starPositions = [];
  for (let i = 0; i < 145; i += 1) starPositions.push(-42 + Math.random() * 84, 3 + Math.random() * 12, -12);
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xd8e9ff, size: 0.075, transparent: true, opacity: 0.8 })));

  box(scene, 800, 0.6, 12, materials.road, 300, -0.3, 0);
  const laneMarkers = [];
  for (let i = 0; i < 24; i += 1) laneMarkers.push(box(scene, 2.2, 0.08, 0.05, materials.white, -22 + i * 4.8, 0.23, 3.8));
  const buildings = [];
  const colors = [0x182338, 0x20243a, 0x25212b, 0x152a39];
  for (let i = 0; i < 14; i += 1) {
    const group = new THREE.Group();
    const width = 3.7 + Math.random() * 2.7;
    const height = 5 + Math.random() * 9;
    const depth = 1.5 + Math.random() * 2;
    box(group, width, height, depth, mat(colors[i % colors.length]), 0, height / 2 + 0.3, -5.2);
    const facadeZ = -5.2 + depth / 2 + 0.04;
    for (let row = 0; row < Math.floor(height / 1.45); row += 1) {
      for (let col = 0; col < Math.max(2, Math.floor(width / 1.15)); col += 1) {
        if (Math.random() > 0.56) continue;
        box(group, 0.4, 0.55, 0.035, Math.random() > 0.25 ? materials.window : materials.glow,
          -width / 2 + 0.58 + col * 1.05, 1.2 + row * 1.35, facadeZ);
      }
    }
    group.position.x = -28 + i * 10; scene.add(group); buildings.push(group);
  }
  const cloudGroups = [];
  for (let i = 0; i < 9; i += 1) {
    const cloud = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xb8cee0, roughness: 1, transparent: true, opacity: 0.62, depthWrite: false });
    for (const [x, y, size] of [[0, 0, 1.1], [0.85, 0.08, 0.8], [-0.8, 0.04, 0.72], [0.25, 0.48, 0.68]]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), cloudMat);
      puff.position.set(x, y, 0); cloud.add(puff);
    }
    cloud.position.set(-30 + i * 13, 9.2, -7.5); scene.add(cloud); cloudGroups.push(cloud);
  }
  const routes = [];
  for (let i = 0; i < 4; i += 1) routes.push(createRoute(scene, 17 + i * ROUTE_SPACING));
  function terrainAt(worldX) {
    for (const route of routes) {
      const localX = worldX - route.group.position.x;
      if (localX >= 0 && localX < ROUTE_LENGTH) return route.surfaces[Math.min(route.surfaces.length - 1, Math.floor(localX / STEP_WIDTH))];
    }
    return { height: ROAD_Y, type: 'road', theme: 'street' };
  }
  function update(delta, height, travel) {
    for (const marker of laneMarkers) { marker.position.x -= travel; if (marker.position.x < -24) marker.position.x += 115.2; }
    for (const building of buildings) { building.position.x -= travel * 0.23; if (building.position.x < -32) building.position.x += 140; }
    for (const cloud of cloudGroups) {
      cloud.position.x -= travel * 0.16;
      if (cloud.position.x < -38) cloud.position.x += 117;
      cloud.visible = height >= CLOUD_LEVEL - 0.5;
      cloud.position.y = height + 4.2;
    }
    for (const route of routes) {
      route.group.position.x -= travel;
      if (route.group.position.x + ROUTE_LENGTH < -5.3) route.group.position.x += ROUTE_SPACING * routes.length;
    }
    const theme = height <= SEWER_LEVEL + 0.4 ? 'sewer' : height >= CLOUD_LEVEL - 0.5 ? 'clouds' : height >= 2.2 ? 'rooftop' : 'street';
    scene.background.lerp(theme === 'sewer' ? sewerColor : skyColor, Math.min(1, delta * 1.5));
    scene.fog.color.copy(scene.background);
    scene.fog.near = theme === 'sewer' ? 12 : 22;
    scene.fog.far = theme === 'sewer' ? 42 : 65;
    sewerLight.intensity = THREE.MathUtils.damp(sewerLight.intensity, theme === 'sewer' ? 10 : 0, 3, delta);
    moonLight.intensity = theme === 'clouds' ? 1.2 : 2.3;
    return theme;
  }
  return { routes, laneMarkers, buildings, cloudGroups, terrainAt, update, moonLight, sewerLight };
}
