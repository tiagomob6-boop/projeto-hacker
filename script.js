import * as THREE from 'three';

// ==========================================
// CONSTANTES E ESTADO GLOBAL
// ==========================================
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
  'INJECT_DEDSEC_21',
  'BREACH_PROXY_64',
  'SPOOF_TOKEN_33'
];

const FIREWALL_CODES = [
  'BYPASS_FW_99',
  'KILL_DAEMON_04',
  'CRACK_AES_256',
  'PURGE_TRACE_71',
  'SUDO_DUMP_42',
  'DROP_FILTER_18'
];

const PLAYER_RADIUS = 0.55;
const PLAYER_SPEED = 7.4;
const PLAYER_SPRINT_SPEED = 11.2;
const PLAYER_CROUCH_SPEED = 4.5;
const GATE_HACK_TIME = 10.0;
const FIREWALL_HACK_TIME = 8.5;
const DOWNLOAD_DURATION = 3.5;
const CAMERA_OVERLOAD_DURATION = 15.0;
const ELECTRIC_COOLDOWN = 12.0;
const ELECTRIC_INVESTIGATE_TIME = 6.0;
const BASE_AMBIENT_INTENSITY = 2.15;

// Referências DOM
const dom = {
  canvas: document.getElementById('game-canvas'),
  hud: document.getElementById('hud'),
  startScreen: document.getElementById('start-screen'),
  gameoverScreen: document.getElementById('gameover-screen'),
  victoryScreen: document.getElementById('victory-screen'),
  terminalModal: document.getElementById('terminal-modal'),
  nethackOverlay: document.getElementById('nethack-overlay'),
  cameraOverlay: document.getElementById('camera-overlay'),
  alertVignette: document.getElementById('alert-vignette'),
  missionObjective: document.getElementById('mission-objective'),
  missionSub: document.getElementById('mission-sub'),
  statusMode: document.getElementById('status-mode'),
  statusTimer: document.getElementById('status-timer'),
  detectionContainer: document.getElementById('detection-container'),
  detectionBar: document.getElementById('detection-bar'),
  downloadContainer: document.getElementById('download-container'),
  downloadBar: document.getElementById('download-bar'),
  downloadPercent: document.getElementById('download-percent'),
  interactPrompt: document.getElementById('interact-prompt'),
  camName: document.getElementById('cam-name'),
  hackTimer: document.getElementById('hack-timer'),
  hackTargetCode: document.getElementById('hack-target-code'),
  hackInput: document.getElementById('hack-input'),
  hackFeedback: document.getElementById('hack-feedback'),
  terminalLogAction: document.getElementById('terminal-log-action'),
  finalTime: document.getElementById('final-time'),
  btnStart: document.getElementById('btn-start'),
  btnRetryGameover: document.getElementById('btn-retry-gameover'),
  btnRetryVictory: document.getElementById('btn-retry-victory')
};

// Variáveis Three.js
let scene, camera, renderer, clock;
let ambientLight, dirLight;
let playerGroup, playerParts = {};
let gateMesh, gatePanelMesh, serverMesh, serverCoreMesh, extractionZoneGroup, extractionRing, extractionBeam;
let networkLinesGroup, serverParticles;
const serverParticleData = [];

// Listas de mundo e gameplay
const colliders = [];   // { box: THREE.Box3, mesh, isGate?: boolean }
const occluders = [];   // Meshes que bloqueiam visão dos guardas
const structureMeshes = []; // Meshes afetados pelo wireframe NetHack
const hackableMeshes = [];  // Dispositivos destacáveis no NetHack
const securityCameras = []; // { id, name, mesh, pos, baseYaw, basePitch, yawOffset, pitchOffset, coneMesh, coneMat, disabledTimer, sweepPhase, currentYaw }
const guards = [];          // { mesh, waypoints, currentTarget, speed, visionRange, visionHalfAngle, coneMesh, coneMat, investigateTarget, investigateTimer }
const electricBoxes = [];   // { id, name, mesh, cooldown, sparkTimer, sparkPoints, sparkData }

// Estado do jogo
const gameState = {
  mission: MISSION_STATE.IDLE,
  elapsedTime: 0,
  netHackActive: false,
  activeCamIndex: -1, // -1 = câmera 3ª pessoa do jogador
  gateUnlocked: false,
  gateOpenProgress: 0,
  serverFirewallDisabled: false,
  terminalOpen: false,
  terminalTarget: 'GATE',
  hackTimeLeft: GATE_HACK_TIME,
  hackCode: '',
  downloadProgress: 0,
  detectionLevel: 0,
  isSprinting: false,
  isCrouching: false,
  cameraYaw: 0,
  cameraPitch: 0.34,
  keys: {}
};

const raycaster = new THREE.Raycaster();

// ==========================================
// INICIALIZAÇÃO DA CENA THREE.JS
// ==========================================
function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090b1a);
  scene.fog = new THREE.FogExp2(0x090b1a, 0.017);

  camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 200);

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
  buildElectricBoxes();
  buildGuards();
  buildNetworkLines();

  window.addEventListener('resize', onWindowResize);
}

function setupLighting() {
  ambientLight = new THREE.AmbientLight(0x5b4b8a, BASE_AMBIENT_INTENSITY);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0x6d8eff, 0x181c30, 0.75);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0x99c6ff, 1.15);
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

  // Luzes neon de atmosfera cyberpunk (ciano e magenta)
  const streetNeonCyan = new THREE.PointLight(0x00f0ff, 2.4, 28);
  streetNeonCyan.position.set(-10, 5, 16);
  scene.add(streetNeonCyan);

  const streetNeonMagenta = new THREE.PointLight(0xff0055, 2.4, 28);
  streetNeonMagenta.position.set(10, 5, 16);
  scene.add(streetNeonMagenta);

  // Luz de destaque na fachada da entrada do complexo
  const gateEntryLight = new THREE.PointLight(0x00f0ff, 2.4, 18);
  gateEntryLight.position.set(0, 4.6, 7.8);
  scene.add(gateEntryLight);

  // Luzes internas sutis no pátio para melhorar leitura de cobertura e guardas
  const courtyardLightLeft = new THREE.PointLight(0x4b7bec, 1.8, 24);
  courtyardLightLeft.position.set(-9, 4.5, -6);
  scene.add(courtyardLightLeft);

  const courtyardLightRight = new THREE.PointLight(0x706fd3, 1.8, 24);
  courtyardLightRight.position.set(9, 4.5, -14);
  scene.add(courtyardLightRight);

  const serverLight = new THREE.PointLight(0x00f0ff, 2.8, 22);
  serverLight.position.set(0, 4.2, -20);
  scene.add(serverLight);
}

// ==========================================
// CONSTRUÇÃO DO CENÁRIO (RUA + COMPLEXO ctOS)
// ==========================================
function addStaticBox(w, h, d, x, y, z, color, options = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.75,
    metalness: options.metalness ?? 0.2,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    fog: options.fog ?? true
  });

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  scene.add(mesh);

  if (options.edgesColor !== undefined) {
    const edgesGeo = new THREE.EdgesGeometry(mesh.geometry);
    const edgesMat = new THREE.LineBasicMaterial({
      color: options.edgesColor,
      transparent: true,
      opacity: options.edgesOpacity ?? 0.5
    });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    mesh.add(edges);
    mesh.userData.edgesMaterial = edgesMat;
  }

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
    const box = new THREE.Box3().setFromObject(mesh);
    colliders.push({ box, mesh, isGate: !!options.isGate });
  }

  if (options.occlude !== false) {
    occluders.push(mesh);
  }

  return mesh;
}

