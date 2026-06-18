// ═══════════════════════════════════════════════════════════════════════════
//  Shila Handicraft — script.js
//  All product data now comes from the backend API.
//  Cart and wishlist still use localStorage (per-device, which is fine).
// ═══════════════════════════════════════════════════════════════════════════

// ── CONFIG: point this at your Render/Railway backend URL after deployment ──
const API_BASE = 'https://shila-backend.onrender.com/api';// During local development change this to: 'http://localhost:5000/api'

// ── State ───────────────────────────────────────────────────────────────────
let allProducts = [];
let cart        = JSON.parse(localStorage.getItem('shila_cart') || '[]');
let wishlist    = JSON.parse(localStorage.getItem('shila_wishlist') || '[]');
let activeCategory = 'All';
let searchQuery    = '';

// ── Helpers ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const saveCart = () => localStorage.setItem('shila_cart', JSON.stringify(cart));
const saveWishlist = () => localStorage.setItem('shila_wishlist', JSON.stringify(wishlist));

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function formatPrice(n) {
  return 'NPR ' + Number(n).toLocaleString();
}

// ── Fetch products from API ──────────────────────────────────────────────────
async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('API error ' + res.status);
    allProducts = await res.json();
  } catch (err) {
    console.error('Could not load products from API:', err);
    // Fallback: show a friendly message in the shop grid
    allProducts = [];
    const grid = document.getElementById('products-grid');
    if (grid) grid.innerHTML = '<p class="no-products">Could not load products right now. Please refresh.</p>';
    return;
  }
  renderProducts();
  updateCartBadge();
}

// ── Render products ───────────────────────────────────────────────────────────
function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  let filtered = allProducts.filter(p => {
    const matchCat  = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="no-products">No products found.</p>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const inWish = wishlist.includes(p._id);
    const imgTag = p.image
      ? `<img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.parentElement.classList.add('no-img')">`
      : `<div class="placeholder-img"><span>🧶</span></div>`;
    return `
      <div class="product-card" data-id="${p._id}">
        <div class="product-image">
          ${imgTag}
          <button class="wishlist-btn ${inWish ? 'active' : ''}" onclick="toggleWishlist('${p._id}')" title="Wishlist">
            ${inWish ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-price">${formatPrice(p.price)}</p>
          <p class="product-desc">${p.description}</p>
          <button class="add-to-cart-btn" onclick="addToCart('${p._id}')">Add to Cart 🛒</button>
        </div>
      </div>`;
  }).join('');
}

// ── Category filter ───────────────────────────────────────────────────────────
function filterCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  renderProducts();
}

// ── Search ────────────────────────────────────────────────────────────────────
function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase().trim();
  renderProducts();
}

// ── Cart ──────────────────────────────────────────────────────────────────────
function addToCart(id) {
  const product = allProducts.find(p => p._id === id);
  if (!product) return;
  const existing = cart.find(i => i._id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ _id: id, name: product.name, price: product.price, image: product.image, qty: 1 });
  }
  saveCart();
  updateCartBadge();
  renderCartDrawer();
  showToast(`${product.name} added to cart ✓`);
}

