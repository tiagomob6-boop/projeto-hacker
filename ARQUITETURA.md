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
  - [js/world.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/js/world.js): `TextureGenerator` (`CanvasTexture`), inicialização da cena (`initThree`), iluminação, `buildMap`, Centro Urbano, `buildDetailedBuilding`, `buildEnterableBuilding`, Ponte Golden Gate atravessável, Docas, barcos, carros, lojas, reforços policiais e ciclo de missão (`resetWorldState`, `startContract`, `returnToFreeRoam`).
  - [js/network.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/js/network.js): Classe abstrata `NetworkManager` (modo padrão `OFFLINE_SOLO`, pronta para plugar **PeerJS / WebRTC P2P**), eventos limpos (`onPlayerMove`, `onPlayerShoot`, `onHackTriggered`, `onMissionSync`) e serialização leve `getLocalSyncPacket()`.

---

## 2. Arquitetura da Cena Three.js

### 2.1 Renderização, Iluminação e Texturas Procedurais
- **Cúpula de Céu e Neblina (`skyDome`):** `THREE.SphereGeometry(2000, 32, 20)` com `THREE.BackSide` e `depthWrite: false`, gradiente procedural de entardecer cyberpunk de São Francisco (azul-noturno no topo, roxo, magenta suave e laranja no horizonte com estrelas sutis), combinado com `THREE.FogExp2(0x1c1430, 0.00085)` e `camera.far = 2400`.
- **Texturas Procedurais (`TextureGenerator` via `HTML5 Canvas` -> `THREE.CanvasTexture`):**
  - **Asfalto Urbano (`getAsphaltTexture`):** Textura granulada escura com faixas viárias e desgaste (`RepeatWrapping`).
  - **Fachadas de Prédios (`getBuildingFacadeTexture`):** Vidro e concreto com dezenas de janelas iluminadas em ciano, âmbar e branco-azulado.
  - **Contêineres Portuários (`getContainerTexture`):** Chapa metálica corrugada industrial.
  - **Água da Baía (`getWaterTexture`):** Ondulação reflexiva animada continuamente via `offset.x` / `offset.y` em `updateVisualEffects()`.
- **Iluminação Otimizada (≤ 8 `PointLight` simultâneas):**
  - `THREE.AmbientLight` (`0x7662a8`, intensidade `2.15`), `THREE.HemisphereLight` (`0xff8c66` / `0x1c2540`, `0.95`) e `THREE.DirectionalLight` (`0xffb899`, `1.3`) com `PCFSoftShadowMap` (`2048x2048`).
  - No máximo **8 `THREE.PointLight` ativas** (6 luzes estratégicas na rua/base, 1 na extração e **1 farol dinâmico compartilhado `refs.activeHeadlight`** acoplado apenas ao veículo dirigido), além de geometrias/materiais compartilhados nos projéteis e `.dispose()` em efeitos temporários para 60 FPS estáveis.

### 2.2 Construção Procedural do Mapa e Atmosfera
Todas as geometrias são primitivas do Three.js (`BoxGeometry`, `PlaneGeometry`, `RingGeometry`, `CircleGeometry`, `OctahedronGeometry`, `CylinderGeometry`, `EdgesGeometry`, `BufferGeometry`):
- **Mundo Aberto 50x (`buildMap` / `WORLD_BOUNDS`):** Todo o cenário (`X: -30000..30000`, `Z: -30000..30000`, `camera.far = 2400`, `FogExp2 = 0.00085`, `skyDome` seguindo a câmera) vive em um único `worldGroup` contínuo com **4 Distritos Conectados**:
  - **1. Distrito Downtown & Financial (Oeste/Norte):** Dezenas de quarteirões variados com texturas procedurais, praças, parques com árvores estilizadas, estacionamento coberto e o **Complexo ctOS (Missão 01)** (`X: -28..28, Z: -48..8`).
  - **2. Baía de São Francisco & Golden Gate:** Canal ampliado com 4 píeres de atracação, 4 lanchas DedSec navegáveis e a **Ponte Golden Gate atravessável** (`X: 80..400, Z: 35`) com guarda-corpo baixo (`1.1m`) e pilares até a água.
  - **3. Distrito Portuário & Industrial (Leste):** **Docas da Baía SF (Missão 02)** em `X = 445` com abertura ampla de `22m`, galpões industriais, pátio de contêineres, terminal marítimo e navio cargueiro da **Blume**.
  - **4. Distrito Residencial & Colinas (Sul):** Conectado a Downtown e ligado ao Distrito Portuário pela **Ponte Sul** (`X: 80..400, Z: 320`), com ruas largas, garagem clandestina da DedSec (`X = -120, Z = 320`) e colinas ao fundo.
