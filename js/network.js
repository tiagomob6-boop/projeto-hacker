import { dom, refs, gameState } from './state.js';

// ==========================================
// MÓDULO DE REDE COOPERATIVO P2P (PEERJS VIA CDN)
// ==========================================
export class NetworkManager {
  constructor() {
    this.mode = 'OFFLINE_SOLO'; // 'OFFLINE_SOLO' | 'COOP_WAITING' | 'COOP_CONNECTED'
    this.localId = 'local';
    this.roomCode = null;
    this.peer = null;
    this.peerAdapter = null; // PeerJS DataConnection ativa
    this.remotePeerId = null;
    this.syncAccumulator = 0;
    this.syncInterval = 1 / 20; // 20 Hz de sincronização em tempo real
    this.listeners = {
      onPlayerMove: [],
      onPlayerShoot: [],
      onHackTriggered: [],
      onMissionSync: [],
      onPeerDisconnected: [],
      onStatusChange: []
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

  async _loadPeerJS() {
    const mod = await import('https://esm.sh/peerjs@1.5.4');
    return mod.Peer || mod.default;
  }

  async createRoom() {
    this.disconnect();
    const code = `DEDSEC-${Math.floor(1000 + Math.random() * 9000)}`;
    this.roomCode = code;
    this.localId = code;
    gameState.localPlayerId = code;
    this.mode = 'COOP_WAITING';
    gameState.networkMode = this.mode;
    this._updateModeButton();
    this.emit('onStatusChange', { text: `INICIALIZANDO SALA ${code}...`, online: false });

    try {
      const PeerCtor = await this._loadPeerJS();
      const peer = new PeerCtor(code);
      this.peer = peer;

      peer.on('open', (id) => {
        this.localId = id;
        gameState.localPlayerId = id;
        this._updateModeButton();
        this.emit('onStatusChange', { text: `SALA ${code} ABERTA // AGUARDANDO PARCEIRO...`, online: false, roomCode: code });
      });

      peer.on('connection', (conn) => {
        this._attachConnection(conn);
      });

      peer.on('error', (err) => {
        this.emit('onStatusChange', { text: `ERRO PEERJS: ${err?.type || err?.message || 'falha'}`, online: false, error: true });
      });

      return code;
    } catch (err) {
      this.disconnect();
      this.emit('onStatusChange', { text: 'ERRO AO CARREGAR PEERJS VIA CDN', online: false, error: true });
      return null;
    }
  }

  async joinRoom(rawCode) {
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code) {
      this.emit('onStatusChange', { text: 'INFORME UM CÓDIGO DE SALA VÁLIDO', online: false, error: true });
      return false;
    }
    this.disconnect();
    this.roomCode = code;
    this.mode = 'COOP_WAITING';
    gameState.networkMode = this.mode;
    this._updateModeButton();
    this.emit('onStatusChange', { text: `CONECTANDO À SALA ${code}...`, online: false });

    try {
      const PeerCtor = await this._loadPeerJS();
      const peer = new PeerCtor();
      this.peer = peer;

      peer.on('open', (id) => {
        this.localId = id;
        gameState.localPlayerId = id;
        const conn = peer.connect(code, { reliable: false });
        this._attachConnection(conn);
      });

      peer.on('error', (err) => {
        this.emit('onStatusChange', { text: `FALHA AO CONECTAR: ${err?.type || err?.message || 'sala não encontrada'}`, online: false, error: true });
      });

      return true;
    } catch {
      this.disconnect();
      this.emit('onStatusChange', { text: 'ERRO AO CARREGAR PEERJS VIA CDN', online: false, error: true });
      return false;
    }
  }

  _attachConnection(conn) {
    if (!conn) return;
    this.peerAdapter = conn;
    this.remotePeerId = conn.peer;

    conn.on('open', () => {
      this.mode = 'COOP_CONNECTED';
      gameState.networkMode = this.mode;
      this._updateModeButton();
      this.emit('onStatusChange', { text: `● CO-OP CONECTADO // SALA ${this.roomCode}`, online: true, roomCode: this.roomCode });
      this.broadcast('onPlayerMove', this.getLocalSyncPacket());
    });

    conn.on('data', (data) => {
      if (data && data.payload && !this.remotePeerId && data.payload.id) {
        this.remotePeerId = data.payload.id;
      }
      this.handleIncomingPacket(data);
    });

    conn.on('close', () => {
      if (this.remotePeerId) {
        this.emit('onPeerDisconnected', this.remotePeerId);
        this.remotePeerId = null;
      }
      this.peerAdapter = null;
      this.mode = this.peer ? 'COOP_WAITING' : 'OFFLINE_SOLO';
      gameState.networkMode = this.mode;
      this._updateModeButton();
      this.emit('onStatusChange', { text: 'PARCEIRO DESCONECTADO // AGUARDANDO...', online: false });
    });

    conn.on('error', () => {
      this.emit('onStatusChange', { text: 'CONEXÃO P2P INTERROMPIDA', online: false, error: true });
    });
  }

  getLocalSyncPacket() {
    const pos = refs.playerGroup?.position;
    const rotY = refs.playerGroup?.rotation?.y || 0;
    const animState = gameState.droneActive
      ? 'DRONE'
      : gameState.drivingCar
      ? 'DRIVING'
      : gameState.isSwimming
      ? 'SWIM'
      : gameState.isCrouching
      ? 'CROUCH'
      : gameState.isSprinting
      ? 'SPRINT'
      : 'WALK';

    return {
      id: this.localId,
      name: gameState.currentUser?.agentName || 'AGENTE DEDSEC',
      x: pos ? Number(pos.x.toFixed(2)) : 0,
      y: pos ? Number(pos.y.toFixed(2)) : 0,
      z: pos ? Number(pos.z.toFixed(2)) : 0,
      rotY: Number(rotY.toFixed(3)),
      animState,
      weapon: gameState.equippedWeapon,
      skin: gameState.equippedSkin || 'classic',
      inCar: gameState.drivingCar ? gameState.drivingCar.id : null
    };
  }

  disconnect() {
    if (this.remotePeerId) {
      this.emit('onPeerDisconnected', this.remotePeerId);
      this.remotePeerId = null;
    }
    try {
      if (this.peerAdapter) this.peerAdapter.close();
    } catch {}
    try {
      if (this.peer) this.peer.destroy();
    } catch {}
    this.peerAdapter = null;
    this.peer = null;
    this.roomCode = null;
    this.mode = 'OFFLINE_SOLO';
    gameState.networkMode = this.mode;
    this._updateModeButton();
    this.emit('onStatusChange', { text: 'MODO SOLO // PRONTO PARA CONECTAR', online: false });
  }

  broadcast(eventName, payload) {
    if (this.mode !== 'COOP_CONNECTED' || !this.peerAdapter || !this.peerAdapter.open) return;
    try {
      this.peerAdapter.send({ type: eventName, payload });
    } catch {}
  }

  broadcastShoot(origin, dir, color = 0x00f0ff) {
    this.broadcast('onPlayerShoot', {
      id: this.localId,
      ox: Number(origin.x.toFixed(2)),
      oy: Number(origin.y.toFixed(2)),
      oz: Number(origin.z.toFixed(2)),
      dx: Number(dir.x.toFixed(3)),
      dy: Number(dir.y.toFixed(3)),
      dz: Number(dir.z.toFixed(3)),
      color
    });
  }

  broadcastHack(hackType, data = {}) {
    this.broadcast('onHackTriggered', {
      id: this.localId,
      hackType,
      data
    });
  }

  handleIncomingPacket(packet) {
    if (!packet || !packet.type) return;
    this.emit(packet.type, packet.payload);
  }

  _updateModeButton() {
    if (!dom.btnNetworkMode) return;
    if (this.mode === 'COOP_CONNECTED') {
      dom.btnNetworkMode.textContent = `[CO-OP ONLINE // ${this.roomCode}]`;
    } else if (this.mode === 'COOP_WAITING') {
      dom.btnNetworkMode.textContent = `[CO-OP SALA // ${this.roomCode}]`;
    } else {
      dom.btnNetworkMode.textContent = '[MODO: SOLO // CO-OP READY]';
    }
  }

  tick(dt) {
    if (this.mode !== 'COOP_CONNECTED' || !this.peerAdapter || !this.peerAdapter.open) return;
    this.syncAccumulator += dt;
    if (this.syncAccumulator >= this.syncInterval) {
      this.syncAccumulator = 0;
      this.broadcast('onPlayerMove', this.getLocalSyncPacket());
    }
  }
}

export const networkManager = new NetworkManager();
