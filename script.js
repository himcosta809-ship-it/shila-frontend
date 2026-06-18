/* =========================================================
   SHILA HANDICRAFT — script.js
   All front-end functionality for index.html.

   localStorage keys (shared with admin.html):
     shila_products  -> product list (admin can edit)
     shila_cart      -> cart items
     shila_wishlist  -> array of liked product ids
     shila_messages  -> contact form submissions
   ========================================================= */

/* ---------------------------------------------------------
   1. DEFAULT PRODUCT DATA
   Each product:
     id, name, category, price (NPR), description,
     image  -> file in /assets (or null),
     video  -> file in /assets (optional),
     poster -> poster image for a video,
     color  -> background colour used when there is no photo
   --------------------------------------------------------- */
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Granny Square Halter Top",
    category: "Crochet",
    price: 1800,
    description: "Boho fringe halter in white, sky blue and mustard. Hand-crocheted, one size.",
    image: "assets/crochet-halter-top.jpg",
    color: "#FFB6C1"
  },
  {
    id: 2,
    name: "Crochet Barefoot Sandals",
    category: "Crochet",
    price: 950,
    description: "Delicate flower foot jewellery for beaches and weddings. Sold as a pair.",
    image: "assets/barefoot-sandals.jpg",
    color: "#FFE4EE"
  },
  {
    id: 3,
    name: "Cute Octopus Keyring",
    category: "Crochet",
    price: 350,
    description: "Squishy amigurumi octopus bag charm. Pick any colour you love.",
    image: "assets/octopus-keyring.jpg",
    video: "assets/video-2.mp4",
    poster: "assets/octopus-keyring.jpg",
    color: "#C9A0A0"
  },
  {
    id: 4,
    name: "Blue Daisy Choker & Earring Set",
    category: "Jewelry",
    price: 1200,
    description: "Hand-beaded daisy choker with matching hoop earrings. A full set.",
    image: null,
    video: "assets/video-1.mp4",
    poster: "assets/video-1-poster.jpg",
    color: "#FFB6C1"
  },
  {
    id: 5,
    name: "Beaded Daisy Hair Pin",
    category: "Accessories",
    price: 600,
    description: "Tiny white-and-gold beaded daisies on a gold pin. Perfect for brides.",
    image: "assets/daisy-hairpin.jpg",
    color: "#FFE4EE"
  },
  {
    id: 6,
    name: "Pearl Bridal Hair Vine",
    category: "Accessories",
    price: 1500,
    description: "Flexible pearl-cluster vine that bends to any hairstyle. Wedding ready.",
    image: "assets/pearl-hair-vine.jpg",
    color: "#C9A0A0"
  },
  {
    id: 7,
    name: "Hand-knit Woolen Sweater",
    category: "Knitwear",
    price: 3500,
    description: "Cosy hand-knitted wool sweater. Made to order in your size and colour.",
    image: null,
    color: "#D4537E"
  },
  {
    id: 8,
    name: "Beaded Flower Ring",
    category: "Jewelry",
    price: 250,
    description: "Adjustable seed-bead flower ring. Mix and match the colours.",
    image: null,
    color: "#FFB6C1"
  },
  {
    id: 9,
    name: "Beaded Daisy Earrings",
    category: "Jewelry",
    price: 450,
    description: "Lightweight daisy drop earrings, hand-beaded one petal at a time.",
    image: null,
    color: "#C9A0A0"
  },
  {
    id: 10,
    name: "Crochet Tote Bag",
    category: "Crochet",
    price: 1600,
    description: "Roomy everyday tote crocheted in soft cotton. Holds more than it looks.",
    image: null,
    color: "#FFE4EE"
  }
];

/* ---------------------------------------------------------
   2. STATE + STORAGE HELPERS
   --------------------------------------------------------- */
