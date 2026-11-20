import * as THREE from 'three';

const MISSION_STATE = {
  IDLE: 'IDLE',
  INFILTRATE: 'INFILTRATE',
  STEAL_DATA: 'STEAL_DATA',
  ESCAPE: 'ESCAPE',
  VICTORY: 'VICTORY',
  GAMEOVER: 'GAMEOVER'
};

const PLAYER_RADIUS = 0.55;
const PLAYER_SPEED = 7.4;

const dom = {
  canvas: document.getElementById('game-canvas'),
  hud: document.getElementById('hud'),
  startScreen: document.getElementById('start-screen'),
  btnStart: document.getElementById('btn-start')
};

let scene, camera, renderer, clock;
let ambientLight, dirLight;
let playerGroup, playerParts = {};
let gateMesh, gatePanelMesh, serverMesh, serverCoreMesh, extractionZoneGroup, extractionRing;

const colliders = [];
const occluders = [];
const structureMeshes = [];
const hackableMeshes = [];

const gameState = {
  mission: MISSION_STATE.IDLE,
  elapsedTime: 0,
  cameraYaw: 0,
  cameraPitch: 0.34,
  keys: {}
};

const raycaster = new THREE.Raycaster();

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090b1a);
  scene.fog = new THREE.FogExp2(0x090b1a, 0.022);

  camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 140);

  renderer = new THREE.WebGLRenderer({ canvas: dom.canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  clock = new THREE.Clock();

  setupLighting();
  buildEnvironment();
  buildPlayer();

  window.addEventListener('resize', onWindowResize);
}

function setupLighting() {
  ambientLight = new THREE.AmbientLight(0x4b3b78, 1.35);
  scene.add(ambientLight);

  dirLight = new THREE.DirectionalLight(0x88bbff, 0.95);
  dirLight.position.set(18, 28, 16);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 2;
  dirLight.shadow.camera.far = 85;
  const d = 32;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  const streetNeonCyan = new THREE.PointLight(0x00f0ff, 2.2, 26);
  streetNeonCyan.position.set(-10, 5, 16);
  scene.add(streetNeonCyan);

  const streetNeonMagenta = new THREE.PointLight(0xff0055, 2.2, 26);
  streetNeonMagenta.position.set(10, 5, 16);
  scene.add(streetNeonMagenta);

  const serverLight = new THREE.PointLight(0x00f0ff, 2.6, 20);
  serverLight.position.set(0, 4.2, -20);
  scene.add(serverLight);
}

function addStaticBox(w, h, d, x, y, z, color, options = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.75,
    metalness: options.metalness ?? 0.2,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  scene.add(mesh);

  mesh.userData.normalMaterial = mat;
  mesh.userData.nethackMaterial = new THREE.MeshBasicMaterial({
    color: 0x0b3a5c,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });

  if (options.isStructure !== false) {
    structureMeshes.push(mesh);
  }
  if (options.collide !== false) {
    mesh.updateMatrixWorld(true);
    colliders.push({ box: new THREE.Box3().setFromObject(mesh), mesh, isGate: !!options.isGate });
  }
  if (options.occlude !== false) {
    occluders.push(mesh);
  }
  return mesh;
}

function createHackableDevice(w, h, d, x, y, z, glowColor, name) {
  const normalMat = new THREE.MeshStandardMaterial({
    color: 0x121b2d,
    emissive: glowColor,
    emissiveIntensity: 0.65,
    roughness: 0.35,
    metalness: 0.5
  });
  const nethackMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: false });

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), normalMat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;
  mesh.userData.normalMaterial = normalMat;
  mesh.userData.nethackMaterial = nethackMat;
  scene.add(mesh);

  mesh.updateMatrixWorld(true);
  colliders.push({ box: new THREE.Box3().setFromObject(mesh), mesh });
  hackableMeshes.push(mesh);
  return mesh;
}