function buildEnvironment() {
  // Chão principal
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x101422,
    roughness: 0.88,
    metalness: 0.15
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 80), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grade neon sutil no chão
  const grid = new THREE.GridHelper(70, 35, 0x00f0ff, 0x162442);
  grid.position.y = 0.015;
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  // Faixas da rua (Área Externa)
  for (let x = -18; x <= 18; x += 6) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.03, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x2f436e })
    );
    stripe.position.set(x, 0.02, 18);
    scene.add(stripe);
  }

  // Postes cyberpunk na rua
  [-13, 13].forEach((px) => {
    addStaticBox(0.35, 5.5, 0.35, px, 2.75, 16, 0x1e2538, { occlude: false });
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.2, 0.5),
      new THREE.MeshBasicMaterial({ color: px < 0 ? 0x00f0ff : 0xff0055 })
    );
    lamp.position.set(px + (px < 0 ? 0.3 : -0.3), 5.5, 16);
    scene.add(lamp);
  });

  // Silhuetas de prédios de São Francisco ao fundo (fora da área jogável)
  const skylinePositions = [
    [-28, 12, -28, 8, 24, 8],
    [-28, 9, -8, 7, 18, 10],
    [-28, 11, 14, 8, 22, 10],
    [28, 13, -24, 9, 26, 9],
    [28, 8, -4, 7, 16, 10],
    [28, 12, 16, 8, 24, 10],
    [-12, 14, -36, 10, 28, 8],
    [12, 15, -36, 10, 30, 8],
    [0, 18, -38, 10, 36, 8]
  ];
  skylinePositions.forEach(([x, y, z, w, h, d], idx) => {
    addStaticBox(w, h, d, x, y, z, 0x0c1020, {
      collide: false,
      occlude: false,
      emissive: idx % 2 === 0 ? 0x051828 : 0x1d0618,
      emissiveIntensity: 0.7
    });

    // Janelas emissivas sutis nos prédios do skyline
    const winColor = idx % 2 === 0 ? 0x00f0ff : 0xff4488;
    const winMat = new THREE.MeshBasicMaterial({
      color: winColor,
      transparent: true,
      opacity: 0.28
    });
    const rows = Math.floor(h / 4);
    for (let r = 1; r < rows; r++) {
      if ((r + idx) % 2 !== 0) continue;
      const winBand = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.72, 0.32, 0.12),
        winMat
      );
      const faceZ = z < 0 ? z + d / 2 + 0.08 : z - d / 2 - 0.08;
      winBand.position.set(x, r * 3.6, faceZ);
      scene.add(winBand);
    }
  });

  // Ponte Golden Gate estilizada em laranja-neon ao fundo do horizonte
  buildGoldenGateBridge();

  // Muros do Complexo Protegido (X: -16 a +16, Z: -26 a +6)
  // Muro frontal esquerdo e direito (deixando vão central de X=-3 a +3 para o portão)
  addStaticBox(13, 5, 1, -9.5, 2.5, 6, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });
  addStaticBox(13, 5, 1, 9.5, 2.5, 6, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });
  // Muros laterais
  addStaticBox(1, 5, 32, -16, 2.5, -10, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.42 });
  addStaticBox(1, 5, 32, 16, 2.5, -10, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.42 });
  // Muro dos fundos
  addStaticBox(33, 5, 1, 0, 2.5, -26, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.42 });

  // Luzes de destaque e letreiros emissivos na fachada da entrada e muros do complexo
  buildComplexNeonAccents();

  // Portão Eletrônico (desliza para o lado ao ser hackeado)
  gateMesh = addStaticBox(6, 4.4, 0.6, 0, 2.2, 6, 0x26314a, {
    isGate: true,
    emissive: 0xff0055,
    emissiveIntensity: 0.45,
    edgesColor: 0xff0055,
    edgesOpacity: 0.8
  });

  // Painel do Portão (Hackeável)
  gatePanelMesh = createHackableDevice(0.7, 1.5, 0.5, 4.2, 0.75, 6.9, 0x00f0ff, 'PAINEL_PORTAO');

  // Caixas de Cobertura (Stealth) dentro do complexo
  const crates = [
    [-7, 1.15, 0.5, 3.2, 2.3, 2.2],
    [7, 1.15, 0.5, 3.2, 2.3, 2.2],
    [0, 1.25, -7.5, 4.5, 2.5, 2.4],
    [-9.5, 1.15, -10.5, 3.0, 2.3, 3.0],
    [9.5, 1.15, -10.5, 3.0, 2.3, 3.0],
    [-5.5, 1.15, -17.5, 2.8, 2.3, 2.4],
    [5.5, 1.15, -17.5, 2.8, 2.3, 2.4]
  ];
  crates.forEach(([x, y, z, w, h, d]) => {
    addStaticBox(w, h, d, x, y, z, 0x24304a, {
      emissive: 0x081526,
      emissiveIntensity: 0.4,
      edgesColor: 0x00d4ff,
      edgesOpacity: 0.52
    });
  });

  // Servidor Central ctOS (Fundo do complexo)
  addStaticBox(4.4, 0.3, 3.6, 0, 0.15, -21.5, 0x182238, { occlude: false, collide: false });
  serverMesh = createHackableDevice(2.0, 3.0, 1.4, 0, 1.65, -21.5, 0xff0055, 'SERVIDOR_CTOS');

  // Núcleo holográfico giratório acima do servidor
  serverCoreMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
  );
  serverCoreMesh.position.set(0, 3.9, -21.5);
  scene.add(serverCoreMesh);

  // Sistema de partículas flutuantes subindo do servidor
  buildServerParticles();

  // Zona de Extração na Rua (Anel + luz verde + feixe vertical)
  extractionZoneGroup = new THREE.Group();
  extractionZoneGroup.position.set(0, 0.04, 25);

  extractionRing = new THREE.Mesh(
    new THREE.RingGeometry(2.1, 2.6, 36),
    new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    })
  );
  extractionRing.rotation.x = -Math.PI / 2;
  extractionZoneGroup.add(extractionRing);

  const extractionInner = new THREE.Mesh(
    new THREE.CircleGeometry(2.1, 36),
    new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18
    })
  );
  extractionInner.rotation.x = -Math.PI / 2;
  extractionZoneGroup.add(extractionInner);

  extractionBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(2.05, 2.25, 9, 32, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  extractionBeam.position.y = 4.5;
  extractionZoneGroup.add(extractionBeam);

  const extractionLight = new THREE.PointLight(0x00ff88, 1.8, 12);
  extractionLight.position.set(0, 1.8, 0);
  extractionZoneGroup.add(extractionLight);

  scene.add(extractionZoneGroup);
}

