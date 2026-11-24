// Configuração de Plataforma / Modo de Dispositivo:
// 'AUTO'   => Detecta automaticamente pelo tipo de dispositivo e toque
// 'PC'     => Força versão Computador (Teclado + Mouse, pointer lock ativo)
// 'MOBILE' => Força versão Celular (Controles virtuais Touch, joystick e botões na tela)
export const PLATFORM_MODE = 'AUTO'; // 'AUTO' | 'PC' | 'MOBILE'

// Modelo público de configuração do banco de dados Neon.db
// Copie para js/config.js (ignorado pelo git) e cole sua connection string postgresql://...
// Se permanecer vazio, o jogo usa localStorage automaticamente como fallback.
export const NEON_DATABASE_URL = '';
