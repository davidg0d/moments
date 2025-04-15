import { 
  products, type Product, type InsertProduct,
  stores, type Store, type InsertStore,
  categories, type Category, type InsertCategory,
  users, type User, type InsertUser,
  shopOwners, type ShopOwner, type InsertShopOwner,
  customers, type Customer, type InsertCustomer,
  carts, type Cart, type InsertCart,
  cartItems, type CartItem, type InsertCartItem,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, isNull, desc, or } from "drizzle-orm";
import pgSessionStore from "connect-pg-simple";
import { pool } from "./db";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Configurar session store para PostgreSQL
    const PgStore = pgSessionStore(session);
    this.sessionStore = new PgStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteShopOwner(id: number): Promise<boolean> {
    try {
      const result = await db.delete(shopOwners).where(eq(shopOwners.id, id));
      return !!result.rowCount;
    } catch (error) {
      console.error("Erro ao excluir perfil de lojista:", error);
      return false;
    }
  }

  async deleteShopOwnerByUserId(userId: number): Promise<boolean> {
    try {
      const result = await db.delete(shopOwners).where(eq(shopOwners.userId, userId));
      return !!result.rowCount;
    } catch (error) {
      console.error("Erro ao excluir perfil de lojista por userId:", error);
      return false;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Devido às restrições de chave estrangeira e ON DELETE CASCADE, 
      // excluir o usuário também excluirá automaticamente seus registros relacionados
      const result = await db.delete(users).where(eq(users.id, id));
      return !!result.rowCount;
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      return false;
    }
  }

  // Store methods
  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async getStores(): Promise<Store[]> {
    return await db.select().from(stores);
  }

  async getStoreByOwner(ownerId: number): Promise<Store | undefined> {
    const [shopOwner] = await db
      .select()
      .from(shopOwners)
      .where(eq(shopOwners.userId, ownerId));

    if (!shopOwner || !shopOwner.storeId) {
      return undefined;
    }

    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, shopOwner.storeId));

    return store;
  }

  async getStoreBySlug(slug: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.slug, slug));
    return store;
  }

  async createStore(store: InsertStore): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }

  async updateStore(id: number, store: Partial<Store>): Promise<Store | undefined> {
    console.log("Updating store in DB:", id, "with data:", store);
    const [updatedStore] = await db
      .update(stores)
      .set({ ...store, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning();
    return updatedStore;
  }

  async deleteStore(id: number): Promise<boolean> {
    const result = await db.delete(stores).where(eq(stores.id, id));
    return !!result.rowCount;
  }

  // Category methods
  async getCategories(storeId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.storeId, storeId));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<Category>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return !!result.rowCount;
  }

  // Product methods
  async getProducts(storeId?: number): Promise<Product[]> {
    if (storeId) {
      return await db.select().from(products).where(eq(products.storeId, storeId));
    }
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return !!result.rowCount;
  }

  // Shop Owner methods
  async getShopOwner(id: number): Promise<ShopOwner | undefined> {
    const [shopOwner] = await db.select().from(shopOwners).where(eq(shopOwners.id, id));
    return shopOwner;
  }

  async getShopOwnerByUserId(userId: number): Promise<ShopOwner | undefined> {
    const [shopOwner] = await db.select().from(shopOwners).where(eq(shopOwners.userId, userId));
    return shopOwner;
  }

  async createShopOwner(shopOwner: InsertShopOwner): Promise<ShopOwner> {
    const [newShopOwner] = await db.insert(shopOwners).values(shopOwner).returning();
    return newShopOwner;
  }

  async updateShopOwnerSubscription(id: number, data: Partial<ShopOwner>): Promise<ShopOwner | undefined> {
    const [updatedShopOwner] = await db
      .update(shopOwners)
      .set(data)
      .where(eq(shopOwners.id, id))
      .returning();
    return updatedShopOwner;
  }

  // Customer methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByUserId(userId: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.userId, userId));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  // Cart methods
  async getCart(id: number): Promise<Cart | undefined> {
    const [cart] = await db.select().from(carts).where(eq(carts.id, id));
    return cart;
  }

  async getCartByCustomer(customerId: number, storeId: number): Promise<Cart | undefined> {
    const [cart] = await db
      .select()
      .from(carts)
      .where(
        and(
          eq(carts.customerId, customerId),
          eq(carts.storeId, storeId)
        )
      );
    return cart;
  }

  async createCart(cart: InsertCart): Promise<Cart> {
    const [newCart] = await db.insert(carts).values(cart).returning();
    return newCart;
  }

  async deleteCart(id: number): Promise<boolean> {
    const result = await db.delete(carts).where(eq(carts.id, id));
    return !!result.rowCount;
  }

  // CartItem methods
  async getCartItems(cartId: number): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  }

  async getCartItem(id: number): Promise<CartItem | undefined> {
    const [cartItem] = await db.select().from(cartItems).where(eq(cartItems.id, id));
    return cartItem;
  }

  async createCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    const [newCartItem] = await db.insert(cartItems).values(cartItem).returning();
    return newCartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updatedCartItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedCartItem;
  }

  async deleteCartItem(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return !!result.rowCount;
  }

  // Order methods
  async getOrders(storeId?: number, customerId?: number): Promise<Order[]> {
    if (storeId && customerId) {
      return await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.storeId, storeId),
            eq(orders.customerId, customerId)
          )
        )
        .orderBy(desc(orders.createdAt));
    } else if (storeId) {
      return await db
        .select()
        .from(orders)
        .where(eq(orders.storeId, storeId))
        .orderBy(desc(orders.createdAt));
    } else if (customerId) {
      return await db
        .select()
        .from(orders)
        .where(eq(orders.customerId, customerId))
        .orderBy(desc(orders.createdAt));
    }
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderWhatsappStatus(id: number, sent: boolean): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ whatsappSent: sent })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // OrderItem methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  // Stripe methods
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<ShopOwner | undefined> {
    const [shopOwner] = await db
      .select()
      .from(shopOwners)
      .where(eq(shopOwners.userId, userId));

    if (!shopOwner) {
      return undefined;
    }

    const [updatedShopOwner] = await db
      .update(shopOwners)
      .set({
        stripeCustomerId: info.customerId,
        stripeSubscriptionId: info.subscriptionId,
        subscriptionStatus: "active"
      })
      .where(eq(shopOwners.id, shopOwner.id))
      .returning();

    return updatedShopOwner;
  }
}