# Relatório de Auditoria Técnica & Otimizações — Projeto Hacker

**Data da Auditoria:** 2026-11-24  
**Escopo Auditado:** `SKILLS.md`, `index.html`, `style.css`, `script.js`, `js/state.js`, `js/config.example.js`, `js/world.js`, `js/entities.js`, `js/combat.js`, `js/ui.js`, `js/audio.js`, `js/network.js`  
**Stack:** 100% Vanilla JS (ES Modules) + Three.js `0.160.0` via CDN, zero bundlers, zero assets externos.

---

## 1. Resumo Executivo da Saúde do Projeto

A arquitetura modular do **Projeto Hacker** está íntegra, com **0 erros de sintaxe (`node --check`)**, **0 erros de import/export ES6**, **0 referências de ID DOM inexistentes** em `index.html` e **7 `THREE.PointLight`** ativas na cena inteira (rigorosamente dentro do teto máximo de 8).

| Módulo | Linhas | `PointLight` | Status Geral | Observações Principais |
| :--- | :---: | :---: | :---: | :--- |
| `index.html` / `style.css` | 553 / 1489 | 0 | 🟢 Saudável | Todos os IDs batem com `dom.*`; HUD mobile responsivo e Editor de HUD completos. |
| `script.js` | 465 | 0 | 🟢 Saudável | Loop `animate()` limpo; projéteis e EMP rodam em todos os frames; pausa correta no Modo Edição Touch. |
| `js/state.js` | 1269 | 0 | 🟢 Saudável | Neon.db com fallback automático em `localStorage`, `completedMissions` persistido; apenas chaves dinâmicas ausentes no literal `refs`. |
| `js/config.example.js` | 5 | 0 | 🟢 Saudável | Modelo público limpo; `js/config.js` protegido no `.gitignore` com `try/catch` no import dinâmico. |
| `js/audio.js` | 422 | 0 | 🟢 Saudável | 100% Web Audio API procedural; zero vazamentos de `AudioContext`; rádio synthwave e vidro quebrando estáveis. |
| `js/combat.js` | 667 | 0 | 🟡 Atenção | 1 bug crítico em altura Y de guardas abatidos/atordoados nos andares altos; 1 bug médio em `fireEmpPulse()`. |
| `js/world.js` | 5286 | 7 | 🟡 Atenção | 1 bug crítico nas partículas dos servidores (`serverParticleData` x `refs.serverParticles`); limpeza parcial em `resetWorldState()` e `spawnPurchasedVehicle()`. |
| `js/entities.js` | 3846 | 0 | 🟡 Atenção | Física e missões estáveis; gargalo de CPU em raycasts de câmeras sem culling e 14 alocações de `Vector3`/`.clone()` nos hot loops. |
| `js/ui.js` | 2073 | 0 | 🟢 Saudável | Radar, Mapa Tático, Lojas, Auth, Co-op e Controles Touch funcionais; pequenas melhorias de UX no editor mobile. |
| `js/network.js` | 259 | 0 | 🟡 Atenção | PeerJS P2P funcional a 20 Hz; canal `{ reliable: false }` pode perder eventos críticos de hack/tiro em redes instáveis. |

---

## 2. Bugs Encontrados

### 🔴 SEVERIDADE CRÍTICA

#### [CRIT-01] Overflow de vértices e altura fixa nas partículas dos servidores
- **Arquivo:** `js/world.js`
- **Funções afetadas:** `buildServerParticles()` (linhas 3624–3660) e `updateVisualEffects()` (linhas 5194–5205)
- **Causa raiz:** `buildServerParticles()` é invocada 3 vezes (para `COMPLEXO_CTOS`, `DOCAS_BAIA_SF` e `BLUME_PENTHOUSE_06`), acumulando `168` itens no array global `serverParticleData` (`3 × 56`), enquanto sobrescreve `refs.serverParticles` com apenas o último `THREE.Points` (buffer de `56` vértices). No loop `updateVisualEffects()`, o `for (let i = 0; i < serverParticleData.length; i++)` grava índices `56..167` fora do tamanho do `BufferAttribute`. Além disso, a condição `if (y > 4.9) y = 0.4` ignora `p.baseY` (`16.2` no 5º andar da Cobertura Blume), derrubando as partículas do servidor do 5º andar para o térreo.
- **Correção recomendada:** Armazenar `{ points, data }` por servidor dentro de `missionServers[missionKey]` (ou um array `serverParticleSystems`) e iterar cada sistema individualmente respeitando `p.baseY` (`y > p.baseY + 3.8 ? p.baseY + 0.4 : y`).

