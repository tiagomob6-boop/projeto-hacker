import * as THREE from 'three';
import {
  MISSION_STATE,
  GUARD_STATE,
  WORLD_BOUNDS,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  PLAYER_SPRINT_SPEED,
  PLAYER_CROUCH_SPEED,
  DOWNLOAD_DURATION,
  CAMERA_OVERLOAD_DURATION,
  ELECTRIC_COOLDOWN,
  ELECTRIC_INVESTIGATE_TIME,
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
  boats,
  missionMarkers,
  getSurfaceHeight,
  createHackableDevice,
  isWaterArea,
  checkCollision
} from './state.js';
import { AudioManager } from './audio.js';
import {
  openTerminal,
  closeGateTerminal,
  setMissionState,
  openMissionModal,
  triggerGameOver,
  triggerVictory,
  updateVehicleHpHUD
} from './ui.js';
import {
  stunGuard,
  triggerBaseAlert,
  fireGuardBullet
} from './combat.js';

export function buildPlayer() {
  refs.playerGroup = new THREE.Group();
  refs.playerGroup.position.set(0, 0, 52);

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

  refs.playerParts = {
    upperBody,
    headGroup,
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
    walkPhase: 0,
    crouchBlend: 0,
    moveBlend: 0,
    aimBlend: 0,
    aimTimer: 0
  };

  refs.playerGroup.add(legLeft.hip, legRight.hip, upperBody);
  refs.scene.add(refs.playerGroup);
}

// ==========================================
// CÂMERAS DE SEGURANÇA HACKEÁVEIS
// ==========================================
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
    refs.worldGroup.add(mesh);

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

