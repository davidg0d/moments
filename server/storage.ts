import { 
  type Product, type InsertProduct,
  type Store, type InsertStore,
  type Category, type InsertCategory,
  type User, type InsertUser,
  type ShopOwner, type InsertShopOwner,
  type Customer, type InsertCustomer,
  type Cart, type InsertCart,
  type CartItem, type InsertCartItem,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem
} from "@shared/schema";
import session from "express-session";
import { DatabaseStorage } from './db-storage';

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Shop Owner methods específicos
  deleteShopOwner(id: number): Promise<boolean>;
  deleteShopOwnerByUserId(userId: number): Promise<boolean>;

  // Stores
  getStore(id: number): Promise<Store | undefined>;
  getStores(): Promise<Store[]>;
  getStoreByOwner(ownerId: number): Promise<Store | undefined>;
  getStoreBySlug(slug: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: Partial<Store>): Promise<Store | undefined>;
  deleteStore(id: number): Promise<boolean>;

  // Categories
  getCategories(storeId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Products
  getProducts(storeId?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Shop Owners
  getShopOwner(id: number): Promise<ShopOwner | undefined>;
  getShopOwnerByUserId(userId: number): Promise<ShopOwner | undefined>;
  createShopOwner(shopOwner: InsertShopOwner): Promise<ShopOwner>;
  updateShopOwnerSubscription(id: number, data: Partial<ShopOwner>): Promise<ShopOwner | undefined>;

  // Customers
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByUserId(userId: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer | undefined>;

  // Carts
  getCart(id: number): Promise<Cart | undefined>;
  getCartByCustomer(customerId: number, storeId: number): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  deleteCart(id: number): Promise<boolean>;

  // Cart Items
  getCartItems(cartId: number): Promise<CartItem[]>;
  getCartItem(id: number): Promise<CartItem | undefined>;
  createCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  deleteCartItem(id: number): Promise<boolean>;

  // Orders
  getOrders(storeId?: number, customerId?: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderWhatsappStatus(id: number, sent: boolean): Promise<Order | undefined>;

  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Stripe-related methods
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, info: { customerId: string, subscriptionId: string }): Promise<ShopOwner | undefined>;

  // Session
  sessionStore: session.Store;
}

// Utilize o banco de dados para armazenamento mais confiável
export const storage = new DatabaseStorage();