#### [CRIT-02] Guardas atordoados ou abatidos em andares superiores teleportam para o térreo
- **Arquivo:** `js/combat.js`
- **Funções afetadas:** `stunGuard()` (linha 176) e `damageGuard()` (linha 190)
- **Causa raiz:** Ao atordoar ou eliminar um guarda, a posição vertical é sobrescrita para valores fixos de térreo (`guard.mesh.position.y = 0.25` e `guard.mesh.position.y = 0.22`). Nos Contratos 06 (**Blume Tower**, 2º ao 5º andar) e 07 (**Grand SF Hotel**, 2º ao 4º andar), o corpo do guarda desaparece instantaneamente do andar atual e cai para o térreo (`y = 0.22`).
- **Correção recomendada:** Substituir os valores fixos por `getSurfaceHeight(guard.mesh.position.x, guard.mesh.position.z, guard.mesh.position.y) + 0.22` (e `+ 0.25` no stun).

---

### 🟠 SEVERIDADE MÉDIA

#### [MED-01] Pulso EMP (`[4]`) renderizado no térreo em prédios altos e afetando câmeras de toda a cidade
- **Arquivo:** `js/combat.js`
- **Função afetada:** `fireEmpPulse()` (linhas 288 e 293–296)
- **Causa raiz:** O anel visual do pulso EMP usa altura fixa `ringMesh.position.set(pPos.x, 0.14, pPos.z)` em vez de `pPos.y + 0.14`, ficando invisível no chão abaixo ao disparar nos andares superiores ou pontes. Além disso, o loop `securityCameras.forEach` desativa todas as câmeras do mapa inteiro sem filtrar distância (`d <= 14.0`), diferente dos guardas (`d <= 10.0`).
- **Correção recomendada:** Usar `pPos.y + 0.14` no posicionamento do `ringMesh` e aplicar verificação de distância (`camObj.pos.distanceTo(pPos) <= 14.0`) ao desativar câmeras.

#### [MED-02] Estado touch (`touchMoveX/Z` e `touchSprintToggle`) não é resetado em `resetWorldState()`
- **Arquivo:** `js/world.js`
- **Função afetada:** `resetWorldState()` (linhas 4485–4530)
- **Causa raiz:** O reset limpa `gameState.keys = {}`, mas não zera `gameState.touchMoveX`, `gameState.touchMoveZ` nem `gameState.touchSprintToggle`. No mobile, se o jogador morrer ou concluir uma missão com o botão `CORRER` ativado ou joystick segurado, o personagem mantém corrida/movimento preso ao retornar ao Mundo Aberto.
- **Correção recomendada:** Adicionar `gameState.touchMoveX = 0; gameState.touchMoveZ = 0; gameState.touchSprintToggle = false;` e remover a classe `.active` do botão `[data-action="sprint"]` em `resetWorldState()`.

#### [MED-03] Remoção incompleta de anéis de explosão de carros em `resetWorldState()`
- **Arquivo:** `js/world.js`
- **Função afetada:** `resetWorldState()` (linhas 4639–4645)
- **Causa raiz:** `explodeCar()` em `js/combat.js` adiciona `ringMesh` em `refs.worldGroup`, mas `resetWorldState()` chama apenas `refs.scene.remove(w.mesh)`. Se o reset ocorrer durante uma explosão de veículo, o anel permanece órfão em `worldGroup`.
- **Correção recomendada:** Usar `if (w.mesh?.parent) w.mesh.parent.remove(w.mesh); else refs.scene.remove(w.mesh);`.

