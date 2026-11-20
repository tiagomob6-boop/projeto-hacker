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

const GUARD_STATE = {
  PATROL: 'PATROL',
  INVESTIGATE: 'INVESTIGATE',
  DISTRACTED: 'DISTRACTED',
  STUNNED: 'STUNNED'
};

const WEAPON_TYPE = {
  TASER: 'TASER',
  EMP: 'EMP'
};

const TASER_COOLDOWN = 2.5;
const EMP_COOLDOWN = 15.0;

const MAPS_CONFIG = {
  COMPLEXO_CTOS: {
    key: 'COMPLEXO_CTOS',
    label: 'COMPLEXO ctOS',
    bounds: { minX: -35, maxX: 35, minZ: -34, maxZ: 44 },
    playerStart: [0, 0, 14],
    extractPos: [0, 0.04, 25],
    serverPos: [0, 1.65, -21.5],
    gates: [
      { x: 0, y: 2.2, z: 6, w: 6, h: 4.4, d: 0.6, panelPos: [4.2, 0.75, 6.9], openX: -6.1 }
    ],
    cameras: [
      { name: 'CAM_01 // PÁTIO_OESTE', pos: [-14.6, 4.3, -1], baseYaw: -2.15, basePitch: -0.35 },
      { name: 'CAM_02 // SETOR_SERVIDOR', pos: [14.6, 4.3, -17], baseYaw: 1.95, basePitch: -0.32 }
    ],
    electricBoxes: [
      { name: 'CAIXA_ELETRICA_01', pos: [-11.5, 0.85, -1.5] },
      { name: 'CAIXA_ELETRICA_02', pos: [11.5, 0.85, -12.5] }
    ],
    guards: [
      { waypoints: [[-11, 0, -3.5], [11, 0, -3.5]], speed: 2.8, visionRange: 9.5 },
      { waypoints: [[10, 0, -14], [-10, 0, -14]], speed: 3.1, visionRange: 9.5 }
    ],
    cars: [
      { x: -6.5, z: 18.5, yaw: Math.PI / 2, color: 0x111827, neon: 0x00f0ff, isDedsec: true },
      { x: -12, z: 10.5, yaw: Math.PI / 2, color: 0x26314a, neon: 0xffaa00, isDedsec: false },
      { x: 11.5, z: 24.5, yaw: -Math.PI / 2, color: 0x2b1d38, neon: 0xff0055, isDedsec: false },
      { x: -16, z: 27, yaw: 0, color: 0x1e2b3a, neon: 0x38bdf8, isDedsec: false }
    ]
  },
  DOCAS_BAIA_SF: {
    key: 'DOCAS_BAIA_SF',
    label: 'DOCAS DA BAÍA SF',
    bounds: { minX: -20.5, maxX: 20.5, minZ: -26.5, maxZ: 34.5 },
    playerStart: [0, 0, 22],
    extractPos: [0, 0.04, 30],
    serverPos: [0, 1.65, -22.5],
    gates: [
      { x: 0, y: 2.2, z: 10, w: 6, h: 4.4, d: 0.6, panelPos: [4.2, 0.75, 10.9], openX: -6.1 },
      { x: 0, y: 2.2, z: -12, w: 6, h: 4.4, d: 0.6, panelPos: [-4.2, 0.75, -11.1], openX: 6.1 }
    ],
    cameras: [
      { name: 'CAM_01 // ENTRADA_DOCA', pos: [-16.5, 4.5, 6], baseYaw: -2.0, basePitch: -0.35 },
      { name: 'CAM_02 // CORREDOR_CARGA', pos: [16.5, 4.5, -2], baseYaw: 2.1, basePitch: -0.35 },
      { name: 'CAM_03 // CONVÉS_BLUME', pos: [-12.5, 4.8, -16], baseYaw: -2.35, basePitch: -0.32 }
    ],
    electricBoxes: [
      { name: 'CAIXA_DOCA_01', pos: [-12, 0.85, 2] },
      { name: 'CAIXA_DOCA_02', pos: [12, 0.85, -7] }
    ],
    guards: [
      { waypoints: [[-11, 0, 4], [11, 0, 4]], speed: 2.7, visionRange: 9.5 },
      { waypoints: [[11, 0, -5], [-11, 0, -5]], speed: 3.0, visionRange: 9.5 },
      { waypoints: [[-8, 0, -17], [8, 0, -17]], speed: 3.2, visionRange: 9.5 }
    ],
    cars: [
      { x: -7, z: 24, yaw: Math.PI / 2, color: 0x111827, neon: 0x00f0ff, isDedsec: true },
      { x: 13, z: 17, yaw: -Math.PI / 2, color: 0x26314a, neon: 0xffaa00, isDedsec: false },
      { x: -13, z: 15, yaw: Math.PI / 2, color: 0x1e2b3a, neon: 0x38bdf8, isDedsec: false }
    ]
  }
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

const DIFFICULTY_PRESETS = {
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
  statusWeapon: document.getElementById('status-weapon'),
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
let scene, camera, renderer, clock, worldGroup;
let ambientLight, dirLight;
let playerGroup, playerParts = {};
let gateMesh, gatePanelMesh, serverMesh, serverCoreMesh, extractionZoneGroup, extractionRing, extractionBeam;
let networkLinesGroup, serverParticles, waterMesh;
const serverParticleData = [];

// Listas de mundo e gameplay
const colliders = [];   // { box: THREE.Box3, mesh, isGate?: boolean, gateIndex?: number }
const occluders = [];   // Meshes que bloqueiam visão dos guardas
const structureMeshes = []; // Meshes afetados pelo wireframe NetHack
const hackableMeshes = [];  // Dispositivos destacáveis no NetHack
const securityCameras = []; // { id, name, mesh, pos, baseYaw, basePitch, yawOffset, pitchOffset, coneMesh, coneMat, disabledTimer, sweepPhase, currentYaw }
const guards = [];          // { mesh, waypoints, currentTarget, speed, visionRange, visionHalfAngle, coneMesh, coneMat, state, lastKnownPos, lookAroundTimer, lookBaseYaw, investigateTarget, investigateTimer }
const electricBoxes = [];   // { id, name, mesh, cooldown, sparkTimer, sparkPoints, sparkData }
const radarCrates = [];     // { x, z, w, d } para planta baixa do radar
const radarBuildings = [];  // { x, z, w, d } para quarteirões laterais no radar
const radarWalls = [];      // { x1, z1, x2, z2 } para paredes no radar
const gates = [];           // { gateMesh, panelMesh, unlocked, openProgress, initialX, openX }
const cars = [];            // { mesh, colliderObj, initialPos, initialYaw, isDedsec, speed, hackedTimer, hackedUsed, headlight }
const projectiles = [];     // { mesh, line, origin, pos, dir, speed, life }
const empWaves = [];        // { mesh, mat, radius, maxRadius }
const impactFlashes = [];   // { light, life }
const netHackTagItems = []; // { el, getPos, getText }
let dedsecCar = null;

// Estado do jogo
const gameState = {
  mission: MISSION_STATE.IDLE,
  selectedMap: 'COMPLEXO_CTOS',
  difficulty: 'INICIANTE',
  activeGateIndex: 0,
  elapsedTime: 0,
  netHackActive: false,
  activeCamIndex: -1, // -1 = câmera 3ª pessoa do jogador
  drivingCar: null,
  equippedWeapon: WEAPON_TYPE.TASER,
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

const raycaster = new THREE.Raycaster();

// ==========================================
// ÁUDIO PROCEDURAL (100% WEB AUDIO API)
// ==========================================
const AudioManager = {
  ctx: null,
  masterGain: null,
  muted: false,
  musicTimer: null,
  musicStep: 0,
  currentBpm: 96,
  alertBeepCooldown: 0,
  noiseBuffer: null,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.75;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this._createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  _createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.75, this.ctx.currentTime, 0.02);
    }
    if (dom.btnMute) {
      dom.btnMute.textContent = this.muted ? '[M] OFF' : '[M] ON';
      dom.btnMute.classList.toggle('muted', this.muted);
    }
  },

  _tone(freq, endFreq, duration, type, volume, filterFreq = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== null && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    if (filterFreq) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, now);
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }

    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  },

  playKeyBeep() {
    const freq = 960 + Math.random() * 220;
    this._tone(freq, freq * 0.96, 0.045, 'square', 0.055, 2400);
  },

  playTerminalSuccess() {
    this._tone(523.25, 523.25, 0.09, 'triangle', 0.14, null, 0);
    this._tone(659.25, 659.25, 0.09, 'triangle', 0.14, null, 0.08);
    this._tone(783.99, 880.0, 0.18, 'triangle', 0.16, null, 0.16);
  },

  playTerminalError() {
    this._tone(230, 125, 0.22, 'sawtooth', 0.14, 900);
  },

  playNetHackPulse(active) {
    if (active) {
      this._tone(85, 195, 0.24, 'sine', 0.2, 600);
      this._tone(170, 340, 0.2, 'triangle', 0.08, 900);
    } else {
      this._tone(190, 75, 0.22, 'sine', 0.18, 550);
    }
  },

  playGateMechanical() {
    if (!this.ctx || this.muted) return;
    this._tone(72, 46, 0.75, 'sawtooth', 0.15, 280);
    if (!this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(360, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + 0.72);
    filter.Q.value = 2.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.78);
  },

  playElectricZap() {
    if (!this.ctx || this.muted) return;
    this._tone(1450, 260, 0.14, 'square', 0.11, 3200);
    if (!this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.16);
  },

  updateAlertTick(dt, level) {
    if (level <= 2) {
      this.alertBeepCooldown = 0;
      return;
    }
    this.alertBeepCooldown -= dt;
    if (this.alertBeepCooldown <= 0) {
      const ratio = THREE.MathUtils.clamp(level / 100, 0, 1);
      const freq = THREE.MathUtils.lerp(520, 1080, ratio);
      this._tone(freq, freq * 1.04, 0.07, 'sine', 0.09 + ratio * 0.06);
      this.alertBeepCooldown = THREE.MathUtils.lerp(0.62, 0.15, ratio);
    }
  },

  playGameOverSiren() {
    this._tone(740, 340, 0.42, 'sawtooth', 0.16, 1400, 0);
    this._tone(700, 280, 0.48, 'sawtooth', 0.16, 1200, 0.42);
  },

  playVictoryChime() {
    this._tone(523.25, 523.25, 0.12, 'triangle', 0.15, null, 0);
    this._tone(659.25, 659.25, 0.12, 'triangle', 0.15, null, 0.1);
    this._tone(783.99, 783.99, 0.14, 'triangle', 0.15, null, 0.2);
    this._tone(1046.5, 1046.5, 0.35, 'triangle', 0.18, null, 0.32);
  },

  playTaserShot() {
    this._tone(1650, 320, 0.13, 'square', 0.11, 3600);
    this._tone(920, 440, 0.11, 'sawtooth', 0.08, 2200, 0.02);
  },

  playEmpPulse() {
    this._tone(140, 38, 0.55, 'sawtooth', 0.22, 480);
    this._tone(980, 120, 0.4, 'sine', 0.15, 1800, 0.02);
  },

  startMusic(bpm = 96) {
    this.stopMusic();
    this.currentBpm = bpm;
    this.musicStep = 0;
    this._scheduleMusicLoop();
  },

  setMusicTempo(bpm) {
    if (this.currentBpm === bpm && this.musicTimer) return;
    this.currentBpm = bpm;
    if (this.musicTimer) {
      this._scheduleMusicLoop();
    }
  },

  _scheduleMusicLoop() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    const stepMs = (60 / this.currentBpm / 2) * 1000;
    const bassPattern = [55.0, 55.0, 43.65, 43.65, 49.0, 49.0, 41.2, 49.0];

    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.muted) return;
      const freq = bassPattern[this.musicStep % bassPattern.length];
      const accent = this.musicStep % 2 === 0 ? 0.068 : 0.045;
      this._tone(freq, freq, 0.19, 'sawtooth', accent, 340);
      this.musicStep = (this.musicStep + 1) % bassPattern.length;
    }, stepMs);
  },

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  },

  engineOsc: null,
  engineGain: null,

  updateEngineSound(speedAbs) {
    if (!this.ctx || this.muted) {
      this.stopEngineSound();
      return;
    }
    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 260;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.05;
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 48;
      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.engineOsc.start();
    }
    const targetFreq = 46 + Math.min(speedAbs, 18) * 4.5;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.06);
  },

  stopEngineSound() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (_) {}
      this.engineOsc = null;
      this.engineGain = null;
    }
  }
};

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
  worldGroup = new THREE.Group();
  scene.add(worldGroup);

  setupLighting();
  buildPlayer();
  buildMap(gameState.selectedMap);

  window.addEventListener('resize', onWindowResize);
}

