// ═══════════════════════════════════════════════════════════════════════════
//  Shila Handicraft — script.js
//  Product data comes from the backend API. Cart uses localStorage.
//  Wired to match the real index.html element IDs.
// ═══════════════════════════════════════════════════════════════════════════

// ── CONFIG ────────────────────────────────────────────────────────────────
const API_BASE = 'https://shila-backend.onrender.com/api';
// During local development change this to: 'http://localhost:5000/api'

// ── State ─────────────────────────────────────────────────────────────────
let allProducts    = [];
let cart            = JSON.parse(localStorage.getItem('shila_cart') || '[]');
let activeCategory = 'All';
let searchQuery     = '';

// ── Helpers ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const saveCart = () => localStorage.setItem('shila_cart', JSON.stringify(cart));

function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { t.classList.remove('show'); t.hidden = true; }, 3000);
}

function formatPrice(n) {
  return 'NPR ' + Number(n).toLocaleString();
}

// ── Fetch products from API ──────────────────────────────────────────────
async function fetchProducts() {
  const grid = $('productGrid');
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('API error ' + res.status);
    allProducts = await res.json();
  } catch (err) {
    console.error('Could not load products from API:', err);
    allProducts = [];
    if (grid) grid.innerHTML = '<p class="empty-state">Could not load products right now. Please refresh.</p>';
    return;
  }
  renderCategories();
  renderFilterBar();
  renderProducts();
  updateCartUI();
}

// ── Categories ────────────────────────────────────────────────────────────
function getCategories() {
  return [...new Set(allProducts.map(p => p.category))].filter(Boolean);
}

function renderCategories() {
  const grid = $('categoryGrid');
  if (!grid) return;
  const cats = getCategories();
  if (!cats.length) { grid.innerHTML = ''; return; }
  grid.innerHTML = cats.map(cat => {
    const sample = allProducts.find(p => p.category === cat);
    return `
      <div class="category-card" data-cat="${cat}" onclick="filterCategory('${cat}'); document.getElementById('shop').scrollIntoView({behavior:'smooth'});">
        ${sample && sample.image
          ? `<img src="${sample.image}" alt="${cat}" loading="lazy">`
          : `<div class="placeholder-img"><span>&#129516;</span></div>`}
        <h3>${cat}</h3>
      </div>`;
  }).join('');
}

// ── Filter bar ────────────────────────────────────────────────────────────
function renderFilterBar() {
  const bar = $('filterBar');
  if (!bar) return;
  const cats = ['All', ...getCategories()];
  bar.innerHTML = cats.map(cat => `
    <button class="filter-btn${cat === activeCategory ? ' active' : ''}" data-cat="${cat}" onclick="filterCategory('${cat}')">${cat}</button>
  `).join('');
}

function filterCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('#filterBar .filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  renderProducts();
}

// ── Search ────────────────────────────────────────────────────────────────
function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase().trim();
  renderProducts();
}

// ── Render products ───────────────────────────────────────────────────────
function renderProducts() {
  const grid = $('productGrid');
  const emptyState = $('emptyState');
  if (!grid) return;

  const filtered = allProducts.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = searchQuery === '' ||
      (p.name || '').toLowerCase().includes(searchQuery) ||
      (p.description || '').toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  grid.innerHTML = filtered.map(p => {
    const imgTag = p.image
      ? `<img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.parentElement.classList.add('no-img')">`
      : `<div class="placeholder-img"><span>&#129516;</span></div>`;
    return `
      <div class="product-card" data-id="${p._id}">
        <div class="product-image">${imgTag}</div>
        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-price">${formatPrice(p.price)}</p>
          <p class="product-desc">${p.description || ''}</p>
          <button class="btn btn-primary full" onclick="addToCart('${p._id}')">Add to Cart &#128722;</button>
        </div>
      </div>`;
  }).join('');
}

// ── Cart ──────────────────────────────────────────────────────────────────
function addToCart(id) {
  const product = allProducts.find(p => p._id === id);
  if (!product) return;
  const existing = cart.find(i => i._id === id);
  if (existing) existing.qty++;
  else cart.push({ _id: id, name: product.name, price: product.price, image: product.image, qty: 1 });
  saveCart();
  updateCartUI();
  showToast(`${product.name} added to cart`);
}

function removeFromCart(id) {
  cart = cart.filter(i => i._id !== id);
  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(i => i._id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  updateCartUI();
}

function cartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}
function cartCount() {
  return cart.reduce((s, i) => s + i.qty, 0);
}

