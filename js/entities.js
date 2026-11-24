import * as THREE from 'three';
import {
  MISSION_STATE,
  GUARD_STATE,
  WEAPON_CONFIG,
  SKINS_CATALOG,
  MAPS_CONFIG,
  WORLD_BOUNDS,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  PLAYER_SPRINT_SPEED,
  PLAYER_CROUCH_SPEED,
  DOWNLOAD_DURATION,
  CAMERA_OVERLOAD_DURATION,
  ELECTRIC_COOLDOWN,
  ELECTRIC_INVESTIGATE_TIME,
  BASE_AMBIENT_INTENSITY,
  DIFFICULTY_PRESETS,
  dom,
  refs,
  gameState,
  raycaster,
  occluders,
  hackableMeshes,
  securityCameras,
  guards,
  electricBoxes,
  gates,
  cars,
  trafficCars,
  pedestrians,
  fleeingDrivers,
  boats,
  missionMarkers,
  stores,
  lightPoles,
  trafficLights,
  supplyBoxes,
  policeCars,
  rescueCells,
  steamPipes,
  remotePlayers,
  playersMap,
  colliders,
  getSurfaceHeight,
  disposeHierarchy,
  createHackableDevice,
  isWaterArea,
  isWaterForBoats,
  isWaterForLand,
  isPierArea,
  checkCollision,
  checkCarCollision,
  checkDroneCollision
} from './state.js';
import { AudioManager } from './audio.js';
import {
  openTerminal,
  closeGateTerminal,
  setMissionState,
  openMissionModal,
  openShopModal,
  triggerGameOver,
  triggerVictory,
  updateMoneyHUD,
  updateHpHUD,
  updateVehicleHpHUD,
  updateWantedHUD,
  addWantedLevel
} from './ui.js';
import {
  stunGuard,
  triggerBaseAlert,
  fireGuardBullet,
  damageCar,
  reportCrimeToCivilians,
  spawnTaserFlash
} from './combat.js';

function createAgentNameTag(labelText) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(6, 12, 24, 0.85)';
  ctx.fillRect(4, 8, 248, 48);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 8, 248, 48);
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, 128, 32);

  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.6, 0.4, 1);
  sprite.position.set(0, 2.25, 0);
  return sprite;
}

export function createAgentMesh(config = {}) {
  const agentGroup = new THREE.Group();
  const pos = config.pos || [0, 0, 52];
  agentGroup.position.set(pos[0], pos[1], pos[2]);

  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x161c2e, roughness: 0.62, metalness: 0.18 });
  const innerMat = new THREE.MeshStandardMaterial({ color: 0x0c111d, roughness: 0.78 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x121826, roughness: 0.75 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xc89678, roughness: 0.65 });
  const maskMat = new THREE.MeshStandardMaterial({ color: 0x0a0e17, roughness: 0.85 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x151c2d, roughness: 0.6 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1e263b, roughness: 0.55 });
  const packMat = new THREE.MeshStandardMaterial({ color: 0x0d1322, roughness: 0.5, metalness: 0.4 });
  const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const magentaMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

  // ==========================================
  // PERNAS ARTICULADAS (Quadril -> Coxa -> Joelho/Canela -> Tênis)
  // ==========================================
  const buildLeg = (xOffset) => {
    const hip = new THREE.Group();
    hip.position.set(xOffset, 0.88, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.24, 6, 12), pantsMat);
    thigh.position.y = -0.20;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.set(0, -0.42, 0);

    const kneePad = new THREE.Mesh(new THREE.SphereGeometry(0.076, 10, 10), innerMat);
    kneePad.position.set(0, 0, 0.022);
    knee.add(kneePad);

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.24, 6, 12), pantsMat);
    shin.position.y = -0.20;
    shin.castShadow = true;
    knee.add(shin);

    // Tênis esportivo estilizado com sola neon
    const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.10, 0.27), shoeMat);
    sneaker.position.set(0, -0.39, 0.045);
    sneaker.castShadow = true;
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.028, 0.29), cyanMat);
    sole.position.set(0, -0.44, 0.045);
    knee.add(sneaker, sole);

    hip.add(knee);
    return { hip, knee };
  };

  const legLeft = buildLeg(-0.125);
  const legRight = buildLeg(0.125);

  // ==========================================
  // TRONCO & JAQUETA DEDSEC + MOCHILA TIRACOLO
  // ==========================================
  const upperBody = new THREE.Group();
  upperBody.position.set(0, 0.88, 0);

  // Núcleo atlético (camisa interna)
  const torsoCore = new THREE.Mesh(new THREE.CapsuleGeometry(0.185, 0.34, 8, 14), innerMat);
  torsoCore.scale.set(1.18, 1.0, 0.72);
  torsoCore.position.y = 0.34;
  torsoCore.castShadow = true;
  upperBody.add(torsoCore);

  // Jaqueta aberta DedSec (painéis esquerdo/direito + costas + gola alta)
  const jacketBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.14), jacketMat);
  jacketBack.position.set(0, 0.34, -0.07);
  jacketBack.castShadow = true;
  const jacketPanelL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.54, 0.24), jacketMat);
  jacketPanelL.position.set(-0.14, 0.33, 0.04);
  jacketPanelL.castShadow = true;
  const jacketPanelR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.54, 0.24), jacketMat);
  jacketPanelR.position.set(0.14, 0.33, 0.04);
  jacketPanelR.castShadow = true;

  // Gola alta estilizada
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.13, 14, 1, true), jacketMat);
  collar.position.set(0, 0.63, -0.01);

  // Detalhes neon ciano/magenta na jaqueta
  const lapelTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.52, 0.025), cyanMat);
  lapelTrimL.position.set(-0.07, 0.34, 0.165);
  const lapelTrimR = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.52, 0.025), magentaMat);
  lapelTrimR.position.set(0.07, 0.34, 0.165);
  const collarTrim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 0.025), cyanMat);
  collarTrim.position.set(0, 0.68, -0.14);
  upperBody.add(jacketBack, jacketPanelL, jacketPanelR, collar, lapelTrimL, lapelTrimR, collarTrim);

  // Mochila tiracolo cruzada com alça diagonal e LED de status
  const slingPack = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.42, 0.15), packMat);
  slingPack.position.set(0.03, 0.33, -0.20);
  slingPack.rotation.z = -0.22;
  slingPack.castShadow = true;
  const slingStrap = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.66, 0.30), innerMat);
  slingStrap.position.set(0, 0.35, 0.01);
  slingStrap.rotation.z = 0.54;
  const backpackLed = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.04), ledMat);
  backpackLed.position.set(0.03, 0.39, -0.285);
  backpackLed.rotation.z = -0.22;
  upperBody.add(slingPack, slingStrap, backpackLed);

  // ==========================================
  // CABEÇA, BANDANA, VISOR NEON E BONÉ
  // ==========================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.73, 0);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.082, 0.14, 12), skinMat);
  neck.position.y = 0.02;

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.168, 16, 14), skinMat);
  skull.position.y = 0.16;
  skull.castShadow = true;

  // Máscara / Bandana facial escura na parte inferior do rosto
  const bandana = new THREE.Mesh(
    new THREE.SphereGeometry(0.176, 16, 10, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.45),
    maskMat
  );
  bandana.position.y = 0.155;
  const maskStripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.025), magentaMat);
  maskStripe.position.set(0, 0.095, 0.168);

  // Óculos / Visor hacker neon ciano estilizado
  const visorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.062, 0.07), maskMat);
  visorFrame.position.set(0, 0.19, 0.145);
  const visorGlow = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.038, 0.02), cyanMat);
  visorGlow.position.set(0, 0.19, 0.182);

  // Boné estilizado com aba voltada para frente (+Z)
  const capDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.178, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
    capMat
  );
  capDome.position.y = 0.18;
  capDome.castShadow = true;
  const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.026, 0.18), capMat);
  capBrim.position.set(0, 0.23, 0.175);
  capBrim.rotation.x = 0.14;
  const capTrim = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.018, 0.02), cyanMat);
  capTrim.position.set(0, 0.245, 0.18);

  headGroup.add(neck, skull, bandana, maskStripe, visorFrame, visorGlow, capDome, capBrim, capTrim);
  upperBody.add(headGroup);

  // ==========================================
  // BRAÇOS ARTICULADOS (Ombro -> Antebraço -> Mão)
  // ==========================================
  const buildArm = (xOffset, trimMat) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(xOffset, 0.55, 0);

    const shoulderPad = new THREE.Mesh(new THREE.SphereGeometry(0.082, 10, 10), jacketMat);
    const shoulderTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.084, 0.03, 12), trimMat);
    shoulderTrim.position.y = -0.02;

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.17, 6, 10), jacketMat);
    upperArm.position.y = -0.14;
    upperArm.castShadow = true;

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.26, 0);

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.17, 6, 10), innerMat);
    forearm.position.y = -0.12;
    forearm.castShadow = true;

    const hand = new THREE.Group();
    hand.position.set(0, -0.24, 0);
    const handMesh = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), skinMat);
    hand.add(handMesh);

    elbow.add(forearm, hand);
    shoulder.add(shoulderPad, shoulderTrim, upperArm, elbow);
    return { shoulder, elbow, hand };
  };

  const armLeft = buildArm(-0.27, cyanMat);
  const armRight = buildArm(0.27, magentaMat);
  upperBody.add(armLeft.shoulder, armRight.shoulder);

  // ==========================================
  // ARMAS NA MÃO DIREITA (apontam ao longo de -Y local para alinhar com a mira ao erguer o braço)
  // ==========================================
  const weaponMount = new THREE.Group();
  weaponMount.rotation.x = Math.PI / 2;
  armRight.hand.add(weaponMount);

  // [1] Pistola Taser DedSec
  const taserMesh = new THREE.Group();
  const taserBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.11, 0.30),
    new THREE.MeshStandardMaterial({ color: 0x162032, roughness: 0.4, metalness: 0.6 })
  );
  taserBody.position.set(0, 0.04, 0.10);
  const taserBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, 0.16), cyanMat);
  taserBarrel.position.set(0, 0.05, 0.25);
  taserMesh.add(taserBody, taserBarrel);
  weaponMount.add(taserMesh);

  // [2] Pistola Silenciada 9mm
  const pistolMesh = new THREE.Group();
  const pistolSlide = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.10, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x1c2434, roughness: 0.35, metalness: 0.7 })
  );
  pistolSlide.position.set(0, 0.04, 0.09);
  const silencer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.24, 10),
    new THREE.MeshStandardMaterial({ color: 0x0b0f18, roughness: 0.4, metalness: 0.8 })
  );
  silencer.rotation.x = Math.PI / 2;
  silencer.position.set(0, 0.06, 0.32);
  pistolMesh.add(pistolSlide, silencer);
  pistolMesh.visible = false;
  weaponMount.add(pistolMesh);

  // [3] Rifle de Assalto DedSec
  const rifleMesh = new THREE.Group();
  const rifleBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.13, 0.58),
    new THREE.MeshStandardMaterial({ color: 0x141a26, roughness: 0.45, metalness: 0.65 })
  );
  rifleBody.position.set(0, 0.04, 0.20);
  const rifleMag = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.16, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x2a344a, roughness: 0.5 })
  );
  rifleMag.position.set(0, -0.08, 0.24);
  const rifleAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.095, 0.035, 0.32),
    new THREE.MeshBasicMaterial({ color: 0xffaa00 })
  );
  rifleAccent.position.set(0, 0.07, 0.26);
  rifleMesh.add(rifleBody, rifleMag, rifleAccent);
  rifleMesh.visible = false;
  weaponMount.add(rifleMesh);

  // [4] Emissor de Pulso EMP
  const empMesh = new THREE.Group();
  const empCore = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.13, 12), cyanMat);
  empCore.position.set(0, 0.02, 0.06);
  empMesh.add(empCore);
  empMesh.visible = false;
  weaponMount.add(empMesh);

  // [5] Escopeta Tática DedSec
  const shotgunMesh = new THREE.Group();
  const sgBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.14, 0.64),
    new THREE.MeshStandardMaterial({ color: 0x1e2433, roughness: 0.4, metalness: 0.7 })
  );
  sgBody.position.set(0, 0.04, 0.22);
  const sgAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.04, 0.28),
    new THREE.MeshBasicMaterial({ color: 0xff3366 })
  );
  sgAccent.position.set(0, 0.07, 0.30);
  shotgunMesh.add(sgBody, sgAccent);
  shotgunMesh.visible = false;
  weaponMount.add(shotgunMesh);

  const parts = {
    upperBody,
    headGroup,
    torsoMeshes: [
      torsoCore,
      jacketBack,
      jacketPanelL,
      jacketPanelR,
      collar,
      lapelTrimL,
      lapelTrimR,
      collarTrim,
      slingPack,
      slingStrap,
      backpackLed
    ],
    hipL: legLeft.hip,
    kneeL: legLeft.knee,
    hipR: legRight.hip,
    kneeR: legRight.knee,
    shoulderL: armLeft.shoulder,
    elbowL: armLeft.elbow,
    shoulderR: armRight.shoulder,
    elbowR: armRight.elbow,
    backpackLed,
    taserMesh,
    pistolMesh,
    rifleMesh,
    empMesh,
    shotgunMesh,
    weaponMount,
    swimRipple: null,
    swimPhase: 0,
    jacketMat,
    innerMat,
    pantsMat,
    capMat,
    cyanMat,
    magentaMat,
    walkPhase: 0,
    crouchBlend: 0,
    moveBlend: 0,
    aimBlend: 0,
    aimTimer: 0
  };

  agentGroup.add(legLeft.hip, legRight.hip, upperBody);

  // Suave anel de ondulação/espuma ao redor do pescoço na linha da água ao nadar
  const swimRipple = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.58, 24),
    new THREE.MeshBasicMaterial({
      color: 0x88eeff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
  );
  swimRipple.rotation.x = -Math.PI / 2;
  swimRipple.position.y = 0.60;
  swimRipple.visible = false;
  agentGroup.add(swimRipple);
  parts.swimRipple = swimRipple;
  if (config.label) {
    agentGroup.add(createAgentNameTag(config.label));
  }
  return { group: agentGroup, parts };
}

export function buildPlayer() {
  const { group, parts } = createAgentMesh({
    isLocal: true,
    pos: [0, 0, 52],
    skinId: gameState.equippedSkin || 'classic'
  });
  refs.playerGroup = group;
  refs.playerParts = parts;
  playersMap.set(gameState.localPlayerId || 'local', { group, parts, isLocal: true });
  refs.scene.add(refs.playerGroup);
  applyPlayerSkin(gameState.equippedSkin || 'classic');

  // Drone Quadricóptero DedSec (Tecla Q)
  buildDroneMesh();
}

