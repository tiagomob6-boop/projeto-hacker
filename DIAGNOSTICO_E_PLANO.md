# DIAGNOSTICO_E_PLANO.md — Auditoria Técnica & Plano de Correções

> **Escopo inspecionado (somente leitura):** `index.html`, `style.css`, `script.js`, `js/state.js`, `js/world.js`, `js/entities.js`, `js/combat.js`, `js/ui.js`, `js/audio.js` e `js/network.js`.

---

## 1. Lista Real de Bugs Encontrados no Código Atual

### 1.1 Terreno, Água, Pontes e Relevo
1. **Desembarque de lancha ignora píeres secundários e colisões (`js/entities.js` — `toggleDriveDedsecCar`, L1050–1075):**
   - Ao sair da lancha longe dos píeres principais (`Z = 62`), o código força `landZ = clamp(bPos.z, -80, 85)` em `X = 64` ou `X = 406` sem testar `checkCollision(landX, landZ, PLAYER_RADIUS)`. Pode colocar o jogador dentro de prédios/muros costeiros e ignora os píeres Sul Oeste (`Z: 215..225`) e Norte Leste (`Z: -125..-115`).
2. **Carro afundado na água ejeta jogador sem checar colisão e deixa collider fantasma (`js/entities.js` — `updatePlayer`, L1718–1733):**
   - Quando `isWaterArea(cPos.x, cPos.z)` é verdadeiro, o carro é marcado como `destroyed = true` e `cPos.y = -1.0`, mas `car.colliderObj` continua ativo em `colliders` e o jogador é teleportado para `shoreX = 74 | 406` sem validar `checkCollision`. Além disso, `if (car.headlight)` é código morto (o farol real é `refs.activeHeadlight`), deixando a luz acessa no local da queda.
3. **Colisão AABB 2D ignora eixo Y (`js/state.js` — `checkCollision`, L564–577):**
   - `checkCollision` testa apenas `[b.min.x..b.max.x]` e `[b.min.z..b.max.z]`, ignorando `b.min.y` e `b.max.y`. Qualquer estrutura suspensa com collider bloqueia o jogador/carro no nível do chão, e estruturas no chão bloqueiam veículos/pedestres em viadutos ou rampas caso sobrepostas em XZ.

### 1.2 Colisões e Física
4. **Farol do carro permanece aceso após desembarcar (`js/entities.js` — `toggleDriveDedsecCar`, L1082):**
   - Ao sair de um veículo (`F`), a função tenta zerar `car.headlight.intensity = 0` (sempre `null`), mas não zera `refs.activeHeadlight.intensity = 0`. A luz ciano continua flutuando na rua até o jogador entrar em outro carro.
5. **HUD de Cockpit permanece visível ao sair do carro em 1ª pessoa (`js/entities.js` — `toggleDriveDedsecCar`, L1078–1119):**
   - Se o jogador pressionar `F` para sair do carro enquanto está em visão de Cockpit (`gameState.isFirstPerson === true`), `dom.cockpitHud` não recebe `.classList.add('hidden')`.

### 1.3 IA, Guardas, Polícia e Civis
6. **Linha de visão dos guardas usa altura Y fixa `1.65` (`js/entities.js` — `updateGuards`, L2276–2280 e L2340):**
   - Tanto `playerCenter` (`y = isCrouching ? 0.58 : 1.05`) quanto `eyePos` (`y = 1.65`) usam coordenadas Y absolutas em vez de somar `playerPos.y` e `g.mesh.position.y`. Em pisos elevados (lojas/prédios abertos `0.19m`, pontes `7m`/`10m`, Mirante `11.5m`), o `Raycaster` mira para baixo/nível do mar.
7. **Guarda atordoado reseta `position.y = 0` ao acordar (`js/entities.js` — `updateGuards`, L2311):**
   - Quando `g.stunTimer === 0`, `g.mesh.position.y = 0` ignora `getSurfaceHeight(x, z)`, fazendo guardas em áreas elevadas afundarem no piso.
8. **Viaturas policiais spawnam paradas e sem checagem de fallback (`js/world.js` — `spawnPoliceReinforcement`, L3688–3754):**
   - As viaturas `policeCars` possuem `isTraffic: false` e `hasDriver: false`, então ficam imóveis após o spawn enquanto apenas os 2 policiais a pé perseguem. Além disso, se os 5 ângulos a `32m` estiverem bloqueados, o fallback `sx = pPos.x + 28; sz = pPos.z + 18` não verifica `isWaterArea` nem `checkCollision`, podendo spawnar uma viatura dentro da baía ou de um prédio.

### 1.4 Missões, Lojas, HUD e Reset
9. **Enum errado em `toggleQuickGuide` (`js/ui.js` — L838):**
   - A condição usa `gameState.mission !== MISSION_STATE.GAME_OVER`, mas a chave real em `MISSION_STATE` é `GAMEOVER` (sem underscore), e também não exclui `MISSION_STATE.VICTORY`. Fechar o guia na tela de Game Over ou Vitória tenta chamar `requestPointerLock()`.
10. **Cliques e disparos no canvas sem checar novos modais (`script.js` — L206 e L216):**
    - Os listeners `click` e `mousedown` em `dom.canvas` bloqueiam apenas `terminalOpen` e `missionModalOpen`, mas não verificam `shopOpen`, `tacticalMapOpen` e `quickGuideOpen`.
11. **Drone pode acionar lojas, caixas de suprimento e firewall à distância (`js/entities.js` — `handleInteractPress`, L901–949):**
    - Como `pPos` assume `refs.droneGroup.position` quando `gameState.droneActive === true`, voar com o drone perto de uma loja, caixa de suprimentos ou servidor permite abrir a loja ou coletar itens/iniciar terminal sem o agente estar no local.
