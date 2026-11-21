import * as THREE from 'three';

// ==========================================
// CONSTANTES E ESTADO GLOBAL
// ==========================================
export const MISSION_STATE = {
  FREE_ROAM: 'FREE_ROAM',
  IDLE: 'IDLE',
  INFILTRATE: 'INFILTRATE',
  STEAL_DATA: 'STEAL_DATA',
  STEAL_CAR: 'STEAL_CAR',
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
  EMP: 'EMP',
  SHOTGUN: 'SHOTGUN'
};

export const WEAPON_CONFIG = {
  TASER: { key: 'TASER', label: '[1] TASER', cooldown: 1.5, damage: 0, speed: 46, color: 0x00f0ff, noiseRadius: 10 },
  PISTOL: { key: 'PISTOL', label: '[2] 9MM SIL.', cooldown: 0.35, damage: 50, speed: 60, color: 0x88ffff, noiseRadius: 0 },
  RIFLE: { key: 'RIFLE', label: '[3] RIFLE', cooldown: 0.14, damage: 35, speed: 66, color: 0xffaa00, noiseRadius: 26 },
  EMP: { key: 'EMP', label: '[4] EMP', cooldown: 12.0, damage: 0, speed: 0, color: 0x00f0ff, noiseRadius: 22 },
  SHOTGUN: { key: 'SHOTGUN', label: '[5] ESCOPETA', cooldown: 0.95, damage: 28, speed: 58, color: 0xff3366, noiseRadius: 28 }
};

export const SKINS_CATALOG = [
  { id: 'classic', name: 'Hacker Clássico Ciano', price: 0, jacket: 0x161c2e, inner: 0x0c111d, pants: 0x121826, cap: 0x151c2d, primary: 0x00f0ff, secondary: 0xff0055 },
  { id: 'samurai', name: 'Cyber Samurai Vermelho & Preto', price: 400, jacket: 0x140b10, inner: 0x2a0810, pants: 0x0d0d12, cap: 0x991b1b, primary: 0xff1144, secondary: 0xffaa00 },
  { id: 'ghost', name: 'Fantasma Branco & Dourado', price: 800, jacket: 0xe2e8f0, inner: 0xcbd5e1, pants: 0x334155, cap: 0xf8fafc, primary: 0xfbbf24, secondary: 0xffffff },
  { id: 'toxic', name: 'Infiltrador Tóxico Verde Neon', price: 650, jacket: 0x0f1f18, inner: 0x071510, pants: 0x111a16, cap: 0x14532d, primary: 0x00ff88, secondary: 0xa3e635 },
  { id: 'shadow', name: 'Operativo Shadow Roxo/Magenta', price: 1000, jacket: 0x1a102b, inner: 0x0e071a, pants: 0x120b20, cap: 0x3b0764, primary: 0xd946ef, secondary: 0x8b5cf6 }
];

export const VEHICLES_CATALOG = [
  { id: 'hatch_neon', name: 'Hatch Urbano Neon', price: 500, bodyType: 'HATCH', maxHp: 100, maxSpeed: 22, accel: 24, turnRate: 2.7, hasNitro: false, color: 0x1e3a5f, neon: 0x00f0ff, desc: 'Compacto ágil e econômico para manobras rápidas (100 HP).' },
  { id: 'dedsec_gt', name: 'Esportivo DedSec GT', price: 1400, bodyType: 'SPORT', maxHp: 120, maxSpeed: 31, accel: 30, turnRate: 2.4, hasNitro: false, color: 0x141928, neon: 0x00ff88, desc: 'Cupê de altíssima velocidade com aerodinâmica de corrida (120 HP).' },
  { id: 'ctos_suv', name: 'SUV Blindado ctOS', price: 2200, bodyType: 'SUV', maxHp: 280, maxSpeed: 21, accel: 20, turnRate: 1.95, hasNitro: false, color: 0x262f40, neon: 0xffaa00, desc: 'Blindagem pesada super resistente a tiros (280 HP).' },
  { id: 'hyper_x', name: 'Interceptor Hyper-X', price: 3200, bodyType: 'SPORT', maxHp: 160, maxSpeed: 34, accel: 34, turnRate: 2.6, hasNitro: true, color: 0x2b0a3d, neon: 0xff0055, desc: 'Protótipo com turbo e Nitro ativado com [Shift] (160 HP).' }
];