#### [MED-04] Raycast de recorte do cone laser em todas as câmeras a 60 FPS sem culling de distância
- **Arquivo:** `js/entities.js`
- **Função afetada:** `updateSecurityCameras()` (linhas 2897–2904)
- **Causa raiz:** Cada câmera de segurança executa `raycaster.intersectObjects(occluders, false)` em todos os frames, mesmo quando está a centenas de metros da câmera do jogador. Em celulares intermediários, ~25 raycasts/frame contra o array completo de `occluders` aumenta significativamente o frame time.
- **Correção recomendada:** Pular o raycast visual de cone quando a distância ao jogador/câmera for `> 110m`, e atualizar `laserMesh.scale` em frequência reduzida (ex.: a cada 3 frames ou quando `|yaw - lastLaserYaw| > 0.02`).

#### [MED-05] Eventos críticos de Co-op P2P trafegando em canal não-confiável e colisão de Room ID
- **Arquivo:** `js/network.js`
- **Funções afetadas:** `joinRoom()` (linha 102), `createRoom()` (linhas 44–71) e `getLocalSyncPacket()` (linhas 155–182)
- **Causa raiz:**
  1. A `DataConnection` do PeerJS é aberta com `{ reliable: false }`, ótimo para pacotes de posição a 20 Hz, mas eventos pontuais críticos (`onHackTriggered` para abertura de portão e `onPlayerShoot`) podem se perder em redes móveis 4G/5G com perda de pacotes.
  2. `createRoom()` não trata `err.type === 'unavailable-id'` com nova tentativa automática de código.
  3. `getLocalSyncPacket()` não diferencia `BOAT` (`gameState.drivingBoat`) nem `JUMP` (`!gameState.isGrounded`) em `animState`.
- **Correção recomendada:** Reenviar eventos críticos (`GATE`, `BLACKOUT`) 2x com pequeno intervalo ou usar um canal confiável secundário para eventos; adicionar retry automático no evento `unavailable-id`; incluir `BOAT` e `JUMP` em `animState`.

---

### 🟢 SEVERIDADE BAIXA

#### [LOW-01] Vazamento leve de GPU ao substituir carros na vaga da SF Motors
- **Arquivo:** `js/world.js`
- **Função afetada:** `spawnPurchasedVehicle()` (linhas 4800–4808)
- **Causa raiz:** Ao remover um carro anterior da vaga externa da concessionária (`refs.worldGroup.remove(existing.mesh)`), não é chamado `disposeHierarchy(existing.mesh)`, deixando geometrias e materiais desse carro na memória WebGL.
- **Correção recomendada:** Chamar `disposeHierarchy(existing.mesh)` imediatamente após `refs.worldGroup.remove(existing.mesh)`.

#### [LOW-02] Propriedades dinâmicas em `refs` não declaradas inicialmente
- **Arquivo:** `js/state.js`
- **Objeto afetado:** `refs` (linhas 515–560)
- **Causa raiz:** As propriedades `onBroadcastShoot`, `onBroadcastHack`, `onShatterWindow`, `onFreeRescueCell` e `_shadowTimer` são injetadas em runtime por outros módulos sem estarem listadas em `refs` no `state.js`.
- **Correção recomendada:** Declarar essas 5 chaves como `null` / `0` no objeto `refs` em `js/state.js` para previsibilidade de shape (hidden classes V8) e clareza documental.

#### [LOW-03] UX do Editor de HUD Touch e rótulo dinâmico do botão `ARMA`
- **Arquivo:** `js/ui.js`
- **Função afetada:** `setupMobileTouchControls()` e `updateWeaponHUD()`
- **Causa raiz:** O botão touch `ARMA` mantém sempre o rótulo estático `"ARMA"` em vez de refletir a arma equipada (`TASER` / `9MM` / `RIFLE` / `EMP` / `12GA`). Além disso, no Modo Edição (`#touch-editor-bar`), o usuário só visualiza os botões do contexto atual (`foot`, `vehicle` ou `drone`), precisando entrar num carro ou lançar o drone para reposicionar os outros conjuntos.
- **Correção recomendada:** Atualizar o `textContent` de `[data-action="weapon"]` dentro de `updateWeaponHUD()` e adicionar 3 abas rápidas (`A PÉ | VEÍCULO | DRONE`) na barra `#touch-editor-bar` durante o Modo Edição.