const STORE = {
  products: "shila_products",
  cart: "shila_cart",
  wishlist: "shila_wishlist",
  messages: "shila_messages"
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

// Products: use admin-edited list if present, otherwise the defaults.
let products = load(STORE.products, null);
if (!products) {
  products = DEFAULT_PRODUCTS;
  save(STORE.products, products);
}

let cart = load(STORE.cart, []);          // [{id, qty}]
let wishlist = load(STORE.wishlist, []);  // [id, id, ...]
let activeCategory = "All";
let searchTerm = "";

/* ---------------------------------------------------------
   3. SHORTHAND HELPERS
   --------------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const npr = (n) => "NPR " + Number(n).toLocaleString("en-IN");
const findProduct = (id) => products.find((p) => p.id === id);

/* ---------------------------------------------------------
   4. CATEGORIES (built from product data)
   --------------------------------------------------------- */
const CATEGORY_ICONS = {
  Crochet: "\uD83E\uDDF6",      // yarn
  Jewelry: "\uD83D\uDC8D",      // ring
  Knitwear: "\uD83E\uDDE3",     // scarf
  Accessories: "\uD83C\uDF38"   // blossom
};

function getCategories() {
  return [...new Set(products.map((p) => p.category))];
}

function renderCategories() {
  const grid = $("#categoryGrid");
  grid.innerHTML = "";
  getCategories().forEach((cat) => {
    const count = products.filter((p) => p.category === cat).length;
    const card = document.createElement("div");
    card.className = "category-card reveal";
    card.innerHTML = `
      <div class="category-thumb" style="background:${tint(cat)}">
        <span aria-hidden="true">${CATEGORY_ICONS[cat] || "\u2727"}</span>
      </div>
      <h3>${cat}</h3>
      <p class="cat-count">${count} item${count === 1 ? "" : "s"}</p>
      <button class="cat-browse" data-cat="${cat}">Browse</button>
    `;
    grid.appendChild(card);
  });

  // Browse buttons jump to shop filtered to that category
  $$(".cat-browse").forEach((b) =>
    b.addEventListener("click", () => {
      setCategory(b.dataset.cat);
      $("#shop").scrollIntoView({ behavior: "smooth" });
    })
  );
}

// Soft tint per category for placeholders/thumbnails
function tint(cat) {
  const map = {
    Crochet: "linear-gradient(135deg,#FFE4EE,#FFB6C1)",
    Jewelry: "linear-gradient(135deg,#FFB6C1,#D4537E)",
    Knitwear: "linear-gradient(135deg,#C9A0A0,#D4537E)",
    Accessories: "linear-gradient(135deg,#FFF5F7,#FFE4EE)"
  };
  return map[cat] || "linear-gradient(135deg,#FFE4EE,#FFB6C1)";
}

/* ---------------------------------------------------------
   5. FILTER BUTTONS
   --------------------------------------------------------- */
function renderFilters() {
  const bar = $("#filterBar");
  bar.innerHTML = "";
  ["All", ...getCategories()].forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (cat === activeCategory ? " active" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => setCategory(cat));
    bar.appendChild(btn);
  });
}

function setCategory(cat) {
  activeCategory = cat;
  renderFilters();
  renderProducts();
}

/* ---------------------------------------------------------
   6. PRODUCT GRID
   --------------------------------------------------------- */
function visibleProducts() {
  return products.filter((p) => {
    const catOk = activeCategory === "All" || p.category === activeCategory;
    const searchOk = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return catOk && searchOk;
  });
}

function mediaMarkup(p) {
  if (p.video) {
    return `<video src="${p.video}" poster="${p.poster || ""}" muted loop playsinline
              onmouseover="this.play()" onmouseout="this.pause()"></video>`;
  }
  if (p.image) {
    return `<img src="${p.image}" alt="${p.name}" loading="lazy" />`;
  }
  // No photo yet -> colour placeholder with the brand mark
  return `<div class="product-placeholder" style="background:${tint(p.category)}">&#10047;</div>`;
}

