# Arquitetura Técnica — Projeto Hacker

Este documento descreve a arquitetura do protótipo **Projeto Hacker**, construído com **HTML5**, **CSS3**, **JavaScript (ES6+)** e **Three.js** (`0.160.0` via `importmap` CDN).

---

## 1. Estrutura de Arquivos

- [index.html](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/index.html): Estrutura o `<canvas id="game-canvas">`, os overlays de efeitos visuais (`#nethack-overlay`, `#camera-overlay`, `#alert-vignette`), o HUD estilo DedSec/ctOS, o modal de terminal para o minigame de digitação e as telas de início, Game Over e Vitória.
- [style.css](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/style.css): Define a estética cyberpunk com fontes monoespaçadas, paleta neon (`#00f0ff` ciano, `#ff0055` magenta, `#00ff88` verde), scanlines, barras de progresso (detecção e download) e estilização do terminal.
- [script.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/script.js): Contém toda a lógica da cena 3D, movimentação e colisão do jogador, câmera orbital em 3ª pessoa, IA de patrulha e detecção dos guardas, mecânicas de hack e máquina de estados da missão.

---

## 2. Arquitetura da Cena Three.js

### 2.1 Renderização e Iluminação
- **Cena e Neblina:** `THREE.Scene` com fundo escuro (`0x090b1a`) e `THREE.FogExp2` (`0.017`) para atmosfera noturna/entardecer estilo São Francisco, com `camera.far = 200` para exibir o horizonte completo.
- **Iluminação:**
  - `THREE.AmbientLight` roxa/azulada (`0x5b4b8a`, intensidade base `2.15`) e `THREE.HemisphereLight` (`0x6d8eff` / `0x181c30`) para preenchimento claro e leitura visual nítida de personagem, muros e coberturas.
  - `THREE.DirectionalLight` com `PCFSoftShadowMap` (`2048x2048`) projetando sombras de muros, caixas, guardas e personagem.
  - `THREE.PointLight` em ciano e magenta na rua externa, luz de destaque na fachada da entrada, luzes internas no pátio, ciano sobre o Servidor Central e verde na Zona de Extração.

### 2.2 Construção Procedural do Mapa e Atmosfera
Todas as geometrias são primitivas do Three.js (`BoxGeometry`, `PlaneGeometry`, `RingGeometry`, `CircleGeometry`, `OctahedronGeometry`, `CylinderGeometry`, `EdgesGeometry`, `BufferGeometry`):
- **Área Externa (Rua):** Região frontal (`Z > 6`) onde o jogador inicia (`z = 14`) e onde está localizada a **Zona de Extração** (`z = 25`), composta por anel pulsante, círculo interno e feixe de luz vertical semitransparente (`THREE.CylinderGeometry` com `AdditiveBlending`).
- **Horizonte de São Francisco (Skyline + Golden Gate):** Prédios distantes fora da área jogável com faixas de janelas emissivas sutis e uma estrutura estilizada da **Ponte Golden Gate** (`buildGoldenGateBridge`) ao fundo (`z = -52`), com duas torres, tabuleiro, cabos suspensos e iluminação laranja-neon (`fog: false`).
- **Complexo Protegido:** Perímetro murado (`X: -16..16`, `Z: -26..6`) com abertura frontal fechada pelo `gateMesh` deslizante e painel eletrônico lateral (`gatePanelMesh`). Inclui pórtico luminoso e letreiros/faixas emissivas (`buildComplexNeonAccents`) na fachada e muros, contornos neon (`THREE.EdgesGeometry` + `THREE.LineSegments`) nos muros, caixas de cobertura e portão, 2 câmeras elevadas nos muros e o `serverMesh` no fundo (`z = -21.5`) com sistema de partículas flutuantes (`THREE.Points` em `buildServerParticles`).