export function buildDroneMesh() {
  const droneGroup = new THREE.Group();
  const tiltGroup = new THREE.Group();
  droneGroup.add(tiltGroup);

  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x141b2d, roughness: 0.3, metalness: 0.78 });
  const guardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.65 });
  const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
  const lensGlassMat = new THREE.MeshStandardMaterial({ color: 0x050b14, roughness: 0.1, metalness: 0.9 });

  // Chassi central aerodinâmico com contornos neon ciano + bateria brilhante
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.56), chassisMat);
  chassis.castShadow = true;
  chassis.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(chassis.geometry),
      new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 })
    )
  );
  const topShell = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.065, 0.42), chassisMat);
  topShell.position.y = 0.095;
  const batteryCore = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.24), cyanMat);
  batteryCore.position.y = 0.135;
  tiltGroup.add(chassis, topShell, batteryCore);

  // Gimbal frontal com lente circular (CylinderGeometry) e LED indicador ciano/verde
  const gimbalMount = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.10, 0.10), guardMat);
  gimbalMount.position.set(0, -0.05, -0.29);
  const cameraLens = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.10, 14), lensGlassMat);
  cameraLens.rotation.x = Math.PI / 2;
  cameraLens.position.set(0, -0.05, -0.34);
  const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.01, 8, 16), cyanMat);
  lensRing.position.set(0, -0.05, -0.39);
  const statusLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), ledMat);
  statusLed.position.set(0.12, 0.02, -0.29);
  tiltGroup.add(gimbalMount, cameraLens, lensRing, statusLed);

  // 4 braços diagonais em "X", proteções circulares (TorusGeometry) e 4 hélices giratórias
  const rotors = [];
  [
    [-0.40, 0.03, -0.40],
    [0.40, 0.03, -0.40],
    [-0.40, 0.03, 0.40],
    [0.40, 0.03, 0.40]
  ].forEach(([rx, ry, rz]) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.042, 0.56), chassisMat);
    arm.position.set(rx * 0.5, 0.01, rz * 0.5);
    arm.rotation.y = Math.atan2(rx, rz);

    const guardRing = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.018, 8, 20), guardMat);
    guardRing.rotation.x = Math.PI / 2;
    guardRing.position.set(rx, ry + 0.02, rz);

    const guardGlow = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.008, 6, 20), cyanMat);
    guardGlow.rotation.x = Math.PI / 2;
    guardGlow.position.set(rx, ry + 0.02, rz);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.08, 10), guardMat);
    hub.position.set(rx, ry + 0.01, rz);

    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(rx, ry + 0.05, rz);
    const bladeA = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.014, 0.038), cyanMat);
    const bladeB = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.014, 0.34), cyanMat);
    rotorGroup.add(bladeA, bladeB);

    tiltGroup.add(arm, guardRing, guardGlow, hub, rotorGroup);
    rotors.push(rotorGroup);
  });

  droneGroup.scale.set(0.38, 0.38, 0.38);
  droneGroup.visible = false;
  refs.droneGroup = droneGroup;
  refs.droneRotors = rotors;
  refs.droneParts = { tiltGroup, rotors, ledMat };
  refs.scene.add(droneGroup);
}

export function toggleDrone() {
  if (gameState.drivingCar || gameState.drivingBoat || gameState.terminalOpen || gameState.missionModalOpen || gameState.shopOpen) return;
  if (!refs.droneGroup) return;

  gameState.droneActive = !gameState.droneActive;
  if (gameState.droneActive) {
    const pPos = refs.playerGroup.position;
    const spawnY = Math.max(getSurfaceHeight(pPos.x, pPos.z), -0.25) + 1.85;
    refs.droneGroup.position.set(pPos.x, spawnY, pPos.z);
    if (refs.droneParts?.tiltGroup) {
      refs.droneParts.tiltGroup.rotation.set(0, 0, 0);
    }
    gameState.droneYaw = gameState.cameraYaw;
    gameState.dronePitch = 0.14;
    refs.droneGroup.visible = true;
    if (dom.droneHud) dom.droneHud.classList.remove('hidden');
    if (dom.droneSignal) dom.droneSignal.textContent = 'DISTÂNCIA SINAL: 0m / 90m';
    if (!gameState.netHackActive) dom.statusMode.textContent = 'DRONE';
    AudioManager.playNetHackPulse(true);
  } else {
    refs.droneGroup.visible = false;
    refs.droneGroup.position.copy(refs.playerGroup.position);
    if (refs.droneParts?.tiltGroup) {
      refs.droneParts.tiltGroup.rotation.set(0, 0, 0);
    }
    if (dom.droneHud) dom.droneHud.classList.add('hidden');
    if (!gameState.netHackActive) dom.statusMode.textContent = 'FURTIVO';
    AudioManager.playNetHackPulse(false);
  }
}

export function triggerBlackout() {
  const unlocked = gameState.hasBlackout || gameState.difficulty === 'DEDSEC_ELITE';
  if (!unlocked || gameState.blackoutCooldown > 0) return;

  gameState.blackoutTimer = 12.0;
  gameState.blackoutCooldown = 35.0;
  gameState.hacksUsed += 1;
  AudioManager.playEmpPulse();

  // Apagar postes de luz e escurecer a iluminação ambiente
  if (lightPoles.length > 0 && lightPoles[0].headMesh?.material?.color) {
    lightPoles[0].headMesh.material.color.setHex(0x0b101a);
  }
  if (refs.ambientLight && !gameState.netHackActive) {
    refs.ambientLight.intensity = 0.65;
  }

  // Desativar todas as câmeras com laser vermelho durante os 12s
  securityCameras.forEach((camObj) => {
    camObj.disabledTimer = Math.max(camObj.disabledTimer, 12.0);
    camObj.mesh.userData.normalMaterial.emissive.setHex(0x334155);
    if (camObj.laserMesh) camObj.laserMesh.visible = false;
  });
}

export function upsertRemotePlayer(packet) {
  if (!packet || !packet.id || packet.id === gameState.localPlayerId) return;
  let entry = remotePlayers.get(packet.id);
  if (!entry) {
    const { group, parts } = createAgentMesh({
      isLocal: false,
      label: packet.name || `AGENTE_${String(packet.id).slice(0, 6).toUpperCase()}`,
      pos: [packet.x || 0, packet.y || 0, packet.z || 0]
    });
    refs.scene.add(group);
    entry = { group, parts, isLocal: false };
    remotePlayers.set(packet.id, entry);
    playersMap.set(packet.id, entry);
  }
  entry.group.position.set(packet.x || 0, packet.y || 0, packet.z || 0);
  entry.group.rotation.y = packet.rotY || 0;
  entry.group.visible = packet.inCar === null || packet.inCar === undefined;
}

export function removeRemotePlayer(id) {
  const entry = remotePlayers.get(id);
  if (!entry) return;
  refs.scene.remove(entry.group);
  remotePlayers.delete(id);
  playersMap.delete(id);
}

export function applyPlayerSkin(skinId) {
  const skin = SKINS_CATALOG.find((s) => s.id === skinId) || SKINS_CATALOG[0];
  const p = refs.playerParts;
  if (!skin || !p) return;
  if (p.jacketMat) p.jacketMat.color.setHex(skin.jacket);
  if (p.innerMat) p.innerMat.color.setHex(skin.inner);
  if (p.pantsMat) p.pantsMat.color.setHex(skin.pants);
  if (p.capMat) p.capMat.color.setHex(skin.cap);
  if (p.cyanMat) p.cyanMat.color.setHex(skin.primary);
  if (p.magentaMat) p.magentaMat.color.setHex(skin.secondary);
}

// ==========================================
// CÂMERAS DE SEGURANÇA HACKEÁVEIS
// ==========================================
// Geometria do cone laser das câmeras (vértice na lente, base larga inclinada para a rua)
const CAM_CONE_LENGTH = 12;
const CAM_CONE_RADIUS = 4.2;
const CAM_CONE_PITCH = 0.65; // rad para baixo

export function buildSecurityCameras(cfg, missionKey = 'COMPLEXO_CTOS') {
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

    // Feixe laser vermelho semitransparente de varredura
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xff0033,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    // Cone aberto com o vértice na lente e a base larga projetada para baixo, sobre a rua/calçada
    const laserGeo = new THREE.ConeGeometry(CAM_CONE_RADIUS, CAM_CONE_LENGTH, 20, 1, true);
    laserGeo.translate(0, -CAM_CONE_LENGTH / 2, 0); // vértice na origem, eixo ao longo de -Y
    laserGeo.boundingBox = new THREE.Box3(); // feixe visual: nunca entra em colisão
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.position.set(0, 0, 0.4); // lente da câmera
    laserMesh.rotation.x = CAM_CONE_PITCH - Math.PI / 2; // eixo -Y -> (0, -sin(p), cos(p)) = inclinado para baixo
    laserMesh.raycast = () => {};
    mesh.add(laserMesh);

    refs.worldGroup.add(mesh);

    hackableMeshes.push(mesh);
    securityCameras.push({
      id: idx,
      missionKey,
      name: camCfg.name,
      mesh,
      laserMesh,
      pos: pos.clone(),
      baseYaw: camCfg.baseYaw,
      basePitch: camCfg.basePitch,
      yawOffset: 0,
      pitchOffset: 0,
      visionRange: CAM_CONE_LENGTH,
      visionHalfAngle: Math.atan(CAM_CONE_RADIUS / CAM_CONE_LENGTH),
      disabledTimer: 0,
      alertCooldown: 0,
      sweepPhase: idx * 1.5,
      currentYaw: camCfg.baseYaw
    });
  });
}

