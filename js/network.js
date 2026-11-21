import { dom, refs, gameState } from './state.js';

// ==========================================
// MÓDULO DE REDE ABSTRATO (PRONTO PARA PEERJS / WEBRTC P2P)
// ==========================================
export class NetworkManager {
  constructor() {
    this.mode = 'OFFLINE_SOLO'; // 'OFFLINE_SOLO' | 'COOP_P2P_READY'
    this.localId = 'local';
    this.peerAdapter = null; // Ponto de encaixe futuro para PeerJS (WebRTC DataConnection)
    this.syncAccumulator = 0;
    this.syncInterval = 1 / 20; // 20 Hz de sincronização de pacotes leves
    this.listeners = {
      onPlayerMove: [],
      onPlayerShoot: [],
      onHackTriggered: [],
      onMissionSync: []
    };
  }

  on(eventName, callback) {
    if (!this.listeners[eventName] || typeof callback !== 'function') return;
    this.listeners[eventName].push(callback);
  }

  emit(eventName, payload) {
    const cbs = this.listeners[eventName];
    if (!cbs) return;
    cbs.forEach((cb) => cb(payload));
  }

  getLocalSyncPacket() {
    const pos = refs.playerGroup?.position;
    const rotY = refs.playerGroup?.rotation?.y || 0;
    const animState = gameState.drivingCar
      ? 'DRIVING'
      : gameState.drivingBoat
      ? 'BOATING'
      : gameState.isCrouching
      ? 'CROUCH'
      : gameState.isSprinting
      ? 'SPRINT'
      : 'IDLE_WALK';

    return {
      id: this.localId,
      x: pos ? Number(pos.x.toFixed(2)) : 0,
      y: pos ? Number(pos.y.toFixed(2)) : 0,
      z: pos ? Number(pos.z.toFixed(2)) : 0,
      rotY: Number(rotY.toFixed(3)),
      animState,
      weapon: gameState.equippedWeapon,
      inCar: gameState.drivingCar ? gameState.drivingCar.id : null
    };
  }

  connectPeer(peerAdapter, localId = 'agent-host') {
    this.peerAdapter = peerAdapter;
    this.localId = localId;
    this.mode = 'COOP_P2P_READY';
    gameState.networkMode = this.mode;
    this._updateModeButton();
  }

  disconnect() {
    this.peerAdapter = null;
    this.mode = 'OFFLINE_SOLO';
    gameState.networkMode = this.mode;
    this._updateModeButton();
  }

  broadcast(eventName, payload) {
    if (this.mode === 'OFFLINE_SOLO' || !this.peerAdapter) return;
    if (typeof this.peerAdapter.send === 'function') {
      this.peerAdapter.send({ type: eventName, payload });
    }
  }

  handleIncomingPacket(packet) {
    if (!packet || !packet.type) return;
    this.emit(packet.type, packet.payload);
  }

  toggleMode() {
    this.mode = this.mode === 'OFFLINE_SOLO' ? 'COOP_P2P_READY' : 'OFFLINE_SOLO';
    gameState.networkMode = this.mode;
    this._updateModeButton();
  }

  _updateModeButton() {
    if (!dom.btnNetworkMode) return;
    dom.btnNetworkMode.textContent =
      this.mode === 'OFFLINE_SOLO' ? '[MODO: SOLO // CO-OP READY]' : '[MODO: CO-OP P2P // AGUARDANDO]';
  }

  tick(dt) {
    if (this.mode === 'OFFLINE_SOLO' || !this.peerAdapter) return;
    this.syncAccumulator += dt;
    if (this.syncAccumulator >= this.syncInterval) {
      this.syncAccumulator = 0;
      this.broadcast('onPlayerMove', this.getLocalSyncPacket());
    }
  }
}

export const networkManager = new NetworkManager();