function buildGoldenGateBridge() {
  const bridgeGroup = new THREE.Group();
  const bridgeZ = -52;
  const deckY = 10;
  const towerXs = [-22, 22];

  const neonOrangeMat = new THREE.MeshBasicMaterial({
    color: 0xff5a1f,
    fog: false
  });
  const towerBodyMat = new THREE.MeshStandardMaterial({
    color: 0x3b1812,
    emissive: 0xff4500,
    emissiveIntensity: 0.75,
    roughness: 0.5,
    fog: false
  });

  // Tabuleiro principal da ponte
  const deck = new THREE.Mesh(new THREE.BoxGeometry(110, 0.9, 2.2), towerBodyMat);
  deck.position.set(0, deckY, bridgeZ);
  bridgeGroup.add(deck);

  const deckTrim = new THREE.Mesh(new THREE.BoxGeometry(110, 0.25, 2.4), neonOrangeMat);
  deckTrim.position.set(0, deckY + 0.55, bridgeZ);
  bridgeGroup.add(deckTrim);

  // Duas torres características
  towerXs.forEach((tx) => {
    [-1.4, 1.4].forEach((offsetZ) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 30, 1.1), towerBodyMat);
      pillar.position.set(tx, 15, bridgeZ + offsetZ);
      bridgeGroup.add(pillar);
    });

    // Travessas horizontais entre os pilares da torre
    [16, 22, 28].forEach((cy) => {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 3.6), neonOrangeMat);
      cross.position.set(tx, cy, bridgeZ);
      bridgeGroup.add(cross);
    });

    // Sinalizador luminoso no topo
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 3.8), neonOrangeMat);
    beacon.position.set(tx, 30.2, bridgeZ);
    bridgeGroup.add(beacon);
  });

  // Cabos suspensos principais (catenária estilizada) e cabos verticais
  const cableMat = new THREE.LineBasicMaterial({ color: 0xff6b2b, fog: false });
  const spanSamples = 24;
  const cablePoints = [];

  for (let i = 0; i <= spanSamples; i++) {
    const t = i / spanSamples;
    const x = THREE.MathUtils.lerp(-50, 50, t);
    let y;
    if (x < towerXs[0]) {
      const localT = (x - -50) / (towerXs[0] - -50);
      y = THREE.MathUtils.lerp(deckY + 0.5, 29.5, localT * localT);
    } else if (x <= towerXs[1]) {
      const midT = (x - towerXs[0]) / (towerXs[1] - towerXs[0]) * 2 - 1;
      y = deckY + 2.2 + 17.3 * (midT * midT);
    } else {
      const localT = (50 - x) / (50 - towerXs[1]);
      y = THREE.MathUtils.lerp(deckY + 0.5, 29.5, localT * localT);
    }
    cablePoints.push(new THREE.Vector3(x, y, bridgeZ));

    if (i % 2 === 0 && Math.abs(x - towerXs[0]) > 1.5 && Math.abs(x - towerXs[1]) > 1.5) {
      const hangerGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, deckY + 0.6, bridgeZ),
        new THREE.Vector3(x, y, bridgeZ)
      ]);
      bridgeGroup.add(new THREE.Line(hangerGeo, cableMat));
    }
  }

  const mainCableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
  bridgeGroup.add(new THREE.Line(mainCableGeo, cableMat));

  scene.add(bridgeGroup);
}

function buildComplexNeonAccents() {
  // Pórtico luminoso sobre a entrada do portão
  addStaticBox(7.2, 0.45, 1.3, 0, 4.95, 6, 0x162038, {
    collide: false,
    occlude: false,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.45,
    edgesColor: 0x00f0ff,
    edgesOpacity: 0.7
  });

  // Letreiro emissivo central na fachada da entrada
  addStaticBox(5.2, 0.32, 0.16, 0, 5.05, 6.72, 0x00f0ff, {
    collide: false,
    occlude: false,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.4
  });

  // Pilastras luminosas flanqueando o portão
  [-3.25, 3.25].forEach((px) => {
    addStaticBox(0.3, 4.6, 0.25, px, 2.3, 6.58, 0xff0055, {
      collide: false,
      occlude: false,
      emissive: 0xff0055,
      emissiveIntensity: 1.1
    });
  });

  // Faixas/letreiros emissivos nos muros frontais
  [-9.5, 9.5].forEach((wx) => {
    addStaticBox(10.5, 0.2, 0.15, wx, 4.2, 6.56, 0x00f0ff, {
      collide: false,
      occlude: false,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.95
    });
  });

  // Faixas emissivas internas nos muros laterais e fundo para melhor orientação
  [-15.42, 15.42].forEach((lx) => {
    addStaticBox(0.14, 0.22, 28, lx, 4.1, -10, 0x00f0ff, {
      collide: false,
      occlude: false,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.75
    });
  });

  addStaticBox(28, 0.22, 0.14, 0, 4.1, -25.42, 0xff0055, {
    collide: false,
    occlude: false,
    emissive: 0xff0055,
    emissiveIntensity: 0.8
  });
}

function buildServerParticles() {
  const count = 56;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const px = (Math.random() - 0.5) * 2.4;
    const py = 0.4 + Math.random() * 4.4;
    const pz = -21.5 + (Math.random() - 0.5) * 1.8;

    positions[i * 3] = px;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = pz;

    serverParticleData.push({
      baseX: px,
      baseZ: pz,
      speed: 0.65 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x00f0ff,
    size: 0.14,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  serverParticles = new THREE.Points(geo, mat);
  scene.add(serverParticles);
}

function createHackableDevice(w, h, d, x, y, z, glowColor, name) {
  const normalMat = new THREE.MeshStandardMaterial({
    color: 0x121b2d,
    emissive: glowColor,
    emissiveIntensity: 0.65,
    roughness: 0.35,
    metalness: 0.5
  });
  const nethackMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: false
  });

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

// ==========================================
// PERSONAGEM DO JOGADOR (3ª PESSOA)
// ==========================================
function buildPlayer() {
  playerGroup = new THREE.Group();
  playerGroup.position.set(0, 0, 14);

  const coatMat = new THREE.MeshStandardMaterial({ color: 0x171c2b, roughness: 0.7 });
  const hoodMat = new THREE.MeshStandardMaterial({ color: 0x101420, roughness: 0.8 });
  const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  // Pernas
  const legGeo = new THREE.BoxGeometry(0.24, 0.75, 0.24);
  const legL = new THREE.Mesh(legGeo, coatMat);
  legL.position.set(-0.16, 0.38, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, coatMat);
  legR.position.set(0.16, 0.38, 0);
  legR.castShadow = true;

  // Tronco (Jaqueta Hacker)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.82, 0.38), coatMat);
  torso.position.y = 1.15;
  torso.castShadow = true;

  // Detalhe neon nas costas
  const backStrip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.05), visorMat);
  backStrip.position.set(0, 1.18, -0.2);

  // Cabeça + Capuz
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), hoodMat);
  head.position.y = 1.8;
  head.castShadow = true;

  // Visor Neon (voltado para +Z local)
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.08), visorMat);
  visor.position.set(0, 1.82, 0.22);

  playerParts = { legL, legR };
  playerGroup.add(legL, legR, torso, backStrip, head, visor);
  scene.add(playerGroup);
}

// ==========================================
// CÂMERAS DE SEGURANÇA HACKEÁVEIS
// ==========================================
function buildSecurityCameras() {
  const camConfigs = [
    { name: 'CAM_01 // PÁTIO_OESTE', pos: new THREE.Vector3(-14.6, 4.3, -1), baseYaw: -2.15, basePitch: -0.35 },
    { name: 'CAM_02 // SETOR_SERVIDOR', pos: new THREE.Vector3(14.6, 4.3, -17), baseYaw: 1.95, basePitch: -0.32 }
  ];

  camConfigs.forEach((cfg, idx) => {
    const normalMat = new THREE.MeshStandardMaterial({
      color: 0x222c42,
      emissive: 0x00ff88,
      emissiveIntensity: 0.7
    });
    const nethackMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.8), normalMat);
    mesh.position.copy(cfg.pos);
    mesh.rotation.y = cfg.baseYaw;
    mesh.userData.normalMaterial = normalMat;
    mesh.userData.nethackMaterial = nethackMat;
    scene.add(mesh);

    // Cone de visão verde no chão para varredura da câmera
    const camVisionRange = 11.5;
    const camVisionHalfAngle = Math.PI / 6;
    const coneGeo = new THREE.CircleGeometry(
      camVisionRange,
      26,
      -Math.PI / 2 - camVisionHalfAngle,
      camVisionHalfAngle * 2
    );
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.rotation.x = -Math.PI / 2;
    coneMesh.rotation.z = cfg.baseYaw;
    coneMesh.position.set(cfg.pos.x, 0.05, cfg.pos.z);
    scene.add(coneMesh);

    hackableMeshes.push(mesh);
    securityCameras.push({
      id: idx,
      name: cfg.name,
      mesh,
      pos: cfg.pos.clone(),
      baseYaw: cfg.baseYaw,
      basePitch: cfg.basePitch,
      yawOffset: 0,
      pitchOffset: 0,
      coneMesh,
      coneMat,
      visionRange: camVisionRange,
      visionHalfAngle: camVisionHalfAngle,
      disabledTimer: 0,
      sweepPhase: idx * 1.5,
      currentYaw: cfg.baseYaw
    });
  });
}

