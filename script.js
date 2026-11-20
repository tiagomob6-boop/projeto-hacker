import * as THREE from 'three';

// ==========================================
// CONSTANTES E ESTADO GLOBAL
// ==========================================
const MISSION_STATE = {
  FREE_ROAM: 'FREE_ROAM',
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
  STUNNED: 'STUNNED',
  COMBAT: 'COMBAT',
  DEAD: 'DEAD'
};

const WEAPON_TYPE = {
  TASER: 'TASER',
  PISTOL: 'PISTOL',
  RIFLE: 'RIFLE',
  EMP: 'EMP'
};

const WEAPON_CONFIG = {
  TASER: { key: 'TASER', label: '[1] TASER', cooldown: 1.5, damage: 0, speed: 46, color: 0x00f0ff, noiseRadius: 10 },
  PISTOL: { key: 'PISTOL', label: '[2] 9MM SIL.', cooldown: 0.35, damage: 50, speed: 60, color: 0x88ffff, noiseRadius: 0 },
  RIFLE: { key: 'RIFLE', label: '[3] RIFLE', cooldown: 0.14, damage: 35, speed: 66, color: 0xffaa00, noiseRadius: 26 },
  EMP: { key: 'EMP', label: '[4] EMP', cooldown: 12.0, damage: 0, speed: 0, color: 0x00f0ff, noiseRadius: 22 }
};

const TASER_COOLDOWN = WEAPON_CONFIG.TASER.cooldown;
const EMP_COOLDOWN = WEAPON_CONFIG.EMP.cooldown;

const WORLD_BOUNDS = { minX: -1200, maxX: 1200, minZ: -1400, maxZ: 1400 };
const DOCKS_OFFSET_X = 445;

const MAPS_CONFIG = {
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
    markerPos: [DOCKS_OFFSET_X, 0.06, 60],
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
const projectiles = [];     // { mesh, line, origin, pos, dir, speed, life, damage, isTaser }
const guardProjectiles = []; // { mesh, pos, dir, speed, life }
const empWaves = [];        // { mesh, mat, radius, maxRadius }
const impactFlashes = [];   // { light, life }
const blinkingLights = [];  // { mat, phase }
const sirenLights = [];     // { blueMat, redMat, phase }
const netHackTagItems = []; // { el, getPos, getText }
const missionMarkers = [];  // { key, ring, beam }
const missionServers = {};  // { COMPLEXO_CTOS: { mesh, core, particles, particleData }, DOCAS_BAIA_SF: ... }
const missionExtractions = {}; // { COMPLEXO_CTOS: { group, ring, beam }, DOCAS_BAIA_SF: ... }
let dedsecCar = null;

// Estado do jogo
const gameState = {
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

  playSilencedShot() {
    this._tone(520, 140, 0.08, 'triangle', 0.11, 1400);
  },

  playRifleShot() {
    this._tone(240, 75, 0.1, 'sawtooth', 0.14, 1900);
  },

  playGuardShot() {
    this._tone(200, 65, 0.11, 'sawtooth', 0.11, 1500);
  },

  playPlayerHit() {
    this._tone(160, 55, 0.16, 'square', 0.16, 700);
  },

  playBaseAlertSiren() {
    this._tone(620, 880, 0.28, 'sawtooth', 0.16, 1500, 0);
    this._tone(880, 540, 0.32, 'sawtooth', 0.16, 1500, 0.28);
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
  scene.fog = new THREE.FogExp2(0x090b1a, 0.0022);

  camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 950);

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

function getSurfaceHeight(x, z) {
  // Ponte Golden Gate atravessável (X: 80..400, Z: 26..44)
  if (z >= 26 && z <= 44 && x >= 80 && x <= 400) {
    if (x < 120) return ((x - 80) / 40) * 10;
    if (x <= 360) return 10;
    return ((400 - x) / 40) * 10;
  }
  return 0;
}

function buildMap() {
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
  blinkingLights.length = 0;
  sirenLights.length = 0;
  missionMarkers.length = 0;
  waterMesh = null;
  dedsecCar = null;

  // Água da Baía de São Francisco cobrindo todo o mundo aberto (X: -1200..1200, Z: -1400..1400)
  const bayWaterMat = new THREE.MeshStandardMaterial({
    color: 0x05182e,
    emissive: 0x03223d,
    emissiveIntensity: 0.7,
    roughness: 0.12,
    metalness: 0.85
  });
  waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(2500, 2900), bayWaterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.set(0, -0.55, 0);
  worldGroup.add(waterMesh);

  // Setor 1: Centro Urbano + Complexo ctOS
  buildEnvironment(MAPS_CONFIG.COMPLEXO_CTOS);

  // Ponte Golden Gate Atravessável ligando Centro Urbano (X=80) às Docas da Baía SF (X=400)
  buildTraversableGoldenGate();

  // Setor 2: Docas da Baía SF (X ~ 445)
  buildDocksEnvironment(MAPS_CONFIG.DOCAS_BAIA_SF);

  // Marcadores Holográficos de Missão no Mapa
  buildMissionMarkers();

  // Veículos do Mundo Aberto
  buildCars();

  // Câmeras, Caixas Elétricas e Guardas das duas missões
  ['COMPLEXO_CTOS', 'DOCAS_BAIA_SF'].forEach((mKey) => {
    const mCfg = MAPS_CONFIG[mKey];
    buildSecurityCameras(mCfg, mKey);
    buildElectricBoxes(mCfg);
    buildGuards(mCfg, mKey);
  });

  buildNetworkLines();
  buildNetHackLabels();
}

function buildTraversableGoldenGate() {
  const zCenter = 35;
  const deckW = 18;
  const bridgeGroup = new THREE.Group();

  const neonOrangeMat = new THREE.MeshBasicMaterial({ color: 0xff5a1f, fog: false });
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x161e2e, roughness: 0.85 });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x3b1812,
    emissive: 0xff4500,
    emissiveIntensity: 0.65,
    roughness: 0.5
  });

  // Tabuleiro principal elevado (X: 120..360, y = 10)
  const mainDeck = new THREE.Mesh(new THREE.BoxGeometry(240, 0.8, deckW), roadMat);
  mainDeck.position.set(240, 9.6, zCenter);
  mainDeck.receiveShadow = true;
  bridgeGroup.add(mainDeck);

  // Rampas suaves (Oeste: X=80..120, Leste: X=360..400)
  const rampLen = Math.hypot(40, 10);
  const rampAngle = Math.atan2(10, 40);

  const rampWest = new THREE.Mesh(new THREE.BoxGeometry(rampLen, 0.8, deckW), roadMat);
  rampWest.position.set(100, 4.6, zCenter);
  rampWest.rotation.z = rampAngle;
  rampWest.receiveShadow = true;
  bridgeGroup.add(rampWest);

  const rampEast = new THREE.Mesh(new THREE.BoxGeometry(rampLen, 0.8, deckW), roadMat);
  rampEast.position.set(380, 4.6, zCenter);
  rampEast.rotation.z = -rampAngle;
  rampEast.receiveShadow = true;
  bridgeGroup.add(rampEast);

  // Faixas laranja-neon e linhas centrais da pista
  const trimN = new THREE.Mesh(new THREE.BoxGeometry(240, 0.3, 0.4), neonOrangeMat);
  trimN.position.set(240, 10.2, zCenter - deckW / 2);
  const trimS = new THREE.Mesh(new THREE.BoxGeometry(240, 0.3, 0.4), neonOrangeMat);
  trimS.position.set(240, 10.2, zCenter + deckW / 2);
  bridgeGroup.add(trimN, trimS);

  // Guard-rails laterais com colisão para não cair na baía
  addStaticBox(320, 12, 0.8, 240, 6, zCenter - deckW / 2 - 0.5, 0x26314a, { occlude: false });
  addStaticBox(320, 12, 0.8, 240, 6, zCenter + deckW / 2 + 0.5, 0x26314a, { occlude: false });

  // Duas torres monumentais da Golden Gate (X = 185 e X = 295)
  const towerXs = [185, 295];
  towerXs.forEach((tx) => {
    [-deckW / 2 - 0.6, deckW / 2 + 0.6].forEach((oz) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 48, 2.2), steelMat);
      pillar.position.set(tx, 24, zCenter + oz);
      bridgeGroup.add(pillar);
    });
    [22, 34, 46].forEach((cy) => {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, deckW + 2.4), neonOrangeMat);
      cross.position.set(tx, cy, zCenter);
      bridgeGroup.add(cross);
    });
  });

  // Cabos catenários e pendurais em ambos os lados da ponte
  const cableMat = new THREE.LineBasicMaterial({ color: 0xff6b2b, fog: false });
  [-deckW / 2 - 0.6, deckW / 2 + 0.6].forEach((oz) => {
    const cablePts = [];
    const samples = 28;
    for (let i = 0; i <= samples; i++) {
      const x = THREE.MathUtils.lerp(120, 360, i / samples);
      let y;
      if (x < towerXs[0]) {
        const t = (x - 120) / (towerXs[0] - 120);
        y = THREE.MathUtils.lerp(10.5, 46, t * t);
      } else if (x <= towerXs[1]) {
        const midT = ((x - towerXs[0]) / (towerXs[1] - towerXs[0])) * 2 - 1;
        y = 14 + 32 * (midT * midT);
      } else {
        const t = (360 - x) / (360 - towerXs[1]);
        y = THREE.MathUtils.lerp(10.5, 46, t * t);
      }
      cablePts.push(new THREE.Vector3(x, y, zCenter + oz));
      if (i % 2 === 0 && Math.abs(x - towerXs[0]) > 3 && Math.abs(x - towerXs[1]) > 3) {
        const hGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 10.2, zCenter + oz),
          new THREE.Vector3(x, y, zCenter + oz)
        ]);
        bridgeGroup.add(new THREE.Line(hGeo, cableMat));
      }
    }
    bridgeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cablePts), cableMat));
  });

  worldGroup.add(bridgeGroup);
}

