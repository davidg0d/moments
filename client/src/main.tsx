import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// reconex�o e monitoramento
const setupReconnection = () => {
  let isOnline = true;

  window.addEventListener('offline', () => {
    isOnline = false;
    console.log('Conex�o perdida, aguardando reconex�o...');
  });

  window.addEventListener('online', () => {
    if (!isOnline) {
      console.log('Conex�o restabelecida, recarregando aplica��o...');
      window.location.reload();
    }
    isOnline = true;
  });

  window.addEventListener('error', (event) => {
    console.log('Erro global capturado:', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.log('Promessa n�o tratada:', event.reason);
  });
};

const setupWebSocketReconnection = () => {
  let wsReconnectTimer: number;

  window.addEventListener('offline', () => {
    console.log('Conex�o WebSocket perdida, tentando reconectar...');
    if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
    wsReconnectTimer = window.setTimeout(() => {
      window.location.reload();
    }, 5000);
  });

  window.addEventListener('online', () => {
    console.log('Conex�o de rede restaurada, reconectando WebSocket...');
    if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
    window.location.reload();
  });
};

setupReconnection();
setupWebSocketReconnection();

// Substitui o WebSocket com uma vers�o customizada
const originalWebSocket = window.WebSocket;

window.WebSocket = class extends originalWebSocket {
  constructor(...args: ConstructorParameters<typeof WebSocket>) {
    super(...args);

    const originalSend = this.send;
    this.send = function (...sendArgs: Parameters<WebSocket["send"]>) {
      console.log('[WebSocket] Mensagem enviada:', sendArgs[0]);
      return originalSend.apply(this, sendArgs);
    };

    this.addEventListener('message', (event) => {
      console.log('[WebSocket] Mensagem recebida:', event.data);
    });
  }
};

// N�o tentamos modificar as propriedades est�ticas diretamente
// Propriedades est�ticas podem ser acessadas diretamente sem modific�-las
// Exemplo de uso: window.WebSocket.CONNECTING, etc.

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster />
  </QueryClientProvider>
);
