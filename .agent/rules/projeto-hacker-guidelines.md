# Regras do Agente — Projeto Hacker

Ao trabalhar no projeto `projeto-hacker/`, siga obrigatoriamente todas as diretrizes abaixo:

1. **Stack Pura e Sem Bundlers:**
   - Utilize apenas **HTML5**, **CSS3**, **Vanilla JS (ES6+)** e **Three.js `0.160.0`** via CDN (`importmap`).
   - Nunca introduza Node.js, `package.json`, bundlers ou assets externos (`.glb`, `.gltf`, `.mp3`, `.wav`, `.png`, `.jpg`).
   - Todo áudio deve ser sintetizado nativamente via **Web Audio API**.

2. **Padrão de Objetos Sólidos na Cena 3D:**
   - Todo novo objeto sólido deve registrar colisão AABB em `colliders` e oclusão de visão em `occluders`.
   - Todo novo objeto visível no cenário deve definir `userData.normalMaterial` e `userData.nethackMaterial`, além de ser registrado em `structureMeshes` ou `hackableMeshes` para compatibilidade total com a **Visão NetHack**.

3. **Atualização Contínua de Documentação:**
   - Toda nova feature deve atualizar o diagrama e as seções técnicas em `ARQUITETURA.md`, além dos controles e objetivos em `README.md`.
