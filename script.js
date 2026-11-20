import * as THREE from 'three';

const MISSION_STATE = {
  IDLE: 'IDLE',
  INFILTRATE: 'INFILTRATE',
  STEAL_DATA: 'STEAL_DATA',
  ESCAPE: 'ESCAPE',
  VICTORY: 'VICTORY',
  GAMEOVER: 'GAMEOVER'
};

const HACK_CODES = [
  'OVERRIDE_GATE_77',
  'BYPASS_CTOS_404',
  'ROOT_ACCESS_88',
  'DECRYPT_NODE_19',
  'UNLOCK_SECTOR_09',
  'INJECT_DEDSEC_21'
];

const PLAYER_RADIUS = 0.55;
const PLAYER_SPEED = 7.4;
const GATE_HACK_TIME = 10.0;

const dom = {
  canvas: document.getElementById('game-canvas'),
  hud: document.getElementById('hud'),
  startScreen: document.getElementById('start-screen'),
  terminalModal: document.getElementById('terminal-modal'),
  nethackOverlay: document.getElementById('nethack-overlay'),
  cameraOverlay: document.getElementById('camera-overlay'),
  statusMode: document.getElementById('status-mode'),
  camName: document.getElementById('cam-name'),
  hackTimer: document.getElementById('hack-timer'),
  hackTargetCode: document.getElementById('hack-target-code'),
  hackInput: document.getElementById('hack-input'),
  hackFeedback: document.getElementById('hack-feedback'),
  btnStart: document.getElementById('btn-start')
};

let scene, camera, renderer, clock;
let ambientLight, dirLight;
let playerGroup, playerParts = {};
let gateMesh, gatePanelMesh, serverMesh, serverCoreMesh, networkLinesGroup;

const colliders = [];
const occluders = [];
const structureMeshes = [];
const hackableMeshes = [];
const securityCameras = [];

const gameState = {
  mission: MISSION_STATE.IDLE,
  elapsedTime: 0,
  netHackActive: false,
  activeCamIndex: -1,
  gateUnlocked: false,
  gateOpenProgress: 0,
  terminalOpen: false,
  hackTimeLeft: GATE_HACK_TIME,
  hackCode: '',
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
  buildSecurityCameras();
  buildNetworkLines();

  window.addEventListener('resize', onWindowResize);
}

function setupLighting() {
  ambientLight = new THREE.AmbientLight(0x4b3b78, 1.35);
  scene.add(ambientLight);

  dirLight = new THREE.DirectionalLight(0x88bbff, 0.95);
  dirLight.position.set(18, 28, 16);
  dirLight.castShadow = true;
  scene.add(dirLight);
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
  scene.add(mesh);

  mesh.userData.normalMaterial = mat;
  mesh.userData.nethackMaterial = new THREE.MeshBasicMaterial({
    color: 0x0b3a5c,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });

  if (options.isStructure !== false) structureMeshes.push(mesh);
  if (options.collide !== false) {
    mesh.updateMatrixWorld(true);
    colliders.push({ box: new THREE.Box3().setFromObject(mesh), mesh, isGate: !!options.isGate });
  }
  if (options.occlude !== false) occluders.push(mesh);
  return mesh;
}

function createHackableDevice(w, h, d, x, y, z, glowColor, name) {
  const normalMat = new THREE.MeshStandardMaterial({
    color: 0x121b2d,
    emissive: glowColor,
    emissiveIntensity: 0.65
  });
  const nethackMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), normalMat);
  mesh.position.set(x, y, z);
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
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 80),
    new THREE.MeshStandardMaterial({ color: 0x101422, roughness: 0.88 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

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
}

function buildPlayer() {
  playerGroup = new THREE.Group();
  playerGroup.position.set(0, 0, 14);
  scene.add(playerGroup);
}

function buildSecurityCameras() {
  const camConfigs = [
    { name: 'CAM_01 // PÁTIO_OESTE', pos: new THREE.Vector3(-14.6, 4.3, -1), baseYaw: -2.15, basePitch: -0.35 },
    { name: 'CAM_02 // SETOR_SERVIDOR', pos: new THREE.Vector3(14.6, 4.3, -17), baseYaw: 1.95, basePitch: -0.32 }
  ];

  camConfigs.forEach((cfg, idx) => {
    const normalMat = new THREE.MeshStandardMaterial({ color: 0x222c42, emissive: 0x00ff88, emissiveIntensity: 0.7 });
    const nethackMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.8), normalMat);
    mesh.position.copy(cfg.pos);
    mesh.userData.normalMaterial = normalMat;
    mesh.userData.nethackMaterial = nethackMat;
    scene.add(mesh);

    hackableMeshes.push(mesh);
    securityCameras.push({
      id: idx,
      name: cfg.name,
      mesh,
      pos: cfg.pos.clone(),
      baseYaw: cfg.baseYaw,
      basePitch: cfg.basePitch,
      yawOffset: 0,
      pitchOffset: 0
    });
  });
}