// ==========================================
// CAIXAS ELÉTRICAS DE DISTRAÇÃO
// ==========================================
function buildElectricBoxes() {
  const boxConfigs = [
    { name: 'CAIXA_ELETRICA_01', pos: new THREE.Vector3(-11.5, 0.85, -1.5) },
    { name: 'CAIXA_ELETRICA_02', pos: new THREE.Vector3(11.5, 0.85, -12.5) }
  ];

  boxConfigs.forEach((cfg, idx) => {
    const mesh = createHackableDevice(0.75, 1.3, 0.55, cfg.pos.x, cfg.pos.y, cfg.pos.z, 0xffaa00, cfg.name);

    const sparkCount = 24;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkData = [];
    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = cfg.pos.x;
      sparkPositions[i * 3 + 1] = cfg.pos.y + 0.5;
      sparkPositions[i * 3 + 2] = cfg.pos.z;
      sparkData.push({
        vx: (Math.random() - 0.5) * 3.4,
        vy: 1.2 + Math.random() * 2.8,
        vz: (Math.random() - 0.5) * 3.4
      });
    }

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffd000,
      size: 0.16,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    sparkPoints.visible = false;
    scene.add(sparkPoints);

    electricBoxes.push({
      id: idx,
      name: cfg.name,
      mesh,
      cooldown: 0,
      sparkTimer: 0,
      sparkPoints,
      sparkData
    });
  });
}

// ==========================================
// GUARDAS E CONES DE VISÃO
// ==========================================
function buildGuards() {
  const guardConfigs = [
    {
      waypoints: [new THREE.Vector3(-11, 0, -3.5), new THREE.Vector3(11, 0, -3.5)],
      speed: 2.8,
      visionRange: 9.5,
      visionHalfAngle: Math.PI / 5 // 36 graus cada lado (72 total)
    },
    {
      waypoints: [new THREE.Vector3(10, 0, -14), new THREE.Vector3(-10, 0, -14)],
      speed: 3.1,
      visionRange: 9.5,
      visionHalfAngle: Math.PI / 5
    }
  ];

  guardConfigs.forEach((cfg) => {
    const group = new THREE.Group();
    group.position.copy(cfg.waypoints[0]);

    const armorMat = new THREE.MeshStandardMaterial({ color: 0x2b1d28, roughness: 0.65 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x151520, roughness: 0.5 });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xff2a55 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.35, 0.42), armorMat);
    body.position.y = 0.75;
    body.castShadow = true;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), helmetMat);
    head.position.y = 1.66;
    head.castShadow = true;

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.08), visorMat);
    visor.position.set(0, 1.68, 0.21);

    // Cone de visão no chão centrado em +Z local
    const coneGeo = new THREE.CircleGeometry(
      cfg.visionRange,
      28,
      -Math.PI / 2 - cfg.visionHalfAngle,
      cfg.visionHalfAngle * 2
    );
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffd000,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.rotation.x = -Math.PI / 2;
    coneMesh.position.y = 0.06;

    group.add(body, head, visor, coneMesh);
    scene.add(group);

    guards.push({
      mesh: group,
      waypoints: cfg.waypoints,
      initialPos: cfg.waypoints[0].clone(),
      currentTarget: 1,
      speed: cfg.speed,
      visionRange: cfg.visionRange,
      visionHalfAngle: cfg.visionHalfAngle,
      coneMesh,
      coneMat,
      investigateTarget: null,
      investigateTimer: 0
    });
  });
}

// ==========================================
// LINHAS VIRTUAIS DA VISÃO NETHACK
// ==========================================
function buildNetworkLines() {
  networkLinesGroup = new THREE.Group();
  networkLinesGroup.visible = false;

  const points = [
    gatePanelMesh.position.clone(),
    electricBoxes[0].mesh.position.clone(),
    securityCameras[0].pos.clone(),
    serverMesh.position.clone().setY(2.2),
    securityCameras[1].pos.clone(),
    electricBoxes[1].mesh.position.clone(),
    gatePanelMesh.position.clone()
  ];

  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.9
  });

  const networkLine = new THREE.Line(lineGeo, lineMat);
  networkLinesGroup.add(networkLine);
  scene.add(networkLinesGroup);
}

// ==========================================
// CONTROLES DE INPUT & POINTER LOCK
// ==========================================
function setupInputs() {
  window.addEventListener('keydown', (e) => {
    const code = e.code;
    gameState.keys[code] = true;

    if (gameState.terminalOpen) {
      if (code === 'Escape') {
        closeGateTerminal();
      }
      return;
    }

    if (
      gameState.mission !== MISSION_STATE.INFILTRATE &&
      gameState.mission !== MISSION_STATE.STEAL_DATA &&
      gameState.mission !== MISSION_STATE.ESCAPE
    ) {
      return;
    }

    if (code === 'KeyV') {
      toggleNetHack();
    } else if (code === 'KeyC') {
      cycleSecurityCamera();
    } else if (code === 'KeyE') {
      handleInteractPress();
    } else if (code === 'KeyR' && gameState.activeCamIndex >= 0) {
      overloadActiveCamera();
    }

    if (e.ctrlKey && ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    gameState.keys[e.code] = false;
  });

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== dom.canvas) return;
    if (gameState.terminalOpen) return;

    const sens = 0.0024;
    if (gameState.activeCamIndex >= 0) {
      const camObj = securityCameras[gameState.activeCamIndex];
      camObj.yawOffset = THREE.MathUtils.clamp(camObj.yawOffset - e.movementX * sens, -0.9, 0.9);
      camObj.pitchOffset = THREE.MathUtils.clamp(camObj.pitchOffset - e.movementY * sens, -0.45, 0.35);
    } else {
      gameState.cameraYaw -= e.movementX * sens;
      gameState.cameraPitch = THREE.MathUtils.clamp(
        gameState.cameraPitch + e.movementY * sens,
        0.08,
        1.15
      );
    }
  });

  dom.canvas.addEventListener('click', () => {
    const playing =
      gameState.mission === MISSION_STATE.INFILTRATE ||
      gameState.mission === MISSION_STATE.STEAL_DATA ||
      gameState.mission === MISSION_STATE.ESCAPE;
    if (playing && !gameState.terminalOpen && document.pointerLockElement !== dom.canvas) {
      dom.canvas.requestPointerLock();
    }
  });

  // Botões de UI
  dom.btnStart.addEventListener('click', startMission);
  dom.btnRetryGameover.addEventListener('click', restartMission);
  dom.btnRetryVictory.addEventListener('click', restartMission);

  // Input do Terminal Hacker
  dom.hackInput.addEventListener('input', () => {
    const typed = dom.hackInput.value.trim().toUpperCase();
    if (typed === gameState.hackCode) {
      completeTerminalHack();
    }
  });

  dom.hackInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const typed = dom.hackInput.value.trim().toUpperCase();
      if (typed === gameState.hackCode) {
        completeTerminalHack();
      } else {
        dom.hackFeedback.textContent = '> ERRO DE SINTAXE // VERIFIQUE O COMANDO';
        dom.hackFeedback.style.color = '#ff0055';
      }
    }
  });
}

