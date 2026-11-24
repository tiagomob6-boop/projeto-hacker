import * as THREE from 'three';
import {
  MISSION_STATE,
  GUARD_STATE,
  WEAPON_TYPE,
  WEAPON_CONFIG,
  SKINS_CATALOG,
  VEHICLES_CATALOG,
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
  pedestrians,
  boats,
  netHackTagItems,
  missionMarkers,
  stores,
  trafficLights,
  rescueCells,
  steamPipes,
  remotePlayers,
  formatTime,
  saveProgress,
  getSurfaceHeight,
  initCloudDb,
  registerAccount,
  loginAccount,
  loginAsGuest,
  logoutAccount
} from './state.js';
import { AudioManager } from './audio.js';

export function buildNetHackLabels() {
  if (!dom.nethackLabels) return;
  dom.nethackLabels.innerHTML = '';
  netHackTagItems.length = 0;

  const registerTag = (getPos, getText, maxDist = Infinity) => {
    const el = document.createElement('div');
    el.className = 'nethack-tag';
    dom.nethackLabels.appendChild(el);
    netHackTagItems.push({ el, getPos, getText, maxDist });
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
    if (car.isDrivable) {
      registerTag(
        () => car.mesh.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
        () =>
          car.destroyed
            ? 'SUCATA QUEIMADA'
            : gameState.drivingCar === car
            ? '[F] SAIR DO VEÍCULO'
            : car.isTraffic
            ? '[E] ACELERAR / [F] ROUBAR'
            : `[F] DIRIGIR (${Math.ceil((car.hp / car.maxHp) * 100)}% HP)`
      );
    } else {
      registerTag(
        () => car.mesh.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
        () => (car.destroyed ? 'SUCATA' : car.hackedUsed ? 'CARRO HACKEADO' : '[E] ACELERAR CARRO')
      );
    }
  });

  pedestrians.forEach((ped) => {
    registerTag(
      () => ped.mesh.position.clone().add(new THREE.Vector3(0, 2.15, 0)),
      () =>
        ped.profile.hacked
          ? `${ped.profile.name} // CONTA HACKEADA`
          : `${ped.profile.name} | ${ped.profile.job} | [E] +$75`,
      24
    );
  });

  trafficLights.forEach((tl, idx) => {
    registerTag(
      () => tl.pos.clone().add(new THREE.Vector3(0, 5.4, 0)),
      () =>
        tl.hackedTimer > 0
          ? `SEMÁFORO_${idx + 1} CAOS (${Math.ceil(tl.hackedTimer)}s)`
          : `[E] HACKEAR SEMÁFORO`,
      36
    );
  });

  steamPipes.forEach((sp, idx) => {
    registerTag(
      () => sp.pos.clone().add(new THREE.Vector3(0, 1.0, 0)),
      () =>
        sp.activeTimer > 0
          ? `VAPOR_${idx + 1} ATIVO!`
          : sp.cooldown > 0
          ? `TUBULAÇÃO_${idx + 1} (${Math.ceil(sp.cooldown)}s)`
          : `[E] TUBULAÇÃO DE VAPOR`,
      42
    );
  });

  guards.forEach((g, idx) => {
    registerTag(
      () => g.mesh.position.clone().add(new THREE.Vector3(0, 2.25, 0)),
      () =>
        g.state === GUARD_STATE.DEAD
          ? `ALVO_${idx + 1} ABATIDO`
          : g.marked
          ? `⚠ GUARDA MARCADO [${g.state}]`
          : '',
      42
    );
  });
}

