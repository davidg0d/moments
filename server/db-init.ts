import { hashPassword } from './auth';
import { db } from './db';
import { users, stores, shopOwners, categories, products } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function initializeDatabase() {
  console.log("Iniciando configuração do banco de dados...");

  // Verificar se já existem usuários no banco de dados
  const existingUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
  if (existingUsers[0].count > 0) {
    console.log("Banco de dados já inicializado. Pulando inicialização.");
    return;
  }

  console.log("Criando dados iniciais...");

  // Criar usuário administrador
  const adminPasswordHash = await hashPassword("admin123");
  const [adminUser] = await db.insert(users).values({
    username: "admin",
    password: adminPasswordHash,
    email: "admin@moments.com",
    name: "Administrador",
    role: "admin",
  }).returning();

  // Criar loja padrão
  const [defaultStore] = await db.insert(stores).values({
    name: "Loja Moments Paris",
    slug: "moments",
    logoUrl: "/placeholder-logo.jpg",
    bannerUrl: "/images/default-store-banner.jpg",
    whatsappNumber: "11987654321",
    instagramUrl: null,
    facebookUrl: null,
    showSocialMedia: false,
    active: true,
  }).returning();

  // Criar usuário lojista
  const shopOwnerPasswordHash = await hashPassword("lojista123");
  const [shopOwnerUser] = await db.insert(users).values({
    username: "lojista",
    password: shopOwnerPasswordHash,
    email: "lojista@moments.com",
    name: "Lojista Demo",
    role: "shopowner",
  }).returning();

  // Associar lojista à loja
  await db.insert(shopOwners).values({
    userId: shopOwnerUser.id,
    storeId: defaultStore.id,
    subscriptionStatus: "trial",
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
    stripeCustomerId: null,
    stripePriceId: null,
    stripeSubscriptionId: null
  });

  // Criar categorias padrão
  const [skinCareCategory] = await db.insert(categories).values({
    name: "Cuidados com a Pele",
    storeId: defaultStore.id,
  }).returning();

  const [hairCareCategory] = await db.insert(categories).values({
    name: "Cuidados com o Cabelo",
    storeId: defaultStore.id,
  }).returning();

  const [perfumeCategory] = await db.insert(categories).values({
    name: "Perfumes",
    storeId: defaultStore.id,
  }).returning();

  const [bodyCareCategory] = await db.insert(categories).values({
    name: "Cuidados Corporais",
    storeId: defaultStore.id,
  }).returning();

  // Criar produtos de exemplo
  const sampleProducts = [
    {
      name: "Creme Hidratante Facial",
      price: 89.9,
      description: "Hidratação profunda para todos os tipos de pele. Fórmula não oleosa com vitamina E.",
      imageUrl: "/placeholder-product-1.jpg",
      storeId: defaultStore.id,
      categoryId: skinCareCategory.id,
      active: true,
    },
    {
      name: "Sérum Facial Antioxidante",
      price: 129.9,
      description: "Com vitamina C que combate os radicais livres e sinais de envelhecimento.",
      imageUrl: "/placeholder-product-2.jpg",
      storeId: defaultStore.id,
      categoryId: skinCareCategory.id,
      active: true,
    },
    {
      name: "Máscara Capilar Reparadora",
      price: 75.9,
      description: "Tratamento intensivo para cabelos danificados. Recupera a maciez e o brilho natural.",
      imageUrl: "/placeholder-product-3.jpg",
      storeId: defaultStore.id,
      categoryId: hairCareCategory.id,
      active: true,
    },
    {
      name: "Protetor Solar FPS 50",
      price: 69.9,
      description: "Proteção UVA/UVB de amplo espectro. Textura leve, não oleosa e resistente à água.",
      imageUrl: "/placeholder-product-4.jpg",
      storeId: defaultStore.id,
      categoryId: skinCareCategory.id,
      active: true,
    },
    {
      name: "Perfume Floral",
      price: 159.9,
      description: "Fragrância sofisticada com notas de jasmim, rosa e baunilha. Longa duração.",
      imageUrl: "/placeholder-product-5.jpg",
      storeId: defaultStore.id,
      categoryId: perfumeCategory.id,
      active: true,
    },
    {
      name: "Óleo Corporal Relaxante",
      price: 85.9,
      description: "Hidratação profunda com aroma terapêutico de lavanda e camomila. Ideal para massagens.",
      imageUrl: "/placeholder-product-6.jpg",
      storeId: defaultStore.id,
      categoryId: bodyCareCategory.id,
      active: true,
    }
  ];

  // Inserir produtos de exemplo
  for (const product of sampleProducts) {
    await db.insert(products).values(product);
  }

  // Criar usuário cliente
  const customerPasswordHash = await hashPassword("cliente123");
  const [customerUser] = await db.insert(users).values({
    username: "cliente",
    password: customerPasswordHash,
    email: "cliente@email.com",
    name: "Cliente Demo",
    role: "customer",
  }).returning();

  console.log("Inicialização do banco de dados concluída com sucesso!");
}

export { initializeDatabase };