import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import themePlugin from '@replit/vite-plugin-shadcn-theme-json';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    host: '0.0.0.0', // Permite acesso externo ao servidor
    port: 3000,      // Configuração explícita da porta para evitar conflitos
    hmr: {
      host: '0.0.0.0',
      clientPort: 443, // Configurado para HTTPS/WSS
      protocol: 'wss', // WebSocket seguro para hot module replacement
    },
  },
  plugins: [
    react(), // Suporte para React
    themePlugin(), // Plugin para temas
    runtimeErrorOverlay(), // Overlay de erros em tempo de execução
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'), // Alias para o diretório src
      '@shared': path.resolve(__dirname, 'shared'), // Alias para recursos compartilhados
      '@assets': path.resolve(__dirname, 'attached_assets'), // Alias para assets adicionais
    },
  },
  root: path.resolve(__dirname, 'client'), // Define o diretório raiz como client
  build: {
    outDir: path.resolve(__dirname, 'dist/public'), // Diretório de saída
    emptyOutDir: true, // Limpa o diretório de saída antes do build
    sourcemap: true, // Habilita sourcemaps para depuração no navegador
    rollupOptions: {
      external: ['react-toastify'], // Exclui pacotes específicos do bundle final
      output: {
        format: 'es', // Mantém o formato ES Modules para compatibilidade moderna
      },
    },
  },
});