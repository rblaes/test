import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { box, cylinder, materials } from './world.js';

function disposeObject(object) {
  if (!object || typeof object.traverse !== 'function') return;
  object.traverse((child) => {
    if (child.geometry && typeof child.geometry.dispose === 'function') child.geometry.dispose();
  });
}

export function createHazards(gameScene) {
  if (!gameScene || typeof gameScene.add !== 'function') {
    throw new TypeError('createHazards requires the Three.js scene: call createHazards(scene).');
  }
  const obstacles = [];
  const pickups = [];

  function removeObstacle(index) {
    const obstacle = obstacles[index];
    if (!obstacle) return;
    gameScene.remove(obstacle);
    disposeObject(obstacle);
    obstacles.splice(index, 1);
  }
  function removePickup(index) {
    const pickup = pickups[index];
    if (!pickup) return;
    gameScene.remove(pickup);
    disposeObject(pickup);
    pickups.splice(index, 1);
  }

  function addObstacle(x, floorY, kind, theme) {
    const group = new THREE.Group();
    group.position.set(x, floorY, 3.1);
    group.userData.kind = kind;
    group.userData.floorY = floorY;
    group.userData.checked = false;

    if (kind === 'duck') {
      const color = theme === 'sewer' ? materials.teal : materials.red;
      // Solid parts occupy y .09-.42 and 1.65-2.40; the open ducking passage is the gap.
      group.userData.hitbox = { halfWidth: 0.88, halfDepth: 0.34, minY: 1.55, maxY: 2.48 };
      box(group, 2.15, 0.17, 0.46, materials.black, 0, 2.0, 0);
      box(group, 1.65, 0.42, 0.48, color, 0, 1.72, 0.08);
      box(group, 1.65, 0.24, 0.48, color, 0, 2.28, 0.08);
      for (const side of [-0.52, 0.52]) box(group, 0.12, 1.7, 0.14, materials.black, side, 2.55, 0);
      for (const stripe of [-0.45, -0.15, 0.15, 0.45]) {
        box(group, 0.07, 0.5, 0.04, materials.white, stripe, 1.72, 0.34).rotation.z = -0.4;
      }
    } else if (theme === 'sewer') {
      group.userData.hitbox = { halfWidth: 0.67, halfDepth: 0.36, minY: 0, maxY: 0.94 };
      box(group, 1.25, 0.18, 0.65, materials.black, 0, 0.09, 0);
      const pipe = cylinder(group, 0.34, 0.34, 0.9, materials.sewer, 0, 0.55, 0.05, 10);
      pipe.rotation.z = Math.PI / 2;
      box(group, 0.72, 0.12, 0.4, materials.teal, 0, 0.78, 0.22);
    } else if (theme === 'clouds') {
      group.userData.hitbox = { halfWidth: 0.52, halfDepth: 0.3, minY: 0, maxY: 1.22 };
      box(group, 0.95, 0.14, 0.55, materials.black, 0, 0.07, 0);
      cylinder(group, 0.08, 0.25, 1.05, materials.gold, 0, 0.65, 0, 8);
      box(group, 0.5, 0.1, 0.18, materials.white, 0, 0.7, 0.22);
    } else {
      group.userData.hitbox = { halfWidth: 0.78, halfDepth: 0.38, minY: 0, maxY: 0.98 };
      box(group, 1.5, 0.28, 0.65, materials.concrete, 0, 0.14, 0);
      box(group, 1.35, 0.72, 0.38, materials.white, 0, 0.6, 0.08);
      for (const stripe of [-1, 1]) {
        box(group, 0.2, 0.78, 0.04, materials.red, stripe * 0.37, 0.6, 0.3).rotation.z = stripe * -0.52;
      }
    }
    gameScene.add(group);
    obstacles.push(group);
  }

  function addRecord(x, floorY) {
    const group = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.09, 24), materials.record);
    disc.rotation.x = Math.PI / 2;
    group.add(disc);
    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16), materials.red);
    center.rotation.x = Math.PI / 2;
    group.add(center);
    group.position.set(x, floorY + 1.7, 3.2);
    group.userData.baseY = group.position.y;
    group.userData.phase = Math.random() * Math.PI * 2;
    gameScene.add(group);
    pickups.push(group);
  }

  function clear() {
    for (let i = obstacles.length - 1; i >= 0; i -= 1) removeObstacle(i);
    for (let i = pickups.length - 1; i >= 0; i -= 1) removePickup(i);
  }
  return { obstacles, pickups, addObstacle, addRecord, clear, removeObstacle, removePickup };
}
