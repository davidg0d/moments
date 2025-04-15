var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  cartItems: () => cartItems,
  cartItemsRelations: () => cartItemsRelations,
  carts: () => carts,
  cartsRelations: () => cartsRelations,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  checkoutSchema: () => checkoutSchema,
  customers: () => customers,
  customersRelations: () => customersRelations,
  insertCartItemSchema: () => insertCartItemSchema,
  insertCartSchema: () => insertCartSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertProductSchema: () => insertProductSchema,
  insertShopOwnerSchema: () => insertShopOwnerSchema,
  insertStoreSchema: () => insertStoreSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  orderItems: () => orderItems,
  orderItemsRelations: () => orderItemsRelations,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  productFormSchema: () => productFormSchema,
  products: () => products,
  productsRelations: () => productsRelations,
  registerSchema: () => registerSchema,
  shopOwners: () => shopOwners,
  shopOwnersRelations: () => shopOwnersRelations,
  storeFormSchema: () => storeFormSchema,
  stores: () => stores,
  storesRelations: () => storesRelations,
  subscriptionStatusEnum: () => subscriptionStatusEnum,
  themeSchema: () => themeSchema,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var userRoleEnum, subscriptionStatusEnum, users, stores, shopOwners, customers, categories, products, carts, cartItems, orders, orderItems, usersRelations, shopOwnersRelations, customersRelations, storesRelations, categoriesRelations, productsRelations, cartsRelations, cartItemsRelations, ordersRelations, orderItemsRelations, insertCategorySchema, insertUserSchema, loginSchema, registerSchema, themeSchema, insertStoreSchema, storeFormSchema, insertProductSchema, insertShopOwnerSchema, insertCustomerSchema, insertCartSchema, insertCartItemSchema, insertOrderSchema, insertOrderItemSchema, productFormSchema, checkoutSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    userRoleEnum = pgEnum("user_role", ["admin", "shopowner", "customer"]);
    subscriptionStatusEnum = pgEnum("subscription_status", ["active", "inactive", "trial", "expired"]);
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      email: text("email").notNull().unique(),
      name: text("name").notNull(),
      role: userRoleEnum("role").notNull().default("customer"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    stores = pgTable("stores", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description"),
      slug: text("slug").unique(),
      logoUrl: text("logo_url"),
      bannerUrl: text("banner_url"),
      // SerÃ¡ removido posteriormente
      companyLogoUrl: text("company_logo_url"),
      // Logo da empresa (substituindo o banner)
      whatsappNumber: text("whatsapp_number").notNull(),
      instagramUrl: text("instagram_url"),
      facebookUrl: text("facebook_url"),
      showSocialMedia: boolean("show_social_media").default(false),
      active: boolean("active").default(true),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      templateId: integer("template_id")
    });
    shopOwners = pgTable("shop_owners", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      storeId: integer("store_id").references(() => stores.id),
      subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trial"),
      subscriptionExpiresAt: timestamp("subscription_expires_at"),
      productLimit: integer("product_limit").default(30),
      // Limite padrÃ£o de 30 produtos
      stripeCustomerId: text("stripe_customer_id"),
      stripePriceId: text("stripe_price_id"),
      stripeSubscriptionId: text("stripe_subscription_id")
    });
    customers = pgTable("customers", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      address: text("address"),
      phone: text("phone")
    });
    categories = pgTable("categories", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    products = pgTable("products", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      price: doublePrecision("price").notNull(),
      description: text("description"),
      imageUrl: text("image_url"),
      categoryId: integer("category_id").references(() => categories.id),
      storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
      active: boolean("active").default(true),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    carts = pgTable("carts", {
      id: serial("id").primaryKey(),
      customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
      storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    cartItems = pgTable("cart_items", {
      id: serial("id").primaryKey(),
      cartId: integer("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
      productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
      quantity: integer("quantity").notNull().default(1),
      price: doublePrecision("price").notNull()
    });
    orders = pgTable("orders", {
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
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    orderItems = pgTable("order_items", {
      id: serial("id").primaryKey(),
      orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
      productId: integer("product_id").references(() => products.id),
      productName: text("product_name").notNull(),
      price: doublePrecision("price").notNull(),
      quantity: integer("quantity").notNull()
    });
    usersRelations = relations(users, ({ one }) => ({
      shopOwner: one(shopOwners, {
        fields: [users.id],
        references: [shopOwners.userId]
      }),
      customerProfile: one(customers, {
        fields: [users.id],
        references: [customers.userId]
      })
    }));
    shopOwnersRelations = relations(shopOwners, ({ one }) => ({
      user: one(users, {
        fields: [shopOwners.userId],
        references: [users.id]
      }),
      store: one(stores, {
        fields: [shopOwners.storeId],
        references: [stores.id]
      })
    }));
    customersRelations = relations(customers, ({ one }) => ({
      user: one(users, {
        fields: [customers.userId],
        references: [users.id]
      })
    }));
    storesRelations = relations(stores, ({ one, many }) => ({
      shopOwner: one(shopOwners, {
        fields: [stores.id],
        references: [shopOwners.storeId]
      }),
      products: many(products),
      categories: many(categories),
      template: one(stores, {
        fields: [stores.templateId],
        references: [stores.id]
      })
    }));
    categoriesRelations = relations(categories, ({ one, many }) => ({
      store: one(stores, {
        fields: [categories.storeId],
        references: [stores.id]
      }),
      products: many(products)
    }));
    productsRelations = relations(products, ({ one }) => ({
      store: one(stores, {
        fields: [products.storeId],
        references: [stores.id]
      }),
      category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id]
      })
    }));
    cartsRelations = relations(carts, ({ one, many }) => ({
      customer: one(customers, {
        fields: [carts.customerId],
        references: [customers.id]
      }),
      store: one(stores, {
        fields: [carts.storeId],
        references: [stores.id]
      }),
      items: many(cartItems)
    }));
    cartItemsRelations = relations(cartItems, ({ one }) => ({
      cart: one(carts, {
        fields: [cartItems.cartId],
        references: [carts.id]
      }),
      product: one(products, {
        fields: [cartItems.productId],
        references: [products.id]
      })
    }));
    ordersRelations = relations(orders, ({ one, many }) => ({
      customer: one(customers, {
        fields: [orders.customerId],
        references: [customers.id]
      }),
      store: one(stores, {
        fields: [orders.storeId],
        references: [stores.id]
      }),
      items: many(orderItems)
    }));
    orderItemsRelations = relations(orderItems, ({ one }) => ({
      order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id]
      }),
      product: one(products, {
        fields: [orderItems.productId],
        references: [products.id]
      })
    }));
    insertCategorySchema = createInsertSchema(categories).pick({
      name: true,
      storeId: true
    });
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      password: true,
      email: true,
      name: true,
      role: true
    });
    loginSchema = z.object({
      username: z.string().min(1, "Usu\xE1rio \xE9 obrigat\xF3rio"),
      password: z.string().min(1, "Senha \xE9 obrigat\xF3ria")
    });
    registerSchema = z.object({
      username: z.string().min(3, "Nome de usu\xE1rio deve ter no m\xEDnimo 3 caracteres"),
      password: z.string().min(6, "Senha deve ter no m\xEDnimo 6 caracteres"),
      email: z.string().email("Email inv\xE1lido"),
      name: z.string().min(2, "Nome deve ter no m\xEDnimo 2 caracteres"),
      role: z.enum(["customer", "shopowner"]).default("customer")
    });
    themeSchema = z.object({
      primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor prim\xE1ria deve ser um valor hexadecimal v\xE1lido"),
      background: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor de fundo deve ser um valor hexadecimal v\xE1lido"),
      text: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor do texto deve ser um valor hexadecimal v\xE1lido"),
      accent: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor de destaque deve ser um valor hexadecimal v\xE1lido")
    });
    insertStoreSchema = createInsertSchema(stores).pick({
      name: true,
      description: true,
      slug: true,
      logoUrl: true,
      whatsappNumber: true,
      instagramUrl: true,
      facebookUrl: true,
      showSocialMedia: true,
      templateId: true,
      bannerUrl: true,
      // SerÃ¡ removido posteriormente
      companyLogoUrl: true
      // Logo da empresa (substituindo o banner)
    }).extend({
      theme: themeSchema.optional()
    });
    storeFormSchema = z.object({
      name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").optional(),
      description: z.string().max(100, "Descri\xE7\xE3o n\xE3o pode ter mais que 100 caracteres").optional(),
      whatsappNumber: z.string().min(10, "N\xFAmero inv\xE1lido").max(11, "N\xFAmero inv\xE1lido").optional(),
      theme: themeSchema.optional()
    }).partial();
    insertProductSchema = createInsertSchema(products).pick({
      name: true,
      price: true,
      description: true,
      imageUrl: true,
      storeId: true,
      categoryId: true
    });
    insertShopOwnerSchema = createInsertSchema(shopOwners).pick({
      userId: true,
      storeId: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      productLimit: true
    });
    insertCustomerSchema = createInsertSchema(customers).pick({
      userId: true,
      address: true,
      phone: true
    });
    insertCartSchema = createInsertSchema(carts).pick({
      customerId: true,
      storeId: true
    });
    insertCartItemSchema = createInsertSchema(cartItems).pick({
      cartId: true,
      productId: true,
      quantity: true,
      price: true
    });
    insertOrderSchema = createInsertSchema(orders).pick({
      customerId: true,
      storeId: true,
      customerName: true,
      customerPhone: true,
      customerAddress: true,
      deliveryMethod: true,
      notes: true,
      total: true
    });
    insertOrderItemSchema = createInsertSchema(orderItems).pick({
      orderId: true,
      productId: true,
      productName: true,
      price: true,
      quantity: true
    });
    productFormSchema = insertProductSchema.extend({
      name: z.string().min(3, "Nome deve ter no m\xEDnimo 3 caracteres"),
      price: z.number().min(0, "Pre\xE7o n\xE3o pode ser negativo"),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      categoryId: z.number().nullable().optional()
    });
    checkoutSchema = z.object({
      customerName: z.string().min(2, "Nome deve ter no m\xEDnimo 2 caracteres"),
      customerPhone: z.string().optional(),
      customerAddress: z.string().optional(),
      deliveryMethod: z.enum(["pickup", "delivery"]),
      notes: z.string().optional()
    });
  }
});