export function updateNetHackLabels() {
  if (!gameState.netHackActive || !dom.nethackLabels) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const viewOrigin =
    gameState.droneActive && refs.droneGroup ? refs.droneGroup.position : refs.playerGroup?.position;

  netHackTagItems.forEach((item) => {
    const labelText = item.getText();
    if (!labelText) {
      item.el.style.display = 'none';
      return;
    }
    const pos = item.getPos();
    if (refs.camera && pos.distanceTo(refs.camera.position) > 110) {
      item.el.style.display = 'none';
      return;
    }
    const distLimit = gameState.droneActive && item.maxDist < Infinity ? item.maxDist * 1.65 : item.maxDist;
    if (distLimit < Infinity && viewOrigin && pos.distanceTo(viewOrigin) > distLimit) {
      item.el.style.display = 'none';
      return;
    }
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
    item.el.textContent = labelText;
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
    dom.statusMode.textContent = gameState.activeCamIndex >= 0
      ? 'CÂMERA'
      : gameState.drivingBoat
      ? 'LANCHA'
      : gameState.drivingCar
      ? 'VEÍCULO'
      : gameState.isSwimming
      ? 'NADANDO'
      : gameState.droneActive
      ? 'DRONE'
      : 'FURTIVO';
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
  const isCell = targetType === 'CELL';
  const preset = DIFFICULTY_PRESETS[gameState.difficulty];
  const duration = isFirewall ? preset.firewallTime : preset.gateTime;
  const pool = isFirewall ? FIREWALL_CODES : HACK_CODES;

  gameState.hackTimeLeft = duration;
  gameState.hackCode = pool[Math.floor(Math.random() * pool.length)];

  if (dom.terminalLogAction) {
    dom.terminalLogAction.textContent = isFirewall
      ? '> FIREWALL ATIVO NO SERVIDOR CENTRAL ctOS.'
      : isCell
      ? '> CONEXÃO ESTABELECIDA COM O TERMINAL DA CELA DE CONTENÇÃO.'
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
  if (!gameState.touchEnabled) dom.canvas.requestPointerLock();
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

  if (gameState.terminalTarget === 'CELL') {
    const cell = rescueCells[gameState.activeCellIndex];
    if (cell) refs.onFreeRescueCell?.(cell);
    dom.hackFeedback.textContent = '> CELA DESENERGIZADA // PRISIONEIRO LIBERTADO!';
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
    refs.onBroadcastHack?.('GATE', { gateIndex: targetGate.index });
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

  const activeMissionKey = targetGate?.missionKey || gameState.activeMissionKey;
  const missionGates = activeMissionKey ? gates.filter((g) => g.missionKey === activeMissionKey) : gates;
  const allMissionGatesOpen = missionGates.length === 0 || missionGates.every((g) => g.unlocked);
  gameState.gateUnlocked = allMissionGatesOpen;
  dom.hackFeedback.textContent = '> ACESSO CONCEDIDO // PORTÃO DESTRAVADO!';
  dom.hackFeedback.style.color = '#00ff88';

  const activeCfg = MAPS_CONFIG[gameState.activeMissionKey];
  if (gameState.mission === MISSION_STATE.INFILTRATE && allMissionGatesOpen) {
    if (activeCfg?.isVehicleTheft) {
      dom.missionObjective.textContent = 'ROUBE O VEÍCULO-ALVO NO COMPLEXO';
      dom.missionSub.textContent = 'Portão destravado! Entre no veículo-alvo [F] para iniciar a fuga';
    } else {
      setMissionState(MISSION_STATE.STEAL_DATA);
    }
  }

  if (missionGates.some((g) => !g.unlocked)) {
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
  const maxHp = gameState.maxHp || 100;
  const pct = THREE.MathUtils.clamp((gameState.hp / maxHp) * 100, 0, 100);
  if (dom.statusHp) {
    dom.statusHp.textContent = `${Math.ceil(gameState.hp)}/${maxHp}`;
    dom.statusHp.className = pct > 50 ? 'neon-green' : pct > 25 ? 'neon-cyan' : 'neon-magenta';
  }
  if (dom.hpBar) {
    dom.hpBar.style.width = `${pct}%`;
  }
}

export function updateWantedHUD() {
  const lvl = THREE.MathUtils.clamp(Math.floor(gameState.wantedLevel || 0), 0, 5);
  if (dom.wantedStars) {
    dom.wantedStars.textContent = '★'.repeat(lvl) + '☆'.repeat(5 - lvl);
    dom.wantedStars.className = lvl > 0 ? 'wanted-stars active' : 'wanted-stars';
  }
  if (dom.wantedStatus) {
    const status = gameState.wantedStatus || (lvl > 0 ? 'PROCURADO' : 'OCULTO');
    dom.wantedStatus.textContent = status;
    dom.wantedStatus.className =
      status === 'OCULTO' ? 'neon-green' : status === 'DENÚNCIA EM ANDAMENTO' ? 'neon-cyan' : 'neon-magenta';
  }
}

export function addWantedLevel(delta = 1, statusText = 'PERSEGUIÇÃO') {
  const prev = gameState.wantedLevel;
  gameState.wantedLevel = THREE.MathUtils.clamp(gameState.wantedLevel + delta, 0, 5);
  gameState.wantedCooldown = 15.0;
  gameState.wantedStatus = gameState.wantedLevel > 0 ? statusText : 'OCULTO';
  updateWantedHUD();
  if (gameState.wantedLevel > prev) {
    AudioManager.playBaseAlertSiren();
  }
  if (gameState.wantedLevel >= 1) {
    refs.onSpawnPolice?.();
  }
}

export function updateVehicleHpHUD() {
  if (!dom.vehicleHpContainer) return;
  const car = gameState.drivingCar;
  if (!car) {
    dom.vehicleHpContainer.classList.add('hidden');
    return;
  }
  dom.vehicleHpContainer.classList.remove('hidden');
  const pct = THREE.MathUtils.clamp((car.hp / (car.maxHp || 100)) * 100, 0, 100);
  if (dom.vehicleHpPercent) {
    dom.vehicleHpPercent.textContent = `${Math.ceil(pct)}%`;
    dom.vehicleHpPercent.className = pct > 50 ? 'neon-green' : pct > 35 ? 'neon-cyan' : 'neon-magenta';
  }
  if (dom.vehicleHpBar) {
    dom.vehicleHpBar.style.width = `${pct}%`;
    dom.vehicleHpBar.style.background = pct <= 35 ? '#ff0055' : pct <= 65 ? '#ffaa00' : '#00f0ff';
  }
}

export function setMissionState(newState) {
  gameState.mission = newState;

  const activeCfg = MAPS_CONFIG[gameState.activeMissionKey];

  if (newState === MISSION_STATE.FREE_ROAM) {
    dom.missionObjective.textContent = 'MUNDO ABERTO // SÃO FRANCISCO';
    dom.missionSub.textContent = 'Explore a cidade, atravesse a Golden Gate ou pise em um marcador de missão';
  } else if (newState === MISSION_STATE.INFILTRATE) {
    if (activeCfg?.isVehicleTheft) {
      dom.missionObjective.textContent = 'INFILTRE-SE E HACKEIE O PORTÃO DO COMPLEXO';
      dom.missionSub.textContent = 'Use Drone [Q], NetHack [V] ou furtividade para hackear o painel [E] e liberar o carro';
    } else {
      dom.missionObjective.textContent = 'HACKEIE O PORTÃO DE ENTRADA';
      dom.missionSub.textContent = 'Aproxime-se do painel na entrada e pressione [E]';
    }
  } else if (newState === MISSION_STATE.STEAL_DATA) {
    if (activeCfg?.isVerticalHeist) {
      dom.missionObjective.textContent = 'SUBA AO 5º ANDAR // SERVIDOR COBERTURA BLUME';
      dom.missionSub.textContent = 'Suba pelas rampas ou quebre vidros, neutraliza guardas e segure [E] no servidor do 5º andar';
    } else {
      dom.missionObjective.textContent = 'BAIXE OS DADOS DO SERVIDOR CENTRAL';
      dom.missionSub.textContent = 'Use cobertura [V / C] contra os guardas e segure [E] no servidor';
    }
  } else if (newState === MISSION_STATE.STEAL_CAR) {
    const destLabel = activeCfg?.deliveryLabel || 'GARAGEM DEDSEC SUL';
    dom.missionObjective.textContent = `ENTREGUE O VEÍCULO EM: ${destLabel}`;
    dom.missionSub.textContent = `Fuja da perseguição policial e estacione o veículo intacto em ${destLabel}`;
    AudioManager.setMusicTempo(134);
  } else if (newState === MISSION_STATE.RESCUE_PRISONER) {
    if (activeCfg?.isVerticalRescue) {
      dom.missionObjective.textContent = 'SUBA AO 4º ANDAR // SUÍTE PRESIDENCIAL';
      dom.missionSub.textContent = 'Invada o Grand SF Hotel, suba ao 4º andar e hackeie o terminal da suíte [E]';
    } else {
      dom.missionObjective.textContent = 'RESGATE O PRISIONEIRO NO POSTO AVANÇADO';
      dom.missionSub.textContent = 'Hackeie o terminal da cela [E] ou destrua o gerador próximo para libertá-lo';
    }
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
  saveProgress();
}

export function updateAgentHUD() {
  if (dom.statusAgent) {
    dom.statusAgent.textContent = (gameState.currentUser?.agentName || 'CONVIDADO').toUpperCase();
  }
}

function setAuthStatus(msg, type = '') {
  if (!dom.authStatus) return;
  dom.authStatus.textContent = msg;
  dom.authStatus.className = type ? `auth-status ${type}` : 'auth-status';
}

export function openAuthScreen() {
  gameState.authOpen = true;
  if (document.pointerLockElement) document.exitPointerLock();
  if (dom.hud) dom.hud.classList.add('hidden');
  if (dom.authScreen) dom.authScreen.classList.remove('hidden');
  setAuthStatus('');
}

export function closeAuthScreen() {
  gameState.authOpen = false;
  if (dom.authScreen) dom.authScreen.classList.add('hidden');
  if (dom.hud) dom.hud.classList.remove('hidden');
  updateAgentHUD();
  updateMoneyHUD();
  updateHpHUD();
  if (refs.rainPoints) refs.rainPoints.visible = gameState.rainEnabled;
  if (dom.btnRain) dom.btnRain.textContent = gameState.rainEnabled ? 'CHUVA: ON' : 'CHUVA: OFF';
  refs.onApplySkin?.(gameState.equippedSkin);
  if (dom.canvas) dom.canvas.requestPointerLock?.();
}

export function setupAuthUI() {
  if (!dom.authScreen) return;
  openAuthScreen();

  initCloudDb().then(({ online }) => {
    if (!dom.authDbBadge) return;
    if (online) {
      dom.authDbBadge.textContent = '● NUVEM NEON.DB CONECTADA (SAVE SINCRONIZADO)';
      dom.authDbBadge.classList.add('online');
    } else {
      dom.authDbBadge.textContent = '● MODO OFFLINE // SAVE LOCAL (LOCALSTORAGE)';
      dom.authDbBadge.classList.remove('online');
    }
  });

  const switchTab = (mode) => {
    const isLogin = mode === 'LOGIN';
    dom.authTabLogin?.classList.toggle('active', isLogin);
    dom.authTabRegister?.classList.toggle('active', !isLogin);
    dom.authLoginForm?.classList.toggle('hidden', !isLogin);
    dom.authRegisterForm?.classList.toggle('hidden', isLogin);
    setAuthStatus('');
  };

  dom.authTabLogin?.addEventListener('click', () => switchTab('LOGIN'));
  dom.authTabRegister?.addEventListener('click', () => switchTab('REGISTER'));

  dom.authLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAuthStatus('> VERIFICANDO CREDENCIAIS ctOS...');
    const res = await loginAccount(dom.authLoginUser?.value, dom.authLoginPass?.value);
    if (!res.ok) {
      setAuthStatus(`> ERRO: ${res.error}`, 'error');
      return;
    }
    setAuthStatus(res.cloud ? '> ACESSO AUTORIZADO // SAVE CARREGADO DO NEON.DB' : '> ACESSO AUTORIZADO (LOCAL)', 'success');
    setTimeout(() => closeAuthScreen(), 350);
  });

  dom.authRegisterForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAuthStatus('> REGISTRANDO NOVO AGENTE DEDSEC...');
    const res = await registerAccount(dom.authRegAgent?.value, dom.authRegUser?.value, dom.authRegPass?.value);
    if (!res.ok) {
      setAuthStatus(`> ERRO: ${res.error}`, 'error');
      return;
    }
    setAuthStatus(res.cloud ? '> CONTA CRIADA NA NUVEM NEON.DB!' : '> CONTA CRIADA LOCALMENTE!', 'success');
    setTimeout(() => closeAuthScreen(), 350);
  });

  dom.btnGuestLogin?.addEventListener('click', () => {
    loginAsGuest();
    closeAuthScreen();
  });

  dom.btnLogout?.addEventListener('click', () => {
    AudioManager.stopMusic();
    AudioManager.stopEngineSound();
    AudioManager.stopRadio();
    logoutAccount();
    if (dom.authLoginPass) dom.authLoginPass.value = '';
    if (dom.authRegPass) dom.authRegPass.value = '';
    openAuthScreen();
  });
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
  if (!gameState.touchEnabled) dom.canvas.requestPointerLock();
}

export function acceptPendingMission() {
  const mKey = gameState.pendingMissionKey || 'COMPLEXO_CTOS';
  gameState.missionModalOpen = false;
  if (dom.missionModal) dom.missionModal.classList.add('hidden');
  refs.onAcceptMission?.(mKey);
}

export function openShopModal(storeType) {
  if (!dom.shopModal || !dom.shopItems) return;
  gameState.shopOpen = true;
  if (document.pointerLockElement) document.exitPointerLock();
  const isStyle = storeType === 'STYLE';
  const isMotors = storeType === 'MOTORS';
  if (dom.shopTitle) {
    dom.shopTitle.textContent = isStyle
      ? 'DEDSEC STYLE // ROUPAS & SKINS'
      : isMotors
      ? 'SF MOTORS // CONCESSIONÁRIA'
      : 'HACKSHOP ARMORY // ARMAS & TÁTICA';
    dom.shopTitle.className = isStyle
      ? 'status-title neon-magenta'
      : isMotors
      ? 'status-title neon-cyan'
      : 'status-title neon-green';
  }
  if (dom.shopSubtitle) {
    dom.shopSubtitle.textContent = isStyle
      ? 'Compre e equipe visuais completos para alterar seu agente em tempo real.'
      : isMotors
      ? 'Compre veículos exclusivos e faça spawn imediato na vaga externa da loja.'
      : 'Adquira blindagem extra, recarga rápida e armamento pesado DedSec.';
  }

  const renderShop = () => {
    if (dom.shopMoney) dom.shopMoney.textContent = `$${gameState.money.toLocaleString('pt-BR')}`;
    dom.shopItems.innerHTML = '';

    if (isMotors) {
      VEHICLES_CATALOG.forEach((veh) => {
        const owned = gameState.ownedVehicles.includes(veh.id);
        const row = document.createElement('div');
        row.className = 'shop-item';
        row.innerHTML = `
          <div class="shop-item-info">
            <div class="shop-item-title">${veh.name}</div>
            <div class="shop-item-desc">${veh.desc}</div>
          </div>
        `;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `cyber-btn shop-item-btn ${owned ? 'green-btn' : ''}`;
        if (owned) {
          btn.textContent = 'SPAWNAR NA VAGA';
          btn.addEventListener('click', () => {
            refs.onSpawnVehicle?.(veh);
            AudioManager.playTerminalSuccess();
            closeShopModal();
          });
        } else {
          btn.textContent = `COMPRAR $${veh.price}`;
          btn.disabled = gameState.money < veh.price;
          btn.addEventListener('click', () => {
            if (gameState.money < veh.price) return;
            gameState.money -= veh.price;
            gameState.ownedVehicles.push(veh.id);
            updateMoneyHUD();
            refs.onSpawnVehicle?.(veh);
            AudioManager.playTerminalSuccess();
            closeShopModal();
          });
        }
        row.appendChild(btn);
        dom.shopItems.appendChild(row);
      });
    } else if (isStyle) {
      SKINS_CATALOG.forEach((skin) => {
        const owned = gameState.ownedSkins.includes(skin.id);
        const equipped = gameState.equippedSkin === skin.id;
        const canAfford = gameState.money >= skin.price;

        const row = document.createElement('div');
        row.className = 'shop-item';
        row.innerHTML = `
          <div class="shop-item-info">
            <div class="shop-item-title">${skin.name}</div>
            <div class="shop-item-desc">${skin.price === 0 ? 'Padrão DedSec' : `Visual completo ($${skin.price})`}</div>
          </div>
        `;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `cyber-btn shop-item-btn ${equipped ? 'green-btn' : ''}`;
        if (equipped) {
          btn.textContent = 'EQUIPADO';
          btn.disabled = true;
        } else if (owned) {
          btn.textContent = 'EQUIPAR';
          btn.addEventListener('click', () => {
            gameState.equippedSkin = skin.id;
            refs.onApplySkin?.(skin.id);
            saveProgress();
            AudioManager.playTerminalSuccess();
            renderShop();
          });
        } else {
          btn.textContent = `COMPRAR $${skin.price}`;
          btn.disabled = !canAfford;
          btn.addEventListener('click', () => {
            if (gameState.money < skin.price) return;
            gameState.money -= skin.price;
            gameState.ownedSkins.push(skin.id);
            gameState.equippedSkin = skin.id;
            updateMoneyHUD();
            refs.onApplySkin?.(skin.id);
            AudioManager.playTerminalSuccess();
            renderShop();
          });
        }
        row.appendChild(btn);
        dom.shopItems.appendChild(row);
      });
    } else {
      const armoryItems = [
        {
          id: 'armor',
          title: 'Colete Balístico DedSec',
          desc: '+50 HP máximo (150 HP) e restaura toda a vida.',
          price: 300,
          owned: gameState.maxHp >= 150 && gameState.hp >= gameState.maxHp,
          buy: () => {
            gameState.maxHp = 150;
            gameState.hp = 150;
            updateHpHUD();
          }
        },
        {
          id: 'reload',
          title: 'Melhoria de Recarga Rápida',
          desc: 'Reduz em 45% o tempo de recarga de todas as armas.',
          price: 700,
          owned: gameState.hasRapidReload,
          buy: () => {
            gameState.hasRapidReload = true;
          }
        },
        {
          id: 'shotgun',
          title: '[5] Escopeta Tática DedSec',
          desc: 'Dispara 5 projéteis em leque de curto alcance com alto dano.',
          price: 1200,
          owned: gameState.hasShotgun,
          buy: () => {
            gameState.hasShotgun = true;
            refs.onSelectWeapon?.(WEAPON_TYPE.SHOTGUN);
          }
        },
        {
          id: 'blackout',
          title: '[B] Blackout Geral ctOS',
          desc: 'Apaga postes por 12s, desativa câmeras laser e reduz visão inimiga em 50% (gratuito no modo Elite).',
          price: 900,
          owned: gameState.hasBlackout || gameState.difficulty === 'DEDSEC_ELITE',
          buy: () => {
            gameState.hasBlackout = true;
          }
        }
      ];

      armoryItems.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'shop-item';
        row.innerHTML = `
          <div class="shop-item-info">
            <div class="shop-item-title">${item.title}</div>
            <div class="shop-item-desc">${item.desc}</div>
          </div>
        `;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `cyber-btn shop-item-btn ${item.owned ? 'green-btn' : ''}`;
        if (item.owned) {
          btn.textContent = 'ADQUIRIDO';
          btn.disabled = true;
        } else {
          btn.textContent = `COMPRAR $${item.price}`;
          btn.disabled = gameState.money < item.price;
          btn.addEventListener('click', () => {
            if (gameState.money < item.price) return;
            gameState.money -= item.price;
            item.buy();
            updateMoneyHUD();
            AudioManager.playTerminalSuccess();
            renderShop();
          });
        }
        row.appendChild(btn);
        dom.shopItems.appendChild(row);
      });
    }
  };

  renderShop();
  dom.shopModal.classList.remove('hidden');
  if (document.pointerLockElement === dom.canvas) {
    document.exitPointerLock();
  }
}

