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
  formatTime,
  saveProgress
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
}

export function updateNetHackLabels() {
  if (!gameState.netHackActive || !dom.nethackLabels) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const pPos = refs.playerGroup?.position;

  netHackTagItems.forEach((item) => {
    const pos = item.getPos();
    if (item.maxDist < Infinity && pPos && pos.distanceTo(pPos) > item.maxDist) {
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

  if (newState === MISSION_STATE.FREE_ROAM) {
    dom.missionObjective.textContent = 'MUNDO ABERTO // SÃO FRANCISCO';
    dom.missionSub.textContent = 'Explore a cidade, atravesse a Golden Gate ou pise em um marcador de missão';
  } else if (newState === MISSION_STATE.INFILTRATE) {
    dom.missionObjective.textContent = 'HACKEIE O PORTÃO DE ENTRADA';
    dom.missionSub.textContent = 'Aproxime-se do painel na entrada e pressione [E]';
  } else if (newState === MISSION_STATE.STEAL_DATA) {
    dom.missionObjective.textContent = 'BAIXE OS DADOS DO SERVIDOR CENTRAL';
    dom.missionSub.textContent = 'Use cobertura [V / C] contra os guardas e segure [E] no servidor';
  } else if (newState === MISSION_STATE.STEAL_CAR) {
    dom.missionObjective.textContent = 'ROUBE O VEÍCULO VIP E ENTREGUE NA GARAGEM DEDSEC';
    dom.missionSub.textContent = 'Entre no carro marcado [F] e dirija até a Garagem Clandestina no Distrito Sul';
    AudioManager.setMusicTempo(134);
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

export function openShopModal(storeType) {
  if (!dom.shopModal || !dom.shopItems) return;
  gameState.shopOpen = true;
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
  dom.canvas.requestPointerLock();
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
  if (gameState.mission === MISSION_STATE.STEAL_CAR) return { x: -120, z: 320 };
  if (gameState.mission === MISSION_STATE.ESCAPE && refs.extractionZoneGroup) {
    return { x: refs.extractionZoneGroup.position.x, z: refs.extractionZoneGroup.position.z };
  }
  if (gameState.mission === MISSION_STATE.STEAL_DATA && refs.serverMesh) {
    return { x: refs.serverMesh.position.x, z: refs.serverMesh.position.z };
  }
  if (gameState.mission === MISSION_STATE.INFILTRATE) {
    const lockedGate = gates.find((g) => !g.unlocked);
    if (lockedGate) return { x: lockedGate.panelMesh.position.x, z: lockedGate.panelMesh.position.z };
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

const MAP_BOUNDS = { minX: -280, maxX: 660, minZ: -160, maxZ: 520 };

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

  // Lojas (Style, Motors, Armory)
  stores.forEach((st) => {
    const sp = toCanvas(st.pos.x, st.pos.z);
    ctx.fillStyle = st.type === 'STYLE' ? '#d946ef' : st.type === 'MOTORS' ? '#00f0ff' : '#ffaa00';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(st.name, sp.x - 24, sp.y + 16);
  });

  // Contratos disponíveis
  missionMarkers.forEach((m) => {
    const mp = toCanvas(m.pos.x, m.pos.z);
    ctx.strokeStyle = m.key.startsWith('VIP_CAR') ? '#d946ef' : m.key === 'COMPLEXO_CTOS' ? '#00f0ff' : '#ffaa00';
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
  const activeCfg = MAPS_CONFIG[gameState.activeMissionKey || gameState.selectedMap] || MAPS_CONFIG.COMPLEXO_CTOS;
  const rank = calculateMissionRank();
  const rewardMap = {
    'RANK S - FANTASMA': 2500,
    'RANK A - INFILTRADOR': 1800,
    'RANK B - OPERATIVO': 1300,
    'RANK C': 1000
  };
  const reward = activeCfg.isVehicleTheft ? activeCfg.reward || 2000 : rewardMap[rank] || 1000;
  gameState.money += reward;
  updateMoneyHUD();

  dom.hud.classList.add('hidden');
  dom.finalTime.textContent = formatTime(gameState.elapsedTime);
  if (dom.finalRank) dom.finalRank.textContent = activeCfg.isVehicleTheft ? 'ENTREGA VIP CONCLUÍDA' : rank;
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

  // Garagem DedSec no Distrito Sul
  const garPos = toRadar(-120, 320);
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
    ctx.strokeStyle = m.key.startsWith('VIP_CAR')
      ? '#d946ef'
      : m.key === 'COMPLEXO_CTOS'
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

  // Linha guia GPS tracejada no Radar DedSec até o objetivo/waypoint ativo
  const gpsTarget = getActiveGpsTarget();
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