// ==========================================
// CAIXAS ELÉTRICAS DE DISTRAÇÃO
// ==========================================
export function buildElectricBoxes(cfg) {
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
    refs.worldGroup.add(sparkPoints);

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
export function buildGuards(cfg, missionKey = 'COMPLEXO_CTOS') {
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
    refs.worldGroup.add(group);

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

export function cycleSecurityCamera(specificIndex = null) {
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

export function overloadActiveCamera() {
  if (gameState.activeCamIndex < 0) return;
  AudioManager.playElectricZap();
  gameState.hacksUsed += 1;
  const camObj = securityCameras[gameState.activeCamIndex];
  camObj.disabledTimer = CAMERA_OVERLOAD_DURATION;
  camObj.mesh.userData.normalMaterial.emissive.setHex(0x331111);
  cycleSecurityCamera(-1);
}

export function triggerElectricBox(box) {
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

  // Atrair o guarda mais próximo ativo para investigar por 6 segundos
  let nearestGuard = null;
  let nearestDist = Infinity;
  guards.forEach((g) => {
    if (g.state === GUARD_STATE.DEAD || g.state === GUARD_STATE.STUNNED) return;
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

export function freeRescueCell(cell) {
  if (!cell || cell.freed) return;
  cell.freed = true;
  cell.genHp = 0;
  if (cell.barsGroup) cell.barsGroup.visible = false;
  if (cell.cellCollider) {
    const colIdx = colliders.indexOf(cell.cellCollider);
    if (colIdx !== -1) colliders.splice(colIdx, 1);
  }
  if (cell.panelMesh?.userData?.normalMaterial?.emissive) {
    cell.panelMesh.userData.normalMaterial.emissive.setHex(0x00ff88);
  }
  if (cell.genMesh?.userData?.normalMaterial?.emissive) {
    cell.genMesh.userData.normalMaterial.emissive.setHex(0x222222);
    cell.genMesh.userData.normalMaterial.emissiveIntensity = 0.1;
  }
  AudioManager.playGateMechanical();
  cell.prisonerRunning = true;
  cell.prisonerRunTimer = 9.0;

  if (gameState.mission === MISSION_STATE.RESCUE_PRISONER && gameState.activeMissionKey === cell.missionKey) {
    const cfg = MAPS_CONFIG[cell.missionKey];
    triggerBaseAlert();
    const wantedTarget = cfg?.wantedOnFree || 2;
    addWantedLevel(Math.max(0, wantedTarget - gameState.wantedLevel), 'PERSEGUIÇÃO');
    setMissionState(MISSION_STATE.ESCAPE);
    dom.missionObjective.textContent = 'PRISIONEIRO LIBERTADO // FUJA PARA A EXTRAÇÃO';
    dom.missionSub.textContent = '"Valeu, DedSec!" — Escape da perseguição até o anel verde de extração';
  }
}
refs.onFreeRescueCell = freeRescueCell;

export function handleInteractPress() {
  // Se já está em uma câmera, E também pode sair
  if (gameState.activeCamIndex >= 0) {
    cycleSecurityCamera(-1);
    return;
  }

  const pPos = gameState.droneActive && refs.droneGroup ? refs.droneGroup.position : refs.playerGroup.position;
  const gateDistLimit = gameState.droneActive ? 18.0 : 3.6;

  // 1. Checar proximidade dos painéis de portão não destravados
  for (let i = 0; i < gates.length; i++) {
    const g = gates[i];
    if (!g.unlocked && pPos.distanceTo(g.panelMesh.position) < gateDistLimit) {
      gameState.activeGateIndex = i;
      openTerminal('GATE');
      return;
    }
  }

  // 1a. Checar terminais das celas de resgate (a pé ou via Drone Q)
  for (let i = 0; i < rescueCells.length; i++) {
    const cell = rescueCells[i];
    if (!cell.freed && pPos.distanceTo(cell.panelMesh.position) < gateDistLimit) {
      gameState.activeCellIndex = i;
      openTerminal('CELL');
      return;
    }
  }

  // 1b. Checar lojas interativas (DedSec Style / HackShop Armory / SF Motors) - apenas a pé
  if (!gameState.droneActive) {
    for (const st of stores) {
      if (pPos.distanceTo(st.pos) < 3.6) {
        openShopModal(st.type);
        return;
      }
    }

    // 1c. Checar caixas de suprimentos nos prédios abertos (+$100 ou +25 HP)
    for (const sb of supplyBoxes) {
      if (!sb.used && pPos.distanceTo(sb.pos) < 3.0) {
        sb.used = true;
        if (sb.mesh?.userData?.normalMaterial?.emissive) {
          sb.mesh.userData.normalMaterial.emissiveIntensity = 0.08;
        }
        if (sb.rewardType === 'MONEY') {
          gameState.money += 100;
          updateMoneyHUD();
        } else {
          gameState.hp = Math.min(gameState.maxHp || 100, gameState.hp + 25);
          updateHpHUD();
        }
        AudioManager.playTerminalSuccess();
        return;
      }
    }

    // 2. Checar firewall do servidor central antes do download
    if (
      gameState.mission === MISSION_STATE.STEAL_DATA &&
      !gameState.serverFirewallDisabled &&
      pPos.distanceTo(refs.serverMesh.position) < 3.8
    ) {
      openTerminal('FIREWALL');
      return;
    }
  }

  // 3. Checar caixas elétricas de distração (perto ou olhando na Visão NetHack)
  const camDir = new THREE.Vector3();
  refs.camera.getWorldDirection(camDir);

  for (const box of electricBoxes) {
    const distBox = pPos.distanceTo(box.mesh.position);
    const toBox = box.mesh.position.clone().sub(refs.camera.position).normalize();
    const lookingInNetHack = gameState.netHackActive && distBox < 28 && camDir.dot(toBox) > 0.90;
    if (distBox < 3.6 || lookingInNetHack) {
      triggerElectricBox(box);
      return;
    }
  }

  // 3b. Checar tubulações de vapor (V+E), semáforos, carros hackeáveis ou pedestres (Profiler +$75) na Visão NetHack (V)
  if (gameState.netHackActive) {
    for (const sp of steamPipes) {
      if (sp.cooldown > 0 || sp.activeTimer > 0) continue;
      const distSp = pPos.distanceTo(sp.pos);
      const toSp = sp.pos.clone().add(new THREE.Vector3(0, 0.5, 0)).sub(refs.camera.position).normalize();
      if ((distSp < 42 && camDir.dot(toSp) > 0.86) || (gameState.drivingCar && distSp < 14)) {
        sp.activeTimer = 4.5;
        sp.cooldown = 16.0;
        if (sp.steamPoints) sp.steamPoints.visible = true;
        gameState.hacksUsed += 1;
        AudioManager.playExplosion();
        return;
      }
    }

    for (const tl of trafficLights) {
      if (tl.hackedTimer > 0) continue;
      const distTl = pPos.distanceTo(tl.pos);
      const toTl = tl.pos.clone().add(new THREE.Vector3(0, 4.8, 0)).sub(refs.camera.position).normalize();
      if (distTl < 36 && camDir.dot(toTl) > 0.88) {
        tl.hackedTimer = 10.0;
        tl.greenMat.color.setHex(0x00ff88);
        tl.redMat.color.setHex(0x00ff88);
        gameState.hacksUsed += 1;
        AudioManager.playElectricZap();
        // Acelerar carros de tráfego próximos causando caos e bloqueando viaturas policiais
        trafficCars.forEach((tc) => {
          if (!tc.destroyed && tc !== gameState.drivingCar && tc.mesh.position.distanceTo(tl.pos) < 44) {
            tc.hackedTimer = 4.0;
            tc.speed = 21.0;
          }
        });
        return;
      }
    }

    for (const ped of pedestrians) {
      if (ped.profile.hacked) continue;
      const distPed = pPos.distanceTo(ped.mesh.position);
      const toPed = ped.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0)).sub(refs.camera.position).normalize();
      if (distPed < 22 && camDir.dot(toPed) > 0.91) {
        ped.profile.hacked = true;
        gameState.money += 75;
        gameState.hacksUsed += 1;
        updateMoneyHUD();
        AudioManager.playTerminalSuccess();
        return;
      }
    }

    for (const car of cars) {
      if (car.isDedsec || car.destroyed || car.hackedUsed) continue;
      const distCar = pPos.distanceTo(car.mesh.position);
      const toCar = car.mesh.position.clone().sub(refs.camera.position).normalize();
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

  // 4. Checar se o jogador está olhando/próximo a uma câmera de segurança (V + E desativa laser)
  for (let i = 0; i < securityCameras.length; i++) {
    const camObj = securityCameras[i];
    if (camObj.disabledTimer > 0) continue;
    if (pPos.distanceTo(camObj.pos) < (gameState.netHackActive ? 26 : 12)) {
      const toSecurityCam = camObj.pos.clone().sub(refs.camera.position).normalize();
      if (camDir.dot(toSecurityCam) > 0.90) {
        if (gameState.netHackActive) {
          camObj.disabledTimer = CAMERA_OVERLOAD_DURATION;
          camObj.mesh.userData.normalMaterial.emissive.setHex(0x334155);
          if (camObj.laserMesh) camObj.laserMesh.visible = false;
          gameState.hacksUsed += 1;
          AudioManager.playElectricZap();
        } else {
          cycleSecurityCamera(i);
        }
        return;
      }
    }
  }
}

function isCarLockedByGate(car) {
  if (!car || !car.requiresGateUnlock || !car.vipMissionKey) return false;
  const missionGates = gates.filter((g) => g.missionKey === car.vipMissionKey);
  return missionGates.length > 0 && missionGates.some((g) => !g.unlocked);
}

export function toggleDriveDedsecCar() {
  if (gameState.terminalOpen || gameState.missionModalOpen || gameState.activeCamIndex >= 0) return;

  // Desembarcar do barco em terra firme ou píer mais próximo (Oeste: X = 74, Leste: X = 404)
  if (gameState.drivingBoat) {
    const boat = gameState.drivingBoat;
    const bPos = boat.mesh.position;
    const pierSpots = [
      [74, 62],
      [74, 220],
      [404, 62],
      [404, -120]
    ];
    let nearestPier = pierSpots[0];
    let bestPierDist = Infinity;
    for (const ps of pierSpots) {
      const d = Math.hypot(bPos.x - ps[0], bPos.z - ps[1]);
      if (d < bestPierDist) {
        bestPierDist = d;
        nearestPier = ps;
      }
    }

    let landX = nearestPier[0];
    let landZ = nearestPier[1];
    if (bestPierDist > 30) {
      // Se estiver longe dos píeres, desembarca na margem/calçada mais próxima fora da baía
      landX = bPos.x < 240 ? 74 : 404;
      landZ = THREE.MathUtils.clamp(bPos.z, -260, 340);
    }

    const offsets = [
      [0, 0],
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
      [-4, 0],
      [4, 0]
    ];
    let targetX = landX;
    let targetZ = landZ;
    for (const [ox, oz] of offsets) {
      const tx = landX + ox;
      const tz = landZ + oz;
      if (!isWaterForLand(tx, tz) && !checkCollision(tx, tz, PLAYER_RADIUS)) {
        targetX = tx;
        targetZ = tz;
        break;
      }
    }

    gameState.drivingBoat = null;
    boat.speed = 0;
    if (boat.wakePoints) boat.wakePoints.visible = false;
    AudioManager.stopEngineSound();
    refs.playerGroup.position.set(targetX, 0.1, targetZ);
    refs.playerGroup.visible = true;
    return;
  }

  if (gameState.drivingCar) {
    const car = gameState.drivingCar;
    gameState.drivingCar = null;
    car.speed = 0;
    if (refs.activeHeadlight) refs.activeHeadlight.intensity = 0;
    if (dom.cockpitHud) dom.cockpitHud.classList.add('hidden');
    AudioManager.stopEngineSound();

    car.mesh.updateMatrixWorld(true);
    car.colliderObj.box.setFromObject(car.mesh);

    // Encontrar posição segura ao lado/trás do carro sem colidir com a Box3 do veículo ou paredes
    const yaw = car.mesh.rotation.y;
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);
    const fwdX = Math.sin(yaw);
    const fwdZ = Math.cos(yaw);
    const candidates = [
      [rightX * 2.7, rightZ * 2.7],
      [-rightX * 2.7, -rightZ * 2.7],
      [-fwdX * 3.4, -fwdZ * 3.4],
      [fwdX * 3.4, fwdZ * 3.4],
      [rightX * 3.6, rightZ * 3.6],
      [-rightX * 3.6, -rightZ * 3.6]
    ];

    let outX = THREE.MathUtils.clamp(car.mesh.position.x + rightX * 2.8, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    let outZ = THREE.MathUtils.clamp(car.mesh.position.z + rightZ * 2.8, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
    for (const [ox, oz] of candidates) {
      const cx = THREE.MathUtils.clamp(car.mesh.position.x + ox, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
      const cz = THREE.MathUtils.clamp(car.mesh.position.z + oz, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
      if (!checkCollision(cx, cz, PLAYER_RADIUS) && (!isWaterArea(cx, cz) || getSurfaceHeight(cx, cz) > 0)) {
        outX = cx;
        outZ = cz;
        break;
      }
    }

    refs.playerGroup.position.set(outX, getSurfaceHeight(outX, outZ), outZ);
    refs.playerGroup.visible = true;
    updateVehicleHpHUD();
    return;
  }

  // Verificar embarque em lancha DedSec (diretamente da água ou píer)
  for (const boat of boats) {
    const dH = Math.hypot(refs.playerGroup.position.x - boat.mesh.position.x, refs.playerGroup.position.z - boat.mesh.position.z);
    if (dH < 5.8) {
      gameState.drivingBoat = boat;
      gameState.isSwimming = false;
      gameState.isCrouching = false;
      gameState.isSprinting = false;
      refs.playerGroup.visible = false;
      if (!gameState.netHackActive) dom.statusMode.textContent = 'LANCHA';
      return;
    }
  }

  let nearestCar = null;
  let nearestDist = 4.2;
  for (const car of cars) {
    if (!car.isDrivable || car.destroyed || Math.abs(car.speed) >= 6.0) continue;
    if (isCarLockedByGate(car)) continue;
    const d = refs.playerGroup.position.distanceTo(car.mesh.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearestCar = car;
    }
  }

  if (nearestCar) {
    if (nearestCar.hasDriver) {
      nearestCar.hasDriver = false;
      if (nearestCar.driverMesh) nearestCar.driverMesh.visible = false;
      spawnFleeingDriver(nearestCar);
      reportCrimeToCivilians(nearestCar.mesh.position, 22, 1);
    }
    gameState.drivingCar = nearestCar;
    gameState.isCrouching = false;
    gameState.isSprinting = false;
    refs.playerGroup.visible = false;
    if (nearestCar.headlight) nearestCar.headlight.intensity = 2.4;
    if (!gameState.netHackActive) dom.statusMode.textContent = 'VEÍCULO';
    updateVehicleHpHUD();
    if (
      nearestCar === gameState.targetCar &&
      (gameState.mission === MISSION_STATE.STEAL_CAR || gameState.mission === MISSION_STATE.INFILTRATE)
    ) {
      const activeCfg = MAPS_CONFIG[gameState.activeMissionKey];
      if (gameState.mission !== MISSION_STATE.STEAL_CAR) {
        setMissionState(MISSION_STATE.STEAL_CAR);
      }
      if (refs.vehicleDeliveryGroup) refs.vehicleDeliveryGroup.visible = true;
      triggerBaseAlert();
      if (activeCfg?.requiresInfiltration) {
        const delta = Math.max(0, 3 - gameState.wantedLevel);
        addWantedLevel(delta, 'PERSEGUIÇÃO');
      } else {
        addWantedLevel(2, 'PERSEGUIÇÃO');
      }
    }
  }
}

function spawnFleeingDriver(car) {
  const npc = new THREE.Group();
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xc69072, roughness: 0.65 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.32, 6, 10), jacketMat);
  torso.position.y = 1.12;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), skinMat);
  head.position.y = 1.56;
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.42, 4, 8), pantsMat);
  legL.position.set(-0.1, 0.42, 0);
  const legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.42, 4, 8), pantsMat);
  legR.position.set(0.1, 0.42, 0);
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.36, 4, 8), jacketMat);
  armL.position.set(-0.24, 1.18, 0);
  const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.36, 4, 8), jacketMat);
  armR.position.set(0.24, 1.18, 0);
  npc.add(torso, head, legL, legR, armL, armR);

  const yaw = car.mesh.rotation.y;
  const dirX = Math.cos(yaw);
  const dirZ = -Math.sin(yaw);
  const sx = THREE.MathUtils.clamp(car.mesh.position.x + dirX * 2.1, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
  const sz = THREE.MathUtils.clamp(car.mesh.position.z + dirZ * 2.1, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
  npc.position.set(sx, getSurfaceHeight(sx, sz), sz);
  npc.rotation.y = Math.atan2(dirX, dirZ);
  refs.worldGroup.add(npc);

  fleeingDrivers.push({
    mesh: npc,
    dirX,
    dirZ,
    timer: 6.5,
    phase: 0,
    legL,
    legR,
    armL,
    armR
  });
}

function knockDownLightPole(pole, dirX, dirZ) {
  if (!pole || pole.fallen) return;
  pole.fallen = true;
  pole.falling = true;
  pole.fallProgress = 0;
  const len = Math.hypot(dirX, dirZ) || 1;
  pole.fallDirX = dirX / len;
  pole.fallDirZ = dirZ / len;

  // Remover colisor para liberar a passagem
  const colIdx = colliders.indexOf(pole.colliderObj);
  if (colIdx !== -1) colliders.splice(colIdx, 1);

  // Ocultar a instância original do InstancedMesh
  const zeroDummy = new THREE.Object3D();
  zeroDummy.scale.set(0, 0, 0);
  zeroDummy.updateMatrix();
  pole.poleMesh.setMatrixAt(pole.id, zeroDummy.matrix);
  pole.headMesh.setMatrixAt(pole.id, zeroDummy.matrix);
  pole.poleMesh.instanceMatrix.needsUpdate = true;
  pole.headMesh.instanceMatrix.needsUpdate = true;

  // Criar poste tombável com pivô na base + faíscas elétricas
  const fallGroup = new THREE.Group();
  fallGroup.position.set(pole.x, 0, pole.z);
  fallGroup.rotation.y = Math.atan2(pole.fallDirX, pole.fallDirZ);

  const shaft = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 5.8, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x1e2538, roughness: 0.6 })
  );
  shaft.position.y = 2.9;
  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.22, 0.45),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff })
  );
  lamp.position.y = 5.85;
  fallGroup.add(shaft, lamp);
  refs.worldGroup.add(fallGroup);
  pole.fallGroup = fallGroup;

  // Faíscas elétricas na base
  const sparkCount = 18;
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    sparkPos[i * 3] = pole.x + (Math.random() - 0.5) * 0.9;
    sparkPos[i * 3 + 1] = 0.2 + Math.random() * 1.4;
    sparkPos[i * 3 + 2] = pole.z + (Math.random() - 0.5) * 0.9;
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkPoints = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.28, transparent: true, opacity: 0.95 })
  );
  refs.worldGroup.add(sparkPoints);
  pole.sparkPoints = sparkPoints;
  pole.sparkTimer = 1.4;

  AudioManager.playMetalCrash();
}

export function updateCarPitch(car, dt) {
  if (!car || !car.mesh) return;
  car.mesh.rotation.order = 'YXZ';
  const yaw = car.mesh.rotation.y;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const halfLen = 1.6;
  const frontX = car.mesh.position.x + fx * halfLen;
  const frontZ = car.mesh.position.z + fz * halfLen;
  const backX = car.mesh.position.x - fx * halfLen;
  const backZ = car.mesh.position.z - fz * halfLen;
  const hFront = getSurfaceHeight(frontX, frontZ);
  const hBack = getSurfaceHeight(backX, backZ);
  const targetPitch = -Math.atan2(hFront - hBack, halfLen * 2);
  car.mesh.rotation.x = THREE.MathUtils.lerp(car.mesh.rotation.x, targetPitch, Math.min(1, dt * 8));
}

export function disembarkPoliceCar(car) {
  if (!car || car.disembarked) return;
  car.disembarked = true;
  car.speed = 0;
  const pPos = refs.playerGroup.position;
  const cx = car.mesh.position.x;
  const cz = car.mesh.position.z;
  const yaw = car.mesh.rotation.y;
  const rx = Math.cos(yaw) * 2.4;
  const rz = -Math.sin(yaw) * 2.4;
  const beforeCount = guards.length;
  buildGuards(
    {
      guards: [
        { waypoints: [[cx + rx, getSurfaceHeight(cx + rx, cz + rz), cz + rz], [pPos.x, getSurfaceHeight(pPos.x, pPos.z), pPos.z]], speed: 3.8, visionRange: 28 },
        { waypoints: [[cx - rx, getSurfaceHeight(cx - rx, cz - rz), cz - rz], [pPos.x, getSurfaceHeight(pPos.x, pPos.z), pPos.z]], speed: 4.0, visionRange: 28 }
      ]
    },
    'POLICE'
  );
  for (let i = beforeCount; i < guards.length; i++) {
    guards[i].isPolice = true;
    guards[i].state = GUARD_STATE.COMBAT;
    guards[i].lastKnownPos = pPos.clone();
  }
}