- **Otimização para 60 FPS (`buildInstancedWorldElements`) & Física de Postes (`lightPoles`):** Elementos repetitivos em larga escala (postes de luz, árvores estilizadas, barreiras urbanas e ~140 arranha-céus distantes) usam `THREE.InstancedMesh`. Cada poste de iluminação registra sua `THREE.Box3` em `colliders`: a pé o jogador colide normalmente; de carro, colisões lentas (`speed < 6`) param o veículo, enquanto impactos em alta velocidade (`speed >= 6`) derrubam o poste para frente com animação física (`knockDownLightPole`), faíscas elétricas (`THREE.Points`) e som metálico (`AudioManager.playMetalCrash()`).
- **Prédios Abertos com Interiores Mobiliados (`buildEnterableBuilding`):** 4 edifícios principais de Downtown (**Café Cyber**, **Escritório ctOS**, **Oficina DedSec** e **Esconderijo DedSec**) possuem portas abertas sem colisor bloqueando o acesso, piso iluminado, telas holográficas, balcões, mesas, cadeiras, sofás e terminais registrados em `colliders`/`occluders` (permitindo tiroteios e cobertura no interior) e caixas de suprimentos (`supplyBoxes`: `+$100` ou `+25 HP` com `E`).
- **Gatilhos de Missão & Lojas Interativas (`missionMarkers` / `buildStores` / `#shop-modal`):** Quatro marcadores holográficos (Complexo ctOS, Docas da Baía SF e 2 **Contratos de Roubo de Veículo VIP** em roxo/magenta: `VIP_CAR_01` Protótipo Blume em Downtown pagando `\$1.800` e `VIP_CAR_02` SUV Blindado ctOS de `220 HP` nas Docas pagando `\$3.000`). No Distrito Downtown, 3 estabelecimentos com portas abertas, interior acessível, letreiros neon e ícones distintos no Radar DedSec permitem gastar o dinheiro ganho:
  - **DedSec Style (`(-32, 68)` — Losango Magenta no Radar):** Manequins neon e 5 skins completas aplicadas em tempo real por `applyPlayerSkin()`.
  - **SF Motors (`(0, 68)` — Anel Duplo Ciano no Radar):** Showroom com vitrines amplas, plataforma giratória 3D (`showroomTurntable`) e catálogo de 4 veículos exclusivos (`VEHICLES_CATALOG`: Hatch Urbano Neon `\$500`, Esportivo DedSec GT `\$1.400`, SUV Blindado ctOS `\$2.200` com `280 HP` e Interceptor Hyper-X `\$3.200` com turbo e Nitro em `Shift`) spawnados na vaga externa por `spawnPurchasedVehicle()`.
  - **HackShop Armory (`(32, 68)` — Quadrado Âmbar no Radar):** Vitrines de armas, Colete Balístico `+50 HP` máximo, Recarga Rápida `-45%` e desbloqueio da **`[5]` Escopeta Tática DedSec** com 5 projéteis em leque.
