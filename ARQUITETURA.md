# Arquitetura Técnica — Projeto Hacker

Este documento descreve a arquitetura do protótipo **Projeto Hacker**, construído com **HTML5**, **CSS3**, **JavaScript (ES6+)** e **Three.js** (`0.160.0` via `importmap` CDN).

---

## 1. Estrutura de Arquivos

- [index.html](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/index.html): Estrutura o `<canvas id="game-canvas">`, os overlays de efeitos visuais (`#nethack-overlay` com `#nethack-labels`, `#camera-overlay`, `#alert-vignette`), o HUD estilo DedSec/ctOS (incluindo o minimapa circular `<canvas id="radar-canvas">` e botão de mudo `#btn-mute`), o modal de terminal para o minigame de digitação e as telas de início (com seletor de dificuldade), Game Over e Vitória (com ranking e estatísticas).
- [style.css](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/style.css): Define a estética cyberpunk com fontes monoespaçadas, paleta neon (`#00f0ff` ciano, `#ff0055` magenta, `#00ff88` verde), scanlines, barras de progresso (detecção e download) e estilização do terminal.
- [script.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/script.js): Ponto de entrada (*entrypoint*) que importa os ES Modules de `js/`, inicializa o Three.js dentro de `try/catch` com diagnóstico visual (`showFatalError`), registra os inputs (`setupInputs`) e executa o loop principal `animate()`.
- `js/` (ES Modules nativos no navegador com caminhos relativos `.js`):
  - [js/state.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/js/state.js): Constantes (`MISSION_STATE`, `GUARD_STATE`, `WEAPON_TYPE`, `WEAPON_CONFIG`, `MAPS_CONFIG`, `DIFFICULTY_PRESETS`), referências `dom`, objeto compartilhado `refs`, `gameState`, arrays globais e utilitários espaciais (`getSurfaceHeight`, `isWaterArea`, `checkCollision`, `createHackableDevice`, `formatTime`).
  - [js/audio.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/js/audio.js): Módulo `AudioManager` com síntese procedural via Web Audio API e trilha dinâmica.
  - [js/ui.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/js/ui.js): Atualização do HUD (`updateHpHUD`, `updateMoneyHUD`, `updateWeaponHUD`), terminais de hack (`openTerminal`, `completeTerminalHack`), etiquetas 3D NetHack (`updateNetHackLabels`), modais de missão, telas finais e minimapa (`updateRadar`).
  - [js/combat.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/js/combat.js): Arsenal de armas (`selectWeapon`, `fireEquippedWeapon`, `fireEmpPulse`), projéteis (`updateProjectiles`, `updateGuardProjectiles`), dano (`damagePlayer`, `damageGuard`, `stunGuard`) e alertas da base (`triggerBaseAlert`).
  - [js/entities.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/js/entities.js): Construção e atualização do jogador (`buildPlayer`, `updatePlayer`), veículos e barcos (`updateCars`, `toggleDriveDedsecCar`), guardas (`buildGuards`, `updateGuards`), câmeras e interações.
  - [js/world.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/js/world.js): `TextureGenerator` (`CanvasTexture`), inicialização da cena (`initThree`), iluminação, `buildMap`, Centro Urbano, `buildDetailedBuilding`, Ponte Golden Gate atravessável, Docas, barcos, carros e ciclo de missão (`resetWorldState`, `startContract`, `returnToFreeRoam`).

---

## 2. Arquitetura da Cena Three.js

