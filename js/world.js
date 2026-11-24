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
  trafficCars,
  pedestrians,
  fleeingDrivers,
  boats,
  projectiles,
  guardProjectiles,
  empWaves,
  impactFlashes,
  blinkingLights,
  sirenLights,
  missionMarkers,
  stores,
  lightPoles,
  trafficLights,
  supplyBoxes,
  policeCars,
  rescueCells,
  steamPipes,
  missionServers,
  missionExtractions,
  serverParticleData,
  getSurfaceHeight,
  disposeHierarchy,
  isWaterArea,
  isWaterForLand,
  checkCollision,
  checkCarCollision,
  createHackableDevice
} from './state.js';
import { AudioManager } from './audio.js';
import {
  buildNetHackLabels,
  toggleNetHack,
  setMissionState,
  updateHpHUD,
  updateVehicleHpHUD,
  updateWantedHUD
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
      const c = this._makeCanvas(512, 512);
      const ctx = c.getContext('2d');
      // Gradiente crepuscular profundo de São Francisco
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0, '#020d1c');
      grad.addColorStop(0.45, '#051c36');
      grad.addColorStop(1, '#092d4f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Reflexos duplos: ciano/magenta do entardecer de SF + espuma nas bordas + shimmer
      for (let y = 0; y < 512; y += 10) {
        // Ondas e reflexos ciano
        ctx.fillStyle = 'rgba(0, 240, 255, 0.16)';
        ctx.beginPath();
        ctx.ellipse((y * 9) % 512, y, 52, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Reflexos crepusculares magenta / twilight do pôr do sol
        ctx.fillStyle = 'rgba(255, 40, 130, 0.12)';
        ctx.beginPath();
        ctx.ellipse((y * 17 + 140) % 512, y + 3, 36, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shimmer âmbar / dourado das luzes urbanas refletidas
        ctx.fillStyle = 'rgba(255, 180, 70, 0.08)';
        ctx.beginPath();
        ctx.ellipse((y * 23 + 280) % 512, y + 6, 26, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Espuma fina e caústicas nas cristas das ondas
        ctx.fillStyle = 'rgba(230, 250, 255, 0.22)';
        ctx.beginPath();
        ctx.ellipse((y * 31 + 60) % 512, y + 1, 18, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(64, 64);
      this.cache.water = tex;
    }
    return this.cache.water;
  },

  getWaterBumpMap() {
    if (!this.cache.waterBump) {
      const c = this._makeCanvas(256, 256);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 256, 256);

      // Normal/bump map procedural com ondulações horizontais e cruzadas
      for (let y = 0; y < 256; y += 6) {
        const val = Math.floor(128 + Math.sin(y * 0.22) * 48);
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(0, y, 256, 3);
      }
      for (let x = 0; x < 256; x += 10) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.fillRect(x, 0, 4, 256);
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(48, 48);
      this.cache.waterBump = tex;
    }
    return this.cache.waterBump;
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
  },

  // Feixe de farol: degradê cônico (branco-quente -> ciano) que some nas bordas laterais e na ponta distante.
  // Topo da textura = saída do farol (estreito); base = ponta distante (largo e 100% transparente).
  getHeadlightBeamTexture() {
    if (!this.cache.headlightBeam) {
      const w = 128;
      const h = 256;
      const c = this._makeCanvas(w, h);
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) {
        const t = y / (h - 1);
        const halfW = 0.10 + 0.40 * t;
        const lengthFade = Math.pow(1 - t, 1.35);
        const r = Math.round(255 - 85 * t);
        const g = Math.round(248 - 3 * t);
        const b = Math.round(225 + 30 * t);
        for (let x = 0; x < w; x++) {
          const nx = (x / (w - 1) - 0.5) / halfW;
          const lateral = Math.max(0, 1 - nx * nx);
          const a = Math.min(1, lengthFade * lateral * lateral * 1.1);
          const i = (y * w + x) * 4;
          img.data[i] = r;
          img.data[i + 1] = g;
          img.data[i + 2] = b;
          img.data[i + 3] = Math.round(a * 255);
        }
      }
      ctx.putImageData(img, 0, 0);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.cache.headlightBeam = tex;
    }
    return this.cache.headlightBeam;
  },

  getNeonSignTexture(text, colorHex = '#00f0ff') {
    const key = `sign_${text}_${colorHex}`;
    if (!this.cache[key]) {
      const c = this._makeCanvas(512, 128);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#070e1d';
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 496, 112);
      ctx.fillStyle = colorHex;
      ctx.font = 'bold 44px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 66);
      this.cache[key] = new THREE.CanvasTexture(c);
    }
    return this.cache[key];
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
  disposeHierarchy(refs.worldGroup);
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
  trafficCars.length = 0;
  pedestrians.length = 0;
  fleeingDrivers.length = 0;
  boats.length = 0;
  gates.length = 0;
  radarCrates.length = 0;
  radarBuildings.length = 0;
  radarWalls.length = 0;
  serverParticleData.length = 0;
  blinkingLights.length = 0;
  sirenLights.length = 0;
  missionMarkers.length = 0;
  stores.length = 0;
  lightPoles.length = 0;
  trafficLights.length = 0;
  supplyBoxes.length = 0;
  policeCars.length = 0;
  rescueCells.length = 0;
  steamPipes.length = 0;
  refs.waterMesh = null;
  refs.dedsecCar = null;
  refs.showroomTurntable = null;
  refs.activeHeadlight = new THREE.PointLight(0x00f0ff, 0, 18);
  refs.worldGroup.add(refs.activeHeadlight);

  // Chuva cyberpunk leve (360 partículas acompanhando a câmera sem pesar no FPS)
  const rainCount = 360;
  const rainPos = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPos[i * 3] = (Math.random() - 0.5) * 56;
    rainPos[i * 3 + 1] = Math.random() * 26;
    rainPos[i * 3 + 2] = (Math.random() - 0.5) * 56;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.16,
    transparent: true,
    opacity: 0.48,
    depthWrite: false
  });
  refs.rainPoints = new THREE.Points(rainGeo, rainMat);
  refs.rainPoints.visible = gameState.rainEnabled;
  refs.worldGroup.add(refs.rainPoints);

  // Água de alta definição da Baía de São Francisco (64x64 segmentos para ondas 3D reais nos vértices)
  refs.waterTexture = TextureGenerator.getWaterTexture();
  refs.waterTexture.repeat.set(48, 56);
  refs.waterBumpMap = TextureGenerator.getWaterBumpMap();
  refs.waterBumpMap.repeat.set(48, 56);

  const bayWaterGeo = new THREE.PlaneGeometry(2500, 2900, 64, 64);
  bayWaterGeo.userData = {
    basePositions: new Float32Array(bayWaterGeo.attributes.position.array)
  };
  refs.bayWaterGeo = bayWaterGeo;

  const bayWaterMat = new THREE.MeshStandardMaterial({
    color: 0x093a68,
    map: refs.waterTexture,
    bumpMap: refs.waterBumpMap,
    bumpScale: 0.08,
    emissive: 0x06284a,
    emissiveMap: refs.waterTexture,
    emissiveIntensity: 0.85,
    roughness: 0.14,
    metalness: 0.82
  });
  refs.waterMesh = new THREE.Mesh(bayWaterGeo, bayWaterMat);
  refs.waterMesh.rotation.x = -Math.PI / 2;
  refs.waterMesh.position.set(240, -0.55, 170);
  refs.worldGroup.add(refs.waterMesh);

  // Plano infinito do oceano além da baía
  const oceanInfiniteMat = new THREE.MeshStandardMaterial({
    color: 0x05213d,
    emissive: 0x03182d,
    emissiveIntensity: 0.75,
    roughness: 0.22,
    metalness: 0.78
  });
  const oceanInfiniteMesh = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), oceanInfiniteMat);
  oceanInfiniteMesh.rotation.x = -Math.PI / 2;
  oceanInfiniteMesh.position.set(0, -0.62, 0);
  refs.worldGroup.add(oceanInfiniteMesh);

  // Espumas / ondulações animadas ao redor dos pilares das pontes e píeres
  refs.waterFoamRings = [];
  const foamMat = new THREE.MeshBasicMaterial({
    color: 0x88eeff,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide
  });
  const pillarSpots = [
    [105, 35, 3.2], [145, 35, 3.2], [170, 35, 4.6], [240, 35, 3.2], [310, 35, 4.6], [335, 35, 3.2], [375, 35, 3.2],
    [165, 320, 3.6], [240, 320, 3.6], [315, 320, 3.6],
    [79.5, 62, 4.0], [79.5, 220, 4.0], [398.5, 62, 4.0], [398.5, -120, 4.0]
  ];
  pillarSpots.forEach(([px, pz, rad]) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(rad * 0.45, rad, 20), foamMat.clone());
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(px, -0.52, pz);
    refs.worldGroup.add(ring);
    refs.waterFoamRings.push(ring);
  });

  // Setor 1: Distrito Downtown & Financial + Complexo ctOS
  buildEnvironment(MAPS_CONFIG.COMPLEXO_CTOS);

  // Setor 2: Baía de São Francisco & Ponte Golden Gate Atravessável
  buildTraversableGoldenGate();

  // Setor 3: Distrito Portuário & Industrial (Docas da Baía SF + Terminal Marítimo Leste)
  buildDocksEnvironment(MAPS_CONFIG.DOCAS_BAIA_SF);

  // Setor 4: Distrito Residencial & Colinas Sul + Ponte Sul
  buildSouthDistrictAndBridge();
  buildHeistCompounds();
  buildRescueOutposts();
  buildUrbanDetailsAndMidBlocks();
  buildTerrainAndMountains();

  // Elementos repetitivos otimizados via THREE.InstancedMesh (60 FPS)
  buildInstancedWorldElements();

  // Marcadores Holográficos de Missão, Tubulações de Vapor e Lojas Interativas no Mapa
  buildMissionMarkers();
  buildSteamPipes();
  buildStores();

  // Veículos, Tráfego, Pedestres e Barcos do Mundo Aberto
  buildCars();
  buildTrafficCars();
  buildPedestrians();
  buildBoatPiersAndBoats();

  // Câmeras, Caixas Elétricas e Guardas das missões e contratos VIP + Câmeras de rua ctOS
  ['COMPLEXO_CTOS', 'DOCAS_BAIA_SF', 'VIP_CAR_01', 'VIP_CAR_02', 'HEIST_BLUME_03', 'HEIST_CTOS_04', 'HEIST_VALKYRIE_05', 'RESCUE_01', 'RESCUE_02'].forEach((mKey) => {
    const mCfg = MAPS_CONFIG[mKey];
    buildSecurityCameras(mCfg, mKey);
    buildElectricBoxes(mCfg);
    buildGuards(mCfg, mKey);
  });
  buildSecurityCameras(
    {
      cameras: [
        { name: 'STREET_CAM_01 // ESQUINA OESTE', pos: [-28, 5.2, 32], baseYaw: 0.75, basePitch: -0.35 },
        { name: 'STREET_CAM_02 // ESQUINA LESTE', pos: [28, 5.2, 32], baseYaw: -0.75, basePitch: -0.35 },
        { name: 'STREET_CAM_03 // AVENIDA SUL OESTE', pos: [-26, 5.2, 58], baseYaw: 2.35, basePitch: -0.35 },
        { name: 'STREET_CAM_04 // AVENIDA SUL LESTE', pos: [26, 5.2, 58], baseYaw: -2.35, basePitch: -0.35 }
      ]
    },
    'STREET'
  );

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

  // Guarda-corpo lateral nas rampas da Ponte Sul (X: 80..120 e X: 360..400)
  [
    { x: 100, rotZ: rampAng },
    { x: 380, rotZ: -rampAng }
  ].forEach(({ x, rotZ }) => {
    [zS - 8.3, zS + 8.3].forEach((wz) => {
      const rail = addStaticBox(rampLen, 1.1, 0.6, x, 4.05, wz, 0x26314a, {
        occlude: false,
        edgesColor: 0x00f0ff,
        edgesOpacity: 0.65
      });
      rail.rotation.z = rotZ;
    });
  });

  // Garagem Clandestina DedSec no Distrito Sul (X: -120, Z: 320)
  addStaticBox(26, 0.4, 22, -120, 4.8, 320, 0x141d2e, { collide: false, occlude: false, edgesColor: 0x00ff88, edgesOpacity: 0.8 });
  [[-132, 310], [-108, 310], [-132, 330], [-108, 330]].forEach(([px, pz]) => {
    addStaticBox(0.8, 4.8, 0.8, px, 2.4, pz, 0x24324c, { occlude: false });
  });
  // Letreiro 3D legível na Garagem Clandestina DedSec
  const garSign = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 2.2),
    new THREE.MeshBasicMaterial({ map: TextureGenerator.getNeonSignTexture('GARAGEM DEDSEC', '#00ff88'), side: THREE.DoubleSide })
  );
  garSign.position.set(-120, 4.1, 308.7);
  refs.worldGroup.add(garSign);

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
}

