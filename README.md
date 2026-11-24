# Projeto Hacker // DedSec ctOS Prototype

Protótipo funcional de um jogo 3D em terceira pessoa de infiltração e hacking inspirado em **Watch Dogs 2**, desenvolvido exclusivamente com **HTML5**, **CSS3**, **JavaScript puro (ES6+)** e **Three.js** via CDN (ES Modules), sem necessidade de bundlers, Node.js ou modelos 3D externos.

---

## 🎯 Objetivos da Missão

1. **Infiltração:** Aproxime-se do painel eletrônico do portão de entrada do complexo ctOS, pressione `E` e complete o minigame de digitação dentro do tempo limite para destravar e abrir o portão.
2. **Furtividade e Coleta de Dados:** Utilize caixas de cobertura (agachando com `Ctrl`), a **Visão NetHack** (`V`), **caixas elétricas de distração** (`E`) e o **hack/sobrecarga de câmeras** (`C` / `R`) para evitar os guardas e câmeras. Chegue ao **Servidor Central ctOS**, desative o firewall (`E`) e segure `E` até concluir o download (`100%`).
3. **Extração:** Com os dados em mãos, fuja do complexo (use `Shift` para correr) e pise na **Zona de Extração** (anel verde na rua) para concluir a missão e receber sua avaliação (**Rank S - Fantasma** a **Rank C**).
4. **Contratos de Roubo de Veículo VIP (Marcadores Roxo/Magenta):** Roube o **Protótipo Esportivo Blume** em Downtown (`\$1.800`) ou o **SUV Blindado ctOS** (`220 HP`) nas Docas (`\$3.000`), proteja-se dentro da blindagem do veículo (acompanhando a **Integridade do Veículo** no HUD antes que solte fumaça ou exploda) e entregue-o intacto na **Garagem Clandestina DedSec** no Distrito Sul.
5. **Contratos de Infiltração em Complexos Protegidos & Roubo de Veículos (Contratos 03, 04 e 05):**
   - **Contrato 03 — Depósito Blindado Blume (Distrito Sul, Recompensa `\$3.500`):** Infiltre-se no pátio murado com 2 câmeras laser, caixa elétrica e 4 guardas, hackeie o portão eletrônico (`E`), roube o **Blume Phantom GT** (`240 HP`) sob perseguição policial (3 estrelas) e atravesse a ponte até a **Doca Clandestina Norte**.
   - **Contrato 04 — Hangar Secreto ctOS (Setor Portuário Leste, Recompensa `\$4.200`):** Invada o hangar fortificado com 2 câmeras laser, caixa elétrica e 5 guardas de elite, destrave o portão (`E`), roube o **Interceptor ctOS Proto-X** (`300 HP` + Nitro em `Shift`) e entregue-o na **Garagem DedSec Oeste** em Downtown.
   - **Contrato 05 — Cofre Automotivo Twin Peaks (Distrito Sul, Recompensa `\$4.500`):** Infiltre-se no cofre murado próximo às colinas de Twin Peaks com 2 câmeras laser, caixa elétrica e 5 guardas, destrave o portão (`E`), roube o supercarro **DedSec Valkyrie V12** (`320 HP` + Nitro em `Shift`) e entregue-o na **Doca Industrial Leste**.
6. **Missões de Resgate de Prisioneiros (`RESCUE_PRISONER`):**
   - **Resgate 01 — Galpão Isolado Norte (Downtown Norte, Recompensa `\$3.200`):** Posto avançado com 4 guardas e 2 câmeras laser prendendo um hacker da DedSec em cela energizada. Hackeie o terminal da cela (`E`) ou destrua o gerador próximo a tiros para libertá-lo e fuja até o Ponto de Extração.
   - **Resgate 02 — Terminal Marítimo Sul-Leste (Extremo Portuário, Recompensa `\$3.800`):** Base costeira com 5 guardas e 2 câmeras laser contendo um informante. Desative a cela (`E` ou destruindo o gerador) e escape da perseguição policial até o anel verde de extração.