### 2.1 Renderização, Iluminação e Texturas Procedurais
- **Cúpula de Céu e Neblina (`skyDome`):** `THREE.SphereGeometry(780, 32, 20)` com `THREE.BackSide` e gradiente procedural de entardecer cyberpunk de São Francisco (azul-noturno no topo, roxo, magenta suave e laranja no horizonte com estrelas sutis), combinado com `THREE.FogExp2(0x1c1430, 0.0020)` e `camera.far = 950`.
- **Texturas Procedurais (`TextureGenerator` via `HTML5 Canvas` -> `THREE.CanvasTexture`):**
  - **Asfalto Urbano (`getAsphaltTexture`):** Textura granulada escura com faixas viárias e desgaste (`RepeatWrapping`).
  - **Fachadas de Prédios (`getBuildingFacadeTexture`):** Vidro e concreto com dezenas de janelas iluminadas em ciano, âmbar e branco-azulado.
  - **Contêineres Portuários (`getContainerTexture`):** Chapa metálica corrugada industrial.
  - **Água da Baía (`getWaterTexture`):** Ondulação reflexiva animada continuamente via `offset.x` / `offset.y` em `updateVisualEffects()`.
- **Iluminação:**
  - `THREE.AmbientLight` (`0x7662a8`, intensidade `2.15`), `THREE.HemisphereLight` (`0xff8c66` / `0x1c2540`, `0.95`) e `THREE.DirectionalLight` (`0xffb899`, `1.3`) com `PCFSoftShadowMap` (`2048x2048`) para destacar prédios, veículos e personagens no entardecer.
  - `THREE.PointLight` em ciano e magenta na rua externa, luz de destaque na fachada da entrada, luzes internas no pátio, ciano sobre o Servidor Central e verde na Zona de Extração.

### 2.2 Construção Procedural do Mapa e Atmosfera
Todas as geometrias são primitivas do Three.js (`BoxGeometry`, `PlaneGeometry`, `RingGeometry`, `CircleGeometry`, `OctahedronGeometry`, `CylinderGeometry`, `EdgesGeometry`, `BufferGeometry`):
- **Mundo Aberto 50x (`buildMap` / `WORLD_BOUNDS`):** Todo o cenário (`X: -30000..30000`, `Z: -30000..30000`, `camera.far = 2400`, `FogExp2 = 0.00085`, `skyDome` seguindo a câmera) vive em um único `worldGroup` contínuo com **4 Distritos Conectados**:
  - **1. Distrito Downtown & Financial (Oeste/Norte):** Dezenas de quarteirões variados com texturas procedurais, praças, parques com árvores estilizadas, estacionamento coberto e o **Complexo ctOS (Missão 01)** (`X: -28..28, Z: -48..8`).
  - **2. Baía de São Francisco & Golden Gate:** Canal ampliado com 4 píeres de atracação, 4 lanchas DedSec navegáveis e a **Ponte Golden Gate atravessável** (`X: 80..400, Z: 35`) com guarda-corpo baixo (`1.1m`) e pilares até a água.
  - **3. Distrito Portuário & Industrial (Leste):** **Docas da Baía SF (Missão 02)** em `X = 445` com abertura ampla de `22m`, galpões industriais, pátio de contêineres, terminal marítimo e navio cargueiro da **Blume**.
  - **4. Distrito Residencial & Colinas (Sul):** Conectado a Downtown e ligado ao Distrito Portuário pela **Ponte Sul** (`X: 80..400, Z: 320`), com ruas largas, garagem clandestina da DedSec (`X = -120, Z = 320`) e colinas ao fundo.
