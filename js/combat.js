import * as THREE from 'three';
import {
  MISSION_STATE,
  GUARD_STATE,
  WEAPON_TYPE,
  WEAPON_CONFIG,
  WORLD_BOUNDS,
  getSurfaceHeight,
  dom,
  refs,
  gameState,
  raycaster,
  occluders,
  securityCameras,
  guards,
  cars,
  policeCars,
  pedestrians,
  projectiles,
  guardProjectiles,
  empWaves,
  impactFlashes
} from './state.js';
import { AudioManager } from './audio.js';
import { updateWeaponHUD, updateHpHUD, updateVehicleHpHUD, updateWantedHUD, triggerHitmarker, triggerGameOver } from './ui.js';

// Geometrias e materiais compartilhados para evitar memory leaks em WebGL
const sharedPlayerBoltGeo = new THREE.BoxGeometry(0.1, 0.1, 0.55);
const sharedGuardBulletGeo = new THREE.BoxGeometry(0.1, 0.1, 0.45);
const sharedGuardBulletMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
const sharedFlashGeo = new THREE.SphereGeometry(0.32, 8, 8);
const sharedBoltMats = new Map();

function getSharedBoltMat(colorHex) {
  if (!sharedBoltMats.has(colorHex)) {
    sharedBoltMats.set(colorHex, new THREE.MeshBasicMaterial({ color: colorHex }));
  }
  return sharedBoltMats.get(colorHex);
}

function disposePlayerProjectile(p) {
  refs.scene.remove(p.mesh);
  refs.scene.remove(p.line);
  if (p.line?.geometry) p.line.geometry.dispose();
  if (p.line?.material) p.line.material.dispose();
}

export function selectWeapon(weaponType) {
  if (weaponType === WEAPON_TYPE.SHOTGUN && !gameState.hasShotgun) return;
  gameState.equippedWeapon = weaponType;
  if (refs.playerParts.taserMesh) refs.playerParts.taserMesh.visible = weaponType === WEAPON_TYPE.TASER;
  if (refs.playerParts.pistolMesh) refs.playerParts.pistolMesh.visible = weaponType === WEAPON_TYPE.PISTOL;
  if (refs.playerParts.rifleMesh) refs.playerParts.rifleMesh.visible = weaponType === WEAPON_TYPE.RIFLE;
  if (refs.playerParts.empMesh) refs.playerParts.empMesh.visible = weaponType === WEAPON_TYPE.EMP;
  if (refs.playerParts.shotgunMesh) refs.playerParts.shotgunMesh.visible = weaponType === WEAPON_TYPE.SHOTGUN;
  updateWeaponHUD();
  if (refs.playerParts) refs.playerParts.aimTimer = 0.45;
  gameState.recoilTimer = 0.12;
}

