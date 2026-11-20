# Plano de Implementação — Mundo Aberto Unificado (São Francisco)

Este documento divide a transformação do **Projeto Hacker** em um mundo aberto contínuo de São Francisco em **4 etapas** incrementais, mantendo **100% Vanilla JS + Three.js `0.160.0` via CDN**, sem bundlers e sem assets externos.

---

## ETAPA 1 — Mega-Mapa Unificado + Ponte Golden Gate Atravessável + Missões 1 e 2 no Mesmo Mundo
- **Mundo Aberto Gigante (`X: -1200..1200`, `Z: -1400..1400`):** Unificação do Centro Urbano (Setor Oeste/Norte) e das Docas da Baía SF (Setor Leste) em um único `worldGroup` contínuo, com água da baía e horizonte estendido (`camera.far = 950`).
- **Ponte Golden Gate Atravessável:** Ligação física sobre a baía (`X: 75..375, Z: 35`) com rampas de subida/descida, tabuleiro elevado (`y = 10`), guard-rails com colisão, duas torres monumentais e cabos em laranja-neon. Função `getSurfaceHeight(x, z)` ajusta `player.y` e `car.y` continuamente.
- **Modo Livre (`FREE_ROAM`) e Gatilhos de Missão:** Jogador nasce livre na praça central com `$500` iniciais no HUD. Dois marcadores holográficos (Entrada do Complexo ctOS e Entrada das Docas da Baía) abrem um modal rápido para escolher a dificuldade (`INICIANTE` ou `DEDSEC ELITE`) e iniciar a missão em tempo real, concedendo recompensa de `$1.000` a `$2.500` conforme o Rank ao concluir.

---

## ETAPA 2 — Correção do Dano nos Carros, Vida do Veículo e Explosão
- **Blindagem e Vida Própria (`car.hp = 100`):** Projéteis dos guardas colidem com a `Box3` do veículo dirigido (`gameState.drivingCar`), descontando `car.hp` e protegendo o jogador de dano direto enquanto estiver dentro do carro.
- **HUD de Integridade:** Barra de **INTEGRIDADE DO VEÍCULO** exibida no HUD durante a condução.
- **Fumaça, Ejeção e Explosão:** Quando `car.hp <= 35`, o carro emite fumaça escura (`THREE.Points`). Quando `car.hp <= 0`, ejeta o jogador para o lado, gera onda de fogo laranja + partículas + som grave no `AudioManager`, transforma o chassi em sucata queimada (`0x1a1a1a`, inutilizável) e causa dano aos guardas próximos.

---

## ETAPA 3 — Prédios Abertos e 3 Lojas Interativas (Armas, Roupas e Concessionária)
- **3 Estabelecimentos Acessíveis no Centro Urbano:** Portas abertas, interior iluminado, letreiros neon e ícones no Radar DedSec:
  1. **HackShop / Armory (Armas):** Compra/desbloqueio, recarga e melhorias para Taser, Pistola Silenciada, Rifle de Assalto, **Escopeta Tática** (nova arma) e Pulso EMP, além de **Colete Balístico** (`+50 HP` extra).
  2. **DedSec Style (Roupas / Skins):** Compra e equipamento de visuais 3D para o agente (Hacker Clássico Ciano, Cyber Samurai Vermelho, Fantasma Branco/Dourado, Infiltrador Furtivo Verde).
  3. **SF Motors (Concessionária):** Compra e spawn imediato na rua de veículos com atributos próprios (Hatch Urbano, Esportivo DedSec, SUV Blindado ctOS com `250 HP` e Interceptor Neon).

---

## ETAPA 4 — Polimento do Radar Aberto, Tráfego e Sincronização de Documentação
- **Radar DedSec Global:** Exibição de ícones distintos para as 3 lojas (Armas, Roupas, Carros), marcadores das Missões 1 e 2 e traçado completo da Ponte Golden Gate.
- **Sincronização Final:** Revisão completa de `ARQUITETURA.md`, `README.md` e `SKILLS.md`.