export function buildHeistCompounds() {
  // =========================================================
  // CONTRATO 03: DEPÓSITO BLINDADO BLUME (Distrito Sul, X: -195, Z: 220)
  // =========================================================
  const bx = -195;
  const bz = 220;
  const bw = 34; // X: -212 .. -178
  const bd = 32; // Z: 204 .. 236
  const bh = 4.6;
  const bAccent = 0xd946ef;

  // Piso reforçado do pátio
  addStaticBox(bw, 0.14, bd, bx, 0.02, bz, 0x12192b, {
    collide: false,
    occlude: false,
    edgesColor: bAccent,
    edgesOpacity: 0.48
  });

  // Muros perimetrais com contorno neon (EdgesGeometry) e abertura norte de 8m para o portão deslizante
  addStaticBox(0.8, bh, bd, bx - bw / 2, bh / 2, bz, 0x182236, { edgesColor: bAccent, edgesOpacity: 0.72 });
  addStaticBox(0.8, bh, bd, bx + bw / 2, bh / 2, bz, 0x182236, { edgesColor: bAccent, edgesOpacity: 0.72 });
  addStaticBox(bw, bh, 0.8, bx, bh / 2, bz + bd / 2, 0x182236, { edgesColor: bAccent, edgesOpacity: 0.72 });
  // Parede norte com vão central de 8m (X: -199 .. -191)
  const bSideW = (bw - 8) / 2; // 13m cada lado
  addStaticBox(bSideW, bh, 0.8, bx - (4 + bSideW / 2), bh / 2, bz - bd / 2, 0x182236, { edgesColor: bAccent, edgesOpacity: 0.75 });
  addStaticBox(bSideW, bh, 0.8, bx + (4 + bSideW / 2), bh / 2, bz - bd / 2, 0x182236, { edgesColor: bAccent, edgesOpacity: 0.75 });
  // Pórtico superior + letreiro 3D acima do portão
  addStaticBox(9.2, 0.7, 1.0, bx, bh + 0.35, bz - bd / 2, 0x141d2e, { collide: false, occlude: false, edgesColor: bAccent, edgesOpacity: 0.9 });
  const blumeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(8.6, 1.8),
    new THREE.MeshBasicMaterial({ map: TextureGenerator.getNeonSignTexture('DEPÓSITO BLUME', '#ff00aa'), side: THREE.DoubleSide })
  );
  blumeSign.position.set(bx, bh + 1.5, bz - bd / 2 - 0.15);
  refs.worldGroup.add(blumeSign);

  // Caixas táticas de cobertura nas laterais (mantendo a pista central X=-195 livre para fuga do carro)
  [
    [bx - 10, 1.0, bz - 6, 3.0, 2.0, 2.4],
    [bx + 10, 1.0, bz - 6, 3.0, 2.0, 2.4],
    [bx - 11, 1.1, bz + 8, 3.4, 2.2, 2.8],
    [bx + 11, 1.1, bz + 8, 3.4, 2.2, 2.8]
  ].forEach(([cx, cy, cz, cw, ch, cd]) => {
    addStaticBox(cw, ch, cd, cx, cy, cz, 0x1e293b, { edgesColor: bAccent, edgesOpacity: 0.55 });
  });

  radarWalls.push(
    { x1: bx - bw / 2, z1: bz - bd / 2, x2: bx - bw / 2, z2: bz + bd / 2 },
    { x1: bx + bw / 2, z1: bz - bd / 2, x2: bx + bw / 2, z2: bz + bd / 2 },
    { x1: bx - bw / 2, z1: bz + bd / 2, x2: bx + bw / 2, z2: bz + bd / 2 },
    { x1: bx - bw / 2, z1: bz - bd / 2, x2: bx - 4, z2: bz - bd / 2 },
    { x1: bx + 4, z1: bz - bd / 2, x2: bx + bw / 2, z2: bz - bd / 2 }
  );
  buildMapGates(MAPS_CONFIG.HEIST_BLUME_03, 'HEIST_BLUME_03');

  // =========================================================
  // CONTRATO 04: HANGAR SECRETO ctOS (Setor Portuário Leste, X: 495, Z: 165)
  // =========================================================
  const hx = 495;
  const hz = 165;
  const hw = 38; // X: 476 .. 514
  const hd = 34; // Z: 148 .. 182
  const hh = 6.2;
  const hAccent = 0x00f0ff;

  // Piso industrial do hangar
  addStaticBox(hw, 0.14, hd, hx, 0.02, hz, 0x101828, {
    collide: false,
    occlude: false,
    edgesColor: hAccent,
    edgesOpacity: 0.55
  });

  // Paredes fortificadas do hangar com contorno neon ciano
  addStaticBox(0.9, hh, hd, hx - hw / 2, hh / 2, hz, 0x162033, { edgesColor: hAccent, edgesOpacity: 0.75 });
  addStaticBox(0.9, hh, hd, hx + hw / 2, hh / 2, hz, 0x162033, { edgesColor: hAccent, edgesOpacity: 0.75 });
  addStaticBox(hw, hh, 0.9, hx, hh / 2, hz + hd / 2, 0x162033, { edgesColor: hAccent, edgesOpacity: 0.75 });
  const hSideW = (hw - 8) / 2; // 15m cada lado
  addStaticBox(hSideW, hh, 0.9, hx - (4 + hSideW / 2), hh / 2, hz - hd / 2, 0x162033, { edgesColor: hAccent, edgesOpacity: 0.78 });
  addStaticBox(hSideW, hh, 0.9, hx + (4 + hSideW / 2), hh / 2, hz - hd / 2, 0x162033, { edgesColor: hAccent, edgesOpacity: 0.78 });
  // Cobertura estrutural do hangar (vigas + teto elevado acima de 6.2m, colidível contra Drone)
  addStaticBox(hw + 0.8, 0.45, hd + 0.8, hx, hh + 0.22, hz, 0x0e1524, { collide: true, occlude: false, edgesColor: hAccent, edgesOpacity: 0.65 });
  const hangarSign = new THREE.Mesh(
    new THREE.PlaneGeometry(10.5, 2.0),
    new THREE.MeshBasicMaterial({ map: TextureGenerator.getNeonSignTexture('HANGAR SECRETO ctOS', '#00f0ff'), side: THREE.DoubleSide })
  );
  hangarSign.position.set(hx, hh - 0.5, hz - hd / 2 - 0.55);
  refs.worldGroup.add(hangarSign);

  // Coberturas táticas e racks laterais (pista central X=495 livre para o Interceptor Proto-X)
  [
    [hx - 12, 1.1, hz - 7, 3.2, 2.2, 2.6],
    [hx + 12, 1.1, hz - 7, 3.2, 2.2, 2.6],
    [hx - 12, 1.2, hz + 9, 3.6, 2.4, 3.0],
    [hx + 12, 1.2, hz + 9, 3.6, 2.4, 3.0]
  ].forEach(([cx, cy, cz, cw, ch, cd]) => {
    addStaticBox(cw, ch, cd, cx, cy, cz, 0x1a263b, { edgesColor: hAccent, edgesOpacity: 0.6 });
  });

  radarWalls.push(
    { x1: hx - hw / 2, z1: hz - hd / 2, x2: hx - hw / 2, z2: hz + hd / 2 },
    { x1: hx + hw / 2, z1: hz - hd / 2, x2: hx + hw / 2, z2: hz + hd / 2 },
    { x1: hx - hw / 2, z1: hz + hd / 2, x2: hx + hw / 2, z2: hz + hd / 2 },
    { x1: hx - hw / 2, z1: hz - hd / 2, x2: hx - 4, z2: hz - hd / 2 },
    { x1: hx + 4, z1: hz - hd / 2, x2: hx + hw / 2, z2: hz - hd / 2 }
  );
  buildMapGates(MAPS_CONFIG.HEIST_CTOS_04, 'HEIST_CTOS_04');

  // =========================================================
  // CONTRATO 05: COFRE AUTOMOTIVO TWIN PEAKS (Distrito Sul, X: -220, Z: 390)
  // =========================================================
  const vx = -220;
  const vz = 390;
  const vw = 36; // X: -238 .. -202
  const vd = 32; // Z: 374 .. 406
  const vh = 5.4;
  const vAccent = 0xffaa00;

  addStaticBox(vw, 0.14, vd, vx, 0.02, vz, 0x121826, {
    collide: false,
    occlude: false,
    edgesColor: vAccent,
    edgesOpacity: 0.55
  });
  addStaticBox(0.9, vh, vd, vx - vw / 2, vh / 2, vz, 0x1a2030, { edgesColor: vAccent, edgesOpacity: 0.78 });
  addStaticBox(0.9, vh, vd, vx + vw / 2, vh / 2, vz, 0x1a2030, { edgesColor: vAccent, edgesOpacity: 0.78 });
  addStaticBox(vw, vh, 0.9, vx, vh / 2, vz + vd / 2, 0x1a2030, { edgesColor: vAccent, edgesOpacity: 0.78 });
  const vSideW = (vw - 8) / 2;
  addStaticBox(vSideW, vh, 0.9, vx - (4 + vSideW / 2), vh / 2, vz - vd / 2, 0x1a2030, { edgesColor: vAccent, edgesOpacity: 0.8 });
  addStaticBox(vSideW, vh, 0.9, vx + (4 + vSideW / 2), vh / 2, vz - vd / 2, 0x1a2030, { edgesColor: vAccent, edgesOpacity: 0.8 });
  addStaticBox(9.2, 0.75, 1.0, vx, vh + 0.35, vz - vd / 2, 0x141b2c, { collide: false, occlude: false, edgesColor: vAccent, edgesOpacity: 0.9 });
  const vaultSign = new THREE.Mesh(
    new THREE.PlaneGeometry(10.5, 1.9),
    new THREE.MeshBasicMaterial({ map: TextureGenerator.getNeonSignTexture('COFRE TWIN PEAKS', '#ffaa00'), side: THREE.DoubleSide })
  );
  vaultSign.position.set(vx, vh + 1.55, vz - vd / 2 - 0.15);
  refs.worldGroup.add(vaultSign);

  [
    [vx - 11, 1.1, vz - 6, 3.2, 2.2, 2.4],
    [vx + 11, 1.1, vz - 6, 3.2, 2.2, 2.4],
    [vx - 11, 1.1, vz + 8, 3.4, 2.2, 2.8],
    [vx + 11, 1.1, vz + 8, 3.4, 2.2, 2.8]
  ].forEach(([cx, cy, cz, cw, ch, cd]) => {
    addStaticBox(cw, ch, cd, cx, cy, cz, 0x20293d, { edgesColor: vAccent, edgesOpacity: 0.6 });
  });

  radarWalls.push(
    { x1: vx - vw / 2, z1: vz - vd / 2, x2: vx - vw / 2, z2: vz + vd / 2 },
    { x1: vx + vw / 2, z1: vz - vd / 2, x2: vx + vw / 2, z2: vz + vd / 2 },
    { x1: vx - vw / 2, z1: vz + vd / 2, x2: vx + vw / 2, z2: vz + vd / 2 },
    { x1: vx - vw / 2, z1: vz - vd / 2, x2: vx - 4, z2: vz - vd / 2 },
    { x1: vx + 4, z1: vz - vd / 2, x2: vx + vw / 2, z2: vz - vd / 2 }
  );
  buildMapGates(MAPS_CONFIG.HEIST_VALKYRIE_05, 'HEIST_VALKYRIE_05');

  // =========================================================
  // PONTOS DE ENTREGA DOS NOVOS CONTRATOS (SEM PointLights EXTRAS)
  // =========================================================
  const deliverySpots = [
    { x: 435, z: -135, label: 'DOCA CLANDESTINA NORTE', color: 0x00ff88, hex: '#00ff88' },
    { x: -210, z: -140, label: 'GARAGEM DEDSEC OESTE', color: 0x00f0ff, hex: '#00f0ff' },
    { x: 460, z: -40, label: 'DOCA INDUSTRIAL LESTE', color: 0xffaa00, hex: '#ffaa00' }
  ];
  deliverySpots.forEach((ds) => {
    addStaticBox(24, 0.4, 20, ds.x, 4.8, ds.z, 0x141d2e, {
      collide: false,
      occlude: false,
      edgesColor: ds.color,
      edgesOpacity: 0.8
    });
    [
      [ds.x - 11, ds.z - 9],
      [ds.x + 11, ds.z - 9],
      [ds.x - 11, ds.z + 9],
      [ds.x + 11, ds.z + 9]
    ].forEach(([px, pz]) => {
      addStaticBox(0.8, 4.8, 0.8, px, 2.4, pz, 0x24324c, { occlude: false });
    });
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 2.1),
      new THREE.MeshBasicMaterial({ map: TextureGenerator.getNeonSignTexture(ds.label, ds.hex), side: THREE.DoubleSide })
    );
    sign.position.set(ds.x, 4.1, ds.z + 10.2);
    refs.worldGroup.add(sign);
  });
}

export function buildRescueOutposts() {
  const outpostConfigs = [
    {
      missionKey: 'RESCUE_01',
      cx: -240,
      cz: -220,
      w: 32,
      d: 28,
      h: 4.6,
      openSide: 'SOUTH',
      accent: 0x00f0ff,
      hex: '#00f0ff',
      signText: 'GALPÃO ISOLADO NORTE',
      prisonerColor: 0x00f0ff
    },
    {
      missionKey: 'RESCUE_02',
      cx: 520,
      cz: 340,
      w: 32,
      d: 30,
      h: 4.8,
      openSide: 'WEST',
      accent: 0xffaa00,
      hex: '#ffaa00',
      signText: 'TERMINAL SUL-LESTE',
      prisonerColor: 0xffaa00
    }
  ];

  outpostConfigs.forEach((oc) => {
    const cfg = MAPS_CONFIG[oc.missionKey];
    const { cx, cz, w, d, h, accent } = oc;

    // Piso do posto avançado
    addStaticBox(w, 0.14, d, cx, 0.02, cz, 0x111827, {
      collide: false,
      occlude: false,
      edgesColor: accent,
      edgesOpacity: 0.5
    });

    // Muros perimetrais com abertura tática de 10m na face de entrada
    if (oc.openSide === 'SOUTH') {
      addStaticBox(w, h, 0.8, cx, h / 2, cz - d / 2, 0x172133, { edgesColor: accent, edgesOpacity: 0.72 });
      addStaticBox(0.8, h, d, cx - w / 2, h / 2, cz, 0x172133, { edgesColor: accent, edgesOpacity: 0.72 });
      addStaticBox(0.8, h, d, cx + w / 2, h / 2, cz, 0x172133, { edgesColor: accent, edgesOpacity: 0.72 });
      const segW = (w - 10) / 2;
      addStaticBox(segW, h, 0.8, cx - (5 + segW / 2), h / 2, cz + d / 2, 0x172133, { edgesColor: accent, edgesOpacity: 0.75 });
      addStaticBox(segW, h, 0.8, cx + (5 + segW / 2), h / 2, cz + d / 2, 0x172133, { edgesColor: accent, edgesOpacity: 0.75 });
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(10.5, 1.9),
        new THREE.MeshBasicMaterial({ map: TextureGenerator.getNeonSignTexture(oc.signText, oc.hex), side: THREE.DoubleSide })
      );
      sign.position.set(cx, h + 1.1, cz + d / 2 + 0.15);
      refs.worldGroup.add(sign);
      radarWalls.push(
        { x1: cx - w / 2, z1: cz - d / 2, x2: cx + w / 2, z2: cz - d / 2 },
        { x1: cx - w / 2, z1: cz - d / 2, x2: cx - w / 2, z2: cz + d / 2 },
        { x1: cx + w / 2, z1: cz - d / 2, x2: cx + w / 2, z2: cz + d / 2 }
      );
    } else {
      addStaticBox(w, h, 0.8, cx, h / 2, cz - d / 2, 0x172133, { edgesColor: accent, edgesOpacity: 0.72 });
      addStaticBox(w, h, 0.8, cx, h / 2, cz + d / 2, 0x172133, { edgesColor: accent, edgesOpacity: 0.72 });
      addStaticBox(0.8, h, d, cx + w / 2, h / 2, cz, 0x172133, { edgesColor: accent, edgesOpacity: 0.72 });
      const segD = (d - 10) / 2;
      addStaticBox(0.8, h, segD, cx - w / 2, h / 2, cz - (5 + segD / 2), 0x172133, { edgesColor: accent, edgesOpacity: 0.75 });
      addStaticBox(0.8, h, segD, cx - w / 2, h / 2, cz + (5 + segD / 2), 0x172133, { edgesColor: accent, edgesOpacity: 0.75 });
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(10.5, 1.9),
        new THREE.MeshBasicMaterial({ map: TextureGenerator.getNeonSignTexture(oc.signText, oc.hex), side: THREE.DoubleSide })
      );
      sign.rotation.y = -Math.PI / 2;
      sign.position.set(cx - w / 2 - 0.15, h + 1.1, cz);
      refs.worldGroup.add(sign);
      radarWalls.push(
        { x1: cx - w / 2, z1: cz - d / 2, x2: cx + w / 2, z2: cz - d / 2 },
        { x1: cx - w / 2, z1: cz + d / 2, x2: cx + w / 2, z2: cz + d / 2 },
        { x1: cx + w / 2, z1: cz - d / 2, x2: cx + w / 2, z2: cz + d / 2 }
      );
    }

    // Caixas táticas de cobertura no pátio
    [
      [cx - 8, 1.0, cz - 5, 2.8, 2.0, 2.2],
      [cx + 8, 1.0, cz + 5, 2.8, 2.0, 2.2],
      [cx - 7, 1.0, cz + 6, 2.6, 2.0, 2.2]
    ].forEach(([bx, by, bz, bw, bh, bd]) => {
      addStaticBox(bw, bh, bd, bx, by, bz, 0x1e293b, { edgesColor: accent, edgesOpacity: 0.55 });
    });

    // Cela Energizada (barras de energia + colisor removível ao libertar)
    const [cellX, , cellZ] = cfg.cellPos;
    const barsGroup = new THREE.Group();
    barsGroup.position.set(cellX, 0, cellZ);
    const barMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const cageMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.0, 3.6), barMat);
    cageMesh.position.y = 1.5;
    const cageEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(cageMesh.geometry),
      new THREE.LineBasicMaterial({ color: 0xff0055, transparent: true, opacity: 0.95 })
    );
    cageMesh.add(cageEdges);
    barsGroup.add(cageMesh);
    refs.worldGroup.add(barsGroup);
    barsGroup.updateMatrixWorld(true);
    const cellCollider = { box: new THREE.Box3().setFromObject(cageMesh), mesh: cageMesh, isRescueCell: true };
    colliders.push(cellCollider);

    // NPC Prisioneiro DedSec / Informante dentro da cela
    const prisoner = new THREE.Group();
    const pJacket = new THREE.MeshStandardMaterial({ color: 0x151e30, roughness: 0.65 });
    const pTrim = new THREE.MeshBasicMaterial({ color: oc.prisonerColor });
    const pPants = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const pSkin = new THREE.MeshStandardMaterial({ color: 0xc99678, roughness: 0.65 });

    const pTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.34, 6, 10), pJacket);
    pTorso.position.y = 1.14;
    const pStripe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.24), pTrim);
    pStripe.position.y = 1.24;
    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), pSkin);
    pHead.position.y = 1.58;
    const pLegL = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.42, 4, 8), pPants);
    pLegL.position.set(-0.1, 0.42, 0);
    const pLegR = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.42, 4, 8), pPants);
    pLegR.position.set(0.1, 0.42, 0);
    const pArmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.36, 4, 8), pJacket);
    pArmL.position.set(-0.24, 1.08, 0);
    const pArmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.36, 4, 8), pJacket);
    pArmR.position.set(0.24, 1.08, 0);
    prisoner.add(pTorso, pStripe, pHead, pLegL, pLegR, pArmL, pArmR);
    prisoner.position.set(cellX, 0, cellZ);
    refs.worldGroup.add(prisoner);

    // Terminal Hackeável da Cela (E)
    const [px, py, pz] = cfg.panelPos;
    const panelMesh = createHackableDevice(0.75, 1.5, 0.55, px, py, pz, accent, `CELA_${oc.missionKey}`);

    // Gerador Destrutível da Cela (pode ser destruído a tiros para desativar a cela)
    const [gx, gy, gz] = cfg.generatorPos;
    const genMesh = createHackableDevice(1.3, 1.7, 1.1, gx, gy, gz, 0xff3344, `GERADOR_${oc.missionKey}`);
    genMesh.updateMatrixWorld(true);
    const genBox = new THREE.Box3().setFromObject(genMesh);

    rescueCells.push({
      missionKey: oc.missionKey,
      barsGroup,
      cageMesh,
      cellCollider,
      panelMesh,
      genMesh,
      genBox,
      genHp: 40,
      genMaxHp: 40,
      freed: false,
      prisoner,
      pLegL,
      pLegR,
      pArmL,
      pArmR,
      prisonerInitialPos: new THREE.Vector3(cellX, 0, cellZ),
      prisonerRunning: false,
      prisonerRunTimer: 0,
      prisonerPhase: 0,
      escapeDir: cfg.escapeDir || [0, 1]
    });

    // Zona de Extração distante (anel verde sem PointLight)
    buildExtractionZone(cfg.extractPos[0], cfg.extractPos[2], oc.missionKey);
  });
}

