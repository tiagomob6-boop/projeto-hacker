import * as THREE from 'three';
import {
  MISSION_STATE,
  WEAPON_TYPE,
  MAPS_CONFIG,
  dom,
  refs,
  gameState,
  securityCameras,
  formatTime,
  loadProgress
} from './js/state.js';
import { AudioManager } from './js/audio.js';
import { networkManager } from './js/network.js';
import {
  toggleNetHack,
  closeGateTerminal,
  completeTerminalHack,
  updateNetHackLabels,
  setMissionState,
  closeMissionModal,
  acceptPendingMission,
  closeShopModal,
  toggleTacticalMap,
  toggleQuickGuide,
  toggleShadows,
  setMouseSensitivity,
  handleTacticalMapClick,
  renderTacticalMap,
  toggleRain,
  updateMoneyHUD,
  updateHpHUD,
  updateRadar
} from './js/ui.js';
import {
  selectWeapon,
  triggerBaseAlert,
  fireEquippedWeapon,
  updateProjectiles,
  updateGuardProjectiles,
  updateEmpWaves
} from './js/combat.js';
import {
  cycleSecurityCamera,
  overloadActiveCamera,
  handleInteractPress,
  toggleDriveDedsecCar,
  toggleFirstPerson,
  toggleDrone,
  triggerBlackout,
  applyPlayerSkin,
  upsertRemotePlayer,
  updatePlayer,
  updateCars,
  updateCamera,
  updateElectricBoxes,
  updatePedestrians,
  updateGuards,
  updateInteractionsAndMission
} from './js/entities.js';
import {
  initThree,
  buildMap,
  startContract,
  returnToFreeRoam,
  startMission,
  spawnPurchasedVehicle,
  callRemoteDedsecVehicle,
  spawnPoliceReinforcement,
  updateVisualEffects
} from './js/world.js';

// Registrar callbacks para evitar dependências circulares entre ui.js, combat.js e world.js
refs.onFirewallDisabled = triggerBaseAlert;
refs.onAcceptMission = startContract;
refs.onApplySkin = applyPlayerSkin;
refs.onSelectWeapon = selectWeapon;
refs.onSpawnVehicle = spawnPurchasedVehicle;
refs.onSpawnPolice = spawnPoliceReinforcement;

