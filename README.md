# Projeto Hacker // DedSec ctOS Prototype

Protótipo funcional de um jogo 3D em terceira pessoa de infiltração e hacking inspirado em **Watch Dogs 2**, desenvolvido exclusivamente com **HTML5**, **CSS3**, **JavaScript puro (ES6+)** e **Three.js** via CDN (ES Modules), sem necessidade de bundlers, Node.js ou modelos 3D externos.

---

## 🎯 Objetivos da Missão

1. **Infiltração:** Aproxime-se do painel eletrônico do portão de entrada do complexo ctOS, pressione `E` e complete o minigame de digitação dentro do tempo limite para destravar e abrir o portão.
2. **Furtividade e Coleta de Dados:** Utilize caixas de cobertura (agachando com `Ctrl`), a **Visão NetHack** (`V`), **caixas elétricas de distração** (`E`) e o **hack/sobrecarga de câmeras** (`C` / `R`) para evitar os cones de visão dos guardas e das câmeras. Chegue ao **Servidor Central ctOS**, desative o firewall (`E`) e segure `E` até concluir o download (`100%`).
3. **Extração:** Com os dados em mãos, fuja do complexo (use `Shift` para correr) e pise na **Zona de Extração** (anel verde na rua) para concluir a missão.

---

## 🎮 Controles

| Tecla / Ação | Função |
| :--- | :--- |
| `W` `A` `S` `D` (ou Setas) | Movimentar o personagem |
| `Shift` | Correr mais rápido (aumenta o alcance de detecção dos guardas) |
| `Ctrl` | Agachar (reduz altura para cobertura atrás de caixas e diminui detecção) |
| `Mouse` (Pointer Lock) | Orbitar câmera em 3ª pessoa / Girar câmera de segurança |
| `V` | Alternar **Visão NetHack** (muros wireframe e rede ctOS em neon) |
| `C` | Hackear / alternar entre **Câmeras de Segurança** e voltar ao agente |
| `R` | Sobrecarregar e desativar por `15s` a câmera controlada no momento |
| `E` | Hackear Portão / Firewall, sobrecarregar Caixa Elétrica ou baixar Servidor |
| `ESC` | Cancelar terminal de hack / liberar cursor do mouse |

---

## 🚀 Como Executar

Por utilizar **ES Modules** (`import * as THREE from 'three'`) e a **Pointer Lock API**, o projeto deve ser servido via servidor HTTP local (não abrindo diretamente via `file://`):

1. Abra a pasta `projeto-hacker/` no **VS Code**.
2. Clique com o botão direito em `index.html` e selecione **Open with Live Server** (extensão *Live Server*).
3. O navegador abrirá automaticamente. Clique em **INICIAR MISSÃO** para travar o cursor e começar a jogar.
