import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

const BOARD_WIDTH = 6;
const BOARD_DEPTH = 6;
const BOARD_HEIGHT = 12;
const CELL_SIZE = 1;

const SHAPES = {
  cube: {
    color: 0xffd166,
    cells: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [1, 1, 0]
    ]
  },
  bar: {
    color: 0x5eead4,
    cells: [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0]
    ]
  },
  lshape: {
    color: 0xfb7185,
    cells: [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [0, 1, 0]
    ]
  },
  zig: {
    color: 0xa78bfa,
    cells: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [2, 1, 0]
    ]
  },
  tower: {
    color: 0xfbbf24,
    cells: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 2, 0]
    ]
  },
  corner: {
    color: 0x60a5fa,
    cells: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 2, 0]
    ]
  }
};

const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const statusEl = document.getElementById("status");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");

const canvas = document.getElementById("gameCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth || 640, canvas.clientHeight || 640, false);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08111b);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
camera.position.set(10, 9, 15);
camera.lookAt(0, 0, 0);

const hemiLight = new THREE.HemisphereLight(0xbfe3ff, 0x112233, 1.6);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
dirLight.position.set(9, 13, 7);
scene.add(dirLight);

const ambient = new THREE.AmbientLight(0xb4d0ff, 0.7);
scene.add(ambient);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({
    color: 0x152534,
    emissive: 0x0a1520,
    roughness: 0.92,
    metalness: 0.08
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -8;
scene.add(floor);

const boardFrame = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(BOARD_WIDTH, BOARD_HEIGHT, BOARD_DEPTH)),
  new THREE.LineBasicMaterial({ color: 0x87d3ff, transparent: true, opacity: 0.45 })
);
boardFrame.position.set(0, 0, 0);
scene.add(boardFrame);

const between = new THREE.Group();
scene.add(between);

const state = {
  board: createBoard(),
  current: null,
  score: 0,
  lines: 0,
  level: 1,
  paused: false,
  gameOver: false,
  dropAccumulator: 0,
  visualGroup: null,
  lastTimestamp: 0
};

function createBoard() {
  return Array.from({ length: BOARD_WIDTH }, () =>
    Array.from({ length: BOARD_DEPTH }, () => Array(BOARD_HEIGHT).fill(0))
  );
}

function getDropDelay() {
  return Math.max(120, 720 - (state.level - 1) * 55);
}

function randomShapeKey() {
  const keys = Object.keys(SHAPES);
  return keys[Math.floor(Math.random() * keys.length)];
}

function spawnPiece() {
  const type = randomShapeKey();
  const definition = SHAPES[type];
  const cells = definition.cells.map(([x, y, z]) => ({ x, y, z }));
  const maxY = Math.max(...cells.map((cell) => cell.y));

  state.current = {
    type,
    color: definition.color,
    cells,
    x: Math.floor(BOARD_WIDTH / 2),
    y: BOARD_HEIGHT - 1 - maxY,
    z: Math.floor(BOARD_DEPTH / 2)
  };

  if (!canPlace(state.current, state.current.cells)) {
    state.gameOver = true;
    statusEl.textContent = "Game Over";
  }
}

function canPlace(piece, cellsToCheck = piece.cells) {
  for (const cell of cellsToCheck) {
    const worldX = piece.x + cell.x;
    const worldY = piece.y + cell.y;
    const worldZ = piece.z + cell.z;

    if (worldX < 0 || worldX >= BOARD_WIDTH) return false;
    if (worldY < 0 || worldY >= BOARD_HEIGHT) return false;
    if (worldZ < 0 || worldZ >= BOARD_DEPTH) return false;

    if (state.board[worldX][worldZ][worldY] !== 0) return false;
  }

  return true;
}

function rotateCells(cells, axis) {
  return cells.map(({ x, y, z }) => {
    if (axis === "y") {
      return { x: z, y, z: -x };
    }

    if (axis === "x") {
      return { x, y: -z, z: y };
    }

    return { x: y, y: -x, z };
  });
}

function tryMove(deltaX, deltaY, deltaZ) {
  if (!state.current) return false;

  const candidate = {
    ...state.current,
    x: state.current.x + deltaX,
    y: state.current.y + deltaY,
    z: state.current.z + deltaZ
  };

  if (canPlace(candidate, candidate.cells)) {
    state.current = candidate;
    return true;
  }

  return false;
}

function rotateCurrent(axis) {
  if (!state.current) return false;

  const rotated = rotateCells(state.current.cells, axis);
  const offsets = [0, 1, -1, 2, -2];

  for (const dx of offsets) {
    for (const dz of offsets) {
      const candidate = {
        ...state.current,
        x: state.current.x + dx,
        z: state.current.z + dz,
        cells: rotated
      };

      if (canPlace(candidate, rotated)) {
        state.current = candidate;
        return true;
      }
    }
  }

  return false;
}

function lockPiece() {
  if (!state.current) return;

  for (const cell of state.current.cells) {
    const worldX = state.current.x + cell.x;
    const worldY = state.current.y + cell.y;
    const worldZ = state.current.z + cell.z;

    state.board[worldX][worldZ][worldY] = state.current.color;
  }
}

function clearLines() {
  let cleared = 0;

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    let isFull = true;

    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let z = 0; z < BOARD_DEPTH; z++) {
        if (state.board[x][z][y] === 0) {
          isFull = false;
          break;
        }
      }

      if (!isFull) break;
    }

    if (isFull) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let z = 0; z < BOARD_DEPTH; z++) {
          const layer = state.board[x][z];
          layer.splice(y, 1);
          layer.push(0);
        }
      }

      cleared += 1;
      y -= 1;
    }
  }

  if (cleared > 0) {
    const linePoints = [0, 100, 250, 500, 800];
    state.score += linePoints[cleared] * state.level;
    state.lines += cleared;
    state.level = 1 + Math.floor(state.lines / 10);
  }
}