networkManager.on('onPlayerMove', (packet) => upsertRemotePlayer(packet));

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

    if (gameState.shopOpen) {
      if (code === 'Escape') closeShopModal();
      return;
    }

    if (code === 'Tab') {
      e.preventDefault();
      toggleTacticalMap();
      return;
    }

    if (gameState.tacticalMapOpen) {
      if (code === 'Escape') toggleTacticalMap(false);
      return;
    }

    if (code === 'KeyH') {
      toggleQuickGuide();
      return;
    }

    if (gameState.quickGuideOpen) {
      if (code === 'Escape') toggleQuickGuide(false);
      return;
    }

    const activeMode =
      gameState.mission === MISSION_STATE.FREE_ROAM ||
      gameState.mission === MISSION_STATE.INFILTRATE ||
      gameState.mission === MISSION_STATE.STEAL_DATA ||
      gameState.mission === MISSION_STATE.STEAL_CAR ||
      gameState.mission === MISSION_STATE.RESCUE_PRISONER ||
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
    } else if (code === 'KeyG') {
      callRemoteDedsecVehicle();
    } else if (code === 'KeyN') {
      if (gameState.drivingCar || gameState.drivingBoat) {
        gameState.radioStation = AudioManager.cycleRadioStation();
      }
    } else if (code === 'KeyP') {
      toggleFirstPerson();
    } else if (code === 'KeyQ') {
      toggleDrone();
    } else if (code === 'KeyB') {
      triggerBlackout();
    } else if (code === 'Digit1' || code === 'Numpad1') {
      selectWeapon(WEAPON_TYPE.TASER);
    } else if (code === 'Digit2' || code === 'Numpad2') {
      selectWeapon(WEAPON_TYPE.PISTOL);
    } else if (code === 'Digit3' || code === 'Numpad3') {
      selectWeapon(WEAPON_TYPE.RIFLE);
    } else if (code === 'Digit4' || code === 'Numpad4') {
      selectWeapon(WEAPON_TYPE.EMP);
    } else if (code === 'Digit5' || code === 'Numpad5') {
      selectWeapon(WEAPON_TYPE.SHOTGUN);
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

    const sens = gameState.mouseSensitivity || 0.0024;
    if (gameState.activeCamIndex >= 0) {
      const camObj = securityCameras[gameState.activeCamIndex];
      camObj.yawOffset = THREE.MathUtils.clamp(camObj.yawOffset - e.movementX * sens, -0.9, 0.9);
      camObj.pitchOffset = THREE.MathUtils.clamp(camObj.pitchOffset - e.movementY * sens, -0.45, 0.35);
    } else if (gameState.droneActive) {
      gameState.droneYaw -= e.movementX * sens;
      gameState.dronePitch = THREE.MathUtils.clamp(gameState.dronePitch + e.movementY * sens, -0.85, 0.85);
    } else {
      gameState.cameraYaw -= e.movementX * sens;
      const minPitch = gameState.firstPerson ? -0.85 : 0.08;
      const maxPitch = gameState.firstPerson ? 0.85 : 1.15;
      gameState.cameraPitch = THREE.MathUtils.clamp(
        gameState.cameraPitch + e.movementY * sens,
        minPitch,
        maxPitch
      );
    }
  });

  dom.canvas.addEventListener('click', () => {
    const playing =
      gameState.mission === MISSION_STATE.FREE_ROAM ||
      gameState.mission === MISSION_STATE.INFILTRATE ||
      gameState.mission === MISSION_STATE.STEAL_DATA ||
      gameState.mission === MISSION_STATE.STEAL_CAR ||
      gameState.mission === MISSION_STATE.RESCUE_PRISONER ||
      gameState.mission === MISSION_STATE.ESCAPE;
    if (
      playing &&
      !gameState.terminalOpen &&
      !gameState.missionModalOpen &&
      !gameState.shopOpen &&
      !gameState.tacticalMapOpen &&
      !gameState.quickGuideOpen &&
      document.pointerLockElement !== dom.canvas
    ) {
      AudioManager.init();
      dom.canvas.requestPointerLock();
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    gameState.mouseDown = true;
    if (document.pointerLockElement !== dom.canvas) return;
    if (
      gameState.terminalOpen ||
      gameState.missionModalOpen ||
      gameState.shopOpen ||
      gameState.tacticalMapOpen ||
      gameState.quickGuideOpen ||
      gameState.activeCamIndex >= 0 ||
      gameState.drivingCar ||
      gameState.drivingBoat
    ) {
      return;
    }
    const playing =
      gameState.mission === MISSION_STATE.FREE_ROAM ||
      gameState.mission === MISSION_STATE.INFILTRATE ||
      gameState.mission === MISSION_STATE.STEAL_DATA ||
      gameState.mission === MISSION_STATE.STEAL_CAR ||
      gameState.mission === MISSION_STATE.RESCUE_PRISONER ||
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
  if (dom.btnCloseShop) dom.btnCloseShop.addEventListener('click', closeShopModal);
  if (dom.btnMute) {
    dom.btnMute.addEventListener('click', () => AudioManager.toggleMute());
  }
  if (dom.btnNetworkMode) {
    dom.btnNetworkMode.addEventListener('click', () => networkManager.toggleMode());
  }
  if (dom.btnRain) {
    dom.btnRain.addEventListener('click', () => toggleRain());
  }
  if (dom.btnCloseMap) {
    dom.btnCloseMap.addEventListener('click', () => toggleTacticalMap(false));
  }
  if (dom.btnQuickGuide) {
    dom.btnQuickGuide.addEventListener('click', () => toggleQuickGuide());
  }
  if (dom.btnCloseGuide) {
    dom.btnCloseGuide.addEventListener('click', () => toggleQuickGuide(false));
  }
  if (dom.btnToggleShadows) {
    dom.btnToggleShadows.addEventListener('click', () => toggleShadows());
  }
  if (dom.sensButtons) {
    dom.sensButtons.forEach((btn) => {
      btn.addEventListener('click', () => setMouseSensitivity(btn.dataset.sens));
    });
  }
  if (dom.btnClearGps) {
    dom.btnClearGps.addEventListener('click', () => {
      gameState.gpsWaypoint = null;
      renderTacticalMap();
    });
  }
  if (dom.tacticalMapCanvas) {
    dom.tacticalMapCanvas.addEventListener('click', handleTacticalMapClick);
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

let _hudTickAccum = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(refs.clock.getDelta(), 0.05);
  const nowSec = refs.clock.elapsedTime;

  updateVisualEffects(dt, nowSec);

  const isContract =
    gameState.mission === MISSION_STATE.INFILTRATE ||
    gameState.mission === MISSION_STATE.STEAL_DATA ||
    gameState.mission === MISSION_STATE.STEAL_CAR ||
    gameState.mission === MISSION_STATE.RESCUE_PRISONER ||
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
    updatePedestrians(dt);
    updateGuards(dt);
    updateInteractionsAndMission(dt);
    networkManager.tick(dt);

    // Atualiza minimapa Radar e etiquetas NetHack a 20 Hz (a cada 0.05s) para liberar CPU
    _hudTickAccum += dt;
    if (_hudTickAccum >= 0.05) {
      _hudTickAccum = 0;
      updateRadar();
      if (gameState.netHackActive) {
        updateNetHackLabels();
      }
    }
  }

  updateCamera();
  refs.renderer.render(refs.scene, refs.camera);
}

function showFatalError(err) {
  console.error('[Projeto Hacker] Erro de inicialização:', err);
  const existing = document.getElementById('fatal-error-banner');
  const banner = existing || document.createElement('div');
  banner.id = 'fatal-error-banner';
  banner.style.cssText =
    'position:fixed;inset:24px;z-index:9999;background:rgba(10,14,24,0.96);border:2px solid #ff0055;color:#ff88aa;padding:24px;font-family:monospace;font-size:14px;overflow:auto;white-space:pre-wrap;';
  banner.textContent = `ERRO CRÍTICO DE RENDERIZAÇÃO:\n${err?.stack || err?.message || String(err)}`;
  if (!existing && document.body) {
    document.body.appendChild(banner);
  }
}

// ==========================================
// BOOTSTRAP
// ==========================================
try {
  loadProgress();
  initThree();
  setupInputs();
  setMissionState(MISSION_STATE.FREE_ROAM);
  updateMoneyHUD();
  updateHpHUD();
  if (dom.btnRain) dom.btnRain.textContent = gameState.rainEnabled ? 'CHUVA: ON' : 'CHUVA: OFF';
  animate();
} catch (err) {
  showFatalError(err);
}
