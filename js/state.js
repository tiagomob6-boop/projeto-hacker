import * as THREE from 'three';

// ==========================================
// CONSTANTES E ESTADO GLOBAL
// ==========================================
export const MISSION_STATE = {
  FREE_ROAM: 'FREE_ROAM',
  IDLE: 'IDLE',
  INFILTRATE: 'INFILTRATE',
  STEAL_DATA: 'STEAL_DATA',
  ESCAPE: 'ESCAPE',
  VICTORY: 'VICTORY',
  GAMEOVER: 'GAMEOVER'
};

export const GUARD_STATE = {
  PATROL: 'PATROL',
  INVESTIGATE: 'INVESTIGATE',
  DISTRACTED: 'DISTRACTED',
  STUNNED: 'STUNNED',
  COMBAT: 'COMBAT',
  DEAD: 'DEAD'
};

export const WEAPON_TYPE = {
  TASER: 'TASER',
  PISTOL: 'PISTOL',
  RIFLE: 'RIFLE',
  EMP: 'EMP'
};

export const WEAPON_CONFIG = {
  TASER: { key: 'TASER', label: '[1] TASER', cooldown: 1.5, damage: 0, speed: 46, color: 0x00f0ff, noiseRadius: 10 },
  PISTOL: { key: 'PISTOL', label: '[2] 9MM SIL.', cooldown: 0.35, damage: 50, speed: 60, color: 0x88ffff, noiseRadius: 0 },
  RIFLE: { key: 'RIFLE', label: '[3] RIFLE', cooldown: 0.14, damage: 35, speed: 66, color: 0xffaa00, noiseRadius: 26 },
  EMP: { key: 'EMP', label: '[4] EMP', cooldown: 12.0, damage: 0, speed: 0, color: 0x00f0ff, noiseRadius: 22 }
};

export const TASER_COOLDOWN = WEAPON_CONFIG.TASER.cooldown;
export const EMP_COOLDOWN = WEAPON_CONFIG.EMP.cooldown;

export const WORLD_BOUNDS = { minX: -1200, maxX: 1200, minZ: -1400, maxZ: 1400 };
export const DOCKS_OFFSET_X = 445;