12. **Estados e overlays residuais em Game Over / Vitória (`js/ui.js` — `triggerGameOver`, L880–898 e `triggerVictory`, L909–940):**
    - `triggerGameOver` e `triggerVictory` não encerram `gameState.droneActive` nem ocultam `dom.droneHud`, `dom.cameraOverlay`, `dom.cockpitHud` ou `dom.ctosRevealBanner`, podendo deixar overlays de drone/câmera/cockpit presos até o próximo reset.

### 1.5 Performance e Erros de Runtime
13. **Vazamento de memória GPU ao reconstruir o mapa (`js/world.js` — `buildMap`, L295–297):**
    - `while (refs.worldGroup.children.length > 0) refs.worldGroup.remove(...)` remove os nós da cena sem percorrer e chamar `.geometry.dispose()` e `.material.dispose()`, acumulando buffers WebGL em memória a cada reinício/troca de missão.

---

## 2. Backlog de Melhorias de Alto Impacto (16 Melhorias)

1. **Perseguição veicular ativa das viaturas policiais (`policeCars`):** Fazer as viaturas circularem até o jogador usando `checkCarCollision`, ligando sirenes e desembarcando reforços ao se aproximar.
2. **Descarte completo de recursos WebGL (`disposeWorldGroup`):** Função utilitária para liberar geometrias, materiais e texturas antigas no `buildMap()`.
3. **Colisão 3D real com intervalo Y em `checkCollision`:** Considerar `b.min.y` e `b.max.y` para suportar viadutos, passarelas e rampas sem bloqueios fantasmas.
4. **Minimapa / Radar com ícones distintos para Mirante, Lanchas e Viaturas:** Facilitar a navegação visual entre os 4 distritos e a baía.
5. **Indicador de cooldown e barra de duração do Blackout (`B`) no HUD:** Feedback visual claro dos `12s` ativos e `35s` de recarga.
6. **Feedback visual de dano e bateria/alcance no Drone (`Q`):** Aviso pulsante quando o sinal passa de `80m` e efeito de estática leve na borda da tela.
7. **Estabilização e suspensão visual nos carros ao subir rampas (Pontes e Mirante):** Inclinação suave (`pitch`) do chassi alinhada à inclinação da rampa.
8. **Rastro de poeira/faísca e som de derrapagem em Drift (`Space`):** Efeito visual curto nos pneus traseiros ao usar freio de mão em alta velocidade.
9. **Marcador de distância 3D/HUD até o destino GPS personalizado (`Tab`):** Mostrar distância em metros (`GPS: 245m`) ao definir um ponto no mapa tático.
10. **Física de retorno automático para barcos encalhados:** Se a lancha tocar a margem, aplicar leve empuxo de volta para a água em vez de travar.
11. **Refinamento de spawn seguro para pedestres e policiais:** Garantir verificação de `colliders` e `isWaterArea` antes de posicionar qualquer NPC.
12. **Botão de "Desvirar / Resetar Veículo" (`R` no carro) ou resgate de emergência:** Evitar qualquer chance de o jogador ficar preso entre meio-fios ou pilares.
13. **Iluminação atmosférica dinâmica no Mirante Twin Peaks:** Farol/totem holográfico no topo visível de Downtown para servir de referência visual no horizonte Sul.
14. **Melhoria de contraste nos ícones e legendas do Mapa Tático (`Tab`):** Legenda compacta lateral explicando cores dos distritos, lojas, contratos e mirante.
15. **Persistência das preferências de Sombras e Sensibilidade em `localStorage`:** Salvar as escolhas feitas no painel `[H] AJUDA` junto ao progresso.
16. **Otimização de `updateNetHackLabels` (culling por frustum/distância):** Evitar projeção `Vector3.project()` em entidades muito distantes para manter 60 FPS constantes em hardware modesto.

---

## 3. Plano de Execução em Lotes Pequenos

### Lote 1 — Correção Geral de Bugs (Estabilidade & Consistência)
- Corrigir `checkCollision` (suporte a altura Y), `toggleDriveDedsecCar` (zerar `refs.activeHeadlight`, esconder `dom.cockpitHud`, desembarque seguro de barco em todos os píeres), e remoção de `colliderObj` de carros afundados.
- Corrigir `updateGuards` (`playerCenter.y` e `eyePos.y` relativos à superfície, `g.mesh.position.y` ao acordar) e `spawnPoliceReinforcement` (spawn seguro validado).
- Corrigir `handleInteractPress` (bloquear lojas/suprimentos/firewall no modo Drone), `toggleQuickGuide` (`MISSION_STATE.GAMEOVER` e `VICTORY`), guardas de modais em `script.js` (`shopOpen`, `tacticalMapOpen`, `quickGuideOpen`), limpeza de overlays em `triggerGameOver` / `triggerVictory`, e `dispose` de geometrias/materiais em `buildMap()`.

### Lote 2 — Melhorias de IA, Física e Navegação
- Implementar IA de perseguição ativa para `policeCars`.
- Adicionar inclinação (`pitch`) dos carros nas rampas das pontes e do Mirante + partículas leves de drift.
- Adicionar distância em metros para o GPS personalizado (`Tab`) no HUD, legenda no Mapa Tático e ícones de lanchas/mirante no Radar.
- Melhorar retorno suave de lanchas na margem e culling de distância em `updateNetHackLabels`.

### Lote 3 — Acabamento Visual, UX e Persistência
- Adicionar barra/contador de duração e cooldown do Blackout (`B`) e alerta de sinal fraco (`>80m`) no Drone (`Q`).
- Adicionar totem/farol holográfico visível no topo do Mirante Twin Peaks.
- Persistir preferências de **Sombras** e **Sensibilidade do Mouse** (`[H] AJUDA`) em `localStorage`.