// ==========================================
// MECÂNICAS DE HACK (NETHACK, CÂMERA, PORTÃO)
// ==========================================
function toggleNetHack(forceState) {
  gameState.netHackActive = forceState !== undefined ? forceState : !gameState.netHackActive;

  if (gameState.netHackActive) {
    scene.background.setHex(0x020611);
    scene.fog.color.setHex(0x020611);
    scene.fog.density = 0.015;
    ambientLight.intensity = 0.55;
    dom.nethackOverlay.classList.remove('hidden');
    dom.statusMode.textContent = 'NETHACK';
    networkLinesGroup.visible = true;
  } else {
    scene.background.setHex(0x090b1a);
    scene.fog.color.setHex(0x090b1a);
    scene.fog.density = 0.017;
    ambientLight.intensity = BASE_AMBIENT_INTENSITY;
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
    let attempts = 0;
    do {
      gameState.activeCamIndex += 1;
      if (gameState.activeCamIndex >= securityCameras.length) {
        gameState.activeCamIndex = -1;
        break;
      }
      attempts += 1;
    } while (
      gameState.activeCamIndex >= 0 &&
      securityCameras[gameState.activeCamIndex].disabledTimer > 0 &&
      attempts <= securityCameras.length
    );
  }

  if (gameState.activeCamIndex >= 0 && securityCameras[gameState.activeCamIndex].disabledTimer > 0) {
    gameState.activeCamIndex = -1;
  }

  if (gameState.activeCamIndex >= 0) {
    const camObj = securityCameras[gameState.activeCamIndex];
    camObj.yawOffset = 0;
    camObj.pitchOffset = 0;
    dom.camName.textContent = camObj.name;
    dom.cameraOverlay.classList.remove('hidden');
    if (!gameState.netHackActive) dom.statusMode.textContent = 'CÂMERA';
  } else {
    dom.cameraOverlay.classList.add('hidden');
    if (!gameState.netHackActive) dom.statusMode.textContent = 'FURTIVO';
  }
}

function overloadActiveCamera() {
  if (gameState.activeCamIndex < 0) return;
  const camObj = securityCameras[gameState.activeCamIndex];
  camObj.disabledTimer = CAMERA_OVERLOAD_DURATION;
  camObj.coneMesh.visible = false;
  camObj.mesh.userData.normalMaterial.emissive.setHex(0x331111);
  cycleSecurityCamera(-1);
}

function triggerElectricBox(box) {
  if (box.cooldown > 0) return;
  box.cooldown = ELECTRIC_COOLDOWN;
  box.sparkTimer = 1.6;
  box.sparkPoints.visible = true;
  box.mesh.userData.normalMaterial.emissive.setHex(0x00f0ff);

  const posAttr = box.sparkPoints.geometry.getAttribute('position');
  for (let i = 0; i < box.sparkData.length; i++) {
    posAttr.setXYZ(i, box.mesh.position.x, box.mesh.position.y + 0.5, box.mesh.position.z);
  }
  posAttr.needsUpdate = true;

  // Atrair o guarda mais próximo para investigar por 6 segundos
  let nearestGuard = null;
  let nearestDist = Infinity;
  guards.forEach((g) => {
    const d = g.mesh.position.distanceTo(box.mesh.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearestGuard = g;
    }
  });

  if (nearestGuard) {
    nearestGuard.investigateTarget = new THREE.Vector3(box.mesh.position.x, 0, box.mesh.position.z);
    nearestGuard.investigateTimer = ELECTRIC_INVESTIGATE_TIME;
  }
}

function handleInteractPress() {
  // Se já está em uma câmera, E também pode sair
  if (gameState.activeCamIndex >= 0) {
    cycleSecurityCamera(-1);
    return;
  }

  const pPos = playerGroup.position;

  // 1. Checar proximidade do painel do portão
  if (!gameState.gateUnlocked && pPos.distanceTo(gatePanelMesh.position) < 3.6) {
    openTerminal('GATE');
    return;
  }

  // 2. Checar firewall do servidor central antes do download
  if (
    gameState.mission === MISSION_STATE.STEAL_DATA &&
    !gameState.serverFirewallDisabled &&
    pPos.distanceTo(serverMesh.position) < 3.8
  ) {
    openTerminal('FIREWALL');
    return;
  }

  // 3. Checar caixas elétricas de distração (perto ou olhando na Visão NetHack)
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);

  for (const box of electricBoxes) {
    const distBox = pPos.distanceTo(box.mesh.position);
    const toBox = box.mesh.position.clone().sub(camera.position).normalize();
    const lookingInNetHack = gameState.netHackActive && distBox < 28 && camDir.dot(toBox) > 0.90;
    if (distBox < 3.6 || lookingInNetHack) {
      triggerElectricBox(box);
      return;
    }
  }

  // 4. Checar se o jogador está olhando/próximo a uma câmera de segurança
  for (let i = 0; i < securityCameras.length; i++) {
    const camObj = securityCameras[i];
    if (camObj.disabledTimer > 0) continue;
    if (pPos.distanceTo(camObj.pos) < 12) {
      const toSecurityCam = camObj.pos.clone().sub(camera.position).normalize();
      if (camDir.dot(toSecurityCam) > 0.92) {
        cycleSecurityCamera(i);
        return;
      }
    }
  }
}

function openTerminal(targetType = 'GATE') {
  gameState.terminalOpen = true;
  gameState.terminalTarget = targetType;

  const isFirewall = targetType === 'FIREWALL';
  const duration = isFirewall ? FIREWALL_HACK_TIME : GATE_HACK_TIME;
  const pool = isFirewall ? FIREWALL_CODES : HACK_CODES;

  gameState.hackTimeLeft = duration;
  gameState.hackCode = pool[Math.floor(Math.random() * pool.length)];

  if (dom.terminalLogAction) {
    dom.terminalLogAction.textContent = isFirewall
      ? '> FIREWALL ATIVO NO SERVIDOR CENTRAL ctOS.'
      : '> CONEXÃO ESTABELECIDA COM O PAINEL DO PORTÃO.';
  }

  dom.hackTargetCode.textContent = gameState.hackCode;
  dom.hackInput.value = '';
  dom.hackFeedback.textContent = '';
  dom.hackTimer.textContent = `${duration.toFixed(1)}s`;
  dom.terminalModal.classList.remove('hidden');

  if (document.pointerLockElement === dom.canvas) {
    document.exitPointerLock();
  }
  setTimeout(() => dom.hackInput.focus(), 50);
}

function closeGateTerminal() {
  gameState.terminalOpen = false;
  dom.terminalModal.classList.add('hidden');
  dom.canvas.requestPointerLock();
}

function completeTerminalHack() {
  if (gameState.terminalTarget === 'FIREWALL') {
    gameState.serverFirewallDisabled = true;
    serverMesh.userData.normalMaterial.emissive.setHex(0x00f0ff);
    dom.hackFeedback.textContent = '> FIREWALL DESATIVADO // DOWNLOAD LIBERADO!';
    dom.hackFeedback.style.color = '#00ff88';
    setTimeout(() => {
      closeGateTerminal();
    }, 450);
    return;
  }

  gameState.gateUnlocked = true;
  gateMesh.userData.normalMaterial.emissive.setHex(0x00ff88);
  if (gateMesh.userData.edgesMaterial) {
    gateMesh.userData.edgesMaterial.color.setHex(0x00ff88);
  }
  gatePanelMesh.userData.normalMaterial.emissive.setHex(0x00ff88);

  dom.hackFeedback.textContent = '> ACESSO CONCEDIDO // PORTÃO DESTRAVADO!';
  dom.hackFeedback.style.color = '#00ff88';

  // Remover colisor do portão
  for (let i = colliders.length - 1; i >= 0; i--) {
    if (colliders[i].isGate) {
      colliders.splice(i, 1);
    }
  }
  const occIdx = occluders.indexOf(gateMesh);
  if (occIdx !== -1) occluders.splice(occIdx, 1);

  setMissionState(MISSION_STATE.STEAL_DATA);

  setTimeout(() => {
    closeGateTerminal();
  }, 450);
}