export const MAPS_CONFIG = {
  COMPLEXO_CTOS: {
    key: 'COMPLEXO_CTOS',
    label: 'MISSÃO 01 // COMPLEXO ctOS',
    desc: 'Infiltre-se no Complexo ctOS do Centro Urbano, desative o firewall do servidor central e fuja para a praça.',
    bounds: WORLD_BOUNDS,
    radarScale: 1.5,
    playerStart: [0, 0, 52],
    markerPos: [0, 0.06, 15],
    extractPos: [0, 0.04, 52],
    serverPos: [0, 1.65, -40],
    gates: [
      { x: 0, y: 2.2, z: 8, w: 7, h: 4.4, d: 0.6, panelPos: [4.8, 0.75, 9.0], openX: -7.2 }
    ],
    cameras: [
      { name: 'CAM_01 // GUARITA_ENTRADA', pos: [-26.5, 4.8, 4], baseYaw: -2.15, basePitch: -0.35 },
      { name: 'CAM_02 // ALA_OESTE', pos: [-26.5, 4.8, -28], baseYaw: -0.85, basePitch: -0.35 },
      { name: 'CAM_03 // ALA_LESTE', pos: [26.5, 4.8, -24], baseYaw: 1.95, basePitch: -0.32 }
    ],
    electricBoxes: [
      { name: 'CAIXA_ALA_OESTE', pos: [-20, 0.85, -4] },
      { name: 'CAIXA_ALA_LESTE', pos: [20, 0.85, -26] }
    ],
    guards: [
      { waypoints: [[-22, 0, 2], [-22, 0, -36], [-6, 0, -36], [-6, 0, 2]], speed: 2.9, visionRange: 22 },
      { waypoints: [[22, 0, -36], [22, 0, 2], [6, 0, 2], [6, 0, -36]], speed: 3.1, visionRange: 22 },
      { waypoints: [[-14, 0, -42], [14, 0, -42], [14, 0, -14], [-14, 0, -14]], speed: 3.2, visionRange: 22 }
    ]
  },
  DOCAS_BAIA_SF: {
    key: 'DOCAS_BAIA_SF',
    label: 'MISSÃO 02 // DOCAS DA BAÍA SF',
    desc: 'Atravesse a baía até o terminal portuário, passe pelas 2 barreiras e invada o cargueiro da Blume.',
    bounds: WORLD_BOUNDS,
    radarScale: 1.5,
    playerStart: [DOCKS_OFFSET_X, 0, 62],
    markerPos: [DOCKS_OFFSET_X - 28, 0.06, 35],
    extractPos: [DOCKS_OFFSET_X, 0.04, 72],
    serverPos: [DOCKS_OFFSET_X, 1.65, -42],
    gates: [
      { x: DOCKS_OFFSET_X, y: 2.2, z: 18, w: 7, h: 4.4, d: 0.6, panelPos: [DOCKS_OFFSET_X + 4.8, 0.75, 19.0], openX: DOCKS_OFFSET_X - 7.2 },
      { x: DOCKS_OFFSET_X, y: 2.2, z: -24, w: 7, h: 4.4, d: 0.6, panelPos: [DOCKS_OFFSET_X - 4.8, 0.75, -23.0], openX: DOCKS_OFFSET_X + 7.2 }
    ],
    cameras: [
      { name: 'CAM_01 // ENTRADA_DOCAS', pos: [DOCKS_OFFSET_X - 32, 5.0, 14], baseYaw: -2.0, basePitch: -0.35 },
      { name: 'CAM_02 // PATIO_CONTEINERES', pos: [DOCKS_OFFSET_X + 32, 5.0, -6], baseYaw: 2.1, basePitch: -0.35 },
      { name: 'CAM_03 // CONVES_BLUME', pos: [DOCKS_OFFSET_X - 18, 5.2, -32], baseYaw: -2.35, basePitch: -0.32 }
    ],
    electricBoxes: [
      { name: 'CAIXA_DOCA_OESTE', pos: [DOCKS_OFFSET_X - 24, 0.85, 4] },
      { name: 'CAIXA_DOCA_LESTE', pos: [DOCKS_OFFSET_X + 24, 0.85, -14] }
    ],
    guards: [
      { waypoints: [[DOCKS_OFFSET_X - 30, 0, 10], [DOCKS_OFFSET_X + 30, 0, 10], [DOCKS_OFFSET_X + 30, 0, -6], [DOCKS_OFFSET_X - 30, 0, -6]], speed: 2.8, visionRange: 22 },
      { waypoints: [[DOCKS_OFFSET_X + 30, 0, -16], [DOCKS_OFFSET_X - 30, 0, -16], [DOCKS_OFFSET_X - 30, 0, 2], [DOCKS_OFFSET_X + 30, 0, 2]], speed: 3.1, visionRange: 22 },
      { waypoints: [[DOCKS_OFFSET_X - 16, 0, -30], [DOCKS_OFFSET_X + 16, 0, -30], [DOCKS_OFFSET_X + 16, 0, -44], [DOCKS_OFFSET_X - 16, 0, -44]], speed: 3.2, visionRange: 22 },
      { waypoints: [[DOCKS_OFFSET_X - 14, 0, 26], [DOCKS_OFFSET_X + 14, 0, 26], [DOCKS_OFFSET_X + 14, 0, 34], [DOCKS_OFFSET_X - 14, 0, 34]], speed: 2.7, visionRange: 22 }
    ]
  }
};

export const HACK_CODES = [
  'OVERRIDE_GATE_77',
  'BYPASS_CTOS_404',
  'ROOT_ACCESS_88',
  'DECRYPT_NODE_19',
  'UNLOCK_SECTOR_09',
  'INJECT_DEDSEC_21',
  'BREACH_PROXY_64',
  'SPOOF_TOKEN_33'
];

export const FIREWALL_CODES = [
  'BYPASS_FW_99',
  'KILL_DAEMON_04',
  'CRACK_AES_256',
  'PURGE_TRACE_71',
  'SUDO_DUMP_42',
  'DROP_FILTER_18'
];

export const PLAYER_RADIUS = 0.55;
export const PLAYER_SPEED = 7.4;
export const PLAYER_SPRINT_SPEED = 11.2;
export const PLAYER_CROUCH_SPEED = 4.5;
export const GATE_HACK_TIME = 10.0;
export const FIREWALL_HACK_TIME = 8.5;
export const DOWNLOAD_DURATION = 3.5;
export const CAMERA_OVERLOAD_DURATION = 15.0;
export const ELECTRIC_COOLDOWN = 12.0;
export const ELECTRIC_INVESTIGATE_TIME = 6.0;
export const BASE_AMBIENT_INTENSITY = 2.15;

export const DIFFICULTY_PRESETS = {
  INICIANTE: {
    label: 'INICIANTE',
    guardSpeedMult: 0.85,
    camSweepSpeed: 0.55,
    gateTime: 12.0,
    firewallTime: 10.5
  },
  DEDSEC_ELITE: {
    label: 'DEDSEC ELITE',
    guardSpeedMult: 1.28,
    camSweepSpeed: 1.05,
    gateTime: 7.0,
    firewallTime: 6.5
  }
};