// server/db.ts
import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
    }
    pool = new pkg.Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// server/db-storage.ts
import session from "express-session";
import { eq, and, desc } from "drizzle-orm";
import pgSessionStore from "connect-pg-simple";
var DatabaseStorage;
var init_db_storage = __esm({
  "server/db-storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    init_db();
    DatabaseStorage = class {
      sessionStore;
      constructor() {
        const PgStore = pgSessionStore(session);
        this.sessionStore = new PgStore({
          pool,
          tableName: "session",
          createTableIfMissing: true
        });
      }
      // User methods
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
      }
      async getUsersByRole(role) {
        return await db.select().from(users).where(eq(users.role, role));
      }
      async createUser(user) {
        const [newUser] = await db.insert(users).values(user).returning();
        return newUser;
      }
      async updateUser(id, user) {
        const [updatedUser] = await db.update(users).set(user).where(eq(users.id, id)).returning();
        return updatedUser;
      }
      async deleteShopOwner(id) {
        try {
          const result = await db.delete(shopOwners).where(eq(shopOwners.id, id));
          return !!result.rowCount;
        } catch (error) {
          console.error("Erro ao excluir perfil de lojista:", error);
          return false;
        }
      }
      async deleteShopOwnerByUserId(userId) {
        try {
          const result = await db.delete(shopOwners).where(eq(shopOwners.userId, userId));
          return !!result.rowCount;
        } catch (error) {
          console.error("Erro ao excluir perfil de lojista por userId:", error);
          return false;
        }
      }
      async deleteUser(id) {
        try {
          const result = await db.delete(users).where(eq(users.id, id));
          return !!result.rowCount;
        } catch (error) {
          console.error("Erro ao excluir usu\xE1rio:", error);
          return false;
        }
      }
      // Store methods
      async getStore(id) {
        const [store] = await db.select().from(stores).where(eq(stores.id, id));
        return store;
      }
      async getStores() {
        return await db.select().from(stores);
      }
      async getStoreByOwner(ownerId) {
        const [shopOwner] = await db.select().from(shopOwners).where(eq(shopOwners.userId, ownerId));
        if (!shopOwner || !shopOwner.storeId) {
          return void 0;
        }
        const [store] = await db.select().from(stores).where(eq(stores.id, shopOwner.storeId));
        return store;
      }
      async getStoreBySlug(slug) {
        const [store] = await db.select().from(stores).where(eq(stores.slug, slug));
        return store;
      }
      async createStore(store) {
        const [newStore] = await db.insert(stores).values(store).returning();
        return newStore;
      }
      async updateStore(id, store) {
        console.log("Updating store in DB:", id, "with data:", store);
        const [updatedStore] = await db.update(stores).set({ ...store, updatedAt: /* @__PURE__ */ new Date() }).where(eq(stores.id, id)).returning();
        return updatedStore;
      }
      async deleteStore(id) {
        const result = await db.delete(stores).where(eq(stores.id, id));
        return !!result.rowCount;
      }
      // Category methods
      async getCategories(storeId) {
        return await db.select().from(categories).where(eq(categories.storeId, storeId));
      }
      async getCategory(id) {
        const [category] = await db.select().from(categories).where(eq(categories.id, id));
        return category;
      }
      async createCategory(category) {
        const [newCategory] = await db.insert(categories).values(category).returning();
        return newCategory;
      }
      async updateCategory(id, category) {
        const [updatedCategory] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
        return updatedCategory;
      }
      async deleteCategory(id) {
        const result = await db.delete(categories).where(eq(categories.id, id));
        return !!result.rowCount;
      }
      // Product methods
      async getProducts(storeId) {
        if (storeId) {
          return await db.select().from(products).where(eq(products.storeId, storeId));
        }
        return await db.select().from(products);
      }
      async getProduct(id) {
        const [product] = await db.select().from(products).where(eq(products.id, id));
        return product;
      }
      async createProduct(product) {
        const [newProduct] = await db.insert(products).values(product).returning();
        return newProduct;
      }
      async updateProduct(id, product) {
        const [updatedProduct] = await db.update(products).set({ ...product, updatedAt: /* @__PURE__ */ new Date() }).where(eq(products.id, id)).returning();
        return updatedProduct;
      }
      async deleteProduct(id) {
        const result = await db.delete(products).where(eq(products.id, id));
        return !!result.rowCount;
      }
      // Shop Owner methods
      async getShopOwner(id) {
        const [shopOwner] = await db.select().from(shopOwners).where(eq(shopOwners.id, id));
        return shopOwner;
      }
      async getShopOwnerByUserId(userId) {
        const [shopOwner] = await db.select().from(shopOwners).where(eq(shopOwners.userId, userId));
        return shopOwner;
      }
      async createShopOwner(shopOwner) {
        const [newShopOwner] = await db.insert(shopOwners).values(shopOwner).returning();
        return newShopOwner;
      }
      async updateShopOwnerSubscription(id, data) {
        const [updatedShopOwner] = await db.update(shopOwners).set(data).where(eq(shopOwners.id, id)).returning();
        return updatedShopOwner;
      }
      // Customer methods
      async getCustomer(id) {
        const [customer] = await db.select().from(customers).where(eq(customers.id, id));
        return customer;
      }
      async getCustomerByUserId(userId) {
        const [customer] = await db.select().from(customers).where(eq(customers.userId, userId));
        return customer;
      }
      async createCustomer(customer) {
        const [newCustomer] = await db.insert(customers).values(customer).returning();
        return newCustomer;
      }
      async updateCustomer(id, customer) {
        const [updatedCustomer] = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
        return updatedCustomer;
      }
      // Cart methods
      async getCart(id) {
        const [cart] = await db.select().from(carts).where(eq(carts.id, id));
        return cart;
      }
      async getCartByCustomer(customerId, storeId) {
        const [cart] = await db.select().from(carts).where(
          and(
            eq(carts.customerId, customerId),
            eq(carts.storeId, storeId)
          )
        );
        return cart;
      }
      async createCart(cart) {
        const [newCart] = await db.insert(carts).values(cart).returning();
        return newCart;
      }
      async deleteCart(id) {
        const result = await db.delete(carts).where(eq(carts.id, id));
        return !!result.rowCount;
      }
      // CartItem methods
      async getCartItems(cartId) {
        return await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
      }
      async getCartItem(id) {
        const [cartItem] = await db.select().from(cartItems).where(eq(cartItems.id, id));
        return cartItem;
      }
      async createCartItem(cartItem) {
        const [newCartItem] = await db.insert(cartItems).values(cartItem).returning();
        return newCartItem;
      }
      async updateCartItem(id, quantity) {
        const [updatedCartItem] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
        return updatedCartItem;
      }
      async deleteCartItem(id) {
        const result = await db.delete(cartItems).where(eq(cartItems.id, id));
        return !!result.rowCount;
      }
      // Order methods
      async getOrders(storeId, customerId) {
        if (storeId && customerId) {
          return await db.select().from(orders).where(
            and(
              eq(orders.storeId, storeId),
              eq(orders.customerId, customerId)
            )
          ).orderBy(desc(orders.createdAt));
        } else if (storeId) {
          return await db.select().from(orders).where(eq(orders.storeId, storeId)).orderBy(desc(orders.createdAt));
        } else if (customerId) {
          return await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
        }
        return await db.select().from(orders).orderBy(desc(orders.createdAt));
      }
      async getOrder(id) {
        const [order] = await db.select().from(orders).where(eq(orders.id, id));
        return order;
      }
      async createOrder(order) {
        const [newOrder] = await db.insert(orders).values(order).returning();
        return newOrder;
      }
      async updateOrderWhatsappStatus(id, sent) {
        const [updatedOrder] = await db.update(orders).set({ whatsappSent: sent }).where(eq(orders.id, id)).returning();
        return updatedOrder;
      }
      // OrderItem methods
      async getOrderItems(orderId) {
        return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      }
      async createOrderItem(orderItem) {
        const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
        return newOrderItem;
      }
      // Stripe methods
      async updateStripeCustomerId(userId, stripeCustomerId) {
        const [updatedUser] = await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId)).returning();
        return updatedUser;
      }
      async updateUserStripeInfo(userId, info) {
        const [shopOwner] = await db.select().from(shopOwners).where(eq(shopOwners.userId, userId));
        if (!shopOwner) {
          return void 0;
        }
        const [updatedShopOwner] = await db.update(shopOwners).set({
          stripeCustomerId: info.customerId,
          stripeSubscriptionId: info.subscriptionId,
          subscriptionStatus: "active"
        }).where(eq(shopOwners.id, shopOwner.id)).returning();
        return updatedShopOwner;
      }
    };
  }
});