// ==========================================
// MOVIMENTAÇÃO, COLISÃO E CÂMERA 3ª PESSOA
// ==========================================
function updatePlayer(dt) {
  if (gameState.terminalOpen || gameState.activeCamIndex >= 0) return;

  let inputZ = 0;
  let inputX = 0;
  if (gameState.keys['KeyW'] || gameState.keys['ArrowUp']) inputZ += 1;
  if (gameState.keys['KeyS'] || gameState.keys['ArrowDown']) inputZ -= 1;
  if (gameState.keys['KeyA'] || gameState.keys['ArrowLeft']) inputX -= 1;
  if (gameState.keys['KeyD'] || gameState.keys['ArrowRight']) inputX += 1;

  const isMoving = inputX !== 0 || inputZ !== 0;
  gameState.isCrouching = !!(gameState.keys['ControlLeft'] || gameState.keys['ControlRight']);
  gameState.isSprinting = !!(gameState.keys['ShiftLeft'] || gameState.keys['ShiftRight']) && !gameState.isCrouching && isMoving;

  const targetScaleY = gameState.isCrouching ? 0.62 : 1.0;
  playerGroup.scale.y = THREE.MathUtils.lerp(playerGroup.scale.y, targetScaleY, Math.min(1, dt * 14));

  if (!gameState.netHackActive && gameState.activeCamIndex < 0) {
    dom.statusMode.textContent = gameState.isCrouching
      ? 'AGACHADO'
      : gameState.isSprinting
      ? 'CORRENDO'
      : 'FURTIVO';
  }

  const currentSpeed = gameState.isCrouching
    ? PLAYER_CROUCH_SPEED
    : gameState.isSprinting
    ? PLAYER_SPRINT_SPEED
    : PLAYER_SPEED;

  if (isMoving) {
    const yaw = gameState.cameraYaw;
    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    let moveX = forwardX * inputZ + rightX * inputX;
    let moveZ = forwardZ * inputZ + rightZ * inputX;
    const len = Math.hypot(moveX, moveZ) || 1;
    moveX /= len;
    moveZ /= len;

    const stepX = moveX * currentSpeed * dt;
    const stepZ = moveZ * currentSpeed * dt;

    // Tentativa separada nos eixos X e Z para deslizar suavemente nas paredes
    const pos = playerGroup.position;
    if (!checkCollision(pos.x + stepX, pos.z)) {
      pos.x += stepX;
    }
    if (!checkCollision(pos.x, pos.z + stepZ)) {
      pos.z += stepZ;
    }

    // Limites do mapa jogável
    pos.x = THREE.MathUtils.clamp(pos.x, -21, 21);
    pos.z = THREE.MathUtils.clamp(pos.z, -24.5, 29);

    // Rotação suave na direção do movimento
    const targetRot = Math.atan2(moveX, moveZ);
    let diff = targetRot - playerGroup.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    playerGroup.rotation.y += diff * Math.min(1, dt * 12);

    // Animação simples de caminhada/corrida nas pernas
    const swingFreq = gameState.isSprinting ? 18 : 12;
    const swingAmp = gameState.isSprinting ? 0.5 : 0.35;
    const swing = Math.sin(gameState.elapsedTime * swingFreq) * swingAmp;
    playerParts.legL.rotation.x = swing;
    playerParts.legR.rotation.x = -swing;
  } else {
    playerParts.legL.rotation.x = 0;
    playerParts.legR.rotation.x = 0;
  }
}

function checkCollision(x, z) {
  for (const col of colliders) {
    const b = col.box;
    const closestX = THREE.MathUtils.clamp(x, b.min.x, b.max.x);
    const closestZ = THREE.MathUtils.clamp(z, b.min.z, b.max.z);
    const dx = x - closestX;
    const dz = z - closestZ;
    if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) {
      return true;
    }
  }
  return false;
}

function updateCamera() {
  if (gameState.activeCamIndex >= 0) {
    const camObj = securityCameras[gameState.activeCamIndex];
    camera.position.copy(camObj.pos);
    const yaw = camObj.baseYaw + camObj.yawOffset;
    const pitch = camObj.basePitch + camObj.pitchOffset;
    const lookTarget = new THREE.Vector3(
      camObj.pos.x + Math.sin(yaw) * Math.cos(pitch) * 10,
      camObj.pos.y + Math.sin(pitch) * 10,
      camObj.pos.z + Math.cos(yaw) * Math.cos(pitch) * 10
    );
    camera.lookAt(lookTarget);
    return;
  }

  const target = new THREE.Vector3(
    playerGroup.position.x,
    playerGroup.position.y + (gameState.isCrouching ? 1.05 : 1.55),
    playerGroup.position.z
  );

  const dist = 5.4;
  const yaw = gameState.cameraYaw;
  const pitch = gameState.cameraPitch;

  const idealPos = new THREE.Vector3(
    target.x + Math.sin(yaw) * Math.cos(pitch) * dist,
    target.y + Math.sin(pitch) * dist,
    target.z + Math.cos(yaw) * Math.cos(pitch) * dist
  );

  // Raycast simples para evitar que a câmera atravesse muros
  const dir = idealPos.clone().sub(target).normalize();
  raycaster.set(target, dir);
  raycaster.far = dist;
  const hits = raycaster.intersectObjects(occluders, false);
  if (hits.length > 0) {
    const safeDist = Math.max(1.2, hits[0].distance - 0.35);
    camera.position.copy(target).addScaledVector(dir, safeDist);
  } else {
    camera.position.copy(idealPos);
  }

  camera.lookAt(target);
}