- **Otimização para 60 FPS (`buildInstancedWorldElements`):** Elementos repetitivos em larga escala (postes de luz, árvores estilizadas dos parques, barreiras urbanas e ~140 arranha-céus distantes de horizonte) são renderizados via `THREE.InstancedMesh` em poucos *draw calls*.
- **Gatilhos de Missão no Mapa (`missionMarkers` / `#mission-modal`):** Quatro marcadores holográficos (Complexo ctOS, Docas da Baía SF e 2 **Contratos de Roubo de Veículo VIP** em roxo/magenta: `VIP_CAR_01` Protótipo Blume em Downtown pagando `\$1.800` e `VIP_CAR_02` SUV Blindado ctOS de `220 HP` nas Docas pagando `\$3.000`). O fluxo `MISSION_STATE.STEAL_CAR` ativa perseguição armada ao entrar no veículo alvo e exige a entrega na **Garagem Clandestina DedSec** (`X = -120, Z = 320`).
- **Blindagem, HP e Explosão de Veículos (`damageCar` / `explodeCar` / `#vehicle-hp-container`):** Enquanto `gameState.drivingCar` estiver ativo, projéteis inimigos interceptam a `Box3` do veículo protegendo o jogador e descontam `car.hp` (exibido na barra **INTEGRIDADE DO VEÍCULO**). Com `car.hp <= 35`, fumaça escura (`THREE.Points`) sobe do capô; ao chegar a `0`, o jogador é ejetado, dispara explosão visual + `AudioManager.playExplosion()` + dano em área nos guardas próximos e o carro vira sucata queimada (`0x1a1a1a`). (Veja [PLANO_MUNDO_ABERTO.md](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/PLANO_MUNDO_ABERTO.md) para as próximas etapas).
- **Arquitetura Urbana Procedural (`buildDetailedBuilding`):** Construtor composto por múltiplas camadas: base/térreo com pilares e vitrines iluminadas, corpo principal com recuos (*setbacks*), molduras horizontais entre andares, fileiras de janelas emissivas, letreiro neon vertical e topo com parapeito, caixas de ar-condicionado e antena com luz vermelha piscante (`blinkingLights`).
- **Personagem do Jogador (`buildPlayer` / `updatePlayer`):** Modelo anatômico estilizado com primitivas combinadas (`CapsuleGeometry`, `SphereGeometry`, `CylinderGeometry`, `BoxGeometry`): cabeça arredondada com bandana/máscara escura, visor neon ciano e boné com aba frontal; tronco atlético com jaqueta aberta DedSec (gola alta e frisos ciano/magenta) e mochila tiracolo cruzada com alça diagonal e LED de status; braços divididos em ombro, antebraço e mão (segurando as 4 armas) e pernas com coxa, joelho e tênis esportivo. As animações em `updatePlayer()` interpolam suavemente caminhada, corrida (`Shift`), agachamento esquelético real dobrando joelhos e inclinando o tronco (`Ctrl`) e postura de mira ao disparar.
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

## 4. Visão Realista, HP, IA de Combate e Radar

Os cones circulares no chão foram removidos para dar lugar a um sistema realista de detecção e combate armado:

- **Vida do Agente (`HP: 100%`):** Exibida no canto superior direito do HUD (`#status-hp` e `#hp-bar`). Ao sofrer dano (`damagePlayer`), a tela exibe `#damage-flash` em vermelho e toca `AudioManager.playPlayerHit()`. Quando `hp <= 0`, dispara Game Over (`AGENTE ABATIDO`).
- **Máquina de Estados dos Guardas (`GUARD_STATE`):**
  - **`PATROL`:** Patrulha em rotas amplas cobrindo toda a extensão da base (pátio frontal, corredores laterais, área central e fundos).
  - **`INVESTIGATE`:** Ativado por ruído de tiros não-silenciados (`alertGuardsByNoise`) ou perda de contato visual; caminha até `lastKnownPos` e olha para os lados por `3.0s`.
  - **`DISTRACTED`:** Atraído por caixas elétricas (`6.0s`).
  - **`STUNNED`:** Atordoado por Taser (`10.0s`), EMP (`10.0s`) ou veículo (`6.0s`) com faíscas elétricas.
  - **`COMBAT`:** Ao avistar o jogador (campo frontal de `110°`, distância de `22m` e `Raycaster` da cabeça até o jogador sem oclusão), sofrer dano ou durante o **Alerta Geral da Base** (`triggerBaseAlert()` ao hackear o firewall ou concluir o download), o guarda mira e dispara rajadas de projéteis (`guardProjectiles`, `12` de dano por acerto) com sua `gunMesh`.
  - **`DEAD`:** Neutralizado ao atingir `0 HP`.
- **Minimapa / Radar DedSec (`updateRadar` / `#radar-canvas`):** Canvas 2D circular que renderiza a planta baixa, quarteirões, carros, portões, servidor, zona de extração, posição do jogador e marcadores de estado dos guardas (sem cones artificiais).