function buildMap(mapKey) {
  const cfg = MAPS_CONFIG[mapKey] || MAPS_CONFIG.COMPLEXO_CTOS;
  gameState.selectedMap = cfg.key;

  while (worldGroup.children.length > 0) {
    worldGroup.remove(worldGroup.children[0]);
  }

  colliders.length = 0;
  occluders.length = 0;
  structureMeshes.length = 0;
  hackableMeshes.length = 0;
  securityCameras.length = 0;
  electricBoxes.length = 0;
  guards.length = 0;
  cars.length = 0;
  gates.length = 0;
  radarCrates.length = 0;
  radarBuildings.length = 0;
  radarWalls.length = 0;
  serverParticleData.length = 0;
  waterMesh = null;
  dedsecCar = null;

  if (cfg.key === 'DOCAS_BAIA_SF') {
    buildDocksEnvironment(cfg);
  } else {
    buildEnvironment(cfg);
  }
  buildCars(cfg);
  buildSecurityCameras(cfg);
  buildElectricBoxes(cfg);
  buildGuards(cfg);
  buildNetworkLines();
  buildNetHackLabels();
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
  worldGroup.add(mesh);

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
    colliders.push({
      box,
      mesh,
      isGate: !!options.isGate,
      gateIndex: options.gateIndex ?? -1
    });
  }

  if (options.occlude !== false) {
    occluders.push(mesh);
  }

  return mesh;
}

function buildEnvironment(cfg) {
  // Chão principal ampliado (cobre X: -36..36 e Z: -35..45)
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x101422,
    roughness: 0.88,
    metalness: 0.15
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(92, 102), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 5);
  ground.receiveShadow = true;
  worldGroup.add(ground);

  // Grade neon sutil no chão
  const grid = new THREE.GridHelper(92, 46, 0x00f0ff, 0x162442);
  grid.position.set(0, 0.015, 5);
  grid.material.opacity = 0.22;
  grid.material.transparent = true;
  worldGroup.add(grid);

  // Calçadas elevadas com meio-fio (Oeste, Leste, Sul e frente do complexo)
  const sidewalkOpts = { collide: false, occlude: false, edgesColor: 0x26324d, edgesOpacity: 0.55 };
  addStaticBox(14, 0.14, 38, -29, 0.07, 26, 0x1a2234, sidewalkOpts);
  addStaticBox(14, 0.14, 38, 29, 0.07, 26, 0x1a2234, sidewalkOpts);
  addStaticBox(72, 0.14, 14, 0, 0.07, 38, 0x1a2234, sidewalkOpts);
  addStaticBox(16, 0.14, 4.5, -14, 0.07, 8.75, 0x1a2234, sidewalkOpts);
  addStaticBox(16, 0.14, 4.5, 14, 0.07, 8.75, 0x1a2234, sidewalkOpts);

  // Faixas da rua (Avenida principal)
  for (let x = -20; x <= 20; x += 6) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.03, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x2f436e })
    );
    stripe.position.set(x, 0.02, 20);
    worldGroup.add(stripe);
  }

  // Faixas de pedestres
  [-17, 17].forEach((cx) => {
    for (let z = 14; z <= 26; z += 2.4) {
      const zebra = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.025, 1.1),
        new THREE.MeshBasicMaterial({ color: 0x4b6584 })
      );
      zebra.position.set(cx, 0.02, z);
      worldGroup.add(zebra);
    }
  });

  // Hidrantes nas calçadas
  [[-22.8, 12], [22.8, 12], [-22.8, 30.5], [22.8, 30.5]].forEach(([hx, hz]) => {
    addStaticBox(0.42, 0.85, 0.42, hx, 0.5, hz, 0xd63031, { occlude: false });
    addStaticBox(0.52, 0.18, 0.26, hx, 0.72, hz, 0xb2bec3, { collide: false, occlude: false });
  });

  // Barreiras de concreto na avenida (cobertura urbana)
  [[-9, 13.5], [9, 13.5], [-14, 29.5], [14, 29.5]].forEach(([bx, bz]) => {
    addStaticBox(3.2, 1.05, 0.8, bx, 0.52, bz, 0x3d485e, {
      edgesColor: 0xffaa00,
      edgesOpacity: 0.6
    });
  });

  // Outdoors holográficos neon nas calçadas
  [
    { x: -24.5, z: 22, color: 0x00f0ff, rotY: Math.PI / 2 },
    { x: 24.5, z: 22, color: 0xff0055, rotY: -Math.PI / 2 }
  ].forEach((bb) => {
    addStaticBox(0.35, 5.5, 0.35, bb.x, 2.75, bb.z, 0x1e2538, { occlude: false });
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 2.4, 0.18),
      new THREE.MeshStandardMaterial({
        color: 0x0a1428,
        emissive: bb.color,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.85
      })
    );
    panel.position.set(bb.x, 5.2, bb.z);
    panel.rotation.y = bb.rotY;
    worldGroup.add(panel);
  });

  // Prédios laterais acessíveis pela rua com fachadas iluminadas
  const streetBuildings = [
    [-31, 7, 15, 8, 14, 11, 0x00f0ff],
    [-31, 8, 32, 8, 16, 12, 0xff0055],
    [31, 7, 15, 8, 14, 11, 0xff0055],
    [31, 8, 32, 8, 16, 12, 0x00f0ff]
  ];
  streetBuildings.forEach(([x, y, z, w, h, d, accent]) => {
    radarBuildings.push({ x, z, w, d });
    addStaticBox(w, h, d, x, y, z, 0x141b2d, {
      edgesColor: accent,
      edgesOpacity: 0.4
    });
    const facadeX = x < 0 ? x + w / 2 + 0.1 : x - w / 2 - 0.1;
    addStaticBox(0.16, 0.45, d * 0.85, facadeX, 3.6, z, accent, {
      collide: false,
      occlude: false,
      emissive: accent,
      emissiveIntensity: 1.1
    });
  });

  // Postes cyberpunk na rua
  [-13, 13].forEach((px) => {
    addStaticBox(0.35, 5.5, 0.35, px, 2.75, 16, 0x1e2538, { occlude: false });
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.2, 0.5),
      new THREE.MeshBasicMaterial({ color: px < 0 ? 0x00f0ff : 0xff0055 })
    );
    lamp.position.set(px + (px < 0 ? 0.3 : -0.3), 5.5, 16);
    worldGroup.add(lamp);
  });

  // Silhuetas de prédios de São Francisco ao fundo (fora da área jogável)
  const skylinePositions = [
    [-46, 12, -34, 8, 24, 8],
    [-46, 9, -8, 7, 18, 10],
    [-46, 11, 18, 8, 22, 10],
    [46, 13, -30, 9, 26, 9],
    [46, 8, -4, 7, 16, 10],
    [46, 12, 20, 8, 24, 10],
    [-16, 14, -44, 10, 28, 8],
    [16, 15, -44, 10, 30, 8],
    [0, 18, -46, 10, 36, 8]
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
      worldGroup.add(winBand);
    }
  });

  // Ponte Golden Gate estilizada em laranja-neon ao fundo do horizonte
  buildGoldenGateBridge();

  // Muros do Complexo Protegido (X: -16 a +16, Z: -26 a +6)
  addStaticBox(13, 5, 1, -9.5, 2.5, 6, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });
  addStaticBox(13, 5, 1, 9.5, 2.5, 6, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });
  addStaticBox(1, 5, 32, -16, 2.5, -10, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.42 });
  addStaticBox(1, 5, 32, 16, 2.5, -10, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.42 });
  addStaticBox(33, 5, 1, 0, 2.5, -26, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.42 });

  radarWalls.push(
    { x1: -3, z1: 6, x2: -16, z2: 6 },
    { x1: -16, z1: 6, x2: -16, z2: -26 },
    { x1: -16, z1: -26, x2: 16, z2: -26 },
    { x1: 16, z1: -26, x2: 16, z2: 6 },
    { x1: 16, z1: 6, x2: 3, z2: 6 }
  );

  // Luzes de destaque e letreiros emissivos na fachada da entrada e muros do complexo
  buildComplexNeonAccents();

  // Portão Eletrônico
  buildMapGates(cfg);

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
    radarCrates.push({ x, z, w, d });
    addStaticBox(w, h, d, x, y, z, 0x24304a, {
      emissive: 0x081526,
      emissiveIntensity: 0.4,
      edgesColor: 0x00d4ff,
      edgesOpacity: 0.52
    });
  });

  buildServerUnit(cfg.serverPos[0], cfg.serverPos[2]);
  buildExtractionZone(cfg.extractPos[0], cfg.extractPos[2]);
}