// ==========================================
// IA DOS GUARDAS, CÂMERAS ATIVAS E DETECÇÃO
// ==========================================
function updateElectricBoxes(dt) {
  electricBoxes.forEach((box) => {
    if (box.cooldown > 0) {
      box.cooldown = Math.max(0, box.cooldown - dt);
      if (box.cooldown === 0) {
        box.mesh.userData.normalMaterial.emissive.setHex(0xffaa00);
      }
    }

    if (box.sparkTimer > 0) {
      box.sparkTimer = Math.max(0, box.sparkTimer - dt);
      const posAttr = box.sparkPoints.geometry.getAttribute('position');
      for (let i = 0; i < box.sparkData.length; i++) {
        const s = box.sparkData[i];
        let x = posAttr.getX(i) + s.vx * dt;
        let y = posAttr.getY(i) + s.vy * dt;
        let z = posAttr.getZ(i) + s.vz * dt;
        if (y > box.mesh.position.y + 1.8) {
          x = box.mesh.position.x;
          y = box.mesh.position.y + 0.4;
          z = box.mesh.position.z;
        }
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;

      if (box.sparkTimer === 0) {
        box.sparkPoints.visible = false;
      }
    }
  });
}

function updateSecurityCameras(dt, playerPos, playerCenter) {
  let camSpotted = false;

  securityCameras.forEach((camObj, idx) => {
    if (camObj.disabledTimer > 0) {
      camObj.disabledTimer = Math.max(0, camObj.disabledTimer - dt);
      camObj.coneMesh.visible = false;
      if (camObj.disabledTimer === 0) {
        camObj.coneMesh.visible = true;
        camObj.mesh.userData.normalMaterial.emissive.setHex(0x00ff88);
      }
      return;
    }

    let yaw;
    if (gameState.activeCamIndex === idx) {
      yaw = camObj.baseYaw + camObj.yawOffset;
    } else {
      camObj.sweepPhase += dt * 0.65;
      yaw = camObj.baseYaw + Math.sin(camObj.sweepPhase) * 0.6;
    }
    camObj.currentYaw = yaw;
    camObj.mesh.rotation.y = yaw;
    camObj.coneMesh.rotation.z = yaw;

    // Verificar se o jogador está no cone verde da câmera
    const camForward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const toPlayer = playerPos.clone().sub(camObj.pos);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    let seesPlayer = false;
    if (dist <= camObj.visionRange && dist > 0.2) {
      const angle = Math.acos(THREE.MathUtils.clamp(camForward.dot(toPlayer.normalize()), -1, 1));
      if (angle <= camObj.visionHalfAngle) {
        const rayDir = playerCenter.clone().sub(camObj.pos).normalize();
        raycaster.set(camObj.pos, rayDir);
        raycaster.far = Math.max(0.1, camObj.pos.distanceTo(playerCenter) - 0.3);
        const blocked = raycaster.intersectObjects(occluders, false);
        if (blocked.length === 0) {
          seesPlayer = true;
        }
      }
    }

    if (seesPlayer) {
      camSpotted = true;
      camObj.coneMat.color.setHex(0xff0055);
      camObj.coneMat.opacity = 0.35;
    } else {
      camObj.coneMat.color.setHex(0x00ff88);
      camObj.coneMat.opacity = 0.18;
    }
  });

  return camSpotted;
}

function updateGuards(dt) {
  const playerPos = playerGroup.position;
  const playerCenter = new THREE.Vector3(
    playerPos.x,
    gameState.isCrouching ? 0.58 : 1.05,
    playerPos.z
  );

  let spottedThisFrame = updateSecurityCameras(dt, playerPos, playerCenter);

  const rangeDelta = gameState.isSprinting ? 3.0 : gameState.isCrouching ? -1.5 : 0;

  guards.forEach((g) => {
    // Investigação de caixa elétrica ou patrulha normal
    if (g.investigateTimer > 0 && g.investigateTarget) {
      g.investigateTimer = Math.max(0, g.investigateTimer - dt);
      const toInv = g.investigateTarget.clone().sub(g.mesh.position);
      toInv.y = 0;
      const distInv = toInv.length();
      if (distInv > 1.7) {
        toInv.normalize();
        g.mesh.position.addScaledVector(toInv, g.speed * 1.15 * dt);
        const desiredYaw = Math.atan2(toInv.x, toInv.z);
        let diff = desiredYaw - g.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        g.mesh.rotation.y += diff * Math.min(1, dt * 8);
      }
      if (g.investigateTimer === 0) {
        g.investigateTarget = null;
      }
    } else {
      // Patrulha ida e volta
      const target = g.waypoints[g.currentTarget];
      const toTarget = target.clone().sub(g.mesh.position);
      toTarget.y = 0;
      const distToWp = toTarget.length();

      if (distToWp < 0.2) {
        g.currentTarget = (g.currentTarget + 1) % g.waypoints.length;
      } else {
        toTarget.normalize();
        g.mesh.position.addScaledVector(toTarget, g.speed * dt);
        const desiredYaw = Math.atan2(toTarget.x, toTarget.z);
        let diff = desiredYaw - g.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        g.mesh.rotation.y += diff * Math.min(1, dt * 8);
      }
    }

    // Checar se o jogador está no cone de visão + linha de visão livre
    const guardForward = new THREE.Vector3(
      Math.sin(g.mesh.rotation.y),
      0,
      Math.cos(g.mesh.rotation.y)
    );
    const toPlayer = playerPos.clone().sub(g.mesh.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();
    const effectiveRange = g.visionRange + rangeDelta;

    let guardSeesPlayer = false;
    if (distToPlayer <= effectiveRange && distToPlayer > 0.1) {
      const dirFlat = toPlayer.clone().normalize();
      const angle = Math.acos(THREE.MathUtils.clamp(guardForward.dot(dirFlat), -1, 1));
      if (angle <= g.visionHalfAngle) {
        // Raycast de oclusão (caixas/muros bloqueiam visão)
        const eyePos = new THREE.Vector3(g.mesh.position.x, 1.45, g.mesh.position.z);
        const rayDir = playerCenter.clone().sub(eyePos).normalize();
        raycaster.set(eyePos, rayDir);
        raycaster.far = Math.max(0.1, eyePos.distanceTo(playerCenter) - 0.25);
        const blocked = raycaster.intersectObjects(occluders, false);
        if (blocked.length === 0) {
          guardSeesPlayer = true;
        }
      }
    }

    if (guardSeesPlayer) {
      spottedThisFrame = true;
      g.coneMat.color.setHex(0xff0055);
      g.coneMat.opacity = 0.42;
    } else {
      g.coneMat.color.setHex(0xffd000);
      g.coneMat.opacity = 0.24;
    }
  });

  if (spottedThisFrame) {
    gameState.detectionLevel = Math.min(100, gameState.detectionLevel + dt * 88);
  } else {
    gameState.detectionLevel = Math.max(0, gameState.detectionLevel - dt * 38);
  }

  if (gameState.detectionLevel > 0) {
    dom.detectionContainer.classList.remove('hidden');
    dom.detectionBar.style.width = `${gameState.detectionLevel}%`;
    dom.alertVignette.classList.toggle('hidden', gameState.detectionLevel < 35);
  } else {
    dom.detectionContainer.classList.add('hidden');
    dom.alertVignette.classList.add('hidden');
  }

  if (gameState.detectionLevel >= 100) {
    triggerGameOver();
  }
}

// ==========================================
// FLUXO DA MISSÃO E INTERAÇÕES CONTÍNUAS
// ==========================================
function setMissionState(newState) {
  gameState.mission = newState;

  if (newState === MISSION_STATE.INFILTRATE) {
    dom.missionObjective.textContent = 'HACKEIE O PORTÃO DE ENTRADA';
    dom.missionSub.textContent = 'Aproxime-se do painel na entrada e pressione [E]';
  } else if (newState === MISSION_STATE.STEAL_DATA) {
    dom.missionObjective.textContent = 'BAIXE OS DADOS DO SERVIDOR CENTRAL';
    dom.missionSub.textContent = 'Use cobertura [V / C] contra os guardas e segure [E] no servidor';
  } else if (newState === MISSION_STATE.ESCAPE) {
    dom.missionObjective.textContent = 'FUJA PARA A ZONA DE EXTRAÇÃO';
    dom.missionSub.textContent = 'Corra até o anel verde na rua para concluir a missão';
  }
}

function updateInteractionsAndMission(dt) {
  // Animação de abertura do portão
  if (gameState.gateUnlocked && gameState.gateOpenProgress < 1) {
    gameState.gateOpenProgress = Math.min(1, gameState.gateOpenProgress + dt * 1.4);
    gateMesh.position.x = THREE.MathUtils.lerp(0, -6.1, gameState.gateOpenProgress);
  }

  // Rotação do núcleo do servidor e pulso da zona de extração
  serverCoreMesh.rotation.y += dt * 1.6;
  serverCoreMesh.rotation.x += dt * 0.9;
  const pulse = 1 + Math.sin(gameState.elapsedTime * 4) * 0.08;
  extractionRing.scale.set(pulse, pulse, 1);

  // Timer do minigame de terminal
  if (gameState.terminalOpen) {
    if (gameState.hackTimeLeft > 0) {
      gameState.hackTimeLeft -= dt;
      dom.hackTimer.textContent = `${Math.max(0, gameState.hackTimeLeft).toFixed(1)}s`;
      if (gameState.hackTimeLeft <= 0) {
        dom.hackFeedback.textContent = '> TEMPO ESGOTADO // TENTE NOVAMENTE';
        dom.hackFeedback.style.color = '#ff0055';
        setTimeout(() => {
          if (gameState.terminalOpen) closeGateTerminal();
        }, 600);
      }
    }
    return;
  }

  const pPos = playerGroup.position;
  let promptText = '';

  // Prompt do painel do portão
  if (!gameState.gateUnlocked && pPos.distanceTo(gatePanelMesh.position) < 3.6) {
    promptText = '[E] HACKEAR PAINEL DO PORTÃO';
  }

  // Prompt de caixas elétricas (perto ou mirando na Visão NetHack)
  if (!promptText && gameState.activeCamIndex < 0) {
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    for (const box of electricBoxes) {
      const distBox = pPos.distanceTo(box.mesh.position);
      const toBox = box.mesh.position.clone().sub(camera.position).normalize();
      const lookingInNetHack = gameState.netHackActive && distBox < 28 && camDir.dot(toBox) > 0.90;
      if (distBox < 3.6 || lookingInNetHack) {
        promptText =
          box.cooldown > 0
            ? `CAIXA ELÉTRICA EM RECARGA (${Math.ceil(box.cooldown)}s)`
            : '[E] SOBRECARREGAR CAIXA ELÉTRICA (DISTRAÇÃO)';
        break;
      }
    }
  }

  // Firewall e Download dos dados no Servidor Central
  if (gameState.mission === MISSION_STATE.STEAL_DATA) {
    const distServer = pPos.distanceTo(serverMesh.position);
    if (distServer < 3.8 && gameState.activeCamIndex < 0) {
      if (!gameState.serverFirewallDisabled) {
        promptText = '[E] DESATIVAR FIREWALL DO SERVIDOR';
        dom.downloadContainer.classList.add('hidden');
      } else {
        promptText = '[SEGURE E] BAIXAR DADOS ctOS';
        dom.downloadContainer.classList.remove('hidden');

        if (gameState.keys['KeyE']) {
          gameState.downloadProgress = Math.min(
            100,
            gameState.downloadProgress + (100 / DOWNLOAD_DURATION) * dt
          );
        } else {
          gameState.downloadProgress = Math.max(0, gameState.downloadProgress - dt * 10);
        }

        const pct = Math.floor(gameState.downloadProgress);
        dom.downloadBar.style.width = `${pct}%`;
        dom.downloadPercent.textContent = `${pct}%`;

        if (gameState.downloadProgress >= 100) {
          dom.downloadContainer.classList.add('hidden');
          serverMesh.userData.normalMaterial.emissive.setHex(0x00ff88);
          setMissionState(MISSION_STATE.ESCAPE);
        }
      }
    } else {
      dom.downloadContainer.classList.add('hidden');
    }
  }

  // Verificar chegada na Zona de Extração
  if (gameState.mission === MISSION_STATE.ESCAPE) {
    const distExtract = Math.hypot(
      pPos.x - extractionZoneGroup.position.x,
      pPos.z - extractionZoneGroup.position.z
    );
    if (distExtract < 2.8) {
      triggerVictory();
      return;
    }
  }

  if (promptText) {
    dom.interactPrompt.textContent = promptText;
    dom.interactPrompt.classList.remove('hidden');
  } else {
    dom.interactPrompt.classList.add('hidden');
  }
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

// ==========================================
// CONTROLE DE TELAS E CICLO PRINCIPAL
// ==========================================
function resetWorldState() {
  gameState.elapsedTime = 0;
  gameState.gateUnlocked = false;
  gameState.gateOpenProgress = 0;
  gameState.serverFirewallDisabled = false;
  gameState.terminalOpen = false;
  gameState.terminalTarget = 'GATE';
  gameState.downloadProgress = 0;
  gameState.detectionLevel = 0;
  gameState.isSprinting = false;
  gameState.isCrouching = false;
  gameState.cameraYaw = 0;
  gameState.cameraPitch = 0.34;
  gameState.keys = {};

  if (gameState.netHackActive) toggleNetHack(false);
  if (gameState.activeCamIndex >= 0) cycleSecurityCamera(-1);

  playerGroup.position.set(0, 0, 14);
  playerGroup.rotation.y = 0;
  playerGroup.scale.y = 1;

  // Restaurar portão e colisor caso tenha sido aberto
  gateMesh.position.set(0, 2.2, 6);
  gateMesh.userData.normalMaterial.emissive.setHex(0xff0055);
  if (gateMesh.userData.edgesMaterial) {
    gateMesh.userData.edgesMaterial.color.setHex(0xff0055);
  }
  gatePanelMesh.userData.normalMaterial.emissive.setHex(0x00f0ff);
  serverMesh.userData.normalMaterial.emissive.setHex(0xff0055);

  if (!colliders.some((c) => c.isGate)) {
    gateMesh.updateMatrixWorld(true);
    colliders.push({ box: new THREE.Box3().setFromObject(gateMesh), mesh: gateMesh, isGate: true });
  }
  if (!occluders.includes(gateMesh)) {
    occluders.push(gateMesh);
  }

  // Resetar guardas, câmeras e caixas elétricas
  guards.forEach((g) => {
    g.mesh.position.copy(g.initialPos);
    g.currentTarget = 1;
    g.investigateTarget = null;
    g.investigateTimer = 0;
    g.coneMat.color.setHex(0xffd000);
    g.coneMat.opacity = 0.24;
  });

  securityCameras.forEach((camObj, idx) => {
    camObj.disabledTimer = 0;
    camObj.sweepPhase = idx * 1.5;
    camObj.coneMesh.visible = true;
    camObj.coneMat.color.setHex(0x00ff88);
    camObj.coneMat.opacity = 0.18;
    camObj.mesh.userData.normalMaterial.emissive.setHex(0x00ff88);
  });

  electricBoxes.forEach((box) => {
    box.cooldown = 0;
    box.sparkTimer = 0;
    box.sparkPoints.visible = false;
    box.mesh.userData.normalMaterial.emissive.setHex(0xffaa00);
  });

  dom.detectionContainer.classList.add('hidden');
  dom.downloadContainer.classList.add('hidden');
  dom.alertVignette.classList.add('hidden');
  dom.interactPrompt.classList.add('hidden');
  dom.terminalModal.classList.add('hidden');
  dom.statusTimer.textContent = '00:00';
}

function startMission() {
  resetWorldState();
  dom.startScreen.classList.add('hidden');
  dom.gameoverScreen.classList.add('hidden');
  dom.victoryScreen.classList.add('hidden');
  dom.hud.classList.remove('hidden');

  setMissionState(MISSION_STATE.INFILTRATE);
  dom.canvas.requestPointerLock();
}

function restartMission() {
  startMission();
}

function triggerGameOver() {
  gameState.mission = MISSION_STATE.GAMEOVER;
  if (document.pointerLockElement === dom.canvas) {
    document.exitPointerLock();
  }
  dom.hud.classList.add('hidden');
  dom.alertVignette.classList.add('hidden');
  dom.gameoverScreen.classList.remove('hidden');
}

function triggerVictory() {
  gameState.mission = MISSION_STATE.VICTORY;
  if (document.pointerLockElement === dom.canvas) {
    document.exitPointerLock();
  }
  dom.hud.classList.add('hidden');
  dom.finalTime.textContent = formatTime(gameState.elapsedTime);
  dom.victoryScreen.classList.remove('hidden');
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateVisualEffects(dt, nowSec) {
  if (serverParticles) {
    const posAttr = serverParticles.geometry.getAttribute('position');
    for (let i = 0; i < serverParticleData.length; i++) {
      const p = serverParticleData[i];
      let y = posAttr.getY(i) + p.speed * dt;
      if (y > 4.9) y = 0.4;
      const swayX = p.baseX + Math.sin(nowSec * 1.8 + p.phase) * 0.14;
      const swayZ = p.baseZ + Math.cos(nowSec * 1.6 + p.phase) * 0.14;
      posAttr.setXYZ(i, swayX, y, swayZ);
    }
    posAttr.needsUpdate = true;
  }

  if (extractionBeam) {
    extractionBeam.material.opacity = 0.13 + Math.sin(nowSec * 3.2) * 0.04;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const nowSec = clock.elapsedTime;

  updateVisualEffects(dt, nowSec);

  const isPlaying =
    gameState.mission === MISSION_STATE.INFILTRATE ||
    gameState.mission === MISSION_STATE.STEAL_DATA ||
    gameState.mission === MISSION_STATE.ESCAPE;

  if (isPlaying) {
    gameState.elapsedTime += dt;
    dom.statusTimer.textContent = formatTime(gameState.elapsedTime);

    updatePlayer(dt);
    updateElectricBoxes(dt);
    updateGuards(dt);
    updateInteractionsAndMission(dt);
  }

  updateCamera();
  renderer.render(scene, camera);
}

// ==========================================
// BOOTSTRAP
// ==========================================
initThree();
setupInputs();
animate();