7. **Missões Verticais nos Prédios de 5 Andares (Contratos 06 e 07):**
   - **Contrato 06 — Invasão Cobertura Blume (`BLUME / ctOS TOWER` — 5º Andar, Recompensa `\$4.800`):** Marcador holográfico na entrada térrea do arranha-céu. Suba até o 5º andar pelas rampas internas (ou quebrando as janelas de vidro para abrir atalhos), neutralize os guardas do 2º ao 5º andar, hackeie o **Servidor Central da Cobertura (`E`)** e fuja até a zona de extração sob alerta policial **3 estrelas**.
   - **Contrato 07 — Resgate na Suíte Presidencial (`GRAND SF HOTEL` — 4º Andar, Recompensa `\$4.000`):** Invada o hotel de 5 andares, suba até o 4º andar evitando guardas e câmeras internas, hackeie o terminal da suíte (`E`) para libertar o informante da DedSec e escape até o ponto de extração na rua.
   - Ambas aparecem no **Mapa Tático (`Tab`)** e no **Radar DedSec** e salvam sua conclusão em `completedMissions` no **Neon.db** (com fallback em `localStorage`).
8. **IA Urbana, Atropelamento & Sistema Policial ctOS:** Pedestres desviam lateralmente de carros se aproximando (`< 10m`), param nas faixas diante de tráfego cruzando e reagem a tiros/batidas (fugindo ou ligando para o 911). Atropelamentos em alta velocidade (`speed >= 5`) aplicam impacto físico real sem travar o veículo. Evite testemunhas ou desative câmeras laser (`V + E` / `C + R`) para escapar da perseguição (15s fora de vista).

---

## 🗺️ Mundo Aberto 50x (4 Distritos de São Francisco)

Explore livremente o mapa contínuo (`-30000..30000`) com `$500` iniciais e ative as missões nos marcadores holográficos:
- **Distrito Downtown & Financial (Oeste/Norte):** Quarteirões detalhados, 4 **prédios abertos com interiores mobiliados** (Café Cyber, Escritório ctOS, Oficina DedSec e Esconderijo DedSec com caixas de suprimentos `+$100`/`+25 HP`), 3 **lojas interativas** (**DedSec Style**, **SF Motors** e **HackShop Armory**), parques, estacionamento e o **Complexo ctOS (Missão 01)**.
- **Baía de São Francisco & Ponte Golden Gate:** Canal navegável com água hiper-realista (malha 64x64 com ondas 3D nos vértices, reflexos crepusculares ciano/magenta de SF, bump map e espumas animadas), 4 píeres de atracamento, 4 lanchas DedSec (`F`), **Sistema de Natação Livre** (`MODO: NADANDO` com braçadas crawl e mergulho suave) e a Ponte Golden Gate atravessável a pé ou de carro.
- **Distrito Portuário & Industrial (Leste):** **Docas da Baía SF (Missão 02)**, galpões, pátio de contêineres com acesso direto e sem barreiras conectando o píer leste ao pátio principal via rampa suave de 20m, e o cargueiro da Blume.
- **Distrito Residencial & Colinas (Sul):** Ruas largas, garagem clandestina da DedSec, Ponte Sul ligando ao setor portuário, **Mirante Twin Peaks** acessível de carro ou a pé e cadeia de montanhas ao redor da baía.
- **Preparação Multiplayer Co-op:** Botão `[MODO: SOLO // CO-OP READY]` no HUD conectado ao módulo `js/network.js` (`NetworkManager`).

---

## 🎮 Controles

