export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  shopId: string;
  purchases: number;
  createdAt: number;
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  niches: string[];
  purchases: number;
  reputation: number;
  createdAt: number;
  lastActivity: number;
}

export interface CartItem {
  productId: string;
  qty: number;
  addedAt: number;
}

export interface PurchaseRecord {
  id: string;
  shopId: string;
  productId: string;
  price: number;
  date: number;
}

const SHOPS_KEY = 'dn_shops';
const PRODUCTS_KEY = 'dn_products';
const CART_KEY = 'dn_cart';
const PURCHASES_KEY = 'dn_purchases';
const FAVS_KEY = 'dn_favs';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---- RATING ALGORITHM ----
  Score = (purchases * 3) + (reputation * 2) + (niches.length * 5)
  Dynamic decay: shops inactive >7 days lose 5% score per day
  Top 3 get rank badges
*/
export function calcShopScore(shop: Shop): number {
  const daysSinceActivity = (Date.now() - shop.lastActivity) / (1000 * 60 * 60 * 24);
  const decayFactor = daysSinceActivity > 7 ? Math.pow(0.95, daysSinceActivity - 7) : 1;
  const raw = (shop.purchases * 3) + (shop.reputation * 2) + (shop.niches.length * 5);
  return Math.round(raw * decayFactor);
}