function renderProducts() {
  const grid = $("#productGrid");
  const list = visibleProducts();
  grid.innerHTML = "";

  $("#emptyState").hidden = list.length !== 0;

  list.forEach((p) => {
    const liked = wishlist.includes(p.id);
    const card = document.createElement("article");
    card.className = "product-card reveal";
    card.innerHTML = `
      <div class="product-media">
        <span class="product-tag">${p.category}</span>
        <button class="wishlist-btn ${liked ? "active" : ""}" data-id="${p.id}"
                aria-label="${liked ? "Remove from" : "Add to"} wishlist">
          ${liked ? "&#10084;" : "&#9825;"}
        </button>
        ${mediaMarkup(p)}
      </div>
      <div class="product-body">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-foot">
          <span class="product-price">${npr(p.price)}</span>
          <button class="add-btn" data-id="${p.id}">Add to Cart</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Wire up the new buttons
  $$(".add-btn").forEach((b) =>
    b.addEventListener("click", () => addToCart(Number(b.dataset.id)))
  );
  $$(".wishlist-btn").forEach((b) =>
    b.addEventListener("click", () => toggleWishlist(Number(b.dataset.id)))
  );

  observeReveals();
}

/* ---------------------------------------------------------
   7. WISHLIST
   --------------------------------------------------------- */
function toggleWishlist(id) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter((x) => x !== id);
  } else {
    wishlist.push(id);
    showToast("Saved to your wishlist \u2764");
  }
  save(STORE.wishlist, wishlist);
  renderProducts();
}

/* ---------------------------------------------------------
   8. CART
   --------------------------------------------------------- */
function addToCart(id) {
  const line = cart.find((c) => c.id === id);
  if (line) line.qty += 1;
  else cart.push({ id, qty: 1 });
  save(STORE.cart, cart);
  updateCartCount();
  renderCart();
  showToast("Added to cart \u2728");
}

function changeQty(id, delta) {
  const line = cart.find((c) => c.id === id);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter((c) => c.id !== id);
  save(STORE.cart, cart);
  updateCartCount();
  renderCart();
}

function removeLine(id) {
  cart = cart.filter((c) => c.id !== id);
  save(STORE.cart, cart);
  updateCartCount();
  renderCart();
}

function cartSubtotal() {
  return cart.reduce((sum, c) => {
    const p = findProduct(c.id);
    return p ? sum + p.price * c.qty : sum;
  }, 0);
}

function updateCartCount() {
  const count = cart.reduce((n, c) => n + c.qty, 0);
  $("#cartCount").textContent = count;
}

function lineMedia(p) {
  if (p.video) return `<video src="${p.video}" poster="${p.poster || ""}" muted></video>`;
  if (p.image) return `<img src="${p.image}" alt="${p.name}" />`;
  return `<div style="width:100%;height:100%;background:${tint(p.category)};display:grid;place-items:center;">&#10047;</div>`;
}

function renderCart() {
  const wrap = $("#cartItems");
  wrap.innerHTML = "";
  const empty = cart.length === 0;
  $("#cartEmpty").hidden = !empty;
  $("#cartFoot").hidden = empty;

  cart.forEach((c) => {
    const p = findProduct(c.id);
    if (!p) return;
    const line = document.createElement("div");
    line.className = "cart-line";
    line.innerHTML = `
      <div class="cart-line-media">${lineMedia(p)}</div>
      <div class="cart-line-info">
        <div class="cart-line-name">${p.name}</div>
        <div class="cart-line-price">${npr(p.price)}</div>
        <div class="qty-row">
          <button class="qty-btn" data-id="${p.id}" data-delta="-1" aria-label="Decrease quantity">&minus;</button>
          <span class="qty-num">${c.qty}</span>
          <button class="qty-btn" data-id="${p.id}" data-delta="1" aria-label="Increase quantity">+</button>
          <button class="line-remove" data-id="${p.id}">Remove</button>
        </div>
      </div>
    `;
    wrap.appendChild(line);
  });

  $$(".qty-btn").forEach((b) =>
    b.addEventListener("click", () => changeQty(Number(b.dataset.id), Number(b.dataset.delta)))
  );
  $$(".line-remove").forEach((b) =>
    b.addEventListener("click", () => removeLine(Number(b.dataset.id)))
  );

  $("#cartSubtotal").textContent = npr(cartSubtotal());
}

/* Cart drawer open/close */
function openCart() {
  $("#cartDrawer").classList.add("open");
  $("#cartDrawer").setAttribute("aria-hidden", "false");
  showOverlay();
}
function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  hideOverlay();
}

/* Shared overlay */
function showOverlay() {
  const o = $("#overlay");
  o.hidden = false;
  requestAnimationFrame(() => o.classList.add("show"));
}
function hideOverlay() {
  const o = $("#overlay");
  o.classList.remove("show");
  setTimeout(() => (o.hidden = true), 300);
}

/* ---------------------------------------------------------
   9. CHECKOUT MODAL
   --------------------------------------------------------- */
function openCheckout() {
  if (cart.length === 0) {
    showToast("Your cart is empty");
    return;
  }
  const items = $("#modalItems");
  items.innerHTML = "";
  cart.forEach((c) => {
    const p = findProduct(c.id);
    if (!p) return;
    const row = document.createElement("div");
    row.className = "modal-line";
    row.innerHTML = `<span>${p.name} &times; ${c.qty}</span><span>${npr(p.price * c.qty)}</span>`;
    items.appendChild(row);
  });
  $("#modalTotal").textContent = npr(cartSubtotal());
  $("#checkoutModal").hidden = false;
}
function closeCheckout() { $("#checkoutModal").hidden = true; }

function confirmOrder() {
  closeCheckout();
  cart = [];
  save(STORE.cart, cart);
  updateCartCount();
  renderCart();
  closeCart();
  showToast("Order placed! We'll be in touch \uD83D\uDC95");
}

/* ---------------------------------------------------------
   10. CONTACT FORM VALIDATION
   --------------------------------------------------------- */
function validateContact() {
  const name = $("#cfName");
  const email = $("#cfEmail");
  const message = $("#cfMessage");
  let ok = true;

  // reset
  ["Name", "Email", "Message"].forEach((f) => {
    $("#err" + f).textContent = "";
    $("#cf" + f).parentElement.classList.remove("invalid");
  });

  if (name.value.trim() === "") {
    setError("Name", "Please enter your name.");
    ok = false;
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email.value.trim() === "") {
    setError("Email", "Please enter your email.");
    ok = false;
  } else if (!emailRe.test(email.value.trim())) {
    setError("Email", "That email doesn't look right.");
    ok = false;
  }
  if (message.value.trim().length < 5) {
    setError("Message", "Please write a short message.");
    ok = false;
  }
  return ok;
}

function setError(field, msg) {
  $("#err" + field).textContent = msg;
  $("#cf" + field).parentElement.classList.add("invalid");
}

function submitContact() {
  $("#formSuccess").hidden = true;
  if (!validateContact()) return;

  // Save the message so the admin panel can read it
  const messages = load(STORE.messages, []);
  messages.push({
    id: Date.now(),
    name: $("#cfName").value.trim(),
    email: $("#cfEmail").value.trim(),
    message: $("#cfMessage").value.trim(),
    date: new Date().toLocaleString(),
    read: false
  });
  save(STORE.messages, messages);

  $("#cfName").value = "";
  $("#cfEmail").value = "";
  $("#cfMessage").value = "";
  $("#formSuccess").hidden = false;
}

/* ---------------------------------------------------------
   11. TOAST
   --------------------------------------------------------- */
let toastTimer;
function showToast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => (t.hidden = true), 300);
  }, 2200);
}