// ==========================================
// MOVIMENTAÇÃO, COLISÃO, CARROS E CÂMERA
// ==========================================
function checkCarHitPedestrians(car, isPlayerCar = false) {
  if (!car || car.destroyed || Math.abs(car.speed) < 4.5) return;
  const cPos = car.mesh.position;
  const moveSign = Math.sign(car.speed) || 1;
  const fwdX = Math.sin(car.mesh.rotation.y) * moveSign;
  const fwdZ = Math.cos(car.mesh.rotation.y) * moveSign;
  const rightX = Math.cos(car.mesh.rotation.y);
  const rightZ = -Math.sin(car.mesh.rotation.y);

  for (const ped of pedestrians) {
    if (ped.stunnedTimer > 0) continue;
    const dx = ped.mesh.position.x - cPos.x;
    const dz = ped.mesh.position.z - cPos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 1.9 && Math.abs(ped.mesh.position.y - cPos.y) < 2.0) {
      // Empurra o pedestre lateralmente (+2.2m perpendicular ao carro) para nunca sumir dentro da malha nem travar o veículo
      const latSign = dx * rightX + dz * rightZ >= 0 ? 1 : -1;
      const pushX = cPos.x + rightX * latSign * 2.2;
      const pushZ = cPos.z + rightZ * latSign * 2.2;
      if (!checkCollision(pushX, pushZ, 0.35) && !isWaterArea(pushX, pushZ)) {
        ped.mesh.position.x = pushX;
        ped.mesh.position.z = pushZ;
      }
      ped.mesh.position.y = getSurfaceHeight(ped.mesh.position.x, ped.mesh.position.z) + 0.2;
      ped.mesh.visible = true;
      ped.stunnedTimer = 10.0;
      ped.callingPolice = false;
      if (ped.phoneIcon) ped.phoneIcon.visible = false;
      ped.knockTimer = 0.35;
      ped.knockVx = fwdX * 3.5 + rightX * latSign * 4.5;
      ped.knockVz = fwdZ * 3.5 + rightZ * latSign * 4.5;
      ped.knockVy = 2.6;
      ped.mesh.rotation.x = -Math.PI / 2;
      AudioManager.playMetalCrash();
      if (isPlayerCar) {
        reportCrimeToCivilians(ped.mesh.position, 24, 2);
      } else {
        reportCrimeToCivilians(ped.mesh.position, 18, 1);
      }
    }
  }
}