function removeFromCart(id) {
  cart = cart.filter(i => i._id !== id);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function changeQty(id, delta) {
  const item = cart.find(i => i._id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCartDrawer();
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = cart.reduce((s, i) => s + i.qty, 0);
}

function openCart() {
  renderCartDrawer();
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('show');
}
function closeCart() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('show');
}

function renderCartDrawer() {
  const list = document.getElementById('cart-items-list');
  const total = document.getElementById('cart-total');
  if (!list) return;
  if (cart.length === 0) {
    list.innerHTML = '<p class="empty-cart">Your cart is empty 🛒</p>';
    if (total) total.textContent = formatPrice(0);
    return;
  }
  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<span class="cart-img-placeholder">🧶</span>'}
      </div>
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">${formatPrice(item.price)}</p>
        <div class="cart-qty-controls">
          <button onclick="changeQty('${item._id}', -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty('${item._id}', 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart('${item._id}')">🗑</button>
        </div>
      </div>
    </div>`).join('');
  const sum = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (total) total.textContent = formatPrice(sum);
}

// ── Wishlist ──────────────────────────────────────────────────────────────────
function toggleWishlist(id) {
  const idx = wishlist.indexOf(id);
  if (idx === -1) {
    wishlist.push(id);
    showToast('Added to wishlist ❤️');
  } else {
    wishlist.splice(idx, 1);
    showToast('Removed from wishlist');
  }
  saveWishlist();
  renderProducts();
}

// ── Checkout ──────────────────────────────────────────────────────────────────
function openCheckout() {
  if (cart.length === 0) { showToast('Your cart is empty!'); return; }
  closeCart();
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.removeAttribute('hidden');
    renderCheckoutSummary();
  }
}
function closeCheckout() {
  document.getElementById('checkout-modal')?.setAttribute('hidden', '');
}

function renderCheckoutSummary() {
  const summary = document.getElementById('checkout-summary');
  if (!summary) return;
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  summary.innerHTML = cart.map(i =>
    `<div class="checkout-item"><span>${i.name} × ${i.qty}</span><span>${formatPrice(i.price * i.qty)}</span></div>`
  ).join('') + `<div class="checkout-total"><strong>Total</strong><strong>${formatPrice(total)}</strong></div>`;
}

async function submitOrder(e) {
  e.preventDefault();
  const customerName = document.getElementById('checkout-name')?.value.trim();
  const email = document.getElementById('checkout-email')?.value.trim();
  const phone = document.getElementById('checkout-phone')?.value.trim();
  const address = document.getElementById('checkout-address')?.value.trim();

  if (!customerName || !email) { showToast('Please fill in your name and email.'); return; }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const items = cart.map(i => ({
    productId: i._id,
    name: i.name,
    price: i.price,
    quantity: i.qty,
    image: i.image
  }));

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName, email, phone, address, items, total })
    });
    if (!res.ok) throw new Error('Order failed');
    // Success
    cart = [];
    saveCart();
    updateCartBadge();
    closeCheckout();
    showToast('Order placed successfully! We\'ll contact you soon 🎉');
  } catch (err) {
    showToast('Could not place order. Please try again or contact us directly.');
  }
}

// ── Contact form ───────────────────────────────────────────────────────────────
async function submitContact(e) {
  e.preventDefault();
  const name    = document.getElementById('contact-name')?.value.trim();
  const email   = document.getElementById('contact-email')?.value.trim();
  const subject = document.getElementById('contact-subject')?.value.trim();
  const message = document.getElementById('contact-message')?.value.trim();
  if (!name || !email || !message) { showToast('Please fill all required fields.'); return; }

  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message })
    });
    if (!res.ok) throw new Error('Send failed');
    showToast('Message sent! We\'ll reply soon 💌');
    e.target.reset();
  } catch {
    showToast('Could not send message. Please try WhatsApp or Instagram instead.');
  }
}

// ── Nav / Mobile menu ─────────────────────────────────────────────────────────
function toggleMobileMenu() {
  document.getElementById('nav-links')?.classList.toggle('open');
}
function closeMobileMenu() {
  document.getElementById('nav-links')?.classList.remove('open');
}

// ── Smooth scroll for nav links ───────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      closeMobileMenu();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
  updateCartBadge();

  // Wire up filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => filterCategory(btn.dataset.cat));
  });

  // Wire up search
  document.getElementById('search-input')?.addEventListener('input', handleSearch);

  // Wire up contact form
  document.getElementById('contact-form')?.addEventListener('submit', submitContact);

  // Wire up checkout form
  document.getElementById('checkout-form')?.addEventListener('submit', submitOrder);
});
