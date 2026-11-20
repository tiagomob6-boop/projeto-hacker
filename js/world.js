import * as THREE from 'three';
import {
  MISSION_STATE,
  GUARD_STATE,
  WEAPON_TYPE,
  DOCKS_OFFSET_X,
  MAPS_CONFIG,
  BASE_AMBIENT_INTENSITY,
  DIFFICULTY_PRESETS,
  dom,
  refs,
  gameState,
  colliders,
  occluders,
  structureMeshes,
  hackableMeshes,
  securityCameras,
  guards,
  electricBoxes,
  radarCrates,
  radarBuildings,
  radarWalls,
  gates,
  cars,
  boats,
  projectiles,
  guardProjectiles,
  empWaves,
  impactFlashes,
  blinkingLights,
  sirenLights,
  missionMarkers,
  missionServers,
  missionExtractions,
  serverParticleData,
  getSurfaceHeight,
  createHackableDevice
} from './state.js';
import { AudioManager } from './audio.js';
import {
  buildNetHackLabels,
  toggleNetHack,
  setMissionState,
  updateHpHUD,
  updateVehicleHpHUD
} from './ui.js';
import { selectWeapon } from './combat.js';
import {
  buildPlayer,
  buildSecurityCameras,
  buildElectricBoxes,
  buildGuards,
  cycleSecurityCamera
} from './entities.js';

export const TextureGenerator = {
  cache: {},

  _makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  },

  getAsphaltTexture(repX = 20, repY = 22) {
    if (!this.cache.asphalt) {
      const c = this._makeCanvas(256, 256);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#141926';
      ctx.fillRect(0, 0, 256, 256);

      // Granulado e desgaste do asfalto
      for (let i = 0; i < 4200; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const v = 16 + Math.floor(Math.random() * 24);
        ctx.fillStyle = `rgb(${v}, ${v + 4}, ${v + 12})`;
        ctx.fillRect(x, y, 2, 2);
      }

      // Faixas viárias sutis e marcas de tráfego
      ctx.fillStyle = 'rgba(58, 86, 130, 0.38)';
      ctx.fillRect(124, 16, 8, 96);
      ctx.fillRect(124, 144, 8, 96);

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      this.cache.asphalt = tex;
    }
    const clone = this.cache.asphalt.clone();
    clone.needsUpdate = true;
    clone.repeat.set(repX, repY);
    return clone;
  },

  getBuildingFacadeTexture(repX = 2, repY = 3) {
    if (!this.cache.building) {
      const c = this._makeCanvas(256, 256);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#111726';
      ctx.fillRect(0, 0, 256, 256);

      // Colunas estruturais verticais
      ctx.fillStyle = '#1b2438';
      for (let x = 0; x < 256; x += 32) {
        ctx.fillRect(x, 0, 6, 256);
      }

      // Dezenas de janelas iluminadas (ciano, âmbar e branco-azulado)
      const palette = ['#00f0ff', '#ffaa33', '#d8f3ff', '#162238', '#162238'];
      for (let y = 10; y < 250; y += 24) {
        ctx.fillStyle = '#1e2940';
        ctx.fillRect(0, y - 4, 256, 4);
        for (let x = 10; x < 250; x += 32) {
          const pick = palette[Math.floor(Math.random() * palette.length)];
          ctx.fillStyle = pick;
          ctx.globalAlpha = pick === '#162238' ? 0.9 : 0.78;
          ctx.fillRect(x, y, 16, 14);
        }
      }
      ctx.globalAlpha = 1;

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      this.cache.building = tex;
    }
    const clone = this.cache.building.clone();
    clone.needsUpdate = true;
    clone.repeat.set(repX, repY);
    return clone;
  },

  getContainerTexture(repX = 2, repY = 1) {
    if (!this.cache.container) {
      const c = this._makeCanvas(256, 128);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#9aa8bd';
      ctx.fillRect(0, 0, 256, 128);

      // Corrugação metálica vertical
      for (let x = 0; x < 256; x += 12) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(x, 6, 5, 116);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.fillRect(x + 5, 6, 3, 116);
      }
      // Moldura reforçada superior e inferior
      ctx.fillStyle = 'rgba(15, 20, 32, 0.45)';
      ctx.fillRect(0, 0, 256, 8);
      ctx.fillRect(0, 120, 256, 8);

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      this.cache.container = tex;
    }
    const clone = this.cache.container.clone();
    clone.needsUpdate = true;
    clone.repeat.set(repX, repY);
    return clone;
  },

  getWaterTexture() {
    if (!this.cache.water) {
      const c = this._makeCanvas(256, 256);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#051a30';
      ctx.fillRect(0, 0, 256, 256);

      // Ondas e reflexos sutis
      for (let y = 0; y < 256; y += 16) {
        ctx.fillStyle = 'rgba(0, 175, 255, 0.12)';
        ctx.beginPath();
        ctx.ellipse((y * 7) % 256, y, 42, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 90, 160, 0.07)';
        ctx.beginPath();
        ctx.ellipse((y * 13 + 80) % 256, y + 6, 28, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(42, 42);
      this.cache.water = tex;
    }
    return this.cache.water;
  },

  getSunsetSkyTexture() {
    if (!this.cache.sky) {
      const c = this._makeCanvas(512, 512);
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, '#070b22');
      grad.addColorStop(0.32, '#241242');
      grad.addColorStop(0.52, '#691f5b');
      grad.addColorStop(0.68, '#d95829');
      grad.addColorStop(0.78, '#281538');
      grad.addColorStop(1.0, '#090d1c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Estrelas sutis na parte superior do céu noturno
      for (let i = 0; i < 140; i++) {
        const sx = Math.random() * 512;
        const sy = Math.random() * 190;
        const alpha = 0.25 + Math.random() * 0.65;
        ctx.fillStyle = `rgba(220, 240, 255, ${alpha})`;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      this.cache.sky = new THREE.CanvasTexture(c);
    }
    return this.cache.sky;
  }
};

// ==========================================
// ÁUDIO PROCEDURAL (100% WEB AUDIO API)

export function initThree() {
  refs.scene = new THREE.Scene();
  refs.scene.background = new THREE.Color(0x1c1430);
  refs.scene.fog = new THREE.FogExp2(0x1c1430, 0.00085);

  refs.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 2400);

  refs.renderer = new THREE.WebGLRenderer({ canvas: dom.canvas, antialias: true });
  refs.renderer.setSize(window.innerWidth, window.innerHeight);
  refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  refs.renderer.shadowMap.enabled = true;
  refs.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  refs.clock = new THREE.Clock();
  refs.worldGroup = new THREE.Group();
  refs.scene.add(refs.worldGroup);

  // Cúpula de céu de entardecer cyberpunk de São Francisco
  refs.skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(2000, 32, 20),
    new THREE.MeshBasicMaterial({
      map: TextureGenerator.getSunsetSkyTexture(),
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    })
  );
  refs.scene.add(refs.skyDome);

  setupLighting();
  buildPlayer();
  buildMap(gameState.selectedMap);

  window.addEventListener('resize', onWindowResize);
}