export function damagePlayer(amount) {
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

export function panicPedestrians(originPos, radius = 26) {
  pedestrians.forEach((ped) => {
    if (ped.stunnedTimer > 0) return;
    const dist = ped.mesh.position.distanceTo(originPos);
    if (dist <= radius) {
      if (!ped.callingPolice) {
        ped.panickedTimer = 6.5;
      }
      const dx = ped.mesh.position.x - originPos.x;
      const dz = ped.mesh.position.z - originPos.z;
      const len = Math.hypot(dx, dz) || 1;
      ped.panicDirX = dx / len;
      ped.panicDirZ = dz / len;
    }
  });
}

export function reportCrimeToCivilians(originPos, radius = 22, severity = 1) {
  panicPedestrians(originPos, radius + 6);
  const alreadyCalling = pedestrians.some((p) => p.callingPolice && p.stunnedTimer <= 0);
  if (alreadyCalling) return;

  let witness = null;
  let bestDist = radius;
  for (const ped of pedestrians) {
    if (ped.stunnedTimer > 0) continue;
    const d = ped.mesh.position.distanceTo(originPos);
    if (d < bestDist) {
      bestDist = d;
      witness = ped;
    }
  }

  if (witness) {
    witness.callingPolice = true;
    witness.callTimer = 4.5;
    witness.crimeSeverity = severity;
    witness.panickedTimer = 0;
    if (witness.phoneIcon) witness.phoneIcon.visible = true;
    if (gameState.wantedLevel === 0) {
      gameState.wantedStatus = 'DENÚNCIA EM ANDAMENTO';
      updateWantedHUD();
    }
  }
}

export function alertGuardsByNoise(originPos, radius) {
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

export function triggerBaseAlert() {
  if (gameState.baseAlert) return;
  gameState.baseAlert = true;
  if (dom.baseAlertBanner) dom.baseAlertBanner.classList.remove('hidden');
  AudioManager.playBaseAlertSiren();
  AudioManager.setMusicTempo(138);

  const targetPos = refs.playerGroup.position.clone();
  guards.forEach((g) => {
    if (g.state !== GUARD_STATE.DEAD && g.state !== GUARD_STATE.STUNNED) {
      g.state = GUARD_STATE.COMBAT;
      g.lastKnownPos = targetPos.clone();
    }
  });
}

export function spawnTaserFlash(pos, color = 0x00f0ff) {
  // Usa malha emissiva leve em vez de criar PointLights dinâmicas
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
  const mesh = new THREE.Mesh(sharedFlashGeo, mat);
  mesh.position.copy(pos);
  refs.scene.add(mesh);
  impactFlashes.push({ mesh, mat, life: 0.15 });
}

export function stunGuard(guard, duration) {
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

export function damageGuard(guard, dmg) {
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
    guard.lastKnownPos = refs.playerGroup.position.clone();
  }
}

export function fireEquippedWeapon() {
  if (gameState.isSwimming) return;
  if (gameState.equippedWeapon === WEAPON_TYPE.EMP) {
    fireEmpPulse();
    return;
  }
  if (gameState.weaponCooldown > 0) return;

  const cfg = WEAPON_CONFIG[gameState.equippedWeapon];
  gameState.weaponCooldown = gameState.hasRapidReload ? cfg.cooldown * 0.55 : cfg.cooldown;
  updateWeaponHUD();
  if (refs.playerParts) refs.playerParts.aimTimer = 0.45;
  gameState.recoilTimer = 0.12;

  if (gameState.equippedWeapon === WEAPON_TYPE.TASER) AudioManager.playTaserShot();
  else if (gameState.equippedWeapon === WEAPON_TYPE.PISTOL) AudioManager.playSilencedShot();
  else if (gameState.equippedWeapon === WEAPON_TYPE.RIFLE || gameState.equippedWeapon === WEAPON_TYPE.SHOTGUN) {
    AudioManager.playRifleShot();
  }

  const baseDir = new THREE.Vector3();
  refs.camera.getWorldDirection(baseDir);
  baseDir.y = THREE.MathUtils.clamp(baseDir.y, -0.35, 0.35);
  baseDir.normalize();

  const startPos = refs.playerGroup.position.clone().add(new THREE.Vector3(0, gameState.isCrouching ? 0.92 : 1.35, 0));
  startPos.addScaledVector(baseDir, 0.75);

  const angles =
    gameState.equippedWeapon === WEAPON_TYPE.SHOTGUN
      ? [-0.14, -0.07, 0, 0.07, 0.14]
      : [0];
  const life = gameState.equippedWeapon === WEAPON_TYPE.SHOTGUN ? 0.45 : 1.1;

  angles.forEach((ang) => {
    const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
    const boltMesh = new THREE.Mesh(sharedPlayerBoltGeo, getSharedBoltMat(cfg.color));
    boltMesh.position.copy(startPos);
    boltMesh.lookAt(startPos.clone().add(dir));
    refs.scene.add(boltMesh);

    const trailGeo = new THREE.BufferGeometry().setFromPoints([startPos.clone(), startPos.clone()]);
    const trailLine = new THREE.Line(
      trailGeo,
      new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.85 })
    );
    refs.scene.add(trailLine);

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
      life
    });
  });

  alertGuardsByNoise(refs.playerGroup.position, cfg.noiseRadius);
  if (cfg.noiseRadius > 0) {
    reportCrimeToCivilians(refs.playerGroup.position, 22, 1);
  }
}