// server/storage.ts
var storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_db_storage();
    storage = new DatabaseStorage();
  }
});

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  if (!stored.includes(".")) {
    console.error("Formato de senha inv\uFFFDlido");
    return false;
  }
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Erro na compara\uFFFD\uFFFDo de senhas:", error);
    return false;
  }
}
function setupAuth(app2) {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieSettings = {
    maxAge: 30 * 24 * 60 * 60 * 1e3,
    // 30 dias
    httpOnly: true,
    secure: isProduction && process.env.HTTPS === "true",
    // Apenas em produção com HTTPS habilitado
    sameSite: isProduction ? "strict" : "lax"
    // Segurança reforçada em produção
  };
  app2.use(
    session2({
      secret: process.env.SESSION_SECRET || "development-secret-key",
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: cookieSettings
    })
  );
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false, { message: "Credenciais inv\uFFFDlidas" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
  const isAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Acesso n\uFFFDo autorizado" });
    }
    next();
  };
  const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Acesso restrito a administradores" });
    }
    next();
  };
  const isShopOwner = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== "shopowner" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Acesso restrito a lojistas" });
    }
    next();
  };
  const isCustomer = (req, res, next) => {
    if (!req.isAuthenticated() || !["customer", "shopowner", "admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Acesso restrito a clientes" });
    }
    next();
  };
  const hasActiveSubscription = async (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== "shopowner") {
      return res.status(403).json({ error: "Acesso restrito a lojistas com assinatura ativa" });
    }
    const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
    if (!shopOwner || shopOwner.subscriptionStatus !== "active") {
      return res.status(402).json({ error: "Assinatura necess\uFFFDria" });
    }
    next();
  };
  app2.locals.authMiddleware = {
    isAuthenticated,
    isAdmin,
    isShopOwner,
    isCustomer,
    hasActiveSubscription
  };
  app2.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, name, role = "customer" } = req.body;
      if (await storage.getUserByUsername(username)) {
        return res.status(400).json({ error: "Nome de usu\uFFFDrio j\uFFFD existe" });
      }
      const hashedPassword = await hashPassword(password);
      const userData = { username, password: hashedPassword, email, name, role };
      const user = await storage.createUser(userData);
      req.login(user, (err) => {
        if (err) return next(err);
        const { password: password2, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      return next(err);
    }
  });
}
var scryptAsync;
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_storage();
    scryptAsync = promisify(scrypt);
  }
});

