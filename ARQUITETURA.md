# Arquitetura Técnica — Projeto Hacker

Este documento descreve a arquitetura do protótipo **Projeto Hacker**, construído com **HTML5**, **CSS3**, **JavaScript (ES6+)** e **Three.js** (`0.160.0` via `importmap` CDN).

---

## 1. Estrutura de Arquivos

- [index.html](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/index.html): Estrutura o `<canvas id="game-canvas">`, os overlays de efeitos visuais (`#nethack-overlay` com `#nethack-labels`, `#camera-overlay`, `#alert-vignette`), o HUD estilo DedSec/ctOS (incluindo o minimapa circular `<canvas id="radar-canvas">` e botão de mudo `#btn-mute`), o modal de terminal para o minigame de digitação e as telas de início (com seletor de dificuldade), Game Over e Vitória (com ranking e estatísticas).
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
- **Múltiplos Mapas Selecionáveis (`MAPS_CONFIG` / `buildMap`):** Todos os elementos do cenário pertencem a um `worldGroup` isolado, permitindo limpar completamente `colliders`, `occluders`, `guards`, `securityCameras`, `electricBoxes`, `cars`, `gates` e malhas ao alternar entre dois mapas na `#start-screen`:
  - **Mapa 1 — `COMPLEXO_CTOS` (Centro Urbano):** Área externa ampliada (`X: -36..36`, `Z: -35..45`) com calçadas elevadas e meio-fio, faixas de pedestres, hidrantes, barreiras de concreto, outdoors holográficos neon, prédios laterais com fachadas iluminadas, vista para a Ponte Golden Gate, 1 portão eletrônico, 2 guardas, 2 câmeras, 2 caixas elétricas e 4 carros (3 estacionados + 1 DedSec).
  - **Mapa 2 — `DOCAS_BAIA_SF` (Terminal Portuário Noturno):** Píer cercado por água reflexiva animada (`waterMesh`), corredores de contêineres empilhados (vermelhos, azuis e ciano), 2 portões/barreiras eletrônicas (`gates`), 3 guardas, 3 câmeras, 2 caixas elétricas, 3 carros e o navio cargueiro da **Blume** ancorado ao fundo com o servidor central no convés/píer.
- **Personagem do Jogador (`buildPlayer`):** Modelo procedural com casaco contornado em neon (`EdgesGeometry`), braços articulados sincronizados com a caminhada/corrida e mochila hacker com LED pulsante.
- **Carros 3D Procedurais (`buildCarMesh` / `buildCars`):** 3 carros estacionados (com colisão dinâmica, oclusão e hackeáveis na Visão NetHack com `E` para acelerar e atordoar/distrair guardas no trajeto) e 1 carro esporte **DedSec** dirigível na rua (`F` para entrar/sair, `WASD` para dirigir com física simples, faróis `PointLight` e som de motor procedural via `AudioManager.updateEngineSound`).
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
- **`STEAL_DATA`:** Portão desliza abrindo passagem. Jogador deve infiltrar-se até o servidor central, desativar o **Firewall** via terminal (`E`) e então segurar `E` para completar `downloadProgress` (`0%` a `100%` em `3.5s`).
- **`ESCAPE`:** Objetivo muda para fugir até a Zona de Extração na rua.
- **`VICTORY` / `GAMEOVER`:** Liberam o Pointer Lock, param a trilha procedural e exibem a tela final correspondente com opção de reinício (`resetWorldState()`). Na vitória, `calculateMissionRank()` avalia tempo, detecção máxima e hacks executados para atribuir o rank (`RANK S - FANTASMA`, `RANK A - INFILTRADOR`, `RANK B - OPERATIVO` ou `RANK C`).
- **Dificuldade (`DIFFICULTY_PRESETS`):** Selecionada na `#start-screen` entre `INICIANTE` (guardas mais lentos, `12.0s` no terminal) e `DEDSEC ELITE` (guardas e varredura de câmeras mais rápidos, `7.0s` no terminal).

---

## 4. Detecção de Visão (Guardas e Câmeras) + Stealth + Radar

Cada guarda em `guards` opera com uma máquina de estados (`GUARD_STATE`):
- **`PATROL`:** Patrulha em loop entre os `waypoints` com cone amarelo.
- **`INVESTIGATE`:** Ativado quando o jogador entra no cone e atinge `detectionLevel >= 40%` antes de escapar. O cone muda para laranja (`0xff7700`), o guarda caminha até `lastKnownPos`, olha para os lados por `3.0s` e retorna a `PATROL`.
- **`DISTRACTED`:** Ativado ao sobrecarregar uma caixa elétrica, atraindo o guarda mais próximo até o local por `6.0s` com cone laranja.
- **`STUNNED`:** Ativado pelo Taser (`12.0s`), Pulso EMP (`8.0s`) ou impacto de carro (`6.0s`). O guarda inclina-se no chão com faíscas elétricas (`THREE.Points`) e cone desligado; ao terminar o tempo, levanta e entra em `INVESTIGATE`.