// Referências DOM
export const dom = {
  canvas: document.getElementById('game-canvas'),
  hud: document.getElementById('hud'),
  startScreen: document.getElementById('start-screen'),
  gameoverScreen: document.getElementById('gameover-screen'),
  victoryScreen: document.getElementById('victory-screen'),
  terminalModal: document.getElementById('terminal-modal'),
  nethackOverlay: document.getElementById('nethack-overlay'),
  cameraOverlay: document.getElementById('camera-overlay'),
  alertVignette: document.getElementById('alert-vignette'),
  damageFlash: document.getElementById('damage-flash'),
  baseAlertBanner: document.getElementById('base-alert-banner'),
  missionObjective: document.getElementById('mission-objective'),
  missionSub: document.getElementById('mission-sub'),
  statusMode: document.getElementById('status-mode'),
  statusTimer: document.getElementById('status-timer'),
  statusMoney: document.getElementById('status-money'),
  statusHp: document.getElementById('status-hp'),
  missionModal: document.getElementById('mission-modal'),
  missionModalTitle: document.getElementById('mission-modal-title'),
  missionModalDesc: document.getElementById('mission-modal-desc'),
  btnAcceptMission: document.getElementById('btn-accept-mission'),
  btnCancelMission: document.getElementById('btn-cancel-mission'),
  finalReward: document.getElementById('final-reward'),
  hpBar: document.getElementById('hp-bar'),
  statusWeapon: document.getElementById('status-weapon'),
  gameoverTitle: document.getElementById('gameover-title'),
  gameoverDesc: document.getElementById('gameover-desc'),
  weaponCooldownBar: document.getElementById('weapon-cooldown-bar'),
  weaponCooldownFill: document.getElementById('weapon-cooldown-fill'),
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
  btnMute: document.getElementById('btn-mute'),
  radarCanvas: document.getElementById('radar-canvas'),
  nethackLabels: document.getElementById('nethack-labels'),
  finalRank: document.getElementById('final-rank'),
  finalTime: document.getElementById('final-time'),
  finalDetection: document.getElementById('final-detection'),
  finalHacks: document.getElementById('final-hacks'),
  finalMap: document.getElementById('final-map'),
  finalDifficulty: document.getElementById('final-difficulty'),
  mapButtons: document.querySelectorAll('.map-btn'),
  diffButtons: document.querySelectorAll('.diff-btn'),
  btnStart: document.getElementById('btn-start'),
  btnRetryGameover: document.getElementById('btn-retry-gameover'),
  btnRetryVictory: document.getElementById('btn-retry-victory')
};

// Variáveis Three.js

export const refs = {
  scene: null,
  camera: null,
  renderer: null,
  clock: null,
  worldGroup: null,
  skyDome: null,
  ambientLight: null,
  dirLight: null,
  playerGroup: null,
  playerParts: {},
  gateMesh: null,
  gatePanelMesh: null,
  serverMesh: null,
  serverCoreMesh: null,
  extractionZoneGroup: null,
  extractionRing: null,
  extractionBeam: null,
  networkLinesGroup: null,
  serverParticles: null,
  waterMesh: null,
  waterTexture: null,
  dedsecCar: null,
  onFirewallDisabled: null,
  onAcceptMission: null
};

export const serverParticleData = [];

// Listas de mundo e gameplay
export const colliders = [];   // { box: THREE.Box3, mesh, isGate?: boolean, gateIndex?: number }
export const occluders = [];   // Meshes que bloqueiam visão dos guardas
export const structureMeshes = []; // Meshes afetados pelo wireframe NetHack
export const hackableMeshes = [];  // Dispositivos destacáveis no NetHack
export const securityCameras = []; // { id, name, mesh, pos, baseYaw, basePitch, yawOffset, pitchOffset, coneMesh, coneMat, disabledTimer, sweepPhase, currentYaw }
export const guards = [];          // { mesh, waypoints, currentTarget, speed, visionRange, visionHalfAngle, coneMesh, coneMat, state, lastKnownPos, lookAroundTimer, lookBaseYaw, investigateTarget, investigateTimer }
export const electricBoxes = [];   // { id, name, mesh, cooldown, sparkTimer, sparkPoints, sparkData }
export const radarCrates = [];     // { x, z, w, d } para planta baixa do radar
export const radarBuildings = [];  // { x, z, w, d } para quarteirões laterais no radar
export const radarWalls = [];      // { x1, z1, x2, z2 } para paredes no radar
export const gates = [];           // { gateMesh, panelMesh, unlocked, openProgress, initialX, openX }
export const cars = [];            // { mesh, colliderObj, initialPos, initialYaw, isDedsec, speed, hackedTimer, hackedUsed, headlight }
export const boats = [];           // { id, mesh, initialPos, initialYaw, speed, wakePoints, wakeData }
export const projectiles = [];     // { mesh, line, origin, pos, dir, speed, life, damage, isTaser }
export const guardProjectiles = []; // { mesh, pos, dir, speed, life }
export const empWaves = [];        // { mesh, mat, radius, maxRadius }
export const impactFlashes = [];   // { light, life }
export const blinkingLights = [];  // { mat, phase }
export const sirenLights = [];     // { blueMat, redMat, phase }
export const netHackTagItems = []; // { el, getPos, getText }
export const missionMarkers = [];  // { key, ring, beam }
export const missionServers = {};  // { COMPLEXO_CTOS: { mesh, core, particles, particleData }, DOCAS_BAIA_SF: ... }
export const missionExtractions = {}; // { COMPLEXO_CTOS: { group, ring, beam }, DOCAS_BAIA_SF: ... }

