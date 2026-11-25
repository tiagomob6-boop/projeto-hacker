import { dom, refs, gameState } from './state.js';

// ==========================================
// MÓDULO DE REDE COOPERATIVO P2P (PEERJS UMD)
// ==========================================

// Configuração WebRTC com servidores STUN oficiais para ultrapassar NATs e firewalls
const PEER_OPTIONS = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
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

function getPeerConstructor() {
  if (typeof window !== 'undefined' && window.Peer) {
    return window.Peer;
  }
  return null;
}

export class NetworkManager {
  constructor() {
    this.mode = 'OFFLINE_SOLO'; // 'OFFLINE_SOLO' | 'COOP_WAITING' | 'COOP_CONNECTED'
    this.localId = 'local';
    this.roomCode = null;
    this.remoteName = null;
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

  async _resolvePeerClass() {
    let PeerClass = getPeerConstructor();
    if (PeerClass) return PeerClass;
    // Se o script da CDN unpkg ainda não finalizou o download, aguarda até 2.5s
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 100));
      PeerClass = getPeerConstructor();
      if (PeerClass) return PeerClass;
    }
    // Fallback dinâmico caso CDN unpkg tenha falhado
    const mod = await import('https://esm.sh/peerjs@1.5.4').catch(() => null);
    return window.Peer || mod?.Peer || mod?.default || null;
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
    const PeerClass = await this._resolvePeerClass();
    if (!PeerClass) {
      this.emit('onStatusChange', { text: 'PEERJS NÃO DISPONÍVEL // VERIFIQUE SUA INTERNET', online: false, error: true });
      return null;
    }

    const code = `DEDSEC-${Math.floor(1000 + Math.random() * 9000)}`;
    this.roomCode = code;
    this.localId = code;
    this.remoteName = null;
    this.isHost = true;
    gameState.localPlayerId = code;
    this.mode = 'COOP_WAITING';
    gameState.networkMode = this.mode;
    this._updateModeButton();
    this.emit('onStatusChange', { text: `INICIALIZANDO SALA ${code}...`, online: false });

    try {
      const peer = new PeerClass(code, PEER_OPTIONS);
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
          text: `ERRO PEERJS: ${err?.type || err?.message || 'falha na rede'}`,
          online: false,
          error: true
        });
      });

      return code;
    } catch (err) {
      this.disconnect();
      this.emit('onStatusChange', { text: `ERRO AO INICIALIZAR SALA: ${err?.message || 'falha'}`, online: false, error: true });
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
    const PeerClass = await this._resolvePeerClass();
    if (!PeerClass) {
      this.emit('onStatusChange', { text: 'PEERJS NÃO DISPONÍVEL // VERIFIQUE SUA INTERNET', online: false, error: true });
      return false;
    }

    this.roomCode = code;
    this.remoteName = null;
    this.isHost = false;
    this.mode = 'COOP_WAITING';
    gameState.networkMode = this.mode;
    this._updateModeButton();
    this.emit('onStatusChange', { text: `CONECTANDO À SALA ${code}...`, online: false });

    // Timeout estrito de 10s caso a sala não exista ou esteja offline
    this.connectionTimeout = setTimeout(() => {
      if (this.mode !== 'COOP_CONNECTED') {
        this.disconnect();
        this.emit('onStatusChange', {
          text: `TEMPO ESGOTADO (10s) // SALA ${code} NÃO ENCONTRADA OU OFFLINE`,
          online: false,
          error: true
        });
      }
    }, 10000);

    try {
      const peer = new PeerClass(PEER_OPTIONS);
      this.peer = peer;

      peer.on('open', (id) => {
        this.localId = id;
        gameState.localPlayerId = id;
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
            : `FALHA AO CONECTAR: ${err?.type || err?.message || 'sala offline ou erro de rede'}`;
        this.emit('onStatusChange', { text: msg, online: false, error: true });
      });

      return true;
    } catch (err) {
      this.disconnect();
      this.emit('onStatusChange', { text: `ERRO AO CONECTAR: ${err?.message || 'falha'}`, online: false, error: true });
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
      this._startHeartbeat();

      // Handshake imediato: HELLO + getLocalSyncPacket()
      const syncPacket = this.getLocalSyncPacket();
      this.broadcast('HELLO', syncPacket);
      this.broadcast('onPlayerMove', syncPacket);

      this._updateModeButton();
      this.emit('onStatusChange', {
        text: `● CO-OP CONECTADO // SALA ${this.roomCode}`,
        online: true,
        connected: true,
        roomCode: this.roomCode,
        remoteName: this.remoteName || 'PARCEIRO'
      });
    });

    conn.on('data', (data) => {
      if (!data) return;
      if (data.type === 'PING') {
        try {
          conn.send({ type: 'PONG' });
        } catch {}
        return;
      }
      if (data.type === 'PONG') {
        return;
      }
      if (data.type === 'HELLO') {
        if (data.payload?.name) {
          this.remoteName = data.payload.name;
        }
        if (data.payload?.id) {
          this.remotePeerId = data.payload.id;
        }
        this._updateModeButton();
        this.emit('onPlayerMove', data.payload);
        // Responde de volta para garantir troca mútua imediata
        this.broadcast('onPlayerMove', this.getLocalSyncPacket());
        return;
      }
      if (data.payload && data.payload.id) {
        if (!this.remotePeerId) this.remotePeerId = data.payload.id;
        if (data.payload.name && !this.remoteName) {
          this.remoteName = data.payload.name;
          this._updateModeButton();
        }
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
      this.remoteName = null;
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
    this.remoteName = null;
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
    const btn = document.getElementById('hud-network-btn') || dom.btnNetworkMode;
    if (!btn) return;
    if (this.mode === 'COOP_CONNECTED') {
      const partner = this.remoteName || this.roomCode || 'ONLINE';
      btn.textContent = `[MODO: CO-OP ONLINE // ${partner}]`;
      btn.style.color = '#00ff88';
      btn.style.borderColor = '#00ff88';
      btn.style.textShadow = '0 0 8px rgba(0, 255, 136, 0.6)';
    } else if (this.mode === 'COOP_WAITING') {
      btn.textContent = `[CO-OP SALA // ${this.roomCode}]`;
      btn.style.color = '#00f0ff';
      btn.style.borderColor = '#00f0ff';
      btn.style.textShadow = '0 0 8px rgba(0, 240, 255, 0.5)';
    } else {
      btn.textContent = '[MODO: SOLO // CO-OP READY]';
      btn.style.color = '';
      btn.style.borderColor = '';
      btn.style.textShadow = '';
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