// server/db-init.ts
var db_init_exports = {};
__export(db_init_exports, {
  initializeDatabase: () => initializeDatabase
});
import { sql } from "drizzle-orm";
async function initializeDatabase() {
  console.log("Iniciando configura\xE7\xE3o do banco de dados...");
  const existingUsers = await db.select({ count: sql`count(*)` }).from(users);
  if (existingUsers[0].count > 0) {
    console.log("Banco de dados j\xE1 inicializado. Pulando inicializa\xE7\xE3o.");
    return;
  }
  console.log("Criando dados iniciais...");
  const adminPasswordHash = await hashPassword("admin123");
  const [adminUser] = await db.insert(users).values({
    username: "admin",
    password: adminPasswordHash,
    email: "admin@moments.com",
    name: "Administrador",
    role: "admin"
  }).returning();
  const [defaultStore] = await db.insert(stores).values({
    name: "Loja Moments Paris",
    slug: "moments",
    logoUrl: "/placeholder-logo.jpg",
    bannerUrl: "/images/default-store-banner.jpg",
    whatsappNumber: "11987654321",
    instagramUrl: null,
    facebookUrl: null,
    showSocialMedia: false,
    active: true
  }).returning();
  const shopOwnerPasswordHash = await hashPassword("lojista123");
  const [shopOwnerUser] = await db.insert(users).values({
    username: "lojista",
    password: shopOwnerPasswordHash,
    email: "lojista@moments.com",
    name: "Lojista Demo",
    role: "shopowner"
  }).returning();
  await db.insert(shopOwners).values({
    userId: shopOwnerUser.id,
    storeId: defaultStore.id,
    subscriptionStatus: "trial",
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
    // +30 dias
    stripeCustomerId: null,
    stripePriceId: null,
    stripeSubscriptionId: null
  });
  const [skinCareCategory] = await db.insert(categories).values({
    name: "Cuidados com a Pele",
    storeId: defaultStore.id
  }).returning();
  const [hairCareCategory] = await db.insert(categories).values({
    name: "Cuidados com o Cabelo",
    storeId: defaultStore.id
  }).returning();
  const [perfumeCategory] = await db.insert(categories).values({
    name: "Perfumes",
    storeId: defaultStore.id
  }).returning();
  const [bodyCareCategory] = await db.insert(categories).values({
    name: "Cuidados Corporais",
    storeId: defaultStore.id
  }).returning();
  const sampleProducts = [
    {
      name: "Creme Hidratante Facial",
      price: 89.9,
      description: "Hidrata\xE7\xE3o profunda para todos os tipos de pele. F\xF3rmula n\xE3o oleosa com vitamina E.",
      imageUrl: "/placeholder-product-1.jpg",
      storeId: defaultStore.id,
      categoryId: skinCareCategory.id,
      active: true
    },
    {
      name: "S\xE9rum Facial Antioxidante",
      price: 129.9,
      description: "Com vitamina C que combate os radicais livres e sinais de envelhecimento.",
      imageUrl: "/placeholder-product-2.jpg",
      storeId: defaultStore.id,
      categoryId: skinCareCategory.id,
      active: true
    },
    {
      name: "M\xE1scara Capilar Reparadora",
      price: 75.9,
      description: "Tratamento intensivo para cabelos danificados. Recupera a maciez e o brilho natural.",
      imageUrl: "/placeholder-product-3.jpg",
      storeId: defaultStore.id,
      categoryId: hairCareCategory.id,
      active: true
    },
    {
      name: "Protetor Solar FPS 50",
      price: 69.9,
      description: "Prote\xE7\xE3o UVA/UVB de amplo espectro. Textura leve, n\xE3o oleosa e resistente \xE0 \xE1gua.",
      imageUrl: "/placeholder-product-4.jpg",
      storeId: defaultStore.id,
      categoryId: skinCareCategory.id,
      active: true
    },
    {
      name: "Perfume Floral",
      price: 159.9,
      description: "Fragr\xE2ncia sofisticada com notas de jasmim, rosa e baunilha. Longa dura\xE7\xE3o.",
      imageUrl: "/placeholder-product-5.jpg",
      storeId: defaultStore.id,
      categoryId: perfumeCategory.id,
      active: true
    },
    {
      name: "\xD3leo Corporal Relaxante",
      price: 85.9,
      description: "Hidrata\xE7\xE3o profunda com aroma terap\xEAutico de lavanda e camomila. Ideal para massagens.",
      imageUrl: "/placeholder-product-6.jpg",
      storeId: defaultStore.id,
      categoryId: bodyCareCategory.id,
      active: true
    }
  ];
  for (const product of sampleProducts) {
    await db.insert(products).values(product);
  }
  const customerPasswordHash = await hashPassword("cliente123");
  const [customerUser] = await db.insert(users).values({
    username: "cliente",
    password: customerPasswordHash,
    email: "cliente@email.com",
    name: "Cliente Demo",
    role: "customer"
  }).returning();
  console.log("Inicializa\xE7\xE3o do banco de dados conclu\xEDda com sucesso!");
}
var init_db_init = __esm({
  "server/db-init.ts"() {
    "use strict";
    init_auth();
    init_db();
    init_schema();
  }
});

// server/migrations/add-product-limit.ts
var add_product_limit_exports = {};
__export(add_product_limit_exports, {
  addProductLimitColumn: () => addProductLimitColumn
});
import { sql as sql2 } from "drizzle-orm";
async function addProductLimitColumn() {
  try {
    const columnExists = await db.execute(sql2`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'shop_owners' AND column_name = 'product_limit'
    `);
    if (columnExists.rows.length === 0) {
      console.log("Adicionando coluna product_limit \xE0 tabela shop_owners...");
      await db.execute(sql2`
        ALTER TABLE shop_owners
        ADD COLUMN product_limit INTEGER DEFAULT 30 NOT NULL
      `);
      console.log("Coluna product_limit adicionada com sucesso!");
    } else {
      console.log("Coluna product_limit j\xE1 existe na tabela shop_owners. Pulando migra\xE7\xE3o.");
    }
  } catch (error) {
    console.error("Erro ao adicionar coluna product_limit:", error);
    throw error;
  }
}
var init_add_product_limit = __esm({
  "server/migrations/add-product-limit.ts"() {
    "use strict";
    init_db();
  }
});

// server/index.ts
import { fileURLToPath as fileURLToPath2 } from "url";
import path3 from "path";
import express3 from "express";
import fs2 from "fs";
import getPort from "get-port";
import cors from "cors";