export function closeShopModal() {
  gameState.shopOpen = false;
  gameState.shopCooldown = 1.5;
  gameState.shopMustExitRing = true;
  if (dom.shopModal) dom.shopModal.classList.add('hidden');
  if (!gameState.touchEnabled) dom.canvas.requestPointerLock();
}

export function triggerHitmarker(isLethal = false) {
  gameState.hitmarkerTimer = 0.16;
  if (!dom.hitmarker) return;
  dom.hitmarker.classList.remove('hidden');
  dom.hitmarker.classList.toggle('lethal', !!isLethal);
}

export function toggleRain() {
  gameState.rainEnabled = !gameState.rainEnabled;
  if (refs.rainPoints) refs.rainPoints.visible = gameState.rainEnabled;
  if (dom.btnRain) dom.btnRain.textContent = gameState.rainEnabled ? 'CHUVA: ON' : 'CHUVA: OFF';
  saveProgress();
}

export function getActiveGpsTarget() {
  if (gameState.gpsWaypoint) return gameState.gpsWaypoint;
  const activeCfg = MAPS_CONFIG[gameState.activeMissionKey];
  if (gameState.mission === MISSION_STATE.STEAL_CAR) {
    const dest = activeCfg?.extractPos || [-120, 0.06, 320];
    return { x: dest[0], z: dest[2] };
  }
  if (gameState.mission === MISSION_STATE.RESCUE_PRISONER) {
    const cell = rescueCells.find((c) => c.missionKey === gameState.activeMissionKey && !c.freed);
    if (cell) return { x: cell.panelMesh.position.x, z: cell.panelMesh.position.z };
  }
  if (gameState.mission === MISSION_STATE.ESCAPE && refs.extractionZoneGroup) {
    return { x: refs.extractionZoneGroup.position.x, z: refs.extractionZoneGroup.position.z };
  }
  if (gameState.mission === MISSION_STATE.STEAL_DATA && refs.serverMesh) {
    return { x: refs.serverMesh.position.x, z: refs.serverMesh.position.z };
  }
  if (gameState.mission === MISSION_STATE.INFILTRATE) {
    const lockedGate =
      gates.find((g) => g.missionKey === gameState.activeMissionKey && !g.unlocked) ||
      gates.find((g) => !g.unlocked);
    if (lockedGate) return { x: lockedGate.panelMesh.position.x, z: lockedGate.panelMesh.position.z };
    if (activeCfg?.isVehicleTheft && gameState.targetCar) {
      return { x: gameState.targetCar.mesh.position.x, z: gameState.targetCar.mesh.position.z };
    }
  }
  if (missionMarkers.length > 0 && refs.playerGroup) {
    let best = missionMarkers[0].pos;
    let bestD = Infinity;
    for (const m of missionMarkers) {
      const d = refs.playerGroup.position.distanceTo(m.pos);
      if (d < bestD) {
        bestD = d;
        best = m.pos;
      }
    }
    return { x: best.x, z: best.z };
  }
  return null;
}