export function buildTerrainAndMountains() {
  const nethackTerrainMat = new THREE.MeshBasicMaterial({
    color: 0x00a8cc,
    wireframe: true,
    transparent: true,
    opacity: 0.28
  });

  function createDeformedMountain(rx, height, rz, x, z, color, opts = {}) {
    const isDodeca = opts.shape === 'dodeca';
    const geo = isDodeca
      ? new THREE.DodecahedronGeometry(1, 2)
      : new THREE.ConeGeometry(1, 1, opts.segments ?? 10, 4);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let vx = pos.getX(i);
      let vy = pos.getY(i);
      let vz = pos.getZ(i);

      if (isDodeca) {
        if (vy < -0.15) vy = -0.15;
        vy = (vy + 0.15) / 1.15;
      } else {
        vy = vy + 0.5;
      }

      const seed = Math.sin(vx * 7.3 + x * 0.05) * Math.cos(vz * 6.1 + z * 0.05) + Math.sin((vx + vz) * 4.7 + vy * 3.1) * 0.5;
      const radialFactor = isDodeca ? (1 + seed * 0.16) : (1 + seed * 0.18 * (1 - vy * 0.65));
      vx *= rx * radialFactor;
      vz *= rz * radialFactor;
      vy = vy * height * (1 + seed * 0.06);

      pos.setXYZ(i, vx, vy, vz);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.92,
      metalness: 0.08,
      emissive: opts.emissive ?? 0x091922,
      emissiveIntensity: opts.emissiveIntensity ?? 0.26,
      flatShading: true
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, opts.baseY ?? -0.6, z);
    mesh.rotation.y = opts.rotY ?? 0;
    mesh.receiveShadow = true;
    mesh.userData.normalMaterial = mat;
    mesh.userData.nethackMaterial = nethackTerrainMat;
    refs.worldGroup.add(mesh);
    structureMeshes.push(mesh);

    if (opts.occlude !== false) {
      occluders.push(mesh);
    }

    if (opts.collide !== false) {
      const colRadiusX = rx * (opts.collideScale ?? 0.72);
      const colRadiusZ = rz * (opts.collideScale ?? 0.72);
      const box = new THREE.Box3(
        new THREE.Vector3(x - colRadiusX, -2, z - colRadiusZ),
        new THREE.Vector3(x + colRadiusX, (opts.baseY ?? -0.6) + height, z + colRadiusZ)
      );
      colliders.push({ box, mesh });
    }
    return mesh;
  }

  // 1. Cadeia de Montanhas ao Norte da Ponte Golden Gate (Marin Headlands) e Margens Externas da Baía
  const mountainRanges = [
    // Marin Headlands (Norte da Golden Gate, Z: -490..-310, totalmente fora da malha urbana)
    { x: -160, z: -345, rx: 88, rz: 70, h: 72, color: 0x182b24, emissive: 0x0c2420, rotY: 0.4 },
    { x: -40, z: -340, rx: 115, rz: 85, h: 98, color: 0x1d2330, emissive: 0x102234, rotY: 1.1 },
    { x: 95, z: -305, rx: 105, rz: 72, h: 84, color: 0x182b24, emissive: 0x0b2522, rotY: 0.2 },
    { x: 225, z: -335, rx: 120, rz: 88, h: 112, color: 0x1d2330, emissive: 0x12263b, rotY: 2.1 },
    { x: 350, z: -315, rx: 100, rz: 76, h: 88, color: 0x182b24, emissive: 0x0d2824, rotY: 0.7 },
    { x: 495, z: -355, rx: 115, rz: 82, h: 94, color: 0x1d2330, emissive: 0x112438, rotY: 1.7 },
    { x: 645, z: -325, rx: 110, rz: 80, h: 78, color: 0x182b24, emissive: 0x0c2420, rotY: 2.6 },
    // Encostas Leste atrás das Docas (X: 760..930)
    { x: 790, z: -150, rx: 90, rz: 105, h: 76, color: 0x1d2330, emissive: 0x102030, rotY: 0.9 },
    { x: 825, z: 30, rx: 95, rz: 115, h: 92, color: 0x182b24, emissive: 0x0b2320, rotY: 1.5 },
    { x: 785, z: 220, rx: 95, rz: 110, h: 82, color: 0x1d2330, emissive: 0x122234, rotY: 2.3 },
    // Margem Sudeste da Baía (X: 500..780, Z: 430..610)
    { x: 540, z: 455, rx: 85, rz: 70, h: 58, color: 0x182b24, emissive: 0x0c2420, rotY: 0.5 },
    { x: 675, z: 490, rx: 110, rz: 85, h: 86, color: 0x1d2330, emissive: 0x102436, rotY: 1.9 },
    // Horizonte Oeste (X: -430..-285)
    { x: -340, z: -120, rx: 85, rz: 110, h: 68, color: 0x1d2330, emissive: 0x102232, rotY: 0.3 },
    { x: -355, z: 100, rx: 90, rz: 115, h: 74, color: 0x182b24, emissive: 0x0c2420, rotY: 1.4 },
    { x: -345, z: 330, rx: 88, rz: 110, h: 70, color: 0x1d2330, emissive: 0x102030, rotY: 2.4 },
    // Cadeia Twin Peaks ao fundo do Distrito Sul (Z: 560..710)
    { x: -290, z: 600, rx: 110, rz: 85, h: 76, color: 0x182b24, emissive: 0x0d2622, rotY: 0.8 },
    { x: -135, z: 635, rx: 120, rz: 95, h: 96, color: 0x1d2330, emissive: 0x12283d, rotY: 1.6 },
    { x: 15, z: 605, rx: 95, rz: 82, h: 72, color: 0x182b24, emissive: 0x0e2a24, rotY: 2.2 },
    { x: -55, z: 685, rx: 130, rz: 95, h: 108, color: 0x1d2330, emissive: 0x142b42, rotY: 0.4, shape: 'dodeca' }
  ];

  mountainRanges.forEach((m) => {
    createDeformedMountain(m.rx, m.h, m.rz, m.x, m.z, m.color, {
      emissive: m.emissive,
      emissiveIntensity: 0.3,
      rotY: m.rotY,
      shape: m.shape || 'cone',
      segments: 11
    });
  });

  // 2. Colinas verdes escalonadas com árvores apenas nas bordas externas do Distrito Sul (zero colinas dentro da cidade)
  const hillTrees = [];
  const steppedHills = [
    // Bordas externas ao sul do Distrito Sul (Z >= 505, fora de praças e avenidas)
    { x: -245, z: 515, rx: 46, rz: 36, h: 14, color: 0x182b24 },
    { x: -150, z: 525, rx: 42, rz: 32, h: 12, color: 0x1b332a },
    { x: -35, z: 520, rx: 44, rz: 34, h: 13, color: 0x182b24 }
  ];

  steppedHills.forEach((hDef) => {
    createDeformedMountain(hDef.rx, hDef.h, hDef.rz, hDef.x, hDef.z, hDef.color, {
      shape: 'dodeca',
      emissive: 0x0a261d,
      emissiveIntensity: 0.28,
      collide: hDef.collide !== false,
      occlude: hDef.collide !== false,
      collideScale: 0.68
    });
    const treeCount = hDef.rx > 25 ? 7 : 3;
    for (let t = 0; t < treeCount; t++) {
      const ang = (t / treeCount) * Math.PI * 2 + hDef.x * 0.1;
      const distRatio = hDef.rx > 25 ? 0.45 : 0.4;
      const tx = hDef.x + Math.cos(ang) * hDef.rx * distRatio;
      const tz = hDef.z + Math.sin(ang) * hDef.rz * distRatio;
      const ty = hDef.h * 0.48;
      hillTrees.push({ x: tx, y: ty, z: tz, scale: 0.85 + (t % 3) * 0.22 });
    }
  });

  if (hillTrees.length > 0) {
    const dummy = new THREE.Object3D();
    const trunkMesh = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.24, 0.34, 2.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x3b281e, roughness: 0.9 }),
      hillTrees.length
    );
    const crownMesh = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(1.75, 0),
      new THREE.MeshStandardMaterial({ color: 0x11634c, emissive: 0x042b20, emissiveIntensity: 0.35, roughness: 0.72 }),
      hillTrees.length
    );
    hillTrees.forEach((tr, idx) => {
      dummy.position.set(tr.x, tr.y + 1.1 * tr.scale, tr.z);
      dummy.scale.set(tr.scale, tr.scale, tr.scale);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(tr.x, tr.y + 3.0 * tr.scale, tr.z);
      dummy.rotation.set(0, idx * 0.7, 0);
      dummy.updateMatrix();
      crownMesh.setMatrixAt(idx, dummy.matrix);
    });
    refs.worldGroup.add(trunkMesh, crownMesh);
  }

  // 3. Colina-Mirante Acessível no Distrito Sul (X: 28..48, Z: 355..425, topo y = 11.5m)
  // Encostas rochosas e verdes cercando o mirante sem invadir a pista
  createDeformedMountain(22, 11.2, 22, 38, 415, 0x182b24, {
    shape: 'dodeca',
    emissive: 0x0b2820,
    emissiveIntensity: 0.28,
    collide: false,
    occlude: false
  });
  createDeformedMountain(15, 8.5, 24, 16, 398, 0x1d2330, {
    shape: 'dodeca',
    collideScale: 0.65
  });
  createDeformedMountain(15, 8.5, 24, 60, 398, 0x1d2330, {
    shape: 'dodeca',
    collideScale: 0.65
  });
  createDeformedMountain(20, 10.5, 16, 38, 440, 0x1d2330, {
    shape: 'dodeca',
    collideScale: 0.7
  });

  // Rampa asfaltada suave (Z: 355..405, elevação 0 -> 11.5m) e platô do Mirante (Z: 405..425)
  const miranteMat = new THREE.MeshStandardMaterial({ color: 0x1b263b, roughness: 0.85, metalness: 0.15 });
  const rampLenM = Math.hypot(50, 11.5);
  const rampAngM = Math.atan2(11.5, 50);
  const miranteRamp = new THREE.Mesh(new THREE.BoxGeometry(20, 0.7, rampLenM), miranteMat);
  miranteRamp.position.set(38, 5.4, 380);
  miranteRamp.rotation.x = -rampAngM;
  miranteRamp.receiveShadow = true;
  miranteRamp.userData.normalMaterial = miranteMat;
  miranteRamp.userData.nethackMaterial = nethackTerrainMat;

  const miranteDeck = new THREE.Mesh(new THREE.BoxGeometry(20, 0.8, 20), miranteMat);
  miranteDeck.position.set(38, 11.1, 415);
  miranteDeck.receiveShadow = true;
  miranteDeck.userData.normalMaterial = miranteMat;
  miranteDeck.userData.nethackMaterial = nethackTerrainMat;
  refs.worldGroup.add(miranteRamp, miranteDeck);

  // Guarda-corpo luminoso no topo do Mirante (Oeste, Leste e Sul, deixando entrada Norte aberta)
  addStaticBox(0.45, 1.15, 20.4, 28.1, 12.05, 415, 0x22324d, {
    occlude: false,
    edgesColor: 0x00ff88,
    edgesOpacity: 0.9
  });
  addStaticBox(0.45, 1.15, 20.4, 47.9, 12.05, 415, 0x22324d, {
    occlude: false,
    edgesColor: 0x00ff88,
    edgesOpacity: 0.9
  });
  addStaticBox(20.2, 1.15, 0.45, 38, 12.05, 424.9, 0x22324d, {
    occlude: false,
    edgesColor: 0x00f0ff,
    edgesOpacity: 0.95
  });

  // Guarda-corpo lateral na rampa do Mirante
  [28.1, 47.9].forEach((rx) => {
    const rRail = addStaticBox(0.4, 1.0, rampLenM, rx, 6.25, 380, 0x22324d, {
      collide: false,
      occlude: false,
      edgesColor: 0x00ff88,
      edgesOpacity: 0.65
    });
    rRail.rotation.x = -rampAngM;
  });

  // Letreiro 3D no Mirante DedSec
  const miranteSign = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 2.2),
    new THREE.MeshBasicMaterial({ map: TextureGenerator.getNeonSignTexture('MIRANTE TWIN PEAKS', '#00ff88'), side: THREE.DoubleSide })
  );
  miranteSign.position.set(38, 13.4, 424.5);
  refs.worldGroup.add(miranteSign);
}

export function buildUrbanDetailsAndMidBlocks() {
  // 1. Quarteirões intermediários e arranha-céus preenchendo os vazios de Downtown, Distrito Sul e Docas
  const midBlocks = [
    // Downtown Oeste & Central (X: -180..65)
    [-92, -16, 18, 28, 16, 0x00f0ff],
    [-92, 16, 18, 24, 16, 0xff0055],
    [-92, 48, 18, 22, 16, 0x38bdf8],
    [-92, 122, 20, 26, 18, 0x00f0ff],
    [-132, -16, 20, 32, 18, 0xffaa00],
    [-132, 18, 20, 26, 18, 0x00ff88],
    [-132, 54, 20, 24, 18, 0xd946ef],
    [-162, 122, 22, 30, 18, 0xff0055],
    [-172, -12, 20, 34, 18, 0x00f0ff],
    [-172, 56, 20, 28, 18, 0xff0055],
    [-218, 42, 22, 28, 20, 0x38bdf8],
    [-218, 178, 20, 24, 18, 0xffaa00],
    [-24, 96, 18, 22, 14, 0xffaa00],
    [18, 96, 18, 20, 14, 0x38bdf8],
    // Distrito Sul (Z: 120..360)
    [22, 152, 20, 22, 18, 0x00f0ff],
    [22, 212, 20, 20, 18, 0xff0055],
    [22, 272, 20, 18, 18, 0x00ff88],
    [-22, 152, 20, 24, 18, 0xd946ef],
    [-16, 212, 22, 20, 18, 0x00ff88],
    [-22, 272, 20, 20, 18, 0xffaa00],
    [-92, 252, 20, 22, 18, 0x38bdf8],
    [-162, 212, 22, 24, 18, 0x00f0ff],
    [-148, 378, 24, 22, 18, 0xd946ef],
    // Área Industrial das Docas (X: 410..560)
    [426, 108, 18, 14, 18, 0xffaa00],
    [492, 88, 22, 16, 18, 0x00f0ff],
    [492, 148, 24, 16, 20, 0xffaa00],
    [526, 206, 22, 18, 18, 0x00f0ff],
    [542, 148, 22, 15, 20, 0xff0055]
  ];
  midBlocks.forEach(([bx, bz, bw, bh, bd, acc]) => {
    buildDetailedBuilding(bx, bz, bw, bh, bd, { accent: acc });
  });

  // 1b. Calçadas elevadas (0.16m, cinza-azulado claro + meio-fio neon sutil) via InstancedMesh sob todos os quarteirões
  const sidewalkPads = [
    [-110, -40, 22, 20],
    [-160, 20, 24, 22],
    [-110, 180, 20, 18],
    [-180, 260, 22, 20],
    [-80, 420, 24, 22],
    [-180, 460, 22, 20],
    [560, -40, 26, 24],
    [620, 120, 28, 26],
    [560, 240, 24, 22],
    ...midBlocks.map(([bx, bz, bw, , bd]) => [bx, bz, bw, bd])
  ];

  const dummy = new THREE.Object3D();
  const sidewalkSlabMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.16, 1),
    new THREE.MeshStandardMaterial({ color: 0x2c3b57, roughness: 0.85, metalness: 0.12 }),
    sidewalkPads.length
  );
  sidewalkSlabMesh.receiveShadow = true;

  const curbNeonMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.05, 1),
    new THREE.MeshStandardMaterial({ color: 0x163d5c, emissive: 0x00a8cc, emissiveIntensity: 0.35, roughness: 0.5 }),
    sidewalkPads.length
  );

  sidewalkPads.forEach(([sx, sz, sw, sd], i) => {
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(sx, 0.08, sz);
    dummy.scale.set(sw + 7.5, 1, sd + 7.5);
    dummy.updateMatrix();
    sidewalkSlabMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.set(sx, 0.03, sz);
    dummy.scale.set(sw + 7.85, 1, sd + 7.85);
    dummy.updateMatrix();
    curbNeonMesh.setMatrixAt(i, dummy.matrix);
  });
  refs.worldGroup.add(sidewalkSlabMesh, curbNeonMesh);

  // 1c. Praças Verdes com piso texturizado, canteiros centrais nas avenidas e faixas de pedestres (InstancedMesh)
  const plazaDefs = [
    [-112, 86, 24, 18],
    [0, 124, 28, 16],
    [-128, 252, 24, 20]
  ];
  const plazaBaseMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.16, 1),
    new THREE.MeshStandardMaterial({ color: 0x133d30, roughness: 0.9 }),
    plazaDefs.length
  );
  const plazaTrimMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.06, 1),
    new THREE.MeshStandardMaterial({ color: 0x164e3f, emissive: 0x00ff88, emissiveIntensity: 0.28 }),
    plazaDefs.length
  );
  plazaDefs.forEach(([px, pz, pw, pd], i) => {
    dummy.position.set(px, 0.08, pz);
    dummy.scale.set(pw, 1, pd);
    dummy.updateMatrix();
    plazaBaseMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.set(px, 0.04, pz);
    dummy.scale.set(pw + 0.6, 1, pd + 0.6);
    dummy.updateMatrix();
    plazaTrimMesh.setMatrixAt(i, dummy.matrix);
  });
  refs.worldGroup.add(plazaBaseMesh, plazaTrimMesh);

  // Canteiros divisores no meio das avenidas principais
  const medianDefs = [
    [-115, 35, 92, 2.2],
    [-68, 165, 2.2, 130],
    [-175, 320, 64, 2.2],
    [-15, 320, 96, 2.2]
  ];
  const medianMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.24, 1),
    new THREE.MeshStandardMaterial({ color: 0x1c2b3d, emissive: 0x06382b, emissiveIntensity: 0.35, roughness: 0.8 }),
    medianDefs.length
  );
  medianDefs.forEach(([mx, mz, mw, md], i) => {
    dummy.position.set(mx, 0.12, mz);
    dummy.scale.set(mw, 1, md);
    dummy.updateMatrix();
    medianMesh.setMatrixAt(i, dummy.matrix);
  });
  refs.worldGroup.add(medianMesh);

  // Faixas de pedestres nos cruzamentos principais
  const crosswalkCenters = [
    [-58, 35, true],
    [0, 28, false],
    [-32, 58, false],
    [32, 58, false],
    [-58, 175, true],
    [432, 35, true]
  ];
  const stripePositions = [];
  crosswalkCenters.forEach(([cx, cz, vertical]) => {
    for (let k = -3; k <= 3; k++) {
      stripePositions.push([
        cx + (vertical ? 0 : k * 1.6),
        cz + (vertical ? k * 1.6 : 0),
        vertical ? Math.PI / 2 : 0
      ]);
    }
  });
  const crosswalkMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.85, 0.025, 3.0),
    new THREE.MeshBasicMaterial({ color: 0x647a99 }),
    stripePositions.length
  );
  stripePositions.forEach(([sx, sz, rotY], i) => {
    dummy.position.set(sx, 0.02, sz);
    dummy.rotation.set(0, rotY, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    crosswalkMesh.setMatrixAt(i, dummy.matrix);
  });
  refs.worldGroup.add(crosswalkMesh);

  // 2. Semáforos funcionais e hackeáveis (V + E) nos cruzamentos principais
  [
    [-30, 28],
    [30, 28],
    [-60, 62],
    [60, 62],
    [-60, 175],
    [428, 28]
  ].forEach(([sx, sz], idx) => {
    const greenMat = new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? 0x00ff88 : 0x163022 });
    const redMat = new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? 0x330a12 : 0xff0044 });
    addStaticBox(0.32, 5.2, 0.32, sx, 2.6, sz, 0x1c2538, { occlude: false });
    addStaticBox(2.6, 0.25, 0.25, sx + 1.2, 4.9, sz, 0x1c2538, { collide: false, occlude: false });
    addStaticBox(0.45, 1.05, 0.36, sx + 2.2, 4.75, sz, 0x0c111d, { collide: false, occlude: false });
    const gLens = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.40), greenMat);
    gLens.position.set(sx + 2.2, 4.96, sz);
    const rLens = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.40), redMat);
    rLens.position.set(sx + 2.2, 4.54, sz);
    refs.worldGroup.add(gLens, rLens);
    trafficLights.push({
      id: idx,
      pos: new THREE.Vector3(sx + 2.2, 0, sz),
      greenMat,
      redMat,
      hackedTimer: 0
    });
  });

  // 3. Paradas de ônibus futuristas com cobertura translúcida e totem neon
  const glassCanopyMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.32,
    roughness: 0.15
  });
  [
    [-22, 58],
    [22, 58],
    [-62, 138],
    [430, 48]
  ].forEach(([px, pz]) => {
    addStaticBox(0.25, 2.6, 0.25, px - 1.8, 1.3, pz, 0x1e293b, { occlude: false });
    addStaticBox(0.25, 2.6, 0.25, px + 1.8, 1.3, pz, 0x1e293b, { occlude: false });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 1.8), glassCanopyMat);
    canopy.position.set(px, 2.65, pz);
    refs.worldGroup.add(canopy);
    addStaticBox(2.8, 0.48, 0.65, px, 0.42, pz + 0.2, 0x26344d, { occlude: false, edgesColor: 0x00f0ff });
    addStaticBox(0.18, 2.2, 0.7, px + 2.2, 1.1, pz, 0x00f0ff, {
      collide: false,
      occlude: false,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.9
    });
  });

  // 4. Canteiros centrais com árvores dividindo as avenidas largas
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b281e, roughness: 0.9 });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x0e5a46, emissive: 0x042820, emissiveIntensity: 0.4, roughness: 0.7 });
  [
    [-16, 24],
    [16, 24],
    [-82, 76],
    [-82, 152],
    [-82, 232]
  ].forEach(([mx, mz]) => {
    addStaticBox(5.2, 0.32, 2.2, mx, 0.16, mz, 0x182534, { occlude: false, edgesColor: 0x00ff88, edgesOpacity: 0.45 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.2, 7), trunkMat);
    trunk.position.set(mx, 1.25, mz);
    const crown = new THREE.Mesh(new THREE.OctahedronGeometry(1.55, 0), crownMat);
    crown.position.set(mx, 3.0, mz);
    refs.worldGroup.add(trunk, crown);
  });

  // 5. Bancas / Quiosques DedSec nas praças
  [[-16, 54], [16, 54]].forEach(([kx, kz], idx) => {
    const kColor = idx === 0 ? 0xd946ef : 0x00f0ff;
    addStaticBox(3.4, 2.2, 2.4, kx, 1.1, kz, 0x162033, { edgesColor: kColor, edgesOpacity: 0.7 });
    addStaticBox(3.8, 0.24, 3.0, kx, 2.35, kz, kColor, {
      collide: false,
      occlude: false,
      emissive: kColor,
      emissiveIntensity: 0.95
    });
  });

  // 6. Passarelas / Viadutos elevados cruzando as avenidas
  [
    { x: -56, z: 102, w: 22, d: 3.4, rotY: 0 },
    { x: 0, z: 26, w: 34, d: 3.2, rotY: 0 }
  ].forEach((ov) => {
    addStaticBox(ov.w, 0.45, ov.d, ov.x, 5.4, ov.z, 0x182338, {
      collide: false,
      occlude: false,
      edgesColor: 0x00f0ff,
      edgesOpacity: 0.75
    });
    addStaticBox(ov.w, 0.85, 0.18, ov.x, 5.95, ov.z - ov.d / 2, 0x00f0ff, {
      collide: false,
      occlude: false,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.7
    });
    addStaticBox(ov.w, 0.85, 0.18, ov.x, 5.95, ov.z + ov.d / 2, 0x00f0ff, {
      collide: false,
      occlude: false,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.7
    });
    [-ov.w / 2 + 0.6, ov.w / 2 - 0.6].forEach((px) => {
      addStaticBox(0.85, 5.4, 0.85, ov.x + px, 2.7, ov.z, 0x22304a, { occlude: false });
    });
  });
}

