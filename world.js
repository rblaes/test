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
const UP_STEPS = 3;
const DOWN_STEPS = 4;
// Every route chunk has the same length and returns to street height at its end,
// but receives a fresh randomized layout when generated and whenever recycled.
const CHUNK_STEPS = 420;
export const ROUTE_LENGTH = CHUNK_STEPS * STEP_WIDTH;
export const ROUTE_SPACING = ROUTE_LENGTH;
export const CLOUD_LEVEL = ROAD_Y + 14 * STEP_RISE;
export const SEWER_LEVEL = ROAD_Y - 18 * STEP_RISE;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const themeAtLevel = (level) => {
  const y = ROAD_Y + level * STEP_RISE;
  if (y < ROAD_Y - 0.05) return 'sewer';
  if (y >= CLOUD_LEVEL - 0.5) return 'clouds';
  if (y >= 2.2) return 'rooftop';
  return 'street';
};

function generatePattern() {
  const pattern = [];
  let remaining = CHUNK_STEPS;
  let level = 0;

  function addPlatform(count) {
    const theme = themeAtLevel(level);
    let left = count;
    while (left > 0) {
      // Sewer runs get occasional real gaps, with variable spacing and widths.
      if (theme === 'sewer' && left >= 18 && Math.random() < 0.24) {
        const safeRun = Math.min(left - 4, randomInt(9, 23));
        pattern.push({ type: 'platform', count: safeRun, theme });
        left -= safeRun;
        const gap = Math.min(left, randomInt(3, 5));
        if (gap > 0) {
          pattern.push({ type: 'hole', count: gap, theme });
          left -= gap;
        }
      } else {
        const run = Math.min(left, randomInt(12, 42));
        pattern.push({ type: 'platform', count: run, theme });
        left -= run;
      }
    }
  }

  while (remaining > Math.abs(level) + 20) {
    // Keep a minimum viable return staircase in reserve so chunks join seamlessly.
    const maxFlat = remaining - Math.abs(level) - 1;
    const flat = Math.min(maxFlat, randomInt(20, 58));
    if (flat > 0) {
      addPlatform(flat);
      remaining -= flat;
    }

    if (remaining <= Math.abs(level) + 24 || Math.random() > 0.62) continue;
    const target = randomInt(-18, 19);
    const riseCount = Math.abs(target - level);
    if (target === level || remaining - riseCount < Math.abs(target) + 20) continue;
    pattern.push({ type: 'stairs', count: riseCount, direction: Math.sign(target - level) });
    remaining -= riseCount;
    level = target;
  }

  // Return each chunk to street level; the remaining budget was reserved above.
  if (level !== 0) {
    const returnCount = Math.abs(level);
    pattern.push({ type: 'stairs', count: returnCount, direction: -Math.sign(level) });
    remaining -= returnCount;
    level = 0;
  }
  if (remaining > 0) addPlatform(remaining);
  return pattern;
}

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
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
}

