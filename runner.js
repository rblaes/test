import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { box, cylinder, materials } from './world.js';

export function createRunner(scene) {
  const runner = new THREE.Group();
  runner.position.set(-5.3, 0.2, 2.7);
  scene.add(runner);
  box(runner, 0.82, 1.05, 0.46, materials.blue, 0, 1.2, 0);
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
  return { runner, leftArm, rightArm, leftLeg, rightLeg };
}
