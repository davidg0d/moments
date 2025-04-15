import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertStoreSchema, insertCategorySchema, themeSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth } from "./auth";
import express from "express";
import { hashPassword } from './auth'; // Importando a função hashPassword do auth.ts
import { WebSocketServer, WebSocket } from 'ws';

const router = express.Router();

// Rota de registro onde hashPassword é usado
router.post('/api/register', async (req, res) => {
    const { username, password, email, name, role = "customer" } = req.body;

    try {
        // Aqui você pode usar a função hashPassword
        const hashedPassword = await hashPassword(password);

        // Continue com o registro do usuário usando hashedPassword...
        res.status(201).json({ message: "Usuário registrado com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao registrar usuário" });
    }
});

export default router;

// Setup for file uploads
const uploadsDir = path.join(process.cwd(), "dist/public/uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage2 = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage2,
  limits: { fileSize: 800 * 1024 }, // 800KB limit
  fileFilter: (_req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de imagem são permitidos"));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Recuperar middlewares de autenticação criados em auth.ts
  const { 
    isAuthenticated, 
    isAdmin, 
    isShopOwner, 
    isCustomer, 
    hasActiveSubscription 
  } = app.locals.authMiddleware;
  // ==== API de Loja (Store) ==== //

  // Listar todas as lojas ativas (para clientes)
  app.get('/api/stores', async (_req: Request, res: Response) => {
    try {
      const stores = await storage.getStores();
      const activeStores = stores.filter(store => store.active);
      return res.json(activeStores);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      return res.status(500).json({ 
  message: "Falha ao obter a lista de lojas",
  details: "Ocorreu um erro ao consultar o banco de dados"
});
    }
  });

  // Obter detalhes de uma loja pelo ID
  app.get('/api/stores/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      const store = await storage.getStore(id);
      if (!store || !store.active) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }

      return res.json(store);
    } catch (error) {
      console.error("Erro ao buscar loja:", error);
      return res.status(500).json({ message: "Falha ao obter informações da loja" });
    }
  });

  // Rota para buscar loja por slug
  app.get('/api/stores/slug/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const store = await storage.getStoreBySlug(slug);
      if (!store || !store.active) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }

      return res.json(store);
    } catch (error) {
      console.error("Erro ao buscar loja pelo slug:", error);
      return res.status(500).json({ message: "Falha ao obter informações da loja" });
    }
  });

  // Obter loja do lojista logado
  app.get('/api/store', isShopOwner, async (req: Request, res: Response) => {
    try {
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);

      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja não encontrada para este usuário" });
      }

      const store = await storage.getStore(shopOwner.storeId);
      if (!store) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }

      return res.json(store);
    } catch (error) {
      console.error("Erro ao buscar loja:", error);
      return res.status(500).json({ message: "Falha ao obter informações da loja" });
    }
  });

  // Obter dados do perfil do lojista logado
  app.get('/api/shop-owner', isShopOwner, async (req: Request, res: Response) => {
    try {
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);

      if (!shopOwner) {
        return res.status(404).json({ message: "Perfil de lojista não encontrado" });
      }

      return res.json(shopOwner);
    } catch (error) {
      console.error("Erro ao buscar perfil do lojista:", error);
      return res.status(500).json({ message: "Falha ao obter informações do perfil" });
    }
  });

  // Atualizar informações da loja (lojista logado)
  app.patch('/api/store', isShopOwner, hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      // Log dos dados recebidos
      console.log("Dados recebidos para atualização da loja:", req.body);

      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);

      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja não encontrada para este usuário" });
      }

      // Obter informações da loja antes da atualização
      const existingStore = await storage.getStore(shopOwner.storeId);
      console.log("Loja existente antes da atualização:", existingStore);

      // Validar e formatar dados
      const validatedData = insertStoreSchema.partial().extend({
        theme: themeSchema.optional()
      }).parse(req.body);
      console.log("Dados validados para atualização:", validatedData);

      // Atualizar a loja
      const updateData = {
        ...validatedData,
        theme: validatedData.theme
      };
      
      // Log detalhado para debug
      console.log("Updating store:", shopOwner.storeId, "with data:", updateData);
      
      // Verifica se o campo description está sendo enviado
      if (req.body.description !== undefined) {
        console.log("Description field received:", req.body.description);
        updateData.description = req.body.description;
      }
      
      const updatedStore = await storage.updateStore(shopOwner.storeId, updateData);

      if (!updatedStore) {
        return res.status(404).json({ message: "Falha ao atualizar loja - não encontrada" });
      }

      console.log("Loja atualizada com sucesso:", updatedStore);
      return res.json(updatedStore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Erro de validação:", fromZodError(error).message);
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao atualizar loja:", error);
      return res.status(500).json({ message: "Falha ao atualizar informações da loja" });
    }
  });

  // Upload do banner da loja
  app.post('/api/store/banner', isShopOwner, hasActiveSubscription, (req, res, next) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    upload.single('banner')(req, res, next);
  }, async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja não encontrada para este usuário" });
      }

      const bannerUrl = `/uploads/${req.file.filename}`;
      const updatedStore = await storage.updateStore(shopOwner.storeId, { bannerUrl });

      return res.json({ bannerUrl, store: updatedStore });
    } catch (error) {
      console.error("Erro ao enviar banner:", error);
      return res.status(500).json({ message: "Falha ao enviar banner" });
    }
  });

  // Upload do logo da empresa
  app.post('/api/store/company-logo', isShopOwner, hasActiveSubscription, upload.single('companyLogo'), async (req: Request, res: Response) => {
    console.log("Recebendo requisição para upload de logo da empresa");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("Diretório de uploads criado:", uploadsDir);
    }
    try {
      console.log("Processando upload de logo da empresa:", req.file);
      
      if (!req.file) {
        console.log("Nenhum arquivo foi enviado na requisição");
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      // Verificar se o arquivo é PNG
      if (!req.file.mimetype.includes('png')) {
        console.log("Arquivo não é PNG:", req.file.mimetype);
        // Remove o arquivo se não for PNG
        fs.unlinkSync(path.join(uploadsDir, req.file.filename));
        return res.status(400).json({ message: "Apenas arquivos PNG são permitidos" });
      }

      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja não encontrada para este usuário" });
      }

      const companyLogoUrl = `/uploads/${req.file.filename}`;
      console.log("URL do logo da empresa:", companyLogoUrl);
      
      const updatedStore = await storage.updateStore(shopOwner.storeId, { companyLogoUrl });
      console.log("Loja atualizada com sucesso:", updatedStore);

      return res.json({ companyLogoUrl, store: updatedStore });
    } catch (error) {
      console.error("Erro ao enviar logo da empresa:", error);
      return res.status(500).json({ message: "Falha ao enviar logo da empresa" });
    }
  });
  
  // Upload do logo da loja (lojista logado)
  app.post('/api/store/logo', isShopOwner, hasActiveSubscription, upload.single('logo'), async (req: Request, res: Response) => {
    // Garantir que o diretório existe antes do upload
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    try {
      console.log("Received file upload request:", req.file);

      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);

      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja não encontrada para este usuário" });
      }

      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), "dist/public/uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const logoUrl = `/uploads/${req.file.filename}`;
      console.log("Logo URL:", logoUrl);

      const updatedStore = await storage.updateStore(shopOwner.storeId, { logoUrl });
      console.log("Updated store:", updatedStore);

      return res.json({ logoUrl, store: updatedStore });
    } catch (error) {
      console.error("Erro ao enviar logo:", error);
      return res.status(500).json({ message: "Falha ao enviar logo" });
    }
  });

  // ==== API de Categorias ==== //

  // Listar categorias de uma loja
  app.get('/api/stores/:storeId/categories', async (req: Request, res: Response) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      const store = await storage.getStore(storeId);
      if (!store || !store.active) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }

      const categories = await storage.getCategories(storeId);
      return res.json(categories);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return res.status(500).json({ message: "Falha ao obter categorias" });
    }
  });

  // Obter categoria por ID
  app.get('/api/categories/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      return res.json(category);
    } catch (error) {
      console.error("Erro ao buscar categoria:", error);
      return res.status(500).json({ message: "Falha ao obter categoria" });
    }
  });

  // Criar categoria (lojista logado)
  app.post('/api/categories', isShopOwner, hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const shopOwner = await storage.getShopOwnerByUserId(req.user!.id);

      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja não encontrada para este usuário" });
      }

      // Garantir que a categoria pertença à loja do usuário
      const validatedData = insertCategorySchema.parse({
        ...req.body,
        storeId: shopOwner.storeId
      });

      const category = await storage.createCategory(validatedData);
      return res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao criar categoria:", error);
      return res.status(500).json({ message: "Falha ao criar categoria" });
    }
  });

  // Atualizar categoria (lojista logado)
  app.patch('/api/categories/:id', isShopOwner, hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      // Verificar se a categoria pertence à loja do usuário
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      const shopOwner = await storage.getShopOwnerByUserId(req.user!.id);
      if (!shopOwner || shopOwner.storeId !== category.storeId) {
        return res.status(403).json({ message: "Você não tem permissão para editar esta categoria" });
      }

      const validatedData = insertCategorySchema.partial().parse(req.body);
      // Impedir mudança de loja
      delete validatedData.storeId;

      const updatedCategory = await storage.updateCategory(id, validatedData);
      return res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao atualizar categoria:", error);
      return res.status(500).json({ message: "Falha ao atualizar categoria" });
    }
  });

  // Excluir categoria (lojista logado)
  app.delete('/api/categories/:id', isShopOwner, hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      // Verificar se a categoria pertence à loja do usuário
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      const shopOwner = await storage.getShopOwnerByUserId(req.user!.id);
      if (!shopOwner || shopOwner.storeId !== category.storeId) {
        return res.status(403).json({ message: "Você não tem permissão para excluir esta categoria" });
      }

      // Verificar se existem produtos associados à categoria
      const products = await storage.getProducts(category.storeId);
      const hasProducts = products.some(product => product.categoryId === id);

      if (hasProducts) {
        return res.status(400).json({ 
          message: "Não é possível excluir a categoria", 
          details: "Existem produtos associados a esta categoria" 
        });
      }

      const result = await storage.deleteCategory(id);
      return res.json({ success: result });
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      return res.status(500).json({ message: "Falha ao excluir categoria" });
    }
  });

  // ==== API de Produtos ==== //

  // Listar produtos de uma loja específica
  app.get('/api/stores/:storeId/products', async (req: Request, res: Response) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      const store = await storage.getStore(storeId);
      if (!store || !store.active) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }

      const products = await storage.getProducts(storeId);
      // Filtrar apenas produtos ativos para exibição pública
      const activeProducts = products.filter(product => product.active);

      return res.json(activeProducts);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      return res.status(500).json({ message: "Falha ao obter produtos" });
    }
  });

  // Listar produtos da loja do lojista (inclui inativos)
  app.get('/api/products', isShopOwner, async (req: Request, res: Response) => {
    try {
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);

      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja não encontrada para este usuário" });
      }

      const products = await storage.getProducts(shopOwner.storeId);
      return res.json(products);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      return res.status(500).json({ message: "Falha ao obter produtos" });
    }
  });

  // Obter detalhes de um produto
  app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      // Verificar se o produto está ativo ou se o usuário é o dono
      const isOwner = req.isAuthenticated() && 
        req.user.role === "shopowner" &&
        await storage.getShopOwnerByUserId(req.user.id)
          .then(owner => owner?.storeId === product.storeId);

      if (!product.active && !isOwner) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      return res.json(product);
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return res.status(500).json({ message: "Falha ao obter produto" });
    }
  });

  // Criar produto (lojista logado)
  app.post('/api/products', isShopOwner, hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);

      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja não encontrada para este usuário" });
      }

      // Verificar se já atingiu o limite de produtos
      const products = await storage.getProducts(shopOwner.storeId);
      if (products.length >= (shopOwner.productLimit || 30)) {
        return res.status(403).json({ 
          message: "Limite de produtos atingido", 
          details: `Sua loja já possui o máximo de ${shopOwner.productLimit || 30} produtos permitidos pelo seu plano` 
        });
      }

      // Garantir que o produto pertença à loja do usuário
      const validatedData = insertProductSchema.parse({
        ...req.body,
        storeId: shopOwner.storeId,
        categoryId: req.body.categoryId || null
      });

      const product = await storage.createProduct(validatedData);
      return res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao criar produto:", error);
      return res.status(500).json({ message: "Falha ao criar produto" });
    }
  });

  // Upload de imagem do produto
  app.post('/api/products/image', isShopOwner, hasActiveSubscription, upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      return res.json({ imageUrl });
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      return res.status(500).json({ message: "Falha ao enviar imagem" });
    }
  });

  // Atualizar produto (lojista logado)
  app.patch('/api/products/:id', isShopOwner, hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      // Verificar se o produto pertence à loja do usuário
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || shopOwner.storeId !== product.storeId) {
        return res.status(403).json({ message: "Você não tem permissão para editar este produto" });
      }

      const validatedData = insertProductSchema.partial().parse(req.body);
      // Impedir mudança de loja
      delete validatedData.storeId;

      const updatedProduct = await storage.updateProduct(id, validatedData);
      return res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao atualizar produto:", error);
      return res.status(500).json({ message: "Falha ao atualizar produto" });
    }
  });

  // Excluir produto (lojista logado)
  app.delete('/api/products/:id', isShopOwner, hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      // Verificar se o produto pertence à loja do usuário
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || shopOwner.storeId !== product.storeId) {
        return res.status(403).json({ message: "Você não tem permissão para excluir este produto" });
      }

      const result = await storage.deleteProduct(id);
      return res.json({ success: result });
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      return res.status(500).json({ message: "Falha ao excluir produto" });
    }
  });

  // ==== API de Carrinho ==== //

  // Obter carrinho do usuário para uma loja específica
  app.get('/api/cart/:storeId', isCustomer, async (req: Request, res: Response) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      // Obter o perfil de cliente
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) {
        return res.status(404).json({ message: "Perfil de cliente não encontrado" });
      }

      // Buscar ou criar carrinho
      let cart = await storage.getCartByCustomer(customer.id, storeId);

      if (!cart) {
        cart = await storage.createCart({
          customerId: customer.id,
          storeId
        });
      }

      // Obter itens do carrinho
      const cartItems = await storage.getCartItems(cart.id);

      // Para cada item, obter informações do produto
      const itemsWithProductInfo = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            product
          };
        })
      );

      // Calcular total
      const total = itemsWithProductInfo.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      return res.json({
        cart,
        items: itemsWithProductInfo,
        total
      });
    } catch (error) {
      console.error("Erro ao buscar carrinho:", error);
      return res.status(500).json({ message: "Falha ao obter carrinho" });
    }
  });

  // Adicionar item ao carrinho
  app.post('/api/cart/:storeId/items', isCustomer, async (req: Request, res: Response) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      const { productId, quantity = 1 } = req.body;

      if (!productId) {
        return res.status(400).json({ message: "ID do produto é obrigatório" });
      }

      // Verificar se o produto existe e está ativo
      const product = await storage.getProduct(productId);
      if (!product || !product.active || product.storeId !== storeId) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      // Obter o perfil de cliente
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) {
        return res.status(404).json({ message: "Perfil de cliente não encontrado" });
      }

      // Buscar ou criar carrinho
      let cart = await storage.getCartByCustomer(customer.id, storeId);

      if (!cart) {
        cart = await storage.createCart({
          customerId: customer.id,
          storeId
        });
      }

      // Verificar se o item já existe no carrinho
      const cartItems = await storage.getCartItems(cart.id);
      const existingItem = cartItems.find(item => item.productId === productId);

      if (existingItem) {
        // Atualizar quantidade
        await storage.updateCartItem(existingItem.id, existingItem.quantity + quantity);
      } else {
        // Adicionar novo item
        await storage.createCartItem({
          cartId: cart.id,
          productId,
          quantity,
          price: product.price
        });
      }

      return res.status(201).json({ message: "Item adicionado ao carrinho" });
    } catch (error) {
      console.error("Erro ao adicionar item ao carrinho:", error);
      return res.status(500).json({ message: "Falha ao adicionar item ao carrinho" });
    }
  });

  // Atualizar quantidade de um item no carrinho
  app.patch('/api/cart/items/:itemId', isCustomer, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      const { quantity } = req.body;

      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Quantidade deve ser um número maior que zero" });
      }

      // Verificar se o item existe
      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      // Verificar se o carrinho pertence ao cliente
      const cart = await storage.getCart(cartItem.cartId);
      if (!cart) {
        return res.status(404).json({ message: "Carrinho não encontrado" });
      }

      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer || customer.id !== cart.customerId) {
        return res.status(403).json({ message: "Você não tem permissão para modificar este carrinho" });
      }

      // Atualizar quantidade
      await storage.updateCartItem(itemId, quantity);

      return res.json({ message: "Quantidade atualizada" });
    } catch (error) {
      console.error("Erro ao atualizar item do carrinho:", error);
      return res.status(500).json({ message: "Falha ao atualizar item do carrinho" });
    }
  });

  // Remover item do carrinho
  app.delete('/api/cart/items/:itemId', isCustomer, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      // Verificar se o item existe
      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem) {
        return res.status(404).json({ message: "Item não encontrado" });
      }

      // Verificar se o carrinho pertence ao cliente
      const cart = await storage.getCart(cartItem.cartId);
      if (!cart) {
        return res.status(404).json({ message: "Carrinho não encontrado" });
      }

      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer || customer.id !== cart.customerId) {
        return res.status(403).json({ message: "Você não tem permissão para modificar este carrinho" });
      }

      // Remover item
      await storage.deleteCartItem(itemId);

      return res.json({ message: "Item removido do carrinho" });
    } catch (error) {
      console.error("Erro ao remover item do carrinho:", error);
      return res.status(500).json({ message: "Falha ao remover item do carrinho" });
    }
  });

  // ==== API de Pedidos ==== //

  // Finalizar pedido sem autenticação (checkout para visitantes)
  app.post('/api/non-auth-orders/:storeId', async (req: Request, res: Response) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      const { 
        customerName, 
        customerPhone, 
        customerAddress, 
        deliveryMethod, 
        paymentMethod,
        notes,
        items,
        total
      } = req.body;

      if (!customerName || !deliveryMethod || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Dados incompletos para criar o pedido" });
      }

      // Verificar se a loja existe
      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }

      // Criar pedido sem cliente associado
      const order = await storage.createOrder({
        customerId: null,
        storeId,
        customerName,
        customerPhone: customerPhone || null,
        customerAddress: customerAddress || null,
        deliveryMethod,
        notes: notes || null,
        total
      });

      // Criar itens do pedido
      await Promise.all(
        items.map(async (item: any) => {
          const product = await storage.getProduct(item.productId);
          return storage.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            productName: item.productName || (product ? product.name : `Produto #${item.productId}`),
            price: item.price,
            quantity: item.quantity
          });
        })
      );

      // Preparar mensagem de WhatsApp
      const orderItems = await storage.getOrderItems(order.id);
      let whatsappMessage = encodeURIComponent(
        `✅ *NOVO PEDIDO* ✅\n\n*Itens:*\n` +
        orderItems.map(item => `- ${item.productName} (${item.quantity} unid.)`).join('\n') +
        `\n\n*Nome:* ${customerName}` +
        `\n*Telefone:* ${customerPhone || "Não informado"}` +
        `\n*Entrega:* ${deliveryMethod === 'delivery' ? 'Entrega' : 'Retirada'}` +
        (customerAddress ? `\n*Endereço:* ${customerAddress}` : '') +
        (paymentMethod ? `\n*Pagamento:* ${paymentMethod}` : '') +
        (notes ? `\n*Observações:* ${notes}` : '') +
        `\n\n*Total:* R$ ${total.toFixed(2)}\n\n✅ Obrigado pelo seu pedido! ✅`
      );

      // Enviar notificação WebSocket para a loja
      if (storeConnections[storeId]) {
        // Obter todos os itens do pedido para enviar na notificação
        const orderWithItems = {
          ...order,
          items: orderItems,
          _timestamp: Date.now() // Para evitar problemas de cache
        };

        // Enviar a notificação para todas as conexões da loja
        storeConnections[storeId].forEach(conn => {
          if (conn.readyState === WebSocket.OPEN) {
            conn.send(JSON.stringify({
              type: 'new_order',
              order: orderWithItems
            }));
            console.log(`Notificação de novo pedido #${order.id} enviada via WebSocket para loja ${storeId}`);
          }
        });
      } else {
        console.log(`Nenhuma conexão WebSocket ativa para loja ${storeId} - Pedido #${order.id} criado sem notificação`);
      }

      // Retornar dados do pedido e link do WhatsApp
      return res.status(201).json({
        order,
        whatsappLink: `https://wa.me/${store?.whatsappNumber}?text=${whatsappMessage}`
      });
    } catch (error) {
      console.error("Erro ao finalizar pedido não autenticado:", error);
      return res.status(500).json({ message: "Falha ao finalizar pedido" });
    }
  });

  // Finalizar pedido (checkout para clientes autenticados)
  app.post('/api/orders/:storeId', isCustomer, async (req: Request, res: Response) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      const { 
        customerName, 
        customerPhone, 
        customerAddress, 
        deliveryMethod, 
        notes 
      } = req.body;

      if (!customerName || !deliveryMethod) {
        return res.status(400).json({ message: "Nome e método de entrega são obrigatórios" });
      }

      // Obter o perfil de cliente
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) {
        return res.status(404).json({ message: "Perfil de cliente não encontrado" });
      }

      // Buscar carrinho
      const cart = await storage.getCartByCustomer(customer.id, storeId);
      if (!cart) {
        return res.status(404).json({ message: "Carrinho não encontrado" });
      }

      // Obter itens do carrinho
      const cartItems = await storage.getCartItems(cart.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Carrinho vazio" });
      }

      // Calcular total
      const total = cartItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      // Criar pedido
      const order = await storage.createOrder({
        customerId: customer.id,
        storeId,
        customerName,
        customerPhone: customerPhone || null,
        customerAddress: customerAddress || null,
        deliveryMethod,
        notes: notes || null,
        total
      });

      // Criar itens do pedido
      await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return storage.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            productName: product ? product.name : `Produto #${item.productId}`,
            price: item.price,
            quantity: item.quantity
          });
        })
      );

      // Obter loja e número de WhatsApp
      const store = await storage.getStore(storeId);

      // Construir mensagem de WhatsApp
      const orderItems = await storage.getOrderItems(order.id);
      let whatsappMessage = encodeURIComponent(
        `✅ *NOVO PEDIDO* ✅\n\n*Itens:*\n` +
        orderItems.map(item => `- ${item.productName} (${item.quantity} unid.)`).join('\n') +
        `\n\n*Nome:* ${customerName}` +
        `\n*Entrega:* ${deliveryMethod === 'delivery' ? 'Entrega' : 'Retirada'}` +
        (customerAddress ? `\n*Endereço:* ${customerAddress}` : '') +
        (notes ? `\n*Observações:* ${notes}` : '') +
        `\n\n*Total:* R$ ${total.toFixed(2)}\n\n✅ Obrigado pelo seu pedido! ✅`
      );

      // Limpar carrinho
      await storage.deleteCart(cart.id);

      // Enviar notificação WebSocket para a loja
      if (storeConnections[storeId]) {
        // Obter todos os itens do pedido para enviar na notificação
        const orderItems = await storage.getOrderItems(order.id);
        const orderWithItems = {
          ...order,
          items: orderItems,
          _timestamp: Date.now() // Para evitar problemas de cache
        };

        // Enviar a notificação para todas as conexões da loja
        storeConnections[storeId].forEach(conn => {
          if (conn.readyState === WebSocket.OPEN) {
            conn.send(JSON.stringify({
              type: 'new_order',
              order: orderWithItems
            }));
            console.log(`Notificação de novo pedido #${order.id} enviada via WebSocket para loja ${storeId}`);
          }
        });
      } else {
        console.log(`Nenhuma conexão WebSocket ativa para loja ${storeId} - Pedido #${order.id} criado sem notificação`);
      }

      // Retornar dados do pedido e link do WhatsApp
      return res.status(201).json({
        order,
        whatsappLink: `https://wa.me/${store?.whatsappNumber}?text=${whatsappMessage}`
      });
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      return res.status(500).json({ message: "Falha ao finalizar pedido" });
    }
  });

  // Listar pedidos do cliente
  app.get('/api/orders', isCustomer, async (req: Request, res: Response) => {
    try {
      // Obter o perfil de cliente
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) {
        return res.status(404).json({ message: "Perfil de cliente não encontrado" });
      }

      // Buscar pedidos
      const orders = await storage.getOrders(undefined, customer.id);

      // Para cada pedido, obter loja e itens
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const store = await storage.getStore(order.storeId);
          const items = await storage.getOrderItems(order.id);
          return {
            ...order,
            store: {
              id: store?.id,
              name: store?.name,
              logoUrl: store?.logoUrl
            },
            items
          };
        })
      );

      return res.json(ordersWithDetails);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      return res.status(500).json({ message: "Falha ao obter pedidos" });
    }
  });

  // Listar pedidos da loja (lojista logado)
  app.get('/api/store/orders', isShopOwner, async (req: Request, res: Response) => {
    try {
      // Definir cabeçalhos para evitar cache
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);

      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja não encontrada para este usuário" });
      }

      // Buscar pedidos
      const orders = await storage.getOrders(shopOwner.storeId);

      // Para cada pedido, obter itens e adicionar timestamp para evitar cache
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return {
            ...order,
            items,
            _timestamp: Date.now() // Adicionar timestamp para sempre gerar conteúdo diferente
          };
        })
      );

      return res.json(ordersWithItems);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      return res.status(500).json({ message: "Falha ao obter pedidos" });
    }
  });

  // ==== API de Administração ==== //

  // Listar todos os usuários (admin)
  app.get('/api/admin/users', isAdmin, async (_req: Request, res: Response) => {
    try {
      const users = await Promise.all((await storage.getUsersByRole("shopowner")).map(async (user) => {
        const shopOwner = await storage.getShopOwnerByUserId(user.id);
        const store = shopOwner?.storeId ? await storage.getStore(shopOwner.storeId) : null;
        return {
          ...user,
          shopOwner,
          store: store ? {
            id: store.id,
            name: store.name,
            active: store.active
          } : null
        };
      }));

      return res.json(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return res.status(500).json({ message: "Falha ao obter usuários" });
    }
  });

  // Ativar/desativar loja (admin)
  app.patch('/api/admin/stores/:id/status', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      const { active } = req.body;

      if (typeof active !== 'boolean') {
        return res.status(400).json({ message: "O status 'active' deve ser um booleano" });
      }

      const store = await storage.getStore(id);
      if (!store) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }

      const updatedStore = await storage.updateStore(id, { active });
      return res.json(updatedStore);
    } catch (error) {
      console.error("Erro ao atualizar status da loja:", error);
      return res.status(500).json({ message: "Falha ao atualizar status da loja" });
    }
  });

  // Clonar catálogo de uma loja para outra (admin)
  app.post('/api/admin/stores/:sourceId/clone/:targetId', isAdmin, async (req: Request, res: Response) => {
    try {
      const sourceId = parseInt(req.params.sourceId);
      const targetId = parseInt(req.params.targetId);

      if (isNaN(sourceId) || isNaN(targetId)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      // Verificar se as lojas existem
      const sourceStore = await storage.getStore(sourceId);
      const targetStore = await storage.getStore(targetId);

      if (!sourceStore) {
        return res.status(404).json({ message: "Loja de origem não encontrada" });
      }

      if (!targetStore) {
        return res.status(404).json({ message: "Loja de destino não encontrada" });
      }

      // Obter produtos da loja de origem
      const sourceProducts = await storage.getProducts(sourceId);

      // Criar cópias dos produtos na loja de destino
      const clonedProducts = await Promise.all(
        sourceProducts.map(async (product) => {
          const { id, storeId, createdAt, updatedAt, ...productData } = product;
          return storage.createProduct({
            ...productData,
            storeId: targetId
          });
        })
      );

      return res.status(201).json({ 
        message: `${clonedProducts.length} produtos clonados com sucesso`, 
        products: clonedProducts 
      });
    } catch (error) {
      console.error("Erro ao clonar catálogo:", error);
      return res.status(500).json({ message: "Falha ao clonar catálogo" });
    }
  });

  // Rota para o admin atualizar detalhes de uma loja específica
  app.patch('/api/admin/stores/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const storeId = Number(req.params.id);

      const validatedData = insertStoreSchema.partial().parse(req.body);
      const updatedStore = await storage.updateStore(storeId, validatedData);

      if (!updatedStore) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }

      return res.json(updatedStore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao atualizar loja pelo admin:", error);
      return res.status(500).json({ message: "Falha ao atualizar informações da loja" });
    }
  });

  // Rota para o admin fazer upload de logo de loja
  app.post('/api/admin/stores/logo', isAdmin, upload.single('logo'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      // Mesmo caminho do upload de logo pelo lojista
      const logoUrl = `/uploads/${req.file.filename}`;

      return res.json({ logoUrl });
    } catch (error) {
      console.error("Erro ao fazer upload de logo:", error);
      return res.status(500).json({ message: "Falha ao fazer upload do logo" });
    }
  });

  // Atualizar status da assinatura de um lojista (admin)
  app.patch('/api/admin/shopowners/:id/subscription', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inválido" });
      }

      const { status, expiresAt, productLimit } = req.body;

      if (!status || !["active", "inactive", "trial", "expired"].includes(status)) {
        return res.status(400).json({ message: "Status de assinatura inválido" });
      }

      const shopOwner = await storage.getShopOwner(id);
      if (!shopOwner) {
        return res.status(404).json({ message: "Lojista não encontrado" });
      }

      const updateData: any = { 
        subscriptionStatus: status as "active" | "inactive" | "trial" | "expired"
      };
      
      if (productLimit) {
        // Validar que o limite está entre os valores permitidos
        if (![30, 50, 100].includes(Number(productLimit))) {
          return res.status(400).json({ message: "Limite de produtos inválido. Escolha entre 30, 50 ou 100." });
        }
        updateData.productLimit = Number(productLimit);
      }

      if (expiresAt) {
        updateData.subscriptionExpiresAt = new Date(expiresAt);
      }

      const updatedShopOwner = await storage.updateShopOwnerSubscription(id, updateData);
      
      // Enviar notificação WebSocket sobre a alteração de limites de produtos
      if (updateData.productLimit) {
        const storeId = shopOwner.storeId;
        
        // Encontrar sockets conectados para a loja
        try {
          if (wss && wss.clients) {
            wss.clients.forEach((client) => {
              if (client && 
                  client.readyState === WebSocket.OPEN && 
                  (client as any).storeId === storeId) {
                try {
                  client.send(JSON.stringify({
                    type: 'subscription_updated',
                    data: {
                      productLimit: updateData.productLimit,
                      subscriptionStatus: updateData.subscriptionStatus
                    }
                  }));
                  console.log(`Notificação de atualização de assinatura enviada para loja ${storeId}`);
                } catch (err) {
                  console.error('Erro ao enviar notificação WebSocket para cliente específico:', err);
                }
              }
            });
          } else {
            console.warn('WebSocket Server não disponível ou sem clientes');
          }
        } catch (err) {
          console.error('Erro ao processar clientes WebSocket:', err);
        }
      }

      return res.json(updatedShopOwner);
    } catch (error) {
      console.error("Erro ao atualizar assinatura:", error);
      return res.status(500).json({ message: "Falha ao atualizar assinatura" });
    }
  });

  // Criar novo lojista (admin)
  app.post('/api/admin/shopowners', isAdmin, async (req: Request, res: Response) => {
    try {
      const { username, password, email, name, storeName, whatsappNumber } = req.body;

      // Criar usuário lojista com senha hashada
      const hashedPassword = await hashPassword(password); // Usar a senha fornecida no formulário
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name,
        role: "shopowner"
      });

      // Criar loja com slug
      const slug = username.toLowerCase().replace(/[^a-z0-9]/g, '');
      const store = await storage.createStore({
        name: storeName,
        whatsappNumber,
        slug,
        logoUrl: null,
        instagramUrl: null,
        facebookUrl: null,
        showSocialMedia: false
      });

      // Criar perfil de lojista
      const shopOwner = await storage.createShopOwner({
        userId: user.id,
        storeId: store.id,
        subscriptionStatus: "trial",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias trial
        productLimit: 30 // Limite padrão de 30 produtos
      });

      return res.json({ user, store, shopOwner });
    } catch (error) {
      console.error("Erro ao criar lojista:", error);
      return res.status(500).json({ message: "Falha ao criar lojista" });
    }
  });

  // Excluir usuário e loja (admin)
  app.delete('/api/admin/users/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Obter o usuário para verificar se é um lojista
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Se for um lojista, precisamos remover o relacionamento primeiro
      if (user.role === "shopowner") {
        const shopOwner = await storage.getShopOwnerByUserId(userId);
        
        if (shopOwner) {
          // Primeiro, removemos a associação do shop owner
          await storage.deleteShopOwnerByUserId(userId);
          
          // Depois podemos excluir a loja associada, se existir
          if (shopOwner.storeId) {
            await storage.deleteStore(shopOwner.storeId);
          }
        }
      }
      
      // Finalmente, excluir o usuário
      await storage.deleteUser(userId);
      
      return res.json({ message: "Usuário e recursos associados excluídos com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      return res.status(500).json({ message: "Falha ao excluir usuário" });
    }
  });

  // Obter estatísticas gerais (admin)
  app.get('/api/admin/stats', isAdmin, async (_req: Request, res: Response) => {
    try {
      // Contagem total de lojas
      const allStores = await storage.getStores();
      const activeStores = allStores.filter(store => store.active).length;

      // Contagem de usuários por tipo
      const shopOwners = await storage.getUsersByRole("shopowner");
      const customers = await storage.getUsersByRole("customer");
      const admins = await storage.getUsersByRole("admin");

      // Contagem de produtos
      let totalProducts = 0;
      await Promise.all(allStores.map(async (store) => {
        const products = await storage.getProducts(store.id);
        totalProducts += products.length;
      }));

      // Contagem de pedidos
      const orders = await storage.getOrders();

      return res.json({
        stores: {
          total: allStores.length,
          active: activeStores,
          inactive: allStores.length - activeStores
        },
        users: {
          total: shopOwners.length + customers.length + admins.length,
          shopOwners: shopOwners.length,
          customers: customers.length,
          admins: admins.length
        },
        products: {
          total: totalProducts,
          average: allStores.length ? Math.round(totalProducts / allStores.length) : 0
        },
        orders: {
          total: orders.length
        }
      });
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      return res.status(500).json({ message: "Falha ao obter estatísticas" });
    }
  });

  const httpServer = createServer(app);
  
  // Inicializar o WebSocket Server em um path específico para não conflitar com o HMR do Vite
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Manter uma lista de conexões de WebSocket por ID de loja
  const storeConnections: Record<number, WebSocket[]> = {};

  wss.on('connection', (ws: WebSocket) => {
    console.log('Nova conexão WebSocket estabelecida');
    
    // Esperar pela mensagem de identificação (storeId)
    ws.on('message', (message: string | Buffer) => {
      try {
        const messageStr = message.toString();
        if (!messageStr) {
          console.error('Mensagem WebSocket vazia recebida');
          return;
        }
        
        const data = JSON.parse(messageStr);
        
        // Se for uma mensagem de identificação com storeId
        if (data && data.type === 'identify' && data.storeId) {
          const storeId = parseInt(data.storeId);
          
          if (!storeConnections[storeId]) {
            storeConnections[storeId] = [];
          }
          
          // Armazenar a conexão na lista da loja e guardar o storeId na conexão para uso posterior
          storeConnections[storeId].push(ws);
          (ws as any).storeId = storeId;
          
          console.log(`Cliente WebSocket identificado para loja ${storeId}`);
          
          // Remover da lista quando a conexão for fechada
          ws.on('close', () => {
            if (storeConnections[storeId]) {
              const index = storeConnections[storeId].indexOf(ws);
              if (index !== -1) {
                storeConnections[storeId].splice(index, 1);
              }
              console.log(`Cliente WebSocket desconectado da loja ${storeId}`);
            }
          });
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    });
  });

  // Código de middleware para WebSocket removido para evitar conflito de rotas

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ 
      message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  });
  return httpServer;
}