// server/routes.ts
init_storage();
init_schema();
init_auth();
init_auth();
import { createServer } from "http";
import { z as z2 } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
var router = express.Router();
router.post("/api/register", async (req, res) => {
  const { username, password, email, name, role = "customer" } = req.body;
  try {
    const hashedPassword = await hashPassword(password);
    res.status(201).json({ message: "Usu\xE1rio registrado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao registrar usu\xE1rio" });
  }
});
var uploadsDir = path.join(process.cwd(), "dist/public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
var storage2 = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});
var upload = multer({
  storage: storage2,
  limits: { fileSize: 800 * 1024 },
  // 800KB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de imagem s\xE3o permitidos"));
    }
  }
});
async function registerRoutes(app2) {
  setupAuth(app2);
  const {
    isAuthenticated,
    isAdmin,
    isShopOwner,
    isCustomer,
    hasActiveSubscription
  } = app2.locals.authMiddleware;
  app2.get("/api/stores", async (_req, res) => {
    try {
      const stores2 = await storage.getStores();
      const activeStores = stores2.filter((store) => store.active);
      return res.json(activeStores);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      return res.status(500).json({
        message: "Falha ao obter a lista de lojas",
        details: "Ocorreu um erro ao consultar o banco de dados"
      });
    }
  });
  app2.get("/api/stores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const store = await storage.getStore(id);
      if (!store || !store.active) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada" });
      }
      return res.json(store);
    } catch (error) {
      console.error("Erro ao buscar loja:", error);
      return res.status(500).json({ message: "Falha ao obter informa\xE7\xF5es da loja" });
    }
  });
  app2.get("/api/stores/slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const store = await storage.getStoreBySlug(slug);
      if (!store || !store.active) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada" });
      }
      return res.json(store);
    } catch (error) {
      console.error("Erro ao buscar loja pelo slug:", error);
      return res.status(500).json({ message: "Falha ao obter informa\xE7\xF5es da loja" });
    }
  });
  app2.get("/api/store", isShopOwner, async (req, res) => {
    try {
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada para este usu\xE1rio" });
      }
      const store = await storage.getStore(shopOwner.storeId);
      if (!store) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada" });
      }
      return res.json(store);
    } catch (error) {
      console.error("Erro ao buscar loja:", error);
      return res.status(500).json({ message: "Falha ao obter informa\xE7\xF5es da loja" });
    }
  });
  app2.get("/api/shop-owner", isShopOwner, async (req, res) => {
    try {
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner) {
        return res.status(404).json({ message: "Perfil de lojista n\xE3o encontrado" });
      }
      return res.json(shopOwner);
    } catch (error) {
      console.error("Erro ao buscar perfil do lojista:", error);
      return res.status(500).json({ message: "Falha ao obter informa\xE7\xF5es do perfil" });
    }
  });
  app2.patch("/api/store", isShopOwner, hasActiveSubscription, async (req, res) => {
    try {
      console.log("Dados recebidos para atualiza\xE7\xE3o da loja:", req.body);
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada para este usu\xE1rio" });
      }
      const existingStore = await storage.getStore(shopOwner.storeId);
      console.log("Loja existente antes da atualiza\xE7\xE3o:", existingStore);
      const validatedData = insertStoreSchema.partial().extend({
        theme: themeSchema.optional()
      }).parse(req.body);
      console.log("Dados validados para atualiza\xE7\xE3o:", validatedData);
      const updateData = {
        ...validatedData,
        theme: validatedData.theme
      };
      console.log("Updating store:", shopOwner.storeId, "with data:", updateData);
      if (req.body.description !== void 0) {
        console.log("Description field received:", req.body.description);
        updateData.description = req.body.description;
      }
      const updatedStore = await storage.updateStore(shopOwner.storeId, updateData);
      if (!updatedStore) {
        return res.status(404).json({ message: "Falha ao atualizar loja - n\xE3o encontrada" });
      }
      console.log("Loja atualizada com sucesso:", updatedStore);
      return res.json(updatedStore);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        console.error("Erro de valida\xE7\xE3o:", fromZodError(error).message);
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao atualizar loja:", error);
      return res.status(500).json({ message: "Falha ao atualizar informa\xE7\xF5es da loja" });
    }
  });
  app2.post("/api/store/banner", isShopOwner, hasActiveSubscription, (req, res, next) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    upload.single("banner")(req, res, next);
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada para este usu\xE1rio" });
      }
      const bannerUrl = `/uploads/${req.file.filename}`;
      const updatedStore = await storage.updateStore(shopOwner.storeId, { bannerUrl });
      return res.json({ bannerUrl, store: updatedStore });
    } catch (error) {
      console.error("Erro ao enviar banner:", error);
      return res.status(500).json({ message: "Falha ao enviar banner" });
    }
  });
  app2.post("/api/store/company-logo", isShopOwner, hasActiveSubscription, upload.single("companyLogo"), async (req, res) => {
    console.log("Recebendo requisi\xE7\xE3o para upload de logo da empresa");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("Diret\xF3rio de uploads criado:", uploadsDir);
    }
    try {
      console.log("Processando upload de logo da empresa:", req.file);
      if (!req.file) {
        console.log("Nenhum arquivo foi enviado na requisi\xE7\xE3o");
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      if (!req.file.mimetype.includes("png")) {
        console.log("Arquivo n\xE3o \xE9 PNG:", req.file.mimetype);
        fs.unlinkSync(path.join(uploadsDir, req.file.filename));
        return res.status(400).json({ message: "Apenas arquivos PNG s\xE3o permitidos" });
      }
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada para este usu\xE1rio" });
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
  app2.post("/api/store/logo", isShopOwner, hasActiveSubscription, upload.single("logo"), async (req, res) => {
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
        return res.status(404).json({ message: "Loja n\xE3o encontrada para este usu\xE1rio" });
      }
      const uploadsDir2 = path.join(process.cwd(), "dist/public/uploads");
      if (!fs.existsSync(uploadsDir2)) {
        fs.mkdirSync(uploadsDir2, { recursive: true });
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
  app2.get("/api/stores/:storeId/categories", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const store = await storage.getStore(storeId);
      if (!store || !store.active) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada" });
      }
      const categories2 = await storage.getCategories(storeId);
      return res.json(categories2);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return res.status(500).json({ message: "Falha ao obter categorias" });
    }
  });
  app2.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Categoria n\xE3o encontrada" });
      }
      return res.json(category);
    } catch (error) {
      console.error("Erro ao buscar categoria:", error);
      return res.status(500).json({ message: "Falha ao obter categoria" });
    }
  });
  app2.post("/api/categories", isShopOwner, hasActiveSubscription, async (req, res) => {
    try {
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada para este usu\xE1rio" });
      }
      const validatedData = insertCategorySchema.parse({
        ...req.body,
        storeId: shopOwner.storeId
      });
      const category = await storage.createCategory(validatedData);
      return res.status(201).json(category);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao criar categoria:", error);
      return res.status(500).json({ message: "Falha ao criar categoria" });
    }
  });
  app2.patch("/api/categories/:id", isShopOwner, hasActiveSubscription, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Categoria n\xE3o encontrada" });
      }
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || shopOwner.storeId !== category.storeId) {
        return res.status(403).json({ message: "Voc\xEA n\xE3o tem permiss\xE3o para editar esta categoria" });
      }
      const validatedData = insertCategorySchema.partial().parse(req.body);
      delete validatedData.storeId;
      const updatedCategory = await storage.updateCategory(id, validatedData);
      return res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao atualizar categoria:", error);
      return res.status(500).json({ message: "Falha ao atualizar categoria" });
    }
  });
  app2.delete("/api/categories/:id", isShopOwner, hasActiveSubscription, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Categoria n\xE3o encontrada" });
      }
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || shopOwner.storeId !== category.storeId) {
        return res.status(403).json({ message: "Voc\xEA n\xE3o tem permiss\xE3o para excluir esta categoria" });
      }
      const products2 = await storage.getProducts(category.storeId);
      const hasProducts = products2.some((product) => product.categoryId === id);
      if (hasProducts) {
        return res.status(400).json({
          message: "N\xE3o \xE9 poss\xEDvel excluir a categoria",
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
  app2.get("/api/stores/:storeId/products", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const store = await storage.getStore(storeId);
      if (!store || !store.active) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada" });
      }
      const products2 = await storage.getProducts(storeId);
      const activeProducts = products2.filter((product) => product.active);
      return res.json(activeProducts);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      return res.status(500).json({ message: "Falha ao obter produtos" });
    }
  });
  app2.get("/api/products", isShopOwner, async (req, res) => {
    try {
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada para este usu\xE1rio" });
      }
      const products2 = await storage.getProducts(shopOwner.storeId);
      return res.json(products2);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      return res.status(500).json({ message: "Falha ao obter produtos" });
    }
  });
  app2.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Produto n\xE3o encontrado" });
      }
      const isOwner = req.isAuthenticated() && req.user.role === "shopowner" && await storage.getShopOwnerByUserId(req.user.id).then((owner) => owner?.storeId === product.storeId);
      if (!product.active && !isOwner) {
        return res.status(404).json({ message: "Produto n\xE3o encontrado" });
      }
      return res.json(product);
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return res.status(500).json({ message: "Falha ao obter produto" });
    }
  });
  app2.post("/api/products", isShopOwner, hasActiveSubscription, async (req, res) => {
    try {
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada para este usu\xE1rio" });
      }
      const products2 = await storage.getProducts(shopOwner.storeId);
      if (products2.length >= (shopOwner.productLimit || 30)) {
        return res.status(403).json({
          message: "Limite de produtos atingido",
          details: `Sua loja j\xE1 possui o m\xE1ximo de ${shopOwner.productLimit || 30} produtos permitidos pelo seu plano`
        });
      }
      const validatedData = insertProductSchema.parse({
        ...req.body,
        storeId: shopOwner.storeId,
        categoryId: req.body.categoryId || null
      });
      const product = await storage.createProduct(validatedData);
      return res.status(201).json(product);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao criar produto:", error);
      return res.status(500).json({ message: "Falha ao criar produto" });
    }
  });
  app2.post("/api/products/image", isShopOwner, hasActiveSubscription, upload.single("image"), async (req, res) => {
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
  app2.patch("/api/products/:id", isShopOwner, hasActiveSubscription, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Produto n\xE3o encontrado" });
      }
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || shopOwner.storeId !== product.storeId) {
        return res.status(403).json({ message: "Voc\xEA n\xE3o tem permiss\xE3o para editar este produto" });
      }
      const validatedData = insertProductSchema.partial().parse(req.body);
      delete validatedData.storeId;
      const updatedProduct = await storage.updateProduct(id, validatedData);
      return res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao atualizar produto:", error);
      return res.status(500).json({ message: "Falha ao atualizar produto" });
    }
  });
  app2.delete("/api/products/:id", isShopOwner, hasActiveSubscription, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Produto n\xE3o encontrado" });
      }
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || shopOwner.storeId !== product.storeId) {
        return res.status(403).json({ message: "Voc\xEA n\xE3o tem permiss\xE3o para excluir este produto" });
      }
      const result = await storage.deleteProduct(id);
      return res.json({ success: result });
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      return res.status(500).json({ message: "Falha ao excluir produto" });
    }
  });
  app2.get("/api/cart/:storeId", isCustomer, async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) {
        return res.status(404).json({ message: "Perfil de cliente n\xE3o encontrado" });
      }
      let cart = await storage.getCartByCustomer(customer.id, storeId);
      if (!cart) {
        cart = await storage.createCart({
          customerId: customer.id,
          storeId
        });
      }
      const cartItems2 = await storage.getCartItems(cart.id);
      const itemsWithProductInfo = await Promise.all(
        cartItems2.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            product
          };
        })
      );
      const total = itemsWithProductInfo.reduce(
        (sum, item) => sum + item.price * item.quantity,
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
  app2.post("/api/cart/:storeId/items", isCustomer, async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const { productId, quantity = 1 } = req.body;
      if (!productId) {
        return res.status(400).json({ message: "ID do produto \xE9 obrigat\xF3rio" });
      }
      const product = await storage.getProduct(productId);
      if (!product || !product.active || product.storeId !== storeId) {
        return res.status(404).json({ message: "Produto n\xE3o encontrado" });
      }
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) {
        return res.status(404).json({ message: "Perfil de cliente n\xE3o encontrado" });
      }
      let cart = await storage.getCartByCustomer(customer.id, storeId);
      if (!cart) {
        cart = await storage.createCart({
          customerId: customer.id,
          storeId
        });
      }
      const cartItems2 = await storage.getCartItems(cart.id);
      const existingItem = cartItems2.find((item) => item.productId === productId);
      if (existingItem) {
        await storage.updateCartItem(existingItem.id, existingItem.quantity + quantity);
      } else {
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
  app2.patch("/api/cart/items/:itemId", isCustomer, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const { quantity } = req.body;
      if (typeof quantity !== "number" || quantity < 1) {
        return res.status(400).json({ message: "Quantidade deve ser um n\xFAmero maior que zero" });
      }
      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem) {
        return res.status(404).json({ message: "Item n\xE3o encontrado" });
      }
      const cart = await storage.getCart(cartItem.cartId);
      if (!cart) {
        return res.status(404).json({ message: "Carrinho n\xE3o encontrado" });
      }
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer || customer.id !== cart.customerId) {
        return res.status(403).json({ message: "Voc\xEA n\xE3o tem permiss\xE3o para modificar este carrinho" });
      }
      await storage.updateCartItem(itemId, quantity);
      return res.json({ message: "Quantidade atualizada" });
    } catch (error) {
      console.error("Erro ao atualizar item do carrinho:", error);
      return res.status(500).json({ message: "Falha ao atualizar item do carrinho" });
    }
  });
  app2.delete("/api/cart/items/:itemId", isCustomer, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const cartItem = await storage.getCartItem(itemId);
      if (!cartItem) {
        return res.status(404).json({ message: "Item n\xE3o encontrado" });
      }
      const cart = await storage.getCart(cartItem.cartId);
      if (!cart) {
        return res.status(404).json({ message: "Carrinho n\xE3o encontrado" });
      }
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer || customer.id !== cart.customerId) {
        return res.status(403).json({ message: "Voc\xEA n\xE3o tem permiss\xE3o para modificar este carrinho" });
      }
      await storage.deleteCartItem(itemId);
      return res.json({ message: "Item removido do carrinho" });
    } catch (error) {
      console.error("Erro ao remover item do carrinho:", error);
      return res.status(500).json({ message: "Falha ao remover item do carrinho" });
    }
  });
  app2.post("/api/non-auth-orders/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
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
      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada" });
      }
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
      await Promise.all(
        items.map(async (item) => {
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
      const orderItems2 = await storage.getOrderItems(order.id);
      let whatsappMessage = encodeURIComponent(
        `\u2705 *NOVO PEDIDO* \u2705

*Itens:*
` + orderItems2.map((item) => `- ${item.productName} (${item.quantity} unid.)`).join("\n") + `

*Nome:* ${customerName}
*Telefone:* ${customerPhone || "N\xE3o informado"}
*Entrega:* ${deliveryMethod === "delivery" ? "Entrega" : "Retirada"}` + (customerAddress ? `
*Endere\xE7o:* ${customerAddress}` : "") + (paymentMethod ? `
*Pagamento:* ${paymentMethod}` : "") + (notes ? `
*Observa\xE7\xF5es:* ${notes}` : "") + `

*Total:* R$ ${total.toFixed(2)}

\u2705 Obrigado pelo seu pedido! \u2705`
      );
      if (storeConnections[storeId]) {
        const orderWithItems = {
          ...order,
          items: orderItems2,
          _timestamp: Date.now()
          // Para evitar problemas de cache
        };
        storeConnections[storeId].forEach((conn) => {
          if (conn.readyState === WebSocket.OPEN) {
            conn.send(JSON.stringify({
              type: "new_order",
              order: orderWithItems
            }));
            console.log(`Notifica\xE7\xE3o de novo pedido #${order.id} enviada via WebSocket para loja ${storeId}`);
          }
        });
      } else {
        console.log(`Nenhuma conex\xE3o WebSocket ativa para loja ${storeId} - Pedido #${order.id} criado sem notifica\xE7\xE3o`);
      }
      return res.status(201).json({
        order,
        whatsappLink: `https://wa.me/${store?.whatsappNumber}?text=${whatsappMessage}`
      });
    } catch (error) {
      console.error("Erro ao finalizar pedido n\xE3o autenticado:", error);
      return res.status(500).json({ message: "Falha ao finalizar pedido" });
    }
  });
  app2.post("/api/orders/:storeId", isCustomer, async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const {
        customerName,
        customerPhone,
        customerAddress,
        deliveryMethod,
        notes
      } = req.body;
      if (!customerName || !deliveryMethod) {
        return res.status(400).json({ message: "Nome e m\xE9todo de entrega s\xE3o obrigat\xF3rios" });
      }
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) {
        return res.status(404).json({ message: "Perfil de cliente n\xE3o encontrado" });
      }
      const cart = await storage.getCartByCustomer(customer.id, storeId);
      if (!cart) {
        return res.status(404).json({ message: "Carrinho n\xE3o encontrado" });
      }
      const cartItems2 = await storage.getCartItems(cart.id);
      if (cartItems2.length === 0) {
        return res.status(400).json({ message: "Carrinho vazio" });
      }
      const total = cartItems2.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
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
      await Promise.all(
        cartItems2.map(async (item) => {
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
      const store = await storage.getStore(storeId);
      const orderItems2 = await storage.getOrderItems(order.id);
      let whatsappMessage = encodeURIComponent(
        `\u2705 *NOVO PEDIDO* \u2705

*Itens:*
` + orderItems2.map((item) => `- ${item.productName} (${item.quantity} unid.)`).join("\n") + `

*Nome:* ${customerName}
*Entrega:* ${deliveryMethod === "delivery" ? "Entrega" : "Retirada"}` + (customerAddress ? `
*Endere\xE7o:* ${customerAddress}` : "") + (notes ? `
*Observa\xE7\xF5es:* ${notes}` : "") + `

*Total:* R$ ${total.toFixed(2)}

\u2705 Obrigado pelo seu pedido! \u2705`
      );
      await storage.deleteCart(cart.id);
      if (storeConnections[storeId]) {
        const orderItems3 = await storage.getOrderItems(order.id);
        const orderWithItems = {
          ...order,
          items: orderItems3,
          _timestamp: Date.now()
          // Para evitar problemas de cache
        };
        storeConnections[storeId].forEach((conn) => {
          if (conn.readyState === WebSocket.OPEN) {
            conn.send(JSON.stringify({
              type: "new_order",
              order: orderWithItems
            }));
            console.log(`Notifica\xE7\xE3o de novo pedido #${order.id} enviada via WebSocket para loja ${storeId}`);
          }
        });
      } else {
        console.log(`Nenhuma conex\xE3o WebSocket ativa para loja ${storeId} - Pedido #${order.id} criado sem notifica\xE7\xE3o`);
      }
      return res.status(201).json({
        order,
        whatsappLink: `https://wa.me/${store?.whatsappNumber}?text=${whatsappMessage}`
      });
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      return res.status(500).json({ message: "Falha ao finalizar pedido" });
    }
  });
  app2.get("/api/orders", isCustomer, async (req, res) => {
    try {
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) {
        return res.status(404).json({ message: "Perfil de cliente n\xE3o encontrado" });
      }
      const orders2 = await storage.getOrders(void 0, customer.id);
      const ordersWithDetails = await Promise.all(
        orders2.map(async (order) => {
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
  app2.get("/api/store/orders", isShopOwner, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
      if (!shopOwner || !shopOwner.storeId) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada para este usu\xE1rio" });
      }
      const orders2 = await storage.getOrders(shopOwner.storeId);
      const ordersWithItems = await Promise.all(
        orders2.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return {
            ...order,
            items,
            _timestamp: Date.now()
            // Adicionar timestamp para sempre gerar conteÃºdo diferente
          };
        })
      );
      return res.json(ordersWithItems);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      return res.status(500).json({ message: "Falha ao obter pedidos" });
    }
  });
  app2.get("/api/admin/users", isAdmin, async (_req, res) => {
    try {
      const users2 = await Promise.all((await storage.getUsersByRole("shopowner")).map(async (user) => {
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
      return res.json(users2);
    } catch (error) {
      console.error("Erro ao buscar usu\xE1rios:", error);
      return res.status(500).json({ message: "Falha ao obter usu\xE1rios" });
    }
  });
  app2.patch("/api/admin/stores/:id/status", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const { active } = req.body;
      if (typeof active !== "boolean") {
        return res.status(400).json({ message: "O status 'active' deve ser um booleano" });
      }
      const store = await storage.getStore(id);
      if (!store) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada" });
      }
      const updatedStore = await storage.updateStore(id, { active });
      return res.json(updatedStore);
    } catch (error) {
      console.error("Erro ao atualizar status da loja:", error);
      return res.status(500).json({ message: "Falha ao atualizar status da loja" });
    }
  });
  app2.post("/api/admin/stores/:sourceId/clone/:targetId", isAdmin, async (req, res) => {
    try {
      const sourceId = parseInt(req.params.sourceId);
      const targetId = parseInt(req.params.targetId);
      if (isNaN(sourceId) || isNaN(targetId)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const sourceStore = await storage.getStore(sourceId);
      const targetStore = await storage.getStore(targetId);
      if (!sourceStore) {
        return res.status(404).json({ message: "Loja de origem n\xE3o encontrada" });
      }
      if (!targetStore) {
        return res.status(404).json({ message: "Loja de destino n\xE3o encontrada" });
      }
      const sourceProducts = await storage.getProducts(sourceId);
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
      console.error("Erro ao clonar cat\xE1logo:", error);
      return res.status(500).json({ message: "Falha ao clonar cat\xE1logo" });
    }
  });
  app2.patch("/api/admin/stores/:id", isAdmin, async (req, res) => {
    try {
      const storeId = Number(req.params.id);
      const validatedData = insertStoreSchema.partial().parse(req.body);
      const updatedStore = await storage.updateStore(storeId, validatedData);
      if (!updatedStore) {
        return res.status(404).json({ message: "Loja n\xE3o encontrada" });
      }
      return res.json(updatedStore);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Erro ao atualizar loja pelo admin:", error);
      return res.status(500).json({ message: "Falha ao atualizar informa\xE7\xF5es da loja" });
    }
  });
  app2.post("/api/admin/stores/logo", isAdmin, upload.single("logo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      const logoUrl = `/uploads/${req.file.filename}`;
      return res.json({ logoUrl });
    } catch (error) {
      console.error("Erro ao fazer upload de logo:", error);
      return res.status(500).json({ message: "Falha ao fazer upload do logo" });
    }
  });
  app2.patch("/api/admin/shopowners/:id/subscription", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Formato de ID inv\xE1lido" });
      }
      const { status, expiresAt, productLimit } = req.body;
      if (!status || !["active", "inactive", "trial", "expired"].includes(status)) {
        return res.status(400).json({ message: "Status de assinatura inv\xE1lido" });
      }
      const shopOwner = await storage.getShopOwner(id);
      if (!shopOwner) {
        return res.status(404).json({ message: "Lojista n\xE3o encontrado" });
      }
      const updateData = {
        subscriptionStatus: status
      };
      if (productLimit) {
        if (![30, 50, 100].includes(Number(productLimit))) {
          return res.status(400).json({ message: "Limite de produtos inv\xE1lido. Escolha entre 30, 50 ou 100." });
        }
        updateData.productLimit = Number(productLimit);
      }
      if (expiresAt) {
        updateData.subscriptionExpiresAt = new Date(expiresAt);
      }
      const updatedShopOwner = await storage.updateShopOwnerSubscription(id, updateData);
      if (updateData.productLimit) {
        const storeId = shopOwner.storeId;
        try {
          if (wss && wss.clients) {
            wss.clients.forEach((client) => {
              if (client && client.readyState === WebSocket.OPEN && client.storeId === storeId) {
                try {
                  client.send(JSON.stringify({
                    type: "subscription_updated",
                    data: {
                      productLimit: updateData.productLimit,
                      subscriptionStatus: updateData.subscriptionStatus
                    }
                  }));
                  console.log(`Notifica\xE7\xE3o de atualiza\xE7\xE3o de assinatura enviada para loja ${storeId}`);
                } catch (err) {
                  console.error("Erro ao enviar notifica\xE7\xE3o WebSocket para cliente espec\xEDfico:", err);
                }
              }
            });
          } else {
            console.warn("WebSocket Server n\xE3o dispon\xEDvel ou sem clientes");
          }
        } catch (err) {
          console.error("Erro ao processar clientes WebSocket:", err);
        }
      }
      return res.json(updatedShopOwner);
    } catch (error) {
      console.error("Erro ao atualizar assinatura:", error);
      return res.status(500).json({ message: "Falha ao atualizar assinatura" });
    }
  });
  app2.post("/api/admin/shopowners", isAdmin, async (req, res) => {
    try {
      const { username, password, email, name, storeName, whatsappNumber } = req.body;
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name,
        role: "shopowner"
      });
      const slug = username.toLowerCase().replace(/[^a-z0-9]/g, "");
      const store = await storage.createStore({
        name: storeName,
        whatsappNumber,
        slug,
        logoUrl: null,
        instagramUrl: null,
        facebookUrl: null,
        showSocialMedia: false
      });
      const shopOwner = await storage.createShopOwner({
        userId: user.id,
        storeId: store.id,
        subscriptionStatus: "trial",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
        // 30 dias trial
        productLimit: 30
        // Limite padrÃ£o de 30 produtos
      });
      return res.json({ user, store, shopOwner });
    } catch (error) {
      console.error("Erro ao criar lojista:", error);
      return res.status(500).json({ message: "Falha ao criar lojista" });
    }
  });
  app2.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usu\xE1rio n\xE3o encontrado" });
      }
      if (user.role === "shopowner") {
        const shopOwner = await storage.getShopOwnerByUserId(userId);
        if (shopOwner) {
          await storage.deleteShopOwnerByUserId(userId);
          if (shopOwner.storeId) {
            await storage.deleteStore(shopOwner.storeId);
          }
        }
      }
      await storage.deleteUser(userId);
      return res.json({ message: "Usu\xE1rio e recursos associados exclu\xEDdos com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir usu\xE1rio:", error);
      return res.status(500).json({ message: "Falha ao excluir usu\xE1rio" });
    }
  });
  app2.get("/api/admin/stats", isAdmin, async (_req, res) => {
    try {
      const allStores = await storage.getStores();
      const activeStores = allStores.filter((store) => store.active).length;
      const shopOwners2 = await storage.getUsersByRole("shopowner");
      const customers2 = await storage.getUsersByRole("customer");
      const admins = await storage.getUsersByRole("admin");
      let totalProducts = 0;
      await Promise.all(allStores.map(async (store) => {
        const products2 = await storage.getProducts(store.id);
        totalProducts += products2.length;
      }));
      const orders2 = await storage.getOrders();
      return res.json({
        stores: {
          total: allStores.length,
          active: activeStores,
          inactive: allStores.length - activeStores
        },
        users: {
          total: shopOwners2.length + customers2.length + admins.length,
          shopOwners: shopOwners2.length,
          customers: customers2.length,
          admins: admins.length
        },
        products: {
          total: totalProducts,
          average: allStores.length ? Math.round(totalProducts / allStores.length) : 0
        },
        orders: {
          total: orders2.length
        }
      });
    } catch (error) {
      console.error("Erro ao obter estat\xEDsticas:", error);
      return res.status(500).json({ message: "Falha ao obter estat\xEDsticas" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const storeConnections = {};
  wss.on("connection", (ws) => {
    console.log("Nova conex\xE3o WebSocket estabelecida");
    ws.on("message", (message) => {
      try {
        const messageStr = message.toString();
        if (!messageStr) {
          console.error("Mensagem WebSocket vazia recebida");
          return;
        }
        const data = JSON.parse(messageStr);
        if (data && data.type === "identify" && data.storeId) {
          const storeId = parseInt(data.storeId);
          if (!storeConnections[storeId]) {
            storeConnections[storeId] = [];
          }
          storeConnections[storeId].push(ws);
          ws.storeId = storeId;
          console.log(`Cliente WebSocket identificado para loja ${storeId}`);
          ws.on("close", () => {
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
        console.error("Erro ao processar mensagem WebSocket:", error);
      }
    });
  });
  app2.use((err, _req, res, _next) => {
    console.error("Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({
      message,
      error: process.env.NODE_ENV === "development" ? err.stack : void 0
    });
  });
  return httpServer;
}

// server/index.ts
init_auth();

// server/vite.ts
import express2 from "express";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { fileURLToPath } from "url";
import path2 from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var vite_config_default = defineConfig({
  server: {
    host: "0.0.0.0",
    // Permite acesso externo ao servidor
    port: 3e3,
    // Configuração explícita da porta para evitar conflitos
    hmr: {
      host: "0.0.0.0",
      clientPort: 443,
      // Configurado para HTTPS/WSS
      protocol: "wss"
      // WebSocket seguro para hot module replacement
    }
  },
  plugins: [
    react(),
    // Suporte para React
    themePlugin(),
    // Plugin para temas
    runtimeErrorOverlay()
    // Overlay de erros em tempo de execução
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "client", "src"),
      // Alias para o diretório src
      "@shared": path2.resolve(__dirname, "shared"),
      // Alias para recursos compartilhados
      "@assets": path2.resolve(__dirname, "attached_assets")
      // Alias para assets adicionais
    }
  },
  root: path2.resolve(__dirname, "client"),
  // Define o diretório raiz como client
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    // Diretório de saída
    emptyOutDir: true,
    // Limpa o diretório de saída antes do build
    sourcemap: true,
    // Habilita sourcemaps para depuração no navegador
    rollupOptions: {
      external: ["react-toastify"],
      // Exclui pacotes específicos do bundle final
      output: {
        format: "es"
        // Mantém o formato ES Modules para compatibilidade moderna
      }
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/index.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path3.dirname(__filename2);
var app = express3();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express3.json());
app.use(express3.urlencoded({ extended: true }));
app.use(cors({
  origin: ["http://localhost:3000", "https://katalogo.shop"],
  // Substituir pelos domínios do frontend
  credentials: true
  // Permitir envio de cookies
}));
var distPath = path3.resolve(__dirname2, "public");
var uploadsPath = path3.resolve(distPath, "uploads");
var ensureDirectoryExists = (directoryPath, description) => {
  if (!fs2.existsSync(directoryPath)) {
    console.warn(`Aviso: O diret\uFFFDrio ${description} (${directoryPath}) n\uFFFDo existe. Criando-o agora.`);
    fs2.mkdirSync(directoryPath, { recursive: true });
  }
};
ensureDirectoryExists(distPath, "public");
ensureDirectoryExists(uploadsPath, "uploads");
app.use(express3.static(distPath, {
  setHeaders: (res, filePath) => {
    console.log(`Servindo arquivo est\uFFFDtico: ${filePath}`);
  }
}));
app.use("/uploads", express3.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    console.log(`Servindo arquivo de upload: ${filePath}`);
  }
}));
app.use((req, res, next) => {
  const start = Date.now();
  const routePath = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (routePath.startsWith("/api")) {
      let logLine = `${req.method} ${routePath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\uFFFD";
      }
      log(logLine);
    }
  });
  next();
});
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Erro no servidor:", err);
  res.status(status).json({ message });
});
(async () => {
  try {
    console.log("Inicializando banco de dados...");
    const { initializeDatabase: initializeDatabase2 } = await Promise.resolve().then(() => (init_db_init(), db_init_exports));
    await initializeDatabase2();
    log("Database initialized with default data");
    console.log("Executando migra\uFFFD\uFFFDo de limite de produtos...");
    const { addProductLimitColumn: addProductLimitColumn2 } = await Promise.resolve().then(() => (init_add_product_limit(), add_product_limit_exports));
    await addProductLimitColumn2();
    log("Product limit migration executed");
    console.log("Configurando autentica\uFFFD\uFFFDo...");
    setupAuth(app);
    console.log("Registrando rotas...");
    const server = await registerRoutes(app);
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api") || req.path.includes(".")) {
        return res.status(404).send("Not found");
      }
      console.log(`Rota SPA: Servindo index.html para ${req.path}`);
      res.sendFile(path3.join(__dirname2, "../dist", "index.html"));
    });
    const port = await getPort({ port: parseInt(process.env.PORT || "3000", 10) });
    server.listen(
      {
        port,
        host: "0.0.0.0"
      },
      () => {
        log(`Server running at http://0.0.0.0:${port}`);
      }
    );
  } catch (err) {
    console.error("Erro ao iniciar o servidor:", err);
  }
})();