function buildMissionMarkers() {
  ['COMPLEXO_CTOS', 'DOCAS_BAIA_SF'].forEach((mKey) => {
    const mCfg = MAPS_CONFIG[mKey];
    const [mx, my, mz] = mCfg.markerPos;
    const color = mKey === 'COMPLEXO_CTOS' ? 0x00f0ff : 0xffaa00;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2.3, 32),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(mx, my, mz);
    worldGroup.add(ring);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.0, 7.5, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    beam.position.set(mx, 3.75, mz);
    worldGroup.add(beam);

    missionMarkers.push({ key: mKey, pos: new THREE.Vector3(mx, 0, mz), ring, beam });
  });
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

function buildDetailedBuilding(x, z, w, h, d, style = {}) {
  const accent = style.accent ?? 0x00f0ff;
  const bodyColor = style.bodyColor ?? 0x141b2d;
  const collide = style.collide !== false;
  const occlude = style.occlude !== false;

  if (collide) {
    radarBuildings.push({ x, z, w, d });
  }

  // 1. Base / Térreo com pilares nos cantos e vitrines iluminadas
  const baseH = Math.min(3.4, h * 0.24);
  addStaticBox(w * 0.92, baseH, d * 0.92, x, baseH / 2, z, 0x0f1626, {
    collide,
    occlude,
    edgesColor: accent,
    edgesOpacity: 0.35
  });

  [
    [-w * 0.46, -d * 0.46],
    [w * 0.46, -d * 0.46],
    [-w * 0.46, d * 0.46],
    [w * 0.46, d * 0.46]
  ].forEach(([px, pz]) => {
    addStaticBox(0.55, baseH, 0.55, x + px, baseH / 2, z + pz, 0x202a42, {
      collide: false,
      occlude: false
    });
  });

  // Vitrines iluminadas no térreo
  const vitrineMat = {
    collide: false,
    occlude: false,
    emissive: accent,
    emissiveIntensity: 0.95
  };
  addStaticBox(w * 0.72, 1.4, 0.14, x, 1.1, z + d * 0.47, accent, vitrineMat);
  addStaticBox(w * 0.72, 1.4, 0.14, x, 1.1, z - d * 0.47, accent, vitrineMat);

  // 2. Corpo principal + recuo (setback) nos andares superiores
  const lowerH = (h - baseH) * 0.62;
  const upperH = (h - baseH) * 0.38;
  const lowerY = baseH + lowerH / 2;
  const upperY = baseH + lowerH + upperH / 2;

  addStaticBox(w, lowerH, d, x, lowerY, z, bodyColor, {
    collide,
    occlude,
    edgesColor: 0x25324d,
    edgesOpacity: 0.55
  });
  addStaticBox(w * 0.8, upperH, d * 0.8, x, upperY, z, 0x101726, {
    collide: false,
    occlude,
    edgesColor: accent,
    edgesOpacity: 0.4
  });

  // Molduras horizontais entre andares e fileiras de janelas emissivas
  const winMat = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.45
  });
  const floors = Math.max(2, Math.floor(lowerH / 3.2));
  for (let f = 0; f < floors; f++) {
    const fy = baseH + 1.4 + f * 3.1;
    // Moldura horizontal
    addStaticBox(w + 0.2, 0.18, d + 0.2, x, fy + 1.1, z, 0x222d46, {
      collide: false,
      occlude: false
    });
    // Fileira de janelas na face frontal/traseira e laterais
    for (let wx = -w * 0.34; wx <= w * 0.34; wx += 1.6) {
      const winF = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.08), winMat);
      winF.position.set(x + wx, fy, z + d / 2 + 0.05);
      worldGroup.add(winF);

      const winB = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.08), winMat);
      winB.position.set(x + wx, fy, z - d / 2 - 0.05);
      worldGroup.add(winB);
    }
  }

  // Letreiro neon vertical na fachada
  const signSide = x < 0 ? w / 2 + 0.14 : -w / 2 - 0.14;
  addStaticBox(0.18, lowerH * 0.68, 0.65, x + signSide, lowerY, z, accent, {
    collide: false,
    occlude: false,
    emissive: accent,
    emissiveIntensity: 1.5
  });

  // 3. Topo detalhado: parapeito, ar-condicionado/geradores e antena com luz vermelha piscante
  const roofY = baseH + lowerH + upperH;
  const rw = w * 0.8;
  const rd = d * 0.8;
  addStaticBox(rw, 0.45, 0.25, x, roofY + 0.22, z + rd / 2, 0x25324d, { collide: false, occlude: false });
  addStaticBox(rw, 0.45, 0.25, x, roofY + 0.22, z - rd / 2, 0x25324d, { collide: false, occlude: false });
  addStaticBox(1.8, 0.9, 1.4, x - rw * 0.2, roofY + 0.45, z, 0x2e3b55, { collide: false, occlude: false });
  addStaticBox(0.14, 3.4, 0.14, x + rw * 0.2, roofY + 1.7, z, 0x3b4a68, { collide: false, occlude: false });

  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
  const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), beaconMat);
  beacon.position.set(x + rw * 0.2, roofY + 3.45, z);
  worldGroup.add(beacon);
  blinkingLights.push({ mat: beaconMat, phase: Math.random() * Math.PI * 2 });
}