function buildEnvironment() {
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x101422, roughness: 0.88, metalness: 0.15 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 80), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(70, 35, 0x00f0ff, 0x162442);
  grid.position.y = 0.015;
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  addStaticBox(13, 5, 1, -9.5, 2.5, 6, 0x1b2236);
  addStaticBox(13, 5, 1, 9.5, 2.5, 6, 0x1b2236);
  addStaticBox(1, 5, 32, -16, 2.5, -10, 0x1b2236);
  addStaticBox(1, 5, 32, 16, 2.5, -10, 0x1b2236);
  addStaticBox(33, 5, 1, 0, 2.5, -26, 0x1b2236);

  gateMesh = addStaticBox(6, 4.4, 0.6, 0, 2.2, 6, 0x26314a, {
    isGate: true,
    emissive: 0xff0055,
    emissiveIntensity: 0.45
  });
  gatePanelMesh = createHackableDevice(0.7, 1.5, 0.5, 4.2, 0.75, 6.9, 0x00f0ff, 'PAINEL_PORTAO');
  serverMesh = createHackableDevice(2.0, 3.0, 1.4, 0, 1.65, -21.5, 0xff0055, 'SERVIDOR_CTOS');

  serverCoreMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
  );
  serverCoreMesh.position.set(0, 3.9, -21.5);
  scene.add(serverCoreMesh);
}

function buildPlayer() {
  playerGroup = new THREE.Group();
  playerGroup.position.set(0, 0, 14);

  const coatMat = new THREE.MeshStandardMaterial({ color: 0x171c2b, roughness: 0.7 });
  const hoodMat = new THREE.MeshStandardMaterial({ color: 0x101420, roughness: 0.8 });
  const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  const legGeo = new THREE.BoxGeometry(0.24, 0.75, 0.24);
  const legL = new THREE.Mesh(legGeo, coatMat);
  legL.position.set(-0.16, 0.38, 0);
  const legR = new THREE.Mesh(legGeo, coatMat);
  legR.position.set(0.16, 0.38, 0);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.82, 0.38), coatMat);
  torso.position.y = 1.15;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), hoodMat);
  head.position.y = 1.8;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.08), visorMat);
  visor.position.set(0, 1.82, 0.22);

  playerParts = { legL, legR };
  playerGroup.add(legL, legR, torso, head, visor);
  scene.add(playerGroup);
}

function checkCollision(x, z) {
  for (const col of colliders) {
    const b = col.box;
    const closestX = THREE.MathUtils.clamp(x, b.min.x, b.max.x);
    const closestZ = THREE.MathUtils.clamp(z, b.min.z, b.max.z);
    const dx = x - closestX;
    const dz = z - closestZ;
    if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) return true;
  }
  return false;
}

function updatePlayer(dt) {
  let inputZ = 0, inputX = 0;
  if (gameState.keys['KeyW']) inputZ += 1;
  if (gameState.keys['KeyS']) inputZ -= 1;
  if (gameState.keys['KeyA']) inputX -= 1;
  if (gameState.keys['KeyD']) inputX += 1;

  if (inputX !== 0 || inputZ !== 0) {
    const yaw = gameState.cameraYaw;
    let moveX = -Math.sin(yaw) * inputZ + Math.cos(yaw) * inputX;
    let moveZ = -Math.cos(yaw) * inputZ - Math.sin(yaw) * inputX;
    const len = Math.hypot(moveX, moveZ) || 1;
    moveX /= len;
    moveZ /= len;

    const pos = playerGroup.position;
    if (!checkCollision(pos.x + moveX * PLAYER_SPEED * dt, pos.z)) pos.x += moveX * PLAYER_SPEED * dt;
    if (!checkCollision(pos.x, pos.z + moveZ * PLAYER_SPEED * dt)) pos.z += moveZ * PLAYER_SPEED * dt;
  }
}

function updateCamera() {
  const target = new THREE.Vector3(playerGroup.position.x, playerGroup.position.y + 1.55, playerGroup.position.z);
  const dist = 5.4;
  const idealPos = new THREE.Vector3(
    target.x + Math.sin(gameState.cameraYaw) * Math.cos(gameState.cameraPitch) * dist,
    target.y + Math.sin(gameState.cameraPitch) * dist,
    target.z + Math.cos(gameState.cameraYaw) * Math.cos(gameState.cameraPitch) * dist
  );
  camera.position.copy(idealPos);
  camera.lookAt(target);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (gameState.mission === MISSION_STATE.INFILTRATE) {
    updatePlayer(dt);
  }
  updateCamera();
  renderer.render(scene, camera);
}

initThree();
animate();
