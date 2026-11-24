import { dom, refs, gameState } from './state.js';

// ==========================================
// MÓDULO DE REDE COOPERATIVO P2P (PEERJS VIA CDN)
// ==========================================

// Configuração WebRTC com servidores STUN públicos do Google para ultrapassar NATs/firewalls
const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  }
};

function normalizeRoomCode(raw) {
  let code = String(raw || '').trim().toUpperCase().replace(/\s+/g, '-');
  if (/^\d{4}$/.test(code)) {
    code = `DEDSEC-${code}`;
  }
  return code;
}

export class NetworkManager {
  constructor() {
    this.mode = 'OFFLINE_SOLO'; // 'OFFLINE_SOLO' | 'COOP_WAITING' | 'COOP_CONNECTED'
    this.localId = 'local';
    this.roomCode = null;
    this.isHost = false;
    this.peer = null;
    this.peerAdapter = null; // PeerJS DataConnection ativa
    this.remotePeerId = null;
    this.syncAccumulator = 0;
    this.syncInterval = 1 / 20; // 20 Hz de sincronização em tempo real
    this.heartbeatInterval = null;
    this.connectionTimeout = null;
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

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.peerAdapter && this.peerAdapter.open) {
        try {
          this.peerAdapter.send({ type: 'PING' });
        } catch {}
      }
    }, 3000);
  }

  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async createRoom(retryCount = 0) {
    this.disconnect();
    const code = `DEDSEC-${Math.floor(1000 + Math.random() * 9000)}`;
    this.roomCode = code;
    this.localId = code;
    this.isHost = true;
    gameState.localPlayerId = code;
    this.mode = 'COOP_WAITING';
    gameState.networkMode = this.mode;
    this._updateModeButton();
    this.emit('onStatusChange', { text: `INICIALIZANDO SALA ${code}...`, online: false });

    try {
      const PeerCtor = await this._loadPeerJS();
      const peer = new PeerCtor(code, PEER_CONFIG);
      this.peer = peer;

      peer.on('open', (id) => {
        this.localId = id;
        gameState.localPlayerId = id;
        this._updateModeButton();
        this.emit('onStatusChange', {
          text: `SALA ${code} ABERTA // AGUARDANDO PARCEIRO...`,
          online: false,
          roomCode: code
        });
      });

      peer.on('connection', (conn) => {
        this._attachConnection(conn);
      });

      peer.on('error', (err) => {
        if (err?.type === 'unavailable-id' && retryCount < 4) {
          this.createRoom(retryCount + 1);
          return;
        }
        this.emit('onStatusChange', {
          text: `ERRO PEERJS: ${err?.type || err?.message || 'falha'}`,
          online: false,
          error: true
        });
      });

      return code;
    } catch (err) {
      this.disconnect();
      this.emit('onStatusChange', { text: 'ERRO AO CARREGAR PEERJS VIA CDN', online: false, error: true });
      return null;
    }
  }

  async joinRoom(rawCode) {
    const code = normalizeRoomCode(rawCode);
    if (!code) {
      this.emit('onStatusChange', { text: 'INFORME UM CÓDIGO DE SALA VÁLIDO', online: false, error: true });
      return false;
    }
    this.disconnect();
    this.roomCode = code;
    this.isHost = false;
    this.mode = 'COOP_WAITING';
    gameState.networkMode = this.mode;
    this._updateModeButton();
    this.emit('onStatusChange', { text: `CONECTANDO À SALA ${code}...`, online: false });

    // Timeout de 14s caso o host não esteja online ou o código seja inválido
    this.connectionTimeout = setTimeout(() => {
      if (this.mode !== 'COOP_CONNECTED') {
        this.disconnect();
        this.emit('onStatusChange', {
          text: `TEMPO ESGOTADO // SALA ${code} NÃO RESPONDEU`,
          online: false,
          error: true
        });
      }
    }, 14000);

    try {
      const PeerCtor = await this._loadPeerJS();
      const peer = new PeerCtor(PEER_CONFIG);
      this.peer = peer;

      peer.on('open', (id) => {
        this.localId = id;
        gameState.localPlayerId = id;
        // Conexão garantida e ordenada para estabilidade do canal de jogo
        const conn = peer.connect(code, { reliable: true });
        this._attachConnection(conn);
      });

      peer.on('error', (err) => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        const msg =
          err?.type === 'peer-unavailable'
            ? `SALA ${code} NÃO ENCONTRADA // VERIFIQUE O CÓDIGO`
            : `FALHA AO CONECTAR: ${err?.type || err?.message || 'erro de rede'}`;
        this.emit('onStatusChange', { text: msg, online: false, error: true });
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
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      this.mode = 'COOP_CONNECTED';
      gameState.networkMode = this.mode;
      this._updateModeButton();
      this._startHeartbeat();

      this.emit('onStatusChange', {
        text: `● CO-OP CONECTADO // SALA ${this.roomCode}`,
        online: true,
        connected: true,
        roomCode: this.roomCode
      });

      // Dispara envio imediato do estado local para renderizar avatares na mesma hora
      this.broadcast('onPlayerMove', this.getLocalSyncPacket());
    });

    conn.on('data', (data) => {
      if (!data) return;
      // Trata keepalive silenciosamente
      if (data.type === 'PING') {
        try {
          conn.send({ type: 'PONG' });
        } catch {}
        return;
      }
      if (data.type === 'PONG') {
        return;
      }
      if (data.payload && !this.remotePeerId && data.payload.id) {
        this.remotePeerId = data.payload.id;
      }
      this.handleIncomingPacket(data);
    });

    conn.on('close', () => {
      this._stopHeartbeat();
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      if (this.remotePeerId) {
        this.emit('onPeerDisconnected', this.remotePeerId);
        this.remotePeerId = null;
      }
      this.peerAdapter = null;
      this.mode = this.isHost && this.peer ? 'COOP_WAITING' : 'OFFLINE_SOLO';
      gameState.networkMode = this.mode;
      this._updateModeButton();
      this.emit('onStatusChange', {
        text: this.isHost ? `PARCEIRO DESCONECTADO // SALA ${this.roomCode} AGUARDANDO...` : 'CONEXÃO ENCERRADA // MODO SOLO ATIVADO',
        online: false,
        disconnected: true
      });
    });

    conn.on('error', (err) => {
      this.emit('onStatusChange', {
        text: `CONEXÃO P2P INTERROMPIDA: ${err?.type || 'erro de rede'}`,
        online: false,
        error: true
      });
    });
  }

  getLocalSyncPacket() {
    const pos = refs.playerGroup?.position;
    const rotY = refs.playerGroup?.rotation?.y || 0;
    const animState = gameState.droneActive
      ? 'DRONE'
      : gameState.drivingBoat
      ? 'BOAT'
      : gameState.drivingCar
      ? 'DRIVING'
      : gameState.isSwimming
      ? 'SWIM'
      : !gameState.isGrounded
      ? 'JUMP'
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
    this._stopHeartbeat();
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
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
    this.isHost = false;
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
    const payload = {
      id: this.localId,
      ox: Number(origin.x.toFixed(2)),
      oy: Number(origin.y.toFixed(2)),
      oz: Number(origin.z.toFixed(2)),
      dx: Number(dir.x.toFixed(3)),
      dy: Number(dir.y.toFixed(3)),
      dz: Number(dir.z.toFixed(3)),
      color
    };
    this.broadcast('onPlayerShoot', payload);
    setTimeout(() => this.broadcast('onPlayerShoot', payload), 80);
  }

  broadcastHack(hackType, data = {}) {
    const payload = {
      id: this.localId,
      hackType,
      data
    };
    this.broadcast('onHackTriggered', payload);
    if (hackType === 'GATE' || hackType === 'BLACKOUT' || hackType === 'SHOOT') {
      setTimeout(() => this.broadcast('onHackTriggered', payload), 80);
    }
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
