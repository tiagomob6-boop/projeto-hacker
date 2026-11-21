# Auditoria Técnica, Caça aos Bugs e Backlog de Melhorias — Projeto Hacker

> **Escopo:** Auditoria somente leitura realizada sobre toda a base atual (`index.html`, `style.css`, `script.js`, `js/state.js`, `js/audio.js`, `js/ui.js`, `js/combat.js`, `js/entities.js`, `js/world.js`, `js/network.js`, `SKILLS.md`, `ARQUITETURA.md` e `README.md`), considerando execução 100% no navegador (Vanilla JS ES Modules + Three.js `0.160.0` via CDN) para hospedagem gratuita no GitHub Pages.

---

## 1. Caça aos Bugs e Falhas Técnicas (Análise Real dos Arquivos)

### 1.1 Colisões e Física
1. **Barcos bloqueados por parede invisível sob as pontes (`js/state.js` → `isWaterArea` / `js/entities.js` → `updatePlayer`):**
   - **Causa exata:** Para impedir carros de cair na água, `isWaterArea(x, z)` (`js/state.js:471-482`) passou a retornar `false` nas faixas das pistas das Pontes Golden Gate (`X: 78..402, Z: 26.5..43.5`) e Ponte Sul (`X: 78..402, Z: 312..328`). Porém, o modo barco em `updatePlayer()` (`js/entities.js:1167`) usa `if (isWaterArea(nextX, nextZ))` para permitir navegação — fazendo as lanchas colidirem em uma barreira invisível ao tentar passar **por baixo** das pontes!
   - **Correção recomendada:** Separar `isWaterForBoats(x, z)` (que considera o canal sob as pontes como água navegável) de `isWaterForLand(x, z)` (que libera apenas as pistas das pontes para carros/pedestres).
2. **Rampas da Ponte Sul sem guarda-corpo lateral (`js/world.js` → `buildSouthDistrictAndBridge`, linhas 383–394):**
   - **Causa exata:** Diferente da Golden Gate, a Ponte Sul possui guarda-corpo apenas no tabuleiro plano (`X: 120..360`), deixando as rampas (`X: 80..120` e `X: 360..400`) sem barreiras laterais em `colliders`.
3. **Pés afundando no piso interno de lojas e prédios abertos (`js/state.js` → `getSurfaceHeight`, linhas 405–433):**
   - **Causa exata:** Os pisos internos de `buildStores()` e `buildEnterableBuilding()` ficam elevados em `y = 0.12` (topo `y = 0.19`), mas `getSurfaceHeight(x, z)` retorna sempre `0` fora das pontes/píeres, fazendo os tênis do personagem e móveis baixos afundarem ~19 cm no piso.
4. **Tráfego (`trafficCars`) saindo de faixa ao encontrar o jogador (`js/entities.js` → `updateCars`, linhas 1016–1028):**
   - **Causa exata:** Quando `checkCarCollision(nx, nz, ...)` retorna `true`, o bloco `else` executa imediatamente `car.currentTarget = (car.currentTarget + 1) % car.waypoints.length`. Se o bloqueio for temporário (ex.: carro do jogador na pista), o carro de tráfego pula o waypoint e corta a rota fora da avenida.
5. **Postes de iluminação podem sobrepor bordas de calçadas/entradas (`js/world.js` → `buildInstancedWorldElements`, linhas 558–564):**
   - **Causa exata:** O laço `for (let z = -220; z <= 520; z += 45)` gera postes em `(-32, 50)` e `(32, 50)` sem validar distância mínima para entradas de lojas/garagens/prédios abertos.

### 1.2 IA, Guardas, Polícia e Civis
6. **Policiais de reforço não detectam o jogador em `FREE_ROAM` (`js/entities.js` → `updateGuards`, linhas 1951–1965):**
   - **Causa exata:** A checagem de linha de visão filtra `const isContractGuard = gameState.mission !== MISSION_STATE.FREE_ROAM && g.missionKey === gameState.activeMissionKey;`. Como os policiais spawnados por `spawnPoliceReinforcement()` recebem `missionKey: 'POLICE'` e `g.isPolice = true`, `isContractGuard` é **`false`** tanto em `FREE_ROAM` quanto durante missões! Assim, `guardSeesPlayer` fica sempre `false`, impedindo que os policiais atirem, atualizem `spottedThisFrame` ou mantenham o timer `wantedCooldown` durante a perseguição.