export function buildInstancedWorldElements() {
  const dummy = new THREE.Object3D();

  // 1. Postes de Luz (InstancedMesh) ao longo das avenidas dos 4 distritos
  const lampPositions = [];
  for (let z = -220; z <= 520; z += 45) {
    [[-32, z], [32, z], [-95, z], [DOCKS_OFFSET_X + 65, z > 320 ? 320 : z]].forEach(([lx, lz]) => {
      if (Math.abs(lz - 50) < 18 && Math.abs(lx) <= 40) return;
      lampPositions.push([lx, lz]);
    });
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

    const colliderObj = {
      box: new THREE.Box3(
        new THREE.Vector3(lx - 0.32, 0, lz - 0.32),
        new THREE.Vector3(lx + 0.32, 5.8, lz + 0.32)
      ),
      mesh: poleMesh,
      isLightPole: true,
      poleIndex: i
    };
    colliders.push(colliderObj);
    lightPoles.push({
      id: i,
      x: lx,
      z: lz,
      poleMesh,
      headMesh,
      colliderObj,
      fallen: false,
      falling: false,
      fallProgress: 0,
      fallDirX: 0,
      fallDirZ: 1,
      fallGroup: null,
      sparkPoints: null,
      sparkTimer: 0
    });
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
    // Registrar colisão do tronco das árvores na área jogável
    colliders.push({
      box: new THREE.Box3(
        new THREE.Vector3(tx - 0.55 * sc, 0, tz - 0.55 * sc),
        new THREE.Vector3(tx + 0.55 * sc, 3.0 * sc, tz + 0.55 * sc)
      ),
      mesh: trunkMesh
    });
  });
  refs.worldGroup.add(trunkMesh, crownMesh);

  // 3. Barreiras Urbanas (InstancedMesh + colliders)
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
    colliders.push({
      box: new THREE.Box3(
        new THREE.Vector3(bx - 1.7, 0, bz - 0.38),
        new THREE.Vector3(bx + 1.7, 1.0, bz + 0.38)
      ),
      mesh: barrierMesh
    });
  });
  refs.worldGroup.add(barrierMesh);

  // 3b. Mobiliário Urbano nas Calçadas (Bancos, Lixeiras, Totens Holográficos e Paletes via InstancedMesh)
  const benchPositions = [];
  const trashPositions = [];
  const holoPositions = [];
  const palletPositions = [];
  for (let z = -30; z <= 310; z += 34) {
    benchPositions.push([-43, z], [43, z], [-76, z]);
    trashPositions.push([-41, z + 6], [41, z + 6], [-74, z + 6], [DOCKS_OFFSET_X - 30, Math.min(260, z)]);
  }
  for (let x = -150; x <= 48; x += 28) {
    holoPositions.push([x, 59], [x, 112], [x, 295]);
    palletPositions.push([x + 6, 82], [DOCKS_OFFSET_X + 36 + (Math.abs(x) % 90), 54 + (Math.abs(x) % 70)]);
  }

  const benchMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(2.1, 0.52, 0.65),
    new THREE.MeshStandardMaterial({ color: 0x26344d, roughness: 0.65 }),
    benchPositions.length
  );
  benchPositions.forEach(([bx, bz], i) => {
    dummy.position.set(bx, 0.34, bz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    benchMesh.setMatrixAt(i, dummy.matrix);
  });

  const trashMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.24, 0.2, 0.72, 8),
    new THREE.MeshStandardMaterial({ color: 0x1b263b, roughness: 0.5, metalness: 0.4 }),
    trashPositions.length
  );
  trashPositions.forEach(([tx, tz], i) => {
    dummy.position.set(tx, 0.42, tz);
    dummy.updateMatrix();
    trashMesh.setMatrixAt(i, dummy.matrix);
  });

  const holoMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.26, 2.3, 0.95),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.72 }),
    holoPositions.length
  );
  holoPositions.forEach(([hx, hz], i) => {
    dummy.position.set(hx, 1.25, hz);
    dummy.updateMatrix();
    holoMesh.setMatrixAt(i, dummy.matrix);
  });

  const palletMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.4, 0.85, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x3b3026, roughness: 0.85 }),
    palletPositions.length
  );
  palletPositions.forEach(([px, pz], i) => {
    dummy.position.set(px, 0.48, pz);
    dummy.updateMatrix();
    palletMesh.setMatrixAt(i, dummy.matrix);
  });

  refs.worldGroup.add(benchMesh, trashMesh, holoMesh, palletMesh);

  // 4. Prédios Distantes de Horizonte (InstancedMesh com textura de fachada + detalhes de telhado)
  const skyBuildings = [];
  for (let x = -720; x <= 980; x += 72) {
    skyBuildings.push([x, -420, 28 + (Math.abs(x) % 5) * 10]);
    skyBuildings.push([x, 860, 24 + (Math.abs(x) % 4) * 9]);
  }
  for (let z = -340; z <= 780; z += 76) {
    skyBuildings.push([-580, z, 30 + (Math.abs(z) % 5) * 8]);
    skyBuildings.push([980, z, 26 + (Math.abs(z) % 4) * 8]);
  }
  const skyTex = TextureGenerator.getBuildingFacadeTexture(3, 6);
  const horizonMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(26, 1, 26),
    new THREE.MeshStandardMaterial({
      color: 0xd8e4fa,
      map: skyTex,
      emissive: 0xffffff,
      emissiveMap: skyTex,
      emissiveIntensity: 0.78,
      roughness: 0.6
    }),
    skyBuildings.length
  );

  // Segundo conjunto de InstancedMesh para telhados (parapeitos, AC/geradores, antenas e sinalizadores)
  const roofParapetMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(26.8, 0.95, 26.8),
    new THREE.MeshStandardMaterial({ color: 0x182338, emissive: 0x0a2e4a, emissiveIntensity: 0.6, roughness: 0.55 }),
    skyBuildings.length
  );
  const roofAcMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(7.2, 2.2, 6.2),
    new THREE.MeshStandardMaterial({ color: 0x2a3750, roughness: 0.65, metalness: 0.35 }),
    skyBuildings.length
  );
  const roofAntennaMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.18, 0.35, 8.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.7 }),
    skyBuildings.length
  );
  const roofBeaconMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.55, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0044 }),
    skyBuildings.length
  );

  skyBuildings.forEach(([hx, hz, hh], i) => {
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(hx, hh / 2, hz);
    dummy.scale.set(1, hh, 1);
    dummy.updateMatrix();
    horizonMesh.setMatrixAt(i, dummy.matrix);

    dummy.scale.set(1, 1, 1);
    dummy.position.set(hx, hh + 0.45, hz);
    dummy.updateMatrix();
    roofParapetMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.set(hx - 4.5, hh + 1.1, hz + 3.5);
    dummy.updateMatrix();
    roofAcMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.set(hx + 5.0, hh + 4.25, hz - 4.0);
    dummy.updateMatrix();
    roofAntennaMesh.setMatrixAt(i, dummy.matrix);

    dummy.position.set(hx + 5.0, hh + 8.6, hz - 4.0);
    dummy.updateMatrix();
    roofBeaconMesh.setMatrixAt(i, dummy.matrix);
  });
  refs.worldGroup.add(horizonMesh, roofParapetMesh, roofAcMesh, roofAntennaMesh, roofBeaconMesh);
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
  ['COMPLEXO_CTOS', 'DOCAS_BAIA_SF', 'VIP_CAR_01', 'VIP_CAR_02', 'HEIST_BLUME_03', 'HEIST_CTOS_04', 'HEIST_VALKYRIE_05', 'RESCUE_01', 'RESCUE_02'].forEach((mKey) => {
    const mCfg = MAPS_CONFIG[mKey];
    const [mx, my, mz] = mCfg.markerPos;
    const color = mKey.startsWith('VIP_CAR')
      ? 0xd946ef
      : mKey === 'HEIST_BLUME_03'
      ? 0xff00aa
      : mKey === 'HEIST_CTOS_04'
      ? 0x00ff88
      : mKey === 'HEIST_VALKYRIE_05'
      ? 0xffaa00
      : mKey === 'RESCUE_01'
      ? 0x00f0ff
      : mKey === 'RESCUE_02'
      ? 0xffaa00
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

export function buildSteamPipes() {
  const pipeCoords = [
    [0, 35],
    [-32, 35],
    [32, 35],
    [-24, 58],
    [24, 58],
    [-60, 140],
    [-120, 240],
    [0, 320],
    [DOCKS_OFFSET_X, 35],
    [DOCKS_OFFSET_X + 30, 110]
  ];

  pipeCoords.forEach(([px, pz], idx) => {
    const py = getSurfaceHeight(px, pz);
    const normalMat = new THREE.MeshStandardMaterial({
      color: 0x1e2636,
      roughness: 0.7,
      metalness: 0.5
    });
    const nethackMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      wireframe: false
    });
    const grate = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.08, 16), normalMat);
    grate.position.set(px, py + 0.04, pz);
    grate.userData.normalMaterial = normalMat;
    grate.userData.nethackMaterial = nethackMat;
    refs.worldGroup.add(grate);
    hackableMeshes.push(grate);

    const pCount = 48;
    const pPos = new Float32Array(pCount * 3);
    const steamData = [];
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 1.6;
      pPos[i * 3 + 1] = Math.random() * 5.5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      steamData.push({ speed: 6.5 + Math.random() * 5.0 });
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const sMat = new THREE.PointsMaterial({
      color: 0xdff9ff,
      size: 0.95,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const steamPoints = new THREE.Points(sGeo, sMat);
    steamPoints.position.set(px, py + 0.1, pz);
    steamPoints.visible = false;
    refs.worldGroup.add(steamPoints);

    steamPipes.push({
      id: idx,
      pos: new THREE.Vector3(px, py, pz),
      mesh: grate,
      steamPoints,
      steamData,
      activeTimer: 0,
      cooldown: 0
    });
  });
}