function buildNetworkLines() {
  networkLinesGroup = new THREE.Group();
  networkLinesGroup.visible = false;
  const points = [
    gatePanelMesh.position.clone(),
    securityCameras[0].pos.clone(),
    serverMesh.position.clone().setY(2.2),
    securityCameras[1].pos.clone(),
    gatePanelMesh.position.clone()
  ];
  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
  networkLinesGroup.add(new THREE.Line(lineGeo, lineMat));
  scene.add(networkLinesGroup);
}

function toggleNetHack(forceState) {
  gameState.netHackActive = forceState !== undefined ? forceState : !gameState.netHackActive;
  if (gameState.netHackActive) {
    scene.background.setHex(0x020611);
    scene.fog.color.setHex(0x020611);
    ambientLight.intensity = 0.55;
    dom.nethackOverlay.classList.remove('hidden');
    dom.statusMode.textContent = 'NETHACK';
    networkLinesGroup.visible = true;
  } else {
    scene.background.setHex(0x090b1a);
    scene.fog.color.setHex(0x090b1a);
    ambientLight.intensity = 1.35;
    dom.nethackOverlay.classList.add('hidden');
    dom.statusMode.textContent = gameState.activeCamIndex >= 0 ? 'CÂMERA' : 'FURTIVO';
    networkLinesGroup.visible = false;
  }

  structureMeshes.forEach((m) => {
    m.material = gameState.netHackActive ? m.userData.nethackMaterial : m.userData.normalMaterial;
  });
  hackableMeshes.forEach((m) => {
    m.material = gameState.netHackActive ? m.userData.nethackMaterial : m.userData.normalMaterial;
  });
}

function cycleSecurityCamera(specificIndex = null) {
  if (specificIndex !== null) {
    gameState.activeCamIndex = gameState.activeCamIndex === specificIndex ? -1 : specificIndex;
  } else {
    gameState.activeCamIndex += 1;
    if (gameState.activeCamIndex >= securityCameras.length) gameState.activeCamIndex = -1;
  }

  if (gameState.activeCamIndex >= 0) {
    const camObj = securityCameras[gameState.activeCamIndex];
    camObj.yawOffset = 0;
    camObj.pitchOffset = 0;
    dom.camName.textContent = camObj.name;
    dom.cameraOverlay.classList.remove('hidden');
  } else {
    dom.cameraOverlay.classList.add('hidden');
  }
}

function openGateTerminal() {
  gameState.terminalOpen = true;
  gameState.hackTimeLeft = GATE_HACK_TIME;
  gameState.hackCode = HACK_CODES[Math.floor(Math.random() * HACK_CODES.length)];
  dom.hackTargetCode.textContent = gameState.hackCode;
  dom.hackInput.value = '';
  dom.hackFeedback.textContent = '';
  dom.terminalModal.classList.remove('hidden');
  if (document.pointerLockElement === dom.canvas) document.exitPointerLock();
  setTimeout(() => dom.hackInput.focus(), 50);
}

function closeGateTerminal() {
  gameState.terminalOpen = false;
  dom.terminalModal.classList.add('hidden');
  dom.canvas.requestPointerLock();
}

function completeGateHack() {
  gameState.gateUnlocked = true;
  dom.hackFeedback.textContent = '> ACESSO CONCEDIDO // PORTÃO DESTRAVADO!';
  dom.hackFeedback.style.color = '#00ff88';
  for (let i = colliders.length - 1; i >= 0; i--) {
    if (colliders[i].isGate) colliders.splice(i, 1);
  }
  setTimeout(() => closeGateTerminal(), 450);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

initThree();
animate();
