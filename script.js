import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040816);
scene.fog = new THREE.Fog(0x040816, 12, 30);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 17);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x7bdff2, 1.8, 60, 2);
pointLight.position.set(0, 4, 14);
scene.add(pointLight);

const rimLight = new THREE.PointLight(0x8d7dff, 1.3, 50, 2);
rimLight.position.set(-10, -5, 8);
scene.add(rimLight);

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(18, 11, 1.2),
  new THREE.MeshStandardMaterial({
    color: 0x0b1020,
    emissive: 0x0a1738,
    metalness: 0.45,
    roughness: 0.4,
  })
);
ground.position.set(0, -0.2, -2.5);
scene.add(ground);

const topGlow = new THREE.Mesh(
  new THREE.BoxGeometry(18, 0.2, 0.6),
  new THREE.MeshStandardMaterial({ color: 0x71d7ff, emissive: 0x71d7ff, emissiveIntensity: 0.6 })
);
topGlow.position.set(0, 5.6, -1.5);
scene.add(topGlow);

const leftWall = new THREE.Mesh(
  new THREE.BoxGeometry(0.4, 10.5, 1.5),
  new THREE.MeshStandardMaterial({ color: 0x111c33, emissive: 0x11203d, metalness: 0.5, roughness: 0.4 })
);
leftWall.position.set(-8.0, 0, -1.8);
scene.add(leftWall);

const rightWall = leftWall.clone();
rightWall.position.x = 8.0;
scene.add(rightWall);

const paddleMaterial = new THREE.MeshStandardMaterial({
  color: 0x7dd3fc,
  emissive: 0x195a80,
  metalness: 0.6,
  roughness: 0.4,
});

const paddle = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.5, 1.2), paddleMaterial);
paddle.position.set(0, -4.8, 0);
scene.add(paddle);

const ballMaterial = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  emissive: 0xffffff,
  emissiveIntensity: 0.3,
  metalness: 0.15,
  roughness: 0.3,
});

const ball = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 32), ballMaterial);
ball.position.set(0, -4.0, 0);
scene.add(ball);

const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const messageElement = document.getElementById('message');

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  KeyA: false,
  KeyD: false,
};

const blocks = [];
let score = 0;
let lives = 3;
let launched = false;
let ballVelocity = new THREE.Vector2(2.5, -2.8);
const blockRows = 5;
const blockCols = 9;
const blockWidth = 1.35;
const blockHeight = 0.55;
const blockGap = 0.25;

function buildBlocks() {
  for (const existing of blocks) {
    scene.remove(existing);
  }
  blocks.length = 0;

  const totalWidth = blockCols * blockWidth + (blockCols - 1) * blockGap;
  const startX = -totalWidth / 2 + blockWidth / 2;
  const startY = 3.8;

  for (let row = 0; row < blockRows; row += 1) {
    for (let col = 0; col < blockCols; col += 1) {
      const color = new THREE.Color().setHSL(0.56 + row * 0.06, 0.7, 0.6 - row * 0.03);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color.clone().multiplyScalar(0.28),
        metalness: 0.2,
        roughness: 0.4,
      });

      const block = new THREE.Mesh(new THREE.BoxGeometry(blockWidth, blockHeight, 1.1), material);
      block.position.set(startX + col * (blockWidth + blockGap), startY - row * (blockHeight + 0.25), 0);
      block.userData.active = true;
      scene.add(block);
      blocks.push(block);
    }
  }
}

function resetBall() {
  launched = false;
  ball.position.set(paddle.position.x, paddle.position.y + 0.6, 0);
  ballVelocity.set(Math.random() > 0.5 ? 2.5 : -2.5, -2.8);
  messageElement.innerHTML = '<h1>Blockout 3D</h1><p>Press Space to launch the ball</p>';
  messageElement.style.display = 'block';
}