export function buildMap() {
  while (refs.worldGroup.children.length > 0) {
    refs.worldGroup.remove(refs.worldGroup.children[0]);
  }

  colliders.length = 0;
  occluders.length = 0;
  structureMeshes.length = 0;
  hackableMeshes.length = 0;
  securityCameras.length = 0;
  electricBoxes.length = 0;
  guards.length = 0;
  cars.length = 0;
  boats.length = 0;
  gates.length = 0;
  radarCrates.length = 0;
  radarBuildings.length = 0;
  radarWalls.length = 0;
  serverParticleData.length = 0;
  blinkingLights.length = 0;
  sirenLights.length = 0;
  missionMarkers.length = 0;
  refs.waterMesh = null;
  refs.dedsecCar = null;

  // Água da Baía de São Francisco cobrindo todo o mundo aberto 50x (WORLD_BOUNDS: -30000..30000)
  refs.waterTexture = TextureGenerator.getWaterTexture();
  refs.waterTexture.repeat.set(900, 900);
  const bayWaterMat = new THREE.MeshStandardMaterial({
    color: 0x0b3a66,
    map: refs.waterTexture,
    emissive: 0x06294a,
    emissiveMap: refs.waterTexture,
    emissiveIntensity: 0.85,
    roughness: 0.14,
    metalness: 0.82
  });
  refs.waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), bayWaterMat);
  refs.waterMesh.rotation.x = -Math.PI / 2;
  refs.waterMesh.position.set(0, -0.55, 0);
  refs.worldGroup.add(refs.waterMesh);

  // Setor 1: Distrito Downtown & Financial + Complexo ctOS
  buildEnvironment(MAPS_CONFIG.COMPLEXO_CTOS);

  // Setor 2: Baía de São Francisco & Ponte Golden Gate Atravessável
  buildTraversableGoldenGate();

  // Setor 3: Distrito Portuário & Industrial (Docas da Baía SF + Terminal Marítimo Leste)
  buildDocksEnvironment(MAPS_CONFIG.DOCAS_BAIA_SF);

  // Setor 4: Distrito Residencial & Colinas Sul + Ponte Sul
  buildSouthDistrictAndBridge();

  // Elementos repetitivos otimizados via THREE.InstancedMesh (60 FPS)
  buildInstancedWorldElements();

  // Marcadores Holográficos de Missão no Mapa
  buildMissionMarkers();

  // Veículos e Barcos do Mundo Aberto
  buildCars();
  buildBoatPiersAndBoats();

  // Câmeras, Caixas Elétricas e Guardas das missões e contratos VIP
  ['COMPLEXO_CTOS', 'DOCAS_BAIA_SF', 'VIP_CAR_01', 'VIP_CAR_02'].forEach((mKey) => {
    const mCfg = MAPS_CONFIG[mKey];
    buildSecurityCameras(mCfg, mKey);
    buildElectricBoxes(mCfg);
    buildGuards(mCfg, mKey);
  });

  buildNetworkLines();
  buildNetHackLabels();
}