export function buildStores() {
  const storeConfigs = [
    { type: 'STYLE', name: 'DEDSEC STYLE', x: -32, z: 68, w: 13, d: 11, color: 0xd946ef },
    { type: 'MOTORS', name: 'SF MOTORS', x: 0, z: 68, w: 17, d: 13, color: 0x00f0ff },
    { type: 'ARMORY', name: 'HACKSHOP ARMORY', x: 32, z: 68, w: 13, d: 11, color: 0xffaa00 }
  ];

  storeConfigs.forEach((st) => {
    const w = st.w;
    const d = st.d;
    const h = st.type === 'MOTORS' ? 5.0 : 4.4;
    const doorW = st.type === 'MOTORS' ? 5.6 : 4.6;
    const frontZ = st.z - d / 2;
    const backZ = st.z + d / 2;
    const segW = (w - doorW) / 2;

    // Piso interno iluminado
    addStaticBox(w - 0.6, 0.12, d - 0.6, st.x, 0.12, st.z, 0x11192c, {
      collide: false,
      occlude: false,
      edgesColor: st.color,
      edgesOpacity: 0.45
    });

    // Paredes laterais, fundo e fachada frontal com porta dupla aberta (voltada para -Z / rua)
    addStaticBox(0.55, h, d, st.x - w / 2, h / 2, st.z, 0x182136, { edgesColor: st.color, edgesOpacity: 0.55 });
    addStaticBox(0.55, h, d, st.x + w / 2, h / 2, st.z, 0x182136, { edgesColor: st.color, edgesOpacity: 0.55 });
    addStaticBox(w, h, 0.55, st.x, h / 2, backZ, 0x182136, { edgesColor: st.color, edgesOpacity: 0.55 });
    addStaticBox(segW, h, 0.55, st.x - (doorW / 2 + segW / 2), h / 2, frontZ, 0x182136, { edgesColor: st.color, edgesOpacity: 0.65 });
    addStaticBox(segW, h, 0.55, st.x + (doorW / 2 + segW / 2), h / 2, frontZ, 0x182136, { edgesColor: st.color, edgesOpacity: 0.65 });
    // Teto e marquise frontal com letreiro 3D legível (CanvasTexture)
    addStaticBox(w + 0.6, 0.45, d + 0.6, st.x, h + 0.22, st.z, 0x101726, { collide: true, occlude: false, edgesColor: st.color, edgesOpacity: 0.7 });
    const hexStr = `#${st.color.toString(16).padStart(6, '0')}`;
    const signLabel = st.type === 'ARMORY' ? 'HACKSHOP' : st.name;
    const signPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 1.65),
      new THREE.MeshBasicMaterial({ map: TextureGenerator.getNeonSignTexture(signLabel, hexStr), side: THREE.DoubleSide })
    );
    signPlane.position.set(st.x, h - 0.35, frontZ - 0.38);
    refs.worldGroup.add(signPlane);

    // Decoração interna específica de cada loja
    if (st.type === 'STYLE') {
      // Manequins neon no interior
      [-3.8, 3.8].forEach((mx, idx) => {
        const ped = addStaticBox(1.2, 0.35, 1.2, st.x + mx, 0.3, st.z + 2.2, 0x1e293b, { occlude: false, edgesColor: 0xd946ef });
        const manMat = new THREE.MeshBasicMaterial({ color: idx === 0 ? 0x00f0ff : 0xd946ef, wireframe: true });
        const manBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.7, 6, 10), manMat);
        manBody.position.set(st.x + mx, 1.25, st.z + 2.2);
        const manHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), manMat);
        manHead.position.set(st.x + mx, 1.92, st.z + 2.2);
        refs.worldGroup.add(manBody, manHead);
        void ped;
      });
    } else if (st.type === 'MOTORS') {
      // Plataforma giratória 3D com carro esporte em destaque + vitrines amplas
      const turntable = new THREE.Group();
      turntable.position.set(st.x, 0.24, st.z + 1.6);
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(3.1, 3.3, 0.22, 32),
        new THREE.MeshStandardMaterial({ color: 0x152238, roughness: 0.3, metalness: 0.7 })
      );
      const discTrim = new THREE.Mesh(
        new THREE.RingGeometry(3.05, 3.25, 32),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide })
      );
      discTrim.rotation.x = -Math.PI / 2;
      discTrim.position.y = 0.12;
      const { carGroup: demoCar } = buildCarMesh(0x0088ff, 0x00f0ff, false, 'SPORT', false);
      demoCar.position.y = 0.12;
      turntable.add(disc, discTrim, demoCar);
      refs.worldGroup.add(turntable);
      refs.showroomTurntable = turntable;
    } else {
      // Vitrines de armas no interior
      [-3.8, 3.8].forEach((wx) => {
        addStaticBox(1.8, 1.1, 0.9, st.x + wx, 0.7, st.z + 2.4, 0x1b2538, { occlude: false, edgesColor: 0xffaa00 });
        addStaticBox(1.2, 0.22, 0.25, st.x + wx, 1.38, st.z + 2.4, 0xffaa00, {
          collide: false,
          occlude: false,
          emissive: 0xffaa00,
          emissiveIntensity: 1.0
        });
      });
    }

    // Anel luminoso de ativação dentro da loja
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.85, 28),
      new THREE.MeshBasicMaterial({ color: st.color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = -Math.PI / 2;
    const triggerZ = st.type === 'MOTORS' ? st.z - 3.0 : st.z - 0.5;
    ring.position.set(st.x, 0.2, triggerZ);
    refs.worldGroup.add(ring);

    stores.push({
      type: st.type,
      name: st.name,
      pos: new THREE.Vector3(st.x, 0, triggerZ),
      ring,
      color: st.color
    });
  });
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

export function buildEnterableBuilding(x, z, w, h, d, opts = {}) {
  const accent = opts.accent || 0x00f0ff;
  const doorSide = opts.doorSide || 'EAST';
  const theme = opts.theme || 'CAFE';
  const floorH = 4.6;
  const doorW = 4.4;
  const wallT = 0.55;

  // Piso interno iluminado
  addStaticBox(w - 0.6, 0.14, d - 0.6, x, 0.12, z, 0x131c30, {
    collide: false,
    occlude: false,
    edgesColor: accent,
    edgesOpacity: 0.45
  });

  // Paredes do térreo (com vão de entrada livre na face voltada para a avenida)
  addStaticBox(w, floorH, wallT, x, floorH / 2, z - d / 2, 0x192338, { edgesColor: accent, edgesOpacity: 0.45 });
  addStaticBox(w, floorH, wallT, x, floorH / 2, z + d / 2, 0x192338, { edgesColor: accent, edgesOpacity: 0.45 });

  const segD = (d - doorW) / 2;
  const bHexStr = `#${accent.toString(16).padStart(6, '0')}`;
  const bTitle = opts.title || 'EDIFÍCIO ctOS';
  if (doorSide === 'EAST') {
    // Parede oeste fechada, parede leste com porta aberta
    addStaticBox(wallT, floorH, d, x - w / 2, floorH / 2, z, 0x192338, { edgesColor: accent, edgesOpacity: 0.45 });
    addStaticBox(wallT, floorH, segD, x + w / 2, floorH / 2, z - (doorW / 2 + segD / 2), 0x192338, { edgesColor: accent, edgesOpacity: 0.55 });
    addStaticBox(wallT, floorH, segD, x + w / 2, floorH / 2, z + (doorW / 2 + segD / 2), 0x192338, { edgesColor: accent, edgesOpacity: 0.55 });
    // Letreiro 3D legível acima da porta
    const bSign = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 1.45),
      new THREE.MeshBasicMaterial({ map: TextureGenerator.getNeonSignTexture(bTitle, bHexStr), side: THREE.DoubleSide })
    );
    bSign.rotation.y = Math.PI / 2;
    bSign.position.set(x + w / 2 + 0.38, floorH - 0.35, z);
    refs.worldGroup.add(bSign);
  } else {
    // Parede leste fechada, parede oeste com porta aberta
    addStaticBox(wallT, floorH, d, x + w / 2, floorH / 2, z, 0x192338, { edgesColor: accent, edgesOpacity: 0.45 });
    addStaticBox(wallT, floorH, segD, x - w / 2, floorH / 2, z - (doorW / 2 + segD / 2), 0x192338, { edgesColor: accent, edgesOpacity: 0.55 });
    addStaticBox(wallT, floorH, segD, x - w / 2, floorH / 2, z + (doorW / 2 + segD / 2), 0x192338, { edgesColor: accent, edgesOpacity: 0.55 });
    const bSign = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 1.45),
      new THREE.MeshBasicMaterial({ map: TextureGenerator.getNeonSignTexture(bTitle, bHexStr), side: THREE.DoubleSide })
    );
    bSign.rotation.y = -Math.PI / 2;
    bSign.position.set(x - w / 2 - 0.38, floorH - 0.35, z);
    refs.worldGroup.add(bSign);
  }

  // Laje do teto do térreo + torre superior estilizada (acima de y = floorH, sem bloquear interior)
  const upperH = Math.max(6, h - floorH);
  const facadeTex = TextureGenerator.getBuildingFacadeTexture(2, 3);
  const upperMat = new THREE.MeshStandardMaterial({
    color: 0xd0dcf5,
    map: facadeTex,
    emissive: 0x18253d,
    emissiveMap: facadeTex,
    emissiveIntensity: 0.65,
    roughness: 0.6
  });
  const upperMesh = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, upperH, d - 0.3), upperMat);
  upperMesh.position.set(x, floorH + upperH / 2, z);
  upperMesh.castShadow = true;
  upperMesh.userData.normalMaterial = upperMat;
  upperMesh.userData.nethackMaterial = new THREE.MeshBasicMaterial({ color: 0x0b3a5c, wireframe: true, transparent: true, opacity: 0.45 });
  structureMeshes.push(upperMesh);
  refs.worldGroup.add(upperMesh);
  // Colisão da torre superior (acima de y = floorH): bloqueia o Drone sem afetar quem anda no térreo
  upperMesh.updateMatrixWorld(true);
  colliders.push({ box: new THREE.Box3().setFromObject(upperMesh), mesh: upperMesh });

  // Tela holográfica na parede dos fundos
  const backX = doorSide === 'EAST' ? x - w / 2 + 0.45 : x + w / 2 - 0.45;
  addStaticBox(0.14, 1.8, 3.8, backX, 2.3, z, accent, {
    collide: false,
    occlude: false,
    emissive: accent,
    emissiveIntensity: 0.95
  });

  // Mobília interna com colisão e oclusão (para cobertura em tiroteios internos)
  const midDir = doorSide === 'EAST' ? -1 : 1;
  // Balcão / Parede divisória central baixa (cobertura tática)
  addStaticBox(1.1, 1.15, 4.6, x + midDir * 2.4, 0.65, z, 0x222f47, { edgesColor: accent, edgesOpacity: 0.6 });

  if (theme === 'CAFE' || theme === 'HIDEOUT') {
    // Mesas, cadeiras e sofá
    [-3.4, 3.4].forEach((oz) => {
      addStaticBox(1.6, 0.85, 1.6, x - midDir * 1.4, 0.48, z + oz, 0x26344d, { edgesColor: accent, edgesOpacity: 0.45 });
      addStaticBox(0.65, 0.55, 0.65, x - midDir * 2.5, 0.32, z + oz, 0x1b2438, { occlude: false });
    });
    // Sofá lateral
    addStaticBox(1.2, 0.85, 3.2, x + midDir * 4.6, 0.48, z - 3.6, 0x2d1e3e, { edgesColor: accent, edgesOpacity: 0.4 });
  } else {
    // Escritório ctOS / Oficina: mesas com terminais de computador e bancadas
    [-3.4, 3.4].forEach((oz) => {
      addStaticBox(2.2, 0.95, 1.1, x - midDir * 1.0, 0.52, z + oz, 0x202b40, { edgesColor: accent, edgesOpacity: 0.5 });
      addStaticBox(0.85, 0.55, 0.14, x - midDir * 1.0, 1.32, z + oz, accent, {
        collide: false,
        occlude: false,
        emissive: accent,
        emissiveIntensity: 0.9
      });
    });
  }

  // Caixa de Suprimentos interativa (+$100 ou +25 HP com E)
  const rewardType = theme === 'CAFE' || theme === 'GARAGE' ? 'MONEY' : 'HP';
  const supColor = rewardType === 'MONEY' ? 0x00ff88 : 0x00f0ff;
  const supX = x + midDir * 4.4;
  const supZ = z + 3.6;
  const supMesh = createHackableDevice(0.95, 0.72, 0.95, supX, 0.48, supZ, supColor, `SUPRIMENTO_${theme}`);
  supplyBoxes.push({
    id: supplyBoxes.length,
    mesh: supMesh,
    pos: new THREE.Vector3(supX, 0.48, supZ),
    rewardType,
    used: false
  });
  radarBuildings.push({ x, z, w, d });
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

  // Quarteirões urbanos: 4 prédios principais com portas abertas e interiores mobiliados + prédios laterais
  buildEnterableBuilding(-52, 16, 14, 18, 14, { accent: 0x00f0ff, doorSide: 'EAST', theme: 'CAFE', title: 'CAFÉ CYBER' });
  buildEnterableBuilding(-52, 42, 14, 22, 16, { accent: 0xffaa00, doorSide: 'EAST', theme: 'GARAGE', title: 'OFICINA DEDSEC' });
  buildDetailedBuilding(-52, -14, 14, 20, 16, { accent: 0x38bdf8 });
  buildEnterableBuilding(52, 16, 14, 19, 14, { accent: 0xff0055, doorSide: 'WEST', theme: 'OFFICE', title: 'ESCRITÓRIO ctOS' });
  buildEnterableBuilding(52, 42, 14, 24, 16, { accent: 0x00ff88, doorSide: 'WEST', theme: 'HIDEOUT', title: 'ESCONDERIJO DEDSEC' });
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

  // Inicia oculta: apenas a zona de extração da missão ativa em MISSION_STATE.ESCAPE fica visível
  group.visible = false;
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

  // Muro oeste dividido em três partes, deixando passagem ampla de 22m (Z: 24..46) na saída da ponte e vão livre de 20m (Z: 52..72) conectando o Píer ao pátio
  addStaticBox(1.2, 3.6, 49, dx - 44, 1.8, -0.5, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.4 });
  addStaticBox(1.2, 3.6, 6, dx - 44, 1.8, 49, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.4 });
  addStaticBox(1.2, 3.6, 12, dx - 44, 1.8, 78, 0x1b2236, { edgesColor: 0x00f0ff, edgesOpacity: 0.4 });

  // Sinalização e pórtico luminoso de acesso do Píer (Z = 52..72)
  addStaticBox(1.4, 5.0, 1.4, dx - 44, 2.5, 52, 0x222c42, { edgesColor: 0x00ff88, edgesOpacity: 0.8 });
  addStaticBox(1.4, 5.0, 1.4, dx - 44, 2.5, 72, 0x222c42, { edgesColor: 0x00ff88, edgesOpacity: 0.8 });
  addStaticBox(1.4, 0.7, 21.4, dx - 44, 5.35, 62, 0x182436, {
    collide: false,
    occlude: false,
    emissive: 0x00ff88,
    emissiveIntensity: 0.75,
    edgesColor: 0x00ff88,
    edgesOpacity: 0.9
  });

  // Faixa luminosa verde alinhada exatamente à borda oeste do cais das Docas (X = 400.15, Z = 52..72), sem saliências ou z-fighting
  addStaticBox(0.3, 0.06, 20.0, dx - 44.85, 0.03, 62, 0x00ff88, {
    collide: false,
    occlude: false,
    emissive: 0x00ff88,
    emissiveIntensity: 0.85
  });
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
    { x1: dx - 44, z1: 84, x2: dx - 44, z2: 72 },
    { x1: dx - 44, z1: 52, x2: dx - 44, z2: 46 },
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

