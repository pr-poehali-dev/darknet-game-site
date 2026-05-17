import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import {
  getRankedShops, getProducts, addProduct, updateProduct, deleteProduct,
  getShops, addShop, updateShop, deleteShop,
  getCart, addToCart, removeFromCart, clearCart, getPurchases, recordPurchase,
  getFavs, toggleFav, ALL_CATEGORIES, SHOP_ICONS,
  type Shop, type Product, type CartItem
} from '@/lib/store';

type Page = 'home' | 'categories' | 'shops' | 'search' | 'panel' | 'shop_detail';

const usd = (n: number) => `$${n % 1 === 0 ? n : n.toFixed(2)}`;

export default function Index() {
  const [page, setPage] = useState<Page>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [tick, setTick] = useState(0);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    setCart(getCart());
    setFavs(getFavs());
  }, [tick]);

  const handleAddToCart = (productId: string) => { addToCart(productId); refresh(); };
  const handleRemoveCart = (productId: string) => { removeFromCart(productId); refresh(); };
  const handleFav = (productId: string) => { toggleFav(productId); refresh(); };
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const nav = (p: Page) => setPage(p);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d0d]">
      <aside className={`flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-52' : 'w-14'} bg-[#080808] border-r border-[#141414]`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#141414]">
          <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 relative" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)' }}>
            <span className="text-xs mono text-green-400">DN</span>
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>
          {sidebarOpen && (
            <div>
              <span className="mono text-xs text-[#444] tracking-widest block">DARKNET</span>
              <span className="mono text-[9px] text-[#2a2a2a] tracking-wider">v2.4.1</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {[
            { p: 'home' as Page, icon: 'LayoutDashboard', label: 'Главная' },
            { p: 'categories' as Page, icon: 'Grid3x3', label: 'Категории' },
            { p: 'shops' as Page, icon: 'Store', label: 'Магазины' },
            { p: 'search' as Page, icon: 'Search', label: 'Поиск' },
            { p: 'panel' as Page, icon: 'Package', label: 'Панель' },
          ].map(({ p, icon, label }) => (
            <button key={p} onClick={() => nav(p)} className={`nav-item w-full text-left ${page === p ? 'active' : ''}`} title={!sidebarOpen ? label : undefined}>
              <Icon name={icon} size={14} />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-[#141414]">
          <button onClick={() => setCartOpen(true)} className={`nav-item w-full text-left ${cartOpen ? 'active' : ''}`}>
            <Icon name="ShoppingCart" size={14} />
            {sidebarOpen && <span>Корзина</span>}
            {cartCount > 0 && (
              <span className="ml-auto mono text-[10px] bg-green-900/40 text-green-400 border border-green-800/40 px-1.5 py-0.5 rounded-sm animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <button onClick={() => setSidebarOpen(o => !o)} className="p-3 border-t border-[#141414] flex items-center justify-center text-[#2a2a2a] hover:text-[#555] transition-colors">
          <Icon name={sidebarOpen ? 'ChevronLeft' : 'ChevronRight'} size={14} />
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        {page === 'home' && <HomePage nav={nav} setSelectedShopId={setSelectedShopId} tick={tick} />}
        {page === 'categories' && <CategoriesPage onAdd={handleAddToCart} tick={tick} favs={favs} onFav={handleFav} />}
        {page === 'shops' && <ShopsPage onSelect={(id) => { setSelectedShopId(id); setPage('shop_detail'); }} tick={tick} />}
        {page === 'shop_detail' && selectedShopId && (
          <ShopDetailPage shopId={selectedShopId} onBack={() => setPage('shops')} onAdd={handleAddToCart} favs={favs} onFav={handleFav} tick={tick} />
        )}
        {page === 'search' && <SearchPage onAdd={handleAddToCart} favs={favs} onFav={handleFav} tick={tick} />}
        {page === 'panel' && <PanelPage tick={tick} refresh={refresh} />}
      </main>

      {cartOpen && (
        <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onRemove={handleRemoveCart}
          onCheckout={() => { clearCart(); refresh(); setCartOpen(false); }} refresh={refresh} tick={tick} />
      )}
    </div>
  );
}

/* ======================== HOME ======================== */
function HomePage({ nav, setSelectedShopId, tick }: { nav: (p: Page) => void; setSelectedShopId: (id: string) => void; tick: number }) {
  const ranked = getRankedShops();
  const products = getProducts();
  const purchases = getPurchases();
  const topProducts = [...products].sort((a, b) => b.purchases - a.purchases).slice(0, 3);

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-green-500 rounded-sm" style={{ boxShadow: '0 0 8px rgba(46,204,113,0.4)' }} />
          <h1 className="mono text-2xl font-semibold text-[#e8e8e8] tracking-tight">ДАШБОРД</h1>
        </div>
        <p className="mono text-xs text-[#2e2e2e] ml-4 tracking-wider">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'МАГАЗИНОВ', value: ranked.length, icon: 'Store', color: '#2ecc71' },
          { label: 'ТОВАРОВ', value: products.length, icon: 'Package', color: '#3498db' },
          { label: 'ПОКУПОК', value: purchases.length, icon: 'TrendingUp', color: '#f39c12' },
          { label: 'АКТИВНЫХ', value: ranked.filter(s => (Date.now() - s.lastActivity) < 86400000 * 3).length, icon: 'Activity', color: '#9b59b6' },
        ].map((s, i) => (
          <div key={i} className="dark-card p-4 rounded-sm animate-fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="mono text-[10px] text-[#2e2e2e] tracking-widest">{s.label}</span>
              <Icon name={s.icon} size={13} style={{ color: s.color + '44' }} />
            </div>
            <div className="stat-num" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="mono text-[10px] text-[#333] tracking-widest">ТОП МАГАЗИНОВ</span>
            <button onClick={() => nav('shops')} className="mono text-[10px] text-green-700 hover:text-green-400 transition-colors">все →</button>
          </div>
          <div className="space-y-2">
            {ranked.slice(0, 4).map((shop, i) => (
              <div key={shop.id} onClick={() => { setSelectedShopId(shop.id); nav('shop_detail'); }}
                className="dark-card p-3 rounded-sm cursor-pointer flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: `${0.2 + i * 0.06}s` }}>
                <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg flex-shrink-0" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                  {shop.icon}
                </div>
                <span className={`rank-badge flex-shrink-0 ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-default'}`}>#{shop.rank}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#ccc] truncate">{shop.name}</div>
                  <div className="rating-bar mt-1.5">
                    <div className="rating-bar-fill" style={{ width: `${Math.min(100, (shop.score / 900) * 100)}%` }} />
                  </div>
                </div>
                <span className="mono text-[11px] text-green-500">{shop.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="mono text-[10px] text-[#333] tracking-widest">HOT ТОВАРЫ</span>
            <button onClick={() => nav('categories')} className="mono text-[10px] text-green-700 hover:text-green-400 transition-colors">все →</button>
          </div>
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.id} className="dark-card p-3 rounded-sm flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${0.3 + i * 0.06}s` }}>
                <div className="w-8 h-8 rounded-sm bg-[#111] flex items-center justify-center border border-[#1a1a1a] flex-shrink-0">
                  <span className="text-base">{getCategoryEmoji(p.category)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#ccc] truncate">{p.name}</div>
                  <div className="mono text-[10px] text-[#3a3a3a]">{p.purchases} покупок</div>
                </div>
                <span className="mono text-[11px] text-green-500">{usd(p.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================== CATEGORIES ======================== */
function CategoriesPage({ onAdd, tick, favs, onFav }: { onAdd: (id: string) => void; tick: number; favs: string[]; onFav: (id: string) => void }) {
  const [activeCategory, setActiveCategory] = useState('все');
  const products = getProducts();
  const filtered = activeCategory === 'все' ? products : products.filter(p => p.category === activeCategory);
  const categories = ['все', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="p-8 animate-fade-in">
      <PageHeader title="КАТЕГОРИИ" subtitle={`${products.length} товаров`} />
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className="mono text-[10px] tracking-widest px-3 py-1.5 rounded-sm transition-all duration-200"
            style={activeCategory === c
              ? { background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.5)', color: '#2ecc71', boxShadow: '0 0 10px rgba(46,204,113,0.08)' }
              : { background: 'transparent', border: '1px solid #1e1e1e', color: '#3a3a3a' }
            }>
            {c.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((p, i) => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} isFav={favs.includes(p.id)} onFav={onFav} delay={i * 0.04} />
        ))}
      </div>
    </div>
  );
}

/* ======================== SHOPS ======================== */
function ShopsPage({ onSelect, tick }: { onSelect: (id: string) => void; tick: number }) {
  const ranked = getRankedShops();

  return (
    <div className="p-8 animate-fade-in">
      <PageHeader title="МАГАЗИНЫ" subtitle="по рейтингу" />
      <div className="mb-5 mono text-[10px] text-[#2e2e2e] tracking-wider p-3 rounded-sm" style={{ background: '#0a0a0a', borderLeft: '2px solid #1e1e1e' }}>
        РЕЙТИНГ = (покупки × 3) + (репутация × 2) + (ниши × 5) × коэффициент активности
      </div>
      <div className="space-y-3">
        {ranked.map((shop, i) => {
          const maxScore = ranked[0]?.score || 1;
          const barW = (shop.score / maxScore) * 100;
          const daysSince = Math.floor((Date.now() - shop.lastActivity) / (1000 * 60 * 60 * 24));
          return (
            <div key={shop.id} onClick={() => onSelect(shop.id)}
              className="cursor-pointer animate-fade-in rounded-sm overflow-hidden"
              style={{ animationDelay: `${i * 0.05}s`, background: '#0f0f0f', border: '1px solid #181818', transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#181818'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              <div className="p-4 flex items-start gap-4">
                <div className="w-12 h-12 rounded-sm flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
                  {shop.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`rank-badge ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-default'}`}>#{shop.rank}</span>
                      <span className="text-[#ddd] font-medium">{shop.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="mono text-[10px] text-[#2e2e2e]">{daysSince === 0 ? 'сегодня' : `${daysSince}д назад`}</span>
                      <span className="mono text-sm font-semibold" style={{ color: '#2ecc71', textShadow: '0 0 12px rgba(46,204,113,0.3)' }}>{shop.score}</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-[#3a3a3a] mb-3">{shop.description}</p>
                  <div className="flex items-center gap-4 mb-3">
                    <ScorePill icon="ShoppingBag" label="ПОКУПОК" value={shop.purchases} color="#2ecc71" />
                    <ScorePill icon="Shield" label="РЕПУТАЦИЯ" value={shop.reputation} color="#3498db" />
                    <ScorePill icon="Tag" label="НИШ" value={shop.niches.length} color="#9b59b6" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {shop.niches.map(n => <span key={n} className="tag">{n}</span>)}
                  </div>
                  <div className="rating-bar">
                    <div className="rating-bar-fill" style={{ width: `${barW}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ======================== SHOP DETAIL ======================== */
function ShopDetailPage({ shopId, onBack, onAdd, favs, onFav, tick }: {
  shopId: string; onBack: () => void; onAdd: (id: string) => void; favs: string[]; onFav: (id: string) => void; tick: number;
}) {
  const ranked = getRankedShops();
  const shop = ranked.find(s => s.id === shopId);
  const products = getProducts().filter(p => p.shopId === shopId);
  if (!shop) return null;

  return (
    <div className="p-8 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 mono text-[11px] text-[#3a3a3a] hover:text-[#aaa] mb-6 transition-colors">
        <Icon name="ArrowLeft" size={12} /> НАЗАД
      </button>
      <div className="rounded-sm mb-6 overflow-hidden" style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}>
        <div className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-sm flex items-center justify-center text-4xl flex-shrink-0" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
              {shop.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className={`rank-badge ${shop.rank === 1 ? 'rank-1' : shop.rank === 2 ? 'rank-2' : shop.rank === 3 ? 'rank-3' : 'rank-default'}`}>#{shop.rank}</span>
                <h1 className="text-xl text-[#e8e8e8] font-semibold">{shop.name}</h1>
              </div>
              <p className="text-[13px] text-[#444]">{shop.description}</p>
            </div>
            <span className="mono text-2xl font-bold" style={{ color: '#2ecc71', textShadow: '0 0 16px rgba(46,204,113,0.3)' }}>{shop.score}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatBox label="ПОКУПОК" value={shop.purchases} color="green" />
            <StatBox label="РЕПУТАЦИЯ" value={`${shop.reputation}%`} color="blue" />
            <StatBox label="НИШ" value={shop.niches.length} color="purple" />
          </div>
          <div className="rating-bar mb-3">
            <div className="rating-bar-fill" style={{ width: `${Math.min(100, (shop.score / 900) * 100)}%` }} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {shop.niches.map(n => <span key={n} className="tag">{n}</span>)}
          </div>
        </div>
      </div>
      <div className="mono text-[10px] text-[#2e2e2e] tracking-widest mb-4">ТОВАРЫ ({products.length})</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} isFav={favs.includes(p.id)} onFav={onFav} delay={i * 0.04} />
        ))}
        {products.length === 0 && <div className="mono text-[11px] text-[#2e2e2e]">нет товаров</div>}
      </div>
    </div>
  );
}

/* ======================== SEARCH ======================== */
function SearchPage({ onAdd, favs, onFav, tick }: { onAdd: (id: string) => void; favs: string[]; onFav: (id: string) => void; tick: number }) {
  const [query, setQuery] = useState('');
  const products = getProducts();
  const shops = getShops();

  const matchedProducts = query.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase()))
    : [];
  const matchedShops = query.length > 1
    ? shops.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.description.toLowerCase().includes(query.toLowerCase()) || s.niches.some(n => n.toLowerCase().includes(query.toLowerCase())))
    : [];

  return (
    <div className="p-8 animate-fade-in">
      <PageHeader title="ПОИСК" subtitle="товары и магазины" />
      <div className="relative mb-6 max-w-lg">
        <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2e2e2e]" />
        <input className="search-input pl-9" placeholder="Введите запрос..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      </div>

      {query.length > 1 && (
        <div className="animate-fade-in">
          {matchedProducts.length > 0 && (
            <div className="mb-6">
              <div className="mono text-[10px] text-[#2e2e2e] tracking-widest mb-3">ТОВАРЫ ({matchedProducts.length})</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchedProducts.map((p, i) => <ProductCard key={p.id} product={p} onAdd={onAdd} isFav={favs.includes(p.id)} onFav={onFav} delay={i * 0.03} />)}
              </div>
            </div>
          )}
          {matchedShops.length > 0 && (
            <div>
              <div className="mono text-[10px] text-[#2e2e2e] tracking-widest mb-3">МАГАЗИНЫ ({matchedShops.length})</div>
              <div className="space-y-2">
                {matchedShops.map(s => (
                  <div key={s.id} className="dark-card p-3 rounded-sm flex items-center gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <div className="text-sm text-[#ccc]">{s.name}</div>
                      <div className="mono text-[10px] text-[#3a3a3a]">{s.niches.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {matchedProducts.length === 0 && matchedShops.length === 0 && (
            <div className="mono text-[11px] text-[#2e2e2e]">ничего не найдено по «{query}»</div>
          )}
        </div>
      )}

      {query.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {ALL_CATEGORIES.filter(c => c !== 'все').slice(0, 8).map(c => (
            <button key={c} onClick={() => setQuery(c)} className="tag text-center hover:border-[#333] hover:text-[#777] transition-all">{c}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================== PANEL ======================== */
function PanelPage({ tick, refresh }: { tick: number; refresh: () => void }) {
  const [tab, setTab] = useState<'products' | 'shops'>('products');

  return (
    <div className="p-8 animate-fade-in">
      <PageHeader title="ПАНЕЛЬ" subtitle="управление товарами и магазинами" />
      <div className="flex gap-1 mb-6 p-1 rounded-sm" style={{ background: '#0a0a0a', border: '1px solid #161616', display: 'inline-flex' }}>
        {(['products', 'shops'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="mono text-[10px] tracking-widest px-4 py-2 rounded-sm transition-all duration-200"
            style={tab === t
              ? { background: '#1a1a1a', color: '#2ecc71', border: '1px solid #252525' }
              : { background: 'transparent', color: '#2e2e2e', border: '1px solid transparent' }
            }>
            {t === 'products' ? 'ТОВАРЫ' : 'МАГАЗИНЫ'}
          </button>
        ))}
      </div>
      {tab === 'products' && <ProductsPanel tick={tick} refresh={refresh} />}
      {tab === 'shops' && <ShopsPanel tick={tick} refresh={refresh} />}
    </div>
  );
}

function ProductsPanel({ tick, refresh }: { tick: number; refresh: () => void }) {
  const products = getProducts();
  const shops = getRankedShops();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', category: '', description: '', shopId: '' });

  const handleSubmit = () => {
    if (!form.name || !form.price || !form.shopId) return;
    if (editId) {
      updateProduct(editId, { name: form.name, price: parseFloat(form.price), category: form.category, description: form.description, shopId: form.shopId });
    } else {
      addProduct({ name: form.name, price: parseFloat(form.price), category: form.category, description: form.description, shopId: form.shopId });
    }
    setForm({ name: '', price: '', category: '', description: '', shopId: '' });
    setShowForm(false); setEditId(null); refresh();
  };

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, price: String(p.price), category: p.category, description: p.description, shopId: p.shopId });
    setEditId(p.id); setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="mono text-[10px] text-[#2e2e2e] tracking-widest">{products.length} ПОЗИЦИЙ</span>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', price: '', category: '', description: '', shopId: '' }); }} className="green-btn flex items-center gap-2">
          <Icon name="Plus" size={12} /> ДОБАВИТЬ
        </button>
      </div>

      {showForm && (
        <div className="rounded-sm mb-5 p-5 animate-fade-in" style={{ background: '#0e0e0e', border: '1px solid #252525' }}>
          <div className="mono text-[10px] text-[#333] tracking-widest mb-4">{editId ? 'РЕДАКТИРОВАТЬ ТОВАР' : 'НОВЫЙ ТОВАР'}</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <FormField label="НАЗВАНИЕ"><input className="search-input" placeholder="Название" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></FormField>
            <FormField label="ЦЕНА $"><input className="search-input" placeholder="49" type="number" step="1" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></FormField>
            <FormField label="КАТЕГОРИЯ"><input className="search-input" placeholder="данные" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></FormField>
            <FormField label="МАГАЗИН">
              <select className="search-input" value={form.shopId} onChange={e => setForm(f => ({ ...f, shopId: e.target.value }))}>
                <option value="">Выберите магазин</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="ОПИСАНИЕ"><textarea className="search-input resize-none" rows={2} placeholder="Описание" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FormField>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSubmit} className="green-btn">{editId ? 'СОХРАНИТЬ' : 'СОЗДАТЬ'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="ghost-btn">ОТМЕНА</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {products.map((p, i) => {
          const shop = shops.find(s => s.id === p.shopId);
          return (
            <div key={p.id} className="px-4 py-3 rounded-sm flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.02}s`, background: '#0c0c0c', border: '1px solid #161616' }}>
              <span className="text-base flex-shrink-0">{shop?.icon || '📦'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm text-[#ccc]">{p.name}</span>
                  <span className="tag">{p.category}</span>
                </div>
                <div className="mono text-[10px] text-[#2e2e2e]">{shop?.name || '—'} · {p.purchases} покупок</div>
              </div>
              <span className="mono text-sm text-green-500">{usd(p.price)}</span>
              <button onClick={() => handleEdit(p)} className="ghost-btn py-1 px-3 text-[10px]">EDIT</button>
              <button onClick={() => { deleteProduct(p.id); refresh(); }} className="mono text-[10px] px-3 py-1 rounded-sm transition-colors" style={{ color: '#e74c3c', border: '1px solid #2a1a1a' }}>DEL</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShopsPanel({ tick, refresh }: { tick: number; refresh: () => void }) {
  const shops = getRankedShops();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', niches: '', reputation: '70', icon: '🔐' });

  const handleSubmit = () => {
    if (!form.name) return;
    const niches = form.niches.split(',').map(n => n.trim()).filter(Boolean);
    if (editId) {
      updateShop(editId, { name: form.name, description: form.description, niches, reputation: parseInt(form.reputation), icon: form.icon });
    } else {
      addShop({ name: form.name, description: form.description, niches, reputation: parseInt(form.reputation), icon: form.icon });
    }
    setForm({ name: '', description: '', niches: '', reputation: '70', icon: '🔐' });
    setShowForm(false); setEditId(null); refresh();
  };

  const handleEdit = (s: typeof shops[0]) => {
    setForm({ name: s.name, description: s.description, niches: s.niches.join(', '), reputation: String(s.reputation), icon: s.icon });
    setEditId(s.id); setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="mono text-[10px] text-[#2e2e2e] tracking-widest">{shops.length} МАГАЗИНОВ</span>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '', niches: '', reputation: '70', icon: '🔐' }); }} className="green-btn flex items-center gap-2">
          <Icon name="Plus" size={12} /> СОЗДАТЬ
        </button>
      </div>

      {showForm && (
        <div className="rounded-sm mb-5 p-5 animate-fade-in" style={{ background: '#0e0e0e', border: '1px solid #252525' }}>
          <div className="mono text-[10px] text-[#333] tracking-widest mb-4">{editId ? 'РЕДАКТИРОВАТЬ МАГАЗИН' : 'НОВЫЙ МАГАЗИН'}</div>
          <div className="mb-4">
            <label className="mono text-[9px] text-[#2e2e2e] tracking-widest block mb-2">ИКОНКА</label>
            <div className="flex flex-wrap gap-2">
              {SHOP_ICONS.map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className="w-9 h-9 rounded-sm flex items-center justify-center text-xl transition-all duration-150"
                  style={form.icon === ic
                    ? { background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.4)' }
                    : { background: '#141414', border: '1px solid #1e1e1e' }
                  }>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <FormField label="НАЗВАНИЕ"><input className="search-input" placeholder="ShadowVault" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></FormField>
            <FormField label="РЕПУТАЦИЯ (0-100)"><input className="search-input" type="number" min="0" max="100" value={form.reputation} onChange={e => setForm(f => ({ ...f, reputation: e.target.value }))} /></FormField>
          </div>
          <FormField label="ОПИСАНИЕ"><input className="search-input" placeholder="Краткое описание" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FormField>
          <div className="mt-3">
            <FormField label="НИШИ (через запятую)"><input className="search-input" placeholder="данные, аккаунты, VPN" value={form.niches} onChange={e => setForm(f => ({ ...f, niches: e.target.value }))} /></FormField>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSubmit} className="green-btn">{editId ? 'СОХРАНИТЬ' : 'СОЗДАТЬ'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="ghost-btn">ОТМЕНА</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {shops.map((s, i) => (
          <div key={s.id} className="px-4 py-3 rounded-sm flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.03}s`, background: '#0c0c0c', border: '1px solid #161616' }}>
            <span className="text-2xl flex-shrink-0">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`rank-badge ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-default'}`}>#{s.rank}</span>
                <span className="text-sm text-[#ccc]">{s.name}</span>
              </div>
              <div className="mono text-[10px] text-[#2e2e2e]">{s.niches.join(', ')} · рейтинг {s.score}</div>
            </div>
            <span className="mono text-[11px] text-[#3a3a3a]">реп. {s.reputation}%</span>
            <button onClick={() => handleEdit(s)} className="ghost-btn py-1 px-3 text-[10px]">EDIT</button>
            <button onClick={() => { deleteShop(s.id); refresh(); }} className="mono text-[10px] px-3 py-1 rounded-sm transition-colors" style={{ color: '#e74c3c', border: '1px solid #2a1a1a' }}>DEL</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================== CART DRAWER ======================== */
function CartDrawer({ cart, onClose, onRemove, onCheckout, refresh, tick }: {
  cart: CartItem[]; onClose: () => void; onRemove: (id: string) => void; onCheckout: () => void; refresh: () => void; tick: number;
}) {
  const products = getProducts();
  const items = cart.map(ci => ({ ...ci, product: products.find(p => p.id === ci.productId) })).filter(i => i.product);
  const total = items.reduce((s, i) => s + (i.product!.price * i.qty), 0);

  const handleCheckout = () => {
    items.forEach(item => recordPurchase({ shopId: item.product!.shopId, productId: item.productId, price: item.product!.price * item.qty }));
    onCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="w-80 flex flex-col animate-slide-in-right" style={{ background: '#080808', borderLeft: '1px solid #141414' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #141414' }}>
          <span className="mono text-[11px] text-[#444] tracking-widest">КОРЗИНА</span>
          <button onClick={onClose} className="text-[#2e2e2e] hover:text-[#777] transition-colors"><Icon name="X" size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 && <div className="mono text-[11px] text-[#2e2e2e] text-center mt-8">корзина пуста</div>}
          {items.map(item => (
            <div key={item.productId} className="p-3 rounded-sm animate-fade-in" style={{ background: '#0e0e0e', border: '1px solid #181818' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#ccc] truncate">{item.product!.name}</div>
                  <div className="mono text-[10px] text-[#3a3a3a]">x{item.qty}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] text-green-500">{usd(item.product!.price * item.qty)}</span>
                  <button onClick={() => onRemove(item.productId)} className="text-[#2e2e2e] hover:text-[#e74c3c] transition-colors"><Icon name="Trash2" size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="p-4" style={{ borderTop: '1px solid #141414' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="mono text-[10px] text-[#3a3a3a] tracking-widest">ИТОГО</span>
              <span className="mono text-lg font-semibold text-green-400">{usd(total)}</span>
            </div>
            <button onClick={handleCheckout} className="green-btn w-full text-center animate-pulse-green">
              ПОДТВЕРДИТЬ ПОКУПКУ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================== SHARED ======================== */
function ProductCard({ product, onAdd, isFav, onFav, delay }: {
  product: Product; onAdd: (id: string) => void; isFav: boolean; onFav: (id: string) => void; delay: number;
}) {
  const [added, setAdded] = useState(false);
  const handleAdd = () => {
    onAdd(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  };

  return (
    <div className="product-card animate-fade-in" style={{ animationDelay: `${delay}s` }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0 mt-0.5">{getCategoryEmoji(product.category)}</span>
            <div className="min-w-0">
              <div className="text-sm text-[#ddd] mb-0.5 truncate">{product.name}</div>
              <div className="mono text-[10px] text-[#3a3a3a] leading-relaxed">{product.description}</div>
            </div>
          </div>
          <button onClick={() => onFav(product.id)}
            className="flex-shrink-0 transition-all duration-200 mt-0.5"
            style={{ color: isFav ? '#2ecc71' : '#222', filter: isFav ? 'drop-shadow(0 0 4px rgba(46,204,113,0.5))' : 'none' }}>
            <Icon name="Heart" size={12} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="tag">{product.category}</span>
          <span className="mono text-[10px] text-[#2e2e2e]">{product.purchases} покупок</span>
        </div>
        <div className="h-px bg-[#141414] mb-3" />
        <div className="flex items-center justify-between">
          <span className="mono text-base font-semibold text-green-400">{usd(product.price)}</span>
          <button onClick={handleAdd}
            className="green-btn text-[10px] py-1.5 px-3 flex items-center gap-1.5 transition-all duration-200"
            style={added ? { background: '#2ecc71', color: '#0d0d0d', borderColor: '#2ecc71' } : {}}>
            <Icon name={added ? 'Check' : 'ShoppingCart'} size={11} />
            {added ? 'ДОБАВЛЕНО' : 'В КОРЗИНУ'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-1 h-6 bg-green-600 rounded-sm" style={{ boxShadow: '0 0 6px rgba(46,204,113,0.3)' }} />
        <h1 className="mono text-lg font-semibold text-[#e8e8e8] tracking-tight">{title}</h1>
      </div>
      {subtitle && <p className="mono text-[10px] text-[#2e2e2e] ml-4 tracking-widest">{subtitle.toUpperCase()}</p>}
    </div>
  );
}

function ScorePill({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon name={icon} size={11} style={{ color }} />
      <span className="mono text-[10px] text-[#333]">{label}</span>
      <span className="mono text-[11px]" style={{ color }}>{value}</span>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: 'green' | 'blue' | 'yellow' | 'purple' }) {
  const colorMap = { green: 'rgba(46,204,113,0.06)', blue: 'rgba(52,152,219,0.06)', yellow: 'rgba(243,156,18,0.06)', purple: 'rgba(155,89,182,0.06)' };
  const textMap = { green: '#2ecc71', blue: '#3498db', yellow: '#f39c12', purple: '#9b59b6' };
  return (
    <div className="rounded-sm p-3 text-center" style={{ background: colorMap[color], border: `1px solid ${textMap[color]}15` }}>
      <div className="mono text-[9px] tracking-widest mb-1" style={{ color: textMap[color] + '66' }}>{label}</div>
      <div className="mono text-xl font-semibold" style={{ color: textMap[color] }}>{value}</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mono text-[9px] text-[#2e2e2e] tracking-widest block mb-1">{label}</label>
      {children}
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    данные: '💾', анонимность: '🌀', инструменты: '🔧', эксплойты: '⚡',
    доступы: '🗝️', ПО: '💻', документы: '📄', скрипты: '📝',
    аккаунты: '👤', VPN: '🛡️', ID: '🪪', верификация: '✅',
  };
  return map[category] || '📦';
}