function updateCartUI() {
  const countEl = $('cartCount');
  if (countEl) countEl.textContent = cartCount();

  const itemsEl = $('cartItems');
  const emptyEl = $('cartEmpty');
  const footEl  = $('cartFoot');
  const subEl   = $('cartSubtotal');

  if (itemsEl) {
    if (cart.length === 0) {
      itemsEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      if (footEl) footEl.hidden = true;
    } else {
      if (emptyEl) emptyEl.hidden = true;
      if (footEl) footEl.hidden = false;
      itemsEl.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-img">
            ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<span class="cart-img-placeholder">&#129516;</span>'}
          </div>
          <div class="cart-item-info">
            <p class="cart-item-name">${item.name}</p>
            <p class="cart-item-price">${formatPrice(item.price)}</p>
            <div class="cart-qty-controls">
              <button onclick="changeQty('${item._id}', -1)">&minus;</button>
              <span>${item.qty}</span>
              <button onclick="changeQty('${item._id}', 1)">+</button>
              <button class="remove-btn" onclick="removeFromCart('${item._id}')">&#128465;</button>
            </div>
          </div>
        </div>`).join('');
    }
  }
  if (subEl) subEl.textContent = formatPrice(cartTotal());
}

function openCart() {
  updateCartUI();
  $('cartDrawer')?.setAttribute('aria-hidden', 'false');
  $('cartDrawer')?.classList.add('open');
  $('overlay').hidden = false;
}
function closeCart() {
  $('cartDrawer')?.setAttribute('aria-hidden', 'true');
  $('cartDrawer')?.classList.remove('open');
  $('overlay').hidden = true;
}

// ── Checkout modal ────────────────────────────────────────────────────────
function openCheckout() {
  if (cart.length === 0) { showToast('Your cart is empty!'); return; }
  closeCart();
  const modal = $('checkoutModal');
  if (modal) {
    modal.hidden = false;
    renderCheckoutSummary();
  }
}
function closeCheckout() {
  const modal = $('checkoutModal');
  if (modal) modal.hidden = true;
}

function renderCheckoutSummary() {
  const itemsEl = $('modalItems');
  const totalEl = $('modalTotal');
  if (!itemsEl) return;
  itemsEl.innerHTML = cart.map(i =>
    `<div class="modal-item"><span>${i.name} &times; ${i.qty}</span><span>${formatPrice(i.price * i.qty)}</span></div>`
  ).join('');
  if (totalEl) totalEl.textContent = formatPrice(cartTotal());
}

function confirmOrder() {
  // Demo checkout — order is not actually sent to the backend here,
  // matching the existing "message us on WhatsApp" demo flow.
  showToast('Thanks! Please confirm via WhatsApp to complete your order.');
  cart = [];
  saveCart();
  updateCartUI();
  closeCheckout();
}

// ── Contact form ──────────────────────────────────────────────────────────
async function submitContact() {
  const name    = $('cfName')?.value.trim();
  const email   = $('cfEmail')?.value.trim();
  const message = $('cfMessage')?.value.trim();

  const errName = $('errName'); const errEmail = $('errEmail'); const errMessage = $('errMessage');
  if (errName) errName.textContent = '';
  if (errEmail) errEmail.textContent = '';
  if (errMessage) errMessage.textContent = '';

  let valid = true;
  if (!name) { if (errName) errName.textContent = 'Please enter your name.'; valid = false; }
  if (!email) { if (errEmail) errEmail.textContent = 'Please enter your email.'; valid = false; }
  if (!message) { if (errMessage) errMessage.textContent = 'Please enter a message.'; valid = false; }
  if (!valid) return;

  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    if (!res.ok) throw new Error('Send failed');
    const success = $('formSuccess');
    if (success) success.hidden = false;
    $('cfName').value = ''; $('cfEmail').value = ''; $('cfMessage').value = '';
  } catch {
    showToast('Could not send message. Please try WhatsApp or Instagram instead.');
  }
}

// ── Mobile menu ───────────────────────────────────────────────────────────
function toggleMobileMenu() {
  $('navLinks')?.classList.toggle('open');
  const burger = $('hamburger');
  if (burger) burger.setAttribute('aria-expanded', $('navLinks')?.classList.contains('open') ? 'true' : 'false');
}
function closeMobileMenu() {
  $('navLinks')?.classList.remove('open');
  $('hamburger')?.setAttribute('aria-expanded', 'false');
}

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = $('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  fetchProducts();
  updateCartUI();

  $('searchInput')?.addEventListener('input', handleSearch);

  $('cartBtn')?.addEventListener('click', openCart);
  $('cartClose')?.addEventListener('click', closeCart);
  $('continueBtn')?.addEventListener('click', closeCart);
  $('overlay')?.addEventListener('click', closeCart);
  $('checkoutBtn')?.addEventListener('click', openCheckout);

  $('modalClose')?.addEventListener('click', closeCheckout);
  $('confirmOrderBtn')?.addEventListener('click', confirmOrder);

  $('shopNowBtn')?.addEventListener('click', () => $('shop')?.scrollIntoView({ behavior: 'smooth' }));

  $('hamburger')?.addEventListener('click', toggleMobileMenu);
  document.querySelectorAll('.nav-link').forEach(a => a.addEventListener('click', closeMobileMenu));

  $('contactSend')?.addEventListener('click', submitContact);
});