function buildMapGates(cfg) {
  cfg.gates.forEach((gCfg, idx) => {
    const gMesh = addStaticBox(gCfg.w, gCfg.h, gCfg.d, gCfg.x, gCfg.y, gCfg.z, 0x26314a, {
      isGate: true,
      gateIndex: idx,
      emissive: 0xff0055,
      emissiveIntensity: 0.45,
      edgesColor: 0xff0055,
      edgesOpacity: 0.8
    });
    const pMesh = createHackableDevice(
      0.7,
      1.5,
      0.5,
      gCfg.panelPos[0],
      gCfg.panelPos[1],
      gCfg.panelPos[2],
      0x00f0ff,
      `PAINEL_PORTAO_${idx + 1}`
    );
    gates.push({
      index: idx,
      gateMesh: gMesh,
      panelMesh: pMesh,
      unlocked: false,
      openProgress: 0,
      initialX: gCfg.x,
      openX: gCfg.openX
    });
    if (idx === 0) {
      gateMesh = gMesh;
      gatePanelMesh = pMesh;
    }
  });
}

function buildServerUnit(sx, sz) {
  addStaticBox(4.4, 0.3, 3.6, sx, 0.15, sz, 0x182238, { occlude: false, collide: false });
  serverMesh = createHackableDevice(2.0, 3.0, 1.4, sx, 1.65, sz, 0xff0055, 'SERVIDOR_CTOS');

  serverCoreMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
  );
  serverCoreMesh.position.set(sx, 3.9, sz);
  worldGroup.add(serverCoreMesh);

  buildServerParticles(sx, sz);
}

function buildExtractionZone(ex, ez) {
  extractionZoneGroup = new THREE.Group();
  extractionZoneGroup.position.set(ex, 0.04, ez);

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

  worldGroup.add(extractionZoneGroup);
}

function buildDocksEnvironment(cfg) {
  // Água escura brilhante ao redor do píer
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x05182e,
    emissive: 0x03223d,
    emissiveIntensity: 0.7,
    roughness: 0.12,
    metalness: 0.85
  });
  waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(0, -0.42, 0);
  worldGroup.add(waterMesh);

  // Plataforma principal do Píer (X: -22..22, Z: -14..36)
  addStaticBox(44, 0.6, 50, 0, -0.3, 11, 0x182030, {
    collide: false,
    occlude: false,
    edgesColor: 0x00f0ff,
    edgesOpacity: 0.3
  });

  // Grade sutil no piso do píer
  const grid = new THREE.GridHelper(44, 22, 0x00f0ff, 0x162442);
  grid.position.set(0, 0.015, 11);
  grid.material.opacity = 0.18;
  grid.material.transparent = true;
  worldGroup.add(grid);

  // Muros/Barreiras laterais do píer e divisórias dos 2 portões (Z=10 e Z=-12)
  addStaticBox(1, 3.2, 48, -21.5, 1.6, 10, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.4 });
  addStaticBox(1, 3.2, 48, 21.5, 1.6, 10, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.4 });
  // Guard-rail baixo com luzes de aviso na extremidade sul do píer (Z = 35)
  addStaticBox(44, 1.1, 0.8, 0, 0.55, 35, 0x26314a, {
    edgesColor: 0xffaa00,
    edgesOpacity: 0.75
  });
  [-15, -5, 5, 15].forEach((lx) => {
    addStaticBox(0.55, 0.25, 0.25, lx, 1.2, 35, 0xffaa00, {
      collide: false,
      occlude: false,
      emissive: 0xffaa00,
      emissiveIntensity: 1.4
    });
  });
  addStaticBox(18, 4.5, 1, -12, 2.25, 10, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });
  addStaticBox(18, 4.5, 1, 12, 2.25, 10, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });
  addStaticBox(18, 4.5, 1, -12, 2.25, -12, 0x1b2236, { edgesColor: 0xff0055, edgesOpacity: 0.45 });
  addStaticBox(18, 4.5, 1, 12, 2.25, -12, 0x1b2236, { edgesColor: 0xff0055, edgesOpacity: 0.45 });

  radarWalls.push(
    { x1: -21.5, z1: 34, x2: -21.5, z2: -14 },
    { x1: 21.5, z1: 34, x2: 21.5, z2: -14 },
    { x1: -21, z1: 10, x2: -3, z2: 10 },
    { x1: 3, z1: 10, x2: 21, z2: 10 },
    { x1: -21, z1: -12, x2: -3, z2: -12 },
    { x1: 3, z1: -12, x2: 21, z2: -12 }
  );

  // Corredores formados por contêineres empilhados (vermelhos, azuis e ciano)
  const containers = [
    [-9, 1.35, 3, 6.2, 2.7, 2.6, 0x8b1e24, 0xff4455],
    [-9, 4.05, 3, 6.2, 2.7, 2.6, 0x1b3b6f, 0x00f0ff],
    [9, 1.35, 3, 6.2, 2.7, 2.6, 0x0e5a6f, 0x00f0ff],
    [0, 1.35, -1.5, 5.8, 2.7, 2.6, 0x1b3b6f, 0x38bdf8],
    [-11, 1.35, -7, 6.2, 2.7, 2.6, 0x0e5a6f, 0x00f0ff],
    [11, 1.35, -7, 6.2, 2.7, 2.6, 0x8b1e24, 0xff4455],
    [11, 4.05, -7, 6.2, 2.7, 2.6, 0x1b3b6f, 0x00f0ff],
    [-7, 1.35, -17, 4.2, 2.7, 2.4, 0x8b1e24, 0xff4455],
    [7, 1.35, -17, 4.2, 2.7, 2.4, 0x0e5a6f, 0x00f0ff]
  ];
  containers.forEach(([x, y, z, w, h, d, col, edgeCol]) => {
    if (y < 2.0) radarCrates.push({ x, z, w, d });
    addStaticBox(w, h, d, x, y, z, col, {
      edgesColor: edgeCol,
      edgesOpacity: 0.55
    });
  });

  // Rampa e Navio / Cargueiro da Blume ancorado ao fundo (Z: -32..-13)
  addStaticBox(28, 0.7, 18, 0, -0.2, -22, 0x141b2d, {
    collide: false,
    occlude: false,
    edgesColor: 0x00f0ff,
    edgesOpacity: 0.45
  });
  // Casco lateral do navio e ponte de comando da Blume
  addStaticBox(1.5, 4.2, 18, -14, 2.1, -22, 0x161d2f, { edgesColor: 0xff0055, edgesOpacity: 0.6 });
  addStaticBox(1.5, 4.2, 18, 14, 2.1, -22, 0x161d2f, { edgesColor: 0xff0055, edgesOpacity: 0.6 });
  addStaticBox(29, 8.5, 4.5, 0, 4.25, -29.5, 0x101726, { edgesColor: 0x00f0ff, edgesOpacity: 0.55 });
  addStaticBox(12, 0.6, 0.25, 0, 6.5, -27.1, 0x00f0ff, {
    collide: false,
    occlude: false,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.4
  });

  // Ponte Golden Gate distante no horizonte da baía
  buildGoldenGateBridge();

  // 2 Portões / Barreiras Eletrônicas
  buildMapGates(cfg);

  // Servidor Central no convés do cargueiro + Zona de Extração no início do píer
  buildServerUnit(cfg.serverPos[0], cfg.serverPos[2]);
  buildExtractionZone(cfg.extractPos[0], cfg.extractPos[2]);
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

  worldGroup.add(bridgeGroup);
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

function buildServerParticles(sx = 0, sz = -21.5) {
  const count = 56;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const px = sx + (Math.random() - 0.5) * 2.4;
    const py = 0.4 + Math.random() * 4.4;
    const pz = sz + (Math.random() - 0.5) * 1.8;

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
  worldGroup.add(serverParticles);
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
  worldGroup.add(mesh);

  mesh.updateMatrixWorld(true);
  colliders.push({ box: new THREE.Box3().setFromObject(mesh), mesh });
  hackableMeshes.push(mesh);
  return mesh;
}