export function buildSouthDistrictAndBridge() {
  const asphaltTex = TextureGenerator.getAsphaltTexture(40, 45);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: asphaltTex, roughness: 0.88 });

  // Expansão do solo de Downtown Norte/Oeste (X: -540..80, Z: -480..120)
  const downtownExt = new THREE.Mesh(new THREE.PlaneGeometry(620, 600), roadMat);
  downtownExt.rotation.x = -Math.PI / 2;
  downtownExt.position.set(-230, -0.02, -180);
  downtownExt.receiveShadow = true;
  refs.worldGroup.add(downtownExt);

  // Distrito Residencial & Colinas Sul (X: -540..80, Z: 120..780)
  const southGround = new THREE.Mesh(new THREE.PlaneGeometry(620, 660), roadMat);
  southGround.rotation.x = -Math.PI / 2;
  southGround.position.set(-230, -0.01, 450);
  southGround.receiveShadow = true;
  refs.worldGroup.add(southGround);

  // Extensão do Distrito Portuário & Industrial Leste (X: 400..960, Z: -280..360)
  const eastExt = new THREE.Mesh(new THREE.PlaneGeometry(560, 640), roadMat);
  eastExt.rotation.x = -Math.PI / 2;
  eastExt.position.set(680, -0.02, 40);
  eastExt.receiveShadow = true;
  refs.worldGroup.add(eastExt);

  // Ponte Sul conectando Distrito Residencial (X=80) ao Portuário (X=400) em Z = 320
  const zS = 320;
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x161e2e, roughness: 0.85 });
  const mainDeck = new THREE.Mesh(new THREE.BoxGeometry(240, 0.8, 16), deckMat);
  mainDeck.position.set(240, 6.6, zS);
  refs.worldGroup.add(mainDeck);

  const rampLen = Math.hypot(40, 7);
  const rampAng = Math.atan2(7, 40);
  const rampW = new THREE.Mesh(new THREE.BoxGeometry(rampLen, 0.8, 16), deckMat);
  rampW.position.set(100, 3.1, zS);
  rampW.rotation.z = rampAng;
  const rampE = new THREE.Mesh(new THREE.BoxGeometry(rampLen, 0.8, 16), deckMat);
  rampE.position.set(380, 3.1, zS);
  rampE.rotation.z = -rampAng;
  refs.worldGroup.add(rampW, rampE);

  addStaticBox(240, 1.1, 0.6, 240, 7.55, zS - 8.3, 0x26314a, { occlude: false, edgesColor: 0x00f0ff, edgesOpacity: 0.65 });
  addStaticBox(240, 1.1, 0.6, 240, 7.55, zS + 8.3, 0x26314a, { occlude: false, edgesColor: 0x00f0ff, edgesOpacity: 0.65 });

  // Garagem Clandestina DedSec no Distrito Sul (X: -120, Z: 320)
  addStaticBox(26, 0.4, 22, -120, 4.8, 320, 0x141d2e, { collide: false, occlude: false, edgesColor: 0x00ff88, edgesOpacity: 0.8 });
  [[-132, 310], [-108, 310], [-132, 330], [-108, 330]].forEach(([px, pz]) => {
    addStaticBox(0.8, 4.8, 0.8, px, 2.4, pz, 0x24324c, { occlude: false });
  });
  addStaticBox(14, 0.4, 0.3, -120, 4.2, 309, 0x00ff88, { collide: false, occlude: false, emissive: 0x00ff88, emissiveIntensity: 1.4 });

  // Quarteirões variados de Downtown & Financial e Residencial Sul + Galpões Industriais Leste
  [
    [-110, -40, 22, 32, 20, 0x00f0ff],
    [-160, 20, 24, 38, 22, 0xff0055],
    [-110, 180, 20, 24, 18, 0x38bdf8],
    [-180, 260, 22, 22, 20, 0xffaa00],
    [-80, 420, 24, 18, 22, 0x00ff88],
    [-180, 460, 22, 20, 20, 0xff0055],
    [560, -40, 26, 16, 24, 0xffaa00],
    [620, 120, 28, 18, 26, 0x00f0ff],
    [560, 240, 24, 15, 22, 0xff0055]
  ].forEach(([bx, bz, bw, bh, bd, acc]) => {
    buildDetailedBuilding(bx, bz, bw, bh, bd, { accent: acc });
  });

  // Colinas estilizadas ao sul do Distrito Residencial
  [[-260, 660, 140, 28, 90], [-60, 690, 160, 36, 100], [10, 640, 110, 22, 80]].forEach(([hx, hz, hw, hh, hd]) => {
    addStaticBox(hw, hh, hd, hx, hh / 2 - 2, hz, 0x142228, {
      collide: false,
      occlude: false,
      edgesColor: 0x00ff88,
      edgesOpacity: 0.22
    });
  });
}

export function buildInstancedWorldElements() {
  const dummy = new THREE.Object3D();

  // 1. Postes de Luz (InstancedMesh) ao longo das avenidas dos 4 distritos
  const lampPositions = [];
  for (let z = -220; z <= 520; z += 45) {
    lampPositions.push([-32, z], [32, z], [-95, z], [DOCKS_OFFSET_X + 65, z > 320 ? 320 : z]);
  }
  for (let x = -320; x <= 740; x += 65) {
    if (x > 75 && x < 405) continue;
    lampPositions.push([x, 100], [x, 290]);
  }
  const poleMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.35, 5.8, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x1e2538, roughness: 0.6 }),
    lampPositions.length
  );
  const headMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.1, 0.22, 0.45),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
    lampPositions.length
  );
  lampPositions.forEach(([lx, lz], i) => {
    dummy.position.set(lx, 2.9, lz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poleMesh.setMatrixAt(i, dummy.matrix);
    dummy.position.set(lx, 5.85, lz);
    dummy.updateMatrix();
    headMesh.setMatrixAt(i, dummy.matrix);
  });
  refs.worldGroup.add(poleMesh, headMesh);

  // 2. Árvores Estilizadas nos Parques (InstancedMesh: troncos + copas)
  const treePositions = [];
  for (let i = 0; i < 140; i++) {
    const tx = i % 2 === 0 ? -130 - (i % 7) * 28 : -50 - (i % 6) * 32;
    const tz = i % 2 === 0 ? -120 - Math.floor(i / 7) * 24 : 150 + Math.floor(i / 6) * 24;
    treePositions.push([tx, tz, 0.8 + (i % 4) * 0.22]);
  }
  const trunkMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.28, 0.38, 2.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x3b281e, roughness: 0.9 }),
    treePositions.length
  );
  const crownMesh = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(2.1, 0),
    new THREE.MeshStandardMaterial({ color: 0x0e4d3e, emissive: 0x042820, emissiveIntensity: 0.45, roughness: 0.7 }),
    treePositions.length
  );
  treePositions.forEach(([tx, tz, sc], i) => {
    dummy.position.set(tx, 1.3 * sc, tz);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);
    dummy.position.set(tx, 3.6 * sc, tz);
    dummy.updateMatrix();
    crownMesh.setMatrixAt(i, dummy.matrix);
  });
  refs.worldGroup.add(trunkMesh, crownMesh);

  // 3. Barreiras Urbanas (InstancedMesh)
  const barrierPositions = [];
  for (let x = -280; x <= 700; x += 48) {
    if (x > 70 && x < 410) continue;
    barrierPositions.push([x, 110], [x, 275]);
  }
  const barrierMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(3.4, 1.0, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x364156, roughness: 0.75 }),
    barrierPositions.length
  );
  barrierPositions.forEach(([bx, bz], i) => {
    dummy.position.set(bx, 0.5, bz);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    barrierMesh.setMatrixAt(i, dummy.matrix);
  });
  refs.worldGroup.add(barrierMesh);

  // 4. Prédios Distantes de Horizonte (1 única InstancedMesh com CanvasTexture)
  const skyBuildings = [];
  for (let x = -720; x <= 980; x += 72) {
    skyBuildings.push([x, -420, 28 + (Math.abs(x) % 5) * 10]);
    skyBuildings.push([x, 860, 24 + (Math.abs(x) % 4) * 9]);
  }
  for (let z = -340; z <= 780; z += 76) {
    skyBuildings.push([-580, z, 30 + (Math.abs(z) % 5) * 8]);
    skyBuildings.push([980, z, 26 + (Math.abs(z) % 4) * 8]);
  }
  const skyTex = TextureGenerator.getBuildingFacadeTexture(2, 4);
  const horizonMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(26, 1, 26),
    new THREE.MeshStandardMaterial({
      color: 0xd0dcf5,
      map: skyTex,
      emissive: 0x162238,
      emissiveMap: skyTex,
      emissiveIntensity: 0.65,
      roughness: 0.65
    }),
    skyBuildings.length
  );
  skyBuildings.forEach(([hx, hz, hh], i) => {
    dummy.position.set(hx, hh / 2, hz);
    dummy.scale.set(1, hh, 1);
    dummy.updateMatrix();
    horizonMesh.setMatrixAt(i, dummy.matrix);
  });
  refs.worldGroup.add(horizonMesh);
}

