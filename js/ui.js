import * as THREE from 'three';
import {
  MISSION_STATE,
  GUARD_STATE,
  WEAPON_TYPE,
  WEAPON_CONFIG,
  MAPS_CONFIG,
  HACK_CODES,
  FIREWALL_CODES,
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
  netHackTagItems,
  missionMarkers,
  formatTime
} from './state.js';
import { AudioManager } from './audio.js';

export function buildNetHackLabels() {
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
    () => refs.serverMesh.position.clone().add(new THREE.Vector3(0, 2.55, 0)),
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

export function updateNetHackLabels() {
  if (!gameState.netHackActive || !dom.nethackLabels) return;
  const w = window.innerWidth;
  const h = window.innerHeight;

  netHackTagItems.forEach((item) => {
    const pos = item.getPos();
    const projected = pos.project(refs.camera);
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

export function toggleNetHack(forceState) {
  gameState.netHackActive = forceState !== undefined ? forceState : !gameState.netHackActive;
  if (forceState === undefined) {
    AudioManager.playNetHackPulse(gameState.netHackActive);
  }

  if (gameState.netHackActive) {
    if (refs.skyDome) refs.skyDome.visible = false;
    refs.scene.background.setHex(0x020611);
    refs.scene.fog.color.setHex(0x020611);
    refs.scene.fog.density = 0.015;
    refs.ambientLight.intensity = 0.55;
    dom.nethackOverlay.classList.remove('hidden');
    dom.statusMode.textContent = 'NETHACK';
    refs.networkLinesGroup.visible = true;
  } else {
    if (refs.skyDome) refs.skyDome.visible = true;
    refs.scene.background.setHex(0x1c1430);
    refs.scene.fog.color.setHex(0x1c1430);
    refs.scene.fog.density = 0.00085;
    refs.ambientLight.intensity = BASE_AMBIENT_INTENSITY;
    dom.nethackOverlay.classList.add('hidden');
    dom.statusMode.textContent = gameState.activeCamIndex >= 0 ? 'CÂMERA' : 'FURTIVO';
    refs.networkLinesGroup.visible = false;
  }

  structureMeshes.forEach((m) => {
    m.material = gameState.netHackActive ? m.userData.nethackMaterial : m.userData.normalMaterial;
  });

  hackableMeshes.forEach((m) => {
    m.material = gameState.netHackActive ? m.userData.nethackMaterial : m.userData.normalMaterial;
  });
}

export function openTerminal(targetType = 'GATE') {
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

export function closeGateTerminal() {
  gameState.terminalOpen = false;
  dom.terminalModal.classList.add('hidden');
  dom.canvas.requestPointerLock();
}

export function completeTerminalHack() {
  AudioManager.playTerminalSuccess();
  gameState.hacksUsed += 1;
  if (gameState.terminalTarget === 'FIREWALL') {
    gameState.serverFirewallDisabled = true;
    refs.serverMesh.userData.normalMaterial.emissive.setHex(0x00f0ff);
    refs.onFirewallDisabled?.();
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

export function updateWeaponHUD() {
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

export function updateHpHUD() {
  if (dom.statusHp) {
    dom.statusHp.textContent = `${Math.ceil(gameState.hp)}%`;
    dom.statusHp.className = gameState.hp > 50 ? 'neon-green' : gameState.hp > 25 ? 'neon-cyan' : 'neon-magenta';
  }
  if (dom.hpBar) {
    dom.hpBar.style.width = `${THREE.MathUtils.clamp(gameState.hp, 0, 100)}%`;
  }
}

export function setMissionState(newState) {
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

export function updateMoneyHUD() {
  if (dom.statusMoney) {
    dom.statusMoney.textContent = `$${gameState.money.toLocaleString('pt-BR')}`;
  }
}

export function openMissionModal(missionKey) {
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

export function closeMissionModal() {
  gameState.missionModalOpen = false;
  gameState.pendingMissionKey = null;
  gameState.markerCooldown = 3.0;
  if (dom.missionModal) dom.missionModal.classList.add('hidden');
  dom.canvas.requestPointerLock();
}

export function acceptPendingMission() {
  const mKey = gameState.pendingMissionKey || 'COMPLEXO_CTOS';
  gameState.missionModalOpen = false;
  if (dom.missionModal) dom.missionModal.classList.add('hidden');
  refs.onAcceptMission?.(mKey);
}

export function triggerGameOver(
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

export function calculateMissionRank() {
  const det = gameState.maxDetection;
  const time = gameState.elapsedTime;
  if (det < 15 && time <= 85) return 'RANK S - FANTASMA';
  if (det < 45 && time <= 120) return 'RANK A - INFILTRADOR';
  if (det < 80 && time <= 165) return 'RANK B - OPERATIVO';
  return 'RANK C';
}

export function triggerVictory() {
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

export function updateRadar() {
  if (!dom.radarCanvas) return;
  const ctx = dom.radarCanvas.getContext('2d');
  const size = dom.radarCanvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;
  const mapCfg = MAPS_CONFIG[gameState.selectedMap] || MAPS_CONFIG.COMPLEXO_CTOS;
  const scale = mapCfg.radarScale || 1.55;

  const pPos = refs.playerGroup.position;

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

  // Ponte Golden Gate (Z: 35) e Ponte Sul (Z: 320) no radar
  [35, 320].forEach((bz, idx) => {
    const bStart = toRadar(80, bz);
    const bEnd = toRadar(400, bz);
    ctx.strokeStyle = idx === 0 ? 'rgba(255, 90, 31, 0.75)' : 'rgba(0, 240, 255, 0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bStart.x, bStart.y);
    ctx.lineTo(bEnd.x, bEnd.y);
    ctx.stroke();
  });

  // Garagem DedSec no Distrito Sul
  const garPos = toRadar(-120, 320);
  ctx.fillStyle = 'rgba(0, 255, 136, 0.35)';
  ctx.fillRect(garPos.x - 6, garPos.y - 5, 12, 10);

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

  // Píeres de embarque e Lanchas DedSec no radar
  [72, 398].forEach((px) => {
    const pp = toRadar(px, 62);
    ctx.fillStyle = 'rgba(28, 38, 59, 0.9)';
    ctx.fillRect(pp.x - 4 * scale, pp.y - 5 * scale, 8 * scale, 10 * scale);
  });

  boats.forEach((boat) => {
    const bp = toRadar(boat.mesh.position.x, boat.mesh.position.z);
    ctx.save();
    ctx.translate(bp.x, bp.y);
    ctx.rotate(-boat.mesh.rotation.y);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(-1.15 * scale, -2.3 * scale, 2.3 * scale, 4.6 * scale);
    ctx.restore();
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
  const sPos = toRadar(refs.serverMesh.position.x, refs.serverMesh.position.z);
  ctx.fillStyle = gameState.serverFirewallDisabled ? '#00f0ff' : '#ff0055';
  ctx.fillRect(sPos.x - 3.5, sPos.y - 3.5, 7, 7);

  // Zona de extração
  const ePos = toRadar(refs.extractionZoneGroup.position.x, refs.extractionZoneGroup.position.z);
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
  ctx.rotate(-refs.playerGroup.rotation.y);
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