| Tecla / Ação | Função |
| :--- | :--- |
| `W` `A` `S` `D` (ou Setas) | Movimentar o personagem a pé, nadar na água (`MODO: NADANDO`) ou pilotar carros/lanchas |
| `Shift` | Correr mais rápido a pé, nadar mais rápido (crawl) ou ativar **Nitro** no **Interceptor Hyper-X** |
| `Space` | **Pular (a pé)** sobre muretas/obstáculos, subir com o Drone (`Q`) ou ativar **Drift / Freio de Mão** dirigindo carros |
| `Ctrl` | Agachar (reduz altura para cobertura atrás de caixas e diminui detecção) |
| `Mouse` (Pointer Lock) | Orbitar câmera em 3ª pessoa / Olhar em 1ª pessoa / Girar câmera de segurança |
| `P` | Alternar câmera entre **3ª Pessoa** e **1ª Pessoa** (a pé com arma visível ou visão de **Cockpit** no carro) |
| `Tab` | Abrir / fechar o **Mapa Tático Completo** (clique para marcar um destino GPS no Radar DedSec) |
| `V` | Alternar **Visão NetHack** (muros wireframe, rede ctOS, **Tubulações de Vapor** e **Profiler** de pedestres) |
| `C` | Hackear / alternar entre **Câmeras de Segurança** e voltar ao agente |
| `R` | Sobrecarregar e desativar por `15s` a câmera controlada no momento |
| `E` | Hackear Portão / Cela / Firewall, **Tubulação de Vapor (`V+E`)**, Caixa Elétrica, Semáforo, Câmera, Pedestre (`+$75`) ou **Lojas** |
| `Q` | Lançar / recolher o **Drone Quadricóptero DedSec** (`WASD` voar, `Space`/`Ctrl` subir/descer, `P` lente/3ª pessoa, `V+E` hack remoto, alcance `90m`) |
| `B` | Ativar **Blackout Geral da Cidade** (`12s`, apaga postes, desativa câmeras laser e reduz visão inimiga em `50%`) |
| `F` | Roubar/entrar em qualquer carro (ejetando o motorista) ou pilotar / desembarcar da **Lancha DedSec** (`WASD`) |
| `G` | **Chamada Remota de Veículo DedSec** (a pé em terra firme, cooldown `20s`) |
| `N` | Alternar **Rádio Synthwave Procedural** nos veículos e lanchas (`DEDSEC FM` / `BAY NIGHT` / `OFF`) |
| `1` a `5` | Selecionar arma: `[1]` Taser, `[2]` 9mm Silenciada, `[3]` Rifle Automático, `[4]` Pulso EMP, `[5]` Escopeta Tática (HackShop) |
| `Clique Esquerdo` | Disparar arma equipada (segurar para rajada automática no Rifle `[3]`) |
| `H` | Abrir / fechar o **Guia Rápido & Ajustes** (resumo de controles, sombras e sensibilidade) |
| `M` | Ligar / silenciar (Mudo) o áudio procedural e a trilha sonora |
| `ESC` | Cancelar terminal de hack / liberar cursor do mouse |

### 📱 Suporte Touch Completo & Editor de HUD Customizável (Mobile / Tablet)
- **Detecção Automática & Teste no PC:** Ativa automaticamente a interface `#mobile-controls` em telas touch (`ontouchstart` / `maxTouchPoints > 0` ou largura `< 950px`), com alternância manual `[CONTROLES TOUCH: ON/OFF]` dentro do menu `[H] AJUDA`.
- **Multi-Touch Ergonômico:** Analógico virtual flutuante à esquerda (que alterna automaticamente para botões grandes `◀` / `▶` ao dirigir carros/lanchas), metade direita da tela dedicada à rotação livre da câmera sem precisar de Pointer Lock, e botões contextuais para **A Pé** (`ATIRAR`, `PULAR`, `HACK`, `CARRO`, `DRONE`, `NET-HACK`, `CORRER`, `ARMA`), **Veículo** (`ACELERAR`, `FREAR/RÉ`, `TURBO`, `SAIR`) e **Drone** (`SUBIR`, `DESCER`, `HACK`, `RECOLHER`).
- **Editor de HUD Touch ("MEXE OS CONTROLES"):** Acessível pelo ícone `⚙ HUD` no topo da tela ou por `[EDITAR HUD TOUCH]` em `[H] AJUDA`. Pausa o jogo, permite arrastar qualquer botão ou o joystick para qualquer posição da tela, ajustar **Escala (70%–140%)** e **Opacidade (30%–100%)**, restaurar padrão e salvar em `localStorage` (`dedsec_mobile_hud_layout`).

---

## 🚀 Como Executar

Por utilizar **ES Modules** (`import * as THREE from 'three'`) e a **Pointer Lock API**, o projeto deve ser servido via servidor HTTP local (não abrindo diretamente via `file://`):

1. Abra a pasta `projeto-hacker/` no **VS Code**.
2. Clique com o botão direito em `index.html` e selecione **Open with Live Server** (extensão *Live Server*).
3. O navegador abrirá automaticamente. Clique em **INICIAR MISSÃO** para travar o cursor e começar a jogar.