- **Blindagem, HP, Drift, Nitro e Explosão de Veículos (`damageCar` / `explodeCar` / `#vehicle-hp-container`):** Enquanto `gameState.drivingCar` estiver ativo, projéteis inimigos interceptam a `Box3` do veículo protegendo o jogador e descontam `car.hp` (barra **INTEGRIDADE DO VEÍCULO**). O dano é progressivo: `<= 65%` solta fumaça branca leve, `<= 35%` fumaça preta espessa, `<= 15%` alerta sonoro de cockpit e `0` ejeta o jogador com explosão + dano em área. Dirigindo, `Space` ativa **Drift** com inclinação da carroceria e guincho de pneu (`AudioManager.playTireScreech()`); no Interceptor Hyper-X, `Shift` ativa **Nitro** com FOV dinâmico (`62 → 74`) e rastro neon magenta.
- **Persistência Automática (`saveProgress` / `loadProgress` em `js/state.js`):** Dinheiro, HP máximo (Colete Balístico), skins compradas/equipada, armas/melhorias (`hasShotgun`, `hasRapidReload`, `hasBlackout`), carros comprados na SF Motors e preferência de chuva são salvos automaticamente em `localStorage` (`projeto_hacker_dedsec_save_v1`).
- **Arquitetura Urbana Procedural (`buildDetailedBuilding`):** Construtor composto por múltiplas camadas: base/térreo com pilares e vitrines iluminadas, corpo principal com recuos (*setbacks*), molduras horizontais entre andares, fileiras de janelas emissivas, letreiro neon vertical e topo com parapeito, caixas de ar-condicionado e antena com luz vermelha piscante (`blinkingLights`).
- **Personagem do Jogador (`buildPlayer` / `updatePlayer`):** Modelo anatômico estilizado com primitivas combinadas (`CapsuleGeometry`, `SphereGeometry`, `CylinderGeometry`, `BoxGeometry`): cabeça arredondada com bandana/máscara escura, visor neon ciano e boné com aba frontal; tronco atlético com jaqueta aberta DedSec (gola alta e frisos ciano/magenta) e mochila tiracolo cruzada com alça diagonal e LED de status; braços divididos em ombro, antebraço e mão (segurando as 4 armas) e pernas com coxa, joelho e tênis esportivo. As animações em `updatePlayer()` interpolam suavemente caminhada, corrida (`Shift`), agachamento esquelético real dobrando joelhos e inclinando o tronco (`Ctrl`) e postura de mira ao disparar.
- **Carros 3D Procedurais, Tráfego Intenso & Motoristas (`buildCarMesh` / `buildCars` / `buildTrafficCars` / `spawnFleeingDriver`):** 3 carrocerias distintas em `ExtrudeGeometry` com perfil lateral chanfrado (**`SPORT`**, **`SUV`**, **`HATCH`**), rodas com aros neon, para-choques, retrovisores, grade iluminada, faróis chanfrados e vidros semitransparentes (`opacity: 0.45`). `trafficCars` mantém **28 veículos em movimento contínuo** nos 2 sentidos por Downtown, Ponte Golden Gate, Ponte Sul, Docas e Distrito Sul com detecção frontal e buzina (`AudioManager.playHorn()`), visíveis no Radar DedSec.
- **Pedestres Vivos & Profiler ctOS (`buildPedestrians` / `updatePedestrians` / `panicPedestrians`):** **45 pedestres estilizados** com anatomia arredondada (`CapsuleGeometry` + `SphereGeometry`) circulam pelas calçadas, praças, parques e entradas das lojas, fugindo ao ouvir tiros ou explosões e exibindo o card **Profiler Watch Dogs 2** (`V + E` para `+$75`).
- **Densidade Urbana & Mobiliário Instanciado (`buildUrbanDetailsAndMidBlocks` / `buildInstancedWorldElements`):** Quarteirões intermediários em Downtown, Distrito Sul e Docas com `Box3` em `colliders`, somados a bancos de praça, lixeiras, totens holográficos e paletes em `THREE.InstancedMesh` mantendo ≤ 8 `PointLights` para 60 FPS.
- **Horizonte de São Francisco (Skyline + Golden Gate):** Prédios distantes fora da área jogável com faixas de janelas emissivas sutis e uma estrutura estilizada da **Ponte Golden Gate** (`buildGoldenGateBridge`) ao fundo (`z = -52`), com duas torres, tabuleiro, cabos suspensos e iluminação laranja-neon (`fog: false`).
- **Complexo Protegido:** Perímetro murado ampliado (`X: -28..28`, `Z: -48..8`) com Ala Oeste, Ala Leste, abertura frontal fechada pelo `gateMesh` deslizante e painel eletrônico lateral (`gatePanelMesh`). Inclui pórtico luminoso e letreiros/faixas emissivas (`buildComplexNeonAccents`), contornos neon (`THREE.EdgesGeometry` + `THREE.LineSegments`), 3 câmeras elevadas por missão + 4 câmeras de rua (`STREET_CAM_01..04`) com laser vermelho de varredura, e `serverMesh` com sistema de partículas flutuantes (`THREE.Points` em `buildServerParticles`).

### 2.3 Sistema de Colisão, Água e Câmera (1ª / 3ª Pessoa)
- **Colisão AABB x Círculo e Perímetro de Veículos (`checkCollision` / `checkCarCollision` / `isWaterArea`):** Cada obstáculo sólido (prédios, muros, quarteirões intermediários, barreiras e árvores instanciadas na área jogável) registra sua `THREE.Box3` no array `colliders`. Para veículos, `checkCarCollision()` testa 6 pontos rotacionados do perímetro (frente, traseira e laterais) contra `colliders` e contra `isWaterArea(x, z)`, impedindo carros e o jogador a pé de entrar na água (apenas barcos navegam na baía) ou atravessar paredes. Caso um carro caia na água por acidente, afunda/enguiça e ejeta o jogador na margem mais próxima.
- **Câmera em 3ª e 1ª Pessoa (`updateCamera` / `toggleFirstPerson` — Tecla `P`):**
  - **3ª Pessoa:** Orbita o ponto focal do jogador (`player.y + 1.55`) via `cameraYaw` e `cameraPitch` (Pointer Lock API), usando `Raycaster` contra `occluders` para não atravessar muros.
  - **1ª Pessoa (`gameState.firstPerson`):** A pé, posiciona a câmera na altura dos olhos (`y = 1.72` em pé, `1.12` agachado), ocultando cabeça/tronco e mantendo a arma equipada visível no canto inferior direito. Dirigindo, posiciona a câmera no banco do motorista (visão de cockpit sobre o capô) e exibe o painel holográfico `#cockpit-hud` com velocímetro em `KM/H` e marcha.