7. **Guardas e policiais atravessam paredes e móveis em combate (`js/entities.js` → `updateGuards`, linha 1995):**
   - **Causa exata:** A movimentação em `GUARD_STATE.COMBAT` executa `g.mesh.position.addScaledVector(toTarget, g.speed * 1.2 * dt)` diretamente, sem testar `checkCollision()` nos eixos `X` e `Z` nem `isWaterArea()`. Resultado: guardas e policiais atravessam muros, caixas e móveis dentro dos prédios abertos.
8. **Braço direito do jogador travado permanentemente em postura de mira (`js/combat.js` → `updateProjectiles`, linha 261):**
   - **Causa exata:** `if (refs.playerParts) refs.playerParts.aimTimer = 0.45;` está sendo executado **a cada frame** dentro de `updateProjectiles()` (chamado em todo tick de `animate()`), impedindo que `aimTimer` decaia para `0`. O braço direito nunca volta à postura relaxada de caminhada.
9. **Câmeras hackeadas em `V + E` não atualizam o texto de prompt contextual (`js/entities.js` → `updateInteractionsAndMission`):**
   - **Causa exata:** Embora `handleInteractPress()` (`js/entities.js:782-795`) permita desativar câmeras com laser vermelho usando `V + E`, `updateInteractionsAndMission()` não exibe um prompt indicando `[E] DESATIVAR CÂMERA (15s)` ao mirar na câmera em NetHack.

### 1.3 Missões, Lojas e Economia
10. **Empilhamento de carros comprados na vaga da SF Motors (`js/world.js` → `spawnPurchasedVehicle`, linhas 2902–2970):**
    - **Causa exata:** Todo carro comprado ou respawnado na SF Motors nasce fixo em `(10, 0, 56)` sem remover nem deslocar um carro anterior já estacionado na vaga, gerando sobreposição de malhas e colisores `Box3`.
11. **Reabertura involuntária do modal de loja (`js/entities.js` → `updateInteractionsAndMission`, linhas 2002–2008):**
    - **Causa exata:** Ao fechar a loja com `ESC`, `shopCooldown` é definido para `3.5s`. Se o jogador ficar parado dentro do anel (`dStore < 2.2`) apreciando a skin recém-equipada, o modal reabre sozinho após 3,5 segundos.
12. **Reset incompleto do mundo dinâmico (`js/world.js` → `resetWorldState`, linhas 2664–2750):**
    - **Causa exata:** `resetWorldState()` não remove viaturas policiais (`policeCars`) nem policiais (`g.isPolice`) spawnados dinamicamente, não limpa `fleeingDrivers`, não reabilita `supplyBoxes` (`sb.used = false`) e não restaura postes derrubados (`lightPoles` com `fallGroup`), acumulando entidades residuais entre missões.
13. **Referências `refs.serverMesh` e `refs.extractionZoneGroup` não sincronizadas ao alternar para contratos VIP (`js/world.js` → `startContract`):**
    - **Causa exata:** Contratos `VIP_CAR_01` e `VIP_CAR_02` não têm entradas em `missionServers`, mantendo `refs.serverMesh` apontando para o servidor da última missão jogada (sem quebrar, mas mantendo a tag/radar antiga ativa).

### 1.4 Performance e Memória (Memory Leaks)
14. **Vazamento contínuo de Geometrias e Materiais WebGL — Zero `.dispose()` no projeto (`js/combat.js`, `js/world.js`):**
    - **Causa exata:** Uma varredura em todo o repositório confirma **0 chamadas a `.dispose()`**. Cada tiro (`fireEquippedWeapon` / `fireGuardBullet`), cada onda EMP (`fireEmpPulse` / `explodeCar`), cada faísca de poste e cada recriação de mapa (`buildMap`) aloca `BufferGeometry`, `BoxGeometry`, `RingGeometry` e `Material` novos sem nunca liberar memória da GPU ao remover da cena. Em sessões longas com Rifle automático ou Escopeta (5 projéteis por disparo), o consumo de VRAM cresce indefinidamente.