### 2.3 Sistema de Colisão e Câmera em 3ª Pessoa
- **Colisão AABB x Círculo (`checkCollision`):** Cada obstáculo sólido registra uma `THREE.Box3` no array `colliders`. A movimentação do jogador testa os eixos `X` e `Z` separadamente para permitir deslizamento suave ao encostar em paredes. Quando o portão é destravado, o colisor marcado com `isGate: true` é removido.
- **Câmera Orbital (`updateCamera`):** Orbitando o ponto focal do jogador (`player.y + 1.55`) via `cameraYaw` e `cameraPitch` atualizados pela **Pointer Lock API**. Um `THREE.Raycaster` verifica interseções contra `occluders` para aproximar a câmera caso um muro fique entre ela e o jogador.

---

## 3. Máquina de Estados da Missão

O fluxo é controlado pelo objeto `gameState.mission` com base no enum `MISSION_STATE`:

```text
IDLE ──(Iniciar Missão)──▶ INFILTRATE ──(Hack do Portão)──▶ STEAL_DATA ──(Download 100%)──▶ ESCAPE ──(Zona Verde)──▶ VICTORY
                               │                              │                              │
                               └──────────────────────────────┴────(Detecção == 100%)────────┴──────────────────▶ GAMEOVER
```

- **`INFILTRATE`:** Portão trancado. Objetivo aponta para o painel na entrada.
- **`STEAL_DATA`:** Portão desliza abrindo passagem. Jogador deve infiltrar-se até o servidor central e segurar `E` para completar `downloadProgress` (`0%` a `100%` em `3.5s`).
- **`ESCAPE`:** Objetivo muda para fugir até a Zona de Extração na rua.
- **`VICTORY` / `GAMEOVER`:** Liberam o Pointer Lock e exibem a tela final correspondente com opção de reinício (`resetWorldState()`).

---

## 4. Detecção de Visão dos Guardas (Cone + Oclusão)

Cada guarda em `guards` patrulha entre dois `waypoints` em loop, rotacionando suavemente na direção do deslocamento.

1. **Cone Visual:** Um `THREE.CircleGeometry` plano no chão (`y = 0.06`), orientado para `+Z` local (`thetaStart = -Math.PI / 2 - visionHalfAngle`), acompanha a rotação do guarda.
2. **Teste Geométrico:**
   - Verifica se a distância horizontal até o jogador é menor ou igual a `visionRange` (`9.5`).
   - Calcula o produto escalar entre o vetor frontal do guarda e a direção até o jogador para validar se o ângulo está dentro de `visionHalfAngle` (`36°` para cada lado).
3. **Teste de Oclusão (Cobertura):**
   - Dispara um `THREE.Raycaster` da altura dos olhos do guarda (`y = 1.45`) até o centro do jogador (`y = 1.0`) contra a lista `occluders` (muros, portão fechado e caixas de cobertura).
   - Se `blocked.length === 0`, o guarda tem linha de visão limpa: o cone muda para vermelho e `gameState.detectionLevel` sobe rapidamente até `100%` (Game Over). Caso o jogador entre atrás de uma caixa ou saia do cone, o medidor reduz gradualmente.

---

## 5. Mecânicas de Hack

- **Visão NetHack (`toggleNetHack` / Tecla `V`):** Escurece a cena e a neblina, alterna os materiais de `structureMeshes` para wireframe translúcido, destaca dispositivos em `hackableMeshes` em ciano neon e exibe `networkLinesGroup` (`THREE.Line`) conectando Painel do Portão, Câmeras e Servidor.
- **Hack de Câmeras (`cycleSecurityCamera` / Tecla `C` ou olhar + `E`):** Transfere a `camera` principal para a posição elevada de uma das câmeras do complexo (`securityCameras`), permitindo observar e girar o ângulo com o mouse sem expor o personagem.
- **Minigame de Terminal (`openGateTerminal` / Tecla `E` no painel):** Libera o Pointer Lock, exibe o modal `#terminal-modal` com um comando aleatório de `HACK_CODES` e inicia contagem regressiva de `10.0s`. Ao digitar o código exato no `#hack-input`, `completeGateHack()` destrava o portão e avança o estado da missão.
