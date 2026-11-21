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
    deliveryLabel: 'GARAGEM DEDSEC SUL',
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
    deliveryLabel: 'GARAGEM DEDSEC SUL',
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
  },
  HEIST_BLUME_03: {
    key: 'HEIST_BLUME_03',
    isVehicleTheft: true,
    requiresInfiltration: true,
    label: 'CONTRATO 03 // DEPÓSITO BLINDADO BLUME',
    desc: 'Infiltre-se no Depósito Blindado Blume (Distrito Sul), hackeie o portão eletrônico, roube o Blume Phantom GT (240 HP) e atravesse a baía até a Doca Clandestina Norte. Recompensa: $3.500.',
    reward: 3500,
    deliveryLabel: 'DOCA CLANDESTINA NORTE',
    bounds: WORLD_BOUNDS,
    radarScale: 0.95,
    playerStart: [-195, 0, 194],
    markerPos: [-195, 0.06, 196],
    extractPos: [435, 0.06, -135],
    carSpawn: { x: -195, z: 222, yaw: Math.PI, maxHp: 240, color: 0x0b0e17, neon: 0xff00aa, name: 'Blume Phantom GT' },
    gates: [
      { x: -195, y: 2.2, z: 204, w: 8, h: 4.4, d: 0.6, panelPos: [-189.5, 0.75, 203.0], openX: -203.4 }
    ],
    cameras: [
      { name: 'CAM_BLUME_01 // PORTÃO NORTE', pos: [-210.5, 4.8, 206], baseYaw: 0.65, basePitch: -0.35 },
      { name: 'CAM_BLUME_02 // PÁTIO SUL', pos: [-179.5, 4.8, 234], baseYaw: -2.45, basePitch: -0.35 }
    ],
    electricBoxes: [
      { name: 'CAIXA_DEPOSITO_BLUME', pos: [-206, 0.85, 214] }
    ],
    guards: [
      { waypoints: [[-207, 0, 209], [-183, 0, 209], [-183, 0, 217], [-207, 0, 217]], speed: 3.0, visionRange: 22 },
      { waypoints: [[-183, 0, 231], [-207, 0, 231], [-207, 0, 223], [-183, 0, 223]], speed: 3.1, visionRange: 22 },
      { waypoints: [[-208, 0, 212], [-208, 0, 232], [-201, 0, 232], [-201, 0, 212]], speed: 3.2, visionRange: 22 },
      { waypoints: [[-182, 0, 232], [-182, 0, 212], [-189, 0, 212], [-189, 0, 232]], speed: 3.2, visionRange: 22 }
    ]
  },
  HEIST_CTOS_04: {
    key: 'HEIST_CTOS_04',
    isVehicleTheft: true,
    requiresInfiltration: true,
    label: 'CONTRATO 04 // HANGAR SECRETO ctOS',
    desc: 'Infiltre-se no Hangar Secreto ctOS (Setor Portuário Leste), hackeie o portão fortificado, roube o Interceptor ctOS Proto-X (300 HP + Nitro) e entregue-o na Garagem DedSec Oeste. Recompensa: $4.200.',
    reward: 4200,
    deliveryLabel: 'GARAGEM DEDSEC OESTE',
    bounds: WORLD_BOUNDS,
    radarScale: 0.95,
    playerStart: [495, 0, 138],
    markerPos: [495, 0.06, 140],
    extractPos: [-210, 0.06, -140],
    carSpawn: { x: 495, z: 168, yaw: Math.PI, maxHp: 300, color: 0x0f172a, neon: 0x00f0ff, hasNitro: true, name: 'Interceptor ctOS Proto-X' },
    gates: [
      { x: 495, y: 2.2, z: 148, w: 8, h: 4.4, d: 0.6, panelPos: [500.5, 0.75, 147.0], openX: 486.6 }
    ],
    cameras: [
      { name: 'CAM_HANGAR_01 // PORTÃO NORTE', pos: [477.5, 4.9, 150], baseYaw: 0.72, basePitch: -0.35 },
      { name: 'CAM_HANGAR_02 // ALA INTERNA', pos: [512.5, 4.9, 180], baseYaw: -2.4, basePitch: -0.35 }
    ],
    electricBoxes: [
      { name: 'CAIXA_HANGAR_CTOS', pos: [482, 0.85, 160] }
    ],
    guards: [
      { waypoints: [[481, 0, 154], [509, 0, 154], [509, 0, 162], [481, 0, 162]], speed: 3.3, visionRange: 24 },
      { waypoints: [[509, 0, 177], [481, 0, 177], [481, 0, 169], [509, 0, 169]], speed: 3.4, visionRange: 24 },
      { waypoints: [[480, 0, 156], [480, 0, 178], [487, 0, 178], [487, 0, 156]], speed: 3.4, visionRange: 24 },
      { waypoints: [[510, 0, 178], [510, 0, 156], [503, 0, 156], [503, 0, 178]], speed: 3.5, visionRange: 24 },
      { waypoints: [[488, 0, 174], [502, 0, 174], [502, 0, 160], [488, 0, 160]], speed: 3.5, visionRange: 24 }
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
  gpsDistance: document.getElementById('gps-distance'),
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
  btnQuickGuide: document.getElementById('btn-quick-guide'),
  quickGuideModal: document.getElementById('quick-guide-modal'),
  btnCloseGuide: document.getElementById('btn-close-guide'),
  btnToggleShadows: document.getElementById('btn-toggle-shadows'),
  sensButtons: document.querySelectorAll('.sens-btn'),
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
  waterBumpMap: null,
  bayWaterGeo: null,
  waterFoamRings: [],
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
  quickGuideOpen: false,
  shadowsEnabled: true,
  mouseSensitivity: 0.0024,
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
  isSwimming: false,
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
  // Ponte Golden Gate atravessável (X: 70..410, Z: 25.0..45.0)
  if (z >= 25.0 && z <= 45.0 && x >= 70 && x <= 410) {
    if (x <= 80) return 0;
    if (x < 120) return ((x - 80) / 40) * 10;
    if (x <= 360) return 10;
    if (x <= 400) return ((400 - x) / 40) * 10;
    return 0;
  }
  // Ponte Sul ligando Distrito Residencial ao Portuário (X: 70..410, Z: 310.0..330.0)
  if (z >= 310.0 && z <= 330.0 && x >= 70 && x <= 410) {
    if (x <= 80) return 0;
    if (x < 120) return ((x - 80) / 40) * 7;
    if (x <= 360) return 7;
    if (x <= 400) return ((400 - x) / 40) * 7;
    return 0;
  }
  // Píeres de embarque Oeste (X: 70..83, Z: 56..68 e Z: 214..226)
  if ((z >= 56 && z <= 68 || z >= 214 && z <= 226) && x >= 70 && x <= 83) {
    if (x <= 72) return 0;
    if (x < 77) return ((72 - x) / 5) * 0.25;
    // Ponta do píer (X: 80..83) sobe suavemente até o nível da água (Y = 0)
    if (x > 80) return -0.25 + ((x - 80) / 3) * 0.25;
    return -0.25;
  }
  // Píeres de embarque Leste (X: 395..408, Z: 56..68 e Z: -126..-114)
  if ((z >= 56 && z <= 68 || z >= -126 && z <= -114) && x >= 395 && x <= 408) {
    if (x >= 406) return 0;
    if (x > 401) return ((x - 406) / 5) * 0.25;
    // Ponta do píer (X: 395..398) sobe suavemente até o nível da água (Y = 0)
    if (x < 398) return -0.25 + ((398 - x) / 3) * 0.25;
    return -0.25;
  }
  // Colina-Mirante acessível no Distrito Sul (rampa em Z: 355..405, platô em Z: 405..425, X: 28..48)
  if (x >= 28 && x <= 48 && z >= 355 && z <= 425) {
    if (z <= 405) return ((z - 355) / 50) * 11.5;
    return 11.5;
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

export const BAY_MIN_X = 76;
export const BAY_MAX_X = 402;

export function isPierArea(x, z) {
  // Píeres Oeste (X: 70..83, Z: 56..68 e Z: 214..226)
  if ((z >= 56 && z <= 68 || z >= 214 && z <= 226) && x >= 70 && x <= 83) return true;
  // Píeres Leste (X: 395..408, Z: 56..68 e Z: -126..-114)
  if ((z >= 56 && z <= 68 || z >= -126 && z <= -114) && x >= 395 && x <= 408) return true;
  return false;
}

export function isWaterForBoats(x, z) {
  // Canal da Baía de São Francisco: navegável livremente por baixo das pontes Golden Gate e Sul
  if (x > BAY_MIN_X && x < BAY_MAX_X) {
    if (z < -380 || z > 620) return false;
    return true;
  }
  // Áreas marítimas abertas fora das plataformas terrestres
  if (x <= BAY_MIN_X) {
    if (z < -480 || z > 780) return true;
    return false;
  }
  if (x >= BAY_MAX_X) {
    if (z < -280 || z > 360) return true;
    return false;
  }
  return true;
}

export function isWaterForLand(x, z) {
  // Pista da Ponte Golden Gate atravessável com margem de segurança (X: 70..410, Z: 25.0..45.0)
  if (x >= 70 && x <= 410 && z >= 25.0 && z <= 45.0) return false;
  // Pista da Ponte Sul atravessável com margem de segurança (X: 70..410, Z: 310.0..330.0)
  if (x >= 70 && x <= 410 && z >= 310.0 && z <= 330.0) return false;

  // Canal da Baía de São Francisco
  if (x > BAY_MIN_X && x < BAY_MAX_X) return true;

  return isWaterForBoats(x, z);
}

export function isWaterArea(x, z) {
  return isWaterForLand(x, z);
}

export function checkCollision(x, z, radius = PLAYER_RADIUS, ignoreCar = null, y = null, height = 1.8) {
  const entityY = y !== null ? y : getSurfaceHeight(x, z);
  for (const col of colliders) {
    if (ignoreCar && col === ignoreCar.colliderObj) continue;
    const b = col.box;
    if (b.max.y <= entityY + 0.05 || b.min.y >= entityY + height) continue;
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
  // Dimensões do chassi físico (~4.1m de comprimento x 1.84m de largura, sem o feixe visual dos faróis)
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
    if (isWaterForLand(px, pz)) return true;
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

// Libera da GPU geometrias e materiais de um objeto e de todos os seus filhos (texturas compartilhadas são preservadas)
export function disposeHierarchy(obj) {
  if (!obj) return;
  const disposeMat = (m) => {
    if (m && typeof m.dispose === 'function') m.dispose();
  };
  obj.traverse((child) => {
    if (child.geometry && typeof child.geometry.dispose === 'function') child.geometry.dispose();
    if (Array.isArray(child.material)) child.material.forEach(disposeMat);
    else disposeMat(child.material);
    disposeMat(child.userData?.normalMaterial);
    disposeMat(child.userData?.nethackMaterial);
    disposeMat(child.userData?.edgesMaterial);
  });
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