/* ---- SHOPS ---- */
export function getShops(): Shop[] {
  return loadJSON<Shop[]>(SHOPS_KEY, defaultShops());
}
export function saveShops(shops: Shop[]) {
  saveJSON(SHOPS_KEY, shops);
}
export function getRankedShops(): (Shop & { score: number; rank: number })[] {
  const shops = getShops();
  const scored = shops.map(s => ({ ...s, score: calcShopScore(s) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s, i) => ({ ...s, rank: i + 1 }));
}

/* ---- PRODUCTS ---- */
export function getProducts(): Product[] {
  return loadJSON<Product[]>(PRODUCTS_KEY, defaultProducts());
}
export function saveProducts(products: Product[]) {
  saveJSON(PRODUCTS_KEY, products);
}
export function addProduct(p: Omit<Product, 'id' | 'purchases' | 'createdAt'>) {
  const products = getProducts();
  const newP: Product = { ...p, id: crypto.randomUUID(), purchases: 0, createdAt: Date.now() };
  saveProducts([...products, newP]);
  return newP;
}
export function updateProduct(id: string, updates: Partial<Product>) {
  const products = getProducts().map(p => p.id === id ? { ...p, ...updates } : p);
  saveProducts(products);
}
export function deleteProduct(id: string) {
  saveProducts(getProducts().filter(p => p.id !== id));
}

/* ---- CART ---- */
export function getCart(): CartItem[] {
  return loadJSON<CartItem[]>(CART_KEY, []);
}
export function addToCart(productId: string) {
  const cart = getCart();
  const existing = cart.find(i => i.productId === productId);
  if (existing) {
    saveJSON(CART_KEY, cart.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
  } else {
    saveJSON(CART_KEY, [...cart, { productId, qty: 1, addedAt: Date.now() }]);
  }
}
export function removeFromCart(productId: string) {
  saveJSON(CART_KEY, getCart().filter(i => i.productId !== productId));
}
export function clearCart() {
  saveJSON(CART_KEY, []);
}

/* ---- PURCHASES ---- */
export function getPurchases(): PurchaseRecord[] {
  return loadJSON<PurchaseRecord[]>(PURCHASES_KEY, []);
}
export function recordPurchase(rec: Omit<PurchaseRecord, 'id' | 'date'>) {
  const purchases = getPurchases();
  const newRec: PurchaseRecord = { ...rec, id: crypto.randomUUID(), date: Date.now() };
  saveJSON(PURCHASES_KEY, [...purchases, newRec]);

  const products = getProducts();
  const updatedProducts = products.map(p =>
    p.id === rec.productId ? { ...p, purchases: p.purchases + 1 } : p
  );
  saveProducts(updatedProducts);

  const shops = getShops();
  const updatedShops = shops.map(s =>
    s.id === rec.shopId
      ? { ...s, purchases: s.purchases + 1, lastActivity: Date.now() }
      : s
  );
  saveShops(updatedShops);
}

/* ---- FAVS ---- */
export function getFavs(): string[] {
  return loadJSON<string[]>(FAVS_KEY, []);
}
export function toggleFav(productId: string) {
  const favs = getFavs();
  const exists = favs.includes(productId);
  saveJSON(FAVS_KEY, exists ? favs.filter(f => f !== productId) : [...favs, productId]);
  return !exists;
}

/* ---- DEFAULTS ---- */
function defaultShops(): Shop[] {
  return [
    { id: 's1', name: 'ShadowVault', description: 'Эксклюзивные цифровые активы и данные', niches: ['данные', 'аккаунты', 'доступы'], purchases: 142, reputation: 91, createdAt: Date.now() - 86400000 * 30, lastActivity: Date.now() - 3600000 },
    { id: 's2', name: 'GhostMarket', description: 'Программное обеспечение и инструменты', niches: ['ПО', 'инструменты', 'скрипты'], purchases: 98, reputation: 78, createdAt: Date.now() - 86400000 * 20, lastActivity: Date.now() - 7200000 },
    { id: 's3', name: 'NullPointer', description: 'Уязвимости и эксплойты', niches: ['эксплойты', 'уязвимости'], purchases: 67, reputation: 85, createdAt: Date.now() - 86400000 * 45, lastActivity: Date.now() - 86400000 },
    { id: 's4', name: 'DeepLayer', description: 'Анонимные сервисы и VPN', niches: ['VPN', 'анонимность'], purchases: 203, reputation: 72, createdAt: Date.now() - 86400000 * 60, lastActivity: Date.now() - 1800000 },
    { id: 's5', name: 'ZeroTrace', description: 'Документы и удостоверения', niches: ['документы', 'верификация', 'ID'], purchases: 34, reputation: 65, createdAt: Date.now() - 86400000 * 10, lastActivity: Date.now() - 43200000 },
  ];
}

function defaultProducts(): Product[] {
  return [
    { id: 'p1', name: 'Пакет аккаунтов Premium', price: 0.012, category: 'данные', description: 'Верифицированные аккаунты соцсетей, пакет 50 шт', shopId: 's1', purchases: 89, createdAt: Date.now() - 86400000 * 5 },
    { id: 'p2', name: 'VPN x10 ключей', price: 0.008, category: 'анонимность', description: '10 ключей VPN с логированием OFF', shopId: 's4', purchases: 134, createdAt: Date.now() - 86400000 * 8 },
    { id: 'p3', name: 'SSH Brute Kit', price: 0.025, category: 'инструменты', description: 'Набор инструментов для брутфорса SSH', shopId: 's2', purchases: 45, createdAt: Date.now() - 86400000 * 12 },
    { id: 'p4', name: 'Zero-Day Exploit Pack', price: 0.18, category: 'эксплойты', description: 'Актуальные уязвимости 2024, подборка 5 шт', shopId: 's3', purchases: 12, createdAt: Date.now() - 86400000 * 3 },
    { id: 'p5', name: 'Анонимный E-Mail x20', price: 0.005, category: 'данные', description: 'Зарегистрированные анонимные почтовые ящики', shopId: 's1', purchases: 67, createdAt: Date.now() - 86400000 * 7 },
    { id: 'p6', name: 'RDP доступы US', price: 0.035, category: 'доступы', description: 'Актуальные RDP доступы к серверам США', shopId: 's1', purchases: 28, createdAt: Date.now() - 86400000 * 2 },
    { id: 'p7', name: 'Tor Relay Setup', price: 0.003, category: 'анонимность', description: 'Автоматический скрипт настройки Tor реле', shopId: 's4', purchases: 92, createdAt: Date.now() - 86400000 * 15 },
    { id: 'p8', name: 'Keylogger Pro', price: 0.042, category: 'ПО', description: 'Невидимый кейлоггер с удалённым сервером', shopId: 's2', purchases: 31, createdAt: Date.now() - 86400000 * 9 },
  ];
}

export const ALL_CATEGORIES = ['все', 'данные', 'анонимность', 'инструменты', 'эксплойты', 'доступы', 'ПО', 'документы', 'скрипты', 'аккаунты', 'VPN', 'ID'];