function buildEnvironment(cfg) {
  // Chão principal ampliado (cobre X: -65..65 e Z: -65..75)
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x101422,
    roughness: 0.88,
    metalness: 0.15
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(164, 174), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 5);
  ground.receiveShadow = true;
  worldGroup.add(ground);

  const grid = new THREE.GridHelper(164, 82, 0x00f0ff, 0x162442);
  grid.position.set(0, 0.015, 5);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  worldGroup.add(grid);

  // Calçadas elevadas, praça central e estacionamento coberto
  const sidewalkOpts = { collide: false, occlude: false, edgesColor: 0x26324d, edgesOpacity: 0.5 };
  addStaticBox(24, 0.14, 68, -52, 0.07, 34, 0x1a2234, sidewalkOpts);
  addStaticBox(24, 0.14, 68, 52, 0.07, 34, 0x1a2234, sidewalkOpts);
  addStaticBox(128, 0.14, 18, 0, 0.07, 65, 0x1a2234, sidewalkOpts);
  addStaticBox(24, 0.14, 18, 0, 0.07, 48, 0x1d273c, sidewalkOpts); // Praça central da extração

  // Estacionamento coberto na avenida oeste (X: -48..-32, Z: 22..44)
  addStaticBox(16, 0.35, 22, -40, 4.2, 33, 0x182236, {
    collide: false,
    occlude: false,
    edgesColor: 0x00f0ff,
    edgesOpacity: 0.55
  });
  [[-47, 23], [-33, 23], [-47, 43], [-33, 43]].forEach(([px, pz]) => {
    addStaticBox(0.55, 4.2, 0.55, px, 2.1, pz, 0x2a3650, { occlude: false });
  });

  // Faixas da avenida principal e vias laterais
  for (let x = -34; x <= 34; x += 6) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.03, 0.25),
      new THREE.MeshBasicMaterial({ color: 0x2f436e })
    );
    stripe.position.set(x, 0.02, 20);
    worldGroup.add(stripe);
  }

  // Faixas de pedestres
  [-28, 28].forEach((cx) => {
    for (let z = 14; z <= 32; z += 2.4) {
      const zebra = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 0.025, 1.1),
        new THREE.MeshBasicMaterial({ color: 0x4b6584 })
      );
      zebra.position.set(cx, 0.02, z);
      worldGroup.add(zebra);
    }
  });

  // Hidrantes e barreiras de concreto urbanas
  [[-38, 12], [38, 12], [-38, 48], [38, 48]].forEach(([hx, hz]) => {
    addStaticBox(0.42, 0.85, 0.42, hx, 0.5, hz, 0xd63031, { occlude: false });
    addStaticBox(0.52, 0.18, 0.26, hx, 0.72, hz, 0xb2bec3, { collide: false, occlude: false });
  });

  [[-16, 22], [16, 22], [-20, 44], [20, 44], [0, 36]].forEach(([bx, bz]) => {
    addStaticBox(3.4, 1.05, 0.8, bx, 0.52, bz, 0x3d485e, {
      edgesColor: 0xffaa00,
      edgesOpacity: 0.6
    });
  });

  // Quarteirões urbanos detalhados (com becos laterais entre eles)
  buildDetailedBuilding(-52, 16, 14, 18, 14, { accent: 0x00f0ff });
  buildDetailedBuilding(-52, 42, 14, 22, 16, { accent: 0xff0055 });
  buildDetailedBuilding(-52, -14, 14, 20, 16, { accent: 0x38bdf8 });
  buildDetailedBuilding(52, 16, 14, 19, 14, { accent: 0xff0055 });
  buildDetailedBuilding(52, 42, 14, 24, 16, { accent: 0x00f0ff });
  buildDetailedBuilding(52, -14, 14, 21, 16, { accent: 0xffaa00 });

  // Arranha-céus detalhados do skyline ao fundo (fora da área jogável)
  buildDetailedBuilding(-76, -32, 14, 34, 14, { accent: 0x00f0ff, collide: false, occlude: false });
  buildDetailedBuilding(76, -28, 14, 36, 14, { accent: 0xff0055, collide: false, occlude: false });
  buildDetailedBuilding(-24, -70, 16, 38, 14, { accent: 0x00f0ff, collide: false, occlude: false });
  buildDetailedBuilding(24, -70, 16, 40, 14, { accent: 0xff0055, collide: false, occlude: false });
  buildDetailedBuilding(0, -74, 18, 46, 14, { accent: 0x38bdf8, collide: false, occlude: false });

  // Base ctOS Ampliada (X: -28..28, Z: -48..8) com Ala Oeste, Ala Leste e Pátio Amplo
  addStaticBox(24.5, 5.2, 1.2, -15.75, 2.6, 8, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });
  addStaticBox(24.5, 5.2, 1.2, 15.75, 5.2 - 2.6, 8, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });
  addStaticBox(1.2, 5.2, 56, -28, 2.6, -20, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.42 });
  addStaticBox(1.2, 5.2, 56, 28, 2.6, -20, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.42 });
  addStaticBox(57.2, 5.2, 1.2, 0, 2.6, -48, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.42 });

  // Pilares estruturais espaçados e refletores nos muros da base
  for (let px = -24; px <= 24; px += 8) {
    if (Math.abs(px) < 5) continue;
    addStaticBox(1.5, 5.8, 1.6, px, 2.9, 8, 0x25304a, { collide: false, occlude: false });
    addStaticBox(0.7, 0.3, 0.4, px, 5.9, 8.5, 0x00f0ff, {
      collide: false,
      occlude: false,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.2
    });
  }
  for (let pz = -44; pz <= 4; pz += 12) {
    addStaticBox(1.6, 5.8, 1.5, -28, 2.9, pz, 0x25304a, { collide: false, occlude: false });
    addStaticBox(1.6, 5.8, 1.5, 28, 2.9, pz, 0x25304a, { collide: false, occlude: false });
  }

  // Guarita de segurança na entrada com vidro translúcido
  addStaticBox(3.4, 1.2, 3.0, 6.2, 0.6, 10.2, 0x1c263b, { edgesColor: 0x00f0ff, edgesOpacity: 0.5 });
  addStaticBox(3.6, 0.3, 3.2, 6.2, 3.1, 10.2, 0x182236, { collide: false, occlude: false });
  const guaritaGlass = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.6, 2.8),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.25 })
  );
  guaritaGlass.position.set(6.2, 2.0, 10.2);
  worldGroup.add(guaritaGlass);

  // Divisórias das Alas Oeste e Leste (com passagens)
  addStaticBox(1.0, 4.5, 18, -12, 2.25, -18, 0x202a42, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });
  addStaticBox(1.0, 4.5, 18, 12, 2.25, -18, 0x202a42, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });

  // Passarela elevada cruzando o pátio + rampas de acesso
  addStaticBox(28, 0.4, 3.6, 0, 3.2, -18, 0x222e48, {
    collide: false,
    occlude: false,
    edgesColor: 0x00f0ff,
    edgesOpacity: 0.65
  });
  [-16.5, 16.5].forEach((rx) => {
    const ramp = addStaticBox(6.5, 0.35, 3.2, rx, 1.6, -18, 0x1e2940, {
      collide: false,
      occlude: false,
      edgesColor: 0xffaa00,
      edgesOpacity: 0.5
    });
    ramp.rotation.z = rx < 0 ? 0.5 : -0.5;
  });

  radarWalls.push(
    { x1: -3.5, z1: 8, x2: -28, z2: 8 },
    { x1: -28, z1: 8, x2: -28, z2: -48 },
    { x1: -28, z1: -48, x2: 28, z2: -48 },
    { x1: 28, z1: -48, x2: 28, z2: 8 },
    { x1: 28, z1: 8, x2: 3.5, z2: 8 }
  );

  buildMapGates(cfg, 'COMPLEXO_CTOS');

  // Caixas de cobertura dentro da base (Ala Oeste, Pátio Central e Ala Leste)
  const crates = [
    [-19, 1.15, 0, 3.4, 2.3, 2.4],
    [19, 1.15, 0, 3.4, 2.3, 2.4],
    [0, 1.25, -6, 5.0, 2.5, 2.6],
    [-20, 1.15, -24, 3.2, 2.3, 3.2],
    [20, 1.15, -24, 3.2, 2.3, 3.2],
    [-7, 1.15, -33, 3.0, 2.3, 2.4],
    [7, 1.15, -33, 3.0, 2.3, 2.4]
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

  buildServerUnit(cfg.serverPos[0], cfg.serverPos[2], 'COMPLEXO_CTOS');
  buildExtractionZone(cfg.extractPos[0], cfg.extractPos[2], 'COMPLEXO_CTOS');
}

function buildMapGates(cfg, missionKey) {
  cfg.gates.forEach((gCfg, idx) => {
    const gIdx = gates.length;
    const gMesh = addStaticBox(gCfg.w, gCfg.h, gCfg.d, gCfg.x, gCfg.y, gCfg.z, 0x26314a, {
      isGate: true,
      gateIndex: gIdx,
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
      `PAINEL_${missionKey}_${idx + 1}`
    );
    gates.push({
      index: gIdx,
      missionKey,
      gateMesh: gMesh,
      panelMesh: pMesh,
      unlocked: false,
      openProgress: 0,
      initialX: gCfg.x,
      openX: gCfg.openX
    });
    if (gIdx === 0) {
      gateMesh = gMesh;
      gatePanelMesh = pMesh;
    }
  });
}

function buildServerUnit(sx, sz, missionKey) {
  addStaticBox(4.4, 0.3, 3.6, sx, 0.15, sz, 0x182238, { occlude: false, collide: false });
  const sMesh = createHackableDevice(2.0, 3.0, 1.4, sx, 1.65, sz, 0xff0055, `SERVIDOR_${missionKey}`);

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
  );
  core.position.set(sx, 3.9, sz);
  worldGroup.add(core);

  buildServerParticles(sx, sz);
  missionServers[missionKey] = { mesh: sMesh, core };
  if (missionKey === 'COMPLEXO_CTOS') {
    serverMesh = sMesh;
    serverCoreMesh = core;
  }
}

function buildExtractionZone(ex, ez, missionKey) {
  const group = new THREE.Group();
  group.position.set(ex, 0.04, ez);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.1, 2.6, 36),
    new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    })
  );
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);

  const inner = new THREE.Mesh(
    new THREE.CircleGeometry(2.1, 36),
    new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18
    })
  );
  inner.rotation.x = -Math.PI / 2;
  group.add(inner);

  const beam = new THREE.Mesh(
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
  beam.position.y = 4.5;
  group.add(beam);

  const extractionLight = new THREE.PointLight(0x00ff88, 1.8, 12);
  extractionLight.position.set(0, 1.8, 0);
  group.add(extractionLight);

  worldGroup.add(group);
  missionExtractions[missionKey] = { group, ring, beam };
  if (missionKey === 'COMPLEXO_CTOS') {
    extractionZoneGroup = group;
    extractionRing = ring;
    extractionBeam = beam;
  }
}