function populateRoute(route) {
  // Route meshes share unit geometry and palette materials, so old instances can be
  // removed and replaced without allocating or disposing shared resources.
  route.group.clear();
  const pattern = generatePattern();
  const supportStreet = [], supportSewer = [], topRoad = [], topStairs = [], topSewer = [], edges = [], pits = [], surfaces = [];
  let cursor = 0;
  let level = 0;
  for (const segment of pattern) {
    for (let i = 0; i < segment.count; i += 1) {
      if (segment.type === 'stairs') level += segment.direction * STEP_RISE;
      const top = ROAD_Y + level;
      const x = cursor + STEP_WIDTH / 2;
      const theme = segment.theme || themeAtLevel(level);
      if (segment.type === 'hole') {
        pits.push({ x, y: top - 4.2, z: -3.3, w: STEP_WIDTH + 0.02, h: 0.1, d: 1.4 });
        edges.push({ x, y: top + 0.02, z: -0.15, w: STEP_WIDTH + 0.02, h: 0.035, d: 0.06 });
        surfaces.push({ start: cursor, end: cursor + STEP_WIDTH, height: top, type: 'hole', theme });
        cursor += STEP_WIDTH;
        continue;
      }
      const lower = Math.min(ROAD_Y, top);
      const fillH = Math.max(0.06, Math.abs(top - ROAD_Y));
      const underground = theme === 'sewer';
      if (underground) {
        // Sparse translucent piers remain behind the runner; open space stays visible.
        if (segment.type === 'platform' && i % 4 === 1) {
          supportSewer.push({ x, y: (lower + Math.max(ROAD_Y, top)) / 2, z: -4.25, w: 0.2, h: fillH, d: 0.42 });
        }
      } else {
        supportStreet.push({ x, y: (lower + Math.max(ROAD_Y, top)) / 2, z: -3.5, w: STEP_WIDTH + 0.025, h: fillH, d: 2.8 });
      }
      const routeTop = underground ? topSewer : segment.type === 'stairs' ? topStairs : topRoad;
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

  const arches = [];
  for (let i = 0; i < surfaces.length; i += 1) {
    const surface = surfaces[i];
    if (surface.theme !== 'sewer' || surface.type !== 'platform' || i % 16 !== 2) continue;
    arches.push({ x: surface.start, y: surface.height + 2.5, z: -4.6, w: 0.12, h: 5, d: 0.12 });
  }
  addInstances(route.group, materials.stair, supportStreet);
  addInstances(route.group, materials.sewerSupport, supportSewer);
  addInstances(route.group, materials.road, topRoad);
  addInstances(route.group, materials.stairTop, topStairs);
  addInstances(route.group, materials.sewerDeck, topSewer);
  addInstances(route.group, materials.stairEdge, edges);
  addInstances(route.group, materials.sewerSupport, arches);
  addInstances(route.group, materials.pit, pits);
  route.surfaces = surfaces;
}

function makeRoute(scene, startX) {
  const route = { group: new THREE.Group(), surfaces: [] };
  route.group.position.x = startX;
  scene.add(route.group);
  populateRoute(route);
  return route;
}

export function createWorld(scene) {
  const sky = new THREE.Color(0x07111e);
  const sewerSky = new THREE.Color(0x071a1a);
  scene.background = sky.clone();
  scene.fog = new THREE.Fog(sky, 22, 65);
  scene.add(new THREE.HemisphereLight(0xb9d8ff, 0x22131a, 2));
  const moonLight = new THREE.DirectionalLight(0xb8d9ff, 2.3);
  moonLight.position.set(-5, 12, 12);
  scene.add(moonLight);
  const sewerLight = new THREE.PointLight(0x35d5b0, 0, 24, 2);
  sewerLight.position.set(-3, 0, 4);
  scene.add(sewerLight);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.05, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffdca1 }));
  moon.position.set(7.4, 8.35, -10);
  scene.add(moon);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.035, 8, 48), new THREE.MeshBasicMaterial({ color: 0xe9a75b, transparent: true, opacity: 0.45 }));
  halo.position.copy(moon.position);
  scene.add(halo);
  const stars = [];
  for (let i = 0; i < 145; i += 1) stars.push(-42 + Math.random() * 84, 3 + Math.random() * 12, -12);
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xd8e9ff, size: 0.075 })));
  box(scene, 800, 0.6, 3.6, materials.road, 300, -0.3, -3.6);
  const laneMarkers = [];
  for (let i = 0; i < 24; i += 1) laneMarkers.push(box(scene, 2.2, 0.08, 0.05, materials.white, -22 + i * 4.8, 0.23, -0.8));
  const buildings = [];
  const colors = [0x182338, 0x20243a, 0x25212b, 0x152a39];
  for (let i = 0; i < 14; i += 1) {
    const building = new THREE.Group();
    const w = 3.7 + Math.random() * 2.7;
    const h = 5 + Math.random() * 9;
    const d = 1.5 + Math.random() * 2;
    box(building, w, h, d, mat(colors[i % colors.length]), 0, h / 2 + 0.3, -5.2);
    const facade = -5.2 + d / 2 + 0.04;
    for (let row = 0; row < Math.floor(h / 1.45); row += 1) {
      for (let col = 0; col < Math.max(2, Math.floor(w / 1.15)); col += 1) {
        if (Math.random() < 0.56) box(building, 0.4, 0.55, 0.035, Math.random() > 0.25 ? materials.window : materials.glow,
          -w / 2 + 0.58 + col * 1.05, 1.2 + row * 1.35, facade);
      }
    }
    building.position.x = -28 + i * 10;
    scene.add(building);
    buildings.push(building);
  }
  const cloudGroups = [];
  const cloudMaterials = [];
  for (let i = 0; i < 9; i += 1) {
    const cloud = new THREE.Group();
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xb8cee0, roughness: 1, transparent: true, opacity: 0, depthWrite: false });
    cloudMaterials.push(cloudMaterial);
    for (const [x, y, radius] of [[0, 0, 1.1], [0.85, 0.08, 0.8], [-0.8, 0.04, 0.72], [0.25, 0.48, 0.68]]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), cloudMaterial);
      puff.position.set(x, y, 0);
      cloud.add(puff);
    }
    cloud.position.set(-30 + i * 13, CLOUD_LEVEL + 2.8, -7.5);
    scene.add(cloud);
    cloudGroups.push(cloud);
  }

  const routes = [];
  for (let i = 0; i < 4; i += 1) routes.push(makeRoute(scene, 17 + i * ROUTE_SPACING));
  function terrainAt(x) {
    for (const route of routes) {
      const local = x - route.group.position.x;
      if (local >= 0 && local < ROUTE_LENGTH) {
        return route.surfaces[Math.min(route.surfaces.length - 1, Math.floor(local / STEP_WIDTH))];
      }
    }
    return { height: ROAD_Y, type: 'road', theme: 'street' };
  }
  function update(delta, height, travel) {
    for (const marker of laneMarkers) {
      marker.position.x -= travel;
      if (marker.position.x < -24) marker.position.x += 115.2;
    }
    for (const building of buildings) {
      building.position.x -= travel * 0.23;
      if (building.position.x < -32) building.position.x += 140;
    }
    const cloudFade = THREE.MathUtils.smoothstep(height, CLOUD_LEVEL - 4.2, CLOUD_LEVEL - 0.4);
    for (let i = 0; i < cloudGroups.length; i += 1) {
      const cloud = cloudGroups[i];
      cloud.position.x -= travel * 0.16;
      if (cloud.position.x < -38) cloud.position.x += 117;
      cloud.visible = cloudFade > 0.005;
      cloudMaterials[i].opacity = cloudFade * 0.62;
    }
    for (const route of routes) {
      route.group.position.x -= travel;
      if (route.group.position.x + ROUTE_LENGTH < -5.3) {
        route.group.position.x += ROUTE_SPACING * routes.length;
        // Generate a new independent terrain chunk instead of replaying a fixed course.
        populateRoute(route);
      }
    }
    const theme = height < ROAD_Y - 0.05 ? 'sewer' : height >= CLOUD_LEVEL - 0.5 ? 'clouds' : height >= 2.2 ? 'rooftop' : 'street';
    scene.background.lerp(theme === 'sewer' ? sewerSky : sky, Math.min(1, delta * 1.5));
    scene.fog.color.copy(scene.background);
    scene.fog.near = theme === 'sewer' ? 16 : 22;
    scene.fog.far = theme === 'sewer' ? 52 : 65;
    sewerLight.position.y = height + 2.8;
    sewerLight.intensity = THREE.MathUtils.damp(sewerLight.intensity, theme === 'sewer' ? 8 : 0, 3, delta);
    moonLight.intensity = theme === 'clouds' ? 1.2 : 2.3;
    return theme;
  }
  return { routes, laneMarkers, buildings, cloudGroups, terrainAt, update, moonLight, sewerLight };
}