---

## 3. Máquina de Estados da Missão

O fluxo é controlado pelo objeto `gameState.mission` com base no enum `MISSION_STATE`:

```text
FREE_ROAM ──(Contrato Infiltração)──▶ INFILTRATE ──(Hack Portão)──▶ STEAL_DATA ──(Download 100%)──▶ ESCAPE ──(Extração)──▶ VICTORY
   │                                      │                             │                            │
   ├──(Contrato VIP)──▶ STEAL_CAR ────────┼─────────────────────────────┴────(Entrega Garagem)───────┘
   │                        │             │
   └────────────────────────┴─────────────┴────(HP <= 0 ou Carro VIP Destruído)──────────────────────▶ GAMEOVER
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
- **Minimapa / Radar DedSec & Mapa Tático Completo (`updateRadar` / `toggleTacticalMap` — `Tab`):** O minimapa circular desenha a linha guia **GPS tracejada** até o objetivo atual ou destino personalizado. Pressionar `Tab` abre o overlay `#tactical-map-modal` mostrando os 4 distritos, 3 lojas, contratos disponíveis e permitindo clicar para definir um waypoint GPS.
- **Letreiros 3D Legíveis, Hitmarker, Recuo e Chuva Cyberpunk (`TextureGenerator.getNeonSignTexture` / `triggerHitmarker` / `refs.rainPoints`):** Lojas, prédios abertos e a Garagem DedSec exibem letreiros 3D legíveis via `CanvasTexture`. Acertar inimigos exibe `#hitmarker` ("✕") na mira com leve recuo visual no braço/arma (`recoilTimer`), e `360` partículas de chuva neon (`THREE.Points`, alternáveis em `#btn-rain`) acompanham a câmera sem impacto no FPS.
- **Sistema Policial, Testemunhas e Câmeras Laser ctOS (`wantedLevel` / `reportCrimeToCivilians` / `spawnPoliceReinforcement`):**
  - **Nível de Procurado (`0..5` Estrelas/Escudos no HUD):** Exibe `#wanted-stars` e `#wanted-status` (`OCULTO`, `DENÚNCIA EM ANDAMENTO`, `PROCURADO`, `PERSEGUIÇÃO`). Ficar fora da linha de visão da polícia/câmeras por `15s` esfria e zera o nível de procurado.
  - **Testemunhas Chamando Reforço:** Tiros em público, ataques a civis ou roubo de carros (`F`) perto de pedestres (`< 22m`) fazem 1 testemunha sacar o celular com ícone vermelho piscando por `4.5s`. Intimidar chegando perto (`< 2.8m`) ou atordoar com Taser cancela a ligação; caso contrário, sobe `+1` ou `+2` no `wantedLevel`.
  - **Câmeras com Laser Vermelho de Varredura:** Câmeras ctOS nas esquinas e áreas de missão projetam feixes laser vermelhos semitransparentes. Entrar no feixe sem desativar a câmera (`V + E` ou `C + R`) dispara `#ctos-reveal-banner` (`LOCALIZAÇÃO REVELADA PELO ctOS`), aumenta o `wantedLevel` e chama reforços.
  - **Reforços Policiais (`spawnPoliceReinforcement`):** Viaturas SUV ctOS com sirene azul/vermelha e esquadrões de policiais armados surgem nas ruas próximas perseguindo o jogador (inclusive entrando em prédios abertos).

---

## 5. Mecânicas de Hack