// Estado do jogo
export const gameState = {
  mission: MISSION_STATE.FREE_ROAM,
  selectedMap: 'COMPLEXO_CTOS',
  activeMissionKey: null,
  pendingMissionKey: null,
  missionModalOpen: false,
  markerCooldown: 0,
  money: 500,
  difficulty: 'INICIANTE',
  activeGateIndex: 0,
  elapsedTime: 0,
  hp: 100,
  damageFlashTimer: 0,
  baseAlert: false,
  mouseDown: false,
  netHackActive: false,
  activeCamIndex: -1, // -1 = câmera 3ª pessoa do jogador
  drivingCar: null,
  drivingBoat: null,
  equippedWeapon: WEAPON_TYPE.TASER,
  weaponCooldown: 0,
  taserCooldown: 0,
  empCooldown: 0,
  gateUnlocked: false,
  gateOpenProgress: 0,
  serverFirewallDisabled: false,
  terminalOpen: false,
  terminalTarget: 'GATE',
  hackTimeLeft: GATE_HACK_TIME,
  hackCode: '',
  downloadProgress: 0,
  detectionLevel: 0,
  maxDetection: 0,
  hacksUsed: 0,
  isSprinting: false,
  isCrouching: false,
  cameraYaw: 0,
  cameraPitch: 0.34,
  keys: {}
};

export const raycaster = new THREE.Raycaster();

// ==========================================
// TEXTURAS PROCEDURAIS (HTML5 CANVAS -> CanvasTexture)

export function getSurfaceHeight(x, z) {
  // Ponte Golden Gate atravessável (X: 80..400, Z: 26..44)
  if (z >= 26.5 && z <= 43.5 && x >= 78 && x <= 402) {
    if (x <= 80) return 0;
    if (x < 120) return ((x - 80) / 40) * 10;
    if (x <= 360) return 10;
    if (x <= 400) return ((400 - x) / 40) * 10;
    return 0;
  }
  // Píer de embarque Oeste (X: 64..76, Z: 57..67)
  if (z >= 57 && z <= 67 && x >= 64 && x <= 76) {
    if (x <= 68) return ((x - 64) / 4) * -0.35;
    return -0.35;
  }
  // Píer de embarque Leste (X: 394..404, Z: 57..67)
  if (z >= 57 && z <= 67 && x >= 394 && x <= 404) {
    if (x >= 400) return ((404 - x) / 4) * -0.35;
    return -0.35;
  }
  return 0;
}

export function createHackableDevice(w, h, d, x, y, z, glowColor, name) {
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
  refs.worldGroup.add(mesh);

  mesh.updateMatrixWorld(true);
  colliders.push({ box: new THREE.Box3().setFromObject(mesh), mesh });
  hackableMeshes.push(mesh);
  return mesh;
}

// ==========================================
// CARROS 3D PROCEDURAIS (ESTACIONADOS + DEDSEC)

export function isWaterArea(x, z) {
  // Centro Urbano (X: -82..68, Z: -90..95)
  if (x >= -82 && x <= 68 && z >= -90 && z <= 95) return false;
  // Docas da Baía SF (X: 400..490, Z: -56..86)
  if (x >= 400 && x <= 490 && z >= -56 && z <= 86) return false;
  // Píeres de embarque
  if (z >= 57 && z <= 67 && ((x >= 64 && x <= 76) || (x >= 394 && x <= 404))) return false;
  return true;
}

export function checkCollision(x, z, radius = PLAYER_RADIUS, ignoreCar = null) {
  for (const col of colliders) {
    if (ignoreCar && col === ignoreCar.colliderObj) continue;
    const b = col.box;
    const closestX = THREE.MathUtils.clamp(x, b.min.x, b.max.x);
    const closestZ = THREE.MathUtils.clamp(z, b.min.z, b.max.z);
    const dx = x - closestX;
    const dz = z - closestZ;
    if (dx * dx + dz * dz < radius * radius) {
      return true;
    }
  }
  return false;
}

export function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

// ==========================================
// CONTROLE DE TELAS E CICLO PRINCIPAL
