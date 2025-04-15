import { fileURLToPath } from 'url';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import getPort from 'get-port';
import cors from 'cors';
import { registerRoutes } from './routes';
import { setupAuth } from './auth'; // Importar setupAuth
import { log } from './vite';

// Simular __filename e __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Desabilitar o header X-Powered-By para maior segurança
app.disable('x-powered-by');

// Configurar proxy confiável
app.set('trust proxy', 1);

// Middleware para processar JSON e dados enviados via formulário
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de CORS
app.use(cors({
  origin: ["http://localhost:3000", "https://katalogo.shop"], // Substituir pelos domínios do frontend
  credentials: true, // Permitir envio de cookies
}));

// Caminho absoluto para dist/public
const distPath = path.resolve(__dirname, 'public');
const uploadsPath = path.resolve(distPath, 'uploads');

// Função para criar diretório se ele não existir
const ensureDirectoryExists = (directoryPath: string, description: string) => {
  if (!fs.existsSync(directoryPath)) {
    console.warn(`Aviso: O diretório ${description} (${directoryPath}) não existe. Criando-o agora.`);
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

// Garantir que os diretórios existam
ensureDirectoryExists(distPath, 'public');
ensureDirectoryExists(uploadsPath, 'uploads');

// Servir arquivos estáticos com log
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    console.log(`Servindo arquivo estático: ${filePath}`);
  }
}));
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    console.log(`Servindo arquivo de upload: ${filePath}`);
  }
}));

// Middleware para captura de tempo de resposta
app.use((req, res, next) => {
  const start = Date.now();
  const routePath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (routePath.startsWith('/api')) {
      let logLine = `${req.method} ${routePath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      log(logLine);
    }
  });

  next();
});

// Middleware de tratamento de erros
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('Erro no servidor:', err);

  res.status(status).json({ message });
});

// Função principal para iniciar o servidor
(async () => {
  try {
    console.log("Inicializando banco de dados...");
    const { initializeDatabase } = await import('./db-init');
    await initializeDatabase();
    log('Database initialized with default data');

    console.log("Executando migração de limite de produtos...");
    const { addProductLimitColumn } = await import('./migrations/add-product-limit');
    await addProductLimitColumn();
    log('Product limit migration executed');

    console.log("Configurando autenticação...");
    setupAuth(app); // Configurar autenticação antes das rotas

    console.log("Registrando rotas...");
    const server = await registerRoutes(app);
// Adicione este código DEPOIS de todas as suas rotas de API
// e ANTES do bloco que inicia o servidor (onde está o server.listen)

// Esta linha deve vir no final do seu arquivo index.ts, logo antes de iniciar o servidor:
app.get('*', (req, res) => {
  // Se for uma rota de API ou arquivo estático, não fazer nada (deixar o Express lidar com isso)
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return res.status(404).send('Not found');
  }
  
  console.log(`Rota SPA: Servindo index.html para ${req.path}`);
  
  // Use esta linha se seu arquivo estiver em dist/index.html
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  
  // OU use esta linha se seu arquivo estiver em public/index.html
  // res.sendFile(path.join(__dirname, '../public', 'index.html'));
});
    // Escolher uma porta disponível automaticamente
    const port = await getPort({ port: parseInt(process.env.PORT || '3000', 10) });
    server.listen(
      {
        port,
        host: '0.0.0.0',
      },
      () => {
        log(`Server running at http://0.0.0.0:${port}`);
      }
    );
  } catch (err) {
    console.error('Erro ao iniciar o servidor:', err);
  }
})();