1. **Cone Visual:** Um `THREE.CircleGeometry` plano no chão (`y = 0.06` nos guardas, `y = 0.05` nas câmeras), orientado para `+Z` local (`thetaStart = -Math.PI / 2 - visionHalfAngle`), acompanha a rotação do guarda ou a varredura periódica da câmera (`updateSecurityCameras`).
2. **Teste Geométrico e Modificadores de Stealth:**
   - Verifica se a distância horizontal até o jogador é menor ou igual ao alcance efetivo (`visionRange`, ajustado em `+3.0` ao correr com `Shift` ou `-1.5` ao agachar com `Ctrl`).
   - Calcula o produto escalar entre o vetor frontal (guarda ou câmera) e a direção até o jogador para validar se o ângulo está dentro de `visionHalfAngle` (`36°` nos guardas, `30°` nas câmeras).
3. **Teste de Oclusão (Cobertura):**
   - Dispara um `THREE.Raycaster` da altura dos olhos do guarda (`y = 1.45`) ou da posição da câmera até o centro do jogador (`y = 1.05` em pé, `y = 0.58` agachado com `Ctrl`) contra a lista `occluders` (muros, portão fechado e caixas de cobertura).
   - Se `blocked.length === 0`, há linha de visão limpa: o cone muda para vermelho e `gameState.detectionLevel` sobe rapidamente até `100%` (Game Over). Caso o jogador entre atrás de uma caixa ou saia do cone, o medidor reduz gradualmente.
4. **Minimapa / Radar DedSec (`updateRadar` / `#radar-canvas`):**
   - Canvas 2D circular no canto inferior direito do HUD que renderiza em tempo real a planta baixa do complexo (muros, caixas de cobertura), os novos quarteirões/prédios laterais, os carros (estacionados e DedSec), o portão, o servidor central, a zona de extração, os pontos vermelhos e cones dos guardas e a posição/direção do jogador no centro rotacionada pela câmera.

---

## 5. Mecânicas de Hack

- **Visão NetHack (`toggleNetHack` / Tecla `V`):** Escurece a cena e a neblina, alterna os materiais de `structureMeshes` para wireframe translúcido, destaca dispositivos em `hackableMeshes` em ciano neon, exibe `networkLinesGroup` (`THREE.Line`) e projeta etiquetas flutuantes 3D-para-2D (`updateNetHackLabels` via `Vector3.project(camera)`) sobre Painel do Portão, Caixas Elétricas, Câmeras e Servidor.
- **Caixas Elétricas de Distração (`buildElectricBoxes` / `triggerElectricBox`):** Duas caixas hackeáveis dentro do complexo (`CAIXA_ELETRICA_01` e `CAIXA_ELETRICA_02`). Pressionar `E` perto ou mirando na Visão NetHack gera faíscas (`THREE.Points`) e atrai o guarda mais próximo por `6.0s` (cooldown de `12.0s`).
- **Hack e Sobrecarga de Câmeras (`cycleSecurityCamera` / `C` e `overloadActiveCamera` / `R`):** Transfere a `camera` principal para uma câmera do complexo (`securityCameras`), permitindo girar o ângulo com o mouse. Pressionar `R` durante o controle sobrecarrega e desativa a câmera (e seu cone de detecção verde) por `15.0s`.
- **Minigame de Terminal (`openTerminal` / Tecla `E` no painel ou servidor):** Libera o Pointer Lock, exibe `#terminal-modal` com códigos variados (`HACK_CODES` para o portão em `10.0s`, `FIREWALL_CODES` para o firewall do servidor em `8.5s`) e executa `completeTerminalHack()` ao digitar o comando exato no `#hack-input`.
- **Armas Táticas DedSec (`fireTaser` / `fireEmpPulse` / Teclas `1`, `2` e Clique Esquerdo):**
  - **Taser Não-Letal (`1`):** Pistola 3D na mão direita do personagem; dispara projéteis elétricos (`updateProjectiles`) com rastro `THREE.Line`, colisão com `occluders` e guardas (aplicando `STUNNED` por `12.0s`), recarga de `2.5s` no HUD e áudio `playTaserShot()`.
  - **Pulso EMP (`2`):** Gera onda expansiva `THREE.RingGeometry` no chão (`updateEmpWaves`), desativa câmeras por `8.0s` e atordoa guardas em raio de `8.0m` por `8.0s`, com cooldown de `15.0s` e áudio `playEmpPulse()`.

---

## 6. Áudio Procedural (Web Audio API)

Todo o áudio do jogo é sintetizado em tempo real pelo módulo `AudioManager` em [script.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/script.js), sem arquivos externos, inicializado ao clicar em **INICIAR MISSÃO** (`AudioManager.init()`):

- **Efeitos Sonoros:** Bipe digital ao digitar no terminal (`playKeyBeep`), confirmação/erro (`playTerminalSuccess` / `playTerminalError`), pulso grave na Visão NetHack (`playNetHackPulse`), ruído mecânico filtrado ao abrir o portão (`playGateMechanical`), estalo elétrico em caixas de distração e sobrecarga de câmeras (`playElectricZap`), bips progressivos conforme `detectionLevel` (`updateAlertTick`), sirene no Game Over (`playGameOverSiren`) e acorde na Vitória (`playVictoryChime`).
- **Trilha Synthwave Dinâmica:** Loop de baixo sintetizado (`sawtooth` + `BiquadFilterNode` passa-baixa) que toca em `96 BPM` durante `INFILTRATE` / `STEAL_DATA` e acelera automaticamente para `138 BPM` ao entrar no estado `ESCAPE`.
- **Controle de Mudo:** Alternável a qualquer momento pela tecla `M` ou pelo botão `#btn-mute` no HUD (`AudioManager.toggleMute()`).
