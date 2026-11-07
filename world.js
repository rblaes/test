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
  // Sewer structure is deliberately translucent so it reads as a background layer, not a wall.
  sewerSupport: new THREE.MeshStandardMaterial({ color: 0x39716d, roughness: 0.9, transparent: true, opacity: 0.2, depthWrite: false }),
  sewerDeck: new THREE.MeshStandardMaterial({ color: 0x26494a, roughness: 0.75, metalness: 0.18, transparent: true, opacity: 0.2, depthWrite: false }),
  pit: new THREE.MeshStandardMaterial({ color: 0x020609, roughness: 1 }),
};

export function box(parent, width, height, depth, material, x, y, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
export function cylinder(parent, radiusTop, radiusBottom, height, material, x, y, z = 0, segments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}

export const ROAD_Y = 0.2;
export const STEP_WIDTH = 0.72;
export const STEP_RISE = 0.3;
const UP_FLIGHTS = 6;
const DOWN_FLIGHTS = 6;
const UP_STEPS = 3;
const DOWN_STEPS = 4;
const PLATFORM = 32;
const pattern = [{ type: 'platform', count: PLATFORM, theme: 'street' }];
for (let i = 0; i < UP_FLIGHTS; i += 1) {
  pattern.push({ type: 'stairs', count: UP_STEPS, direction: 1 });
  const level = (i + 1) * UP_STEPS * STEP_RISE;
  pattern.push({ type: 'platform', count: PLATFORM, theme: level >= 4.2 ? 'clouds' : level >= 2.1 ? 'rooftop' : 'street' });
}
for (let i = 0; i < DOWN_FLIGHTS; i += 1) {
  pattern.push({ type: 'stairs', count: DOWN_STEPS, direction: -1 });
  const level = UP_FLIGHTS * UP_STEPS * STEP_RISE - (i + 1) * DOWN_STEPS * STEP_RISE;
  const theme = level < 0 ? 'sewer' : level >= 4.2 ? 'clouds' : level >= 2.1 ? 'rooftop' : 'street';
  if (theme === 'sewer') {
    pattern.push({ type: 'platform', count: 13, theme }, { type: 'hole', count: 3, theme },
      { type: 'platform', count: 13, theme }, { type: 'hole', count: 3, theme }, { type: 'platform', count: 16, theme });
  } else pattern.push({ type: 'platform', count: PLATFORM, theme });
}
export const ROUTE_LENGTH = pattern.reduce((sum, item) => sum + item.count * STEP_WIDTH, 0);
export const ROUTE_SPACING = ROUTE_LENGTH;
export const CLOUD_LEVEL = ROAD_Y + UP_FLIGHTS * UP_STEPS * STEP_RISE;
export const SEWER_LEVEL = ROAD_Y + (UP_FLIGHTS * UP_STEPS - DOWN_FLIGHTS * DOWN_STEPS) * STEP_RISE;

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const dummy = new THREE.Object3D();
function addInstances(parent, material, items) {
  if (!items.length) return;
  const mesh = new THREE.InstancedMesh(unitBox, material, items.length);
  mesh.frustumCulled = false;
  items.forEach((v, i) => {
    dummy.position.set(v.x, v.y, v.z); dummy.scale.set(v.w, v.h, v.d); dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true; parent.add(mesh);
}
function makeRoute(scene, startX) {
  const group = new THREE.Group();
  const supportStreet = [], supportSewer = [], topRoad = [], topStairs = [], topSewer = [], edges = [], pits = [], surfaces = [];
  let cursor = 0, level = 0, theme = 'street';
  for (const segment of pattern) {
    if (segment.theme) theme = segment.theme;
    for (let i = 0; i < segment.count; i += 1) {
      if (segment.type === 'stairs') level += segment.direction * STEP_RISE;
      const top = ROAD_Y + level, x = cursor + STEP_WIDTH / 2;
      if (segment.type === 'hole') {
        pits.push({ x, y: top - 4.2, z: -3.3, w: STEP_WIDTH + 0.02, h: 0.1, d: 1.4 });
        edges.push({ x, y: top + 0.02, z: -0.15, w: STEP_WIDTH + 0.02, h: 0.035, d: 0.06 });
        surfaces.push({ start: cursor, end: cursor + STEP_WIDTH, height: top, type: 'hole', theme });
        cursor += STEP_WIDTH; continue;
      }
      const lower = Math.min(ROAD_Y, top), fillH = Math.max(0.06, Math.abs(top - ROAD_Y));
      const underground = theme === 'sewer';
      if (underground) {
        // Sparse piers plus open bays avoid forming a solid obstruction beneath the route.
        if (segment.type === 'platform' && i % 4 === 1) {
          supportSewer.push({ x, y: (lower + Math.max(ROAD_Y, top)) / 2,
            z: -4.25, w: 0.2, h: fillH, d: 0.42 });
        }
      } else {
        supportStreet.push({ x, y: (lower + Math.max(ROAD_Y, top)) / 2,
          z: -3.5, w: STEP_WIDTH + 0.025, h: fillH, d: 2.8 });
      }
      const routeTop = underground ? topSewer : segment.type === 'stairs' ? topStairs : topRoad;
      // Sewer walk deck stays behind the runner; its 20% opacity preserves the route cue
      // while allowing the sewer scenery and hazards behind it to remain visible.
      const depth = underground ? 1.2 : 4.6;
      const centerZ = underground ? -1.4 : -0.25;
      routeTop.push({ x, y: top - 0.0375, z: centerZ, w: STEP_WIDTH + 0.04, h: 0.075, d: depth });
      if (segment.type === 'stairs') edges.push({ x, y: top + 0.005, z: 0.2, w: STEP_WIDTH + 0.04, h: 0.045, d: 0.08 });
      if (underground && segment.type === 'platform' && i % 4 === 1) {
        edges.push({ x, y: top + 0.12, z: -0.55, w: 0.16, h: 0.08, d: 0.12 });
      }
      surfaces.push({ start: cursor, end: cursor + STEP_WIDTH, height: top, type: segment.type, theme });
      cursor += STEP_WIDTH;
    }
  }
  const archMaterial = new THREE.MeshStandardMaterial({ color: 0x39716d, roughness: 0.9, transparent: true, opacity: 0.12, depthWrite: false });
  const arches = [];
  for (let i = 0; i < surfaces.length; i += 1) {
    const s = surfaces[i];
    if (s.theme !== 'sewer' || s.type !== 'platform' || i % 16 !== 2) continue;
    arches.push({ x: s.start, y: s.height + 2.5, z: -4.6, w: 0.12, h: 5, d: 0.12 });
  }
  addInstances(group, materials.stair, supportStreet); addInstances(group, materials.sewerSupport, supportSewer);
  addInstances(group, materials.road, topRoad); addInstances(group, materials.stairTop, topStairs);
  addInstances(group, materials.sewerDeck, topSewer); addInstances(group, materials.stairEdge, edges);
  addInstances(group, archMaterial, arches); addInstances(group, materials.pit, pits);
  group.position.x = startX; scene.add(group); return { group, surfaces };
}

export function createWorld(scene) {
  const sky = new THREE.Color(0x07111e), sewerSky = new THREE.Color(0x071a1a);
  scene.background = sky.clone(); scene.fog = new THREE.Fog(sky, 22, 65);
  scene.add(new THREE.HemisphereLight(0xb9d8ff, 0x22131a, 2));
  const moonLight = new THREE.DirectionalLight(0xb8d9ff, 2.3); moonLight.position.set(-5, 12, 12); scene.add(moonLight);
  const sewerLight = new THREE.PointLight(0x35d5b0, 0, 24, 2); sewerLight.position.set(-3, 0, 4); scene.add(sewerLight);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.05, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffdca1 }));
  moon.position.set(7.4, 8.35, -10); scene.add(moon);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.035, 8, 48), new THREE.MeshBasicMaterial({ color: 0xe9a75b, transparent: true, opacity: 0.45 }));
  halo.position.copy(moon.position); scene.add(halo);
  const stars = [];
  for (let i = 0; i < 145; i += 1) stars.push(-42 + Math.random() * 84, 3 + Math.random() * 12, -12);
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xd8e9ff, size: 0.075 })));
  box(scene, 800, 0.6, 3.6, materials.road, 300, -0.3, -3.6);
  const laneMarkers = [];
  for (let i = 0; i < 24; i += 1) laneMarkers.push(box(scene, 2.2, 0.08, 0.05, materials.white, -22 + i * 4.8, 0.23, -0.8));
  const buildings = [], colors = [0x182338, 0x20243a, 0x25212b, 0x152a39];
  for (let i = 0; i < 14; i += 1) {
    const g = new THREE.Group(), w = 3.7 + Math.random() * 2.7, h = 5 + Math.random() * 9, d = 1.5 + Math.random() * 2;
    box(g, w, h, d, mat(colors[i % colors.length]), 0, h / 2 + 0.3, -5.2);
    const facade = -5.2 + d / 2 + 0.04;
    for (let row = 0; row < Math.floor(h / 1.45); row += 1) for (let col = 0; col < Math.max(2, Math.floor(w / 1.15)); col += 1) {
      if (Math.random() < 0.56) box(g, 0.4, 0.55, 0.035, Math.random() > 0.25 ? materials.window : materials.glow, -w / 2 + 0.58 + col * 1.05, 1.2 + row * 1.35, facade);
    }
    g.position.x = -28 + i * 10; scene.add(g); buildings.push(g);
  }
  const cloudGroups = [], cloudMaterials = [];
  for (let i = 0; i < 9; i += 1) {
    const g = new THREE.Group(), cm = new THREE.MeshStandardMaterial({ color: 0xb8cee0, roughness: 1, transparent: true, opacity: 0, depthWrite: false });
    cloudMaterials.push(cm);
    for (const [x, y, r] of [[0, 0, 1.1], [0.85, 0.08, 0.8], [-0.8, 0.04, 0.72], [0.25, 0.48, 0.68]]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), cm); puff.position.set(x, y, 0); g.add(puff);
    }
    g.position.set(-30 + i * 13, CLOUD_LEVEL + 2.8, -7.5); scene.add(g); cloudGroups.push(g);
  }
  const routes = [];
  for (let i = 0; i < 4; i += 1) routes.push(makeRoute(scene, 17 + i * ROUTE_SPACING));
  function terrainAt(x) {
    for (const route of routes) {
      const local = x - route.group.position.x;
      if (local >= 0 && local < ROUTE_LENGTH) return route.surfaces[Math.min(route.surfaces.length - 1, Math.floor(local / STEP_WIDTH))];
    }
    return { height: ROAD_Y, type: 'road', theme: 'street' };
  }
  function update(delta, height, travel) {
    for (const marker of laneMarkers) { marker.position.x -= travel; if (marker.position.x < -24) marker.position.x += 115.2; }
    for (const g of buildings) { g.position.x -= travel * 0.23; if (g.position.x < -32) g.position.x += 140; }
    const fade = THREE.MathUtils.smoothstep(height, CLOUD_LEVEL - 4.2, CLOUD_LEVEL - 0.4);
    for (let i = 0; i < cloudGroups.length; i += 1) {
      const g = cloudGroups[i]; g.position.x -= travel * 0.16; if (g.position.x < -38) g.position.x += 117;
      g.visible = fade > 0.005; cloudMaterials[i].opacity = fade * 0.62;
    }
    for (const route of routes) { route.group.position.x -= travel; if (route.group.position.x + ROUTE_LENGTH < -5.3) route.group.position.x += ROUTE_SPACING * routes.length; }
    const theme = height <= SEWER_LEVEL + 0.4 ? 'sewer' : height >= CLOUD_LEVEL - 0.5 ? 'clouds' : height >= 2.2 ? 'rooftop' : 'street';
    scene.background.lerp(theme === 'sewer' ? sewerSky : sky, Math.min(1, delta * 1.5)); scene.fog.color.copy(scene.background);
    scene.fog.near = theme === 'sewer' ? 12 : 22; scene.fog.far = theme === 'sewer' ? 42 : 65;
    sewerLight.intensity = THREE.MathUtils.damp(sewerLight.intensity, theme === 'sewer' ? 10 : 0, 3, delta);
    moonLight.intensity = theme === 'clouds' ? 1.2 : 2.3; return theme;
  }
  return { routes, laneMarkers, buildings, cloudGroups, terrainAt, update, moonLight, sewerLight };
}