export const TASER_COOLDOWN = WEAPON_CONFIG.TASER.cooldown;
export const EMP_COOLDOWN = WEAPON_CONFIG.EMP.cooldown;

export const WORLD_BOUNDS = { minX: -30000, maxX: 30000, minZ: -30000, maxZ: 30000 };
export const DOCKS_OFFSET_X = 445;

export const MAPS_CONFIG = {
  COMPLEXO_CTOS: {
    key: 'COMPLEXO_CTOS',
    label: 'MISSÃO 01 // COMPLEXO ctOS',
    desc: 'Infiltre-se no Complexo ctOS do Centro Urbano, desative o firewall do servidor central e fuja para a praça.',
    bounds: WORLD_BOUNDS,
    radarScale: 0.95,
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
    radarScale: 0.95,
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
  },
  VIP_CAR_01: {
    key: 'VIP_CAR_01',
    isVehicleTheft: true,
    label: 'CONTRATO VEICULAR 01 // PROTÓTIPO BLUME',
    desc: 'Roube o Protótipo Esportivo Blume no pátio vigiado em Downtown e entregue-o intacto na Garagem Clandestina DedSec (Distrito Sul).',
    reward: 1800,
    bounds: WORLD_BOUNDS,
    radarScale: 0.95,
    playerStart: [-52, 0, -10],
    markerPos: [-52, 0.06, -18],
    extractPos: [-120, 0.06, 320],
    carSpawn: { x: -42, z: -24, yaw: Math.PI * 0.5, maxHp: 120, color: 0xcc22ff, name: 'Protótipo Esportivo Blume' },
    gates: [],
    cameras: [],
    electricBoxes: [],
    guards: [
      { waypoints: [[-50, 0, -18], [-34, 0, -18], [-34, 0, -30], [-50, 0, -30]], speed: 3.1, visionRange: 22 },
      { waypoints: [[-36, 0, -28], [-48, 0, -28], [-48, 0, -16], [-36, 0, -16]], speed: 3.3, visionRange: 22 }
    ]
  },
  VIP_CAR_02: {
    key: 'VIP_CAR_02',
    isVehicleTheft: true,
    label: 'CONTRATO VEICULAR 02 // SUV BLINDADO ctOS',
    desc: 'Roube o SUV Blindado ctOS (220 HP) no terminal portuário das Docas, escape pela ponte e entregue-o na Garagem Clandestina DedSec (Distrito Sul).',
    reward: 3000,
    bounds: WORLD_BOUNDS,
    radarScale: 0.95,
    playerStart: [DOCKS_OFFSET_X + 58, 0, 14],
    markerPos: [DOCKS_OFFSET_X + 64, 0.06, 14],
    extractPos: [-120, 0.06, 320],
    carSpawn: { x: DOCKS_OFFSET_X + 76, z: 14, yaw: -Math.PI * 0.5, maxHp: 220, color: 0x3b4252, name: 'SUV Blindado ctOS' },
    gates: [],
    cameras: [],
    electricBoxes: [],
    guards: [
      { waypoints: [[DOCKS_OFFSET_X + 68, 0, 6], [DOCKS_OFFSET_X + 84, 0, 6], [DOCKS_OFFSET_X + 84, 0, 22], [DOCKS_OFFSET_X + 68, 0, 22]], speed: 3.2, visionRange: 22 },
      { waypoints: [[DOCKS_OFFSET_X + 82, 0, 20], [DOCKS_OFFSET_X + 66, 0, 20], [DOCKS_OFFSET_X + 66, 0, 8], [DOCKS_OFFSET_X + 82, 0, 8]], speed: 3.4, visionRange: 22 }
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
  shopModal: document.getElementById('shop-modal'),
  shopTitle: document.getElementById('shop-title'),
  shopSubtitle: document.getElementById('shop-subtitle'),
  shopMoney: document.getElementById('shop-money'),
  shopItems: document.getElementById('shop-items'),
  btnCloseShop: document.getElementById('btn-close-shop'),
  finalReward: document.getElementById('final-reward'),
  hpBar: document.getElementById('hp-bar'),
  statusWeapon: document.getElementById('status-weapon'),
  statusCamera: document.getElementById('status-camera'),
  wantedStars: document.getElementById('wanted-stars'),
  wantedStatus: document.getElementById('wanted-status'),
  ctosRevealBanner: document.getElementById('ctos-reveal-banner'),
  cockpitHud: document.getElementById('cockpit-hud'),
  cockpitSpeed: document.getElementById('cockpit-speed'),
  cockpitGear: document.getElementById('cockpit-gear'),
  droneHud: document.getElementById('drone-hud'),
  droneSignal: document.getElementById('drone-signal'),
  gameoverTitle: document.getElementById('gameover-title'),
  gameoverDesc: document.getElementById('gameover-desc'),
  weaponCooldownBar: document.getElementById('weapon-cooldown-bar'),
  weaponCooldownFill: document.getElementById('weapon-cooldown-fill'),
  detectionContainer: document.getElementById('detection-container'),
  detectionBar: document.getElementById('detection-bar'),
  downloadContainer: document.getElementById('download-container'),
  downloadBar: document.getElementById('download-bar'),
  downloadPercent: document.getElementById('download-percent'),
  vehicleHpContainer: document.getElementById('vehicle-hp-container'),
  vehicleHpBar: document.getElementById('vehicle-hp-bar'),
  vehicleHpPercent: document.getElementById('vehicle-hp-percent'),
  interactPrompt: document.getElementById('interact-prompt'),
  camName: document.getElementById('cam-name'),
  hackTimer: document.getElementById('hack-timer'),
  hackTargetCode: document.getElementById('hack-target-code'),
  hackInput: document.getElementById('hack-input'),
  hackFeedback: document.getElementById('hack-feedback'),
  terminalLogAction: document.getElementById('terminal-log-action'),
  btnMute: document.getElementById('btn-mute'),
  btnNetworkMode: document.getElementById('btn-network-mode'),
  btnRain: document.getElementById('btn-rain'),
  hitmarker: document.getElementById('hitmarker'),
  tacticalMapModal: document.getElementById('tactical-map-modal'),
  tacticalMapCanvas: document.getElementById('tactical-map-canvas'),
  btnClearGps: document.getElementById('btn-clear-gps'),
  btnCloseMap: document.getElementById('btn-close-map'),
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
  activeHeadlight: null,
  showroomTurntable: null,
  droneGroup: null,
  droneParts: null,
  droneRotors: [],
  rainPoints: null,
  vehicleDeliveryGroup: null,
  vehicleDeliveryRing: null,
  vehicleDeliveryBeam: null,
  onFirewallDisabled: null,
  onAcceptMission: null,
  onApplySkin: null,
  onSelectWeapon: null,
  onSpawnVehicle: null,
  onSpawnPolice: null
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
export const trafficCars = [];     // Subconjunto de cars em movimento autônomo pelas avenidas
export const pedestrians = [];     // Pedestres nas calçadas com Profiler ctOS
export const fleeingDrivers = [];  // { mesh, dirX, dirZ, timer, phase, legL, legR, armL, armR }
export const boats = [];           // { id, mesh, initialPos, initialYaw, speed, wakePoints, wakeData }
export const projectiles = [];     // { mesh, line, origin, pos, dir, speed, life, damage, isTaser }
export const guardProjectiles = []; // { mesh, pos, dir, speed, life }
export const empWaves = [];        // { mesh, mat, radius, maxRadius }
export const impactFlashes = [];   // { light, life }
export const blinkingLights = [];  // { mat, phase }
export const sirenLights = [];     // { blueMat, redMat, phase }
export const netHackTagItems = []; // { el, getPos, getText }
export const missionMarkers = [];  // { key, ring, beam }
export const stores = [];          // { type: 'STYLE'|'ARMORY'|'MOTORS', name, pos, ring, color }
export const lightPoles = [];      // Postes de iluminação urbana com colisão e queda física
export const trafficLights = [];   // Semáforos hackeáveis nos cruzamentos (V + E)
export const supplyBoxes = [];     // Caixas de suprimentos (+$100 ou +25 HP) nos interiores acessíveis
export const policeCars = [];      // Viaturas de reforço policial ctOS spawnadas dinamicamente
export const remotePlayers = new Map(); // Jogadores remotos (id -> { group, parts, targetPos, targetYaw })
export const playersMap = new Map();    // Todos os agentes ativos ('local' + remotos)
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
  maxHp: 100,
  ownedSkins: ['classic'],
  equippedSkin: 'classic',
  ownedVehicles: [],
  hasRapidReload: false,
  hasShotgun: false,
  hasBlackout: false,
  blackoutTimer: 0,
  blackoutCooldown: 0,
  droneActive: false,
  droneYaw: 0,
  dronePitch: 0.12,
  gpsWaypoint: null,
  tacticalMapOpen: false,
  rainEnabled: true,
  hitmarkerTimer: 0,
  recoilTimer: 0,
  shopOpen: false,
  shopCooldown: 0,
  shopMustExitRing: false,
  damageFlashTimer: 0,
  baseAlert: false,
  wantedLevel: 0,
  wantedCooldown: 0,
  wantedStatus: 'OCULTO',
  ctosRevealTimer: 0,
  policeSpawnCooldown: 0,
  mouseDown: false,
  netHackActive: false,
  activeCamIndex: -1, // -1 = câmera 3ª pessoa do jogador
  drivingCar: null,
  drivingBoat: null,
  targetCar: null,
  deliveryPos: [-120, 0.06, 320],
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
  firstPerson: false,
  networkMode: 'OFFLINE_SOLO',
  localPlayerId: 'local',
  cameraYaw: 0,
  cameraPitch: 0.34,
  keys: {}
};

export const raycaster = new THREE.Raycaster();

// ==========================================
// TEXTURAS PROCEDURAIS (HTML5 CANVAS -> CanvasTexture)

export function getSurfaceHeight(x, z) {
  // Ponte Golden Gate atravessável (X: 80..400, Z: 26.5..43.5)
  if (z >= 26.5 && z <= 43.5 && x >= 78 && x <= 402) {
    if (x <= 80) return 0;
    if (x < 120) return ((x - 80) / 40) * 10;
    if (x <= 360) return 10;
    if (x <= 400) return ((400 - x) / 40) * 10;
    return 0;
  }
  // Ponte Sul ligando Distrito Residencial ao Portuário (X: 80..400, Z: 312..328)
  if (z >= 312 && z <= 328 && x >= 78 && x <= 402) {
    if (x <= 80) return 0;
    if (x < 120) return ((x - 80) / 40) * 7;
    if (x <= 360) return 7;
    if (x <= 400) return ((400 - x) / 40) * 7;
    return 0;
  }
  // Píeres de embarque Oeste (X: 64..76, Z: 57..67 e Z: 215..225)
  if ((z >= 57 && z <= 67 || z >= 215 && z <= 225) && x >= 64 && x <= 76) {
    if (x <= 68) return ((x - 64) / 4) * -0.35;
    return -0.35;
  }
  // Píeres de embarque Leste (X: 394..404, Z: 57..67 e Z: -125..-115)
  if ((z >= 57 && z <= 67 || z >= -125 && z <= -115) && x >= 394 && x <= 404) {
    if (x >= 400) return ((404 - x) / 4) * -0.35;
    return -0.35;
  }
  // Pisos internos das 3 lojas em Downtown (DedSec Style, SF Motors, HackShop Armory)
  if (z >= 61.5 && z <= 74.5 && ((x >= -38.5 && x <= -25.5) || (x >= -8.5 && x <= 8.5) || (x >= 25.5 && x <= 38.5))) {
    return 0.19;
  }
  // Pisos internos dos 4 prédios abertos em Downtown
  if (
    ((x >= -59 && x <= -45) || (x >= 45 && x <= 59)) &&
    ((z >= 9 && z <= 23) || (z >= 34 && z <= 50))
  ) {
    return 0.19;
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

export function isWaterForBoats(x, z) {
  // Plataformas terrestres (barcos navegam livremente por baixo da Golden Gate e Ponte Sul)
  if (x >= -540 && x <= 80 && z >= -480 && z <= 780) return false;
  if (x >= 400 && x <= 960 && z >= -280 && z <= 360) return false;
  if ((z >= 57 && z <= 67 || z >= 215 && z <= 225) && x >= 64 && x <= 76) return false;
  if ((z >= 57 && z <= 67 || z >= -125 && z <= -115) && x >= 394 && x <= 404) return false;
  return true;
}

export function isWaterForLand(x, z) {
  if (!isWaterForBoats(x, z)) return false;
  // Pista da Ponte Golden Gate (X: 78..402, Z: 26.5..43.5)
  if (x >= 78 && x <= 402 && z >= 26.5 && z <= 43.5) return false;
  // Pista da Ponte Sul (X: 78..402, Z: 312..328)
  if (x >= 78 && x <= 402 && z >= 312 && z <= 328) return false;
  return true;
}

export function isWaterArea(x, z) {
  return isWaterForLand(x, z);
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

export function checkCarCollision(x, z, yaw, ignoreCar = null) {
  const fwdX = Math.sin(yaw);
  const fwdZ = Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);
  const halfL = 2.05;
  const halfW = 0.92;

  const samplePoints = [
    [x + fwdX * halfL, z + fwdZ * halfL],
    [x - fwdX * halfL, z - fwdZ * halfL],
    [x + fwdX * halfL + rightX * halfW, z + fwdZ * halfL + rightZ * halfW],
    [x + fwdX * halfL - rightX * halfW, z + fwdZ * halfL - rightZ * halfW],
    [x - fwdX * halfL + rightX * halfW, z - fwdZ * halfL + rightZ * halfW],
    [x - fwdX * halfL - rightX * halfW, z - fwdZ * halfL - rightZ * halfW]
  ];

  for (const [px, pz] of samplePoints) {
    if (isWaterArea(px, pz)) return true;
    if (checkCollision(px, pz, 0.42, ignoreCar)) return true;
  }
  return false;
}

export function checkDroneCollision(x, y, z, radius = 0.45) {
  // Impede afundar no solo, pontes ou água
  const minY = Math.max(getSurfaceHeight(x, z), -0.25) + 0.35;
  if (y < minY) return true;

  // Colisão 3D (esfera x AABB) contra todo o array colliders (permite sobrevoar muros baixos/carros)
  for (const col of colliders) {
    const b = col.box;
    const cx = THREE.MathUtils.clamp(x, b.min.x, b.max.x);
    const cy = THREE.MathUtils.clamp(y, b.min.y, b.max.y);
    const cz = THREE.MathUtils.clamp(z, b.min.z, b.max.z);
    const dx = x - cx;
    const dy = y - cy;
    const dz = z - cz;
    if (dx * dx + dy * dy + dz * dz < radius * radius) {
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

export const SAVE_KEY = 'projeto_hacker_dedsec_save_v1';

export function saveProgress() {
  try {
    if (typeof localStorage === 'undefined') return;
    const data = {
      money: gameState.money,
      maxHp: gameState.maxHp,
      ownedSkins: gameState.ownedSkins,
      equippedSkin: gameState.equippedSkin,
      ownedVehicles: gameState.ownedVehicles,
      hasRapidReload: gameState.hasRapidReload,
      hasShotgun: gameState.hasShotgun,
      hasBlackout: gameState.hasBlackout,
      rainEnabled: gameState.rainEnabled
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Ignora falhas de quota/modo privado
  }
}

export function loadProgress() {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.money === 'number') gameState.money = data.money;
    if (typeof data.maxHp === 'number') {
      gameState.maxHp = data.maxHp;
      gameState.hp = data.maxHp;
    }
    if (Array.isArray(data.ownedSkins) && data.ownedSkins.length > 0) gameState.ownedSkins = data.ownedSkins;
    if (typeof data.equippedSkin === 'string') gameState.equippedSkin = data.equippedSkin;
    if (Array.isArray(data.ownedVehicles)) gameState.ownedVehicles = data.ownedVehicles;
    if (typeof data.hasRapidReload === 'boolean') gameState.hasRapidReload = data.hasRapidReload;
    if (typeof data.hasShotgun === 'boolean') gameState.hasShotgun = data.hasShotgun;
    if (typeof data.hasBlackout === 'boolean') gameState.hasBlackout = data.hasBlackout;
    if (typeof data.rainEnabled === 'boolean') gameState.rainEnabled = data.rainEnabled;
  } catch {
    // Ignora JSON inválido
  }
}

// ==========================================
// CONTROLE DE TELAS E CICLO PRINCIPAL