// ==========================================
// CARROS 3D PROCEDURAIS (ESTACIONADOS + DEDSEC)
// ==========================================
function buildCarMesh(color, neonTrim) {
  const carGroup = new THREE.Group();
  const nethackMat = new THREE.MeshBasicMaterial({
    color: 0x0b3a5c,
    wireframe: true,
    transparent: true,
    opacity: 0.45
  });
  const nethackNeonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  const registerPart = (mesh, normalMat, isHackHighlight = false) => {
    mesh.userData.normalMaterial = normalMat;
    mesh.userData.nethackMaterial = isHackHighlight ? nethackNeonMat : nethackMat;
    if (isHackHighlight) {
      hackableMeshes.push(mesh);
    } else {
      structureMeshes.push(mesh);
    }
    carGroup.add(mesh);
  };

  // Chassi
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.65,
    emissive: neonTrim,
    emissiveIntensity: 0.08
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.62, 4.4), bodyMat);
  body.position.y = 0.56;
  body.castShadow = true;
  body.receiveShadow = true;
  body.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(body.geometry),
      new THREE.LineBasicMaterial({ color: neonTrim, transparent: true, opacity: 0.75 })
    )
  );
  registerPart(body, bodyMat, true);

  // Cabine
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x0c1322,
    roughness: 0.2,
    metalness: 0.8
  });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.56, 2.1), cabinMat);
  cabin.position.set(0, 1.12, -0.15);
  cabin.castShadow = true;
  registerPart(cabin, cabinMat);

  // Rodas (CylinderGeometry)
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x11141c, roughness: 0.85 });
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 14);
  [
    [-1.02, 0.36, 1.35],
    [1.02, 0.36, 1.35],
    [-1.02, 0.36, -1.35],
    [1.02, 0.36, -1.35]
  ].forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    registerPart(wheel, wheelMat);
  });

  // Faróis dianteiros e lanternas traseiras emissivas
  const headMat = new THREE.MeshBasicMaterial({ color: 0xdff9ff });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
  [-0.7, 0.7].forEach((lx) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.08), headMat);
    hl.position.set(lx, 0.58, 2.22);
    registerPart(hl, headMat);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.08), tailMat);
    tl.position.set(lx, 0.62, -2.22);
    registerPart(tl, tailMat);
  });

  return { carGroup, bodyMesh: body };
}

function buildCars(cfg) {
  cfg.cars.forEach((carCfg, idx) => {
    const { carGroup, bodyMesh } = buildCarMesh(carCfg.color, carCfg.neon);
    carGroup.position.set(carCfg.x, 0, carCfg.z);
    carGroup.rotation.y = carCfg.yaw;
    worldGroup.add(carGroup);

    let headlight = null;
    if (carCfg.isDedsec) {
      headlight = new THREE.PointLight(0x00f0ff, 0, 16);
      headlight.position.set(0, 1.0, 2.8);
      carGroup.add(headlight);
    }

    carGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(carGroup);
    const colliderObj = { box, mesh: bodyMesh, carIndex: idx };
    colliders.push(colliderObj);
    occluders.push(bodyMesh);

    const carObj = {
      id: idx,
      mesh: carGroup,
      bodyMesh,
      colliderObj,
      initialPos: new THREE.Vector3(carCfg.x, 0, carCfg.z),
      initialYaw: carCfg.yaw,
      isDedsec: carCfg.isDedsec,
      speed: 0,
      hackedTimer: 0,
      hackedUsed: false,
      headlight
    };
    cars.push(carObj);
    if (carCfg.isDedsec) dedsecCar = carObj;
  });
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
  const packMat = new THREE.MeshStandardMaterial({ color: 0x0e1320, roughness: 0.5, metalness: 0.4 });
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

  // Pernas
  const legGeo = new THREE.BoxGeometry(0.24, 0.75, 0.24);
  const legL = new THREE.Mesh(legGeo, coatMat);
  legL.position.set(-0.16, 0.38, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, coatMat);
  legR.position.set(0.16, 0.38, 0);
  legR.castShadow = true;

  // Tronco (Jaqueta Hacker com contorno neon)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.82, 0.38), coatMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  torso.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(torso.geometry),
      new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.55 })
    )
  );

  // Braços articulados
  const armGeo = new THREE.BoxGeometry(0.18, 0.68, 0.18);
  const armL = new THREE.Mesh(armGeo, coatMat);
  armL.position.set(-0.44, 1.12, 0);
  armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, coatMat);
  armR.position.set(0.44, 1.12, 0);
  armR.castShadow = true;

  // Tiras neon nos ombros
  const trimGeo = new THREE.BoxGeometry(0.2, 0.06, 0.2);
  const trimL = new THREE.Mesh(trimGeo, visorMat);
  trimL.position.set(-0.44, 1.44, 0);
  const trimR = new THREE.Mesh(trimGeo, visorMat);
  trimR.position.set(0.44, 1.44, 0);

  // Mochila Hacker com LED pulsante
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.22), packMat);
  backpack.position.set(0, 1.16, -0.29);
  backpack.castShadow = true;
  const backpackLed = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.05), ledMat);
  backpackLed.position.set(0, 1.22, -0.41);

  // Cabeça + Capuz
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), hoodMat);
  head.position.y = 1.8;
  head.castShadow = true;

  // Visor Neon (voltado para +Z local)
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.08), visorMat);
  visor.position.set(0, 1.82, 0.22);

  // Pistola Taser DedSec na mão direita (acoplada ao braço direito)
  const taserMesh = new THREE.Group();
  const taserBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.12, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x162032, roughness: 0.4, metalness: 0.6 })
  );
  taserBody.position.set(0, -0.3, 0.18);
  const taserBarrel = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.05, 0.18),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff })
  );
  taserBarrel.position.set(0, -0.29, 0.34);
  taserMesh.add(taserBody, taserBarrel);
  armR.add(taserMesh);

  playerParts = { legL, legR, armL, armR, backpackLed, taserMesh };
  playerGroup.add(legL, legR, torso, armL, armR, trimL, trimR, backpack, backpackLed, head, visor);
  scene.add(playerGroup);
}

// ==========================================
// CÂMERAS DE SEGURANÇA HACKEÁVEIS
// ==========================================
function buildSecurityCameras(cfg) {
  cfg.cameras.forEach((camCfg, idx) => {
    const pos = new THREE.Vector3(camCfg.pos[0], camCfg.pos[1], camCfg.pos[2]);
    const normalMat = new THREE.MeshStandardMaterial({
      color: 0x222c42,
      emissive: 0x00ff88,
      emissiveIntensity: 0.7
    });
    const nethackMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.8), normalMat);
    mesh.position.copy(pos);
    mesh.rotation.y = camCfg.baseYaw;
    mesh.userData.normalMaterial = normalMat;
    mesh.userData.nethackMaterial = nethackMat;
    worldGroup.add(mesh);

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
    coneMesh.rotation.z = camCfg.baseYaw;
    coneMesh.position.set(pos.x, 0.05, pos.z);
    worldGroup.add(coneMesh);

    hackableMeshes.push(mesh);
    securityCameras.push({
      id: idx,
      name: camCfg.name,
      mesh,
      pos: pos.clone(),
      baseYaw: camCfg.baseYaw,
      basePitch: camCfg.basePitch,
      yawOffset: 0,
      pitchOffset: 0,
      coneMesh,
      coneMat,
      visionRange: camVisionRange,
      visionHalfAngle: camVisionHalfAngle,
      disabledTimer: 0,
      sweepPhase: idx * 1.5,
      currentYaw: camCfg.baseYaw
    });
  });
}