export function buildTraversableGoldenGate() {
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

  // Guarda-corpo baixo (1.1m) no tabuleiro principal (X: 120..360)
  addStaticBox(240, 1.1, 0.6, 240, 10.55, zCenter - deckW / 2 - 0.3, 0x26314a, {
    occlude: false,
    edgesColor: 0xff5a1f,
    edgesOpacity: 0.7
  });
  addStaticBox(240, 1.1, 0.6, 240, 10.55, zCenter + deckW / 2 + 0.3, 0x26314a, {
    occlude: false,
    edgesColor: 0xff5a1f,
    edgesOpacity: 0.7
  });

  // Guarda-corpo baixo (1.1m) inclinado nas rampas + pilares finos de sustentação até a água
  const rampWallLen = Math.hypot(40, 10);
  [
    { x: 100, rotZ: rampAngle },
    { x: 380, rotZ: -rampAngle }
  ].forEach(({ x, rotZ }) => {
    [zCenter - deckW / 2 - 0.3, zCenter + deckW / 2 + 0.3].forEach((wz) => {
      const rail = addStaticBox(rampWallLen, 1.1, 0.6, x, 5.55, wz, 0x26314a, {
        occlude: false,
        edgesColor: 0xff5a1f,
        edgesOpacity: 0.7
      });
      rail.rotation.z = rotZ;
    });
  });

  // Pilares finos de sustentação da ponte e rampas até a água (y = -0.6)
  [105, 145, 240, 335, 375].forEach((px) => {
    const h = getSurfaceHeight(px, zCenter) + 0.6;
    [zCenter - deckW / 2 + 0.5, zCenter + deckW / 2 - 0.5].forEach((pz) => {
      addStaticBox(1.2, h, 1.2, px, h / 2 - 0.6, pz, 0x1e273d, {
        collide: false,
        occlude: false,
        edgesColor: 0xff5a1f,
        edgesOpacity: 0.35
      });
    });
  });

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

  refs.worldGroup.add(bridgeGroup);
}

export function buildMissionMarkers() {
  ['COMPLEXO_CTOS', 'DOCAS_BAIA_SF', 'VIP_CAR_01', 'VIP_CAR_02'].forEach((mKey) => {
    const mCfg = MAPS_CONFIG[mKey];
    const [mx, my, mz] = mCfg.markerPos;
    const color = mKey.startsWith('VIP_CAR')
      ? 0xd946ef
      : mKey === 'COMPLEXO_CTOS'
      ? 0x00f0ff
      : 0xffaa00;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2.3, 32),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(mx, my, mz);
    refs.worldGroup.add(ring);

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
    refs.worldGroup.add(beam);

    missionMarkers.push({ key: mKey, pos: new THREE.Vector3(mx, 0, mz), ring, beam });
  });

  // Zona de entrega de veículos VIP na Garagem Clandestina DedSec (-120, 0, 320)
  const delivGroup = new THREE.Group();
  delivGroup.position.set(-120, 0.06, 320);
  const delivRing = new THREE.Mesh(
    new THREE.RingGeometry(3.4, 4.2, 36),
    new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  delivRing.rotation.x = -Math.PI / 2;
  delivGroup.add(delivRing);

  const delivBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 3.8, 9.0, 28, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  delivBeam.position.y = 4.5;
  delivGroup.add(delivBeam);
  delivGroup.visible = false;
  refs.worldGroup.add(delivGroup);
  refs.vehicleDeliveryGroup = delivGroup;
  refs.vehicleDeliveryRing = delivRing;
  refs.vehicleDeliveryBeam = delivBeam;
}