function buildDocksEnvironment(cfg) {
  const dx = DOCKS_OFFSET_X;

  // Plataforma principal do Píer em X: dx-43..dx+43 (conectada à rampa leste da ponte em X=400)
  addStaticBox(90, 0.6, 120, dx, -0.3, 25, 0x182030, {
    collide: false,
    occlude: false,
    edgesColor: 0x00f0ff,
    edgesOpacity: 0.3
  });

  const grid = new THREE.GridHelper(90, 45, 0x00f0ff, 0x162442);
  grid.position.set(dx, 0.015, 25);
  grid.material.opacity = 0.18;
  grid.material.transparent = true;
  worldGroup.add(grid);

  // Muros laterais com guard-rail e divisórias dos 2 portões (Z=18 e Z=-24)
  addStaticBox(1.2, 3.6, 108, dx - 44, 1.8, 30, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.4 });
  addStaticBox(1.2, 3.6, 108, dx + 44, 1.8, 30, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.4 });
  addStaticBox(88, 1.1, 0.8, dx, 0.55, 84, 0x26314a, { edgesColor: 0xffaa00, edgesOpacity: 0.75 });
  [-30, -15, 0, 15, 30].forEach((lx) => {
    addStaticBox(0.6, 0.28, 0.28, dx + lx, 1.2, 84, 0xffaa00, {
      collide: false,
      occlude: false,
      emissive: 0xffaa00,
      emissiveIntensity: 1.4
    });
  });

  addStaticBox(40, 4.8, 1.2, dx - 23.5, 2.4, 18, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });
  addStaticBox(40, 4.8, 1.2, dx + 23.5, 2.4, 18, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.45 });
  addStaticBox(40, 4.8, 1.2, dx - 23.5, 2.4, -24, 0x1b2236, { edgesColor: 0xff0055, edgesOpacity: 0.45 });
  addStaticBox(40, 4.8, 1.2, dx + 23.5, 2.4, -24, 0x1b2236, { edgesColor: 0xff0055, edgesOpacity: 0.45 });

  radarWalls.push(
    { x1: dx - 44, z1: 84, x2: dx - 44, z2: -25 },
    { x1: dx + 44, z1: 84, x2: dx + 44, z2: -25 },
    { x1: dx - 43, z1: 18, x2: dx - 3.5, z2: 18 },
    { x1: dx + 3.5, z1: 18, x2: dx + 43, z2: 18 },
    { x1: dx - 43, z1: -24, x2: dx - 3.5, z2: -24 },
    { x1: dx + 3.5, z1: -24, x2: dx + 43, z2: -24 }
  );

  // Corredores com contêineres empilhados
  const containers = [
    [dx - 20, 1.35, 8, 7.2, 2.7, 2.8, 0x8b1e24, 0xff4455],
    [dx - 20, 4.05, 8, 7.2, 2.7, 2.8, 0x1b3b6f, 0x00f0ff],
    [dx + 20, 1.35, 8, 7.2, 2.7, 2.8, 0x0e5a6f, 0x00f0ff],
    [dx, 1.35, -2, 6.8, 2.7, 2.8, 0x1b3b6f, 0x38bdf8],
    [dx - 22, 1.35, -12, 7.2, 2.7, 2.8, 0x0e5a6f, 0x00f0ff],
    [dx + 22, 1.35, -12, 7.2, 2.7, 2.8, 0x8b1e24, 0xff4455],
    [dx + 22, 4.05, -12, 7.2, 2.7, 2.8, 0x1b3b6f, 0x00f0ff],
    [dx - 12, 1.35, -34, 4.8, 2.7, 2.6, 0x8b1e24, 0xff4455],
    [dx + 12, 1.35, -34, 4.8, 2.7, 2.6, 0x0e5a6f, 0x00f0ff]
  ];
  containers.forEach(([x, y, z, w, h, d, col, edgeCol]) => {
    if (y < 2.0) radarCrates.push({ x, z, w, d });
    addStaticBox(w, h, d, x, y, z, col, { edgesColor: edgeCol, edgesOpacity: 0.55 });
  });

  // Navio / Cargueiro da Blume ancorado ao fundo (Z: -56..-24)
  addStaticBox(52, 0.7, 30, dx, -0.2, -39, 0x141b2d, {
    collide: false,
    occlude: false,
    edgesColor: 0x00f0ff,
    edgesOpacity: 0.45
  });
  addStaticBox(1.8, 4.5, 30, dx - 26, 2.25, -39, 0x161d2f, { edgesColor: 0xff0055, edgesOpacity: 0.6 });
  addStaticBox(1.8, 4.5, 30, dx + 26, 2.25, -39, 0x161d2f, { edgesColor: 0xff0055, edgesOpacity: 0.6 });
  addStaticBox(54, 11, 6, dx, 5.5, -51, 0x101726, { edgesColor: 0x00f0ff, edgesOpacity: 0.55 });
  addStaticBox(18, 0.7, 0.3, dx, 8.5, -47.8, 0x00f0ff, {
    collide: false,
    occlude: false,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.4
  });

  // Armazéns portuários detalhados
  buildDetailedBuilding(dx - 34, 58, 10, 14, 12, { accent: 0xffaa00 });
  buildDetailedBuilding(dx + 34, 58, 10, 14, 12, { accent: 0x00f0ff });

  buildMapGates(cfg, 'DOCAS_BAIA_SF');
  buildServerUnit(cfg.serverPos[0], cfg.serverPos[2], 'DOCAS_BAIA_SF');
  buildExtractionZone(cfg.extractPos[0], cfg.extractPos[2], 'DOCAS_BAIA_SF');
}

function buildGoldenGateBridge() {
  const bridgeGroup = new THREE.Group();
  const bridgeZ = -92;
  const deckY = 14;
  const towerXs = [-34, 34];

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
function buildCarMesh(color, neonTrim, isPatrol = false) {
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

  // Giroflex azul/vermelho piscando para viaturas ctOS
  if (isPatrol) {
    const blueMat = new THREE.MeshBasicMaterial({ color: 0x0088ff });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const barL = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.24), blueMat);
    barL.position.set(-0.26, 1.46, -0.15);
    const barR = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.24), redMat);
    barR.position.set(0.26, 1.46, -0.15);
    carGroup.add(barL, barR);
    sirenLights.push({ blueMat, redMat, phase: Math.random() * Math.PI * 2 });
  }

  return { carGroup, bodyMesh: body };
}

function buildCars() {
  const worldCars = [
    { x: -10, z: 42, yaw: Math.PI / 2, color: 0x111827, neon: 0x00f0ff, isDedsec: true },
    { x: -40, z: 28, yaw: 0, color: 0x141720, neon: 0xff0044, isDedsec: false, isPatrol: true },
    { x: 16, z: 16, yaw: -Math.PI / 2, color: 0x141720, neon: 0xff0044, isDedsec: false, isPatrol: true },
    { x: -16, z: 16, yaw: Math.PI / 2, color: 0x26314a, neon: 0xffaa00, isDedsec: false },
    { x: 24, z: 42, yaw: -Math.PI / 2, color: 0x2b1d38, neon: 0xff0055, isDedsec: false },
    { x: -24, z: 46, yaw: 0, color: 0x1e2b3a, neon: 0x38bdf8, isDedsec: false },
    { x: -40, z: 38, yaw: Math.PI, color: 0x202a3c, neon: 0x00f0ff, isDedsec: false },
    { x: DOCKS_OFFSET_X + 20, z: 36, yaw: -Math.PI / 2, color: 0x141720, neon: 0xff0044, isDedsec: false, isPatrol: true },
    { x: DOCKS_OFFSET_X - 22, z: 38, yaw: Math.PI / 2, color: 0x26314a, neon: 0xffaa00, isDedsec: false }
  ];

  worldCars.forEach((carCfg, idx) => {
    const { carGroup, bodyMesh } = buildCarMesh(carCfg.color, carCfg.neon, !!carCfg.isPatrol);
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
  playerGroup.position.set(0, 0, 52);

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

  // [1] Pistola Taser DedSec na mão direita
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

  // [2] Pistola Silenciada 9mm
  const pistolMesh = new THREE.Group();
  const pistolSlide = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.11, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x1c2434, roughness: 0.35, metalness: 0.7 })
  );
  pistolSlide.position.set(0, -0.3, 0.15);
  const silencer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.26, 10),
    new THREE.MeshStandardMaterial({ color: 0x0b0f18, roughness: 0.4, metalness: 0.8 })
  );
  silencer.rotation.x = Math.PI / 2;
  silencer.position.set(0, -0.28, 0.41);
  pistolMesh.add(pistolSlide, silencer);
  pistolMesh.visible = false;
  armR.add(pistolMesh);

  // [3] Rifle de Assalto DedSec
  const rifleMesh = new THREE.Group();
  const rifleBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.15, 0.66),
    new THREE.MeshStandardMaterial({ color: 0x141a26, roughness: 0.45, metalness: 0.65 })
  );
  rifleBody.position.set(0, -0.3, 0.3);
  const rifleMag = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.18, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x2a344a, roughness: 0.5 })
  );
  rifleMag.position.set(0, -0.43, 0.34);
  const rifleAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.04, 0.36),
    new THREE.MeshBasicMaterial({ color: 0xffaa00 })
  );
  rifleAccent.position.set(0, -0.27, 0.36);
  rifleMesh.add(rifleBody, rifleMag, rifleAccent);
  rifleMesh.visible = false;
  armR.add(rifleMesh);

  // [4] Emissor de Pulso EMP
  const empMesh = new THREE.Group();
  const empCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff })
  );
  empCore.position.set(0, -0.31, 0.1);
  empMesh.add(empCore);
  empMesh.visible = false;
  armR.add(empMesh);

  playerParts = { legL, legR, armL, armR, backpackLed, taserMesh, pistolMesh, rifleMesh, empMesh };
  playerGroup.add(legL, legR, torso, armL, armR, trimL, trimR, backpack, backpackLed, head, visor);
  scene.add(playerGroup);
}

