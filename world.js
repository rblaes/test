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
const ROUTE_PATTERN = [
  { type: 'platform', count: 32, theme: 'street' },
  { type: 'stairs', count: 8, direction: 1 },
  { type: 'platform', count: 44, theme: 'rooftop' },
  { type: 'stairs', count: 8, direction: 1 },
  { type: 'platform', count: 50, theme: 'clouds' },
  { type: 'stairs', count: 16, direction: -1 },
  { type: 'platform', count: 36, theme: 'street' },
  { type: 'stairs', count: 8, direction: -1 },
  { type: 'platform', count: 48, theme: 'sewer' },
  { type: 'stairs', count: 8, direction: 1 },
  { type: 'platform', count: 34, theme: 'street' },
];
export const ROUTE_LENGTH = ROUTE_PATTERN.reduce((sum, segment) => sum + segment.count * STEP_WIDTH, 0);
export const ROUTE_SPACING = ROUTE_LENGTH;
export const CLOUD_LEVEL = ROAD_Y + 16 * STEP_RISE;
export const SEWER_LEVEL = ROAD_Y - 8 * STEP_RISE;

function createRoute(scene, startX) {
  const group = new THREE.Group();
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
      box(group, STEP_WIDTH + 0.025, height, 5.8, theme === 'sewer' ? materials.sewer : materials.stair,
        x, (lower + Math.max(ROAD_Y, top)) / 2, 3.15);
      box(group, STEP_WIDTH + 0.04, 0.075, 5.84,
        theme === 'sewer' ? materials.sewer : segment.type === 'stairs' ? materials.stairTop : materials.road,
        x, top - 0.0375, 3.15);
      if (segment.type === 'stairs') box(group, STEP_WIDTH + 0.04, 0.045, 0.08, materials.stairEdge, x, top + 0.005, 0.2);
      if (theme === 'sewer' && segment.type === 'platform' && i % 4 === 1) {
        box(group, 0.16, 0.08, 0.12, materials.teal, x, top + 0.12, 0.18);
        const pipe = cylinder(group, 0.11, 0.11, STEP_WIDTH * 3.4, materials.rail, x, top + 2.9, -1.7, 8);
        pipe.rotation.z = Math.PI / 2;
      }
      surfaces.push({ start: cursor, end: cursor + STEP_WIDTH, height: top, type: segment.type, theme });
      cursor += STEP_WIDTH;
    }
  }
  for (let i = 0; i < surfaces.length; i += 1) {
    const surface = surfaces[i];
    if (surface.theme !== 'sewer' || surface.type !== 'platform' || i % 7 !== 1) continue;
    const x = surface.start;
    for (const z of [-2.7, 6.2]) box(group, 0.16, 4.6, 0.16, materials.sewer, x, surface.height + 2.25, z);
    box(group, 0.16, 0.16, 8.9, materials.sewer, x, surface.height + 4.5, 1.75);
    box(group, 0.4, 0.12, 0.12, materials.teal, x, surface.height + 3.8, 0.15);
  }
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

  box(scene, 500, 0.6, 12, materials.road, 100, -0.3, 0);
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
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xb8cee0, roughness: 1, transparent: true, opacity: 0.7 });
    for (const [x, y, size] of [[0, 0, 1.1], [0.85, 0.08, 0.8], [-0.8, 0.04, 0.72], [0.25, 0.48, 0.68]]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 10), cloudMat);
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
    sewerLight.intensity = THREE.MathUtils.damp(sewerLight.intensity, theme === 'sewer' ? 15 : 0, 3, delta);
    moonLight.intensity = theme === 'clouds' ? 1.2 : 2.3;
    return theme;
  }
  return { routes, laneMarkers, buildings, cloudGroups, terrainAt, update, moonLight, sewerLight };
}