export function updateCars(dt) {
  if (gameState.callVehicleCooldown > 0) {
    gameState.callVehicleCooldown = Math.max(0, gameState.callVehicleCooldown - dt);
  }

  // Atualizar colunas de vapor das tubulações hackeadas (imobilizam e danificam viaturas policiais)
  steamPipes.forEach((sp) => {
    if (sp.cooldown > 0) sp.cooldown = Math.max(0, sp.cooldown - dt);
    if (sp.activeTimer > 0) {
      sp.activeTimer = Math.max(0, sp.activeTimer - dt);
      if (sp.steamPoints) {
        sp.steamPoints.visible = sp.activeTimer > 0;
        const posAttr = sp.steamPoints.geometry.getAttribute('position');
        for (let i = 0; i < sp.steamData.length; i++) {
          let sy = posAttr.getY(i) + sp.steamData[i].speed * dt;
          if (sy > 6.2) sy = 0.1;
          posAttr.setY(i, sy);
        }
        posAttr.needsUpdate = true;
      }
      policeCars.forEach((pc) => {
        if (!pc || pc.destroyed) return;
        if (Math.hypot(pc.mesh.position.x - sp.pos.x, pc.mesh.position.z - sp.pos.z) < 5.2) {
          pc.speed = 0;
          pc.hackedTimer = Math.max(pc.hackedTimer || 0, 3.0);
          damageCar(pc, 48 * dt);
        }
      });
    }
  });
  // Atualizar timers de semáforos hackeados
  trafficLights.forEach((tl, idx) => {
    if (tl.hackedTimer > 0) {
      tl.hackedTimer = Math.max(0, tl.hackedTimer - dt);
      if (tl.hackedTimer === 0) {
        tl.greenMat.color.setHex(idx % 2 === 0 ? 0x00ff88 : 0x163022);
        tl.redMat.color.setHex(idx % 2 === 0 ? 0x330a12 : 0xff0044);
      }
    }
  });

  // Animação física de queda dos postes atingidos e faíscas elétricas
  lightPoles.forEach((pole) => {
    if (pole.falling && pole.fallGroup) {
      pole.fallProgress = Math.min(1, pole.fallProgress + dt * 2.1);
      const eased = 1 - Math.pow(1 - pole.fallProgress, 2);
      pole.fallGroup.rotation.x = eased * (Math.PI / 2 - 0.08);
      if (pole.fallProgress >= 1) pole.falling = false;
    }
    if (pole.sparkPoints && pole.sparkTimer > 0) {
      pole.sparkTimer = Math.max(0, pole.sparkTimer - dt);
      pole.sparkPoints.material.opacity = pole.sparkTimer / 1.4;
      if (pole.sparkTimer <= 0) {
        refs.worldGroup.remove(pole.sparkPoints);
        if (pole.sparkPoints.geometry) pole.sparkPoints.geometry.dispose();
        if (pole.sparkPoints.material) pole.sparkPoints.material.dispose();
        pole.sparkPoints = null;
      }
    }
  });
  for (let i = fleeingDrivers.length - 1; i >= 0; i--) {
    const drv = fleeingDrivers[i];
    drv.timer -= dt;
    drv.phase += dt * 16;
    const nx = drv.mesh.position.x + drv.dirX * 5.2 * dt;
    const nz = drv.mesh.position.z + drv.dirZ * 5.2 * dt;
    if (!checkCollision(nx, nz, 0.35) && !isWaterArea(nx, nz)) {
      drv.mesh.position.x = nx;
      drv.mesh.position.z = nz;
      drv.mesh.position.y = getSurfaceHeight(nx, nz);
    }
    const swing = Math.sin(drv.phase) * 0.7;
    drv.legL.rotation.x = swing;
    drv.legR.rotation.x = -swing;
    drv.armL.rotation.x = -2.2 + swing * 0.4;
    drv.armR.rotation.x = -2.2 - swing * 0.4;
    if (drv.timer <= 0) {
      refs.worldGroup.remove(drv.mesh);
      disposeHierarchy(drv.mesh);
      fleeingDrivers.splice(i, 1);
    }
  }
  cars.forEach((car) => {
    // Dano progressivo: fumaça branca leve <= 65% HP, fumaça preta espessa <= 35% HP
    if (car.smokePoints) {
      const hpPct = car.hp / (car.maxHp || 100);
      if (hpPct <= 0.65) {
        car.smokePoints.visible = true;
        if (car.smokePoints.material) {
          if (hpPct <= 0.35) {
            car.smokePoints.material.color.setHex(0x1f1f1f);
            car.smokePoints.material.opacity = 0.8;
            car.smokePoints.material.size = 0.62;
          } else {
            car.smokePoints.material.color.setHex(0xcbd5e1);
            car.smokePoints.material.opacity = 0.42;
            car.smokePoints.material.size = 0.42;
          }
        }
        const posAttr = car.smokePoints.geometry.getAttribute('position');
        for (let s = 0; s < car.smokeData.length; s++) {
          const sd = car.smokeData[s];
          let sy = posAttr.getY(s) + sd.speed * dt;
          if (sy > 2.6) sy = 0.85;
          posAttr.setY(s, sy);
        }
        posAttr.needsUpdate = true;
      } else {
        car.smokePoints.visible = false;
      }
    }

    if (car.destroyed) return;

    // Tráfego autônomo em movimento pelas avenidas e pontes
    if (car.isTraffic && car !== gameState.drivingCar && car.hasDriver && car.hackedTimer <= 0) {
      car.hornCooldown = Math.max(0, (car.hornCooldown || 0) - dt);
      const [tx, tz] = car.waypoints[car.currentTarget];
      const dx = tx - car.mesh.position.x;
      const dz = tz - car.mesh.position.z;
      const distWp = Math.hypot(dx, dz);
      if (distWp < 3.0) {
        car.currentTarget = (car.currentTarget + 1) % car.waypoints.length;
      } else {
        const desiredYaw = Math.atan2(dx, dz);
        let diff = desiredYaw - car.mesh.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        car.mesh.rotation.y += diff * Math.min(1, dt * 4.5);
      }

      const fwdX = Math.sin(car.mesh.rotation.y);
      const fwdZ = Math.cos(car.mesh.rotation.y);

      // Detecção frontal de outros veículos ou do jogador
      let blocked = false;
      const pPos = refs.playerGroup.position;
      const toPlayerX = pPos.x - car.mesh.position.x;
      const toPlayerZ = pPos.z - car.mesh.position.z;
      const distPlayer = Math.hypot(toPlayerX, toPlayerZ);
      if (distPlayer < 7.5 && (toPlayerX * fwdX + toPlayerZ * fwdZ) / (distPlayer || 1) > 0.72 && Math.abs(pPos.y - car.mesh.position.y) < 3.0) {
        blocked = true;
        if (car.hornCooldown <= 0) {
          AudioManager.playHorn();
          car.hornCooldown = 3.5;
        }
      }

      car.bypassTrafficTimer = Math.max(0, (car.bypassTrafficTimer || 0) - dt);

      if (!blocked && car.bypassTrafficTimer <= 0) {
        for (const other of cars) {
          if (other === car || other.destroyed) continue;
          const ox = other.mesh.position.x - car.mesh.position.x;
          const oz = other.mesh.position.z - car.mesh.position.z;
          const od = Math.hypot(ox, oz);
          if (od < 7.2 && (ox * fwdX + oz * fwdZ) / (od || 1) > 0.78 && Math.abs(other.mesh.position.y - car.mesh.position.y) < 3.0) {
            blocked = true;
            if (car.hornCooldown <= 0 && distPlayer < 45) {
              AudioManager.playHorn();
              car.hornCooldown = 4.0;
            }
            break;
          }
        }
      }

      // Timer anti-travamento: se ficar parado > 2.5s atrás de outro carro, faz leve desvio e ignora tráfego por 1.5s
      if (blocked || car.speed < 0.8) {
        car.stuckTimer = (car.stuckTimer || 0) + dt;
        if (car.stuckTimer >= 2.5) {
          car.stuckTimer = 0;
          car.bypassTrafficTimer = 1.5;
          blocked = false;
          const rx = Math.cos(car.mesh.rotation.y);
          const rz = -Math.sin(car.mesh.rotation.y);
          const nudgeX = car.mesh.position.x + rx * 1.4;
          const nudgeZ = car.mesh.position.z + rz * 1.4;
          if (!checkCarCollision(nudgeX, nudgeZ, car.mesh.rotation.y, car, true)) {
            car.mesh.position.x = nudgeX;
            car.mesh.position.z = nudgeZ;
          }
        }
      } else {
        car.stuckTimer = 0;
      }

      const targetSpeed = blocked ? 0 : car.baseSpeed;
      car.speed = THREE.MathUtils.lerp(car.speed, targetSpeed, Math.min(1, dt * (blocked ? 6.0 : 2.5)));
      if (car.speed > 0.15) {
        const nx = car.mesh.position.x + fwdX * car.speed * dt;
        const nz = car.mesh.position.z + fwdZ * car.speed * dt;
        const ignoreTraffic = car.bypassTrafficTimer > 0;
        if (!checkCarCollision(nx, nz, car.mesh.rotation.y, car, ignoreTraffic)) {
          car.mesh.position.x = nx;
          car.mesh.position.z = nz;
          car.mesh.position.y = getSurfaceHeight(nx, nz);
          car.mesh.updateMatrixWorld(true);
          car.colliderObj.box.setFromObject(car.mesh);
          updateCarPitch(car, dt);
        } else {
          car.speed = 0;
        }
      }
      return;
    }

    // Perseguição ativa das viaturas policiais (policeCars)
    if (car.isPoliceCar && car !== gameState.drivingCar && !car.destroyed && car.hackedTimer <= 0) {
      if (!car.disembarked) {
        const pPos = refs.playerGroup.position;
        const toPlayerX = pPos.x - car.mesh.position.x;
        const toPlayerZ = pPos.z - car.mesh.position.z;
        const distPlayer = Math.hypot(toPlayerX, toPlayerZ);

        car.sirenCd = Math.max(0, (car.sirenCd || 0) - dt);
        if (car.sirenCd <= 0 && distPlayer < 85) {
          AudioManager.playBaseAlertSiren();
          car.sirenCd = 3.6;
        }

        if (distPlayer < 17 || car.hp < car.maxHp * 0.45) {
          disembarkPoliceCar(car);
        } else {
          const desiredYaw = Math.atan2(toPlayerX, toPlayerZ);
          let diff = desiredYaw - car.mesh.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          car.mesh.rotation.y += diff * Math.min(1, dt * 3.6);

          const fwdX = Math.sin(car.mesh.rotation.y);
          const fwdZ = Math.cos(car.mesh.rotation.y);
          car.speed = THREE.MathUtils.lerp(car.speed, 14.0, Math.min(1, dt * 3.2));

          const nx = car.mesh.position.x + fwdX * car.speed * dt;
          const nz = car.mesh.position.z + fwdZ * car.speed * dt;
          if (!checkCarCollision(nx, nz, car.mesh.rotation.y, car)) {
            car.mesh.position.x = nx;
            car.mesh.position.z = nz;
            car.mesh.position.y = getSurfaceHeight(nx, nz);
            car.mesh.updateMatrixWorld(true);
            car.colliderObj.box.setFromObject(car.mesh);
            updateCarPitch(car, dt);
            checkCarHitPedestrians(car, false);
          } else {
            // Se encontrar bloqueio físico ou colidir, para e desembarca a tropa imediatamente
            car.speed = 0;
            disembarkPoliceCar(car);
          }
        }
      }
      return;
    }

    if ((car.isDrivable && !car.isTraffic) || car.hackedTimer <= 0) return;

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
      !checkCarCollision(nextX, nextZ, car.mesh.rotation.y, car)
    ) {
      car.mesh.position.x = nextX;
      car.mesh.position.z = nextZ;
      car.mesh.position.y = getSurfaceHeight(nextX, nextZ);
      car.mesh.updateMatrixWorld(true);
      car.colliderObj.box.setFromObject(car.mesh);
      updateCarPitch(car, dt);
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

export function updatePlayer(dt) {
  if (gameState.terminalOpen || gameState.activeCamIndex >= 0) return;

  // Pulsação do LED da mochila hacker
  if (refs.playerParts.backpackLed) {
    const pulseOn = Math.sin(gameState.elapsedTime * 5) > -0.2;
    refs.playerParts.backpackLed.material.color.setHex(
      gameState.isCrouching ? 0xffaa00 : pulseOn ? 0x00ff88 : 0x004433
    );
  }

  // Modo Drone Quadricóptero DedSec (Tecla Q) com colisão 3D real nos eixos X, Y e Z
  if (gameState.droneActive && refs.droneGroup) {
    refs.droneRotors.forEach((r) => {
      r.rotation.y += dt * 36;
    });

    let inZ = 0;
    let inX = 0;
    let inY = 0;
    if (gameState.keys['KeyW'] || gameState.keys['ArrowUp']) inZ += 1;
    if (gameState.keys['KeyS'] || gameState.keys['ArrowDown']) inZ -= 1;
    if (gameState.keys['KeyA'] || gameState.keys['ArrowLeft']) inX -= 1;
    if (gameState.keys['KeyD'] || gameState.keys['ArrowRight']) inX += 1;
    if (gameState.keys['Space']) inY += 1;
    if (gameState.keys['ControlLeft'] || gameState.keys['ControlRight']) inY -= 1;

    const dyaw = gameState.droneYaw;
    const fwdX = -Math.sin(dyaw);
    const fwdZ = -Math.cos(dyaw);
    const rightX = Math.cos(dyaw);
    const rightZ = -Math.sin(dyaw);

    const dPos = refs.droneGroup.position;
    const dSpeed = 14.0;
    const moveX = (fwdX * inZ + rightX * inX) * dSpeed * dt;
    const moveZ = (fwdZ * inZ + rightZ * inX) * dSpeed * dt;
    const moveY = inY * 9.0 * dt;

    // Colisão 3D separada nos eixos X, Z e Y para deslizar em paredes e nunca afundar no chão/água
    if (!checkDroneCollision(dPos.x + moveX, dPos.y, dPos.z, 0.45)) {
      dPos.x += moveX;
    }
    if (!checkDroneCollision(dPos.x, dPos.y, dPos.z + moveZ, 0.45)) {
      dPos.z += moveZ;
    }
    const targetY = THREE.MathUtils.clamp(dPos.y + moveY, Math.max(getSurfaceHeight(dPos.x, dPos.z), -0.25) + 0.35, 48.0);
    if (!checkDroneCollision(dPos.x, targetY, dPos.z, 0.45)) {
      dPos.y = targetY;
    }

    // Manter drone dentro do raio de sinal de 90m do agente
    const pPos = refs.playerGroup.position;
    const dx = dPos.x - pPos.x;
    const dz = dPos.z - pPos.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 90) {
      dPos.x = pPos.x + (dx / dist) * 90;
      dPos.z = pPos.z + (dz / dist) * 90;
    }
    refs.droneGroup.rotation.y = dyaw;

    // Inclinação dinâmica (pitch e roll suaves) na direção da aceleração
    if (refs.droneParts?.tiltGroup) {
      const targetPitch = -inZ * 0.24;
      const targetRoll = -inX * 0.24;
      refs.droneParts.tiltGroup.rotation.x = THREE.MathUtils.lerp(
        refs.droneParts.tiltGroup.rotation.x,
        targetPitch,
        Math.min(1, dt * 10)
      );
      refs.droneParts.tiltGroup.rotation.z = THREE.MathUtils.lerp(
        refs.droneParts.tiltGroup.rotation.z,
        targetRoll,
        Math.min(1, dt * 10)
      );
    }

    // Atualizar distância do sinal no HUD
    if (dom.droneSignal) {
      const shownDist = Math.min(90, Math.round(dist));
      dom.droneSignal.textContent = `DISTÂNCIA SINAL: ${shownDist}m / 90m`;
      dom.droneSignal.className = shownDist > 75 ? 'neon-magenta' : 'neon-cyan';
    }

    // Na Visão NetHack com Drone, marcar guardas através das paredes
    if (gameState.netHackActive) {
      guards.forEach((g) => {
        if (g.state !== GUARD_STATE.DEAD && g.mesh.position.distanceTo(dPos) < 38) {
          g.marked = true;
        }
      });
    }
    if (!gameState.netHackActive) dom.statusMode.textContent = 'DRONE';
    return;
  }

  // Modo Navegação de Lancha DedSec na Baía
  if (gameState.drivingBoat) {
    const boat = gameState.drivingBoat;
    let throttle = 0;
    let steer = 0;
    if (gameState.keys['KeyW'] || gameState.keys['ArrowUp']) throttle += 1;
    if (gameState.keys['KeyS'] || gameState.keys['ArrowDown']) throttle -= 1;
    if (gameState.keys['KeyA'] || gameState.keys['ArrowLeft']) steer += 1;
    if (gameState.keys['KeyD'] || gameState.keys['ArrowRight']) steer -= 1;

    if (throttle !== 0) {
      boat.speed = THREE.MathUtils.clamp(boat.speed + throttle * 14 * dt, -7.5, 22.0);
    } else {
      boat.speed *= Math.max(0, 1 - dt * 1.8);
      if (Math.abs(boat.speed) < 0.08) boat.speed = 0;
    }

    if (Math.abs(boat.speed) > 0.3 && steer !== 0) {
      const dirSign = boat.speed >= 0 ? 1 : -1;
      boat.mesh.rotation.y += steer * dirSign * 1.85 * dt;
    }

    const fx = Math.sin(boat.mesh.rotation.y);
    const fz = Math.cos(boat.mesh.rotation.y);
    const nextX = THREE.MathUtils.clamp(boat.mesh.position.x + fx * boat.speed * dt, WORLD_BOUNDS.minX + 4, WORLD_BOUNDS.maxX - 4);
    const nextZ = THREE.MathUtils.clamp(boat.mesh.position.z + fz * boat.speed * dt, WORLD_BOUNDS.minZ + 4, WORLD_BOUNDS.maxZ - 4);

    if (isWaterForBoats(nextX, nextZ)) {
      boat.mesh.position.x = nextX;
      boat.mesh.position.z = nextZ;
    } else {
      boat.speed = 0;
    }

    boat.mesh.position.y = -0.42 + Math.sin(gameState.elapsedTime * 2.5 + boat.id) * 0.05;
    refs.playerGroup.position.copy(boat.mesh.position);

    // Espuma / ondulação dinâmica ao redor do casco
    const hullFoam = boat.mesh.getObjectByName('hullFoam');
    if (hullFoam) {
      const speedNorm = Math.min(1, Math.abs(boat.speed) / 18);
      const pulse = Math.sin(gameState.elapsedTime * 3.5);
      hullFoam.scale.set(1.0 + speedNorm * 0.45 + pulse * 0.05, 1.0 + speedNorm * 1.1 + pulse * 0.05, 1);
      hullFoam.material.opacity = 0.35 + speedNorm * 0.45;
    }

    // Rastro ciano na popa
    if (boat.wakePoints) {
      boat.wakePoints.visible = Math.abs(boat.speed) > 1.0;
      if (boat.wakePoints.visible) {
        const attr = boat.wakePoints.geometry.getAttribute('position');
        const sternX = boat.mesh.position.x - fx * 2.7;
        const sternZ = boat.mesh.position.z - fz * 2.7;
        for (let i = 0; i < boat.wakeData.length; i++) {
          const w = boat.wakeData[i];
          w.life -= dt;
          if (w.life <= 0) {
            w.life = 0.35 + Math.random() * 0.4;
            attr.setXYZ(i, sternX + (Math.random() - 0.5) * 1.2, -0.42, sternZ + (Math.random() - 0.5) * 1.2);
          }
        }
        attr.needsUpdate = true;
      }
    }

    AudioManager.updateEngineSound(Math.abs(boat.speed), true);
    if (!gameState.netHackActive) dom.statusMode.textContent = 'LANCHA';
    return;
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

    const nitroActive = !!(car.hasNitro && (gameState.keys['ShiftLeft'] || gameState.keys['ShiftRight']) && throttle > 0);
    const driftActive = !!(gameState.keys['Space'] && Math.abs(car.speed) > 6.5 && steer !== 0);
    const maxFwd = (car.maxSpeed || 18) * (nitroActive ? 1.42 : 1.0);
    const accel = (car.accel || 18) * (nitroActive ? 1.5 : 1.0);
    const turnRate = (car.turnRate || 2.2) * (driftActive ? 1.65 : 1.0);

    if (throttle !== 0) {
      car.speed = THREE.MathUtils.clamp(car.speed + throttle * accel * dt, -9.0, maxFwd);
    } else {
      car.speed *= Math.max(0, 1 - dt * 3.5);
      if (Math.abs(car.speed) < 0.08) car.speed = 0;
    }
    if (driftActive) {
      car.speed *= Math.max(0, 1 - dt * 1.1);
      car.driftSoundCd = Math.max(0, (car.driftSoundCd || 0) - dt);
      if (car.driftSoundCd <= 0) {
        AudioManager.playTireScreech();
        car.driftSoundCd = 0.28;
      }
    }

    if (Math.abs(car.speed) > 0.4 && steer !== 0) {
      const dirSign = car.speed >= 0 ? 1 : -1;
      car.mesh.rotation.y += steer * dirSign * turnRate * dt;
    }
    // Inclinação sutil da carroceria no drift
    const targetTilt = driftActive ? steer * 0.075 : 0;
    car.mesh.rotation.z = THREE.MathUtils.lerp(car.mesh.rotation.z, targetTilt, Math.min(1, dt * 10));

    // FOV dinâmico e rastro neon no Nitro
    if (refs.camera) {
      const targetFov = nitroActive ? 74 : 62;
      if (Math.abs(refs.camera.fov - targetFov) > 0.05) {
        refs.camera.fov = THREE.MathUtils.lerp(refs.camera.fov, targetFov, Math.min(1, dt * 7));
        refs.camera.updateProjectionMatrix();
      }
    }
    if (nitroActive) {
      car.nitroTrailCd = Math.max(0, (car.nitroTrailCd || 0) - dt);
      if (car.nitroTrailCd <= 0) {
        const backX = car.mesh.position.x - Math.sin(car.mesh.rotation.y) * 2.2;
        const backZ = car.mesh.position.z - Math.cos(car.mesh.rotation.y) * 2.2;
        spawnTaserFlash(new THREE.Vector3(backX, car.mesh.position.y + 0.45, backZ), 0xff0055);
        car.nitroTrailCd = 0.07;
      }
    }

    // Alerta sonoro crítico quando integridade do carro <= 15%
    if (car.hp / (car.maxHp || 100) <= 0.15) {
      car.warnCd = Math.max(0, (car.warnCd || 0) - dt);
      if (car.warnCd <= 0) {
        AudioManager.playLowHpWarning();
        car.warnCd = 0.85;
      }
    }

    const fx = Math.sin(car.mesh.rotation.y);
    const fz = Math.cos(car.mesh.rotation.y);
    const stepX = fx * car.speed * dt;
    const stepZ = fz * car.speed * dt;

    const cPos = car.mesh.position;

    // Derrubar postes de luz se o carro colidir em alta velocidade (speed >= 6)
    if (Math.abs(car.speed) >= 6.0) {
      for (const pole of lightPoles) {
        if (pole.fallen) continue;
        const dPole = Math.hypot(cPos.x + stepX - pole.x, cPos.z + stepZ - pole.z);
        if (dPole < 2.2) {
          knockDownLightPole(pole, fx * Math.sign(car.speed), fz * Math.sign(car.speed));
          car.speed *= 0.84;
        }
      }
    }

    if (!checkCarCollision(cPos.x + stepX, cPos.z, car.mesh.rotation.y, car)) {
      cPos.x += stepX;
    } else {
      if (Math.abs(car.speed) >= 10.0) {
        AudioManager.playMetalCrash();
        reportCrimeToCivilians(cPos, 20, 1);
      }
      car.speed *= 0.2;
    }
    if (!checkCarCollision(cPos.x, cPos.z + stepZ, car.mesh.rotation.y, car)) {
      cPos.z += stepZ;
    } else {
      if (Math.abs(car.speed) >= 10.0) {
        AudioManager.playMetalCrash();
        reportCrimeToCivilians(cPos, 20, 1);
      }
      car.speed *= 0.2;
    }
    checkCarHitPedestrians(car, true);

    cPos.x = THREE.MathUtils.clamp(cPos.x, WORLD_BOUNDS.minX + 1, WORLD_BOUNDS.maxX - 1);
    cPos.z = THREE.MathUtils.clamp(cPos.z, WORLD_BOUNDS.minZ + 1, WORLD_BOUNDS.maxZ - 1);

    // Se por acidente o carro cair na água, afunda/enguiça, remove collider e ejeta o jogador para margem segura
    if (isWaterArea(cPos.x, cPos.z)) {
      car.speed = 0;
      car.destroyed = true;
      car.hp = 0;
      cPos.y = -1.0;
      const colIdx = colliders.indexOf(car.colliderObj);
      if (colIdx !== -1) colliders.splice(colIdx, 1);
      if (refs.activeHeadlight) refs.activeHeadlight.intensity = 0;
      gameState.drivingCar = null;
      AudioManager.stopEngineSound();
      const baseShoreX = cPos.x < 240 ? 74 : 406;
      const baseShoreZ = THREE.MathUtils.clamp(cPos.z, -80, 330);
      let shoreX = baseShoreX;
      let shoreZ = baseShoreZ;
      for (const [ox, oz] of [[0, 0], [-4, 0], [4, 0], [0, -5], [0, 5], [-8, 0], [8, 0]]) {
        const tx = baseShoreX + ox;
        const tz = baseShoreZ + oz;
        if (!isWaterArea(tx, tz) && !checkCollision(tx, tz, PLAYER_RADIUS)) {
          shoreX = tx;
          shoreZ = tz;
          break;
        }
      }
      refs.playerGroup.position.set(shoreX, getSurfaceHeight(shoreX, shoreZ), shoreZ);
      refs.playerGroup.visible = true;
      updateVehicleHpHUD();
      if (dom.cockpitHud) dom.cockpitHud.classList.add('hidden');
      return;
    }

    cPos.y = getSurfaceHeight(cPos.x, cPos.z);
    updateCarPitch(car, dt);

    car.mesh.updateMatrixWorld(true);
    car.colliderObj.box.setFromObject(car.mesh);
    refs.playerGroup.position.copy(cPos);

    // Acoplar o único PointLight de farol dinâmico apenas ao veículo dirigido
    if (refs.activeHeadlight) {
      refs.activeHeadlight.intensity = 2.4;
      refs.activeHeadlight.position.set(cPos.x + fx * 2.8, cPos.y + 1.0, cPos.z + fz * 2.8);
    }

    if (Math.abs(car.speed) > 5.0) {
      guards.forEach((g) => {
        if (g.state !== GUARD_STATE.STUNNED && g.mesh.position.distanceTo(cPos) < 2.4) {
          stunGuard(g, 6.0);
        }
      });
    }

    AudioManager.updateEngineSound(Math.abs(car.speed));
    if (!gameState.netHackActive) {
      dom.statusMode.textContent = nitroActive ? 'VEÍCULO [NITRO]' : driftActive ? 'VEÍCULO [DRIFT]' : 'VEÍCULO';
    }
    return;
  }

  if (refs.activeHeadlight) refs.activeHeadlight.intensity = 0;
  if (refs.camera && Math.abs(refs.camera.fov - 62) > 0.05) {
    refs.camera.fov = THREE.MathUtils.lerp(refs.camera.fov, 62, Math.min(1, dt * 8));
    refs.camera.updateProjectionMatrix();
  }

  const pos = refs.playerGroup.position;
  const overBridgeFootprint =
    (pos.z >= 25.0 && pos.z <= 45.0 && pos.x >= 70 && pos.x <= 410) ||
    (pos.z >= 310.0 && pos.z <= 330.0 && pos.x >= 70 && pos.x <= 410);
  // Só está "na ponte" se a altura real do jogador estiver próxima do tabuleiro (evita sugar quem nada por baixo)
  const bridgeHeight = overBridgeFootprint ? getSurfaceHeight(pos.x, pos.z) : 0;
  const onElevatedBridge = overBridgeFootprint && pos.y >= bridgeHeight - 2.5;
  const inWater = isWaterForBoats(pos.x, pos.z) && !isPierArea(pos.x, pos.z) && !onElevatedBridge;
  gameState.isSwimming = inWater;

  let inputZ = 0;
  let inputX = 0;
  if (gameState.keys['KeyW'] || gameState.keys['ArrowUp']) inputZ += 1;
  if (gameState.keys['KeyS'] || gameState.keys['ArrowDown']) inputZ -= 1;
  if (gameState.keys['KeyA'] || gameState.keys['ArrowLeft']) inputX -= 1;
  if (gameState.keys['KeyD'] || gameState.keys['ArrowRight']) inputX += 1;

  const isMoving = inputX !== 0 || inputZ !== 0;
  gameState.isCrouching = !gameState.isSwimming && !!(gameState.keys['ControlLeft'] || gameState.keys['ControlRight']);
  gameState.isSprinting = !!(gameState.keys['ShiftLeft'] || gameState.keys['ShiftRight']) && !gameState.isCrouching && isMoving;

  if (!gameState.netHackActive && gameState.activeCamIndex < 0) {
    dom.statusMode.textContent = gameState.isSwimming
      ? 'NADANDO'
      : gameState.isCrouching
      ? 'AGACHADO'
      : gameState.isSprinting
      ? 'CORRENDO'
      : 'FURTIVO';
  }

  const baseSpeed = gameState.isCrouching
    ? PLAYER_CROUCH_SPEED
    : gameState.isSprinting
    ? PLAYER_SPRINT_SPEED
    : PLAYER_SPEED;
  const currentSpeed = gameState.isSwimming
    ? (gameState.isSprinting ? 7.2 : 4.0)
    : baseSpeed;

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

    // Movimentação livre no chão, calçadas, píeres e água (sem paredes invisíveis de água)
    if (!checkCollision(pos.x + stepX, pos.z, PLAYER_RADIUS, null, pos.y, 1.8)) {
      pos.x += stepX;
    }
    if (!checkCollision(pos.x, pos.z + stepZ, PLAYER_RADIUS, null, pos.y, 1.8)) {
      pos.z += stepZ;
    }

    // Limites do mundo aberto unificado
    pos.x = THREE.MathUtils.clamp(pos.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    pos.z = THREE.MathUtils.clamp(pos.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);

    // Rotação suave na direção do movimento (ou para frente da mira se atirando)
    const targetRot =
      refs.playerParts.aimTimer > 0 ? gameState.cameraYaw + Math.PI : Math.atan2(moveX, moveZ);
    let diff = targetRot - refs.playerGroup.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    refs.playerGroup.rotation.y += diff * Math.min(1, dt * 12);
  } else if (refs.playerParts.aimTimer > 0) {
    const targetRot = gameState.cameraYaw + Math.PI;
    let diff = targetRot - refs.playerGroup.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    refs.playerGroup.rotation.y += diff * Math.min(1, dt * 16);
  }

  // Pulo real do jogador a pé (Space estando no chão, fora da água/veículos/drone)
  if (!inWater) {
    if (gameState.keys['Space'] && gameState.isGrounded && !gameState.isCrouching) {
      gameState.playerVelY = 7.8;
      gameState.isGrounded = false;
    }
    const groundY = getSurfaceHeight(pos.x, pos.z);
    if (!gameState.isGrounded || gameState.playerVelY > 0) {
      gameState.playerVelY -= 20.0 * dt;
      pos.y += gameState.playerVelY * dt;
      if (pos.y <= groundY) {
        pos.y = groundY;
        gameState.playerVelY = 0;
        gameState.isGrounded = true;
      }
    } else {
      pos.y = THREE.MathUtils.lerp(pos.y, groundY, Math.min(1, dt * 12));
      gameState.isGrounded = true;
    }
  } else {
    // Altura da superfície na água: submerge a pos.y = -1.15 mantendo cabeça/ombros fora da água
    gameState.playerVelY = 0;
    gameState.isGrounded = false;
    pos.y = THREE.MathUtils.lerp(pos.y, -1.15, Math.min(1, dt * 10));
  }

  const p = refs.playerParts;
  // Ocultar armas durante o nado e atualizar anel de ondulação/espuma ao redor do pescoço
  if (p.weaponMount) {
    p.weaponMount.visible = !gameState.isSwimming;
  }
  if (p.swimRipple) {
    p.swimRipple.visible = gameState.isSwimming;
    if (gameState.isSwimming) {
      const pulse = Math.sin(gameState.elapsedTime * 4.2);
      const s = 1.0 + pulse * 0.12 + (isMoving ? 0.35 : 0);
      p.swimRipple.scale.set(s, s, 1);
      p.swimRipple.material.opacity = 0.45 + pulse * 0.15;
    }
  }

  if (gameState.isSwimming) {
    p.swimPhase = (p.swimPhase || 0) + dt * (gameState.isSprinting ? 9.5 : 5.8);
    const sPhase = p.swimPhase;
    p.crouchBlend = 0;
    p.aimBlend = 0;
    p.aimTimer = 0;

    const hipY = 0.88;
    p.hipL.position.y = hipY;
    p.hipR.position.y = hipY;
    p.upperBody.position.y = hipY;
    p.upperBody.rotation.x = isMoving ? 0.32 : 0.08;
    p.headGroup.rotation.x = isMoving ? -0.28 : 0.0;

    if (isMoving) {
      // Braçadas alternadas de nado crawl (braço esquerdo e braço direito com offset PI)
      p.shoulderL.rotation.x = Math.cos(sPhase) * 1.5 - 0.5;
      p.elbowL.rotation.x = -Math.abs(Math.sin(sPhase)) * 1.15;
      p.shoulderL.rotation.z = -0.22 + Math.sin(sPhase) * 0.2;

      p.shoulderR.rotation.x = Math.cos(sPhase + Math.PI) * 1.5 - 0.5;
      p.elbowR.rotation.x = -Math.abs(Math.sin(sPhase + Math.PI)) * 1.15;
      p.shoulderR.rotation.z = 0.22 - Math.sin(sPhase + Math.PI) * 0.2;

      // Batimento de pernas crawl (flutter kick)
      p.hipL.rotation.x = Math.sin(sPhase * 2.2) * 0.32;
      p.hipR.rotation.x = -Math.sin(sPhase * 2.2) * 0.32;
      p.kneeL.rotation.x = Math.max(0, Math.sin(sPhase * 2.2)) * 0.42;
      p.kneeR.rotation.x = Math.max(0, -Math.sin(sPhase * 2.2)) * 0.42;
    } else {
      // Flutuação suave (treading water)
      const t = gameState.elapsedTime;
      p.shoulderL.rotation.x = -0.3 + Math.sin(t * 2.5) * 0.16;
      p.shoulderR.rotation.x = -0.3 - Math.sin(t * 2.5) * 0.16;
      p.shoulderL.rotation.z = -0.35 + Math.cos(t * 2.5) * 0.12;
      p.shoulderR.rotation.z = 0.35 - Math.cos(t * 2.5) * 0.12;
      p.elbowL.rotation.x = -0.35;
      p.elbowR.rotation.x = -0.35;
      p.hipL.rotation.x = Math.sin(t * 2.8) * 0.12;
      p.hipR.rotation.x = -Math.sin(t * 2.8) * 0.12;
      p.kneeL.rotation.x = 0.22;
      p.kneeR.rotation.x = 0.22;
    }
  } else {
    // Animações esqueléticas fluidas em terra (caminhada, corrida, agachamento real nos joelhos/tronco e mira)
    p.aimTimer = Math.max(0, p.aimTimer - dt);
    p.crouchBlend = THREE.MathUtils.lerp(p.crouchBlend, gameState.isCrouching ? 1 : 0, Math.min(1, dt * 12));
    p.moveBlend = THREE.MathUtils.lerp(p.moveBlend, isMoving ? 1 : 0, Math.min(1, dt * 12));
    p.aimBlend = THREE.MathUtils.lerp(p.aimBlend, p.aimTimer > 0 ? 1 : 0, Math.min(1, dt * 16));

    const strideFreq = gameState.isSprinting ? 14.5 : gameState.isCrouching ? 7.5 : 9.8;
    if (isMoving) {
      p.walkPhase += dt * strideFreq;
    }
    const strideAmp = (gameState.isSprinting ? 0.62 : gameState.isCrouching ? 0.34 : 0.44) * p.moveBlend;
    const sinW = Math.sin(p.walkPhase);

    // Agachamento real: abaixa o quadril/tronco e dobra os joelhos
    const hipY = 0.88 - 0.27 * p.crouchBlend;
    p.hipL.position.y = hipY;
    p.hipR.position.y = hipY;
    p.upperBody.position.y = hipY;
    p.upperBody.rotation.x = 0.36 * p.crouchBlend + (gameState.isSprinting ? 0.16 * p.moveBlend : 0);
    p.headGroup.rotation.x = -0.24 * p.crouchBlend;

    const legSwingL = sinW * strideAmp;
    const legSwingR = -sinW * strideAmp;
    if (!gameState.isGrounded) {
      // Pose de salto no ar (pernas dobradas e braços levemente erguidos)
      p.hipL.rotation.x = -0.55;
      p.hipR.rotation.x = 0.35;
      p.kneeL.rotation.x = 0.85;
      p.kneeR.rotation.x = 0.55;
    } else {
      p.hipL.rotation.x = legSwingL - 0.68 * p.crouchBlend;
      p.hipR.rotation.x = legSwingR - 0.68 * p.crouchBlend;
      p.kneeL.rotation.x = 1.28 * p.crouchBlend + Math.max(0, -sinW) * 0.58 * p.moveBlend;
      p.kneeR.rotation.x = 1.28 * p.crouchBlend + Math.max(0, sinW) * 0.58 * p.moveBlend;
    }

    // Braço esquerdo (balanço natural)
    p.shoulderL.rotation.x = -legSwingL * 0.85 - 0.12 * p.crouchBlend;
    p.elbowL.rotation.x = -0.28 - (gameState.isSprinting ? 0.55 * p.moveBlend : 0);
    p.shoulderL.rotation.z = 0;

    // Braço direito (postura tática baixa ao caminhar -> ergue reto na mira ao disparar + leve recuo)
    const walkShoulderR = -legSwingR * 0.75 - 0.18;
    const walkElbowR = -0.45 - (gameState.isSprinting ? 0.45 * p.moveBlend : 0);
    const recoilKick = (gameState.recoilTimer / 0.12) * 0.26;
    const aimShoulderR = -1.38 - recoilKick;
    const aimElbowR = -0.16;
    p.shoulderR.rotation.x = THREE.MathUtils.lerp(walkShoulderR, aimShoulderR, p.aimBlend);
    p.elbowR.rotation.x = THREE.MathUtils.lerp(walkElbowR, aimElbowR, p.aimBlend);
    p.shoulderR.rotation.z = 0;
  }
}

export function toggleFirstPerson() {
  gameState.firstPerson = !gameState.firstPerson;
  if (dom.statusCamera) {
    dom.statusCamera.textContent = gameState.firstPerson ? '[P] 1ª PESSOA' : '[P] 3ª PESSOA';
  }
  if (!gameState.firstPerson && dom.cockpitHud) {
    dom.cockpitHud.classList.add('hidden');
  }
  gameState.cameraPitch = gameState.firstPerson ? 0 : 0.34;
}

function setFirstPersonBodyVisibility(hideBody) {
  const p = refs.playerParts;
  if (!p) return;
  if (p.headGroup) p.headGroup.visible = !hideBody;
  if (p.hipL) p.hipL.visible = !hideBody;
  if (p.hipR) p.hipR.visible = !hideBody;
  if (p.shoulderL) p.shoulderL.visible = !hideBody;
  if (p.torsoMeshes) {
    p.torsoMeshes.forEach((m) => {
      m.visible = !hideBody;
    });
  }
}

export function updateCamera() {
  // Modo Câmera do Drone Quadricóptero DedSec (Q): 3ª pessoa próxima exibindo o drone ou lente frontal (P)
  if (gameState.droneActive && refs.droneGroup) {
    setFirstPersonBodyVisibility(false);
    if (dom.cockpitHud) dom.cockpitHud.classList.add('hidden');
    const dPos = refs.droneGroup.position;
    const yaw = gameState.droneYaw;
    const pitch = THREE.MathUtils.clamp(gameState.dronePitch, -0.75, 0.75);
    const lookX = -Math.sin(yaw) * Math.cos(pitch);
    const lookY = -Math.sin(pitch);
    const lookZ = -Math.cos(yaw) * Math.cos(pitch);

    if (gameState.firstPerson) {
      // Visão da lente frontal do gimbal (Tecla P)
      refs.camera.position.set(dPos.x + lookX * 0.22, dPos.y - 0.02, dPos.z + lookZ * 0.22);
      refs.camera.lookAt(dPos.x + lookX * 14, dPos.y + lookY * 14, dPos.z + lookZ * 14);
    } else {
      // Visão em 3ª pessoa próxima atrás/acima do drone (dist = 1.9m, heightOffset = 0.48m, lerp suave)
      const dist = 1.9;
      const heightOffset = 0.48;
      const idealPos = new THREE.Vector3(
        dPos.x + Math.sin(yaw) * Math.cos(pitch) * dist,
        dPos.y + heightOffset + Math.sin(pitch) * dist * 0.45,
        dPos.z + Math.cos(yaw) * Math.cos(pitch) * dist
      );
      const camDir = idealPos.clone().sub(dPos).normalize();
      raycaster.set(dPos, camDir);
      raycaster.far = idealPos.distanceTo(dPos);
      const hits = raycaster.intersectObjects(occluders, false);
      const targetCamPos =
        hits.length > 0
          ? dPos.clone().addScaledVector(camDir, Math.max(0.55, hits[0].distance - 0.22))
          : idealPos;
      refs.camera.position.lerp(targetCamPos, 0.22);
      refs.camera.lookAt(dPos.x + lookX * 2.5, dPos.y + lookY * 2.5, dPos.z + lookZ * 2.5);
    }
    return;
  }

  if (gameState.activeCamIndex >= 0) {
    setFirstPersonBodyVisibility(false);
    if (dom.cockpitHud) dom.cockpitHud.classList.add('hidden');
    const camObj = securityCameras[gameState.activeCamIndex];
    refs.camera.position.copy(camObj.pos);
    const yaw = camObj.baseYaw + camObj.yawOffset;
    const pitch = camObj.basePitch + camObj.pitchOffset;
    const lookTarget = new THREE.Vector3(
      camObj.pos.x + Math.sin(yaw) * Math.cos(pitch) * 10,
      camObj.pos.y + Math.sin(pitch) * 10,
      camObj.pos.z + Math.cos(yaw) * Math.cos(pitch) * 10
    );
    refs.camera.lookAt(lookTarget);
    return;
  }

  // Modo 1ª Pessoa — Visão do Cockpit dirigindo
  if (gameState.firstPerson && gameState.drivingCar) {
    setFirstPersonBodyVisibility(false);
    const car = gameState.drivingCar;
    const cPos = car.mesh.position;
    const cyaw = car.mesh.rotation.y;
    const fwdX = Math.sin(cyaw);
    const fwdZ = Math.cos(cyaw);
    const rightX = Math.cos(cyaw);
    const rightZ = -Math.sin(cyaw);
    const seatH = car.maxHp >= 200 ? 1.42 : 1.12;

    refs.camera.position.set(
      cPos.x + rightX * 0.36 + fwdX * 0.12,
      cPos.y + seatH,
      cPos.z + rightZ * 0.36 + fwdZ * 0.12
    );
    const lookAtPos = new THREE.Vector3(
      refs.camera.position.x + fwdX * 18,
      refs.camera.position.y - 0.55,
      refs.camera.position.z + fwdZ * 18
    );
    refs.camera.lookAt(lookAtPos);

    if (dom.cockpitHud) {
      dom.cockpitHud.classList.remove('hidden');
      const kmh = Math.round(Math.abs(car.speed) * 3.6);
      if (dom.cockpitSpeed) dom.cockpitSpeed.textContent = `${kmh} KM/H`;
      if (dom.cockpitGear) {
        dom.cockpitGear.textContent =
          car.speed < -0.5 ? 'R' : car.speed < 0.5 ? 'N' : `D${Math.min(5, Math.max(1, Math.ceil(kmh / 28)))}`;
      }
    }
    return;
  }

  if (dom.cockpitHud) dom.cockpitHud.classList.add('hidden');

  // Modo 1ª Pessoa — A pé (altura dos olhos + arma visível no canto inferior direito)
  if (gameState.firstPerson && !gameState.drivingBoat) {
    setFirstPersonBodyVisibility(true);
    const pPos = refs.playerGroup.position;
    const eyeY = pPos.y + (gameState.isCrouching ? 1.12 : 1.72);
    refs.camera.position.set(pPos.x, eyeY, pPos.z);

    const yaw = gameState.cameraYaw;
    const pitch = THREE.MathUtils.clamp(gameState.cameraPitch, -0.85, 0.85);
    const lookX = -Math.sin(yaw) * Math.cos(pitch);
    const lookY = -Math.sin(pitch);
    const lookZ = -Math.cos(yaw) * Math.cos(pitch);
    refs.camera.lookAt(pPos.x + lookX * 10, eyeY + lookY * 10, pPos.z + lookZ * 10);

    refs.playerGroup.rotation.y = yaw + Math.PI;
    if (refs.playerParts?.shoulderR && refs.playerParts?.elbowR) {
      const recoilKick = (gameState.recoilTimer / 0.12) * 0.24;
      refs.playerParts.shoulderR.rotation.x = -1.32 - pitch * 0.65 - recoilKick;
      refs.playerParts.elbowR.rotation.x = -0.18;
    }
    return;
  }

  setFirstPersonBodyVisibility(false);

  const focusPos = gameState.drivingBoat
    ? gameState.drivingBoat.mesh.position
    : gameState.drivingCar
    ? gameState.drivingCar.mesh.position
    : refs.playerGroup.position;
  const target = new THREE.Vector3(
    focusPos.x,
    focusPos.y + (gameState.drivingBoat ? 1.5 : gameState.drivingCar ? 1.4 : gameState.isCrouching ? 1.05 : 1.55),
    focusPos.z
  );

  const dist = gameState.drivingBoat ? 9.0 : gameState.drivingCar ? 7.6 : 5.4;
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
    refs.camera.position.copy(target).addScaledVector(dir, safeDist);
  } else {
    refs.camera.position.copy(idealPos);
  }

  refs.camera.lookAt(target);
}

// ==========================================
// IA DOS GUARDAS, CÂMERAS ATIVAS E DETECÇÃO
// ==========================================
export function updateElectricBoxes(dt) {
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

export function updateSecurityCameras(dt, playerPos, playerCenter) {
  let camSpotted = false;

  securityCameras.forEach((camObj, idx) => {
    if (gameState.blackoutTimer > 0) {
      if (camObj.laserMesh) camObj.laserMesh.visible = false;
      return;
    }
    camObj.alertCooldown = Math.max(0, (camObj.alertCooldown || 0) - dt);
    if (camObj.disabledTimer > 0) {
      camObj.disabledTimer = Math.max(0, camObj.disabledTimer - dt);
      if (camObj.laserMesh) camObj.laserMesh.visible = false;
      if (camObj.disabledTimer === 0) {
        camObj.mesh.userData.normalMaterial.emissive.setHex(0x00ff88);
        if (camObj.laserMesh) camObj.laserMesh.visible = true;
      }
      return;
    }
    if (camObj.laserMesh) camObj.laserMesh.visible = true;

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

    // Detecção 3D idêntica ao cone visual: eixo inclinado para baixo (CAM_CONE_PITCH), vértice na lente
    const cosP = Math.cos(CAM_CONE_PITCH);
    const camAxis = new THREE.Vector3(Math.sin(yaw) * cosP, -Math.sin(CAM_CONE_PITCH), Math.cos(yaw) * cosP);
    const lensPos = camObj.pos.clone().addScaledVector(new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), 0.4);
    const toTarget = playerCenter.clone().sub(lensPos);
    const dist = toTarget.length();

    if (dist <= camObj.visionRange && dist > 0.2) {
      const angle = Math.acos(THREE.MathUtils.clamp(camAxis.dot(toTarget.normalize()), -1, 1));
      if (angle <= camObj.visionHalfAngle) {
        const rayDir = playerCenter.clone().sub(camObj.pos).normalize();
        raycaster.set(camObj.pos, rayDir);
        raycaster.far = Math.max(0.1, camObj.pos.distanceTo(playerCenter) - 0.3);
        const blocked = raycaster.intersectObjects(occluders, false);
        if (blocked.length === 0) {
          camSpotted = true;
          if (camObj.alertCooldown <= 0) {
            camObj.alertCooldown = 8.0;
            gameState.ctosRevealTimer = 4.0;
            if (dom.ctosRevealBanner) dom.ctosRevealBanner.classList.remove('hidden');
            addWantedLevel(1, 'PERSEGUIÇÃO');
          }
        }
      }
    }
  });

  return camSpotted;
}

export function updatePedestrians(dt) {
  const pPos = refs.playerGroup.position;
  pedestrians.forEach((ped) => {
    const pos = ped.mesh.position;

    if (ped.stunnedTimer > 0) {
      ped.stunnedTimer = Math.max(0, ped.stunnedTimer - dt);
      // Física de arremesso pós-atropelamento antes de assentar no asfalto
      if (ped.knockTimer > 0) {
        ped.knockTimer = Math.max(0, ped.knockTimer - dt);
        const kx = pos.x + (ped.knockVx || 0) * dt;
        const kz = pos.z + (ped.knockVz || 0) * dt;
        if (!checkCollision(kx, kz, 0.35) && !isWaterArea(kx, kz)) {
          pos.x = kx;
          pos.z = kz;
        }
        ped.knockVy = (ped.knockVy || 0) - 14.0 * dt;
        const groundY = getSurfaceHeight(pos.x, pos.z) + 0.2;
        pos.y = Math.max(groundY, pos.y + ped.knockVy * dt);
        ped.knockVx = (ped.knockVx || 0) * Math.max(0, 1 - dt * 3.5);
        ped.knockVz = (ped.knockVz || 0) * Math.max(0, 1 - dt * 3.5);
        if (ped.knockTimer === 0) pos.y = groundY;
      }
      if (ped.stunnedTimer === 0) {
        ped.mesh.rotation.x = 0;
        pos.y = getSurfaceHeight(pos.x, pos.z);
      }
      return;
    }

    // Testemunha ligando para a polícia (4.5s para intimidar chegando perto ou com Taser)
    if (ped.callingPolice) {
      ped.callTimer -= dt;
      if (ped.phoneIcon) {
        ped.phoneIcon.visible = Math.floor(ped.callTimer * 6) % 2 === 0;
      }
      ped.armR.rotation.x = -1.65;
      ped.armL.rotation.x = 0;
      ped.legL.rotation.x = 0;
      ped.legR.rotation.x = 0;

      // Intimidar chegando perto (< 2.8m)
      if (pos.distanceTo(pPos) < 2.8) {
        ped.callingPolice = false;
        if (ped.phoneIcon) ped.phoneIcon.visible = false;
        ped.panickedTimer = 6.5;
        if (gameState.wantedLevel === 0) {
          gameState.wantedStatus = 'OCULTO';
          updateWantedHUD();
        }
        return;
      }

      if (ped.callTimer <= 0) {
        ped.callingPolice = false;
        if (ped.phoneIcon) ped.phoneIcon.visible = false;
        ped.panickedTimer = 6.0;
        addWantedLevel(ped.crimeSeverity || 1, 'PERSEGUIÇÃO');
      }
      return;
    }

    // IA Urbana: detectar carro se aproximando (< 10m à frente) e mergulhar/correr lateralmente para a calçada
    if (!ped.dodgeTimer || ped.dodgeTimer <= 0) {
      for (const car of cars) {
        if (car.destroyed || Math.abs(car.speed) < 2.0) continue;
        const cPos = car.mesh.position;
        const dx = pos.x - cPos.x;
        const dz = pos.z - cPos.z;
        if (dx * dx + dz * dz > 110) continue;
        const moveSign = Math.sign(car.speed) || 1;
        const cfX = Math.sin(car.mesh.rotation.y) * moveSign;
        const cfZ = Math.cos(car.mesh.rotation.y) * moveSign;
        const crX = Math.cos(car.mesh.rotation.y);
        const crZ = -Math.sin(car.mesh.rotation.y);
        const proj = dx * cfX + dz * cfZ;
        const lat = dx * crX + dz * crZ;
        if (proj > 0.6 && proj < 10.0 && Math.abs(lat) < 2.8) {
          const side = lat >= 0 ? 1 : -1;
          ped.dodgeTimer = 1.3;
          ped.dodgeDirX = crX * side;
          ped.dodgeDirZ = crZ * side;
          break;
        }
      }
    }

    let moveX = 0;
    let moveZ = 0;
    let speed = ped.walkSpeed;
    let dodging = false;

    if (ped.dodgeTimer > 0) {
      ped.dodgeTimer = Math.max(0, ped.dodgeTimer - dt);
      moveX = ped.dodgeDirX || 1;
      moveZ = ped.dodgeDirZ || 0;
      speed = 6.2;
      dodging = true;
    } else if (ped.panickedTimer > 0) {
      ped.panickedTimer = Math.max(0, ped.panickedTimer - dt);
      moveX = ped.panicDirX;
      moveZ = ped.panicDirZ;
      speed = 5.2;
    } else {
      const [tx, tz] = ped.waypoints[ped.currentTarget];
      const dx = tx - pos.x;
      const dz = tz - pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 1.2) {
        ped.currentTarget = (ped.currentTarget + 1) % ped.waypoints.length;
      } else {
        moveX = dx / dist;
        moveZ = dz / dist;
        // Parar na faixa de pedestres se houver tráfego cruzando à frente
        const aheadX = pos.x + moveX * 2.6;
        const aheadZ = pos.z + moveZ * 2.6;
        for (const car of cars) {
          if (car.destroyed || Math.abs(car.speed) < 1.5) continue;
          const distAhead = Math.hypot(car.mesh.position.x - aheadX, car.mesh.position.z - aheadZ);
          if (distAhead < 6.5) {
            const cfX = Math.sin(car.mesh.rotation.y);
            const cfZ = Math.cos(car.mesh.rotation.y);
            if (Math.abs(cfX * moveX + cfZ * moveZ) < 0.75) {
              moveX = 0;
              moveZ = 0;
              ped.legL.rotation.x = 0;
              ped.legR.rotation.x = 0;
              ped.armL.rotation.x = 0;
              ped.armR.rotation.x = 0;
              break;
            }
          }
        }
      }
    }

    if (moveX !== 0 || moveZ !== 0) {
      const nx = pos.x + moveX * speed * dt;
      const nz = pos.z + moveZ * speed * dt;
      if (!checkCollision(nx, nz, 0.35) && !isWaterArea(nx, nz)) {
        pos.x = nx;
        pos.z = nz;
        pos.y = getSurfaceHeight(nx, nz);
      } else if (ped.panickedTimer > 0) {
        ped.panicDirX = -ped.panicDirX;
        ped.panicDirZ = -ped.panicDirZ;
      } else if (!dodging) {
        ped.currentTarget = (ped.currentTarget + 1) % ped.waypoints.length;
      }

      const targetYaw = Math.atan2(moveX, moveZ);
      let diff = targetYaw - ped.mesh.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      ped.mesh.rotation.y += diff * Math.min(1, dt * 8);

      const running = ped.panickedTimer > 0 || dodging;
      ped.phase += dt * (running ? 16 : 8.5);
      const swing = Math.sin(ped.phase) * (running ? 0.68 : 0.4);
      ped.legL.rotation.x = swing;
      ped.legR.rotation.x = -swing;
      ped.armL.rotation.x = running ? -2.1 + swing * 0.4 : -swing * 0.7;
      ped.armR.rotation.x = running ? -2.1 - swing * 0.4 : swing * 0.7;
    }
  });
}