// ==========================================
// CÂMERAS DE SEGURANÇA HACKEÁVEIS
// ==========================================
function buildSecurityCameras(cfg, missionKey = 'COMPLEXO_CTOS') {
  cfg.cameras.forEach((camCfg) => {
    const idx = securityCameras.length;
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

    hackableMeshes.push(mesh);
    securityCameras.push({
      id: idx,
      missionKey,
      name: camCfg.name,
      mesh,
      pos: pos.clone(),
      baseYaw: camCfg.baseYaw,
      basePitch: camCfg.basePitch,
      yawOffset: 0,
      pitchOffset: 0,
      visionRange: 16,
      visionHalfAngle: Math.PI / 5,
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
// GUARDAS ARMADOS E IA DE COMBATE
// ==========================================
function buildGuards(cfg, missionKey = 'COMPLEXO_CTOS') {
  const visionHalfAngle = (55 * Math.PI) / 180; // 110 graus totais
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

    // Submetralhadora / Rifle 3D nas mãos do guarda
    const gunMesh = new THREE.Group();
    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.14, 0.62),
      new THREE.MeshStandardMaterial({ color: 0x11151f, roughness: 0.4, metalness: 0.7 })
    );
    const gunBarrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.28),
      new THREE.MeshBasicMaterial({ color: 0xff4400 })
    );
    gunBarrel.position.set(0, 0.02, 0.38);
    gunMesh.add(gunBody, gunBarrel);
    gunMesh.position.set(0.28, 1.05, 0.34);

    group.add(body, head, visor, gunMesh);
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
      missionKey,
      mesh: group,
      waypoints,
      initialPos: waypoints[0].clone(),
      currentTarget: 1,
      baseSpeed: gCfg.speed,
      speed: gCfg.speed,
      visionRange: gCfg.visionRange,
      visionHalfAngle,
      gunMesh,
      hp: 100,
      fireCooldown: 0,
      burstLeft: 0,
      burstTimer: 0,
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

    if (gameState.missionModalOpen) {
      if (code === 'Escape') closeMissionModal();
      return;
    }

    const activeMode =
      gameState.mission === MISSION_STATE.FREE_ROAM ||
      gameState.mission === MISSION_STATE.INFILTRATE ||
      gameState.mission === MISSION_STATE.STEAL_DATA ||
      gameState.mission === MISSION_STATE.ESCAPE;
    if (!activeMode) return;

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
      selectWeapon(WEAPON_TYPE.PISTOL);
    } else if (code === 'Digit3' || code === 'Numpad3') {
      selectWeapon(WEAPON_TYPE.RIFLE);
    } else if (code === 'Digit4' || code === 'Numpad4') {
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
      gameState.mission === MISSION_STATE.FREE_ROAM ||
      gameState.mission === MISSION_STATE.INFILTRATE ||
      gameState.mission === MISSION_STATE.STEAL_DATA ||
      gameState.mission === MISSION_STATE.ESCAPE;
    if (playing && !gameState.terminalOpen && !gameState.missionModalOpen && document.pointerLockElement !== dom.canvas) {
      AudioManager.init();
      dom.canvas.requestPointerLock();
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    gameState.mouseDown = true;
    if (document.pointerLockElement !== dom.canvas) return;
    if (gameState.terminalOpen || gameState.missionModalOpen || gameState.activeCamIndex >= 0 || gameState.drivingCar) return;
    const playing =
      gameState.mission === MISSION_STATE.FREE_ROAM ||
      gameState.mission === MISSION_STATE.INFILTRATE ||
      gameState.mission === MISSION_STATE.STEAL_DATA ||
      gameState.mission === MISSION_STATE.ESCAPE;
    if (!playing) return;

    fireEquippedWeapon();
  });

  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) gameState.mouseDown = false;
  });

  // Botões de UI
  if (dom.btnStart) dom.btnStart.addEventListener('click', startMission);
  dom.btnRetryGameover.addEventListener('click', returnToFreeRoam);
  dom.btnRetryVictory.addEventListener('click', returnToFreeRoam);
  if (dom.btnAcceptMission) dom.btnAcceptMission.addEventListener('click', acceptPendingMission);
  if (dom.btnCancelMission) dom.btnCancelMission.addEventListener('click', closeMissionModal);
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
    scene.fog.density = 0.011;
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
    triggerBaseAlert();
    dom.hackFeedback.textContent = '> FIREWALL DESATIVADO // ALERTA GERAL ATIVADO!';
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
// ARSENAL DEDSEC, DANO E COMBATE
// ==========================================
function selectWeapon(weaponType) {
  gameState.equippedWeapon = weaponType;
  if (playerParts.taserMesh) playerParts.taserMesh.visible = weaponType === WEAPON_TYPE.TASER;
  if (playerParts.pistolMesh) playerParts.pistolMesh.visible = weaponType === WEAPON_TYPE.PISTOL;
  if (playerParts.rifleMesh) playerParts.rifleMesh.visible = weaponType === WEAPON_TYPE.RIFLE;
  if (playerParts.empMesh) playerParts.empMesh.visible = weaponType === WEAPON_TYPE.EMP;
  updateWeaponHUD();
}

function updateWeaponHUD() {
  const cfg = WEAPON_CONFIG[gameState.equippedWeapon];
  const cd = gameState.equippedWeapon === WEAPON_TYPE.EMP ? gameState.empCooldown : gameState.weaponCooldown;
  const maxCd = cfg.cooldown;

  if (dom.statusWeapon) {
    dom.statusWeapon.textContent = cd > 0 ? `${cfg.label} (${cd.toFixed(1)}s)` : `${cfg.label} (PRONTO)`;
    dom.statusWeapon.className = cd > 0 ? 'neon-magenta' : 'neon-cyan';
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

function updateHpHUD() {
  if (dom.statusHp) {
    dom.statusHp.textContent = `${Math.ceil(gameState.hp)}%`;
    dom.statusHp.className = gameState.hp > 50 ? 'neon-green' : gameState.hp > 25 ? 'neon-cyan' : 'neon-magenta';
  }
  if (dom.hpBar) {
    dom.hpBar.style.width = `${THREE.MathUtils.clamp(gameState.hp, 0, 100)}%`;
  }
}

function damagePlayer(amount) {
  if (gameState.mission === MISSION_STATE.GAMEOVER || gameState.mission === MISSION_STATE.VICTORY) return;
  gameState.hp = Math.max(0, gameState.hp - amount);
  gameState.damageFlashTimer = 0.22;
  if (dom.damageFlash) dom.damageFlash.classList.remove('hidden');
  AudioManager.playPlayerHit();
  updateHpHUD();

  if (gameState.hp <= 0) {
    triggerGameOver('AGENTE ABATIDO', 'Você foi neutralizado pelo fogo hostil dos guardas da ctOS.');
  }
}

function alertGuardsByNoise(originPos, radius) {
  if (radius <= 0) return;
  guards.forEach((g) => {
    if (g.state === GUARD_STATE.DEAD || g.state === GUARD_STATE.STUNNED) return;
    if (g.mesh.position.distanceTo(originPos) <= radius) {
      g.lastKnownPos = originPos.clone();
      if (g.state !== GUARD_STATE.COMBAT) {
        g.state = GUARD_STATE.INVESTIGATE;
        g.lookAroundTimer = 0;
      }
    }
  });
}

function triggerBaseAlert() {
  if (gameState.baseAlert) return;
  gameState.baseAlert = true;
  if (dom.baseAlertBanner) dom.baseAlertBanner.classList.remove('hidden');
  AudioManager.playBaseAlertSiren();
  AudioManager.setMusicTempo(138);

  const targetPos = playerGroup.position.clone();
  guards.forEach((g) => {
    if (g.state !== GUARD_STATE.DEAD && g.state !== GUARD_STATE.STUNNED) {
      g.state = GUARD_STATE.COMBAT;
      g.lastKnownPos = targetPos.clone();
    }
  });
}

function spawnTaserFlash(pos, color = 0x00f0ff) {
  const light = new THREE.PointLight(color, 5.0, 9);
  light.position.copy(pos);
  scene.add(light);
  impactFlashes.push({ light, life: 0.15 });
}

function stunGuard(guard, duration) {
  if (guard.state === GUARD_STATE.DEAD) return;
  guard.state = GUARD_STATE.STUNNED;
  guard.stunTimer = duration;
  guard.investigateTarget = null;
  guard.investigateTimer = 0;
  guard.lookAroundTimer = 0;
  guard.burstLeft = 0;
  guard.mesh.rotation.x = Math.PI / 2.2;
  guard.mesh.position.y = 0.25;
  if (guard.sparkPoints) {
    guard.sparkPoints.visible = true;
  }
}

function damageGuard(guard, dmg) {
  if (guard.state === GUARD_STATE.DEAD) return;
  guard.hp = Math.max(0, guard.hp - dmg);
  if (guard.hp <= 0) {
    guard.state = GUARD_STATE.DEAD;
    guard.stunTimer = 0;
    guard.burstLeft = 0;
    guard.mesh.rotation.x = -Math.PI / 2;
    guard.mesh.position.y = 0.22;
    if (guard.sparkPoints) guard.sparkPoints.visible = false;
    return;
  }
  if (guard.state !== GUARD_STATE.STUNNED) {
    guard.state = GUARD_STATE.COMBAT;
    guard.lastKnownPos = playerGroup.position.clone();
  }
}

function fireEquippedWeapon() {
  if (gameState.equippedWeapon === WEAPON_TYPE.EMP) {
    fireEmpPulse();
    return;
  }
  if (gameState.weaponCooldown > 0) return;

  const cfg = WEAPON_CONFIG[gameState.equippedWeapon];
  gameState.weaponCooldown = cfg.cooldown;
  updateWeaponHUD();

  if (gameState.equippedWeapon === WEAPON_TYPE.TASER) AudioManager.playTaserShot();
  else if (gameState.equippedWeapon === WEAPON_TYPE.PISTOL) AudioManager.playSilencedShot();
  else if (gameState.equippedWeapon === WEAPON_TYPE.RIFLE) AudioManager.playRifleShot();

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  dir.y = THREE.MathUtils.clamp(dir.y, -0.35, 0.35);
  dir.normalize();

  const startPos = playerGroup.position.clone().add(new THREE.Vector3(0, gameState.isCrouching ? 0.92 : 1.35, 0));
  startPos.addScaledVector(dir, 0.75);

  const boltMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.55),
    new THREE.MeshBasicMaterial({ color: cfg.color })
  );
  boltMesh.position.copy(startPos);
  boltMesh.lookAt(startPos.clone().add(dir));
  scene.add(boltMesh);

  const trailGeo = new THREE.BufferGeometry().setFromPoints([startPos.clone(), startPos.clone()]);
  const trailLine = new THREE.Line(
    trailGeo,
    new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.85 })
  );
  scene.add(trailLine);

  projectiles.push({
    mesh: boltMesh,
    line: trailLine,
    origin: startPos.clone(),
    pos: startPos.clone(),
    dir,
    speed: cfg.speed,
    damage: cfg.damage,
    isTaser: gameState.equippedWeapon === WEAPON_TYPE.TASER,
    color: cfg.color,
    life: 1.1
  });

  alertGuardsByNoise(playerGroup.position, cfg.noiseRadius);
}