- **Visão NetHack (`toggleNetHack` / Tecla `V`):** Escurece a cena e a neblina, alterna os materiais de `structureMeshes` para wireframe translúcido, destaca dispositivos em `hackableMeshes` em ciano neon, exibe `networkLinesGroup` (`THREE.Line`) e projeta etiquetas flutuantes 3D-para-2D (`updateNetHackLabels` via `Vector3.project(camera)`) sobre Painel do Portão, Caixas Elétricas, Câmeras e Servidor.
- **Caixas Elétricas de Distração (`buildElectricBoxes` / `triggerElectricBox`):** Duas caixas hackeáveis dentro do complexo (`CAIXA_ELETRICA_01` e `CAIXA_ELETRICA_02`). Pressionar `E` perto ou mirando na Visão NetHack gera faíscas (`THREE.Points`) e atrai o guarda mais próximo por `6.0s` (cooldown de `12.0s`).
- **Hack e Sobrecarga de Câmeras (`cycleSecurityCamera` / `C` e `overloadActiveCamera` / `R`):** Transfere a `camera` principal para uma câmera do complexo (`securityCameras`), permitindo girar o ângulo com o mouse. Pressionar `R` (ou `V + E` mirando na câmera) sobrecarrega e desativa a câmera e seu laser vermelho por `15.0s`.
- **Drone Quadricóptero DedSec (`buildDroneMesh` / `toggleDrone` / `checkDroneCollision` — Tecla `Q`):** Modelo 3D detalhado em escala realista (`0.38`) em chassi grafite (`0x141b2d`) com contornos `EdgesGeometry` neon ciano, bateria brilhante, gimbal frontal com lente circular (`CylinderGeometry`) e LED, 4 braços em "X" com proteções circulares (`TorusGeometry`), 4 hélices giratórias e inclinação dinâmica (*pitch/roll*). Opera com câmera em 3ª pessoa próxima (`dist = 1.9m`, `heightOffset = 0.48m`, `lerp` suave mirando `2.5m` à frente, raycast contra `occluders`, alternável com `P` para lente frontal), telemetria `DISTÂNCIA SINAL: XXm / 90m` no HUD (`#drone-hud`) e colisão 3D real nos eixos `X`, `Y` e `Z` contra `colliders` e altura do solo/água (`checkDroneCollision`). Permite usar NetHack (`V`) para marcar guardas e hackear dispositivos/portões à distância com `E`.
- **Hack de Semáforos (`trafficLights` / `V + E`):** Semáforos nos cruzamentos principais de Downtown podem ser hackeados para ficar todos verdes por `10s`, acelerando `trafficCars` para gerar caos e bloquear/atordoar viaturas policiais em perseguição.
- **Blackout Geral da Cidade (`triggerBlackout` / Tecla `B`):** Desbloqueável na HackShop por `\$900` (ou gratuito em `DEDSEC ELITE`), com recarga de `35s`: apaga os postes de iluminação por `12s`, desativa todas as câmeras com laser vermelho e reduz em `50%` o alcance de visão de guardas e policiais.
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

---

## 6. Arquitetura & Roadmap Multiplayer Cooperativo (P2P / PeerJS)

A base do projeto já está desacoplada para suportar um modo **Multiplayer Cooperativo (2 jogadores)** sem alterar a física (`checkCollision` / `checkCarCollision`) nem o renderizador Three.js:

- **Dicionário de Agentes (`playersMap` & `remotePlayers` em `js/state.js`):**
  - `createAgentMesh(config)` em [js/entities.js](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/js/entities.js) instancia tanto o jogador local (`playersMap.get('local')`) quanto agentes remotos (`remotePlayers` via `upsertRemotePlayer(packet)` / `removeRemotePlayer(id)`) com etiqueta de nome flutuante (`THREE.Sprite` + `CanvasTexture`) acima da cabeça.
- **Módulo de Rede Abstrato (`NetworkManager` em `js/network.js`):**
  - Opera em modo `OFFLINE_SOLO` por padrão (zero overhead no Singleplayer), com botão de alternância no HUD (`[MODO: SOLO // CO-OP READY]`).
  - **Eventos Limpos:** `onPlayerMove`, `onPlayerShoot`, `onHackTriggered`, `onMissionSync`.
  - **Pacote de Sincronização Leve (`getLocalSyncPacket()` a `20 Hz`):** `{ id, x, y, z, rotY, animState, weapon, inCar }`.
- **Sincronização P2P Futura com PeerJS (WebRTC):**
  1. **Host (Agente 1):** Cria uma sala PeerJS (ID curto compartilhável) e atua como autoridade para estado de guardas, tráfego, portões e objetivos (`onMissionSync`).
  2. **Cliente (Agente 2):** Conecta via `networkManager.connectPeer(dataConnection, peerId)` enviando `onPlayerMove`, `onPlayerShoot` e `onHackTriggered` a `20 Hz` via `RTCDataChannel` P2P gratuito (sem servidor backend dedicado).
  3. **Missões Cooperativas:** Um agente pode controlar câmeras (`C`) e distrair guardas com caixas elétricas (`V + E`) enquanto o parceiro infiltra o servidor central ou dirige o veículo de fuga/entrega VIP.