// ==========================================
// CAIXAS ELÉTRICAS DE DISTRAÇÃO
// ==========================================
function buildElectricBoxes(cfg) {
  cfg.electricBoxes.forEach((boxCfg, idx) => {
    const pos = new THREE.Vector3(boxCfg.pos[0], boxCfg.pos[1], boxCfg.pos[2]);
    const mesh = createHackableDevice(0.75, 1.3, 0.55, pos.x, pos.y, pos.z, 0xffaa00, boxCfg.name);

    const sparkCount = 24;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkData = [];
    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = pos.x;
      sparkPositions[i * 3 + 1] = pos.y + 0.5;
      sparkPositions[i * 3 + 2] = pos.z;
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
    worldGroup.add(sparkPoints);

    electricBoxes.push({
      id: idx,
      name: boxCfg.name,
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
function buildGuards(cfg) {
  const visionHalfAngle = Math.PI / 5;
  cfg.guards.forEach((gCfg) => {
    const waypoints = gCfg.waypoints.map(([wx, wy, wz]) => new THREE.Vector3(wx, wy, wz));
    const group = new THREE.Group();
    group.position.copy(waypoints[0]);

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
      gCfg.visionRange,
      28,
      -Math.PI / 2 - visionHalfAngle,
      visionHalfAngle * 2
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
    worldGroup.add(group);

    // Faíscas elétricas para estado STUNNED
    const sparkCount = 16;
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkData = [];
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = 0;
      sparkPos[i * 3 + 1] = 0.4;
      sparkPos[i * 3 + 2] = 0;
      sparkData.push({
        vx: (Math.random() - 0.5) * 2.2,
        vy: 0.8 + Math.random() * 1.8,
        vz: (Math.random() - 0.5) * 2.2
      });
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkPoints = new THREE.Points(
      sparkGeo,
      new THREE.PointsMaterial({
        color: 0x00f0ff,
        size: 0.15,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    sparkPoints.visible = false;
    group.add(sparkPoints);

    guards.push({
      mesh: group,
      waypoints,
      initialPos: waypoints[0].clone(),
      currentTarget: 1,
      baseSpeed: gCfg.speed,
      speed: gCfg.speed,
      visionRange: gCfg.visionRange,
      visionHalfAngle,
      coneMesh,
      coneMat,
      sparkPoints,
      sparkData,
      state: GUARD_STATE.PATROL,
      lastKnownPos: null,
      lookAroundTimer: 0,
      lookBaseYaw: 0,
      investigateTarget: null,
      investigateTimer: 0,
      stunTimer: 0
    });
  });
}

// ==========================================
// LINHAS VIRTUAIS DA VISÃO NETHACK
// ==========================================
function buildNetworkLines() {
  networkLinesGroup = new THREE.Group();
  networkLinesGroup.visible = false;

  const points = [];
  gates.forEach((g) => points.push(g.panelMesh.position.clone()));
  electricBoxes.forEach((b) => points.push(b.mesh.position.clone()));
  securityCameras.forEach((c) => points.push(c.pos.clone()));
  points.push(serverMesh.position.clone().setY(2.2));
  if (gates[0]) points.push(gates[0].panelMesh.position.clone());

  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.9
  });

  const networkLine = new THREE.Line(lineGeo, lineMat);
  networkLinesGroup.add(networkLine);
  worldGroup.add(networkLinesGroup);
}

function buildNetHackLabels() {
  if (!dom.nethackLabels) return;
  dom.nethackLabels.innerHTML = '';
  netHackTagItems.length = 0;

  const registerTag = (getPos, getText) => {
    const el = document.createElement('div');
    el.className = 'nethack-tag';
    dom.nethackLabels.appendChild(el);
    netHackTagItems.push({ el, getPos, getText });
  };

  gates.forEach((g, idx) => {
    registerTag(
      () => g.panelMesh.position.clone().add(new THREE.Vector3(0, 1.15, 0)),
      () => (g.unlocked ? `PORTÃO ${idx + 1} ABERTO` : `[E] OVERRIDE PORTÃO ${idx + 1}`)
    );
  });

  electricBoxes.forEach((box) => {
    registerTag(
      () => box.mesh.position.clone().add(new THREE.Vector3(0, 1.05, 0)),
      () => (box.cooldown > 0 ? `RECARGA ${Math.ceil(box.cooldown)}s` : '[E] DISTRAIR')
    );
  });

  securityCameras.forEach((camObj, idx) => {
    registerTag(
      () => camObj.pos.clone().add(new THREE.Vector3(0, 0.55, 0)),
      () =>
        camObj.disabledTimer > 0
          ? `CAM_0${idx + 1} OFF (${Math.ceil(camObj.disabledTimer)}s)`
          : `[C] CAM_0${idx + 1}`
    );
  });

  registerTag(
    () => serverMesh.position.clone().add(new THREE.Vector3(0, 2.55, 0)),
    () =>
      gameState.mission === MISSION_STATE.ESCAPE
        ? 'DADOS EXTRAÍDOS'
        : gameState.serverFirewallDisabled
        ? '[E] BAIXAR DADOS'
        : '[E] SERVIDOR (FIREWALL)'
  );

  cars.forEach((car) => {
    if (car.isDedsec) {
      registerTag(
        () => car.mesh.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
        () => (gameState.drivingCar ? '[F] SAIR DO CARRO' : '[F] DIRIGIR DEDSEC')
      );
    } else {
      registerTag(
        () => car.mesh.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
        () => (car.hackedUsed ? 'CARRO HACKEADO' : '[E] ACELERAR CARRO')
      );
    }
  });
}

function updateNetHackLabels() {
  if (!gameState.netHackActive || !dom.nethackLabels) return;
  const w = window.innerWidth;
  const h = window.innerHeight;

  netHackTagItems.forEach((item) => {
    const pos = item.getPos();
    const projected = pos.project(camera);
    if (
      projected.z > 1 ||
      projected.x < -1.05 ||
      projected.x > 1.05 ||
      projected.y < -1.05 ||
      projected.y > 1.05
    ) {
      item.el.style.display = 'none';
      return;
    }

    const sx = (projected.x * 0.5 + 0.5) * w;
    const sy = (-projected.y * 0.5 + 0.5) * h;
    item.el.style.display = 'block';
    item.el.style.left = `${sx.toFixed(1)}px`;
    item.el.style.top = `${sy.toFixed(1)}px`;
    item.el.textContent = item.getText();
  });
}

// ==========================================
// CONTROLES DE INPUT & POINTER LOCK
// ==========================================
function setupInputs() {
  window.addEventListener('keydown', (e) => {
    const code = e.code;
    gameState.keys[code] = true;

    if (code === 'KeyM') {
      AudioManager.toggleMute();
      return;
    }

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
    } else if (code === 'KeyF') {
      toggleDriveDedsecCar();
    } else if (code === 'Digit1' || code === 'Numpad1') {
      selectWeapon(WEAPON_TYPE.TASER);
    } else if (code === 'Digit2' || code === 'Numpad2') {
      selectWeapon(WEAPON_TYPE.EMP);
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

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (document.pointerLockElement !== dom.canvas) return;
    if (gameState.terminalOpen || gameState.activeCamIndex >= 0 || gameState.drivingCar) return;
    const playing =
      gameState.mission === MISSION_STATE.INFILTRATE ||
      gameState.mission === MISSION_STATE.STEAL_DATA ||
      gameState.mission === MISSION_STATE.ESCAPE;
    if (!playing) return;

    if (gameState.equippedWeapon === WEAPON_TYPE.TASER) {
      fireTaser();
    } else {
      fireEmpPulse();
    }
  });

  // Botões de UI
  dom.btnStart.addEventListener('click', startMission);
  dom.btnRetryGameover.addEventListener('click', restartMission);
  dom.btnRetryVictory.addEventListener('click', restartMission);
  if (dom.btnMute) {
    dom.btnMute.addEventListener('click', () => AudioManager.toggleMute());
  }
  dom.mapButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextMap = btn.dataset.map;
      if (nextMap && MAPS_CONFIG[nextMap]) {
        gameState.selectedMap = nextMap;
        dom.mapButtons.forEach((b) => b.classList.toggle('active', b === btn));
        buildMap(nextMap);
      }
    });
  });
  dom.diffButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      gameState.difficulty = btn.dataset.diff;
      dom.diffButtons.forEach((b) => b.classList.toggle('active', b === btn));
    });
  });

  // Input do Terminal Hacker
  dom.hackInput.addEventListener('input', () => {
    AudioManager.playKeyBeep();
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
        AudioManager.playTerminalError();
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
  if (forceState === undefined) {
    AudioManager.playNetHackPulse(gameState.netHackActive);
  }

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
  AudioManager.playElectricZap();
  gameState.hacksUsed += 1;
  const camObj = securityCameras[gameState.activeCamIndex];
  camObj.disabledTimer = CAMERA_OVERLOAD_DURATION;
  camObj.coneMesh.visible = false;
  camObj.mesh.userData.normalMaterial.emissive.setHex(0x331111);
  cycleSecurityCamera(-1);
}

function triggerElectricBox(box) {
  if (box.cooldown > 0) return;
  AudioManager.playElectricZap();
  gameState.hacksUsed += 1;
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
    nearestGuard.state = GUARD_STATE.DISTRACTED;
    nearestGuard.investigateTarget = new THREE.Vector3(box.mesh.position.x, 0, box.mesh.position.z);
    nearestGuard.investigateTimer = ELECTRIC_INVESTIGATE_TIME;
    nearestGuard.lastKnownPos = null;
    nearestGuard.lookAroundTimer = 0;
  }
}

function handleInteractPress() {
  // Se já está em uma câmera, E também pode sair
  if (gameState.activeCamIndex >= 0) {
    cycleSecurityCamera(-1);
    return;
  }

  const pPos = playerGroup.position;

  // 1. Checar proximidade dos painéis de portão não destravados
  for (let i = 0; i < gates.length; i++) {
    const g = gates[i];
    if (!g.unlocked && pPos.distanceTo(g.panelMesh.position) < 3.6) {
      gameState.activeGateIndex = i;
      openTerminal('GATE');
      return;
    }
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

  // 3b. Checar carros estacionados hackeáveis na Visão NetHack (V)
  if (gameState.netHackActive) {
    for (const car of cars) {
      if (car.isDedsec || car.hackedUsed) continue;
      const distCar = pPos.distanceTo(car.mesh.position);
      const toCar = car.mesh.position.clone().sub(camera.position).normalize();
      if (distCar < 32 && camDir.dot(toCar) > 0.88) {
        car.hackedUsed = true;
        car.hackedTimer = 2.4;
        car.speed = 16.5;
        gameState.hacksUsed += 1;
        AudioManager.playElectricZap();
        return;
      }
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
  const preset = DIFFICULTY_PRESETS[gameState.difficulty];
  const duration = isFirewall ? preset.firewallTime : preset.gateTime;
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
  AudioManager.playTerminalSuccess();
  gameState.hacksUsed += 1;
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

  const targetGate = gates[gameState.activeGateIndex] || gates[0];
  if (targetGate) {
    targetGate.unlocked = true;
    AudioManager.playGateMechanical();
    targetGate.gateMesh.userData.normalMaterial.emissive.setHex(0x00ff88);
    if (targetGate.gateMesh.userData.edgesMaterial) {
      targetGate.gateMesh.userData.edgesMaterial.color.setHex(0x00ff88);
    }
    targetGate.panelMesh.userData.normalMaterial.emissive.setHex(0x00ff88);

    for (let i = colliders.length - 1; i >= 0; i--) {
      if (colliders[i].isGate && colliders[i].gateIndex === targetGate.index) {
        colliders.splice(i, 1);
      }
    }
    const occIdx = occluders.indexOf(targetGate.gateMesh);
    if (occIdx !== -1) occluders.splice(occIdx, 1);
  }

  gameState.gateUnlocked = gates.every((g) => g.unlocked);
  dom.hackFeedback.textContent = '> ACESSO CONCEDIDO // PORTÃO DESTRAVADO!';
  dom.hackFeedback.style.color = '#00ff88';

  if (gameState.mission === MISSION_STATE.INFILTRATE) {
    setMissionState(MISSION_STATE.STEAL_DATA);
  }

  if (gates.some((g) => !g.unlocked)) {
    dom.missionSub.textContent = 'Hackeie a segunda barreira eletrônica para acessar o convés';
  }

  setTimeout(() => {
    closeGateTerminal();
  }, 450);
}

// ==========================================
// ARMAS TÁTICAS DEDSEC (TASER & PULSO EMP)
// ==========================================
function selectWeapon(weaponType) {
  gameState.equippedWeapon = weaponType;
  if (playerParts.taserMesh) {
    playerParts.taserMesh.visible = weaponType === WEAPON_TYPE.TASER;
  }
  updateWeaponHUD();
}

function updateWeaponHUD() {
  const isTaser = gameState.equippedWeapon === WEAPON_TYPE.TASER;
  const cd = isTaser ? gameState.taserCooldown : gameState.empCooldown;
  const maxCd = isTaser ? TASER_COOLDOWN : EMP_COOLDOWN;

  if (dom.statusWeapon) {
    if (isTaser) {
      dom.statusWeapon.textContent =
        cd > 0 ? `[1] TASER (${cd.toFixed(1)}s)` : '[1] TASER (PRONTO)';
      dom.statusWeapon.className = cd > 0 ? 'neon-magenta' : 'neon-cyan';
    } else {
      dom.statusWeapon.textContent =
        cd > 0 ? `[2] EMP (${cd.toFixed(1)}s)` : '[2] EMP (PRONTO)';
      dom.statusWeapon.className = cd > 0 ? 'neon-magenta' : 'neon-green';
    }
  }

  if (dom.weaponCooldownBar && dom.weaponCooldownFill) {
    if (cd > 0) {
      dom.weaponCooldownBar.classList.remove('hidden');
      const pct = THREE.MathUtils.clamp(((maxCd - cd) / maxCd) * 100, 0, 100);
      dom.weaponCooldownFill.style.width = `${pct}%`;
    } else {
      dom.weaponCooldownBar.classList.add('hidden');
    }
  }
}

function spawnTaserFlash(pos) {
  const light = new THREE.PointLight(0x00f0ff, 5.0, 9);
  light.position.copy(pos);
  scene.add(light);
  impactFlashes.push({ light, life: 0.15 });
}

function stunGuard(guard, duration) {
  guard.state = GUARD_STATE.STUNNED;
  guard.stunTimer = duration;
  guard.coneMesh.visible = false;
  guard.investigateTarget = null;
  guard.investigateTimer = 0;
  guard.lookAroundTimer = 0;
  guard.mesh.rotation.x = Math.PI / 2.2;
  guard.mesh.position.y = 0.25;
  if (guard.sparkPoints) {
    guard.sparkPoints.visible = true;
  }
}

function fireTaser() {
  if (gameState.taserCooldown > 0) return;
  gameState.taserCooldown = TASER_COOLDOWN;
  AudioManager.playTaserShot();
  updateWeaponHUD();

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  dir.y = THREE.MathUtils.clamp(dir.y, -0.35, 0.35);
  dir.normalize();

  const startPos = playerGroup.position.clone().add(new THREE.Vector3(0, 1.35, 0));
  startPos.addScaledVector(dir, 0.7);

  const boltMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.55),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff })
  );
  boltMesh.position.copy(startPos);
  boltMesh.lookAt(startPos.clone().add(dir));
  scene.add(boltMesh);

  const trailGeo = new THREE.BufferGeometry().setFromPoints([startPos.clone(), startPos.clone()]);
  const trailLine = new THREE.Line(
    trailGeo,
    new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 })
  );
  scene.add(trailLine);

  projectiles.push({
    mesh: boltMesh,
    line: trailLine,
    origin: startPos.clone(),
    pos: startPos.clone(),
    dir,
    speed: 44,
    life: 1.1
  });
}

