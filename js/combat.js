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
  projectiles,
  guardProjectiles,
  empWaves,
  impactFlashes
} from './state.js';
import { AudioManager } from './audio.js';
import { updateWeaponHUD, updateHpHUD, updateVehicleHpHUD, triggerGameOver } from './ui.js';

export function selectWeapon(weaponType) {
  gameState.equippedWeapon = weaponType;
  if (refs.playerParts.taserMesh) refs.playerParts.taserMesh.visible = weaponType === WEAPON_TYPE.TASER;
  if (refs.playerParts.pistolMesh) refs.playerParts.pistolMesh.visible = weaponType === WEAPON_TYPE.PISTOL;
  if (refs.playerParts.rifleMesh) refs.playerParts.rifleMesh.visible = weaponType === WEAPON_TYPE.RIFLE;
  if (refs.playerParts.empMesh) refs.playerParts.empMesh.visible = weaponType === WEAPON_TYPE.EMP;
  updateWeaponHUD();
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
  const light = new THREE.PointLight(color, 5.0, 9);
  light.position.copy(pos);
  refs.scene.add(light);
  impactFlashes.push({ light, life: 0.15 });
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
  refs.camera.getWorldDirection(dir);
  dir.y = THREE.MathUtils.clamp(dir.y, -0.35, 0.35);
  dir.normalize();

  const startPos = refs.playerGroup.position.clone().add(new THREE.Vector3(0, gameState.isCrouching ? 0.92 : 1.35, 0));
  startPos.addScaledVector(dir, 0.75);

  const boltMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.55),
    new THREE.MeshBasicMaterial({ color: cfg.color })
  );
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
    life: 1.1
  });

  alertGuardsByNoise(refs.playerGroup.position, cfg.noiseRadius);
}

export function fireEmpPulse() {
  if (gameState.empCooldown > 0) return;
  gameState.empCooldown = WEAPON_CONFIG.EMP.cooldown;
  AudioManager.playEmpPulse();
  updateWeaponHUD();

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
      refs.scene.remove(p.mesh);
      refs.scene.remove(p.line);
      projectiles.splice(i, 1);
      continue;
    }

    if (hitObs.length > 0 || p.life <= 0) {
      if (hitObs.length > 0) spawnTaserFlash(hitObs[0].point, p.color);
      refs.scene.remove(p.mesh);
      refs.scene.remove(p.line);
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
      const maxPlayerY = gameState.isCrouching ? 1.25 : 2.05;
      if (distPlayer < 0.72 && gp.pos.y >= 0.1 && gp.pos.y <= maxPlayerY) {
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

  const bullet = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.45),
    new THREE.MeshBasicMaterial({ color: 0xff3300 })
  );
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