const MAP_BOUNDS = { minX: -280, maxX: 660, minZ: -260, maxZ: 520 };

export function renderTacticalMap() {
  if (!dom.tacticalMapCanvas) return;
  const ctx = dom.tacticalMapCanvas.getContext('2d');
  const w = dom.tacticalMapCanvas.width;
  const h = dom.tacticalMapCanvas.height;
  const toCanvas = (wx, wz) => ({
    x: ((wx - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX)) * w,
    y: ((wz - MAP_BOUNDS.minZ) / (MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ)) * h
  });

  // Água da Baía SF
  ctx.fillStyle = '#07172b';
  ctx.fillRect(0, 0, w, h);

  // 4 Distritos terrestres
  const drawRectWorld = (x1, z1, x2, z2, fill, stroke, label) => {
    const p1 = toCanvas(x1, z1);
    const p2 = toCanvas(x2, z2);
    ctx.fillStyle = fill;
    ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    if (label) {
      ctx.fillStyle = 'rgba(220, 240, 255, 0.72)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(label, p1.x + 8, p1.y + 16);
    }
  };

  drawRectWorld(-260, -140, 80, 120, '#101a2e', 'rgba(0,240,255,0.45)', 'DOWNTOWN & FINANCIAL');
  drawRectWorld(-260, 120, 80, 500, '#121d2d', 'rgba(0,255,136,0.4)', 'DISTRITO SUL & COLINAS');
  drawRectWorld(400, -140, 640, 360, '#161b2a', 'rgba(255,170,0,0.45)', 'DOCAS & PORTUÁRIO');

  // Ponte Golden Gate e Ponte Sul
  [
    { z: 35, color: '#ff5a1f', label: 'GOLDEN GATE' },
    { z: 320, color: '#00f0ff', label: 'PONTE SUL' }
  ].forEach((b) => {
    const s = toCanvas(80, b.z);
    const e = toCanvas(400, b.z);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();
    ctx.fillStyle = b.color;
    ctx.font = 'bold 10px monospace';
    ctx.fillText(b.label, (s.x + e.x) / 2 - 36, s.y - 7);
  });

  // Garagem DedSec
  const gar = toCanvas(-120, 320);
  ctx.fillStyle = '#00ff88';
  ctx.fillRect(gar.x - 6, gar.y - 6, 12, 12);
  ctx.font = '10px monospace';
  ctx.fillText('GARAGEM DEDSEC', gar.x + 10, gar.y + 4);

  // Mirante Twin Peaks
  const mir = toCanvas(38, 415);
  ctx.fillStyle = '#00ff88';
  ctx.beginPath();
  ctx.moveTo(mir.x, mir.y - 7);
  ctx.lineTo(mir.x + 6, mir.y + 5);
  ctx.lineTo(mir.x - 6, mir.y + 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('▲ MIRANTE TWIN PEAKS', mir.x + 9, mir.y + 3);

  // Lanchas na baía
  boats.forEach((b) => {
    const bp = toCanvas(b.mesh.position.x, b.mesh.position.z);
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 255, 136, 0.85)';
    ctx.font = '9px monospace';
    ctx.fillText('LANCHA', bp.x + 6, bp.y + 3);
  });

  // Lojas (Style, Motors, Armory) com rótulos desencavalados
  stores.forEach((st) => {
    const sp = toCanvas(st.pos.x, st.pos.z);
    ctx.fillStyle = st.type === 'STYLE' ? '#d946ef' : st.type === 'MOTORS' ? '#00f0ff' : '#ffaa00';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 9px monospace';
    if (st.type === 'STYLE') {
      ctx.textAlign = 'right';
      ctx.fillText(st.name, sp.x - 8, sp.y + 3);
    } else if (st.type === 'MOTORS') {
      ctx.textAlign = 'center';
      ctx.fillText(st.name, sp.x, sp.y + 17);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(st.name, sp.x + 8, sp.y + 3);
    }
  });
  ctx.textAlign = 'left';

  // Complexos protegidos, Delegacia SFPD, Postos de Resgate, Missões Verticais & Pontos de Entrega no Mapa Tático
  [
    { x: -195, z: 220, label: 'DEPÓSITO BLUME [03]', color: '#ff00aa' },
    { x: 495, z: 165, label: 'HANGAR ctOS [04]', color: '#00ff88' },
    { x: -220, z: 390, label: 'COFRE TWIN PEAKS [05]', color: '#ffaa00' },
    { x: 52, z: 16, label: 'COBERTURA BLUME [06]', color: '#ff0055' },
    { x: -52, z: 42, label: 'HOTEL SUÍTE [07]', color: '#d946ef' },
    { x: -240, z: -220, label: 'RESGATE 01 [NORTE]', color: '#00f0ff' },
    { x: 520, z: 340, label: 'RESGATE 02 [SUL-LESTE]', color: '#ffaa00' },
    { x: 485, z: -245, label: 'DELEGACIA SFPD', color: '#38bdf8' },
    { x: 435, z: -135, label: 'DOCA NORTE', color: '#00ff88' },
    { x: -210, z: -140, label: 'GARAGEM OESTE', color: '#00f0ff' },
    { x: 460, z: -40, label: 'DOCA LESTE', color: '#ffaa00' }
  ].forEach((poi) => {
    const pp = toCanvas(poi.x, poi.z);
    ctx.strokeStyle = poi.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pp.x - 6, pp.y - 5, 12, 10);
    ctx.fillStyle = poi.color;
    ctx.font = 'bold 9px monospace';
    ctx.fillText(poi.label, pp.x + 8, pp.y + 3);
  });

  // Contratos disponíveis
  missionMarkers.forEach((m) => {
    const mp = toCanvas(m.pos.x, m.pos.z);
    ctx.strokeStyle = m.key.startsWith('VIP_CAR') || m.key === 'HOTEL_RESCUE_07'
      ? '#d946ef'
      : m.key === 'BLUME_PENTHOUSE_06'
      ? '#ff0055'
      : m.key === 'HEIST_BLUME_03'
      ? '#ff00aa'
      : m.key === 'HEIST_CTOS_04'
      ? '#00ff88'
      : m.key === 'HEIST_VALKYRIE_05' || m.key === 'RESCUE_02'
      ? '#ffaa00'
      : m.key === 'RESCUE_01' || m.key === 'COMPLEXO_CTOS'
      ? '#00f0ff'
      : '#ffaa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mp.x, mp.y, 7, 0, Math.PI * 2);
    ctx.stroke();
  });

  // GPS Waypoint ativo + rota traçada
  const pPos = refs.playerGroup?.position;
  const target = getActiveGpsTarget();
  if (pPos && target) {
    const pp = toCanvas(pPos.x, pPos.z);
    const tp = toCanvas(target.x, target.z);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pp.x, pp.y);
    ctx.lineTo(tp.x, tp.y);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Posição do jogador
  if (pPos) {
    const pp = toCanvas(pPos.x, pPos.z);
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function openCoopModal() {
  const modal = document.getElementById('coop-modal');
  if (!modal) return;
  gameState.coopModalOpen = true;
  modal.classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
}

export function closeCoopModal() {
  const modal = document.getElementById('coop-modal');
  gameState.coopModalOpen = false;
  if (modal) modal.classList.add('hidden');
  if (!gameState.authOpen && dom.canvas) dom.canvas.requestPointerLock?.();
}

export function setupCoopUI(networkManager) {
  const btnCreate = document.getElementById('btn-coop-create');
  const roomBox = document.getElementById('coop-room-box');
  const roomCodeInput = document.getElementById('coop-room-code');
  const btnCopy = document.getElementById('btn-coop-copy');
  const joinInput = document.getElementById('coop-join-code');
  const btnJoin = document.getElementById('btn-coop-join');
  const statusEl = document.getElementById('coop-status');
  const btnDisc = document.getElementById('btn-coop-disconnect');
  const btnClose = document.getElementById('btn-close-coop');

  networkManager.on('onStatusChange', ({ text, online, roomCode, error }) => {
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.classList.toggle('online', !!online);
      statusEl.style.color = error ? '#ff4d79' : '';
    }
    if (roomCode && roomBox && roomCodeInput) {
      roomCodeInput.value = roomCode;
      roomBox.classList.remove('hidden');
    }
    if (btnDisc) {
      btnDisc.classList.toggle('hidden', networkManager.mode === 'OFFLINE_SOLO');
    }
  });

  btnCreate?.addEventListener('click', async () => {
    const code = await networkManager.createRoom();
    if (code && roomBox && roomCodeInput) {
      roomCodeInput.value = code;
      roomBox.classList.remove('hidden');
    }
  });

  btnCopy?.addEventListener('click', async () => {
    if (!roomCodeInput?.value) return;
    try {
      await navigator.clipboard.writeText(roomCodeInput.value);
      btnCopy.textContent = 'COPIADO!';
      setTimeout(() => { btnCopy.textContent = 'COPIAR CÓDIGO'; }, 1400);
    } catch {
      roomCodeInput.select();
    }
  });

  btnJoin?.addEventListener('click', () => {
    networkManager.joinRoom(joinInput?.value);
  });

  btnDisc?.addEventListener('click', () => {
    networkManager.disconnect();
    if (roomBox) roomBox.classList.add('hidden');
  });

  btnClose?.addEventListener('click', () => closeCoopModal());
}