export function handleInteractPress() {
  // Se já está em uma câmera, E também pode sair
  if (gameState.activeCamIndex >= 0) {
    cycleSecurityCamera(-1);
    return;
  }

  const pPos = refs.playerGroup.position;

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
    pPos.distanceTo(refs.serverMesh.position) < 3.8
  ) {
    openTerminal('FIREWALL');
    return;
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

  // 3b. Checar carros estacionados hackeáveis na Visão NetHack (V)
  if (gameState.netHackActive) {
    for (const car of cars) {
      if (car.isDedsec || car.hackedUsed) continue;
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

  // 4. Checar se o jogador está olhando/próximo a uma câmera de segurança
  for (let i = 0; i < securityCameras.length; i++) {
    const camObj = securityCameras[i];
    if (camObj.disabledTimer > 0) continue;
    if (pPos.distanceTo(camObj.pos) < 12) {
      const toSecurityCam = camObj.pos.clone().sub(refs.camera.position).normalize();
      if (camDir.dot(toSecurityCam) > 0.92) {
        cycleSecurityCamera(i);
        return;
      }
    }
  }
}

export function toggleDriveDedsecCar() {
  if (gameState.terminalOpen || gameState.missionModalOpen || gameState.activeCamIndex >= 0) return;

  // Desembarcar do barco em terra firme ou píer próximo
  if (gameState.drivingBoat) {
    const boat = gameState.drivingBoat;
    const bPos = boat.mesh.position;
    let landX = null;
    let landZ = null;

    if (bPos.x < 120 && Math.hypot(bPos.x - 72, bPos.z - 62) < 14) {
      landX = 68;
      landZ = 62;
    } else if (bPos.x > 340 && Math.hypot(bPos.x - 398, bPos.z - 62) < 14) {
      landX = 402;
      landZ = 62;
    } else if (bPos.x < 95) {
      landX = 64;
      landZ = THREE.MathUtils.clamp(bPos.z, -80, 85);
    } else if (bPos.x > 375) {
      landX = 406;
      landZ = THREE.MathUtils.clamp(bPos.z, -20, 80);
    } else {
      // No meio da baía: move o desembarque para o píer mais próximo
      const toWest = Math.hypot(bPos.x - 72, bPos.z - 62);
      const toEast = Math.hypot(bPos.x - 398, bPos.z - 62);
      landX = toWest <= toEast ? 68 : 402;
      landZ = 62;
    }

    gameState.drivingBoat = null;
    boat.speed = 0;
    if (boat.wakePoints) boat.wakePoints.visible = false;
    AudioManager.stopEngineSound();
    refs.playerGroup.position.set(landX, getSurfaceHeight(landX, landZ), landZ);
    refs.playerGroup.visible = true;
    return;
  }

  if (gameState.drivingCar) {
    const car = gameState.drivingCar;
    gameState.drivingCar = null;
    car.speed = 0;
    if (car.headlight) car.headlight.intensity = 0;
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

  // Verificar embarque em lancha DedSec
  for (const boat of boats) {
    if (refs.playerGroup.position.distanceTo(boat.mesh.position) < 5.2) {
      gameState.drivingBoat = boat;
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
    if (!car.isDrivable || car.destroyed) continue;
    const d = refs.playerGroup.position.distanceTo(car.mesh.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearestCar = car;
    }
  }

  if (nearestCar) {
    gameState.drivingCar = nearestCar;
    gameState.isCrouching = false;
    gameState.isSprinting = false;
    refs.playerGroup.visible = false;
    if (nearestCar.headlight) nearestCar.headlight.intensity = 2.4;
    if (!gameState.netHackActive) dom.statusMode.textContent = 'VEÍCULO';
    updateVehicleHpHUD();
    if (nearestCar === gameState.targetCar && gameState.mission === MISSION_STATE.STEAL_CAR) {
      triggerBaseAlert();
    }
  }
}

// ==========================================
// MOVIMENTAÇÃO, COLISÃO, CARROS E CÂMERA
// ==========================================
export function updateCars(dt) {
  cars.forEach((car) => {
    // Fumaça escura quando integridade <= 35%
    if (car.smokePoints) {
      if (car.hp <= 35) {
        car.smokePoints.visible = true;
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

    if (car.isDrivable || car.destroyed || car.hackedTimer <= 0) return;

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

export function updatePlayer(dt) {
  if (gameState.terminalOpen || gameState.activeCamIndex >= 0) return;

  // Pulsação do LED da mochila hacker
  if (refs.playerParts.backpackLed) {
    const pulseOn = Math.sin(gameState.elapsedTime * 5) > -0.2;
    refs.playerParts.backpackLed.material.color.setHex(
      gameState.isCrouching ? 0xffaa00 : pulseOn ? 0x00ff88 : 0x004433
    );
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

    if (isWaterArea(nextX, nextZ)) {
      boat.mesh.position.x = nextX;
      boat.mesh.position.z = nextZ;
    } else {
      boat.speed *= -0.2;
    }

    boat.mesh.position.y = -0.32 + Math.sin(gameState.elapsedTime * 3.0 + boat.id) * 0.05;
    refs.playerGroup.position.copy(boat.mesh.position);

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
            attr.setXYZ(i, sternX + (Math.random() - 0.5) * 1.2, -0.35, sternZ + (Math.random() - 0.5) * 1.2);
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
    refs.playerGroup.position.copy(cPos);

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
    const pos = refs.playerGroup.position;
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

  // Animações esqueléticas fluidas (caminhada, corrida, agachamento real nos joelhos/tronco e mira)
  const p = refs.playerParts;
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
  p.hipL.rotation.x = legSwingL - 0.68 * p.crouchBlend;
  p.hipR.rotation.x = legSwingR - 0.68 * p.crouchBlend;
  p.kneeL.rotation.x = 1.28 * p.crouchBlend + Math.max(0, -sinW) * 0.58 * p.moveBlend;
  p.kneeR.rotation.x = 1.28 * p.crouchBlend + Math.max(0, sinW) * 0.58 * p.moveBlend;

  // Braço esquerdo (balanço natural)
  p.shoulderL.rotation.x = -legSwingL * 0.85 - 0.12 * p.crouchBlend;
  p.elbowL.rotation.x = -0.28 - (gameState.isSprinting ? 0.55 * p.moveBlend : 0);

  // Braço direito (postura tática baixa ao caminhar -> ergue reto na mira ao disparar)
  const walkShoulderR = -legSwingR * 0.75 - 0.18;
  const walkElbowR = -0.45 - (gameState.isSprinting ? 0.45 * p.moveBlend : 0);
  const aimShoulderR = -1.38;
  const aimElbowR = -0.16;
  p.shoulderR.rotation.x = THREE.MathUtils.lerp(walkShoulderR, aimShoulderR, p.aimBlend);
  p.elbowR.rotation.x = THREE.MathUtils.lerp(walkElbowR, aimElbowR, p.aimBlend);
}

export function updateCamera() {
  if (gameState.activeCamIndex >= 0) {
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

export function updateGuards(dt) {
  const playerPos = refs.playerGroup.position;
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

export function updateInteractionsAndMission(dt) {
  // Animação de abertura dos portões destravados
  gates.forEach((g) => {
    if (g.unlocked && g.openProgress < 1) {
      g.openProgress = Math.min(1, g.openProgress + dt * 1.4);
      g.gateMesh.position.x = THREE.MathUtils.lerp(g.initialX, g.openX, g.openProgress);
    }
  });

  // Rotação do núcleo do servidor e pulso da zona de extração
  refs.serverCoreMesh.rotation.y += dt * 1.6;
  refs.serverCoreMesh.rotation.x += dt * 0.9;
  const pulse = 1 + Math.sin(gameState.elapsedTime * 4) * 0.08;
  refs.extractionRing.scale.set(pulse, pulse, 1);

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

  const pPos = refs.playerGroup.position;
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

  // Prompt do carro DedSec ou lancha navegável
  if (!promptText && gameState.activeCamIndex < 0) {
    if (gameState.drivingBoat) {
      promptText = '[F] DESEMBARCAR DA LANCHA';
    } else if (gameState.drivingCar) {
      promptText = '[F] SAIR DO CARRO DEDSEC';
    } else {
      for (const boat of boats) {
        if (pPos.distanceTo(boat.mesh.position) < 5.2) {
          promptText = '[F] PILOTAR LANCHA DEDSEC';
          break;
        }
      }
      if (!promptText) {
        for (const car of cars) {
          if (car.isDrivable && !car.destroyed && pPos.distanceTo(car.mesh.position) < 4.2) {
            promptText =
              car === gameState.targetCar
                ? '[F] ROUBAR VEÍCULO VIP'
                : car.isDedsec
                ? '[F] ENTRAR NO CARRO DEDSEC'
                : '[F] ENTRAR NO VEÍCULO';
            break;
          }
        }
      }
    }
  }

  // Prompt de caixas elétricas (perto ou mirando na Visão NetHack)
  if (!promptText && gameState.activeCamIndex < 0) {
    const camDir = new THREE.Vector3();
    refs.camera.getWorldDirection(camDir);
    for (const box of electricBoxes) {
      const distBox = pPos.distanceTo(box.mesh.position);
      const toBox = box.mesh.position.clone().sub(refs.camera.position).normalize();
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
          setMissionState(MISSION_STATE.ESCAPE);
        }
      }
    } else {
      dom.downloadContainer.classList.add('hidden');
    }
  }

  // Verificar entrega de veículo VIP na Garagem Clandestina DedSec (-120, 320)
  if (
    gameState.mission === MISSION_STATE.STEAL_CAR &&
    gameState.targetCar &&
    !gameState.targetCar.destroyed &&
    gameState.drivingCar === gameState.targetCar
  ) {
    const distDelivery = Math.hypot(
      gameState.targetCar.mesh.position.x - -120,
      gameState.targetCar.mesh.position.z - 320
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