15. **Excesso de `THREE.PointLight` simultâneas na cena (~35–40 luzes) (`js/world.js` → `buildCars`, `buildTrafficCars`, `buildStores`, `buildEnterableBuilding`, `spawnPoliceReinforcement`):**
    - **Causa exata:** Cada carro estacionado, carro de tráfego (12), loja (3), prédio aberto (4), viatura policial (até 3) e carro comprado cria seu próprio `THREE.PointLight` ativo na cena. No Three.js, cada `PointLight` entra no loop de cálculo PBR de **todos** os `MeshStandardMaterial` visíveis, causando queda severa de FPS e risco de exceder o limite de *uniforms* WebGL em notebooks sem GPU dedicada.
    - **Correção recomendada:** Usar apenas **1 `PointLight` compartilhado** acoplado dinamicamente ao veículo atualmente dirigido (`gameState.drivingCar`), além de limitar `PointLight` estáticas da cidade a no máximo 6–8 luzes estratégicas (substituindo o restante por materiais `emissive` / `MeshBasicMaterial`).
16. **Clonagem de `Box3` e `Vector3` dentro de loops por frame (`js/combat.js:388`, `js/entities.js:1940-1960`):**
    - **Causa exata:** Alocações de `new THREE.Vector3()` e `.clone()` por guarda/projétil a cada frame pressionam o Garbage Collector (*micro-stutters* a cada alguns segundos).

### 1.5 Sincronização de Documentação
17. **`ARQUITETURA.md` desatualizado em parâmetros de cena (Seção 2.1 e 2.2):**
    - Ainda cita `SphereGeometry(780, 32, 20)`, `FogExp2(..., 0.0020)`, `camera.far = 950`, complexo `X: -16..16, Z: -26..6` e `2 câmeras`, enquanto `js/world.js` usa `SphereGeometry(2000)`, `FogExp2(..., 0.00085)`, `camera.far = 2400`, complexo `X: -28..28, Z: -48..8` e 3 câmeras por missão + 4 câmeras de rua.
18. **Diagrama de estados incompleto em `ARQUITETURA.md` (Seção 3):**
    - O diagrama ASCII omite os estados `FREE_ROAM` e `STEAL_CAR`.
19. **`README.md` omitindo sistemas recentes:**
    - Não lista os 4 prédios abertos com interiores mobiliados e caixas de suprimentos, nem as 3 lojas de Downtown (`DedSec Style`, `HackShop Armory`, `SF Motors`), nem o botão `[MODO: SOLO // CO-OP READY]`.

---

## 2. Lista de 28 Melhorias Concretas (Estilo Watch Dogs 2)

### A. Gameplay & Missões (7 Melhorias)
1. **Hack de Semáforos em Cruzamentos (`V + E`):** Permitir hackear os semáforos de Downtown durante perseguições policiais, trocando todas as luzes para verde simultaneamente e provocando colisões/bloqueio entre o tráfego e as viaturas ctOS.
2. **Drone Quadricóptero DedSec (`Tecla Q`):** Lançar um drone voador em 1ª/3ª pessoa com câmera aérea para marcar guardas através de paredes, hackear caixas elétricas/câmeras remotamente e reconhecer bases antes da invasão.
3. **Blackout Geral da Cidade (`Tecla B` — habilidade comprável na HackShop):** Apaga todas as luzes dos postes, desativa câmeras com laser vermelho por `12s` e reduz drasticamente o campo de visão dos guardas e policiais durante a noite/entardecer.
4. **Contratos de Invasão de Comboio ctOS:** Nova missão dinâmica onde um comboio blindado circula pela Ponte Golden Gate e precisa ser interceptado (via EMP ou hack de tráfego) para roubar um chip de criptografia.
5. **Sistema de Cobertura Tática Automática (`Tecla Space` ou `Ctrl` perto de muros baixos):** Encostar em balcões, caixas e muretas fixa o agente em cobertura com espiada lateral ao mirar.
6. **Missões Secundárias de Hack de Antenas/Torres ctOS:** Subir ou usar o Drone para invadir 3 antenas no topo de prédios, revelando permanentemente todas as caixas de suprimentos e câmeras daquele distrito no radar.
7. **Contratos de Fuga de Alta Velocidade (Checkpoints Neon):** Corridas clandestinas da DedSec atravessando Downtown, Golden Gate e Distrito Sul com cronômetro e prêmio em dinheiro para financiar carros da SF Motors.