export function buildCarMesh(color, neonTrim, isPatrol = false, bodyType = 'SPORT', hasDriver = false) {
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

  // Especificações por tipo de carroceria (SPORT, SUV, HATCH)
  const specs = {
    SPORT: {
      width: 1.88,
      frontZ: 2.28,
      rearZ: -2.26,
      wheelZ: 1.38,
      wheelRadius: 0.35,
      cabinY: 1.15,
      profile: [
        [-2.24, 0.30],
        [2.26, 0.30],
        [2.28, 0.56],
        [1.95, 0.72],
        [0.90, 0.80],
        [0.32, 1.16],
        [-0.95, 1.16],
        [-1.85, 0.84],
        [-2.24, 0.82]
      ]
    },
    SUV: {
      width: 1.98,
      frontZ: 2.24,
      rearZ: -2.22,
      wheelZ: 1.40,
      wheelRadius: 0.41,
      cabinY: 1.54,
      profile: [
        [-2.20, 0.40],
        [2.22, 0.40],
        [2.24, 0.86],
        [1.88, 0.98],
        [0.92, 1.02],
        [0.52, 1.56],
        [-1.78, 1.56],
        [-2.14, 1.06],
        [-2.20, 0.86]
      ]
    },
    HATCH: {
      width: 1.76,
      frontZ: 1.86,
      rearZ: -1.84,
      wheelZ: 1.18,
      wheelRadius: 0.34,
      cabinY: 1.34,
      profile: [
        [-1.82, 0.30],
        [1.84, 0.30],
        [1.86, 0.62],
        [1.48, 0.78],
        [0.72, 0.84],
        [0.22, 1.34],
        [-1.22, 1.34],
        [-1.78, 0.92],
        [-1.82, 0.68]
      ]
    }
  };
  const cfg = specs[bodyType] || specs.SPORT;

  // Perfil lateral extrudado com chanfros (ExtrudeGeometry)
  const shape = new THREE.Shape();
  shape.moveTo(cfg.profile[0][0], cfg.profile[0][1]);
  for (let i = 1; i < cfg.profile.length; i++) {
    shape.lineTo(cfg.profile[i][0], cfg.profile[i][1]);
  }
  shape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: cfg.width,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.05,
    bevelSegments: 2
  });
  bodyGeo.translate(0, 0, -cfg.width / 2);
  bodyGeo.rotateY(-Math.PI / 2);

  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.32,
    metalness: 0.68,
    emissive: neonTrim,
    emissiveIntensity: 0.08
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  body.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(bodyGeo, 28),
      new THREE.LineBasicMaterial({ color: neonTrim, transparent: true, opacity: 0.55 })
    )
  );
  registerPart(body, bodyMat, true);

  // Para-choques dianteiro e traseiro
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x161d2b, roughness: 0.55, metalness: 0.5 });
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.10, 0.22, 0.22), bumperMat);
  frontBumper.position.set(0, bodyType === 'SUV' ? 0.46 : 0.34, cfg.frontZ + 0.04);
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.10, 0.24, 0.22), bumperMat);
  rearBumper.position.set(0, bodyType === 'SUV' ? 0.46 : 0.34, cfg.rearZ - 0.04);
  registerPart(frontBumper, bumperMat);
  registerPart(rearBumper, bumperMat);

  // Grade frontal iluminada & Faróis chanfrados + Lanternas traseiras
  const grilleMat = new THREE.MeshBasicMaterial({ color: neonTrim });
  const grille = new THREE.Mesh(new THREE.BoxGeometry(cfg.width * 0.46, 0.12, 0.06), grilleMat);
  grille.position.set(0, bodyType === 'SUV' ? 0.68 : 0.50, cfg.frontZ + 0.08);
  registerPart(grille, grilleMat);

  const headMat = new THREE.MeshBasicMaterial({ color: 0xdff9ff });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
  const beamMat = new THREE.MeshBasicMaterial({
    map: TextureGenerator.getHeadlightBeamTexture(),
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false
  });
  const tailGlowMat = new THREE.MeshBasicMaterial({
    color: 0xff0044,
    transparent: true,
    opacity: 0.20,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  [-1, 1].forEach((side) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.12), headMat);
    hl.position.set(side * (cfg.width * 0.34), bodyType === 'SUV' ? 0.72 : 0.54, cfg.frontZ + 0.06);
    hl.rotation.y = side * -0.18;
    registerPart(hl, headMat);

    // Feixe luminoso plano no chão à frente do carro (visível do alto sem criar PointLights)
    // Feixe cônico degradê saindo de cada farol dianteiro (puramente visual: sem colisão)
    const beamGeo = new THREE.PlaneGeometry(2.0, 6.8);
    // Bounding box vazia: Box3.setFromObject(carGroup) ignora o feixe e o colisor do carro não cresce
    beamGeo.boundingBox = new THREE.Box3();
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.name = 'headlightBeam';
    beam.userData.noCollide = true;
    beam.renderOrder = 2;
    beam.raycast = () => {};
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(side * (cfg.width * 0.32), 0.08, cfg.frontZ + 0.12 + 3.4);
    carGroup.add(beam);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.14), tailMat);
    tl.position.set(side * (cfg.width * 0.33), bodyType === 'SUV' ? 0.78 : 0.64, cfg.rearZ - 0.07);
    tl.rotation.y = side * 0.14;
    registerPart(tl, tailMat);
  });

  const rearGlow = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width * 0.95, 1.4), tailGlowMat);
  rearGlow.rotation.x = -Math.PI / 2;
  rearGlow.position.set(0, 0.07, cfg.rearZ - 0.75);
  carGroup.add(rearGlow);

  // Vidros semitransparentes (opacity: 0.45) para enxergar o interior/motorista
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1a3558,
    roughness: 0.12,
    metalness: 0.85,
    transparent: true,
    opacity: 0.45
  });
  const glassCabin = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width - 0.16, bodyType === 'SPORT' ? 0.34 : 0.44, bodyType === 'HATCH' ? 1.55 : 1.95),
    glassMat
  );
  glassCabin.position.set(0, cfg.cabinY - (bodyType === 'SPORT' ? 0.14 : 0.18), bodyType === 'SUV' ? -0.35 : -0.25);
  registerPart(glassCabin, glassMat);

  // Retrovisores laterais
  const mirrorMat = new THREE.MeshStandardMaterial({ color: 0x111726, roughness: 0.4 });
  [-1, 1].forEach((side) => {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.11, 0.14), mirrorMat);
    mirror.position.set(side * (cfg.width / 2 + 0.11), bodyType === 'SUV' ? 1.06 : 0.84, 0.52);
    registerPart(mirror, mirrorMat);
  });

  // Detalhes específicos por modelo
  if (bodyType === 'SPORT') {
    // Aerofólio e difusor traseiro
    const wing = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.06, 0.07, 0.32), bumperMat);
    wing.position.set(0, 1.04, cfg.rearZ + 0.18);
    registerPart(wing, bumperMat);
    [-0.55, 0.55].forEach((px) => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.18), bumperMat);
      pylon.position.set(px, 0.92, cfg.rearZ + 0.20);
      registerPart(pylon, bumperMat);
    });
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(cfg.width * 0.72, 0.14, 0.14), grilleMat);
    diffuser.position.set(0, 0.25, cfg.rearZ - 0.06);
    registerPart(diffuser, grilleMat);
  } else if (bodyType === 'SUV') {
    // Quebra-mato frontal e rack de teto
    const bullBar = new THREE.Mesh(new THREE.BoxGeometry(cfg.width * 0.64, 0.34, 0.14), bumperMat);
    bullBar.position.set(0, 0.62, cfg.frontZ + 0.14);
    registerPart(bullBar, bumperMat);
    [-0.65, 0.65].forEach((rx) => {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.85), bumperMat);
      rack.position.set(rx, 1.62, -0.58);
      registerPart(rack, bumperMat);
    });
  }

  // Rodas (CylinderGeometry) com calotas/aros neon
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x10131b, roughness: 0.85 });
  const rimMat = new THREE.MeshBasicMaterial({ color: neonTrim });
  const wheelGeo = new THREE.CylinderGeometry(cfg.wheelRadius, cfg.wheelRadius, 0.28, 16);
  const rimGeo = new THREE.CylinderGeometry(cfg.wheelRadius * 0.58, cfg.wheelRadius * 0.58, 0.30, 12);
  const halfTrack = cfg.width / 2 + 0.02;
  [
    [-halfTrack, cfg.wheelRadius, cfg.wheelZ],
    [halfTrack, cfg.wheelRadius, cfg.wheelZ],
    [-halfTrack, cfg.wheelRadius, -cfg.wheelZ],
    [halfTrack, cfg.wheelRadius, -cfg.wheelZ]
  ].forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    registerPart(wheel, wheelMat);

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(wx, wy, wz);
    registerPart(rim, rimMat);
  });

  // Giroflex azul/vermelho piscando para viaturas ctOS
  if (isPatrol) {
    const blueMat = new THREE.MeshBasicMaterial({ color: 0x0088ff });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const sirenY = bodyType === 'SUV' ? 1.66 : cfg.cabinY + 0.12;
    const barL = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.24), blueMat);
    barL.position.set(-0.26, sirenY, -0.25);
    const barR = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.24), redMat);
    barR.position.set(0.26, sirenY, -0.25);
    carGroup.add(barL, barR);
    sirenLights.push({ blueMat, redMat, phase: Math.random() * Math.PI * 2 });
  }

  // Motorista NPC 3D visível no banco do motorista
  let driverMesh = null;
  if (hasDriver) {
    driverMesh = new THREE.Group();
    const drvY = bodyType === 'SUV' ? 0.92 : 0.64;
    driverMesh.position.set(0.38, drvY, 0.05);

    const drvJacket = new THREE.MeshStandardMaterial({ color: isPatrol ? 0x1e293b : 0x334155, roughness: 0.7 });
    const drvSkin = new THREE.MeshStandardMaterial({ color: 0xc69072, roughness: 0.65 });
    const drvTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.24, 6, 10), drvJacket);
    drvTorso.position.y = 0.18;
    const drvHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), drvSkin);
    drvHead.position.y = 0.45;
    const drvHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.135, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 })
    );
    drvHair.position.y = 0.46;
    driverMesh.add(drvTorso, drvHead, drvHair);
    carGroup.add(driverMesh);
  }

  return { carGroup, bodyMesh: body, driverMesh };
}