export function setupLighting() {
  refs.ambientLight = new THREE.AmbientLight(0x7662a8, BASE_AMBIENT_INTENSITY);
  refs.scene.add(refs.ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xff8c66, 0x1c2540, 0.95);
  refs.scene.add(hemiLight);

  refs.dirLight = new THREE.DirectionalLight(0xffb899, 1.3);
  refs.dirLight.position.set(18, 28, 16);
  refs.dirLight.castShadow = true;
  refs.dirLight.shadow.mapSize.set(2048, 2048);
  refs.dirLight.shadow.camera.near = 2;
  refs.dirLight.shadow.camera.far = 85;
  const d = 32;
  refs.dirLight.shadow.camera.left = -d;
  refs.dirLight.shadow.camera.right = d;
  refs.dirLight.shadow.camera.top = d;
  refs.dirLight.shadow.camera.bottom = -d;
  refs.scene.add(refs.dirLight);

  // Luzes neon de atmosfera cyberpunk (ciano e magenta)
  const streetNeonCyan = new THREE.PointLight(0x00f0ff, 2.4, 28);
  streetNeonCyan.position.set(-10, 5, 16);
  refs.scene.add(streetNeonCyan);

  const streetNeonMagenta = new THREE.PointLight(0xff0055, 2.4, 28);
  streetNeonMagenta.position.set(10, 5, 16);
  refs.scene.add(streetNeonMagenta);

  // Luz de destaque na fachada da entrada do complexo
  const gateEntryLight = new THREE.PointLight(0x00f0ff, 2.4, 18);
  gateEntryLight.position.set(0, 4.6, 7.8);
  refs.scene.add(gateEntryLight);

  // Luzes internas sutis no pátio para melhorar leitura de cobertura e guardas
  const courtyardLightLeft = new THREE.PointLight(0x4b7bec, 1.8, 24);
  courtyardLightLeft.position.set(-9, 4.5, -6);
  refs.scene.add(courtyardLightLeft);

  const courtyardLightRight = new THREE.PointLight(0x706fd3, 1.8, 24);
  courtyardLightRight.position.set(9, 4.5, -14);
  refs.scene.add(courtyardLightRight);

  const serverLight = new THREE.PointLight(0x00f0ff, 2.8, 22);
  serverLight.position.set(0, 4.2, -20);
  refs.scene.add(serverLight);
}

// ==========================================
// CONSTRUÇÃO DO CENÁRIO (RUA + COMPLEXO ctOS)

export function addStaticBox(w, h, d, x, y, z, color, options = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    map: options.map ?? null,
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
  refs.worldGroup.add(mesh);

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

export function buildDetailedBuilding(x, z, w, h, d, style = {}) {
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

  const facadeTex = TextureGenerator.getBuildingFacadeTexture(2, 3);
  addStaticBox(w, lowerH, d, x, lowerY, z, 0xffffff, {
    collide,
    occlude,
    map: facadeTex,
    emissive: 0x1e2b45,
    emissiveMap: facadeTex,
    emissiveIntensity: 0.65,
    edgesColor: 0x25324d,
    edgesOpacity: 0.55
  });
  addStaticBox(w * 0.8, upperH, d * 0.8, x, upperY, z, 0xd8e2f5, {
    collide: false,
    occlude,
    map: facadeTex,
    emissive: 0x162238,
    emissiveMap: facadeTex,
    emissiveIntensity: 0.55,
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
      refs.worldGroup.add(winF);

      const winB = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.08), winMat);
      winB.position.set(x + wx, fy, z - d / 2 - 0.05);
      refs.worldGroup.add(winB);
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
  refs.worldGroup.add(beacon);
  blinkingLights.push({ mat: beaconMat, phase: Math.random() * Math.PI * 2 });
}

export function buildEnvironment(cfg) {
  // Chão principal ampliado (cobre X: -65..65 e Z: -65..75) com textura procedural de asfalto
  const asphaltTex = TextureGenerator.getAsphaltTexture(22, 24);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: asphaltTex,
    roughness: 0.88,
    metalness: 0.12
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(164, 174), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 5);
  ground.receiveShadow = true;
  refs.worldGroup.add(ground);

  const grid = new THREE.GridHelper(164, 82, 0x00f0ff, 0x162442);
  grid.position.set(0, 0.015, 5);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  refs.worldGroup.add(grid);

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
    refs.worldGroup.add(stripe);
  }

  // Faixas de pedestres
  [-28, 28].forEach((cx) => {
    for (let z = 14; z <= 32; z += 2.4) {
      const zebra = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 0.025, 1.1),
        new THREE.MeshBasicMaterial({ color: 0x4b6584 })
      );
      zebra.position.set(cx, 0.02, z);
      refs.worldGroup.add(zebra);
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
  refs.worldGroup.add(guaritaGlass);

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

export function buildMapGates(cfg, missionKey) {
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
      refs.gateMesh = gMesh;
      refs.gatePanelMesh = pMesh;
    }
  });
}

export function buildServerUnit(sx, sz, missionKey) {
  addStaticBox(4.4, 0.3, 3.6, sx, 0.15, sz, 0x182238, { occlude: false, collide: false });
  const sMesh = createHackableDevice(2.0, 3.0, 1.4, sx, 1.65, sz, 0xff0055, `SERVIDOR_${missionKey}`);

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
  );
  core.position.set(sx, 3.9, sz);
  refs.worldGroup.add(core);

  buildServerParticles(sx, sz);
  missionServers[missionKey] = { mesh: sMesh, core };
  if (missionKey === 'COMPLEXO_CTOS') {
    refs.serverMesh = sMesh;
    refs.serverCoreMesh = core;
  }
}

