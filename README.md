# Projeto Hacker // DedSec ctOS Prototype

Protótipo funcional de um jogo 3D em terceira pessoa de infiltração e hacking inspirado em **Watch Dogs 2**, desenvolvido exclusivamente com **HTML5**, **CSS3**, **JavaScript puro (ES6+)** e **Three.js** via CDN (ES Modules), sem necessidade de bundlers, Node.js ou modelos 3D externos.

---

## 🎯 Objetivos da Missão

1. **Infiltração:** Aproxime-se do painel eletrônico do portão de entrada do complexo ctOS, pressione `E` e complete o minigame de digitação dentro do tempo limite para destravar e abrir o portão.
2. **Furtividade e Coleta de Dados:** Utilize caixas de cobertura (agachando com `Ctrl`), a **Visão NetHack** (`V`), **caixas elétricas de distração** (`E`) e o **hack/sobrecarga de câmeras** (`C` / `R`) para evitar os guardas e câmeras. Chegue ao **Servidor Central ctOS**, desative o firewall (`E`) e segure `E` até concluir o download (`100%`).
3. **Extração:** Com os dados em mãos, fuja do complexo (use `Shift` para correr) e pise na **Zona de Extração** (anel verde na rua) para concluir a missão e receber sua avaliação (**Rank S - Fantasma** a **Rank C**).
4. **Contratos de Roubo de Veículo VIP (Marcadores Roxo/Magenta):** Roube o **Protótipo Esportivo Blume** em Downtown (`\$1.800`) ou o **SUV Blindado ctOS** (`220 HP`) nas Docas (`\$3.000`), proteja-se dentro da blindagem do veículo (acompanhando a **Integridade do Veículo** no HUD antes que solte fumaça ou exploda) e entregue-o intacto na **Garagem Clandestina DedSec** no Distrito Sul.
5. **Sistema Policial & Testemunhas ctOS:** Evite cometer crimes perto de civis (ou intimide/atordoe a testemunha antes dos `4.5s` da ligação) e desative câmeras com **laser vermelho** (`V + E` ou `C + R`) para evitar o alerta **LOCALIZAÇÃO REVELADA PELO ctOS** e a perseguição das viaturas e esquadrões policiais (escape ficando `15s` fora de vista).

---

## 🗺️ Mundo Aberto 50x (4 Distritos de São Francisco)

Explore livremente o mapa contínuo (`-30000..30000`) com `$500` iniciais e ative as missões nos marcadores holográficos:
- **Distrito Downtown & Financial (Oeste/Norte):** Quarteirões detalhados, 4 **prédios abertos com interiores mobiliados** (Café Cyber, Escritório ctOS, Oficina DedSec e Esconderijo DedSec com caixas de suprimentos `+$100`/`+25 HP`), 3 **lojas interativas** (**DedSec Style**, **SF Motors** e **HackShop Armory**), parques, estacionamento e o **Complexo ctOS (Missão 01)**.
- **Baía de São Francisco & Ponte Golden Gate:** Canal navegável com 4 píeres, 4 lanchas DedSec (`F`, navegando livremente por baixo das pontes) e a Ponte Golden Gate atravessável a pé ou de carro.
- **Distrito Portuário & Industrial (Leste):** **Docas da Baía SF (Missão 02)**, galpões, pátio de contêineres e o cargueiro da Blume.
- **Distrito Residencial & Colinas (Sul):** Ruas largas, garagem clandestina da DedSec e Ponte Sul ligando ao setor portuário.
- **Preparação Multiplayer Co-op:** Botão `[MODO: SOLO // CO-OP READY]` no HUD conectado ao módulo `js/network.js` (`NetworkManager`).

---

## 🎮 Controles

| Tecla / Ação | Função |
| :--- | :--- |
| `W` `A` `S` `D` (ou Setas) | Movimentar o personagem |
| `Shift` | Correr mais rápido a pé ou ativar **Nitro** no **Interceptor Hyper-X** (SF Motors) |
| `Ctrl` | Agachar (reduz altura para cobertura atrás de caixas e diminui detecção) |
| `Mouse` (Pointer Lock) | Orbitar câmera em 3ª pessoa / Olhar em 1ª pessoa / Girar câmera de segurança |
| `P` | Alternar câmera entre **3ª Pessoa** e **1ª Pessoa** (a pé com arma visível ou visão de **Cockpit** no carro) |
| `V` | Alternar **Visão NetHack** (muros wireframe, rede ctOS e **Profiler** de pedestres) |
| `C` | Hackear / alternar entre **Câmeras de Segurança** e voltar ao agente |
| `R` | Sobrecarregar e desativar por `15s` a câmera controlada no momento |
| `E` | Hackear Portão / Firewall, sobrecarregar Caixa Elétrica, acelerar Carro, hackear Pedestre (`+$75`) ou acessar **Lojas / SF Motors** |
| `F` | Roubar/entrar em qualquer carro (ejetando o motorista) ou pilotar / desembarcar da **Lancha DedSec** (`WASD`) |
| `1` a `5` | Selecionar arma: `[1]` Taser, `[2]` 9mm Silenciada, `[3]` Rifle Automático, `[4]` Pulso EMP, `[5]` Escopeta Tática (HackShop) |
| `Clique Esquerdo` | Disparar arma equipada (segurar para rajada automática no Rifle `[3]`) |
| `M` | Ligar / silenciar (Mudo) o áudio procedural e a trilha sonora |
| `ESC` | Cancelar terminal de hack / liberar cursor do mouse |

---

## 🚀 Como Executar

Por utilizar **ES Modules** (`import * as THREE from 'three'`) e a **Pointer Lock API**, o projeto deve ser servido via servidor HTTP local (não abrindo diretamente via `file://`):

1. Abra a pasta `projeto-hacker/` no **VS Code**.
2. Clique com o botão direito em `index.html` e selecione **Open with Live Server** (extensão *Live Server*).
3. O navegador abrirá automaticamente. Clique em **INICIAR MISSÃO** para travar o cursor e começar a jogar.