export function fireEmpPulse() {
  if (gameState.isSwimming) return;
  if (gameState.empCooldown > 0) return;
  gameState.empCooldown = WEAPON_CONFIG.EMP.cooldown;
  AudioManager.playEmpPulse();
  updateWeaponHUD();
  if (refs.playerParts) refs.playerParts.aimTimer = 0.45;
  gameState.recoilTimer = 0.12;

  const pPos = refs.playerGroup.position.clone();
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
  refs.scene.add(ringMesh);

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

export function updateProjectiles(dt) {
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
      const guardCenterY = g.mesh.position.y + 1.1;
      if (distFlat < 0.95 && Math.abs(p.pos.y - guardCenterY) <= 1.15) {
        hitGuard = g;
        break;
      }
    }

    if (hitGuard) {
      spawnTaserFlash(p.pos, p.color);
      triggerHitmarker(!p.isTaser);
      if (p.isTaser) {
        stunGuard(hitGuard, 10.0);
        AudioManager.playElectricZap();
      } else {
        damageGuard(hitGuard, p.damage);
      }
      disposePlayerProjectile(p);
      projectiles.splice(i, 1);
      continue;
    }

    // Acerto em pedestres (Taser atordoa testemunha e cancela ligação; tiro letal dispara denúncia +2)
    let hitPed = null;
    for (const ped of pedestrians) {
      if (ped.stunnedTimer > 0) continue;
      const dPed = Math.hypot(p.pos.x - ped.mesh.position.x, p.pos.z - ped.mesh.position.z);
      const pedCenterY = ped.mesh.position.y + 1.0;
      if (dPed < 0.85 && Math.abs(p.pos.y - pedCenterY) <= 1.0) {
        hitPed = ped;
        break;
      }
    }
    if (hitPed) {
      spawnTaserFlash(p.pos, p.color);
      triggerHitmarker(!p.isTaser);
      hitPed.stunnedTimer = 12.0;
      hitPed.callingPolice = false;
      if (hitPed.phoneIcon) hitPed.phoneIcon.visible = false;
      hitPed.mesh.rotation.x = -Math.PI / 2;
      hitPed.mesh.position.y = getSurfaceHeight(hitPed.mesh.position.x, hitPed.mesh.position.z) + 0.2;
      if (gameState.wantedLevel === 0) {
        gameState.wantedStatus = 'OCULTO';
        updateWantedHUD();
      }
      if (!p.isTaser) {
        reportCrimeToCivilians(hitPed.mesh.position, 22, 2);
      }
      disposePlayerProjectile(p);
      projectiles.splice(i, 1);
      continue;
    }

    // Acerto em veículos (viaturas policiais e carros civis/tráfego) via Box3
    let hitCar = null;
    for (const car of cars) {
      if (!car || car.destroyed || !car.colliderObj) continue;
      if (car.colliderObj.box.clone().expandByScalar(0.2).containsPoint(p.pos)) {
        hitCar = car;
        break;
      }
    }
    if (hitCar) {
      spawnTaserFlash(p.pos, p.color);
      if (!p.isTaser) {
        damageCar(hitCar, p.damage || 10);
        triggerHitmarker(false);
        if (policeCars.includes(hitCar) || hitCar.isPolice) {
          reportCrimeToCivilians(hitCar.mesh.position, 22, 2);
        }
      }
      disposePlayerProjectile(p);
      projectiles.splice(i, 1);
      continue;
    }

    if (hitObs.length > 0 || p.life <= 0) {
      if (hitObs.length > 0) spawnTaserFlash(hitObs[0].point, p.color);
      disposePlayerProjectile(p);
      projectiles.splice(i, 1);
    }
  }
}

export function updateGuardProjectiles(dt) {
  const pPos = refs.playerGroup.position;
  for (let i = guardProjectiles.length - 1; i >= 0; i--) {
    const gp = guardProjectiles[i];
    gp.life -= dt;
    const step = gp.speed * dt;

    raycaster.set(gp.pos, gp.dir);
    raycaster.far = step + 0.2;
    const hitObs = raycaster.intersectObjects(occluders, false);

    gp.pos.addScaledVector(gp.dir, step);
    gp.mesh.position.copy(gp.pos);

    let hitOtherCar = null;
    for (const car of cars) {
      if (!car || car.destroyed || !car.colliderObj || car === gameState.drivingCar) continue;
      if (car.colliderObj.box.clone().expandByScalar(0.2).containsPoint(gp.pos)) {
        hitOtherCar = car;
        break;
      }
    }
    if (hitOtherCar) {
      // Viaturas absorvem o tiro (fogo amigo não causa dano); carros civis sofrem dano
      if (!policeCars.includes(hitOtherCar) && !hitOtherCar.isPolice) damageCar(hitOtherCar, 12);
      refs.scene.remove(gp.mesh);
      guardProjectiles.splice(i, 1);
      continue;
    }

    if (gameState.drivingCar && !gameState.drivingCar.destroyed) {
      const carBox = gameState.drivingCar.colliderObj.box.clone().expandByScalar(0.35);
      if (carBox.containsPoint(gp.pos)) {
        damageCar(gameState.drivingCar, 12);
        refs.scene.remove(gp.mesh);
        guardProjectiles.splice(i, 1);
        continue;
      }
    } else {
      const distPlayer = Math.hypot(gp.pos.x - pPos.x, gp.pos.z - pPos.z);
      const playerHalfH = gameState.isCrouching ? 0.6 : 0.975;
      const playerCenterY = pPos.y + playerHalfH + 0.1;
      if (distPlayer < 0.72 && Math.abs(gp.pos.y - playerCenterY) <= playerHalfH) {
        damagePlayer(12);
        refs.scene.remove(gp.mesh);
        guardProjectiles.splice(i, 1);
        continue;
      }
    }

    if (hitObs.length > 0 || gp.life <= 0) {
      refs.scene.remove(gp.mesh);
      guardProjectiles.splice(i, 1);
    }
  }
}

