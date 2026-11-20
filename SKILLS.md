# SKILLS.md — Diretrizes Técnicas do Projeto Hacker

Este documento define as convenções técnicas obrigatórias para qualquer evolução, refatoração ou nova funcionalidade no **Projeto Hacker**.

---

## 1. Stack e Restrições de Dependências
- **100% Vanilla JS (ES6+)**, **HTML5** e **CSS3**.
- **Three.js `0.160.0`** carregado exclusivamente via CDN usando `<script type="importmap">` em [index.html](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/index.html).
- **Zero bundlers** (sem Vite, Webpack, Parcel, Babel ou Node.js). O projeto deve rodar diretamente no navegador via **Live Server**.
- **Zero assets externos** (proibido importar `.glb`, `.gltf`, `.mp3`, `.wav`, `.png`, `.jpg` ou fontes externas). Toda geometria deve usar primitivas do Three.js (`BoxGeometry`, `PlaneGeometry`, `RingGeometry`, `CircleGeometry`, `OctahedronGeometry`, `CylinderGeometry`, `EdgesGeometry`, `BufferGeometry`).

## 2. Áudio Procedural
- Todo e qualquer efeito sonoro ou trilha ambiente deve ser sintetizado nativamente via **Web Audio API** (`AudioContext`, `OscillatorNode`, `GainNode`, `BiquadFilterNode`).
- Não adicionar arquivos de áudio ao repositório.

## 3. Convenções de Objetos 3D, Colisão e Visão NetHack
Todo novo objeto sólido adicionado ao cenário deve:
1. Registrar sua `THREE.Box3` no array `colliders` (para colisão AABB x círculo com o jogador).
2. Registrar sua `THREE.Mesh` no array `occluders` (para bloquear o `Raycaster` da câmera e da linha de visão dos guardas).
3. Definir obrigatoriamente os dois materiais no `userData` da malha:
   - `mesh.userData.normalMaterial`: material padrão (`MeshStandardMaterial` / `MeshBasicMaterial`).
   - `mesh.userData.nethackMaterial`: material wireframe/holográfico utilizado quando a **Visão NetHack** (`V`) está ativa.
4. Registrar a malha em `structureMeshes` (para estruturas/paredes/caixas) ou `hackableMeshes` (para dispositivos interativos conectados à rede ctOS).

## 4. Documentação Obrigatória
Toda nova funcionalidade implementada em `script.js`, `index.html` ou `style.css` deve atualizar na mesma entrega:
- O diagrama de estados e as seções técnicas correspondentes em [ARQUITETURA.md](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/ARQUITETURA.md).
- Os objetivos, controles e instruções em [README.md](file:///c:/Users/tiago/programação/SENAC/atividade-IA/projeto-hacker/README.md).