function loseLife() {
  lives -= 1;
  livesElement.textContent = String(lives);

  if (lives <= 0) {
    messageElement.innerHTML = '<h1>Game Over</h1><p>Press Space to restart</p>';
    messageElement.style.display = 'block';
    launched = false;
    score = 0;
    scoreElement.textContent = '0';
    lives = 3;
    livesElement.textContent = '3';
    buildBlocks();
    resetBall();
    return;
  }

  resetBall();
}

function handleBallBlockCollision() {
  const ballRadius = 0.25;

  for (const block of blocks) {
    if (!block.userData.active) continue;

    const dx = Math.abs(ball.position.x - block.position.x);
    const dy = Math.abs(ball.position.y - block.position.y);
    const halfX = block.geometry.parameters.width / 2 + ballRadius;
    const halfY = block.geometry.parameters.height / 2 + ballRadius;

    if (dx <= halfX && dy <= halfY) {
      block.userData.active = false;
      scene.remove(block);
      score += 10;
      scoreElement.textContent = String(score);

      const overlapX = halfX - dx;
      const overlapY = halfY - dy;

      if (overlapX < overlapY) {
        ballVelocity.x *= -1;
      } else {
        ballVelocity.y *= -1;
      }

      if (blocks.every((item) => !item.userData.active)) {
        buildBlocks();
        score += 50;
        scoreElement.textContent = String(score);
        resetBall();
      }
      return;
    }
  }
}

function updatePaddle(delta) {
  const moveSpeed = 7.5;
  let direction = 0;

  if (keys.ArrowLeft || keys.KeyA) direction -= 1;
  if (keys.ArrowRight || keys.KeyD) direction += 1;

  paddle.position.x += direction * moveSpeed * delta;
  paddle.position.x = THREE.MathUtils.clamp(paddle.position.x, -6.5, 6.5);

  if (!launched) {
    ball.position.x = paddle.position.x;
  }
}

function updateBall(delta) {
  if (!launched) return;

  ball.position.x += ballVelocity.x * 4.4 * delta;
  ball.position.y += ballVelocity.y * 4.4 * delta;

  if (ball.position.x <= -7.2 || ball.position.x >= 7.2) {
    ballVelocity.x *= -1;
    ball.position.x = THREE.MathUtils.clamp(ball.position.x, -7.0, 7.0);
  }

  if (ball.position.y >= 5.1) {
    ballVelocity.y *= -1;
    ball.position.y = 5.1;
  }

  const paddleHalf = 1.35;
  const paddleTop = paddle.position.y + 0.25;
  const paddleBottom = paddle.position.y - 0.25;
  const paddleLeft = paddle.position.x - paddleHalf;
  const paddleRight = paddle.position.x + paddleHalf;

  if (
    ball.position.y <= paddleTop &&
    ball.position.y >= paddleBottom &&
    ball.position.x >= paddleLeft &&
    ball.position.x <= paddleRight &&
    ballVelocity.y < 0
  ) {
    const hitRatio = (ball.position.x - paddle.position.x) / paddleHalf;
    ballVelocity.x = hitRatio * 3.2;
    ballVelocity.y = Math.abs(ballVelocity.y) + 0.35;
    ball.position.y = paddleTop + 0.1;
  }

  if (ball.position.y < -6.0) {
    loseLife();
    return;
  }

  handleBallBlockCollision();
}

window.addEventListener('keydown', (event) => {
  if (event.code in keys) {
    keys[event.code] = true;
  }

  if (event.code === 'Space') {
    if (!launched) {
      launched = true;
      messageElement.style.display = 'none';
      const direction = new THREE.Vector2(1, -1).normalize();
      ballVelocity.x = direction.x * (2.4 + Math.random() * 1.0);
      ballVelocity.y = direction.y * (2.8 + Math.random() * 0.8);
    }
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code in keys) {
    keys[event.code] = false;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

buildBlocks();
resetBall();

const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  updatePaddle(delta);
  updateBall(delta);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