export function damageCar(car, amount) {
  if (!car || car.destroyed) return;
  car.hp = Math.max(0, car.hp - amount);
  if (car === gameState.drivingCar) {
    updateVehicleHpHUD();
  }
  if (car.hp <= 0) {
    explodeCar(car);
  }
}

export function explodeCar(car) {
  if (!car || car.destroyed) return;
  car.destroyed = true;
  car.hp = 0;
  car.speed = 0;
  if (car.headlight) car.headlight.intensity = 0;

  if (gameState.drivingCar === car) {
    gameState.drivingCar = null;
    AudioManager.stopEngineSound();
    car.mesh.updateMatrixWorld(true);
    car.colliderObj.box.setFromObject(car.mesh);
    const sideX = Math.cos(car.mesh.rotation.y) * 2.8;
    const sideZ = -Math.sin(car.mesh.rotation.y) * 2.8;
    const outX = THREE.MathUtils.clamp(car.mesh.position.x + sideX, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    const outZ = THREE.MathUtils.clamp(car.mesh.position.z + sideZ, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
    refs.playerGroup.position.set(outX, getSurfaceHeight(outX, outZ), outZ);
    refs.playerGroup.visible = true;
    updateVehicleHpHUD();
    damagePlayer(25);
  }

  AudioManager.playExplosion();
  panicPedestrians(car.mesh.position, 32);
  spawnImpactFlash(car.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0)), 0xff5500);

  const ringGeo = new THREE.RingGeometry(0.6, 1.4, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff5500,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.set(car.mesh.position.x, car.mesh.position.y + 0.35, car.mesh.position.z);
  refs.worldGroup.add(ringMesh);
  empWaves.push({ mesh: ringMesh, mat: ringMat, radius: 1.0, maxRadius: 12.0 });

  car.mesh.traverse((child) => {
    if (child.isMesh && child.userData?.normalMaterial) {
      child.userData.normalMaterial.color.setHex(0x1a1a1a);
      if (child.userData.normalMaterial.emissive) {
        child.userData.normalMaterial.emissive.setHex(0x220800);
        child.userData.normalMaterial.emissiveIntensity = 0.25;
      }
      if (!gameState.netHackActive) {
        child.material = child.userData.normalMaterial;
      }
    }
  });

  guards.forEach((g) => {
    if (g.state === GUARD_STATE.DEAD) return;
    if (g.mesh.position.distanceTo(car.mesh.position) <= 10.5) {
      damageGuard(g, 110);
    }
  });

  if (car === gameState.targetCar && gameState.mission === MISSION_STATE.STEAL_CAR) {
    triggerGameOver(
      'VEÍCULO VIP DESTRUÍDO',
      'O veículo do contrato explodiu antes da entrega na Garagem DedSec.'
    );
  }
}

export function updateEmpWaves(dt) {
  for (let i = empWaves.length - 1; i >= 0; i--) {
    const w = empWaves[i];
    w.radius += dt * 18;
    w.mesh.scale.set(w.radius, w.radius, 1);
    w.mat.opacity = Math.max(0, 0.85 * (1 - w.radius / w.maxRadius));
    if (w.radius >= w.maxRadius) {
      refs.scene.remove(w.mesh);
      if (w.mesh.geometry) w.mesh.geometry.dispose();
      if (w.mat) w.mat.dispose();
      empWaves.splice(i, 1);
    }
  }
}

export function fireGuardBullet(guard, targetPos) {
  const startPos = guard.mesh.position.clone().add(new THREE.Vector3(0, 1.25, 0));
  const dir = targetPos.clone().sub(startPos).normalize();
  // Pequena dispersão para permitir cobertura justa
  dir.x += (Math.random() - 0.5) * 0.09;
  dir.y += (Math.random() - 0.5) * 0.04;
  dir.z += (Math.random() - 0.5) * 0.09;
  dir.normalize();

  const bullet = new THREE.Mesh(sharedGuardBulletGeo, sharedGuardBulletMat);
  bullet.position.copy(startPos);
  bullet.lookAt(startPos.clone().add(dir));
  refs.scene.add(bullet);

  guardProjectiles.push({
    mesh: bullet,
    pos: startPos,
    dir,
    speed: 32,
    life: 1.4
  });

  AudioManager.playGuardShot();
}