function updateHUD() {
  scoreEl.textContent = String(state.score);
  linesEl.textContent = String(state.lines);
  levelEl.textContent = String(state.level);

  if (state.gameOver) {
    statusEl.textContent = "Game Over";
  } else if (state.paused) {
    statusEl.textContent = "Paused";
  } else {
    statusEl.textContent = "Running";
  }
}

function hardDrop() {
  if (!state.current || state.gameOver) return;

  let distance = 0;
  while (tryMove(0, -1, 0)) {
    distance += 1;
  }

  state.score += distance * 2;
  lockPiece();
  clearLines();
  spawnPiece();
  updateHUD();
}

function tick() {
  if (state.gameOver || state.paused) return;

  if (!tryMove(0, -1, 0)) {
    lockPiece();
    clearLines();
    spawnPiece();
  }

  updateHUD();
}

function renderBoard() {
  if (state.visualGroup) {
    scene.remove(state.visualGroup);
  }

  const group = new THREE.Group();
  const cubeGeometry = new THREE.BoxGeometry(0.92, 0.92, 0.92);

  for (let x = 0; x < BOARD_WIDTH; x++) {
    for (let z = 0; z < BOARD_DEPTH; z++) {
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        const cellColor = state.board[x][z][y];
        if (cellColor === 0) continue;

        const mesh = new THREE.Mesh(
          cubeGeometry,
          new THREE.MeshStandardMaterial({
            color: cellColor,
            emissive: cellColor,
            emissiveIntensity: 0.15,
            roughness: 0.5,
            metalness: 0.2
          })
        );

        mesh.position.set(
          (x - (BOARD_WIDTH - 1) / 2) * CELL_SIZE,
          (y - (BOARD_HEIGHT - 1) / 2) * CELL_SIZE,
          (z - (BOARD_DEPTH - 1) / 2) * CELL_SIZE
        );

        group.add(mesh);
      }
    }
  }

  if (state.current) {
    for (const cell of state.current.cells) {
      const mesh = new THREE.Mesh(
        cubeGeometry,
        new THREE.MeshStandardMaterial({
          color: state.current.color,
          emissive: state.current.color,
          emissiveIntensity: 0.28,
          roughness: 0.42,
          metalness: 0.28
        })
      );

      mesh.position.set(
        ((state.current.x + cell.x) - (BOARD_WIDTH - 1) / 2) * CELL_SIZE,
        ((state.current.y + cell.y) - (BOARD_HEIGHT - 1) / 2) * CELL_SIZE,
        ((state.current.z + cell.z) - (BOARD_DEPTH - 1) / 2) * CELL_SIZE
      );

      group.add(mesh);
    }
  }

  state.visualGroup = group;
  scene.add(group);
}

function animate(timestamp) {
  const delta = timestamp - state.lastTimestamp;
  state.lastTimestamp = timestamp;

  if (!state.gameOver && !state.paused) {
    state.dropAccumulator += delta;
    if (state.dropAccumulator >= getDropDelay()) {
      tick();
      state.dropAccumulator = 0;
    }
  }

  renderBoard();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function restartGame() {
  state.board = createBoard();
  state.score = 0;
  state.lines = 0;
  state.level = 1;
  state.paused = false;
  state.gameOver = false;
  state.dropAccumulator = 0;
  pauseButton.textContent = "Pause";
  spawnPiece();
  updateHUD();
}

function togglePause() {
  if (state.gameOver) return;

  state.paused = !state.paused;
  pauseButton.textContent = state.paused ? "Resume" : "Pause";
  updateHUD();
}

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  if (event.key.toLowerCase() === "p") {
    togglePause();
    return;
  }

  if (state.gameOver || state.paused) {
    return;
  }

  const lower = event.key.toLowerCase();

  switch (lower) {
    case "a":
    case "arrowleft":
      tryMove(-1, 0, 0);
      break;
    case "d":
    case "arrowright":
      tryMove(1, 0, 0);
      break;
    case "q":
      tryMove(0, 0, -1);
      break;
    case "e":
      tryMove(0, 0, 1);
      break;
    case "s":
    case "arrowdown":
      if (tryMove(0, -1, 0)) {
        state.score += 1;
      }
      break;
    case "r":
      rotateCurrent("y");
      break;
    case "f":
      rotateCurrent("x");
      break;
    case " ":
      hardDrop();
      break;
    default:
      return;
  }

  updateHUD();
});

pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartGame);

window.addEventListener("resize", () => {
  const width = canvas.clientWidth || 640;
  const height = canvas.clientHeight || 640;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

restartGame();
requestAnimationFrame(animate);