export function buildCars() {
  const worldCars = [
    { x: -10, z: 42, yaw: Math.PI / 2, color: 0x111827, neon: 0x00f0ff, bodyType: 'SPORT', isDedsec: true, isDrivable: true, maxHp: 100, hasDriver: false },
    { x: -42, z: -24, yaw: Math.PI * 0.5, color: 0xcc22ff, neon: 0xd946ef, bodyType: 'SPORT', isDedsec: false, isDrivable: true, maxHp: 120, vipMissionKey: 'VIP_CAR_01', hasDriver: false },
    { x: DOCKS_OFFSET_X + 76, z: 14, yaw: -Math.PI * 0.5, color: 0x3b4252, neon: 0xd946ef, bodyType: 'SUV', isDedsec: false, isDrivable: true, maxHp: 220, vipMissionKey: 'VIP_CAR_02', hasDriver: false },
    { x: -195, z: 222, yaw: Math.PI, color: 0x0b0e17, neon: 0xff00aa, bodyType: 'SPORT', isDedsec: false, isDrivable: true, maxHp: 240, maxSpeed: 21, accel: 20, vipMissionKey: 'HEIST_BLUME_03', requiresGateUnlock: true, hasDriver: false },
    { x: 495, z: 168, yaw: Math.PI, color: 0x0f172a, neon: 0x00f0ff, bodyType: 'SPORT', isDedsec: false, isDrivable: true, maxHp: 300, maxSpeed: 24, accel: 22, hasNitro: true, vipMissionKey: 'HEIST_CTOS_04', requiresGateUnlock: true, hasDriver: false },
    { x: -220, z: 392, yaw: Math.PI, color: 0x0a0d16, neon: 0xffaa00, bodyType: 'SPORT', isDedsec: false, isDrivable: true, maxHp: 320, maxSpeed: 36, accel: 34, hasNitro: true, vipMissionKey: 'HEIST_VALKYRIE_05', requiresGateUnlock: true, hasDriver: false },
    { x: -40, z: 28, yaw: 0, color: 0x141720, neon: 0xff0044, bodyType: 'SUV', isDedsec: false, isDrivable: true, isPatrol: true, hasDriver: true },
    { x: 16, z: 16, yaw: -Math.PI / 2, color: 0x141720, neon: 0xff0044, bodyType: 'SUV', isDedsec: false, isDrivable: true, isPatrol: true, hasDriver: true },
    { x: -16, z: 16, yaw: Math.PI / 2, color: 0x26314a, neon: 0xffaa00, bodyType: 'HATCH', isDedsec: false, isDrivable: true, hasDriver: true },
    { x: 24, z: 42, yaw: -Math.PI / 2, color: 0x2b1d38, neon: 0xff0055, bodyType: 'SPORT', isDedsec: false, isDrivable: true, hasDriver: true },
    { x: -24, z: 46, yaw: 0, color: 0x1e2b3a, neon: 0x38bdf8, bodyType: 'HATCH', isDedsec: false, isDrivable: true, hasDriver: true },
    { x: -40, z: 38, yaw: Math.PI, color: 0x202a3c, neon: 0x00f0ff, bodyType: 'HATCH', isDedsec: false, isDrivable: true, hasDriver: true },
    { x: DOCKS_OFFSET_X + 20, z: 36, yaw: -Math.PI / 2, color: 0x141720, neon: 0xff0044, bodyType: 'SUV', isDedsec: false, isDrivable: true, isPatrol: true, hasDriver: true },
    { x: DOCKS_OFFSET_X - 22, z: 38, yaw: Math.PI / 2, color: 0x26314a, neon: 0xffaa00, bodyType: 'HATCH', isDedsec: false, isDrivable: true, hasDriver: true }
  ];

  worldCars.forEach((carCfg, idx) => {
    const { carGroup, bodyMesh, driverMesh } = buildCarMesh(
      carCfg.color,
      carCfg.neon,
      !!carCfg.isPatrol,
      carCfg.bodyType || 'SPORT',
      !!carCfg.hasDriver
    );
    carGroup.position.set(carCfg.x, 0, carCfg.z);
    carGroup.rotation.y = carCfg.yaw;
    refs.worldGroup.add(carGroup);

    const isDrivable = !!(carCfg.isDedsec || carCfg.isDrivable);
    const headlight = null;

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
      driverMesh,
      initialHasDriver: !!carCfg.hasDriver,
      hasDriver: !!carCfg.hasDriver,
      colliderObj,
      initialPos: new THREE.Vector3(carCfg.x, 0, carCfg.z),
      initialYaw: carCfg.yaw,
      initialColor: carCfg.color,
      isDedsec: !!carCfg.isDedsec,
      isDrivable,
      vipMissionKey: carCfg.vipMissionKey || null,
      requiresGateUnlock: !!carCfg.requiresGateUnlock,
      maxSpeed: carCfg.maxSpeed || 18,
      accel: carCfg.accel || 18,
      hasNitro: !!carCfg.hasNitro,
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

export function buildTrafficCars() {
  const routes = [
    // Rota 0: Avenida Principal Externa de Downtown (Sentido Horário, mãos separadas)
    [[-36, 16], [36, 16], [36, 59], [-36, 59]],
    // Rota 1: Avenida Principal Interna de Downtown (Sentido Anti-Horário, faixa distinta sem frente-a-frente)
    [[28, 22], [-28, 22], [-28, 53], [28, 53]],
    // Rota 2: Golden Gate <-> Docas (Ida Leste Z=30 / Volta Oeste Z=40)
    [[20, 30], [422, 30], [472, 30], [472, 40], [422, 40], [20, 40]],
    // Rota 3: Downtown <-> Golden Gate (Mesma mão direcional: Leste Z=30 / Oeste Z=40)
    [[458, 40], [60, 40], [-30, 40], [-30, 30], [60, 30], [458, 30]],
    // Rota 4: Avenida Oeste (Sul X=-68 / Norte X=-58) <-> Ponte Sul (Leste Z=316 / Oeste Z=324)
    [[-68, -24], [-68, 316], [436, 316], [436, 324], [-58, 324], [-58, -24]],
    // Rota 5: Circuito Distrito Sul <-> Garagem DedSec <-> Ponte Sul (Mesma mão direcional)
    [[416, 324], [-58, 324], [-58, 186], [-126, 186], [-126, 316], [416, 316]]
  ];

  const baseConfigs = [
    // 10 carros circulando continuamente nas avenidas centrais de Downtown (Complexo ctOS & Lojas)
    { bodyType: 'HATCH', color: 0x2a3b5c, neon: 0x00f0ff, isPatrol: false, routeIdx: 0, startWp: 0, speed: 9.5 },
    { bodyType: 'SPORT', color: 0x6b21a8, neon: 0xd946ef, isPatrol: false, routeIdx: 0, startWp: 1, speed: 12.0 },
    { bodyType: 'SUV', color: 0x141720, neon: 0xff0044, isPatrol: true, routeIdx: 0, startWp: 2, speed: 10.5 },
    { bodyType: 'HATCH', color: 0x1e3a5f, neon: 0x38bdf8, isPatrol: false, routeIdx: 0, startWp: 3, speed: 9.2 },
    { bodyType: 'SPORT', color: 0x14532d, neon: 0x00ff88, isPatrol: false, routeIdx: 1, startWp: 0, speed: 11.8 },
    { bodyType: 'SUV', color: 0x141720, neon: 0xff0044, isPatrol: true, routeIdx: 1, startWp: 1, speed: 10.5 },
    { bodyType: 'HATCH', color: 0x334155, neon: 0xffaa00, isPatrol: false, routeIdx: 1, startWp: 2, speed: 9.0 },
    { bodyType: 'SPORT', color: 0x3b0764, neon: 0xff0055, isPatrol: false, routeIdx: 1, startWp: 3, speed: 12.4 },
    { bodyType: 'HATCH', color: 0x1d4ed8, neon: 0x00f0ff, isPatrol: false, routeIdx: 0, startWp: 0, speed: 9.8 },
    { bodyType: 'SPORT', color: 0x991b1b, neon: 0xffaa00, isPatrol: false, routeIdx: 1, startWp: 2, speed: 11.6 },
    // 10 carros na Ponte Golden Gate <-> Docas
    { bodyType: 'SPORT', color: 0x0f766e, neon: 0x00ff88, isPatrol: false, routeIdx: 2, startWp: 0, speed: 12.5 },
    { bodyType: 'SUV', color: 0x334155, neon: 0xffaa00, isPatrol: false, routeIdx: 2, startWp: 1, speed: 10.0 },
    { bodyType: 'HATCH', color: 0x1e293b, neon: 0x00f0ff, isPatrol: false, routeIdx: 2, startWp: 2, speed: 9.8 },
    { bodyType: 'SUV', color: 0x141720, neon: 0xff0044, isPatrol: true, routeIdx: 2, startWp: 3, speed: 11.2 },
    { bodyType: 'SPORT', color: 0x4c1d95, neon: 0xd946ef, isPatrol: false, routeIdx: 2, startWp: 4, speed: 12.6 },
    { bodyType: 'HATCH', color: 0x475569, neon: 0x38bdf8, isPatrol: false, routeIdx: 3, startWp: 0, speed: 9.8 },
    { bodyType: 'SPORT', color: 0x7f1d1d, neon: 0xff0044, isPatrol: false, routeIdx: 3, startWp: 1, speed: 12.0 },
    { bodyType: 'SUV', color: 0x141720, neon: 0xff0044, isPatrol: true, routeIdx: 3, startWp: 2, speed: 11.0 },
    { bodyType: 'HATCH', color: 0x1e3a5f, neon: 0x00f0ff, isPatrol: false, routeIdx: 3, startWp: 3, speed: 9.4 },
    { bodyType: 'SUV', color: 0x26314a, neon: 0xffaa00, isPatrol: false, routeIdx: 3, startWp: 4, speed: 10.4 },
    // 10 carros na Avenida Oeste, Distrito Sul e Ponte Sul
    { bodyType: 'HATCH', color: 0x3b2f4a, neon: 0xff0055, isPatrol: false, routeIdx: 4, startWp: 0, speed: 9.5 },
    { bodyType: 'SPORT', color: 0x1e293b, neon: 0x00f0ff, isPatrol: false, routeIdx: 4, startWp: 1, speed: 12.2 },
    { bodyType: 'SUV', color: 0x141720, neon: 0xff0044, isPatrol: true, routeIdx: 4, startWp: 2, speed: 10.8 },
    { bodyType: 'HATCH', color: 0x0f172a, neon: 0x00ff88, isPatrol: false, routeIdx: 4, startWp: 3, speed: 9.6 },
    { bodyType: 'SPORT', color: 0x581c87, neon: 0xd946ef, isPatrol: false, routeIdx: 4, startWp: 4, speed: 12.5 },
    { bodyType: 'SUV', color: 0x26314a, neon: 0xffaa00, isPatrol: false, routeIdx: 5, startWp: 0, speed: 10.2 },
    { bodyType: 'HATCH', color: 0x1f2937, neon: 0x38bdf8, isPatrol: false, routeIdx: 5, startWp: 1, speed: 9.2 },
    { bodyType: 'SPORT', color: 0x115e59, neon: 0x00f0ff, isPatrol: false, routeIdx: 5, startWp: 2, speed: 12.1 },
    { bodyType: 'SUV', color: 0x141720, neon: 0xff0044, isPatrol: true, routeIdx: 5, startWp: 3, speed: 10.9 },
    { bodyType: 'HATCH', color: 0x312e81, neon: 0xff0055, isPatrol: false, routeIdx: 5, startWp: 4, speed: 9.4 }
  ];
  const configs = baseConfigs;

  configs.forEach((cfg, i) => {
    const waypoints = routes[cfg.routeIdx];
    const [sx, sz] = waypoints[cfg.startWp];
    const nextWp = (cfg.startWp + 1) % waypoints.length;
    const [nx, nz] = waypoints[nextWp];
    const yaw = Math.atan2(nx - sx, nz - sz);

    const { carGroup, bodyMesh, driverMesh } = buildCarMesh(cfg.color, cfg.neon, cfg.isPatrol, cfg.bodyType, true);
    const sy = getSurfaceHeight(sx, sz);
    carGroup.position.set(sx, sy, sz);
    carGroup.rotation.y = yaw;
    refs.worldGroup.add(carGroup);

    const headlight = null;

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
    const smokePoints = new THREE.Points(
      smokeGeo,
      new THREE.PointsMaterial({ color: 0x2b2b2b, size: 0.55, transparent: true, opacity: 0.75, depthWrite: false })
    );
    smokePoints.visible = false;
    carGroup.add(smokePoints);

    carGroup.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(carGroup);
    const colliderObj = { box, mesh: bodyMesh, carIndex: cars.length, isTrafficCar: true };
    colliders.push(colliderObj);
    occluders.push(bodyMesh);

    const carObj = {
      id: 100 + i,
      mesh: carGroup,
      bodyMesh,
      driverMesh,
      initialHasDriver: true,
      hasDriver: true,
      isTraffic: true,
      waypoints,
      currentTarget: nextWp,
      baseSpeed: cfg.speed,
      hornCooldown: Math.random() * 2,
      colliderObj,
      initialPos: new THREE.Vector3(sx, sy, sz),
      initialYaw: yaw,
      initialColor: cfg.color,
      isDedsec: false,
      isDrivable: true,
      vipMissionKey: null,
      maxHp: cfg.bodyType === 'SUV' ? 140 : 100,
      hp: cfg.bodyType === 'SUV' ? 140 : 100,
      destroyed: false,
      smokePoints,
      smokeData,
      speed: cfg.speed,
      hackedTimer: 0,
      hackedUsed: false,
      headlight
    };
    cars.push(carObj);
    trafficCars.push(carObj);
  });
}

export function buildPedestrians() {
  const profiles = [
    ['Lucas Vance', 'Eng. de Redes ctOS'],
    ['Marina Sato', 'Analista de Dados Blume'],
    ['Rafael Cruz', 'Desenvolvedor Indie'],
    ['Camila Ortiz', 'Jornalista Investigativa'],
    ['Bruno Meyer', 'Técnico de Fibra Óptica'],
    ['Sofia Alencar', 'Arquiteta Urbana'],
    ['Diego Nogueira', 'Operador Portuário'],
    ['Helena Park', 'Pesquisadora de IA'],
    ['Tiago Borges', 'Entregador Autônomo'],
    ['Larissa Kurosawa', 'Designer Holográfica'],
    ['Mateus Silva', 'Segurança Privado'],
    ['Ana Beatriz', 'Médica de Emergência'],
    ['Gabriel Costa', 'DJ Underground'],
    ['Beatriz Lin', 'Corretora Financeira'],
    ['Felipe Rocha', 'Mecânico de Drones'],
    ['Juliana Duarte', 'Advogada Corporativa'],
    ['Pedro Henrique', 'Estudante de Robótica'],
    ['Vitoria Ramos', 'Produtora Musical'],
    ['Daniel Mendes', 'Fiscal de Tráfego'],
    ['Clara Freitas', 'Fotógrafa Urbana'],
    ['Renato Alves', 'Consultor de Cibersegurança'],
    ['Fernanda Lima', 'Estilista DedSec'],
    ['Thiago Martins', 'Piloto de Drone'],
    ['Isabela Gomes', 'Biohacker'],
    ['Leonardo Dias', 'Analista Financeiro'],
    ['Amanda Ferreira', 'Curadora Digital'],
    ['Vinicius Prado', 'Engenheiro Elétrico'],
    ['Carolina Nunes', 'Influenciadora Tech'],
    ['Henrique Souza', 'Técnico de Servidores'],
    ['Leticia Barbosa', 'Barista Cyber Café'],
    ['Gustavo Vieira', 'Vendedor SF Motors'],
    ['Natalia Cardoso', 'Pesquisadora de Redes'],
    ['Eduardo Teixeira', 'Motorista de App'],
    ['Mariana Ribeiro', 'Designer de Moda'],
    ['Caio Moreira', 'Especialista em Cripto'],
    ['Bianca Correia', 'Repórter de Campo'],
    ['Rodrigo Monteiro', 'Operador de Guindaste'],
    ['Aline Cavalcanti', 'Arquiteta de Nuvem'],
    ['Igor Nascimento', 'Músico Synthwave'],
    ['Priscila Azevedo', 'Auditora ctOS'],
    ['Murilo Campos', 'Estudante de TI'],
    ['Tatiane Castro', 'Gerente Portuária'],
    ['Andreia Lopes', 'Tatuadora Neon'],
    ['Samuel Farias', 'Atleta Parkour'],
    ['Heloisa Pires', 'Engenheira de Dados']
  ];

  const jacketColors = [0x00c8ff, 0xff2a85, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xef4444, 0x38bdf8, 0xec4899];
  const pantsColors = [0x111827, 0x1e293b, 0x312e81, 0x27272a];
  const skinColors = [0xc89678, 0xe0b596, 0x8d5524, 0xf1c27d];
  // Rotas seguras exclusivamente nas calçadas elevadas, praças e parques (longe das faixas de rolamento)
  const sidewalkPaths = [
    [[-44, 62], [-12, 62], [12, 62], [44, 62]],            // Calçada frontal das 3 Lojas (ao sul da pista Z=59)
    [[-45, 4], [-45, 24], [-47, 24], [-47, 4]],            // Calçada Oeste Norte de Downtown
    [[45, 4], [45, 24], [47, 24], [47, 4]],                // Calçada Leste Norte de Downtown
    [[-12, 44], [12, 44], [12, 50], [-12, 50]],            // Praça central da extração (entre Z=40 e Z=53)
    [[-122, 78], [-102, 78], [-102, 94], [-122, 94]],      // Parque Verde Downtown Oeste
    [[-12, 118], [12, 118], [12, 130], [-12, 130]],        // Parque Verde Sul
    [[-138, 244], [-118, 244], [-118, 260], [-138, 260]],  // Praça Distrito Sul
    [[DOCKS_OFFSET_X - 36, 48], [DOCKS_OFFSET_X - 14, 48], [DOCKS_OFFSET_X - 14, 70], [DOCKS_OFFSET_X - 36, 70]], // Calçada Docas Oeste
    [[DOCKS_OFFSET_X + 14, 48], [DOCKS_OFFSET_X + 36, 48], [DOCKS_OFFSET_X + 36, 70], [DOCKS_OFFSET_X + 14, 70]]  // Calçada Docas Leste
  ];

  profiles.forEach(([name, job], i) => {
    const pedGroup = new THREE.Group();
    const jCol = jacketColors[i % jacketColors.length];
    const jacketMat = new THREE.MeshStandardMaterial({
      color: jCol,
      emissive: jCol,
      emissiveIntensity: 0.18,
      roughness: 0.65
    });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColors[i % pantsColors.length], roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColors[i % skinColors.length], roughness: 0.65 });
    const hairMat = new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0x3b2314 : 0x111827, roughness: 0.8 });

    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.44, 4, 8), pantsMat);
    legL.position.set(-0.10, 0.42, 0);
    legL.castShadow = true;
    const legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.44, 4, 8), pantsMat);
    legR.position.set(0.10, 0.42, 0);
    legR.castShadow = true;

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.34, 6, 10), jacketMat);
    torso.scale.set(1.1, 1.0, 0.75);
    torso.position.y = 1.12;
    torso.castShadow = true;

    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.36, 4, 8), jacketMat);
    armL.position.set(-0.24, 1.12, 0);
    const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.36, 4, 8), jacketMat);
    armR.position.set(0.24, 1.12, 0);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), skinMat);
    head.position.y = 1.56;
    head.castShadow = true;
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.152, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    hair.position.y = 1.57;

    // Ícone de telefone vermelho piscando acima da cabeça ao denunciar crime
    const phoneIcon = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.34, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xff0033 })
    );
    phoneIcon.position.set(0, 2.15, 0);
    phoneIcon.visible = false;

    pedGroup.add(legL, legR, torso, armL, armR, head, hair, phoneIcon);

    const path = sidewalkPaths[i % sidewalkPaths.length];
    const startIdx = i % path.length;
    const nextIdx = (startIdx + 1) % path.length;
    const t = ((i * 0.27) % 0.85) + 0.08;
    const px = THREE.MathUtils.lerp(path[startIdx][0], path[nextIdx][0], t);
    const pz = THREE.MathUtils.lerp(path[startIdx][1], path[nextIdx][1], t);
    pedGroup.position.set(px, getSurfaceHeight(px, pz), pz);
    refs.worldGroup.add(pedGroup);

    const wps = path.map(([wx, wz]) => [wx, wz]);

    pedestrians.push({
      id: i,
      mesh: pedGroup,
      legL,
      legR,
      armL,
      armR,
      phoneIcon,
      waypoints: wps,
      currentTarget: nextIdx,
      walkSpeed: 1.8 + (i % 4) * 0.25,
      phase: Math.random() * Math.PI * 2,
      panickedTimer: 0,
      panicDirX: 1,
      panicDirZ: 0,
      callingPolice: false,
      callTimer: 0,
      crimeSeverity: 1,
      stunnedTimer: 0,
      profile: { name, job, hacked: false }
    });
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

  // Espuma / ondulação suave ao redor do casco na linha da água
  const hullFoam = new THREE.Mesh(
    new THREE.RingGeometry(1.6, 2.7, 24),
    new THREE.MeshBasicMaterial({
      color: 0x99f0ff,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide
    })
  );
  hullFoam.rotation.x = -Math.PI / 2;
  hullFoam.position.set(0, -0.05, 0.4);
  hullFoam.name = 'hullFoam';

  boatGroup.add(hull, bow, bowTip, cabin, motor, motorNeon, hullFoam);
  return boatGroup;
}