### B. Visual, Atmosfera & Interface (7 Melhorias)
8. **GPS / Rota Traçada no Minimapa e no Asfalto:** Linha ciano/magenta tracejada no Radar DedSec e setas holográficas sutis no chão guiando o jogador até a missão ativa, Garagem DedSec ou loja marcada.
9. **Chuva Cyberpunk Leve com Reflexos Neon (`THREE.Points`):** Partículas de garoa fina seguindo a câmera (alternável ou dinâmica) com aumento de brilho especular no asfalto e poças reflexivas sutis.
10. **Feedback de Acerto (Hitmarker) e Indicador Direcional de Dano:** Exibir um "X" rápido na mira ao acertar guardas/veículos (ciano no Taser, vermelho no tiro letal) e arco vermelho indicando de qual direção veio o tiro inimigo.
11. **Animação de Recuo de Arma e Clarão de Disparo (Muzzle Flash):** Recuo rápido no braço direito (e na arma em 1ª pessoa) + pequeno flash luminoso reutilizável na ponta do cano ao atirar.
12. **Placas 3D com Texto Real (`CanvasTexture`) nas Lojas e Prédios Abertos:** Substituir as faixas emissivas lisas acima das portas por letreiros legíveis (`DEDSEC STYLE`, `SF MOTORS`, `HACKSHOP`, `CAFÉ CYBER`, `ESCRITÓRIO ctOS`).
13. **Tela de Mapa Expandido (`Tecla M` ou `Tab`):** Overlay de mapa tático em tela cheia mostrando os 4 distritos, lojas, missões disponíveis e botão de marcar ponto de GPS (*waypoint*).
14. **Ciclo Dinâmico de Entardecer → Noite Cyberpunk:** Transição suave e lenta do gradiente da cúpula do céu e da intensidade das luzes neon conforme o tempo passa no mundo aberto.

### C. Veículos, Combate & Física (7 Melhorias)
15. **Mecânica de Derrapagem / Drift (`Barra de Espaço` dirigindo):** Freio de mão que aumenta a taxa de curva em alta velocidade, deixando marcas temporárias/fumaça nos pneus traseiros.
16. **Rastro Neon de Nitro & Câmera Dinâmica (FOV Boost):** Ao ativar o Nitro (`Shift`) no Interceptor Hyper-X, aumentar suavemente o `camera.fov` (`62 → 74`) e emitir rastro luminoso magenta no escapamento.
17. **Dano Localizado e Fumaça Progressiva nos Veículos:** `HP <= 65%` solta fumaça branca leve; `HP <= 35%` fumaça preta espessa + faíscas no capô; `HP <= 15%` alarme sonoro de emergência no cockpit antes da explosão.
18. **Object Pooling de Projéteis e Partículas (Zero GC / Zero Leaks):** Reutilizar geometrias e materiais compartilhados (`sharedBulletGeo`, `sharedTrailMat`) e dar `.dispose()` adequado ao limpar cenas, estabilizando 60 FPS constantes.
19. **Otimização de Iluminação (Pool de `PointLight`):** Reduzir de ~38 `PointLights` para no máximo 8 luzes ativas (incluindo 1 luz de farol dinâmica apenas no veículo dirigido), ganhando até +40% de FPS em GPUs integradas.
20. **Pathfinding / Desvio de Obstáculos para Guardas e Policiais:** Aplicar `checkCollision()` nos eixos X/Z e vetor de contorno lateral nos guardas/policiais para que contornem muros e entrem pelas portas abertas dos prédios sem atravessar paredes.
21. **Granada de Fumaça / Isca Holográfica (`Tecla G`):** Criar uma cortina de fumaça ou holograma que quebra a linha de visão da polícia e ajuda a iniciar o resfriamento de `15s` do `wantedLevel`.