export function buildExtractionZone(ex, ez, missionKey) {
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

  refs.worldGroup.add(group);
  missionExtractions[missionKey] = { group, ring, beam };
  if (missionKey === 'COMPLEXO_CTOS') {
    refs.extractionZoneGroup = group;
    refs.extractionRing = ring;
    refs.extractionBeam = beam;
  }
}

export function buildDocksEnvironment(cfg) {
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
  refs.worldGroup.add(grid);

  // Muro oeste dividido em duas partes (Z: -25..24 e Z: 46..84), deixando abertura ampla de 22m (Z: 24..46) na saída da ponte
  addStaticBox(1.2, 3.6, 49, dx - 44, 1.8, -0.5, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.4 });
  addStaticBox(1.2, 3.6, 38, dx - 44, 1.8, 65, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.4 });
  // Pórtico luminoso na entrada das Docas (Z = 24..46)
  addStaticBox(1.4, 6.0, 1.4, dx - 44, 3.0, 24, 0x222c42, { edgesColor: 0x00f0ff, edgesOpacity: 0.65 });
  addStaticBox(1.4, 6.0, 1.4, dx - 44, 3.0, 46, 0x222c42, { edgesColor: 0x00f0ff, edgesOpacity: 0.65 });
  addStaticBox(1.4, 0.8, 23.5, dx - 44, 6.2, 35, 0x182236, {
    collide: false,
    occlude: false,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.65,
    edgesColor: 0x00f0ff,
    edgesOpacity: 0.8
  });
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
    { x1: dx - 44, z1: 84, x2: dx - 44, z2: 46 },
    { x1: dx - 44, z1: 24, x2: dx - 44, z2: -25 },
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
  const containerTex = TextureGenerator.getContainerTexture(2, 1);
  containers.forEach(([x, y, z, w, h, d, col, edgeCol]) => {
    if (y < 2.0) radarCrates.push({ x, z, w, d });
    addStaticBox(w, h, d, x, y, z, col, {
      map: containerTex,
      roughness: 0.55,
      metalness: 0.45,
      edgesColor: edgeCol,
      edgesOpacity: 0.55
    });
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

export function buildGoldenGateBridge() {
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

  refs.worldGroup.add(bridgeGroup);
}

export function buildComplexNeonAccents() {
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

export function buildServerParticles(sx = 0, sz = -21.5) {
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

  refs.serverParticles = new THREE.Points(geo, mat);
  refs.worldGroup.add(refs.serverParticles);
}

export function buildCarMesh(color, neonTrim, isPatrol = false) {
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

export function buildCars() {
  const worldCars = [
    { x: -10, z: 42, yaw: Math.PI / 2, color: 0x111827, neon: 0x00f0ff, isDedsec: true, isDrivable: true, maxHp: 100 },
    { x: -42, z: -24, yaw: Math.PI * 0.5, color: 0xcc22ff, neon: 0xd946ef, isDedsec: false, isDrivable: true, maxHp: 120, vipMissionKey: 'VIP_CAR_01' },
    { x: DOCKS_OFFSET_X + 76, z: 14, yaw: -Math.PI * 0.5, color: 0x3b4252, neon: 0xd946ef, isDedsec: false, isDrivable: true, maxHp: 220, vipMissionKey: 'VIP_CAR_02' },
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
    refs.worldGroup.add(carGroup);

    const isDrivable = !!(carCfg.isDedsec || carCfg.isDrivable);
    let headlight = null;
    if (isDrivable) {
      headlight = new THREE.PointLight(carCfg.neon || 0x00f0ff, 0, 16);
      headlight.position.set(0, 1.0, 2.8);
      carGroup.add(headlight);
    }

    // Partículas de fumaça escura (ativas quando HP <= 35)
    const smokeCount = 22;
    const smokePos = new Float32Array(smokeCount * 3);
    const smokeData = [];
    for (let s = 0; s < smokeCount; s++) {
      smokePos[s * 3] = (Math.random() - 0.5) * 0.7;
      smokePos[s * 3 + 1] = 0.8 + Math.random() * 1.4;
      smokePos[s * 3 + 2] = 1.3 + (Math.random() - 0.5) * 0.6;
      smokeData.push({ speed: 1.2 + Math.random() * 1.4, phase: Math.random() * Math.PI * 2 });
    }
    const smokeGeo = new THREE.BufferGeometry();
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: 0x2b2b2b,
      size: 0.55,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const smokePoints = new THREE.Points(smokeGeo, smokeMat);
    smokePoints.visible = false;
    carGroup.add(smokePoints);

    carGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(carGroup);
    const colliderObj = { box, mesh: bodyMesh, carIndex: idx };
    colliders.push(colliderObj);
    occluders.push(bodyMesh);

    const maxHp = carCfg.maxHp || 100;
    const carObj = {
      id: idx,
      mesh: carGroup,
      bodyMesh,
      colliderObj,
      initialPos: new THREE.Vector3(carCfg.x, 0, carCfg.z),
      initialYaw: carCfg.yaw,
      initialColor: carCfg.color,
      isDedsec: !!carCfg.isDedsec,
      isDrivable,
      vipMissionKey: carCfg.vipMissionKey || null,
      maxHp,
      hp: maxHp,
      destroyed: false,
      smokePoints,
      smokeData,
      speed: 0,
      hackedTimer: 0,
      hackedUsed: false,
      headlight
    };
    cars.push(carObj);
    if (carCfg.isDedsec) refs.dedsecCar = carObj;
  });
}

// ==========================================
// PÍERES DE EMBARQUE E BARCOS NAVEGÁVEIS
// ==========================================
export function buildBoatMesh(color, neonTrim) {
  const boatGroup = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.55,
    emissive: neonTrim,
    emissiveIntensity: 0.12
  });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.25, metalness: 0.7 });
  const trimMat = new THREE.MeshBasicMaterial({ color: neonTrim });

  // Casco principal + proa afilada
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.75, 4.6), hullMat);
  hull.position.y = 0.28;
  hull.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(hull.geometry),
      new THREE.LineBasicMaterial({ color: neonTrim, transparent: true, opacity: 0.8 })
    )
  );
  const bow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.65, 1.4), hullMat);
  bow.position.set(0, 0.32, 2.75);
  const bowTip = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.9), hullMat);
  bowTip.position.set(0, 0.36, 3.6);

  // Cabine e motor de popa com neon
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 1.8), cabinMat);
  cabin.position.set(0, 0.92, -0.2);
  const motor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.6), cabinMat);
  motor.position.set(0, 0.5, -2.45);
  const motorNeon = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.2), trimMat);
  motorNeon.position.set(0, 0.72, -2.55);

  boatGroup.add(hull, bow, bowTip, cabin, motor, motorNeon);
  return boatGroup;
}

