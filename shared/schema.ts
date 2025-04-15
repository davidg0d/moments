import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum para os tipos de usuário
export const userRoleEnum = pgEnum("user_role", ["admin", "shopowner", "customer"]);

// Enum para status de pagamento
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "inactive", "trial", "expired"]);

// User Schema - Sistema com 3 níveis de usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Store Schema - Loja personalizada para cada lojista
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").unique(),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"), // Será removido posteriormente
  companyLogoUrl: text("company_logo_url"), // Logo da empresa (substituindo o banner)
  whatsappNumber: text("whatsapp_number").notNull(),
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  showSocialMedia: boolean("show_social_media").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  templateId: integer("template_id"),
});

// Relação proprietário de loja
export const shopOwners = pgTable("shop_owners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: integer("store_id").references(() => stores.id),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trial"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  productLimit: integer("product_limit").default(30), // Limite padrão de 30 produtos
  stripeCustomerId: text("stripe_customer_id"),
  stripePriceId: text("stripe_price_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

// Perfil de cliente
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  address: text("address"),
  phone: text("phone"),
});

// Categorias de Produtos
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product Schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  categoryId: integer("category_id").references(() => categories.id),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Carrinho de Compras
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Itens do Carrinho
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  price: doublePrecision("price").notNull(),
});

// Pedidos
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  storeId: integer("store_id").notNull().references(() => stores.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  deliveryMethod: text("delivery_method").notNull(),
  notes: text("notes"),
  total: doublePrecision("total").notNull(),
  whatsappSent: boolean("whatsapp_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Itens do Pedido
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  price: doublePrecision("price").notNull(),
  quantity: integer("quantity").notNull(),
});

// Agora definimos as relações após todas as tabelas estarem definidas
export const usersRelations = relations(users, ({ one }) => ({
  shopOwner: one(shopOwners, {
    fields: [users.id],
    references: [shopOwners.userId],
  }),
  customerProfile: one(customers, {
    fields: [users.id],
    references: [customers.userId],
  })
}));

export const shopOwnersRelations = relations(shopOwners, ({ one }) => ({
  user: one(users, {
    fields: [shopOwners.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [shopOwners.storeId],
    references: [stores.id],
  }),
}));

export const customersRelations = relations(customers, ({ one }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  shopOwner: one(shopOwners, {
    fields: [stores.id],
    references: [shopOwners.storeId],
  }),
  products: many(products),
  categories: many(categories),
  template: one(stores, {
    fields: [stores.templateId],
    references: [stores.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  store: one(stores, {
    fields: [categories.storeId],
    references: [stores.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [carts.customerId],
    references: [customers.id],
  }),
  store: one(stores, {
    fields: [carts.storeId],
    references: [stores.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Category schemas
export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  storeId: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Export types e schemas para uso no aplicativo

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  role: z.enum(["customer", "shopowner"]).default("customer"),
});

// Store schemas

export const themeSchema = z.object({
  primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor primária deve ser um valor hexadecimal válido"),
  background: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor de fundo deve ser um valor hexadecimal válido"),
  text: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor do texto deve ser um valor hexadecimal válido"), 
  accent: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor de destaque deve ser um valor hexadecimal válido"),
});

export type Theme = z.infer<typeof themeSchema>;

export const insertStoreSchema = createInsertSchema(stores).pick({
  name: true,
  description: true,
  slug: true,
  logoUrl: true,
  whatsappNumber: true,
  instagramUrl: true,
  facebookUrl: true,
  showSocialMedia: true,
  templateId: true,
  bannerUrl: true, // Será removido posteriormente
  companyLogoUrl: true, // Logo da empresa (substituindo o banner)
}).extend({
  theme: themeSchema.optional()
});

export const storeFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").optional(),
  description: z.string().max(100, "Descrição não pode ter mais que 100 caracteres").optional(),
  whatsappNumber: z.string().min(10, "Número inválido").max(11, "Número inválido").optional(),
  theme: themeSchema.optional(),
}).partial();


export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  whatsappNumber: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  showSocialMedia: boolean;
  active: boolean;
  slug: string | null;
  bannerUrl: string | null;
  companyLogoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  templateId: number | null;
  theme?: Theme;
};

// Product schemas
export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  price: true,
  description: true,
  imageUrl: true,
  storeId: true,
  categoryId: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// ShopOwner schemas
export const insertShopOwnerSchema = createInsertSchema(shopOwners).pick({
  userId: true,
  storeId: true,
  subscriptionStatus: true,
  subscriptionExpiresAt: true,
  productLimit: true,
});

export type InsertShopOwner = z.infer<typeof insertShopOwnerSchema>;
export type ShopOwner = typeof shopOwners.$inferSelect;

// Customer schemas
export const insertCustomerSchema = createInsertSchema(customers).pick({
  userId: true,
  address: true,
  phone: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Cart schemas
export const insertCartSchema = createInsertSchema(carts).pick({
  customerId: true,
  storeId: true,
});

export type InsertCart = z.infer<typeof insertCartSchema>;
export type Cart = typeof carts.$inferSelect;

// CartItem schemas
export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  cartId: true,
  productId: true,
  quantity: true,
  price: true,
});

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

// Order schemas
export const insertOrderSchema = createInsertSchema(orders).pick({
  customerId: true,
  storeId: true,
  customerName: true,
  customerPhone: true,
  customerAddress: true,
  deliveryMethod: true,
  notes: true,
  total: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// OrderItem schemas
export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  productName: true,
  price: true,
  quantity: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Add validation schema for forms with additional validation
export const productFormSchema = insertProductSchema.extend({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  price: z.number().min(0, "Preço não pode ser negativo"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.number().nullable().optional(),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  deliveryMethod: z.enum(["pickup", "delivery"]),
  notes: z.string().optional(),
});