function fireEmpPulse() {
  if (gameState.empCooldown > 0) return;
  gameState.empCooldown = WEAPON_CONFIG.EMP.cooldown;
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

  empWaves.push({ mesh: ringMesh, mat: ringMat, radius: 1, maxRadius: 10.5 });

  securityCameras.forEach((camObj) => {
    camObj.disabledTimer = Math.max(camObj.disabledTimer, 10.0);
    camObj.mesh.userData.normalMaterial.emissive.setHex(0x331111);
  });

  guards.forEach((g) => {
    if (g.state === GUARD_STATE.DEAD) return;
    const d = Math.hypot(g.mesh.position.x - pPos.x, g.mesh.position.z - pPos.z);
    if (d <= 10.0) {
      stunGuard(g, 10.0);
    }
  });
}

function updateProjectiles(dt) {
  if (gameState.weaponCooldown > 0) {
    gameState.weaponCooldown = Math.max(0, gameState.weaponCooldown - dt);
  }
  if (gameState.empCooldown > 0) {
    gameState.empCooldown = Math.max(0, gameState.empCooldown - dt);
  }

  // Disparo automático para Rifle de Assalto DedSec
  if (
    gameState.mouseDown &&
    gameState.equippedWeapon === WEAPON_TYPE.RIFLE &&
    gameState.weaponCooldown === 0 &&
    document.pointerLockElement === dom.canvas &&
    !gameState.terminalOpen &&
    gameState.activeCamIndex < 0 &&
    !gameState.drivingCar
  ) {
    fireEquippedWeapon();
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

    const trailTail = p.pos.clone().addScaledVector(p.dir, -Math.min(2.4, p.pos.distanceTo(p.origin)));
    p.line.geometry.setFromPoints([trailTail, p.pos.clone()]);

    let hitGuard = null;
    for (const g of guards) {
      if (g.state === GUARD_STATE.DEAD || g.state === GUARD_STATE.STUNNED) continue;
      const distFlat = Math.hypot(p.pos.x - g.mesh.position.x, p.pos.z - g.mesh.position.z);
      if (distFlat < 0.95 && p.pos.y >= 0 && p.pos.y <= 2.2) {
        hitGuard = g;
        break;
      }
    }

    if (hitGuard) {
      spawnTaserFlash(p.pos, p.color);
      if (p.isTaser) {
        stunGuard(hitGuard, 10.0);
        AudioManager.playElectricZap();
      } else {
        damageGuard(hitGuard, p.damage);
      }
      scene.remove(p.mesh);
      scene.remove(p.line);
      projectiles.splice(i, 1);
      continue;
    }

    if (hitObs.length > 0 || p.life <= 0) {
      if (hitObs.length > 0) spawnTaserFlash(hitObs[0].point, p.color);
      scene.remove(p.mesh);
      scene.remove(p.line);
      projectiles.splice(i, 1);
    }
  }
}