export function toggleTacticalMap(forceState) {
  if (!dom.tacticalMapModal) return;
  gameState.tacticalMapOpen = forceState !== undefined ? forceState : !gameState.tacticalMapOpen;
  if (gameState.tacticalMapOpen) {
    renderTacticalMap();
    dom.tacticalMapModal.classList.remove('hidden');
    if (document.pointerLockElement === dom.canvas) {
      document.exitPointerLock();
    }
  } else {
    dom.tacticalMapModal.classList.add('hidden');
    dom.canvas.requestPointerLock();
  }
}

export function toggleQuickGuide(forceState) {
  if (!dom.quickGuideModal) return;
  gameState.quickGuideOpen = forceState !== undefined ? forceState : !gameState.quickGuideOpen;
  if (gameState.quickGuideOpen) {
    dom.quickGuideModal.classList.remove('hidden');
    if (document.pointerLockElement === dom.canvas) {
      document.exitPointerLock();
    }
  } else {
    dom.quickGuideModal.classList.add('hidden');
    if (
      !gameState.touchEnabled &&
      gameState.mission !== MISSION_STATE.INTRO &&
      gameState.mission !== MISSION_STATE.GAMEOVER &&
      gameState.mission !== MISSION_STATE.VICTORY
    ) {
      dom.canvas.requestPointerLock();
    }
  }
}

export function toggleShadows(forceState) {
  gameState.shadowsEnabled = forceState !== undefined ? forceState : !gameState.shadowsEnabled;
  if (refs.renderer) {
    refs.renderer.shadowMap.enabled = gameState.shadowsEnabled;
    if (gameState.shadowsEnabled) {
      refs.renderer.shadowMap.needsUpdate = true;
    }
  }
  if (dom.btnToggleShadows) {
    dom.btnToggleShadows.textContent = gameState.shadowsEnabled ? 'SOMBRAS: ON' : 'SOMBRAS: OFF';
    dom.btnToggleShadows.classList.toggle('active', gameState.shadowsEnabled);
  }
}

// ==========================================
// CONTROLES TOUCH MOBILE & EDITOR DE HUD ("MEXE OS CONTROLES")
// ==========================================
const TOUCH_HUD_STORAGE_KEY = 'dedsec_mobile_hud_layout';
let _touchControlsInitialized = false;
let _lastTouchContext = '';