export function updateGuards(dt) {
  if (gameState.policeSpawnCooldown > 0) {
    gameState.policeSpawnCooldown = Math.max(0, gameState.policeSpawnCooldown - dt);
  }
  if (gameState.blackoutCooldown > 0) {
    gameState.blackoutCooldown = Math.max(0, gameState.blackoutCooldown - dt);
  }
  if (gameState.blackoutTimer > 0) {
    gameState.blackoutTimer = Math.max(0, gameState.blackoutTimer - dt);
    if (gameState.blackoutTimer === 0) {
      if (lightPoles.length > 0 && lightPoles[0].headMesh?.material?.color) {
        lightPoles[0].headMesh.material.color.setHex(0x00f0ff);
      }
      if (refs.ambientLight && !gameState.netHackActive) {
        refs.ambientLight.intensity = BASE_AMBIENT_INTENSITY;
      }
    }
  }
  if (gameState.ctosRevealTimer > 0) {
    gameState.ctosRevealTimer = Math.max(0, gameState.ctosRevealTimer - dt);
    if (gameState.ctosRevealTimer === 0 && dom.ctosRevealBanner) {
      dom.ctosRevealBanner.classList.add('hidden');
    }
  }

  const playerPos = refs.playerGroup.position;
  const playerCenter = new THREE.Vector3(
    playerPos.x,
    playerPos.y + (gameState.isCrouching ? 0.58 : 1.05),
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
        g.mesh.position.y = getSurfaceHeight(g.mesh.position.x, g.mesh.position.z);
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
    const effectiveRange = (g.visionRange + rangeDelta) * (gameState.blackoutTimer > 0 ? 0.5 : 1.0);

    let guardSeesPlayer = false;
    const isContractGuard =
      g.isPolice || (gameState.mission !== MISSION_STATE.FREE_ROAM && g.missionKey === gameState.activeMissionKey);

    if (isContractGuard && distToPlayer <= effectiveRange && distToPlayer > 0.1) {
      const dirFlat = toPlayer.clone().normalize();
      const angle = Math.acos(THREE.MathUtils.clamp(guardForward.dot(dirFlat), -1, 1));
      if (angle <= g.visionHalfAngle) {
        const eyePos = new THREE.Vector3(g.mesh.position.x, g.mesh.position.y + 1.65, g.mesh.position.z);
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
      g.lastKnownPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
      g.lookAroundTimer = 0;
    } else if (isContractGuard && gameState.baseAlert) {
      g.state = GUARD_STATE.COMBAT;
      g.lastKnownPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
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
          const moveStep = g.speed * 1.2 * dt;
          const stepX = toTarget.x * moveStep;
          const stepZ = toTarget.z * moveStep;
          const gx = g.mesh.position.x;
          const gz = g.mesh.position.z;
          let moved = false;

          if (!checkCollision(gx + stepX, gz, 0.42) && !isWaterArea(gx + stepX, gz)) {
            g.mesh.position.x += stepX;
            moved = true;
          }
          if (!checkCollision(g.mesh.position.x, gz + stepZ, 0.42) && !isWaterArea(g.mesh.position.x, gz + stepZ)) {
            g.mesh.position.z += stepZ;
            moved = true;
          }
          // Vetor de desvio lateral caso bloqueado de frente por muro ou móvel
          if (!moved) {
            const sideSign = g.id % 2 === 0 ? 1 : -1;
            const sideX = -toTarget.z * sideSign * moveStep;
            const sideZ = toTarget.x * sideSign * moveStep;
            if (!checkCollision(gx + sideX, gz + sideZ, 0.42) && !isWaterArea(gx + sideX, gz + sideZ)) {
              g.mesh.position.x += sideX;
              g.mesh.position.z += sideZ;
            }
          }
          g.mesh.position.y = getSurfaceHeight(g.mesh.position.x, g.mesh.position.z);
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

  // Resfriamento do Nível de Procurado (15s fora da linha de visão da polícia zera wantedLevel)
  if (gameState.wantedLevel > 0) {
    if (spottedThisFrame) {
      gameState.wantedCooldown = 15.0;
      if (gameState.wantedStatus !== 'PERSEGUIÇÃO') {
        gameState.wantedStatus = 'PERSEGUIÇÃO';
        updateWantedHUD();
      }
    } else {
      gameState.wantedCooldown = Math.max(0, gameState.wantedCooldown - dt);
      if (gameState.wantedCooldown <= 0) {
        gameState.wantedLevel = 0;
        gameState.wantedStatus = 'OCULTO';
        updateWantedHUD();
        guards.forEach((g) => {
          if (g.isPolice && g.state === GUARD_STATE.COMBAT) {
            g.state = GUARD_STATE.PATROL;
          }
        });
      } else if (gameState.wantedStatus !== 'PROCURADO') {
        gameState.wantedStatus = 'PROCURADO';
        updateWantedHUD();
      }
    }
  }

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

export function updateInteractionsAndMission(dt) {
  // Animação de abertura dos portões destravados
  gates.forEach((g) => {
    if (g.unlocked && g.openProgress < 1) {
      g.openProgress = Math.min(1, g.openProgress + dt * 1.4);
      g.gateMesh.position.x = THREE.MathUtils.lerp(g.initialX, g.openX, g.openProgress);
    }
  });

  // Rotação do núcleo do servidor e pulso da zona de extração
  if (refs.serverCoreMesh) {
    refs.serverCoreMesh.rotation.y += dt * 1.6;
    refs.serverCoreMesh.rotation.x += dt * 0.9;
  }
  const pulse = 1 + Math.sin(gameState.elapsedTime * 4) * 0.08;
  if (refs.extractionRing) {
    refs.extractionRing.scale.set(pulse, pulse, 1);
    // Brilho pulsante via material (substitui a PointLight removida da zona de extração)
    if (refs.extractionRing.material) refs.extractionRing.material.opacity = 0.6 + (pulse - 0.92) * 2.5;
  }

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

  const isDrone = gameState.droneActive && !!refs.droneGroup;
  const pPos = refs.playerGroup.position;
  const activePos = isDrone ? refs.droneGroup.position : pPos;
  let promptText = '';

  if (gameState.markerCooldown > 0) {
    gameState.markerCooldown = Math.max(0, gameState.markerCooldown - dt);
  }

  // Verificar gatilhos de missão em FREE_ROAM (apenas a pé/carro)
  if (!isDrone && gameState.mission === MISSION_STATE.FREE_ROAM && !gameState.missionModalOpen && gameState.markerCooldown === 0) {
    for (const m of missionMarkers) {
      const distMarker = Math.hypot(pPos.x - m.pos.x, pPos.z - m.pos.z);
      if (distMarker < 2.8) {
        openMissionModal(m.key);
        return;
      }
    }
  }

  // Checar lojas interativas (apenas a pé)
  if (gameState.shopCooldown > 0) {
    gameState.shopCooldown = Math.max(0, gameState.shopCooldown - dt);
  }
  if (!isDrone && !gameState.drivingCar && !gameState.drivingBoat && !gameState.shopOpen && gameState.activeCamIndex < 0) {
    let minStoreDist = Infinity;
    for (const st of stores) {
      const dStore = Math.hypot(pPos.x - st.pos.x, pPos.z - st.pos.z);
      if (dStore < minStoreDist) minStoreDist = dStore;
      if (dStore < 2.2 && gameState.shopCooldown <= 0 && !gameState.shopMustExitRing) {
        openShopModal(st.type);
        return;
      }
      if (!promptText && dStore < 3.6) {
        promptText = `[E] ACESSAR ${st.name}`;
      }
    }
    if (minStoreDist > 3.2) {
      gameState.shopMustExitRing = false;
    }
  }

  // Prompt de caixas de suprimentos nos prédios abertos (apenas a pé)
  if (!isDrone && !promptText && gameState.activeCamIndex < 0) {
    for (const sb of supplyBoxes) {
      if (!sb.used && pPos.distanceTo(sb.pos) < 3.0) {
        promptText =
          sb.rewardType === 'MONEY'
            ? '[E] COLETAR SUPRIMENTOS (+$100)'
            : '[E] USAR KIT MÉDICO (+25 HP)';
        break;
      }
    }
  }

  // Prompt dos painéis de portão (a pé ou remotamente pelo Drone)
  const gateLimit = isDrone ? 18.0 : 3.6;
  for (let i = 0; i < gates.length; i++) {
    const g = gates[i];
    if (!g.unlocked && activePos.distanceTo(g.panelMesh.position) < gateLimit) {
      promptText = `[E] HACKEAR PAINEL DO PORTÃO ${gates.length > 1 ? i + 1 : ''}`.trim();
      break;
    }
  }

  // Prompt dos terminais das celas de resgate + animação dos prisioneiros libertados correndo
  for (const cell of rescueCells) {
    if (!cell.freed && !promptText && activePos.distanceTo(cell.panelMesh.position) < gateLimit) {
      promptText = '[E] HACKEAR TERMINAL DA CELA (LIBERTAR PRISIONEIRO)';
    }
    if (cell.prisonerRunning && cell.prisoner) {
      cell.prisonerRunTimer = Math.max(0, cell.prisonerRunTimer - dt);
      const [edx, edz] = cell.escapeDir || [0, 1];
      const nx = cell.prisoner.position.x + edx * 6.4 * dt;
      const nz = cell.prisoner.position.z + edz * 6.4 * dt;
      if (!isWaterArea(nx, nz)) {
        cell.prisoner.position.x = nx;
        cell.prisoner.position.z = nz;
        cell.prisoner.position.y = getSurfaceHeight(nx, nz);
      }
      cell.prisoner.rotation.y = Math.atan2(edx, edz);
      cell.prisonerPhase += dt * 16;
      const sw = Math.sin(cell.prisonerPhase) * 0.65;
      cell.pLegL.rotation.x = sw;
      cell.pLegR.rotation.x = -sw;
      cell.pArmL.rotation.x = -sw * 0.8;
      cell.pArmR.rotation.x = sw * 0.8;
      if (cell.prisonerRunTimer === 0) {
        cell.prisonerRunning = false;
        cell.prisoner.visible = false;
      }
    }
  }

  // Prompt do carro DedSec ou lancha navegável (oculto no modo Drone)
  if (!isDrone && !promptText && gameState.activeCamIndex < 0) {
    if (gameState.drivingBoat) {
      promptText = '[F] DESEMBARCAR DA LANCHA';
    } else if (gameState.drivingCar) {
      promptText = '[F] SAIR DO CARRO DEDSEC';
    } else {
      for (const boat of boats) {
        const dH = Math.hypot(pPos.x - boat.mesh.position.x, pPos.z - boat.mesh.position.z);
        if (dH < 5.8) {
          promptText = '[F] PILOTAR LANCHA DEDSEC';
          break;
        }
      }
      if (!promptText) {
        for (const car of cars) {
          if (car.isDrivable && !car.destroyed && Math.abs(car.speed) < 6.0 && pPos.distanceTo(car.mesh.position) < 4.2) {
            promptText = isCarLockedByGate(car)
              ? '[BLOQUEADO] HACKEIE O PORTÃO DO COMPLEXO PRIMEIRO [E]'
              : car === gameState.targetCar
              ? '[F] ROUBAR VEÍCULO ALVO'
              : car.hasDriver
              ? '[F] ROUBAR VEÍCULO (EJETAR MOTORISTA)'
              : car.isDedsec
              ? '[F] ENTRAR NO CARRO DEDSEC'
              : '[F] ENTRAR NO VEÍCULO';
            break;
          }
        }
      }
    }
  }

  // Prompt de Profiler ctOS em pedestres (Visão NetHack) e caixas elétricas
  if (!promptText && gameState.activeCamIndex < 0) {
    const camDir = new THREE.Vector3();
    refs.camera.getWorldDirection(camDir);

    if (gameState.netHackActive) {
      for (const sp of steamPipes) {
        if (sp.cooldown > 0 || sp.activeTimer > 0) continue;
        const distSp = activePos.distanceTo(sp.pos);
        const toSp = sp.pos.clone().add(new THREE.Vector3(0, 0.5, 0)).sub(refs.camera.position).normalize();
        if ((distSp < 42 && camDir.dot(toSp) > 0.86) || (gameState.drivingCar && distSp < 14)) {
          promptText = '[E] DETONAR TUBULAÇÃO DE VAPOR (IMOBILIZAR VIATURAS)';
          break;
        }
      }
    }

    if (!promptText && gameState.netHackActive) {
      for (const tl of trafficLights) {
        if (tl.hackedTimer > 0) continue;
        const distTl = activePos.distanceTo(tl.pos);
        const toTl = tl.pos.clone().add(new THREE.Vector3(0, 4.8, 0)).sub(refs.camera.position).normalize();
        if (distTl < 36 && camDir.dot(toTl) > 0.88) {
          promptText = '[E] HACKEAR SEMÁFORO (CAOS NO TRÁFEGO)';
          break;
        }
      }
    }

    if (!promptText && gameState.netHackActive) {
      for (const camObj of securityCameras) {
        if (camObj.disabledTimer > 0) continue;
        const distCam = activePos.distanceTo(camObj.pos);
        const toCam = camObj.pos.clone().sub(refs.camera.position).normalize();
        if (distCam < 26 && camDir.dot(toCam) > 0.90) {
          promptText = `[E] DESATIVAR CÂMERA (15s) // ${camObj.name}`;
          break;
        }
      }
    }

    if (!promptText && gameState.netHackActive) {
      for (const ped of pedestrians) {
        const distPed = activePos.distanceTo(ped.mesh.position);
        const toPed = ped.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0)).sub(refs.camera.position).normalize();
        if (distPed < 22 && camDir.dot(toPed) > 0.91) {
          promptText = ped.profile.hacked
            ? `PROFILER: ${ped.profile.name} (${ped.profile.job}) — CONTA HACKEADA`
            : `[E] PROFILER: ${ped.profile.name} (${ped.profile.job}) — HACKEAR CONTA (+$75)`;
          break;
        }
      }
    }

    if (!promptText) {
      for (const box of electricBoxes) {
      const distBox = activePos.distanceTo(box.mesh.position);
      const toBox = box.mesh.position.clone().sub(refs.camera.position).normalize();
      const lookingInNetHack = gameState.netHackActive && distBox < 28 && camDir.dot(toBox) > 0.90;
      if ((!isDrone && distBox < 3.6) || lookingInNetHack) {
        promptText =
          box.cooldown > 0
            ? `CAIXA ELÉTRICA EM RECARGA (${Math.ceil(box.cooldown)}s)`
            : '[E] SOBRECARREGAR CAIXA ELÉTRICA (DISTRAÇÃO)';
        break;
      }
    }
    }
  }

  // Firewall e Download dos dados no Servidor Central (apenas corpo do agente)
  if (!isDrone && gameState.mission === MISSION_STATE.STEAL_DATA) {
    const distServer = pPos.distanceTo(refs.serverMesh.position);
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
          refs.serverMesh.userData.normalMaterial.emissive.setHex(0x00ff88);
          triggerBaseAlert();
          addWantedLevel(2, 'PERSEGUIÇÃO');
          setMissionState(MISSION_STATE.ESCAPE);
        }
      }
    } else {
      dom.downloadContainer.classList.add('hidden');
    }
  }

  // Verificar entrega de veículo VIP / Contrato no ponto de entrega correspondente
  if (
    gameState.mission === MISSION_STATE.STEAL_CAR &&
    gameState.targetCar &&
    !gameState.targetCar.destroyed &&
    gameState.targetCar.hp > 0 &&
    gameState.drivingCar === gameState.targetCar
  ) {
    const activeCfg = MAPS_CONFIG[gameState.activeMissionKey];
    const dest = activeCfg?.extractPos || [-120, 0.06, 320];
    const distDelivery = Math.hypot(
      gameState.targetCar.mesh.position.x - dest[0],
      gameState.targetCar.mesh.position.z - dest[2]
    );
    if (distDelivery < 6.5) {
      triggerVictory();
      return;
    }
  }

  // Verificar chegada na Zona de Extração
  if (gameState.mission === MISSION_STATE.ESCAPE) {
    const distExtract = Math.hypot(
      pPos.x - refs.extractionZoneGroup.position.x,
      pPos.z - refs.extractionZoneGroup.position.z
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