function fireEmpPulse() {
  if (gameState.empCooldown > 0) return;
  gameState.empCooldown = EMP_COOLDOWN;
  AudioManager.playEmpPulse();
  updateWeaponHUD();

  const pPos = playerGroup.position.clone();
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const ringMesh = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.85, 48), ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.set(pPos.x, 0.14, pPos.z);
  scene.add(ringMesh);

  empWaves.push({ mesh: ringMesh, mat: ringMat, radius: 1, maxRadius: 8.5 });

  // Desativa instantaneamente todas as câmeras por 8s
  securityCameras.forEach((camObj) => {
    camObj.disabledTimer = Math.max(camObj.disabledTimer, 8.0);
    camObj.coneMesh.visible = false;
    camObj.mesh.userData.normalMaterial.emissive.setHex(0x331111);
  });

  // Atordoa guardas em um raio de 8m por 8 segundos
  guards.forEach((g) => {
    const d = Math.hypot(g.mesh.position.x - pPos.x, g.mesh.position.z - pPos.z);
    if (d <= 8.0) {
      stunGuard(g, 8.0);
    }
  });
}

function updateProjectiles(dt) {
  if (gameState.taserCooldown > 0) {
    gameState.taserCooldown = Math.max(0, gameState.taserCooldown - dt);
  }
  if (gameState.empCooldown > 0) {
    gameState.empCooldown = Math.max(0, gameState.empCooldown - dt);
  }
  updateWeaponHUD();

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.life -= dt;

    const step = p.speed * dt;
    raycaster.set(p.pos, p.dir);
    raycaster.far = step + 0.2;
    const hitObs = raycaster.intersectObjects(occluders, false);

    p.pos.addScaledVector(p.dir, step);
    p.mesh.position.copy(p.pos);

    const trailTail = p.pos.clone().addScaledVector(p.dir, -Math.min(2.2, p.pos.distanceTo(p.origin)));
    p.line.geometry.setFromPoints([trailTail, p.pos.clone()]);

    let hitGuard = null;
    for (const g of guards) {
      if (g.state === GUARD_STATE.STUNNED) continue;
      const distFlat = Math.hypot(p.pos.x - g.mesh.position.x, p.pos.z - g.mesh.position.z);
      if (distFlat < 1.0 && p.pos.y >= 0 && p.pos.y <= 2.2) {
        hitGuard = g;
        break;
      }
    }

    if (hitGuard) {
      spawnTaserFlash(p.pos);
      stunGuard(hitGuard, 12.0);
      AudioManager.playElectricZap();
      scene.remove(p.mesh);
      scene.remove(p.line);
      projectiles.splice(i, 1);
      continue;
    }

    if (hitObs.length > 0 || p.life <= 0) {
      if (hitObs.length > 0) spawnTaserFlash(hitObs[0].point);
      scene.remove(p.mesh);
      scene.remove(p.line);
      projectiles.splice(i, 1);
    }
  }
}

function updateEmpWaves(dt) {
  for (let i = empWaves.length - 1; i >= 0; i--) {
    const w = empWaves[i];
    w.radius += dt * 18;
    w.mesh.scale.set(w.radius, w.radius, 1);
    w.mat.opacity = Math.max(0, 0.85 * (1 - w.radius / w.maxRadius));
    if (w.radius >= w.maxRadius) {
      scene.remove(w.mesh);
      empWaves.splice(i, 1);
    }
  }
}

function toggleDriveDedsecCar() {
  if (!dedsecCar || gameState.terminalOpen || gameState.activeCamIndex >= 0) return;

  if (gameState.drivingCar) {
    const car = gameState.drivingCar;
    gameState.drivingCar = null;
    car.speed = 0;
    if (car.headlight) car.headlight.intensity = 0;
    AudioManager.stopEngineSound();

    // Posicionar jogador ao lado do carro respeitando os limites do mapa atual
    const bounds = (MAPS_CONFIG[gameState.selectedMap] || MAPS_CONFIG.COMPLEXO_CTOS).bounds;
    const sideX = Math.cos(car.mesh.rotation.y) * 1.9;
    const sideZ = -Math.sin(car.mesh.rotation.y) * 1.9;
    playerGroup.position.set(
      THREE.MathUtils.clamp(car.mesh.position.x + sideX, bounds.minX, bounds.maxX),
      0,
      THREE.MathUtils.clamp(car.mesh.position.z + sideZ, bounds.minZ, bounds.maxZ)
    );
    playerGroup.visible = true;
    car.mesh.updateMatrixWorld(true);
    car.colliderObj.box.setFromObject(car.mesh);
    return;
  }

  if (playerGroup.position.distanceTo(dedsecCar.mesh.position) < 4.0) {
    gameState.drivingCar = dedsecCar;
    gameState.isCrouching = false;
    gameState.isSprinting = false;
    playerGroup.visible = false;
    if (dedsecCar.headlight) dedsecCar.headlight.intensity = 2.4;
    if (!gameState.netHackActive) dom.statusMode.textContent = 'VEÍCULO';
  }
}

// ==========================================
// MOVIMENTAÇÃO, COLISÃO, CARROS E CÂMERA
// ==========================================
function updateCars(dt) {
  const bounds = (MAPS_CONFIG[gameState.selectedMap] || MAPS_CONFIG.COMPLEXO_CTOS).bounds;
  cars.forEach((car) => {
    if (car.isDedsec || car.hackedTimer <= 0) return;

    car.hackedTimer = Math.max(0, car.hackedTimer - dt);
    const forwardX = Math.sin(car.mesh.rotation.y);
    const forwardZ = Math.cos(car.mesh.rotation.y);
    const nextX = car.mesh.position.x + forwardX * car.speed * dt;
    const nextZ = car.mesh.position.z + forwardZ * car.speed * dt;

    if (
      nextX > bounds.minX + 0.5 &&
      nextX < bounds.maxX - 0.5 &&
      nextZ > bounds.minZ + 0.5 &&
      nextZ < bounds.maxZ - 0.5 &&
      !checkCollision(nextX, nextZ, 1.5, car)
    ) {
      car.mesh.position.x = nextX;
      car.mesh.position.z = nextZ;
      car.mesh.updateMatrixWorld(true);
      car.colliderObj.box.setFromObject(car.mesh);
    } else {
      car.hackedTimer = 0;
      car.speed = 0;
    }

    // Atordoar guardas no caminho
    guards.forEach((g) => {
      if (g.state !== GUARD_STATE.STUNNED && g.mesh.position.distanceTo(car.mesh.position) < 2.8) {
        stunGuard(g, 6.0);
      }
    });
  });
}