/* ---------------------------------------------------------
   12. SCROLL REVEAL (Intersection Observer)
   --------------------------------------------------------- */
let revealObserver;
function observeReveals() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            revealObserver.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
  }
  $$(".reveal:not(.visible)").forEach((el) => revealObserver.observe(el));
}

/* ---------------------------------------------------------
   13. NAV: smooth scroll, hamburger, cart triggers
   --------------------------------------------------------- */
function initNav() {
  // Smooth scroll + close mobile menu
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
        $("#navLinks").classList.remove("open");
        $("#hamburger").classList.remove("open");
        $("#hamburger").setAttribute("aria-expanded", "false");
      }
    });
  });

  // Hamburger
  $("#hamburger").addEventListener("click", () => {
    const open = $("#navLinks").classList.toggle("open");
    $("#hamburger").classList.toggle("open", open);
    $("#hamburger").setAttribute("aria-expanded", String(open));
  });

  $("#shopNowBtn").addEventListener("click", () =>
    $("#shop").scrollIntoView({ behavior: "smooth" })
  );

  // Cart open/close
  $("#cartBtn").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  $("#continueBtn").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);

  // Checkout
  $("#checkoutBtn").addEventListener("click", openCheckout);
  $("#modalClose").addEventListener("click", closeCheckout);
  $("#confirmOrderBtn").addEventListener("click", confirmOrder);
  $("#checkoutModal").addEventListener("click", (e) => {
    if (e.target.id === "checkoutModal") closeCheckout();
  });

  // Search (live)
  $("#searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderProducts();
  });

  // Contact
  $("#contactSend").addEventListener("click", submitContact);

  // Escape closes drawers/modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCart();
      closeCheckout();
    }
  });
}

/* ---------------------------------------------------------
   14. INIT
   --------------------------------------------------------- */
function init() {
  $("#year").textContent = new Date().getFullYear();
  renderCategories();
  renderFilters();
  renderProducts();
  renderCart();
  updateCartCount();
  initNav();
  observeReveals();

  // Tag a few static sections for the reveal animation
  $$(".section-title, .highlight, .about-copy, .contact-info, .contact-form")
    .forEach((el) => el.classList.add("reveal"));
  observeReveals();
}

document.addEventListener("DOMContentLoaded", init);