export function buildBoatPiersAndBoats() {
  // 2 Píeres de embarque ao nível da água (y = -0.35) com rampa de acesso
  // Píer Oeste (margem leste do Centro Urbano: X = 72, Z = 62)
  addStaticBox(8, 0.35, 10, 72, -0.42, 62, 0x1c263b, { collide: false, occlude: false, edgesColor: 0x00f0ff, edgesOpacity: 0.5 });
  const rampW = addStaticBox(4.5, 0.25, 10, 66, -0.18, 62, 0x202b42, { collide: false, occlude: false });
  rampW.rotation.z = -0.09;

  // Píer Leste (margem oeste das Docas: X = 398, Z = 62)
  addStaticBox(8, 0.35, 10, 398, -0.42, 62, 0x1c263b, { collide: false, occlude: false, edgesColor: 0x00f0ff, edgesOpacity: 0.5 });
  const rampE = addStaticBox(4.5, 0.25, 10, 402, -0.18, 62, 0x202b42, { collide: false, occlude: false });
  rampE.rotation.z = 0.09;

  const boatConfigs = [
    { x: 78, z: 62, yaw: Math.PI / 2, color: 0x111a2e, neon: 0x00f0ff },
    { x: 391, z: 62, yaw: -Math.PI / 2, color: 0x111a2e, neon: 0x00ff88 },
    { x: 78, z: 220, yaw: Math.PI / 2, color: 0x141f36, neon: 0xffaa00 },
    { x: 391, z: -120, yaw: -Math.PI / 2, color: 0x141f36, neon: 0xff0055 }
  ];

  // Píeres extras (Sul Downtown X=72, Z=220 e Industrial Norte X=398, Z=-120)
  addStaticBox(8, 0.35, 10, 72, -0.42, 220, 0x1c263b, { collide: false, occlude: false, edgesColor: 0xffaa00, edgesOpacity: 0.5 });
  addStaticBox(8, 0.35, 10, 398, -0.42, -120, 0x1c263b, { collide: false, occlude: false, edgesColor: 0xff0055, edgesOpacity: 0.5 });

  boatConfigs.forEach((bCfg, idx) => {
    const mesh = buildBoatMesh(bCfg.color, bCfg.neon);
    mesh.position.set(bCfg.x, -0.32, bCfg.z);
    mesh.rotation.y = bCfg.yaw;
    refs.worldGroup.add(mesh);

    // Rastro ciano na popa
    const wakeCount = 24;
    const wakePos = new Float32Array(wakeCount * 3);
    const wakeData = [];
    for (let i = 0; i < wakeCount; i++) {
      wakePos[i * 3] = bCfg.x;
      wakePos[i * 3 + 1] = -0.35;
      wakePos[i * 3 + 2] = bCfg.z;
      wakeData.push({ life: 0, vx: 0, vz: 0 });
    }
    const wakeGeo = new THREE.BufferGeometry();
    wakeGeo.setAttribute('position', new THREE.BufferAttribute(wakePos, 3));
    const wakePoints = new THREE.Points(
      wakeGeo,
      new THREE.PointsMaterial({
        color: 0x00f0ff,
        size: 0.32,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    wakePoints.visible = false;
    refs.worldGroup.add(wakePoints);

    boats.push({
      id: idx,
      mesh,
      initialPos: new THREE.Vector3(bCfg.x, -0.32, bCfg.z),
      initialYaw: bCfg.yaw,
      speed: 0,
      wakePoints,
      wakeData
    });
  });
}

// ==========================================
// PERSONAGEM DO JOGADOR (3ª PESSOA)

export function buildNetworkLines() {
  refs.networkLinesGroup = new THREE.Group();
  refs.networkLinesGroup.visible = false;

  const points = [];
  gates.forEach((g) => points.push(g.panelMesh.position.clone()));
  electricBoxes.forEach((b) => points.push(b.mesh.position.clone()));
  securityCameras.forEach((c) => points.push(c.pos.clone()));
  points.push(refs.serverMesh.position.clone().setY(2.2));
  if (gates[0]) points.push(gates[0].panelMesh.position.clone());

  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.9
  });

  const networkLine = new THREE.Line(lineGeo, lineMat);
  refs.networkLinesGroup.add(networkLine);
  refs.worldGroup.add(refs.networkLinesGroup);
}

export function resetWorldState(keepPlayerPos = false) {
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
  updateVehicleHpHUD();
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
    gameState.drivingBoat = null;
    AudioManager.stopEngineSound();
    refs.playerGroup.visible = true;
    refs.playerGroup.position.set(mapCfg.playerStart[0], mapCfg.playerStart[1], mapCfg.playerStart[2]);
    refs.playerGroup.rotation.y = 0;
    refs.playerGroup.scale.y = 1;
  }

  // Resetar carros e barcos (exceto quando mantendo posição em FREE_ROAM)
  if (!keepPlayerPos) {
    cars.forEach((car) => {
      car.mesh.position.copy(car.initialPos);
      car.mesh.rotation.y = car.initialYaw;
      car.hp = car.maxHp;
      car.destroyed = false;
      if (car.smokePoints) car.smokePoints.visible = false;
      if (car.bodyMesh?.userData?.normalMaterial) {
        car.bodyMesh.userData.normalMaterial.color.setHex(car.initialColor ?? 0x111827);
        if (car.bodyMesh.userData.normalMaterial.emissive) {
          car.bodyMesh.userData.normalMaterial.emissive.setHex(0x000000);
          car.bodyMesh.userData.normalMaterial.emissiveIntensity = 0;
        }
      }
      car.speed = 0;
      car.hackedTimer = 0;
      car.hackedUsed = false;
      if (car.headlight) car.headlight.intensity = 0;
      car.mesh.updateMatrixWorld(true);
      car.colliderObj.box.setFromObject(car.mesh);
    });
    boats.forEach((boat) => {
      boat.mesh.position.copy(boat.initialPos);
      boat.mesh.rotation.y = boat.initialYaw;
      boat.speed = 0;
      if (boat.wakePoints) boat.wakePoints.visible = false;
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
  if (refs.serverMesh) refs.serverMesh.userData.normalMaterial.emissive.setHex(0xff0055);

  const preset = DIFFICULTY_PRESETS[gameState.difficulty];

  // Limpar projéteis e ondas EMP ativos
  for (let i = projectiles.length - 1; i >= 0; i--) {
    refs.scene.remove(projectiles[i].mesh);
    refs.scene.remove(projectiles[i].line);
    projectiles.splice(i, 1);
  }
  for (let i = guardProjectiles.length - 1; i >= 0; i--) {
    refs.scene.remove(guardProjectiles[i].mesh);
    guardProjectiles.splice(i, 1);
  }
  for (let i = empWaves.length - 1; i >= 0; i--) {
    refs.scene.remove(empWaves[i].mesh);
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

export function startContract(missionKey) {
  AudioManager.init();
  gameState.activeMissionKey = missionKey;
  gameState.selectedMap = missionKey;

  if (missionServers[missionKey]) {
    refs.serverMesh = missionServers[missionKey].mesh;
    refs.serverCoreMesh = missionServers[missionKey].core;
  }
  if (missionExtractions[missionKey]) {
    refs.extractionZoneGroup = missionExtractions[missionKey].group;
    refs.extractionRing = missionExtractions[missionKey].ring;
    refs.extractionBeam = missionExtractions[missionKey].beam;
  }

  resetWorldState(false);
  dom.gameoverScreen.classList.add('hidden');
  dom.victoryScreen.classList.add('hidden');
  dom.hud.classList.remove('hidden');

  const mCfg = MAPS_CONFIG[missionKey];
  if (mCfg?.isVehicleTheft) {
    gameState.targetCar = cars.find((c) => c.vipMissionKey === missionKey) || null;
    if (refs.vehicleDeliveryGroup) refs.vehicleDeliveryGroup.visible = true;
    setMissionState(MISSION_STATE.STEAL_CAR);
  } else {
    gameState.targetCar = null;
    if (refs.vehicleDeliveryGroup) refs.vehicleDeliveryGroup.visible = false;
    setMissionState(MISSION_STATE.INFILTRATE);
  }
  AudioManager.startMusic(96);
  dom.canvas.requestPointerLock();
}

export function returnToFreeRoam() {
  AudioManager.stopMusic();
  AudioManager.stopEngineSound();
  const keepPos = gameState.mission === MISSION_STATE.VICTORY;
  if (!keepPos) {
    gameState.selectedMap = 'COMPLEXO_CTOS';
  }
  gameState.activeMissionKey = null;
  gameState.targetCar = null;
  if (refs.vehicleDeliveryGroup) refs.vehicleDeliveryGroup.visible = false;
  gameState.markerCooldown = 3.5;
  resetWorldState(keepPos);
  dom.gameoverScreen.classList.add('hidden');
  dom.victoryScreen.classList.add('hidden');
  dom.hud.classList.remove('hidden');
  setMissionState(MISSION_STATE.FREE_ROAM);
  dom.canvas.requestPointerLock();
}

export function startMission() {
  returnToFreeRoam();
}

export function restartMission() {
  returnToFreeRoam();
}

export function onWindowResize() {
  refs.camera.aspect = window.innerWidth / window.innerHeight;
  refs.camera.updateProjectionMatrix();
  refs.renderer.setSize(window.innerWidth, window.innerHeight);
}

export function updateVisualEffects(dt, nowSec) {
  if (refs.skyDome && refs.camera) {
    refs.skyDome.position.copy(refs.camera.position);
  }
  if (refs.serverParticles) {
    const posAttr = refs.serverParticles.geometry.getAttribute('position');
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

  if (refs.extractionBeam) {
    refs.extractionBeam.material.opacity = 0.13 + Math.sin(nowSec * 3.2) * 0.04;
  }

  if (refs.waterMesh) {
    refs.waterMesh.position.y = -0.55 + Math.sin(nowSec * 1.4) * 0.05;
    refs.waterMesh.material.emissiveIntensity = 0.78 + Math.sin(nowSec * 2.0) * 0.1;
  }
  if (refs.waterTexture) {
    refs.waterTexture.offset.x += dt * 0.035;
    refs.waterTexture.offset.y += dt * 0.022;
  }

  for (let i = impactFlashes.length - 1; i >= 0; i--) {
    const f = impactFlashes[i];
    f.life -= dt;
    f.light.intensity = Math.max(0, 5.0 * (f.life / 0.15));
    if (f.life <= 0) {
      refs.scene.remove(f.light);
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