function updatePlayer(dt) {
  if (gameState.terminalOpen || gameState.activeCamIndex >= 0) return;

  // Pulsação do LED da mochila hacker
  if (playerParts.backpackLed) {
    const pulseOn = Math.sin(gameState.elapsedTime * 5) > -0.2;
    playerParts.backpackLed.material.color.setHex(
      gameState.isCrouching ? 0xffaa00 : pulseOn ? 0x00ff88 : 0x004433
    );
  }

  // Modo Direção do Carro Esporte DedSec
  if (gameState.drivingCar) {
    const car = gameState.drivingCar;
    let throttle = 0;
    let steer = 0;
    if (gameState.keys['KeyW'] || gameState.keys['ArrowUp']) throttle += 1;
    if (gameState.keys['KeyS'] || gameState.keys['ArrowDown']) throttle -= 1;
    if (gameState.keys['KeyA'] || gameState.keys['ArrowLeft']) steer += 1;
    if (gameState.keys['KeyD'] || gameState.keys['ArrowRight']) steer -= 1;

    if (throttle !== 0) {
      car.speed = THREE.MathUtils.clamp(car.speed + throttle * 18 * dt, -8.5, 16.5);
    } else {
      car.speed *= Math.max(0, 1 - dt * 3.5);
      if (Math.abs(car.speed) < 0.08) car.speed = 0;
    }

    if (Math.abs(car.speed) > 0.4 && steer !== 0) {
      const dirSign = car.speed >= 0 ? 1 : -1;
      car.mesh.rotation.y += steer * dirSign * 2.2 * dt;
    }

    const fx = Math.sin(car.mesh.rotation.y);
    const fz = Math.cos(car.mesh.rotation.y);
    const stepX = fx * car.speed * dt;
    const stepZ = fz * car.speed * dt;

    const cPos = car.mesh.position;
    if (!checkCollision(cPos.x + stepX, cPos.z, 1.55, car)) {
      cPos.x += stepX;
    } else {
      car.speed *= 0.2;
    }
    if (!checkCollision(cPos.x, cPos.z + stepZ, 1.55, car)) {
      cPos.z += stepZ;
    } else {
      car.speed *= 0.2;
    }

    const bounds = (MAPS_CONFIG[gameState.selectedMap] || MAPS_CONFIG.COMPLEXO_CTOS).bounds;
    cPos.x = THREE.MathUtils.clamp(cPos.x, bounds.minX + 0.5, bounds.maxX - 0.5);
    cPos.z = THREE.MathUtils.clamp(cPos.z, bounds.minZ + 0.5, bounds.maxZ - 0.5);

    car.mesh.updateMatrixWorld(true);
    car.colliderObj.box.setFromObject(car.mesh);
    playerGroup.position.copy(cPos);

    if (Math.abs(car.speed) > 5.0) {
      guards.forEach((g) => {
        if (g.state !== GUARD_STATE.STUNNED && g.mesh.position.distanceTo(cPos) < 2.4) {
          stunGuard(g, 6.0);
        }
      });
    }

    AudioManager.updateEngineSound(Math.abs(car.speed));
    if (!gameState.netHackActive) dom.statusMode.textContent = 'VEÍCULO';
    return;
  }

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

    // Limites do mapa jogável atual (mapCfg.bounds)
    const bounds = (MAPS_CONFIG[gameState.selectedMap] || MAPS_CONFIG.COMPLEXO_CTOS).bounds;
    pos.x = THREE.MathUtils.clamp(pos.x, bounds.minX, bounds.maxX);
    pos.z = THREE.MathUtils.clamp(pos.z, bounds.minZ, bounds.maxZ);

    // Rotação suave na direção do movimento
    const targetRot = Math.atan2(moveX, moveZ);
    let diff = targetRot - playerGroup.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    playerGroup.rotation.y += diff * Math.min(1, dt * 12);

    // Animação de caminhada/corrida nas pernas e braços articulados
    const swingFreq = gameState.isSprinting ? 18 : 12;
    const swingAmp = gameState.isSprinting ? 0.5 : 0.35;
    const swing = Math.sin(gameState.elapsedTime * swingFreq) * swingAmp;
    playerParts.legL.rotation.x = swing;
    playerParts.legR.rotation.x = -swing;
    if (playerParts.armL && playerParts.armR) {
      playerParts.armL.rotation.x = -swing * 0.85;
      playerParts.armR.rotation.x = swing * 0.85;
    }
  } else {
    playerParts.legL.rotation.x = 0;
    playerParts.legR.rotation.x = 0;
    if (playerParts.armL && playerParts.armR) {
      playerParts.armL.rotation.x = 0;
      playerParts.armR.rotation.x = 0;
    }
  }
}

function checkCollision(x, z, radius = PLAYER_RADIUS, ignoreCar = null) {
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

  const focusPos = gameState.drivingCar
    ? gameState.drivingCar.mesh.position
    : playerGroup.position;
  const target = new THREE.Vector3(
    focusPos.x,
    focusPos.y + (gameState.drivingCar ? 1.4 : gameState.isCrouching ? 1.05 : 1.55),
    focusPos.z
  );

  const dist = gameState.drivingCar ? 7.6 : 5.4;
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
      const sweepSpeed = DIFFICULTY_PRESETS[gameState.difficulty].camSweepSpeed;
      camObj.sweepPhase += dt * sweepSpeed;
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
    if (g.state === GUARD_STATE.STUNNED || g.stunTimer > 0) {
      g.stunTimer = Math.max(0, g.stunTimer - dt);
      g.coneMesh.visible = false;

      if (g.sparkPoints) {
        g.sparkPoints.visible = true;
        const attr = g.sparkPoints.geometry.getAttribute('position');
        for (let i = 0; i < g.sparkData.length; i++) {
          const s = g.sparkData[i];
          let sx = attr.getX(i) + s.vx * dt;
          let sy = attr.getY(i) + s.vy * dt;
          let sz = attr.getZ(i) + s.vz * dt;
          if (sy > 1.4) {
            sx = 0;
            sy = 0.2;
            sz = 0;
          }
          attr.setXYZ(i, sx, sy, sz);
        }
        attr.needsUpdate = true;
      }

      if (g.stunTimer === 0) {
        g.mesh.rotation.x = 0;
        g.mesh.position.y = 0;
        g.coneMesh.visible = true;
        if (g.sparkPoints) g.sparkPoints.visible = false;
        g.state = GUARD_STATE.INVESTIGATE;
        g.lastKnownPos = g.mesh.position.clone();
        g.lookAroundTimer = 3.0;
        g.lookBaseYaw = g.mesh.rotation.y;
      }
      return;
    }

    // 1. Máquina de estados de movimentação (DISTRACTED, INVESTIGATE, PATROL)
    if (g.state === GUARD_STATE.DISTRACTED && g.investigateTarget) {
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
        g.state = GUARD_STATE.PATROL;
      }
    } else if (g.state === GUARD_STATE.INVESTIGATE && g.lastKnownPos) {
      const toLast = g.lastKnownPos.clone().sub(g.mesh.position);
      toLast.y = 0;
      const distLast = toLast.length();

      if (distLast > 0.75 && g.lookAroundTimer <= 0) {
        toLast.normalize();
        g.mesh.position.addScaledVector(toLast, g.speed * 1.15 * dt);
        const desiredYaw = Math.atan2(toLast.x, toLast.z);
        let diff = desiredYaw - g.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        g.mesh.rotation.y += diff * Math.min(1, dt * 8);
      } else {
        if (g.lookAroundTimer <= 0) {
          g.lookAroundTimer = 3.0;
          g.lookBaseYaw = g.mesh.rotation.y;
        } else {
          g.lookAroundTimer = Math.max(0, g.lookAroundTimer - dt);
          const elapsedLook = 3.0 - g.lookAroundTimer;
          g.mesh.rotation.y = g.lookBaseYaw + Math.sin(elapsedLook * 3.4) * 0.85;
          if (g.lookAroundTimer === 0) {
            g.lastKnownPos = null;
            g.state = GUARD_STATE.PATROL;
          }
        }
      }
    } else {
      // Patrulha ida e volta (PATROL)
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

    // 2. Checar se o jogador está no cone de visão + linha de visão livre
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
      g.lastKnownPos = new THREE.Vector3(playerPos.x, 0, playerPos.z);
      if (gameState.detectionLevel >= 40) {
        g.state = GUARD_STATE.INVESTIGATE;
        g.lookAroundTimer = 0;
        g.investigateTarget = null;
        g.investigateTimer = 0;
      }
      g.coneMat.color.setHex(0xff0055);
      g.coneMat.opacity = 0.42;
    } else if (g.state === GUARD_STATE.INVESTIGATE || g.state === GUARD_STATE.DISTRACTED) {
      g.coneMat.color.setHex(0xff7700);
      g.coneMat.opacity = 0.34;
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
  gameState.maxDetection = Math.max(gameState.maxDetection, gameState.detectionLevel);

  AudioManager.updateAlertTick(dt, gameState.detectionLevel);

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
    AudioManager.setMusicTempo(138);
  }
}

