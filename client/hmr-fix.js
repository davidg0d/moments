// Script para corrigir problemas de WebSocket no HMR
console.log('[Custom HMR] Configurando conexões WebSocket...');

// Guardar uma referência ao WebSocket original
const OriginalWebSocket = window.WebSocket;

// Classe melhorada que proporciona melhor debug e controle das conexões WebSocket
class EnhancedWebSocket extends OriginalWebSocket {
  constructor(url, protocols) {
    console.log("[Custom WebSocket] Criando conexão WebSocket:", url);
    
    let fixedUrl = url;
    
    try {
      // Verificar se a URL é null ou undefined primeiro
      if (!url) {
        const baseUrl = window.location.hostname;
        fixedUrl = `wss://${baseUrl}/ws`;
        console.log("[Custom WebSocket] URL era nula ou indefinida. Usando:", fixedUrl);
      } else if (url.includes('/__vite_hmr')) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        fixedUrl = `${protocol}//${host}${url.substring(url.indexOf('/__vite_hmr'))}`;
        console.log("[Custom WebSocket] URL HMR corrigida para:", fixedUrl);
      } else if (url.includes('undefined')) {
        const baseUrl = window.location.hostname;
        fixedUrl = url.replace('undefined', baseUrl);
        console.log("[Custom WebSocket] URL com 'undefined' corrigida para:", fixedUrl);
      }

      if (fixedUrl && fixedUrl.startsWith('wss://localhost')) {
        fixedUrl = fixedUrl.replace('wss://', 'ws://');
        console.log("[Custom WebSocket] URL com 'wss' corrigida para:", fixedUrl);
      }

      if (fixedUrl && !fixedUrl.startsWith('ws://') && !fixedUrl.startsWith('wss://')) {
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        fixedUrl = protocol + fixedUrl;
        console.log("[Custom WebSocket] Adicionado protocolo apropriado à URL:", fixedUrl);
      }
    } catch (error) {
      console.error("[Custom WebSocket] Erro ao processar URL:", error);
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      fixedUrl = `${protocol}//${host}/ws`;
      console.log("[Custom WebSocket] Usando URL derivada do navegador após erro:", fixedUrl);
    }
    
    super(fixedUrl, protocols);

    this.addEventListener('open', (event) => {
      console.log("[Custom WebSocket] Conexão aberta:", fixedUrl);
    });

    this.addEventListener('error', (event) => {
      console.error("[Custom WebSocket] Erro na conexão:", fixedUrl);
    });

    this.addEventListener('close', (event) => {
      console.log("[Custom WebSocket] Conexão fechada:", fixedUrl, "Código:", event.code);
      if (fixedUrl.includes('/__vite_hmr') && event.code !== 1000 && event.code !== 1001) {
        console.log("[Custom WebSocket] Tentando reconectar HMR em 3 segundos...");
        setTimeout(() => {
          try {
            new EnhancedWebSocket(fixedUrl, protocols);
            console.log("[Custom WebSocket] Tentativa de reconexão iniciada");
          } catch (e) {
            console.error("[Custom WebSocket] Falha na tentativa de reconexão:", e);
          }
        }, 3000);
      }
    });
  }
}

// Substituir a implementação global
window.WebSocket = EnhancedWebSocket;

// Copiar propriedades estáticas de forma segura
Object.defineProperty(window.WebSocket, 'CONNECTING', {
  value: OriginalWebSocket.CONNECTING,
  writable: false,
  configurable: false,
  enumerable: true,
});

Object.defineProperty(window.WebSocket, 'OPEN', {
  value: OriginalWebSocket.OPEN,
  writable: false,
  configurable: false,
  enumerable: true,
});

Object.defineProperty(window.WebSocket, 'CLOSING', {
  value: OriginalWebSocket.CLOSING,
  writable: false,
  configurable: false,
  enumerable: true,
});

Object.defineProperty(window.WebSocket, 'CLOSED', {
  value: OriginalWebSocket.CLOSED,
  writable: false,
  configurable: false,
  enumerable: true,
});