---

## 5. Mecânicas de Hack

- **Visão NetHack (`toggleNetHack` / Tecla `V`):** Escurece a cena e a neblina, alterna os materiais de `structureMeshes` para wireframe translúcido, destaca dispositivos em `hackableMeshes` em ciano neon, exibe `networkLinesGroup` (`THREE.Line`) e projeta etiquetas flutuantes 3D-para-2D (`updateNetHackLabels` via `Vector3.project(camera)`) sobre Painel do Portão, Caixas Elétricas, Câmeras e Servidor.
- **Caixas Elétricas de Distração (`buildElectricBoxes` / `triggerElectricBox`):** Duas caixas hackeáveis dentro do complexo (`CAIXA_ELETRICA_01` e `CAIXA_ELETRICA_02`). Pressionar `E` perto ou mirando na Visão NetHack gera faíscas (`THREE.Points`) e atrai o guarda mais próximo por `6.0s` (cooldown de `12.0s`).
- **Hack e Sobrecarga de Câmeras (`cycleSecurityCamera` / `C` e `overloadActiveCamera` / `R`):** Transfere a `camera` principal para uma câmera do complexo (`securityCameras`), permitindo girar o ângulo com o mouse. Pressionar `R` durante o controle sobrecarrega e desativa a câmera (e seu cone de detecção verde) por `15.0s`.
- **Minigame de Terminal (`openTerminal` / Tecla `E` no painel ou servidor):** Libera o Pointer Lock, exibe `#terminal-modal` com códigos variados (`HACK_CODES` para o portão em `10.0s`, `FIREWALL_CODES` para o firewall do servidor em `8.5s`) e executa `completeTerminalHack()` ao digitar o comando exato no `#hack-input`.
- **Arsenal Tático DedSec (`selectWeapon` / `fireEquippedWeapon` / Teclas `1` a `4` e Clique Esquerdo):**
  - **`[1]` Taser DedSec (`1.5s` recarga):** Disparo elétrico que atordoa guardas por `10.0s` (`STUNNED`).
  - **`[2]` Pistola Silenciada 9mm (`0.35s` recarga):** Causa `50` de dano por tiro sem alertar guardas distantes (`noiseRadius: 0`).
  - **`[3]` Rifle de Assalto DedSec (`0.14s` recarga, automático):** Traçantes laranja/ciano causando `35` de dano por tiro e alertando guardas em `26m`.
  - **`[4]` Pulso EMP (`12.0s` recarga):** Onda expansiva `THREE.RingGeometry` que desativa câmeras e atordoa guardas em raio de `10m` por `10.0s`.

---

## 6. Áudio Procedural (Web Audio API)

Todo o áudio do jogo é sintetizado em tempo real pelo módulo `AudioManager` em [script.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/script.js), sem arquivos externos, inicializado ao clicar em **INICIAR MISSÃO** (`AudioManager.init()`):

- **Efeitos Sonoros:** Bipe digital ao digitar no terminal (`playKeyBeep`), confirmação/erro (`playTerminalSuccess` / `playTerminalError`), pulso grave na Visão NetHack (`playNetHackPulse`), ruído mecânico filtrado ao abrir o portão (`playGateMechanical`), estalo elétrico em caixas de distração e sobrecarga de câmeras (`playElectricZap`), bips progressivos conforme `detectionLevel` (`updateAlertTick`), sirene no Game Over (`playGameOverSiren`) e acorde na Vitória (`playVictoryChime`).
- **Trilha Synthwave Dinâmica:** Loop de baixo sintetizado (`sawtooth` + `BiquadFilterNode` passa-baixa) que toca em `96 BPM` durante `INFILTRATE` / `STEAL_DATA` e acelera automaticamente para `138 BPM` ao entrar no estado `ESCAPE`.
- **Controle de Mudo:** Alternável a qualquer momento pela tecla `M` ou pelo botão `#btn-mute` no HUD (`AudioManager.toggleMute()`).