### D. Áudio, Polimento & Preparação Co-op (7 Melhorias)
22. **Rádio Synthwave Procedural no Carro (`Tecla N`):** Ao dirigir, tocar estações synthwave/cyberpunk geradas via Web Audio API com troca de estação (`DEDSEC FM`, `BAY CHILL`, `OFF`) exibida no HUD.
23. **Salvamento Automático em `localStorage`:** Persistir dinheiro (`money`), skins compradas (`ownedSkins`, `equippedSkin`), armas/melhorias (`hasShotgun`, `hasRapidReload`, `maxHp`) e carros da SF Motors (`ownedVehicles`) entre sessões no GitHub Pages.
24. **Efeitos Sonoros Adicionais no `AudioManager`:** Som de porta abrindo/fechando ao entrar no carro, guincho de pneu no drift, alerta de ligação de testemunha (toque de celular), e som de compra/equipar nas lojas.
25. **Painel de Configurações Rápidas (`ESC` / Pausa):** Ajustar sensibilidade do mouse, volume geral, qualidade de sombras (`Alta / Baixa / Off`) para rodar suave em qualquer PC.
26. **Integração Real de PeerJS (WebRTC P2P) no `NetworkManager`:** Carregar PeerJS via CDN opcionalmente quando o usuário clicar em `CRIAR SALA CO-OP` ou `ENTRAR NA SALA`, conectando 2 navegadores sem servidor backend.
27. **Interpolação Suave (`lerp`) e Animação de Membros em `remotePlayers`:** Em `upsertRemotePlayer()`, interpolar posição/rotação e sincronizar `animState` (`WALK`, `SPRINT`, `CROUCH`, `DRIVING`) e arma visível na mão do parceiro remoto.
28. **Sincronização Cooperativa de Hacks e Missões (`onHackTriggered` / `onMissionSync`):** Replicar abertura de portões, desativação de câmeras laser, nível de procurado e progresso de download entre os 2 jogadores da sala P2P.

---

## 3. Roteiro Sugerido em Lotes de Commits

### Lote 0 — Bugfixes Prioritários & Otimização Crítica (Executar Primeiro)
- Corrigir navegação de barcos sob as pontes (`isWaterForBoats` vs `isWaterForLand`).
- Corrigir visão/detecção de policiais (`g.isPolice`) em `FREE_ROAM` e adicionar `checkCollision()` + desvio lateral na movimentação de guardas e policiais.
- Remover `refs.playerParts.aimTimer = 0.45` indevido dentro de `updateProjectiles()`.
- Corrigir `getSurfaceHeight()` nos pisos das lojas/prédios abertos, guarda-corpo das rampas da Ponte Sul e vaga única da SF Motors (substituindo carro anterior na vaga).
- Exigir sair do anel da loja antes de reabrir o modal (`shopMustExitRing`).
- Corrigir `resetWorldState()` para limpar `policeCars`, policiais dinâmicos, `fleeingDrivers`, restaurar `supplyBoxes` e postes derrubados.
- Eliminar memory leaks (geometrias/materiais compartilhados + `.dispose()`) e reduzir `PointLights` simultâneas para ≤ 8 (farol dinâmico apenas no carro dirigido).
- Sincronizar `ARQUITETURA.md` e `README.md` com todos os parâmetros reais do código.

### Lote 1 — Gameplay Hacker & Contratos Avançados
- Hack de semáforos (`V + E`) com engarrafamento/bloqueio policial.
- Drone Quadricóptero DedSec (`Q`) para reconhecimento e hack remoto.
- Blackout Geral da Cidade (`B`) + contrato de interceptação de comboio ctOS.

### Lote 2 — Visual, GPS, Clima & Letreiros 3D
- GPS com rota traçada no Radar DedSec + mapa expandido (`Tab`).
- Letreiros 3D legíveis (`CanvasTexture`) nas lojas e prédios abertos.
- Hitmarker na mira, indicador direcional de dano, recuo de arma e chuva cyberpunk leve.

### Lote 3 — Física Automotiva, Drift, Nitro & Persistência
- Drift com freio de mão (`Space`), rastro neon de Nitro + FOV dinâmico, dano progressivo nos veículos.
- Salvamento automático completo em `localStorage` (dinheiro, skins, armas, melhorias e carros comprados).

### Lote 4 — Áudio Synthwave, Configurações & Co-op P2P Real
- Rádio Synthwave procedural nos carros (`N`), novos SFX no `AudioManager` e menu de pausa/qualidade.
- Conexão P2P funcional via PeerJS no `NetworkManager` com interpolação de `remotePlayers` e sincronização de hacks/missões cooperativas.