---

## 3. Otimizações de Performance e Código (60 FPS PC & Mobile)

1. **Eliminar alocações de `THREE.Vector3` e `.clone()` nos hot loops (`js/entities.js`)**:
   - Nossa auditoria estática encontrou **14 alocações por frame** em `updatePlayer` (1), `updateGuards` (7) e `updateInteractionsAndMission` (6) — como `g.investigateTarget.clone().sub(...)`, `target.clone().sub(...)`, `sp.pos.clone().add(new THREE.Vector3(...))`.
   - **Impacto:** Substituir todas pelos vetores pré-alocados `_tmpV1.._tmpV6` reduz o Garbage Collection a praticamente zero, eliminando micro-stutters no mobile.
2. **Throttling de onda da água e chuva em telas mobile (`js/world.js` — `updateVisualEffects`)**:
   - A malha `bayWaterGeo` (32×32 = 1.089 vértices) e `rainPoints` (360 partículas) atualizam `BufferAttribute.needsUpdate = true` a 60 Hz.
   - **Impacto:** Limitar a atualização dos vértices da água a **30 Hz** (ou pausar quando `camera.position.x` estiver longe da baía) e desativar `rainPoints` por padrão em dispositivos touch (`gameState.touchEnabled`) economiza ~20–30% de CPU/GPU em smartphones.
3. **Filtro espacial prévio em `occluders` para Raycaster (`js/combat.js` e `js/entities.js`)**:
   - `raycaster.intersectObjects(occluders, false)` testa centenas de malhas estáticas do mapa inteiro a cada tiro e a cada guarda/câmera em visão.
   - **Impacto:** Manter uma lista reduzida de `nearbyOccluders` (atualizada a cada 0.5s com raio de 85m ao redor do jogador) reduz em até **80%** o custo de todos os raycasts sem alterar nenhuma física.
4. **Limitar `renderer.setPixelRatio` dinamicamente em mobile (`js/world.js`)**:
   - Atualmente limitado a `1.5`, que ainda é pesado em telas mobile 1080p+ com GPU integrada.
   - **Impacto:** Usar `Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.5)` e desabilitar sombras por padrão quando `window.innerWidth < 900` (mantendo o botão `[SOMBRAS: ON/OFF]` disponível).
5. **Reutilização de `BoxGeometry` / `MeshStandardMaterial` em `buildEnterableBuilding()` (`js/world.js`)**:
   - Compartilhar materiais metálicos de pilares, marquises e vidros quebráveis (ou clonar apenas quando necessário) reduz a contagem de programas shader e o tempo de inicialização em ~300–500ms.

---

## 4. Checklist Pré-Deploy GitHub Pages

- [x] **100% Vanilla JS (ES Modules)** com caminhos relativos `.js` em todos os `import` / `export` (0 erros detectados).
- [x] **Three.js `0.160.0`** carregado exclusivamente via `<script type="importmap">` CDN.
- [x] **Zero bundlers e zero assets externos** (geometria procedural, texturas via `HTML5 Canvas`, áudio via Web Audio API).
- [x] **Teto de `THREE.PointLight` respeitado:** exatamente **7** luzes pontuais ativas (máximo permitido: 8).
- [x] **Segurança de credenciais Neon.db:** `js/config.js` está no `.gitignore`, `js/config.example.js` serve como modelo público e `initCloudDb()` possui fallback silencioso para `localStorage` quando `js/config.js` não existe no GitHub Pages.
- [x] **Validação de sintaxe:** `node --check` aprovado em `script.js` e em todos os módulos de `js/*.js`.
- [x] **Suporte Mobile & Responsividade:** Detecção automática de touch, multi-touch sem Pointer Lock, Editor de HUD salvo em `localStorage` (`dedsec_mobile_hud_layout`) e `@media (max-width: 900px)`.
- [ ] **Pendências recomendadas antes do deploy final (próximo passo):** Corrigir `[CRIT-01]` (partículas dos servidores), `[CRIT-02]` (altura Y de guardas em prédios altos) e `[MED-01]` a `[MED-04]`.