export function buildBoatPiersAndBoats() {
  // Píeres de embarque flutuantes (y = -0.25) com rampas inclinadas conectando a calçada (y = 0)
  const pierMatColor = 0x1c263b;
  const pierMatOpts = { collide: false, occlude: false };

  // Píer Oeste 1 (Centro Urbano: X: 72..82, Z = 62)
  const rampW1 = addStaticBox(5.0, 0.2, 7.0, 74.5, -0.125, 62, 0x202b42, pierMatOpts);
  rampW1.rotation.z = -0.05;
  addStaticBox(5.0, 0.35, 7.0, 79.5, -0.425, 62, pierMatColor, { ...pierMatOpts, edgesColor: 0x00f0ff, edgesOpacity: 0.65 });

  // Píer Oeste 2 (Sul Downtown: X: 72..82, Z = 220)
  const rampW2 = addStaticBox(5.0, 0.2, 7.0, 74.5, -0.125, 220, 0x202b42, pierMatOpts);
  rampW2.rotation.z = -0.05;
  addStaticBox(5.0, 0.35, 7.0, 79.5, -0.425, 220, pierMatColor, { ...pierMatOpts, edgesColor: 0xffaa00, edgesOpacity: 0.65 });

  // Píer Leste 1 (Docas: X: 396..406, Z = 62)
  const rampE1 = addStaticBox(5.0, 0.2, 7.0, 403.5, -0.125, 62, 0x202b42, pierMatOpts);
  rampE1.rotation.z = 0.05;
  addStaticBox(5.0, 0.35, 7.0, 398.5, -0.425, 62, pierMatColor, { ...pierMatOpts, edgesColor: 0x00ff88, edgesOpacity: 0.65 });

  // Píer Leste 2 (Industrial Norte: X: 396..406, Z = -120)
  const rampE2 = addStaticBox(5.0, 0.2, 7.0, 403.5, -0.125, -120, 0x202b42, pierMatOpts);
  rampE2.rotation.z = 0.05;
  addStaticBox(5.0, 0.35, 7.0, 398.5, -0.425, -120, pierMatColor, { ...pierMatOpts, edgesColor: 0xff0055, edgesOpacity: 0.65 });

  // Lanchas posicionadas totalmente dentro da água (x >= 84 no lado oeste e x <= 392 no lado leste, sem proa atravessar o cais)
  const boatConfigs = [
    { x: 86, z: 62, yaw: Math.PI / 2, color: 0x111a2e, neon: 0x00f0ff },
    { x: 390, z: 62, yaw: -Math.PI / 2, color: 0x111a2e, neon: 0x00ff88 },
    { x: 86, z: 220, yaw: Math.PI / 2, color: 0x141f36, neon: 0xffaa00 },
    { x: 390, z: -120, yaw: -Math.PI / 2, color: 0x141f36, neon: 0xff0055 }
  ];

  boatConfigs.forEach((bCfg, idx) => {
    const mesh = buildBoatMesh(bCfg.color, bCfg.neon);
    mesh.position.set(bCfg.x, -0.42, bCfg.z);
    mesh.rotation.y = bCfg.yaw;
    refs.worldGroup.add(mesh);

    // Rastro ciano na popa
    const wakeCount = 24;
    const wakePos = new Float32Array(wakeCount * 3);
    const wakeData = [];
    for (let i = 0; i < wakeCount; i++) {
      wakePos[i * 3] = bCfg.x;
      wakePos[i * 3 + 1] = -0.42;
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
      initialPos: new THREE.Vector3(bCfg.x, -0.42, bCfg.z),
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
  gameState.hp = gameState.maxHp || 100;
  gameState.damageFlashTimer = 0;
  gameState.baseAlert = false;
  gameState.wantedLevel = 0;
  gameState.wantedCooldown = 0;
  gameState.wantedStatus = 'OCULTO';
  gameState.ctosRevealTimer = 0;
  gameState.policeSpawnCooldown = 0;
  gameState.blackoutTimer = 0;
  gameState.blackoutCooldown = 0;
  gameState.droneActive = false;
  if (refs.droneGroup) refs.droneGroup.visible = false;
  if (dom.droneHud) dom.droneHud.classList.add('hidden');
  if (dom.ctosRevealBanner) dom.ctosRevealBanner.classList.add('hidden');
  updateWantedHUD();
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
  gameState.playerVelY = 0;
  gameState.isGrounded = true;
  gameState.callVehicleCooldown = 0;
  AudioManager.stopRadio();
  gameState.cameraYaw = 0;
  gameState.cameraPitch = 0.34;
  gameState.keys = {};

  if (gameState.netHackActive) toggleNetHack(false);
  if (gameState.activeCamIndex >= 0) cycleSecurityCamera(-1);

  gameState.drivingCar = null;
  AudioManager.stopEngineSound();

  // Natação: restaura estado a pé, esconde ondulação e reexibe a arma
  gameState.isSwimming = false;
  if (refs.playerParts) {
    if (refs.playerParts.swimRipple) refs.playerParts.swimRipple.visible = false;
    if (refs.playerParts.weaponMount) refs.playerParts.weaponMount.visible = true;
  }

  // Civis: limpa pânico, atordoamento e denúncias pendentes ao ctOS
  pedestrians.forEach((ped) => {
    ped.panickedTimer = 0;
    ped.stunnedTimer = 0;
    ped.callingPolice = false;
    if (ped.phoneIcon) ped.phoneIcon.visible = false;
    if (ped.mesh) ped.mesh.rotation.x = 0;
  });
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
      car.hasDriver = car.initialHasDriver;
      if (car.driverMesh) car.driverMesh.visible = car.hasDriver;
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

  // Limpar projéteis, ondas EMP, policiais dinâmicos, civis fugindo, suprimentos e postes derrubados
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    refs.scene.remove(p.mesh);
    refs.scene.remove(p.line);
    if (p.line?.geometry) p.line.geometry.dispose();
    if (p.line?.material) p.line.material.dispose();
    projectiles.splice(i, 1);
  }
  for (let i = guardProjectiles.length - 1; i >= 0; i--) {
    refs.scene.remove(guardProjectiles[i].mesh);
    guardProjectiles.splice(i, 1);
  }
  for (let i = empWaves.length - 1; i >= 0; i--) {
    const w = empWaves[i];
    refs.scene.remove(w.mesh);
    if (w.mesh?.geometry) w.mesh.geometry.dispose();
    if (w.mat) w.mat.dispose();
    empWaves.splice(i, 1);
  }
  for (let i = fleeingDrivers.length - 1; i >= 0; i--) {
    refs.worldGroup.remove(fleeingDrivers[i].mesh);
    disposeHierarchy(fleeingDrivers[i].mesh);
    fleeingDrivers.splice(i, 1);
  }
  for (let i = policeCars.length - 1; i >= 0; i--) {
    const pc = policeCars[i];
    refs.worldGroup.remove(pc.mesh);
    disposeHierarchy(pc.mesh);
    const cIdx = cars.indexOf(pc);
    if (cIdx !== -1) cars.splice(cIdx, 1);
    const colIdx = colliders.indexOf(pc.colliderObj);
    if (colIdx !== -1) colliders.splice(colIdx, 1);
    const occIdx = occluders.indexOf(pc.bodyMesh);
    if (occIdx !== -1) occluders.splice(occIdx, 1);
    policeCars.splice(i, 1);
  }
  for (let i = guards.length - 1; i >= 0; i--) {
    if (guards[i].isPolice) {
      refs.worldGroup.remove(guards[i].mesh);
      disposeHierarchy(guards[i].mesh);
      guards.splice(i, 1);
    }
  }
  supplyBoxes.forEach((sb) => {
    sb.used = false;
    if (sb.mesh?.userData?.normalMaterial?.emissive) {
      sb.mesh.userData.normalMaterial.emissiveIntensity = 0.65;
    }
  });
  const poleDummy = new THREE.Object3D();
  lightPoles.forEach((pole) => {
    if (!pole.fallen) return;
    pole.fallen = false;
    pole.falling = false;
    pole.fallProgress = 0;
    if (pole.fallGroup) {
      refs.worldGroup.remove(pole.fallGroup);
      pole.fallGroup = null;
    }
    if (pole.sparkPoints) {
      refs.worldGroup.remove(pole.sparkPoints);
      if (pole.sparkPoints.geometry) pole.sparkPoints.geometry.dispose();
      if (pole.sparkPoints.material) pole.sparkPoints.material.dispose();
      pole.sparkPoints = null;
    }
    poleDummy.position.set(pole.x, 2.9, pole.z);
    poleDummy.rotation.set(0, 0, 0);
    poleDummy.scale.set(1, 1, 1);
    poleDummy.updateMatrix();
    pole.poleMesh.setMatrixAt(pole.id, poleDummy.matrix);
    poleDummy.position.set(pole.x, 5.85, pole.z);
    poleDummy.updateMatrix();
    pole.headMesh.setMatrixAt(pole.id, poleDummy.matrix);
    pole.poleMesh.instanceMatrix.needsUpdate = true;
    pole.headMesh.instanceMatrix.needsUpdate = true;
    if (!colliders.includes(pole.colliderObj)) {
      colliders.push(pole.colliderObj);
    }
  });

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

  steamPipes.forEach((sp) => {
    sp.activeTimer = 0;
    sp.cooldown = 0;
    if (sp.steamPoints) sp.steamPoints.visible = false;
  });

  // Restaurar celas de prisioneiros e geradores (RESCUE_01 / RESCUE_02)
  rescueCells.forEach((cell) => {
    cell.freed = false;
    cell.genHp = cell.genMaxHp;
    cell.prisonerRunning = false;
    cell.prisonerRunTimer = 0;
    cell.prisonerPhase = 0;
    if (cell.barsGroup) cell.barsGroup.visible = true;
    if (cell.cellCollider && !colliders.includes(cell.cellCollider)) {
      colliders.push(cell.cellCollider);
    }
    if (cell.prisoner) {
      cell.prisoner.visible = true;
      cell.prisoner.position.copy(cell.prisonerInitialPos);
      cell.prisoner.rotation.y = 0;
      cell.pLegL.rotation.x = 0;
      cell.pLegR.rotation.x = 0;
      cell.pArmL.rotation.x = 0;
      cell.pArmR.rotation.x = 0;
    }
    if (cell.panelMesh?.userData?.normalMaterial?.emissive) {
      cell.panelMesh.userData.normalMaterial.emissive.setHex(cell.missionKey === 'RESCUE_01' ? 0x00f0ff : 0xffaa00);
    }
    if (cell.genMesh?.userData?.normalMaterial?.emissive) {
      cell.genMesh.userData.normalMaterial.emissive.setHex(0xff3344);
      cell.genMesh.userData.normalMaterial.emissiveIntensity = 0.65;
    }
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

  // Ocultar todas as zonas de extração (somente a zona ativa em MISSION_STATE.ESCAPE será exibida)
  Object.values(missionExtractions).forEach((ex) => {
    if (ex?.group) ex.group.visible = false;
  });

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
  if (mCfg?.isRescue) {
    gameState.targetCar = null;
    if (refs.vehicleDeliveryGroup) refs.vehicleDeliveryGroup.visible = false;
    setMissionState(MISSION_STATE.RESCUE_PRISONER);
  } else if (mCfg?.isVehicleTheft) {
    gameState.targetCar = cars.find((c) => c.vipMissionKey === missionKey) || null;
    if (refs.vehicleDeliveryGroup && mCfg.extractPos) {
      refs.vehicleDeliveryGroup.position.set(mCfg.extractPos[0], mCfg.extractPos[1], mCfg.extractPos[2]);
      refs.vehicleDeliveryGroup.visible = !mCfg.requiresInfiltration;
    }
    setMissionState(mCfg.requiresInfiltration ? MISSION_STATE.INFILTRATE : MISSION_STATE.STEAL_CAR);
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
  Object.values(missionExtractions).forEach((ex) => {
    if (ex?.group) ex.group.visible = false;
  });
  gameState.markerCooldown = 3.5;
  // Garante que o jogador saia do carro entregue (contratos VIP) e fique visível
  gameState.drivingCar = null;
  if (refs.playerGroup) refs.playerGroup.visible = true;
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

export function spawnPurchasedVehicle(vehCfg) {
  if (!vehCfg || !refs.worldGroup) return;
  const sx = 10;
  const sz = 56;
  const yaw = Math.PI / 2;

  // Remover qualquer carro anteriormente estacionado na vaga da SF Motors para evitar empilhamento
  for (let i = cars.length - 1; i >= 0; i--) {
    const existing = cars[i];
    if (existing === gameState.drivingCar || existing.isDedsec) continue;
    if (Math.hypot(existing.mesh.position.x - sx, existing.mesh.position.z - sz) < 4.8) {
      refs.worldGroup.remove(existing.mesh);
      const colIdx = colliders.indexOf(existing.colliderObj);
      if (colIdx !== -1) colliders.splice(colIdx, 1);
      const occIdx = occluders.indexOf(existing.bodyMesh);
      if (occIdx !== -1) occluders.splice(occIdx, 1);
      cars.splice(i, 1);
    }
  }

  const { carGroup, bodyMesh, driverMesh } = buildCarMesh(vehCfg.color, vehCfg.neon, false, vehCfg.bodyType, false);
  carGroup.position.set(sx, getSurfaceHeight(sx, sz), sz);
  carGroup.rotation.y = yaw;
  refs.worldGroup.add(carGroup);

  const headlight = null;

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
  const smokePoints = new THREE.Points(
    smokeGeo,
    new THREE.PointsMaterial({ color: 0x2b2b2b, size: 0.55, transparent: true, opacity: 0.75, depthWrite: false })
  );
  smokePoints.visible = false;
  carGroup.add(smokePoints);

  carGroup.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(carGroup);
  const colliderObj = { box, mesh: bodyMesh, carIndex: cars.length };
  colliders.push(colliderObj);
  occluders.push(bodyMesh);

  cars.push({
    id: 500 + cars.length,
    mesh: carGroup,
    bodyMesh,
    driverMesh,
    initialHasDriver: false,
    hasDriver: false,
    isTraffic: false,
    colliderObj,
    initialPos: new THREE.Vector3(sx, getSurfaceHeight(sx, sz), sz),
    initialYaw: yaw,
    initialColor: vehCfg.color,
    isDedsec: false,
    isDrivable: true,
    vipMissionKey: null,
    maxHp: vehCfg.maxHp || 100,
    hp: vehCfg.maxHp || 100,
    maxSpeed: vehCfg.maxSpeed || 22,
    accel: vehCfg.accel || 24,
    turnRate: vehCfg.turnRate || 2.3,
    hasNitro: !!vehCfg.hasNitro,
    destroyed: false,
    smokePoints,
    smokeData,
    speed: 0,
    hackedTimer: 0,
    hackedUsed: false,
    headlight
  });
  buildNetHackLabels();
}

export function callRemoteDedsecVehicle() {
  if (
    !refs.playerGroup ||
    gameState.drivingCar ||
    gameState.drivingBoat ||
    gameState.droneActive ||
    gameState.isSwimming ||
    gameState.callVehicleCooldown > 0
  ) {
    return;
  }
  const pPos = refs.playerGroup.position;
  if (isWaterForLand(pPos.x, pPos.z)) return;

  const yaw = refs.playerGroup.rotation.y;
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const candidates = [
    [rx * 5.2, rz * 5.2],
    [-rx * 5.2, -rz * 5.2],
    [fx * 6.0, fz * 6.0],
    [-fx * 6.0, -fz * 6.0],
    [rx * 8.0, rz * 8.0],
    [-rx * 8.0, -rz * 8.0]
  ];

  let spawnX = null;
  let spawnZ = null;
  for (const [ox, oz] of candidates) {
    const tx = pPos.x + ox;
    const tz = pPos.z + oz;
    if (!isWaterForLand(tx, tz) && !checkCarCollision(tx, tz, yaw)) {
      spawnX = tx;
      spawnZ = tz;
      break;
    }
  }
  if (spawnX === null) return;

  const sy = getSurfaceHeight(spawnX, spawnZ);
  let remoteCar = cars.find((c) => c.isRemoteCalled && c !== gameState.drivingCar);
  if (remoteCar) {
    remoteCar.mesh.position.set(spawnX, sy, spawnZ);
    remoteCar.mesh.rotation.set(0, yaw, 0);
    remoteCar.hp = remoteCar.maxHp;
    remoteCar.destroyed = false;
    remoteCar.speed = 0;
    if (remoteCar.smokePoints) remoteCar.smokePoints.visible = false;
    remoteCar.mesh.updateMatrixWorld(true);
    remoteCar.colliderObj.box.setFromObject(remoteCar.mesh);
    if (!colliders.includes(remoteCar.colliderObj)) colliders.push(remoteCar.colliderObj);
  } else {
    const { carGroup, bodyMesh, driverMesh } = buildCarMesh(0x101726, 0x00f0ff, false, 'SPORT', false);
    carGroup.position.set(spawnX, sy, spawnZ);
    carGroup.rotation.y = yaw;
    refs.worldGroup.add(carGroup);
    carGroup.updateMatrixWorld(true);
    const colliderObj = { box: new THREE.Box3().setFromObject(carGroup), mesh: bodyMesh, carIndex: cars.length };
    colliders.push(colliderObj);
    occluders.push(bodyMesh);
    remoteCar = {
      id: 950 + cars.length,
      mesh: carGroup,
      bodyMesh,
      driverMesh,
      initialHasDriver: false,
      hasDriver: false,
      isRemoteCalled: true,
      colliderObj,
      initialPos: new THREE.Vector3(spawnX, sy, spawnZ),
      initialYaw: yaw,
      initialColor: 0x101726,
      isDedsec: true,
      isDrivable: true,
      vipMissionKey: null,
      maxHp: 140,
      hp: 140,
      maxSpeed: 28,
      accel: 26,
      turnRate: 2.5,
      hasNitro: true,
      destroyed: false,
      smokePoints: null,
      smokeData: [],
      speed: 0,
      hackedTimer: 0,
      hackedUsed: false,
      headlight: null
    };
    cars.push(remoteCar);
  }
  gameState.callVehicleCooldown = 20.0;
  AudioManager.playHorn();
  AudioManager.playTerminalSuccess();
}

export function spawnPoliceReinforcement() {
  if (!refs.worldGroup || !refs.playerGroup) return;
  if (gameState.policeSpawnCooldown > 0 || policeCars.length >= 3) return;
  gameState.policeSpawnCooldown = 14.0;

  const pPos = refs.playerGroup.position;
  let sx = null;
  let sz = null;
  const angles = [0.4, 1.8, 3.1, 4.5, 5.6, 0.9, 2.4, 3.9];
  for (const dist of [32, 22, 42]) {
    for (const ang of angles) {
      const cx = pPos.x + Math.cos(ang) * dist;
      const cz = pPos.z + Math.sin(ang) * dist;
      if (!isWaterArea(cx, cz) && !checkCollision(cx, cz, 2.2)) {
        sx = cx;
        sz = cz;
        break;
      }
    }
    if (sx !== null) break;
  }
  if (sx === null) {
    sx = !isWaterArea(pPos.x, pPos.z) && !checkCollision(pPos.x, pPos.z, 2.2) ? pPos.x : 0;
    sz = !isWaterArea(pPos.x, pPos.z) && !checkCollision(pPos.x, pPos.z, 2.2) ? pPos.z : 34;
  }
  const sy = getSurfaceHeight(sx, sz);
  const yaw = Math.atan2(pPos.x - sx, pPos.z - sz);

  const { carGroup, bodyMesh, driverMesh } = buildCarMesh(0x141720, 0xff0044, true, 'SUV', false);
  carGroup.position.set(sx, sy, sz);
  carGroup.rotation.y = yaw;
  refs.worldGroup.add(carGroup);

  const headlight = null;

  carGroup.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(carGroup);
  const colliderObj = { box, mesh: bodyMesh, carIndex: cars.length };
  colliders.push(colliderObj);
  occluders.push(bodyMesh);

  const carObj = {
    id: 800 + policeCars.length,
    mesh: carGroup,
    bodyMesh,
    driverMesh,
    initialHasDriver: false,
    hasDriver: false,
    isTraffic: false,
    isPoliceCar: true,
    colliderObj,
    initialPos: new THREE.Vector3(sx, sy, sz),
    initialYaw: yaw,
    initialColor: 0x141720,
    isDedsec: false,
    isDrivable: true,
    vipMissionKey: null,
    maxHp: 180,
    hp: 180,
    destroyed: false,
    smokePoints: null,
    smokeData: [],
    speed: 0,
    hackedTimer: 0,
    hackedUsed: false,
    headlight,
    disembarked: false,
    sirenCd: 0
  };
  cars.push(carObj);
  policeCars.push(carObj);
}

export function updateVisualEffects(dt, nowSec) {
  if (refs.showroomTurntable) {
    refs.showroomTurntable.rotation.y += dt * 0.65;
  }
  if (refs.rainPoints && gameState.rainEnabled && refs.camera) {
    refs.rainPoints.visible = true;
    refs.rainPoints.position.set(refs.camera.position.x, 0, refs.camera.position.z);
    const attr = refs.rainPoints.geometry.getAttribute('position');
    const count = attr.count || 360;
    for (let i = 0; i < count; i++) {
      let ry = attr.getY(i) - dt * 22;
      if (ry < 0) ry = 26;
      attr.setY(i, ry);
    }
    attr.needsUpdate = true;
  }
  if (gameState.hitmarkerTimer > 0) {
    gameState.hitmarkerTimer = Math.max(0, gameState.hitmarkerTimer - dt);
    if (gameState.hitmarkerTimer === 0 && dom.hitmarker) {
      dom.hitmarker.classList.add('hidden');
    }
  }
  if (gameState.recoilTimer > 0) {
    gameState.recoilTimer = Math.max(0, gameState.recoilTimer - dt);
  }
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

  if (refs.bayWaterGeo) {
    const posAttr = refs.bayWaterGeo.attributes.position;
    const base = refs.bayWaterGeo.userData.basePositions;
    for (let i = 0; i < posAttr.count; i++) {
      const u = base[i * 3];
      const v = base[i * 3 + 1];
      // Ondas suaves e cristas móveis nos vértices 3D da baía
      posAttr.setZ(
        i,
        base[i * 3 + 2] +
          Math.sin(u * 0.016 + nowSec * 1.5) * 0.09 +
          Math.cos(v * 0.014 + nowSec * 1.2) * 0.07
      );
    }
    posAttr.needsUpdate = true;
  }

  if (refs.waterMesh) {
    refs.waterMesh.position.y = -0.55 + Math.sin(nowSec * 1.2) * 0.04;
    refs.waterMesh.material.emissiveIntensity = 0.80 + Math.sin(nowSec * 1.8) * 0.08;
  }
  if (refs.waterTexture) {
    refs.waterTexture.offset.x += dt * 0.024;
    refs.waterTexture.offset.y += dt * 0.018;
  }
  if (refs.waterBumpMap) {
    refs.waterBumpMap.offset.x -= dt * 0.016;
    refs.waterBumpMap.offset.y += dt * 0.022;
  }

  if (refs.waterFoamRings) {
    refs.waterFoamRings.forEach((ring, idx) => {
      const s = 1.0 + Math.sin(nowSec * 2.4 + idx * 0.8) * 0.08;
      ring.scale.set(s, s, 1);
      ring.material.opacity = 0.28 + Math.sin(nowSec * 2.8 + idx * 0.6) * 0.12;
    });
  }

  for (let i = impactFlashes.length - 1; i >= 0; i--) {
    const f = impactFlashes[i];
    f.life -= dt;
    if (f.mesh && f.mat) {
      f.mat.opacity = Math.max(0, 0.9 * (f.life / 0.15));
      if (f.life <= 0) {
        refs.scene.remove(f.mesh);
        f.mat.dispose();
        impactFlashes.splice(i, 1);
      }
    } else if (f.light) {
      f.light.intensity = Math.max(0, 5.0 * (f.life / 0.15));
      if (f.life <= 0) {
        refs.scene.remove(f.light);
        impactFlashes.splice(i, 1);
      }
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