function updateInteractionsAndMission(dt) {
  // Animação de abertura dos portões destravados
  gates.forEach((g) => {
    if (g.unlocked && g.openProgress < 1) {
      g.openProgress = Math.min(1, g.openProgress + dt * 1.4);
      g.gateMesh.position.x = THREE.MathUtils.lerp(g.initialX, g.openX, g.openProgress);
    }
  });

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
        AudioManager.playTerminalError();
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

  // Prompt dos painéis de portão
  for (let i = 0; i < gates.length; i++) {
    const g = gates[i];
    if (!g.unlocked && pPos.distanceTo(g.panelMesh.position) < 3.6) {
      promptText = `[E] HACKEAR PAINEL DO PORTÃO ${gates.length > 1 ? i + 1 : ''}`.trim();
      break;
    }
  }

  // Prompt do carro DedSec dirigível
  if (!promptText && dedsecCar && gameState.activeCamIndex < 0) {
    if (gameState.drivingCar) {
      promptText = '[F] SAIR DO CARRO DEDSEC';
    } else if (pPos.distanceTo(dedsecCar.mesh.position) < 4.0) {
      promptText = '[F] ENTRAR NO CARRO DEDSEC';
    }
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
  gameState.maxDetection = 0;
  gameState.hacksUsed = 0;
  gameState.taserCooldown = 0;
  gameState.empCooldown = 0;
  selectWeapon(WEAPON_TYPE.TASER);
  gameState.isSprinting = false;
  gameState.isCrouching = false;
  gameState.cameraYaw = 0;
  gameState.cameraPitch = 0.34;
  gameState.keys = {};

  if (gameState.netHackActive) toggleNetHack(false);
  if (gameState.activeCamIndex >= 0) cycleSecurityCamera(-1);

  gameState.drivingCar = null;
  AudioManager.stopEngineSound();
  const mapCfg = MAPS_CONFIG[gameState.selectedMap] || MAPS_CONFIG.COMPLEXO_CTOS;
  playerGroup.visible = true;
  playerGroup.position.set(mapCfg.playerStart[0], mapCfg.playerStart[1], mapCfg.playerStart[2]);
  playerGroup.rotation.y = 0;
  playerGroup.scale.y = 1;

  // Resetar carros
  cars.forEach((car) => {
    car.mesh.position.copy(car.initialPos);
    car.mesh.rotation.y = car.initialYaw;
    car.speed = 0;
    car.hackedTimer = 0;
    car.hackedUsed = false;
    if (car.headlight) car.headlight.intensity = 0;
    car.mesh.updateMatrixWorld(true);
    car.colliderObj.box.setFromObject(car.mesh);
  });

  // Restaurar portões e colisores caso tenham sido abertos
  gates.forEach((g) => {
    g.unlocked = false;
    g.openProgress = 0;
    g.gateMesh.position.x = g.initialX;
    g.gateMesh.userData.normalMaterial.emissive.setHex(0xff0055);
    if (g.gateMesh.userData.edgesMaterial) {
      g.gateMesh.userData.edgesMaterial.color.setHex(0xff0055);
    }
    g.panelMesh.userData.normalMaterial.emissive.setHex(0x00f0ff);

    if (!colliders.some((c) => c.isGate && c.gateIndex === g.index)) {
      g.gateMesh.updateMatrixWorld(true);
      colliders.push({
        box: new THREE.Box3().setFromObject(g.gateMesh),
        mesh: g.gateMesh,
        isGate: true,
        gateIndex: g.index
      });
    }
    if (!occluders.includes(g.gateMesh)) {
      occluders.push(g.gateMesh);
    }
  });
  serverMesh.userData.normalMaterial.emissive.setHex(0xff0055);

  const preset = DIFFICULTY_PRESETS[gameState.difficulty];

  // Limpar projéteis e ondas EMP ativos
  for (let i = projectiles.length - 1; i >= 0; i--) {
    scene.remove(projectiles[i].mesh);
    scene.remove(projectiles[i].line);
    projectiles.splice(i, 1);
  }
  for (let i = empWaves.length - 1; i >= 0; i--) {
    scene.remove(empWaves[i].mesh);
    empWaves.splice(i, 1);
  }

  // Resetar guardas, câmeras e caixas elétricas
  guards.forEach((g) => {
    g.mesh.position.copy(g.initialPos);
    g.mesh.rotation.x = 0;
    g.coneMesh.visible = true;
    if (g.sparkPoints) g.sparkPoints.visible = false;
    g.speed = g.baseSpeed * preset.guardSpeedMult;
    g.currentTarget = 1;
    g.state = GUARD_STATE.PATROL;
    g.lastKnownPos = null;
    g.lookAroundTimer = 0;
    g.lookBaseYaw = 0;
    g.investigateTarget = null;
    g.investigateTimer = 0;
    g.stunTimer = 0;
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
  AudioManager.init();
  resetWorldState();
  dom.startScreen.classList.add('hidden');
  dom.gameoverScreen.classList.add('hidden');
  dom.victoryScreen.classList.add('hidden');
  dom.hud.classList.remove('hidden');

  setMissionState(MISSION_STATE.INFILTRATE);
  AudioManager.startMusic(96);
  dom.canvas.requestPointerLock();
}

function restartMission() {
  startMission();
}

function triggerGameOver() {
  gameState.mission = MISSION_STATE.GAMEOVER;
  AudioManager.stopMusic();
  AudioManager.stopEngineSound();
  AudioManager.playGameOverSiren();
  if (document.pointerLockElement === dom.canvas) {
    document.exitPointerLock();
  }
  dom.hud.classList.add('hidden');
  dom.alertVignette.classList.add('hidden');
  dom.gameoverScreen.classList.remove('hidden');
}

function calculateMissionRank() {
  const det = gameState.maxDetection;
  const time = gameState.elapsedTime;
  if (det < 15 && time <= 85) return 'RANK S - FANTASMA';
  if (det < 45 && time <= 120) return 'RANK A - INFILTRADOR';
  if (det < 80 && time <= 165) return 'RANK B - OPERATIVO';
  return 'RANK C';
}

function triggerVictory() {
  gameState.mission = MISSION_STATE.VICTORY;
  AudioManager.stopMusic();
  AudioManager.stopEngineSound();
  AudioManager.playVictoryChime();
  if (document.pointerLockElement === dom.canvas) {
    document.exitPointerLock();
  }
  dom.hud.classList.add('hidden');
  dom.finalTime.textContent = formatTime(gameState.elapsedTime);
  if (dom.finalRank) dom.finalRank.textContent = calculateMissionRank();
  if (dom.finalDetection) dom.finalDetection.textContent = `${Math.round(gameState.maxDetection)}%`;
  if (dom.finalHacks) dom.finalHacks.textContent = String(gameState.hacksUsed);
  if (dom.finalMap) {
    dom.finalMap.textContent = (MAPS_CONFIG[gameState.selectedMap] || MAPS_CONFIG.COMPLEXO_CTOS).label;
  }
  if (dom.finalDifficulty) {
    dom.finalDifficulty.textContent = DIFFICULTY_PRESETS[gameState.difficulty].label;
  }
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

  if (waterMesh) {
    waterMesh.position.y = -0.42 + Math.sin(nowSec * 1.4) * 0.06;
    waterMesh.material.emissiveIntensity = 0.65 + Math.sin(nowSec * 2.0) * 0.12;
  }

  for (let i = impactFlashes.length - 1; i >= 0; i--) {
    const f = impactFlashes[i];
    f.life -= dt;
    f.light.intensity = Math.max(0, 5.0 * (f.life / 0.15));
    if (f.life <= 0) {
      scene.remove(f.light);
      impactFlashes.splice(i, 1);
    }
  }
}

function updateRadar() {
  if (!dom.radarCanvas) return;
  const ctx = dom.radarCanvas.getContext('2d');
  const size = dom.radarCanvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;
  const scale = 2.85;

  const pPos = playerGroup.position;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  // Fundo e anéis de alcance
  ctx.fillStyle = 'rgba(6, 12, 24, 0.9)';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.14)';
  ctx.lineWidth = 1;
  [radius * 0.35, radius * 0.7].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Transformar mundo para o espaço do radar (jogador no centro, câmera apontando para cima)
  ctx.translate(cx, cy);
  ctx.rotate(gameState.cameraYaw);

  const toRadar = (wx, wz) => ({
    x: (wx - pPos.x) * scale,
    y: (wz - pPos.z) * scale
  });

  // Planta baixa dos muros do mapa atual
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
  ctx.lineWidth = 2.2;
  radarWalls.forEach((w) => {
    const p1 = toRadar(w.x1, w.z1);
    const p2 = toRadar(w.x2, w.z2);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });

  // Portões eletrônicos
  gates.forEach((g) => {
    const gPos = toRadar(g.gateMesh.position.x, g.gateMesh.position.z);
    ctx.strokeStyle = g.unlocked ? '#00ff88' : '#ff0055';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gPos.x - 3 * scale, gPos.y);
    ctx.lineTo(gPos.x + 3 * scale, gPos.y);
    ctx.stroke();
  });

  // Caixas de cobertura
  ctx.fillStyle = 'rgba(36, 48, 74, 0.85)';
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.45)';
  ctx.lineWidth = 1;
  radarCrates.forEach((c) => {
    const pos = toRadar(c.x, c.z);
    const rw = c.w * scale;
    const rd = c.d * scale;
    ctx.fillRect(pos.x - rw / 2, pos.y - rd / 2, rw, rd);
    ctx.strokeRect(pos.x - rw / 2, pos.y - rd / 2, rw, rd);
  });

  // Quarteirões / prédios laterais da rua
  ctx.fillStyle = 'rgba(20, 27, 45, 0.9)';
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
  ctx.lineWidth = 1;
  radarBuildings.forEach((b) => {
    const bp = toRadar(b.x, b.z);
    const bw = b.w * scale;
    const bd = b.d * scale;
    ctx.fillRect(bp.x - bw / 2, bp.y - bd / 2, bw, bd);
    ctx.strokeRect(bp.x - bw / 2, bp.y - bd / 2, bw, bd);
  });

  // Carros (estacionados e DedSec dirigível)
  cars.forEach((car) => {
    const cp = toRadar(car.mesh.position.x, car.mesh.position.z);
    ctx.save();
    ctx.translate(cp.x, cp.y);
    ctx.rotate(-car.mesh.rotation.y);
    ctx.fillStyle = car.isDedsec ? '#00f0ff' : car.hackedUsed ? '#ffaa00' : '#94a3b8';
    ctx.fillRect(-1.05 * scale, -2.2 * scale, 2.1 * scale, 4.4 * scale);
    ctx.restore();
  });

  // Servidor central ctOS
  const sPos = toRadar(serverMesh.position.x, serverMesh.position.z);
  ctx.fillStyle = gameState.serverFirewallDisabled ? '#00f0ff' : '#ff0055';
  ctx.fillRect(sPos.x - 3.5, sPos.y - 3.5, 7, 7);

  // Zona de extração
  const ePos = toRadar(extractionZoneGroup.position.x, extractionZoneGroup.position.z);
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ePos.x, ePos.y, 2.3 * scale, 0, Math.PI * 2);
  ctx.stroke();

  // Guardas e cones de visão
  guards.forEach((g) => {
    const gp = toRadar(g.mesh.position.x, g.mesh.position.z);
    const yaw = g.mesh.rotation.y;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const dirAngle = Math.atan2(fz, fx);

    ctx.fillStyle =
      g.state === GUARD_STATE.INVESTIGATE || g.state === GUARD_STATE.DISTRACTED
        ? 'rgba(255, 119, 0, 0.28)'
        : 'rgba(255, 208, 0, 0.22)';
    ctx.beginPath();
    ctx.moveTo(gp.x, gp.y);
    ctx.arc(
      gp.x,
      gp.y,
      g.visionRange * scale,
      dirAngle - g.visionHalfAngle,
      dirAngle + g.visionHalfAngle
    );
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff2a55';
    ctx.beginPath();
    ctx.arc(gp.x, gp.y, 3.8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Seta do jogador no centro
  ctx.rotate(-playerGroup.rotation.y);
  ctx.fillStyle = '#00f0ff';
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(-4.5, -5);
  ctx.lineTo(0, -2.5);
  ctx.lineTo(4.5, -5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
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
    updateCars(dt);
    updateProjectiles(dt);
    updateEmpWaves(dt);
    updateElectricBoxes(dt);
    updateGuards(dt);
    updateInteractionsAndMission(dt);
    updateRadar();
    if (gameState.netHackActive) {
      updateNetHackLabels();
    }
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