function _loadTouchLayout() {
  try {
    const raw = localStorage.getItem(TOUCH_HUD_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function _applyTouchLayout(layout) {
  if (!dom.mobileControls) return;
  const scalePct = THREE.MathUtils.clamp(Number(layout?.scale ?? 100), 70, 140);
  const opacityPct = THREE.MathUtils.clamp(Number(layout?.opacity ?? 85), 30, 100);
  dom.mobileControls.style.setProperty('--touch-scale', String(scalePct / 100));
  dom.mobileControls.style.setProperty('--touch-opacity', String(opacityPct / 100));
  if (dom.touchScaleSlider) dom.touchScaleSlider.value = String(scalePct);
  if (dom.touchScaleValue) dom.touchScaleValue.textContent = `${scalePct}%`;
  if (dom.touchOpacitySlider) dom.touchOpacitySlider.value = String(opacityPct);
  if (dom.touchOpacityValue) dom.touchOpacityValue.textContent = `${opacityPct}%`;

  const draggables = dom.mobileControls.querySelectorAll('.touch-draggable[data-touch-id]');
  draggables.forEach((el) => {
    const id = el.dataset.touchId;
    const pos = layout?.positions?.[id];
    if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) {
      el.style.left = `${THREE.MathUtils.clamp(pos.left, 4, 96)}%`;
      el.style.top = `${THREE.MathUtils.clamp(pos.top, 8, 94)}%`;
    } else {
      el.style.left = '';
      el.style.top = '';
    }
  });
}

function _saveCurrentTouchLayout() {
  if (!dom.mobileControls) return;
  const scale = Number(dom.touchScaleSlider?.value || 100);
  const opacity = Number(dom.touchOpacitySlider?.value || 85);
  const positions = {};
  const draggables = dom.mobileControls.querySelectorAll('.touch-draggable[data-touch-id]');
  draggables.forEach((el) => {
    if (el.style.left && el.style.top) {
      positions[el.dataset.touchId] = {
        left: parseFloat(el.style.left),
        top: parseFloat(el.style.top)
      };
    }
  });
  try {
    localStorage.setItem(TOUCH_HUD_STORAGE_KEY, JSON.stringify({ scale, opacity, positions }));
  } catch {}
}

export function toggleTouchControls(forceState) {
  gameState.touchEnabled = forceState !== undefined ? !!forceState : !gameState.touchEnabled;
  if (dom.btnToggleTouch) {
    dom.btnToggleTouch.textContent = gameState.touchEnabled ? 'CONTROLES TOUCH: ON' : 'CONTROLES TOUCH: OFF';
    dom.btnToggleTouch.classList.toggle('active', gameState.touchEnabled);
  }
  if (!gameState.touchEnabled && gameState.touchEditMode) {
    setTouchEditMode(false);
  }
  updateMobileControlsContext(true);
}

export function setTouchEditMode(active) {
  gameState.touchEditMode = !!active;
  if (gameState.touchEditMode) {
    if (!gameState.touchEnabled) toggleTouchControls(true);
    if (gameState.quickGuideOpen) toggleQuickGuide(false);
    if (document.pointerLockElement === dom.canvas) document.exitPointerLock();
    gameState.touchMoveX = 0;
    gameState.touchMoveZ = 0;
    gameState.mouseDown = false;
  }
  if (dom.mobileControls) {
    dom.mobileControls.classList.toggle('editing-mode', gameState.touchEditMode);
  }
  if (dom.touchEditorBar) {
    dom.touchEditorBar.classList.toggle('hidden', !gameState.touchEditMode);
  }
  if (dom.btnMobileHudGear) {
    dom.btnMobileHudGear.classList.toggle('hidden', gameState.touchEditMode);
  }
  updateMobileControlsContext(true);
}

export function updateMobileControlsContext(force = false) {
  if (!dom.mobileControls) return;
  const modalBlocking =
    gameState.authOpen ||
    gameState.terminalOpen ||
    gameState.missionModalOpen ||
    gameState.shopOpen ||
    gameState.tacticalMapOpen ||
    gameState.quickGuideOpen ||
    gameState.coopModalOpen ||
    gameState.mission === MISSION_STATE.GAMEOVER ||
    gameState.mission === MISSION_STATE.VICTORY;

  const shouldShow = gameState.touchEnabled && !modalBlocking;
  dom.mobileControls.classList.toggle('hidden', !shouldShow);
  if (!shouldShow) return;

  const ctx = gameState.droneActive
    ? 'drone'
    : gameState.drivingCar || gameState.drivingBoat
    ? 'vehicle'
    : 'foot';

  if (!force && ctx === _lastTouchContext) return;
  _lastTouchContext = ctx;

  const items = dom.mobileControls.querySelectorAll('.touch-draggable[data-context]');
  items.forEach((el) => {
    const allowed = (el.dataset.context || '').split(',');
    el.classList.toggle('hidden', !allowed.includes(ctx));
  });
}

export function setupMobileTouchControls(handlers = {}) {
  if (_touchControlsInitialized || !dom.mobileControls) return;
  _touchControlsInitialized = true;

  const saved = _loadTouchLayout();
  _applyTouchLayout(saved);

  const isTouchDevice =
    'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0 || window.innerWidth < 950;
  toggleTouchControls(isTouchDevice);

  dom.btnToggleTouch?.addEventListener('click', () => {
    toggleTouchControls();
    AudioManager.playKeyBeep();
  });

  dom.btnEditTouchHud?.addEventListener('click', () => {
    setTouchEditMode(true);
    AudioManager.playKeyBeep();
  });

  dom.btnMobileHudGear?.addEventListener('click', () => {
    setTouchEditMode(true);
    AudioManager.playKeyBeep();
  });

  dom.touchScaleSlider?.addEventListener('input', () => {
    const v = Number(dom.touchScaleSlider.value);
    dom.mobileControls.style.setProperty('--touch-scale', String(v / 100));
    if (dom.touchScaleValue) dom.touchScaleValue.textContent = `${v}%`;
  });

  dom.touchOpacitySlider?.addEventListener('input', () => {
    const v = Number(dom.touchOpacitySlider.value);
    dom.mobileControls.style.setProperty('--touch-opacity', String(v / 100));
    if (dom.touchOpacityValue) dom.touchOpacityValue.textContent = `${v}%`;
  });

  dom.btnTouchReset?.addEventListener('click', () => {
    try {
      localStorage.removeItem(TOUCH_HUD_STORAGE_KEY);
    } catch {}
    _applyTouchLayout(null);
    AudioManager.playKeyBeep();
  });

  dom.btnTouchSave?.addEventListener('click', () => {
    _saveCurrentTouchLayout();
    setTouchEditMode(false);
    AudioManager.playTerminalSuccess();
  });

  // Arrastar qualquer controle no Modo Edição ("MEXE OS CONTROLES")
  const draggables = dom.mobileControls.querySelectorAll('.touch-draggable[data-touch-id]');
  draggables.forEach((el) => {
    let dragPointerId = null;
    el.addEventListener('pointerdown', (e) => {
      if (!gameState.touchEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      dragPointerId = e.pointerId;
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!gameState.touchEditMode || dragPointerId !== e.pointerId) return;
      e.preventDefault();
      const leftPct = THREE.MathUtils.clamp((e.clientX / window.innerWidth) * 100, 4, 96);
      const topPct = THREE.MathUtils.clamp((e.clientY / window.innerHeight) * 100, 8, 94);
      el.style.left = `${leftPct.toFixed(1)}%`;
      el.style.top = `${topPct.toFixed(1)}%`;
    });
    const endDrag = (e) => {
      if (dragPointerId === e.pointerId) dragPointerId = null;
    };
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
  });

  // Analógico Virtual Flutuante (Lado Esquerdo — Multi-Touch)
  if (dom.touchJoystickZone && dom.touchJoystickBase && dom.touchJoystickKnob) {
    let joyPointerId = null;
    let joyCenterX = 0;
    let joyCenterY = 0;
    const maxRadius = 44;

    const resetJoystick = () => {
      joyPointerId = null;
      gameState.touchMoveX = 0;
      gameState.touchMoveZ = 0;
      dom.touchJoystickKnob.style.transform = 'translate(0px, 0px)';
    };

    dom.touchJoystickZone.addEventListener('pointerdown', (e) => {
      if (gameState.touchEditMode) return;
      e.preventDefault();
      AudioManager.init();
      joyPointerId = e.pointerId;
      dom.touchJoystickZone.setPointerCapture?.(e.pointerId);
      const rect = dom.touchJoystickBase.getBoundingClientRect();
      joyCenterX = rect.left + rect.width / 2;
      joyCenterY = rect.top + rect.height / 2;
      const dx = e.clientX - joyCenterX;
      const dy = e.clientY - joyCenterY;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      const ox = Math.cos(angle) * clamped;
      const oy = Math.sin(angle) * clamped;
      dom.touchJoystickKnob.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px)`;
      gameState.touchMoveX = ox / maxRadius;
      gameState.touchMoveZ = -oy / maxRadius;
    });

    dom.touchJoystickZone.addEventListener('pointermove', (e) => {
      if (gameState.touchEditMode || joyPointerId !== e.pointerId) return;
      e.preventDefault();
      const dx = e.clientX - joyCenterX;
      const dy = e.clientY - joyCenterY;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      const ox = Math.cos(angle) * clamped;
      const oy = Math.sin(angle) * clamped;
      dom.touchJoystickKnob.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px)`;
      gameState.touchMoveX = ox / maxRadius;
      gameState.touchMoveZ = -oy / maxRadius;
    });

    dom.touchJoystickZone.addEventListener('pointerup', (e) => {
      if (joyPointerId === e.pointerId) resetJoystick();
    });
    dom.touchJoystickZone.addEventListener('pointercancel', (e) => {
      if (joyPointerId === e.pointerId) resetJoystick();
    });
  }

  // Área Central/Direita de Toque para Rotacionar Câmera sem Pointer Lock
  if (dom.touchLookZone) {
    let lookPointerId = null;
    let lastX = 0;
    let lastY = 0;

    dom.touchLookZone.addEventListener('pointerdown', (e) => {
      if (gameState.touchEditMode) return;
      e.preventDefault();
      AudioManager.init();
      lookPointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      dom.touchLookZone.setPointerCapture?.(e.pointerId);
    });

    dom.touchLookZone.addEventListener('pointermove', (e) => {
      if (gameState.touchEditMode || lookPointerId !== e.pointerId) return;
      e.preventDefault();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      const sens = (gameState.mouseSensitivity || 0.0024) * 1.65;
      if (gameState.activeCamIndex >= 0) {
        const camObj = securityCameras[gameState.activeCamIndex];
        if (camObj) {
          camObj.yawOffset = THREE.MathUtils.clamp(camObj.yawOffset - dx * sens, -0.9, 0.9);
          camObj.pitchOffset = THREE.MathUtils.clamp(camObj.pitchOffset - dy * sens, -0.45, 0.35);
        }
      } else if (gameState.droneActive) {
        gameState.droneYaw -= dx * sens;
        gameState.dronePitch = THREE.MathUtils.clamp(gameState.dronePitch + dy * sens, -0.85, 0.85);
      } else {
        gameState.cameraYaw -= dx * sens;
        const minPitch = gameState.firstPerson ? -0.85 : 0.08;
        const maxPitch = gameState.firstPerson ? 0.85 : 1.15;
        gameState.cameraPitch = THREE.MathUtils.clamp(gameState.cameraPitch + dy * sens, minPitch, maxPitch);
      }
    });

    const endLook = (e) => {
      if (lookPointerId === e.pointerId) lookPointerId = null;
    };
    dom.touchLookZone.addEventListener('pointerup', endLook);
    dom.touchLookZone.addEventListener('pointercancel', endLook);
  }

  // Botões de Ação Contextuais Multi-Touch
  const actionButtons = dom.mobileControls.querySelectorAll('.touch-btn[data-action]');
  actionButtons.forEach((btn) => {
    const action = btn.dataset.action;
    let activePointerId = null;

    btn.addEventListener('pointerdown', (e) => {
      if (gameState.touchEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      AudioManager.init();
      activePointerId = e.pointerId;
      btn.setPointerCapture?.(e.pointerId);
      btn.classList.add('active');

      if (action === 'shoot') {
        gameState.mouseDown = true;
        handlers.fireWeapon?.();
      } else if (action === 'jump' || action === 'drone_up') {
        gameState.keys['Space'] = true;
      } else if (action === 'drone_down') {
        gameState.keys['ControlLeft'] = true;
      } else if (action === 'hack') {
        gameState.keys['KeyE'] = true;
        handlers.handleInteract?.();
      } else if (action === 'vehicle') {
        handlers.toggleVehicle?.();
      } else if (action === 'drone') {
        handlers.toggleDrone?.();
      } else if (action === 'nethack') {
        handlers.toggleNetHack?.();
      } else if (action === 'sprint') {
        gameState.touchSprintToggle = !gameState.touchSprintToggle;
        btn.classList.toggle('active', gameState.touchSprintToggle);
      } else if (action === 'weapon') {
        handlers.cycleWeapon?.();
      } else if (action === 'steer_left') {
        gameState.keys['KeyA'] = true;
      } else if (action === 'steer_right') {
        gameState.keys['KeyD'] = true;
      } else if (action === 'accel') {
        gameState.keys['KeyW'] = true;
      } else if (action === 'brake') {
        gameState.keys['KeyS'] = true;
      } else if (action === 'nitro') {
        gameState.keys['ShiftLeft'] = true;
      }
    });

    const releaseAction = (e) => {
      if (activePointerId !== e.pointerId) return;
      activePointerId = null;
      if (action !== 'sprint') btn.classList.remove('active');

      if (action === 'shoot') {
        gameState.mouseDown = false;
      } else if (action === 'jump' || action === 'drone_up') {
        gameState.keys['Space'] = false;
      } else if (action === 'drone_down') {
        gameState.keys['ControlLeft'] = false;
      } else if (action === 'hack') {
        gameState.keys['KeyE'] = false;
      } else if (action === 'steer_left') {
        gameState.keys['KeyA'] = false;
      } else if (action === 'steer_right') {
        gameState.keys['KeyD'] = false;
      } else if (action === 'accel') {
        gameState.keys['KeyW'] = false;
      } else if (action === 'brake') {
        gameState.keys['KeyS'] = false;
      } else if (action === 'nitro') {
        gameState.keys['ShiftLeft'] = false;
      }
    };

    btn.addEventListener('pointerup', releaseAction);
    btn.addEventListener('pointercancel', releaseAction);
  });
}

export function setMouseSensitivity(val) {
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return;
  gameState.mouseSensitivity = num;
  if (dom.sensButtons) {
    dom.sensButtons.forEach((btn) => {
      btn.classList.toggle('active', Number(btn.dataset.sens) === num);
    });
  }
}

export function handleTacticalMapClick(e) {
  if (!dom.tacticalMapCanvas) return;
  const rect = dom.tacticalMapCanvas.getBoundingClientRect();
  const rx = (e.clientX - rect.left) / rect.width;
  const ry = (e.clientY - rect.top) / rect.height;
  const wx = MAP_BOUNDS.minX + rx * (MAP_BOUNDS.maxX - MAP_BOUNDS.minX);
  const wz = MAP_BOUNDS.minZ + ry * (MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ);
  gameState.gpsWaypoint = { x: wx, z: wz };
  AudioManager.playKeyBeep();
  renderTacticalMap();
}

export function triggerGameOver(
  title = 'AGENTE ABATIDO',
  desc = 'Os guardas do complexo neutralizaram sua infiltração.'
) {
  gameState.mission = MISSION_STATE.GAMEOVER;
  gameState.droneActive = false;
  if (refs.droneGroup) refs.droneGroup.visible = false;
  if (refs.playerGroup) refs.playerGroup.visible = true;
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
  if (dom.ctosRevealBanner) dom.ctosRevealBanner.classList.add('hidden');
  if (dom.droneHud) dom.droneHud.classList.add('hidden');
  if (dom.cameraOverlay) dom.cameraOverlay.classList.add('hidden');
  if (dom.cockpitHud) dom.cockpitHud.classList.add('hidden');
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
  gameState.droneActive = false;
  if (refs.droneGroup) refs.droneGroup.visible = false;
  // Desvincula o carro entregue (contratos VIP) e coloca o jogador ao lado dele, visível e a pé
  const deliveredCar = gameState.drivingCar;
  if (deliveredCar && refs.playerGroup) {
    const yaw = deliveredCar.mesh.rotation.y;
    const outX = deliveredCar.mesh.position.x + Math.cos(yaw) * 2.8;
    const outZ = deliveredCar.mesh.position.z - Math.sin(yaw) * 2.8;
    refs.playerGroup.position.set(outX, getSurfaceHeight(outX, outZ), outZ);
    deliveredCar.speed = 0;
    if (deliveredCar.headlight) deliveredCar.headlight.intensity = 0;
  }
  gameState.drivingCar = null;
  gameState.drivingBoat = null;
  if (refs.activeHeadlight) refs.activeHeadlight.intensity = 0;
  if (refs.playerGroup) refs.playerGroup.visible = true;
  if (dom.droneHud) dom.droneHud.classList.add('hidden');
  if (dom.cameraOverlay) dom.cameraOverlay.classList.add('hidden');
  if (dom.cockpitHud) dom.cockpitHud.classList.add('hidden');
  if (dom.ctosRevealBanner) dom.ctosRevealBanner.classList.add('hidden');
  AudioManager.stopMusic();
  AudioManager.stopEngineSound();
  AudioManager.stopRadio();
  AudioManager.playVictoryChime();
  if (document.pointerLockElement === dom.canvas) {
    document.exitPointerLock();
  }
  const completedKey = gameState.activeMissionKey || gameState.selectedMap;
  if (completedKey && !gameState.completedMissions.includes(completedKey)) {
    gameState.completedMissions.push(completedKey);
  }
  const activeCfg = MAPS_CONFIG[completedKey] || MAPS_CONFIG.COMPLEXO_CTOS;
  const rank = calculateMissionRank();
  const rewardMap = {
    'RANK S - FANTASMA': 2500,
    'RANK A - INFILTRADOR': 1800,
    'RANK B - OPERATIVO': 1300,
    'RANK C': 1000
  };
  const reward =
    activeCfg.isVehicleTheft || activeCfg.isRescue || activeCfg.isVerticalHeist
      ? activeCfg.reward || 2000
      : rewardMap[rank] || 1000;
  gameState.money += reward;
  updateMoneyHUD();

  dom.hud.classList.add('hidden');
  dom.finalTime.textContent = formatTime(gameState.elapsedTime);
  if (dom.finalRank) {
    dom.finalRank.textContent = activeCfg.isVehicleTheft
      ? 'ENTREGA VIP CONCLUÍDA'
      : activeCfg.isRescue
      ? 'RESGATE CONCLUÍDO'
      : rank;
  }
  if (dom.finalReward) dom.finalReward.textContent = `+$${reward.toLocaleString('pt-BR')}`;
  if (dom.finalDetection) dom.finalDetection.textContent = `${Math.round(gameState.maxDetection)}%`;
  if (dom.finalHacks) dom.finalHacks.textContent = String(gameState.hacksUsed);
  if (dom.finalMap) {
    dom.finalMap.textContent = activeCfg.label;
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

  const isDrone = gameState.droneActive && !!refs.droneGroup;
  const centerPos = isDrone ? refs.droneGroup.position : refs.playerGroup.position;
  const radarYaw = isDrone ? gameState.droneYaw : gameState.cameraYaw;

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

  // Transformar mundo para o espaço do radar (agente ou drone no centro)
  ctx.translate(cx, cy);
  ctx.rotate(radarYaw);

  const toRadar = (wx, wz) => ({
    x: (wx - centerPos.x) * scale,
    y: (wz - centerPos.z) * scale
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

  // Pontos de entrega de veículos (Garagem Sul, Doca Norte, Garagem Oeste)
  const activeDelivery =
    gameState.mission === MISSION_STATE.STEAL_CAR && MAPS_CONFIG[gameState.activeMissionKey]?.extractPos
      ? MAPS_CONFIG[gameState.activeMissionKey].extractPos
      : [-120, 0.06, 320];
  const garPos = toRadar(activeDelivery[0], activeDelivery[2]);
  ctx.fillStyle = gameState.mission === MISSION_STATE.STEAL_CAR ? 'rgba(0, 255, 136, 0.7)' : 'rgba(0, 255, 136, 0.35)';
  ctx.fillRect(garPos.x - 6, garPos.y - 5, 12, 10);
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(garPos.x - 6, garPos.y - 5, 12, 10);
  if (gameState.mission === MISSION_STATE.STEAL_CAR) {
    ctx.beginPath();
    ctx.arc(garPos.x, garPos.y, 9, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Lojas interativas no radar (ícones distintos: Roupas, Armas e Concessionária)
  stores.forEach((st) => {
    const sp = toRadar(st.pos.x, st.pos.z);
    if (st.type === 'STYLE') {
      // Losango magenta para Loja de Roupas
      ctx.fillStyle = '#d946ef';
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y - 5);
      ctx.lineTo(sp.x + 5, sp.y);
      ctx.lineTo(sp.x, sp.y + 5);
      ctx.lineTo(sp.x - 5, sp.y);
      ctx.closePath();
      ctx.fill();
    } else if (st.type === 'MOTORS') {
      // Anel duplo ciano para Concessionária SF Motors
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Quadrado âmbar para Loja de Armas
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(sp.x - 4, sp.y - 4, 8, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(sp.x - 4, sp.y - 4, 8, 8);
    }
  });

  // Marcadores de missão no radar
  missionMarkers.forEach((m) => {
    const mp = toRadar(m.pos.x, m.pos.z);
    ctx.strokeStyle = m.key.startsWith('VIP_CAR') || m.key === 'HOTEL_RESCUE_07'
      ? '#d946ef'
      : m.key === 'BLUME_PENTHOUSE_06'
      ? '#ff0055'
      : m.key === 'HEIST_BLUME_03'
      ? '#ff00aa'
      : m.key === 'HEIST_CTOS_04'
      ? '#00ff88'
      : m.key === 'HEIST_VALKYRIE_05' || m.key === 'RESCUE_02'
      ? '#ffaa00'
      : m.key === 'RESCUE_01' || m.key === 'COMPLEXO_CTOS'
      ? '#00f0ff'
      : '#ffaa00';
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
  [[66, 62], [66, 220], [404, 62], [404, -120]].forEach(([px, pz]) => {
    const pp = toRadar(px, pz);
    ctx.fillStyle = 'rgba(28, 38, 59, 0.9)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(pp.x - 4 * scale, pp.y - 5 * scale, 8 * scale, 10 * scale);
    ctx.strokeRect(pp.x - 4 * scale, pp.y - 5 * scale, 8 * scale, 10 * scale);
  });

  // Mirante Twin Peaks no radar
  const mirPos = toRadar(38, 415);
  ctx.fillStyle = '#00ff88';
  ctx.beginPath();
  ctx.moveTo(mirPos.x, mirPos.y - 7);
  ctx.lineTo(mirPos.x + 6, mirPos.y + 4);
  ctx.lineTo(mirPos.x - 6, mirPos.y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('MIRANTE', mirPos.x - 18, mirPos.y + 14);

  boats.forEach((boat) => {
    const bp = toRadar(boat.mesh.position.x, boat.mesh.position.z);
    ctx.save();
    ctx.translate(bp.x, bp.y);
    ctx.rotate(-boat.mesh.rotation.y);
    ctx.fillStyle = '#00ff88';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 3.2 * scale);
    ctx.lineTo(1.4 * scale, 1.2 * scale);
    ctx.lineTo(1.4 * scale, -2.4 * scale);
    ctx.lineTo(-1.4 * scale, -2.4 * scale);
    ctx.lineTo(-1.4 * scale, 1.2 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // Carros (estacionados, VIPs e DedSec dirigível)
  cars.forEach((car) => {
    const cp = toRadar(car.mesh.position.x, car.mesh.position.z);
    ctx.save();
    ctx.translate(cp.x, cp.y);
    ctx.rotate(-car.mesh.rotation.y);
    ctx.fillStyle = car.destroyed
      ? '#334155'
      : car === gameState.targetCar
      ? '#d946ef'
      : car.isDedsec
      ? '#00f0ff'
      : car.hackedUsed
      ? '#ffaa00'
      : car.isTraffic
      ? '#38bdf8'
      : '#94a3b8';
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

  // Parceiros Co-op remotos no Radar DedSec (marcador azul vibrante)
  remotePlayers.forEach((entry) => {
    const rp = toRadar(entry.group.position.x, entry.group.position.z);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(rp.x, rp.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

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

  // Linha guia GPS tracejada no Radar DedSec até o objetivo/waypoint ativo & distância no HUD
  const gpsTarget = getActiveGpsTarget();
  if (dom.gpsDistance) {
    if (gpsTarget) {
      const pPos = isDrone ? refs.droneGroup.position : refs.playerGroup.position;
      const distM = Math.round(Math.hypot(gpsTarget.x - pPos.x, gpsTarget.z - pPos.z));
      dom.gpsDistance.textContent = `// GPS: ${distM}m`;
    } else {
      dom.gpsDistance.textContent = '';
    }
  }
  if (gpsTarget) {
    const gp = toRadar(gpsTarget.x, gpsTarget.z);
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = gameState.gpsWaypoint ? '#00ff88' : '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(gp.x, gp.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(gp.x, gp.y, 4.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Marcador verde para a posição onde o corpo do agente ficou enquanto pilota o drone
  if (isDrone) {
    const bodyPt = toRadar(refs.playerGroup.position.x, refs.playerGroup.position.z);
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(bodyPt.x, bodyPt.y, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Seta do jogador ou ícone do Drone no centro
  if (isDrone) {
    ctx.rotate(-gameState.droneYaw);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(4, 4);
    ctx.moveTo(4, -4);
    ctx.lineTo(-4, 4);
    ctx.stroke();
  } else {
    ctx.rotate(-refs.playerGroup.rotation.y);
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-4.5, -5);
    ctx.lineTo(0, -2.5);
    ctx.lineTo(4.5, -5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