function updateGuardProjectiles(dt) {
  const pPos = playerGroup.position;
  for (let i = guardProjectiles.length - 1; i >= 0; i--) {
    const gp = guardProjectiles[i];
    gp.life -= dt;
    const step = gp.speed * dt;

    raycaster.set(gp.pos, gp.dir);
    raycaster.far = step + 0.2;
    const hitObs = raycaster.intersectObjects(occluders, false);

    gp.pos.addScaledVector(gp.dir, step);
    gp.mesh.position.copy(gp.pos);

    const distPlayer = Math.hypot(gp.pos.x - pPos.x, gp.pos.z - pPos.z);
    const maxPlayerY = gameState.isCrouching ? 1.25 : 2.05;
    if (distPlayer < 0.72 && gp.pos.y >= 0.1 && gp.pos.y <= maxPlayerY) {
      damagePlayer(12);
      scene.remove(gp.mesh);
      guardProjectiles.splice(i, 1);
      continue;
    }

    if (hitObs.length > 0 || gp.life <= 0) {
      scene.remove(gp.mesh);
      guardProjectiles.splice(i, 1);
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

    // Posicionar jogador ao lado do carro respeitando os limites do mundo aberto e altura da pista
    const sideX = Math.cos(car.mesh.rotation.y) * 1.9;
    const sideZ = -Math.sin(car.mesh.rotation.y) * 1.9;
    const outX = THREE.MathUtils.clamp(car.mesh.position.x + sideX, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    const outZ = THREE.MathUtils.clamp(car.mesh.position.z + sideZ, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
    playerGroup.position.set(outX, getSurfaceHeight(outX, outZ), outZ);
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
  cars.forEach((car) => {
    if (car.isDedsec || car.hackedTimer <= 0) return;

    car.hackedTimer = Math.max(0, car.hackedTimer - dt);
    const forwardX = Math.sin(car.mesh.rotation.y);
    const forwardZ = Math.cos(car.mesh.rotation.y);
    const nextX = car.mesh.position.x + forwardX * car.speed * dt;
    const nextZ = car.mesh.position.z + forwardZ * car.speed * dt;

    if (
      nextX > WORLD_BOUNDS.minX + 1 &&
      nextX < WORLD_BOUNDS.maxX - 1 &&
      nextZ > WORLD_BOUNDS.minZ + 1 &&
      nextZ < WORLD_BOUNDS.maxZ - 1 &&
      !checkCollision(nextX, nextZ, 1.5, car)
    ) {
      car.mesh.position.x = nextX;
      car.mesh.position.z = nextZ;
      car.mesh.position.y = getSurfaceHeight(nextX, nextZ);
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

    cPos.x = THREE.MathUtils.clamp(cPos.x, WORLD_BOUNDS.minX + 1, WORLD_BOUNDS.maxX - 1);
    cPos.z = THREE.MathUtils.clamp(cPos.z, WORLD_BOUNDS.minZ + 1, WORLD_BOUNDS.maxZ - 1);
    cPos.y = getSurfaceHeight(cPos.x, cPos.z);

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

    // Limites do mundo aberto unificado e altura da superfície (chão ou Ponte Golden Gate)
    pos.x = THREE.MathUtils.clamp(pos.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    pos.z = THREE.MathUtils.clamp(pos.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
    pos.y = getSurfaceHeight(pos.x, pos.z);

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
      if (camObj.disabledTimer === 0) {
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

    // Verificar linha de visão real da câmera
    const camForward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const toPlayer = playerPos.clone().sub(camObj.pos);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist <= camObj.visionRange && dist > 0.2) {
      const angle = Math.acos(THREE.MathUtils.clamp(camForward.dot(toPlayer.normalize()), -1, 1));
      if (angle <= camObj.visionHalfAngle) {
        const rayDir = playerCenter.clone().sub(camObj.pos).normalize();
        raycaster.set(camObj.pos, rayDir);
        raycaster.far = Math.max(0.1, camObj.pos.distanceTo(playerCenter) - 0.3);
        const blocked = raycaster.intersectObjects(occluders, false);
        if (blocked.length === 0) {
          camSpotted = true;
        }
      }
    }
  });

  return camSpotted;
}

function fireGuardBullet(guard, targetPos) {
  const startPos = guard.mesh.position.clone().add(new THREE.Vector3(0, 1.25, 0));
  const dir = targetPos.clone().sub(startPos).normalize();
  // Pequena dispersão para permitir cobertura justa
  dir.x += (Math.random() - 0.5) * 0.09;
  dir.y += (Math.random() - 0.5) * 0.04;
  dir.z += (Math.random() - 0.5) * 0.09;
  dir.normalize();

  const bullet = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.45),
    new THREE.MeshBasicMaterial({ color: 0xff3300 })
  );
  bullet.position.copy(startPos);
  bullet.lookAt(startPos.clone().add(dir));
  scene.add(bullet);

  guardProjectiles.push({
    mesh: bullet,
    pos: startPos,
    dir,
    speed: 32,
    life: 1.4
  });

  AudioManager.playGuardShot();
}

function updateGuards(dt) {
  const playerPos = playerGroup.position;
  const playerCenter = new THREE.Vector3(
    playerPos.x,
    gameState.isCrouching ? 0.58 : 1.05,
    playerPos.z
  );

  let spottedThisFrame = updateSecurityCameras(dt, playerPos, playerCenter);
  const rangeDelta = gameState.isSprinting ? 4.0 : gameState.isCrouching ? -3.0 : 0;

  guards.forEach((g) => {
    if (g.state === GUARD_STATE.DEAD) return;

    if (g.state === GUARD_STATE.STUNNED || g.stunTimer > 0) {
      g.stunTimer = Math.max(0, g.stunTimer - dt);

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
        if (g.sparkPoints) g.sparkPoints.visible = false;
        g.state = gameState.baseAlert ? GUARD_STATE.COMBAT : GUARD_STATE.INVESTIGATE;
        g.lastKnownPos = g.mesh.position.clone();
        g.lookAroundTimer = 3.0;
        g.lookBaseYaw = g.mesh.rotation.y;
      }
      return;
    }

    // 1. Checar visão realista (110°, 22m + Raycaster da cabeça até o jogador)
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
    const isContractGuard =
      gameState.mission !== MISSION_STATE.FREE_ROAM && g.missionKey === gameState.activeMissionKey;

    if (isContractGuard && distToPlayer <= effectiveRange && distToPlayer > 0.1) {
      const dirFlat = toPlayer.clone().normalize();
      const angle = Math.acos(THREE.MathUtils.clamp(guardForward.dot(dirFlat), -1, 1));
      if (angle <= g.visionHalfAngle) {
        const eyePos = new THREE.Vector3(g.mesh.position.x, 1.65, g.mesh.position.z);
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
      g.state = GUARD_STATE.COMBAT;
      g.lastKnownPos = new THREE.Vector3(playerPos.x, 0, playerPos.z);
      g.lookAroundTimer = 0;
    } else if (isContractGuard && gameState.baseAlert) {
      g.state = GUARD_STATE.COMBAT;
      g.lastKnownPos = new THREE.Vector3(playerPos.x, 0, playerPos.z);
    }

    // 2. Máquina de estados de movimentação e combate
    if (g.state === GUARD_STATE.COMBAT) {
      const targetPos = g.lastKnownPos || playerPos;
      const toTarget = targetPos.clone().sub(g.mesh.position);
      toTarget.y = 0;
      const dist = toTarget.length();

      if (dist > 0.1) {
        toTarget.normalize();
        const desiredYaw = Math.atan2(toTarget.x, toTarget.z);
        let diff = desiredYaw - g.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        g.mesh.rotation.y += diff * Math.min(1, dt * 10);

        if (!guardSeesPlayer || dist > 9.0) {
          g.mesh.position.addScaledVector(toTarget, g.speed * 1.2 * dt);
        }
      }

      // Rajadas de tiro se tiver linha de visão limpa
      if (guardSeesPlayer) {
        if (g.burstLeft > 0) {
          g.burstTimer -= dt;
          if (g.burstTimer <= 0) {
            fireGuardBullet(g, playerCenter);
            g.burstLeft -= 1;
            g.burstTimer = 0.14;
          }
        } else {
          g.fireCooldown -= dt;
          if (g.fireCooldown <= 0) {
            g.burstLeft = 3;
            g.burstTimer = 0;
            g.fireCooldown = 1.35;
          }
        }
      } else if (dist < 1.2 && !gameState.baseAlert) {
        g.state = GUARD_STATE.INVESTIGATE;
        g.lookAroundTimer = 3.0;
        g.lookBaseYaw = g.mesh.rotation.y;
      }
    } else if (g.state === GUARD_STATE.DISTRACTED && g.investigateTarget) {
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
  });

  if (spottedThisFrame) {
    gameState.detectionLevel = Math.min(100, gameState.detectionLevel + dt * 75);
  } else {
    gameState.detectionLevel = Math.max(0, gameState.detectionLevel - dt * 28);
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
}

// ==========================================
// FLUXO DA MISSÃO E INTERAÇÕES CONTÍNUAS
// ==========================================
function setMissionState(newState) {
  gameState.mission = newState;

  if (newState === MISSION_STATE.FREE_ROAM) {
    dom.missionObjective.textContent = 'MUNDO ABERTO // SÃO FRANCISCO';
    dom.missionSub.textContent = 'Explore a cidade, atravesse a Golden Gate ou pise em um marcador de missão';
  } else if (newState === MISSION_STATE.INFILTRATE) {
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

  if (gameState.markerCooldown > 0) {
    gameState.markerCooldown = Math.max(0, gameState.markerCooldown - dt);
  }

  // Verificar gatilhos de missão em FREE_ROAM
  if (gameState.mission === MISSION_STATE.FREE_ROAM && !gameState.missionModalOpen && gameState.markerCooldown === 0) {
    for (const m of missionMarkers) {
      const distMarker = Math.hypot(pPos.x - m.pos.x, pPos.z - m.pos.z);
      if (distMarker < 2.8) {
        openMissionModal(m.key);
        return;
      }
    }
  }

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
          triggerBaseAlert();
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
function resetWorldState(keepPlayerPos = false) {
  gameState.elapsedTime = 0;
  gameState.hp = 100;
  gameState.damageFlashTimer = 0;
  gameState.baseAlert = false;
  gameState.mouseDown = false;
  gameState.gateUnlocked = false;
  gameState.gateOpenProgress = 0;
  gameState.serverFirewallDisabled = false;
  gameState.terminalOpen = false;
  gameState.terminalTarget = 'GATE';
  gameState.downloadProgress = 0;
  gameState.detectionLevel = 0;
  gameState.maxDetection = 0;
  gameState.hacksUsed = 0;
  gameState.weaponCooldown = 0;
  gameState.taserCooldown = 0;
  gameState.empCooldown = 0;
  selectWeapon(WEAPON_TYPE.TASER);
  updateHpHUD();
  if (dom.damageFlash) dom.damageFlash.classList.add('hidden');
  if (dom.baseAlertBanner) dom.baseAlertBanner.classList.add('hidden');
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
  if (!keepPlayerPos) {
    gameState.drivingCar = null;
    AudioManager.stopEngineSound();
    playerGroup.visible = true;
    playerGroup.position.set(mapCfg.playerStart[0], mapCfg.playerStart[1], mapCfg.playerStart[2]);
    playerGroup.rotation.y = 0;
    playerGroup.scale.y = 1;
  }

  // Resetar carros (exceto quando mantendo posição em FREE_ROAM)
  if (!keepPlayerPos) {
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
  }

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
  Object.values(missionServers).forEach((s) => {
    if (s && s.mesh) s.mesh.userData.normalMaterial.emissive.setHex(0xff0055);
  });
  if (serverMesh) serverMesh.userData.normalMaterial.emissive.setHex(0xff0055);

  const preset = DIFFICULTY_PRESETS[gameState.difficulty];

  // Limpar projéteis e ondas EMP ativos
  for (let i = projectiles.length - 1; i >= 0; i--) {
    scene.remove(projectiles[i].mesh);
    scene.remove(projectiles[i].line);
    projectiles.splice(i, 1);
  }
  for (let i = guardProjectiles.length - 1; i >= 0; i--) {
    scene.remove(guardProjectiles[i].mesh);
    guardProjectiles.splice(i, 1);
  }
  for (let i = empWaves.length - 1; i >= 0; i--) {
    scene.remove(empWaves[i].mesh);
    empWaves.splice(i, 1);
  }

  // Resetar guardas, câmeras e caixas elétricas
  guards.forEach((g) => {
    g.mesh.position.copy(g.initialPos);
    g.mesh.rotation.x = 0;
    if (g.sparkPoints) g.sparkPoints.visible = false;
    g.speed = g.baseSpeed * preset.guardSpeedMult;
    g.currentTarget = 1;
    g.state = GUARD_STATE.PATROL;
    g.hp = 100;
    g.fireCooldown = 0;
    g.burstLeft = 0;
    g.burstTimer = 0;
    g.lastKnownPos = null;
    g.lookAroundTimer = 0;
    g.lookBaseYaw = 0;
    g.investigateTarget = null;
    g.investigateTimer = 0;
    g.stunTimer = 0;
  });

  securityCameras.forEach((camObj, idx) => {
    camObj.disabledTimer = 0;
    camObj.sweepPhase = idx * 1.5;
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

function updateMoneyHUD() {
  if (dom.statusMoney) {
    dom.statusMoney.textContent = `$${gameState.money.toLocaleString('pt-BR')}`;
  }
}

function openMissionModal(missionKey) {
  const mCfg = MAPS_CONFIG[missionKey];
  if (!mCfg || !dom.missionModal) return;
  gameState.pendingMissionKey = missionKey;
  gameState.missionModalOpen = true;
  if (dom.missionModalTitle) dom.missionModalTitle.textContent = mCfg.label;
  if (dom.missionModalDesc) dom.missionModalDesc.textContent = mCfg.desc;
  dom.missionModal.classList.remove('hidden');
  if (document.pointerLockElement === dom.canvas) {
    document.exitPointerLock();
  }
}

function closeMissionModal() {
  gameState.missionModalOpen = false;
  gameState.pendingMissionKey = null;
  gameState.markerCooldown = 3.0;
  if (dom.missionModal) dom.missionModal.classList.add('hidden');
  dom.canvas.requestPointerLock();
}

function acceptPendingMission() {
  const mKey = gameState.pendingMissionKey || 'COMPLEXO_CTOS';
  gameState.missionModalOpen = false;
  if (dom.missionModal) dom.missionModal.classList.add('hidden');
  startContract(mKey);
}

function startContract(missionKey) {
  AudioManager.init();
  gameState.activeMissionKey = missionKey;
  gameState.selectedMap = missionKey;

  if (missionServers[missionKey]) {
    serverMesh = missionServers[missionKey].mesh;
    serverCoreMesh = missionServers[missionKey].core;
  }
  if (missionExtractions[missionKey]) {
    extractionZoneGroup = missionExtractions[missionKey].group;
    extractionRing = missionExtractions[missionKey].ring;
    extractionBeam = missionExtractions[missionKey].beam;
  }

  resetWorldState(false);
  dom.gameoverScreen.classList.add('hidden');
  dom.victoryScreen.classList.add('hidden');
  dom.hud.classList.remove('hidden');
  setMissionState(MISSION_STATE.INFILTRATE);
  AudioManager.startMusic(96);
  dom.canvas.requestPointerLock();
}

function returnToFreeRoam() {
  AudioManager.stopMusic();
  AudioManager.stopEngineSound();
  gameState.activeMissionKey = null;
  gameState.markerCooldown = 3.5;
  resetWorldState(true);
  dom.gameoverScreen.classList.add('hidden');
  dom.victoryScreen.classList.add('hidden');
  dom.hud.classList.remove('hidden');
  setMissionState(MISSION_STATE.FREE_ROAM);
  dom.canvas.requestPointerLock();
}

function startMission() {
  returnToFreeRoam();
}

function restartMission() {
  returnToFreeRoam();
}

function triggerGameOver(
  title = 'AGENTE ABATIDO',
  desc = 'Os guardas do complexo neutralizaram sua infiltração.'
) {
  gameState.mission = MISSION_STATE.GAMEOVER;
  AudioManager.stopMusic();
  AudioManager.stopEngineSound();
  AudioManager.playGameOverSiren();
  if (document.pointerLockElement === dom.canvas) {
    document.exitPointerLock();
  }
  if (dom.gameoverTitle) dom.gameoverTitle.textContent = title;
  if (dom.gameoverDesc) dom.gameoverDesc.textContent = desc;
  dom.hud.classList.add('hidden');
  dom.alertVignette.classList.add('hidden');
  if (dom.damageFlash) dom.damageFlash.classList.add('hidden');
  if (dom.baseAlertBanner) dom.baseAlertBanner.classList.add('hidden');
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
  const rank = calculateMissionRank();
  const rewardMap = {
    'RANK S - FANTASMA': 2500,
    'RANK A - INFILTRADOR': 1800,
    'RANK B - OPERATIVO': 1300,
    'RANK C': 1000
  };
  const reward = rewardMap[rank] || 1000;
  gameState.money += reward;
  updateMoneyHUD();

  dom.hud.classList.add('hidden');
  dom.finalTime.textContent = formatTime(gameState.elapsedTime);
  if (dom.finalRank) dom.finalRank.textContent = rank;
  if (dom.finalReward) dom.finalReward.textContent = `+$${reward.toLocaleString('pt-BR')}`;
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

  if (gameState.damageFlashTimer > 0) {
    gameState.damageFlashTimer = Math.max(0, gameState.damageFlashTimer - dt);
    if (gameState.damageFlashTimer === 0 && dom.damageFlash) {
      dom.damageFlash.classList.add('hidden');
    }
  }

  blinkingLights.forEach((b) => {
    const on = Math.sin(nowSec * 3.5 + b.phase) > 0.2;
    b.mat.color.setHex(on ? 0xff0033 : 0x220008);
  });

  sirenLights.forEach((s) => {
    const flip = Math.sin(nowSec * 10 + s.phase) > 0;
    s.blueMat.color.setHex(flip ? 0x0099ff : 0x001833);
    s.redMat.color.setHex(flip ? 0x330008 : 0xff0033);
  });
}

function updateRadar() {
  if (!dom.radarCanvas) return;
  const ctx = dom.radarCanvas.getContext('2d');
  const size = dom.radarCanvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;
  const mapCfg = MAPS_CONFIG[gameState.selectedMap] || MAPS_CONFIG.COMPLEXO_CTOS;
  const scale = mapCfg.radarScale || 1.55;

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

  // Ponte Golden Gate no radar (X: 80..400, Z: 35)
  const bStart = toRadar(80, 35);
  const bEnd = toRadar(400, 35);
  ctx.strokeStyle = 'rgba(255, 90, 31, 0.75)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(bStart.x, bStart.y);
  ctx.lineTo(bEnd.x, bEnd.y);
  ctx.stroke();

  // Marcadores de missão no radar
  missionMarkers.forEach((m) => {
    const mp = toRadar(m.pos.x, m.pos.z);
    ctx.strokeStyle = m.key === 'COMPLEXO_CTOS' ? '#00f0ff' : '#ffaa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mp.x, mp.y, 4.5, 0, Math.PI * 2);
    ctx.stroke();
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

  // Guardas no radar (sem cones artificiais no chão)
  guards.forEach((g) => {
    const gp = toRadar(g.mesh.position.x, g.mesh.position.z);
    if (g.state === GUARD_STATE.DEAD) {
      ctx.fillStyle = '#475569';
    } else if (g.state === GUARD_STATE.STUNNED) {
      ctx.fillStyle = '#38bdf8';
    } else if (g.state === GUARD_STATE.COMBAT) {
      ctx.fillStyle = '#ff0055';
    } else if (g.state === GUARD_STATE.INVESTIGATE || g.state === GUARD_STATE.DISTRACTED) {
      ctx.fillStyle = '#ff8800';
    } else {
      ctx.fillStyle = '#ff2a55';
    }
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

  const isContract =
    gameState.mission === MISSION_STATE.INFILTRATE ||
    gameState.mission === MISSION_STATE.STEAL_DATA ||
    gameState.mission === MISSION_STATE.ESCAPE;
  const isPlaying = isContract || gameState.mission === MISSION_STATE.FREE_ROAM;

  if (isPlaying) {
    if (isContract) {
      gameState.elapsedTime += dt;
      dom.statusTimer.textContent = formatTime(gameState.elapsedTime);
    }

    updatePlayer(dt);
    updateCars(dt);
    updateProjectiles(dt);
    updateGuardProjectiles(dt);
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
setMissionState(MISSION_STATE.FREE_ROAM);
updateMoneyHUD();
updateHpHUD();
animate();
