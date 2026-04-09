// ═══════════════════════════════════════════════════════
//  ECE FAREWELL GALLERY 2026 — script.js
//  Fetches media from Node/Express backend (Cloudinary)
// ═══════════════════════════════════════════════════════

// 🔧 Change to your deployed Render/Railway backend URL
const API_BASE = "https://farewell26.onrender.com";

// Cache all fetched items for client-side search
let allItems = [];

// ───────────────────────────────────────────────────────
//  POPUP
// ───────────────────────────────────────────────────────
function closePopup() {
  const el = document.getElementById("popup-overlay");
  el.style.transition = "opacity .3s";
  el.style.opacity = "0";
  setTimeout(() => el.classList.add("gone"), 320);
}

// ───────────────────────────────────────────────────────
//  GALLERY — load & render
// ───────────────────────────────────────────────────────
async function loadGallery() {
  setState("loading");

  try {
    const res = await fetch(`${API_BASE}/media`);
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    allItems = await res.json();
    renderGrid(allItems);
    updateCount(allItems.length);
  } catch (err) {
    console.error("Gallery load error:", err);
    setState("error", "Could not connect to the server. Please try again.");
  }
}

/** Render an array of items into the grid */
function renderGrid(items) {
  const grid = document.getElementById("gallery-grid");
  grid.innerHTML = "";

  if (!items.length) {
    setState("empty");
    return;
  }
  setState("grid");

  items.forEach((item, index) => {
    const card = buildCard(item, index + 1);
    grid.appendChild(card);
  });
}

/** Build a single media card element */
function buildCard(item, displayIndex) {
  const isImage = item.resource_type === "image";
  const card = document.createElement("div");
  card.className = "media-card";
  card.style.animationDelay = `${Math.min(index => index * 55, displayIndex * 55)}ms`;

  // Clean display name from public_id e.g. "farewell/photo_001" → "photo_001"
  const rawId = item.public_id || "";
  const displayName = rawId.includes("/") ? rawId.split("/").pop() : rawId;

  const thumbHtml = isImage
    ? `<img src="${item.secure_url}" alt="${displayName}" loading="lazy" />`
    : `<video src="${item.secure_url}" muted preload="none" onmouseenter="this.play()" onmouseleave="this.pause();this.currentTime=0"></video>`;

  const overlayHtml = isImage
    ? `<div class="thumb-overlay"><span class="zoom-icon">🔍</span></div>`
    : "";

  const vidBadge = !isImage ? `<span class="vid-badge">▶ VIDEO</span>` : "";

  const thumbClick = isImage
    ? `onclick="openLightbox('${item.secure_url}')"` : "";

  card.innerHTML = `
    <div class="card-thumb" ${thumbClick}>
      ${thumbHtml}
      ${overlayHtml}
      ${vidBadge}
    </div>
    <div class="card-body">
      <div class="card-info">
        <div class="card-index">#${String(displayIndex).padStart(3, "0")}</div>
        <div class="card-name" title="${displayName}">${displayName}</div>
      </div>
      <a class="btn-dl" href="${item.secure_url}" download="${displayName}" target="_blank" title="Download">
        ⬇ Save
      </a>
    </div>
  `;

  // Store search data attributes
  card.dataset.pid   = rawId.toLowerCase();
  card.dataset.index = String(displayIndex);

  return card;
}

// ───────────────────────────────────────────────────────
//  SEARCH / FILTER
// ───────────────────────────────────────────────────────
function filterGallery() {
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  const clearBtn = document.getElementById("clear-search");
  clearBtn.style.display = q ? "flex" : "none";

  if (!q) {
    // Show all
    document.querySelectorAll(".media-card").forEach(c => (c.style.display = ""));
    setState("grid");
    return;
  }

  let matches = 0;
  document.querySelectorAll(".media-card").forEach((card, i) => {
    const pid   = card.dataset.pid || "";
    const idx   = card.dataset.index || "";
    const match = pid.includes(q) || idx.includes(q);
    card.style.display = match ? "" : "none";
    if (match) matches++;
  });

  if (!matches) setState("empty");
  else setState("grid");
}

function clearSearch() {
  document.getElementById("search-input").value = "";
  document.getElementById("clear-search").style.display = "none";
  document.querySelectorAll(".media-card").forEach(c => (c.style.display = ""));
  setState("grid");
}

// ───────────────────────────────────────────────────────
//  LIGHTBOX
// ───────────────────────────────────────────────────────
function openLightbox(src) {
  document.getElementById("lb-img").src = src;
  document.getElementById("lightbox").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox(e) {
  if (e && e.target !== document.getElementById("lightbox") && !e.target.classList.contains("lb-close")) return;
  document.getElementById("lightbox").classList.remove("open");
  document.getElementById("lb-img").src = "";
  document.body.style.overflow = "";
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeLightbox({ target: document.getElementById("lightbox") });
});

// ───────────────────────────────────────────────────────
//  UI HELPERS
// ───────────────────────────────────────────────────────
function setState(mode, msg = "") {
  document.getElementById("loading").style.display    = mode === "loading" ? "block" : "none";
  document.getElementById("error-state").style.display = mode === "error"  ? "block" : "none";
  document.getElementById("empty-state").style.display = mode === "empty"  ? "block" : "none";
  document.getElementById("gallery-grid").style.display = mode === "grid"  ? "grid"  : "none";
  if (msg) document.getElementById("error-msg").textContent = msg;
}

function updateCount(n) {
  const el = document.getElementById("media-count");
  if (el) el.textContent = `${n} ${n === 1 ? "item" : "items"}`;
}

let _toastTimer;
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove("show"), 3500);
}

// ───────────────────────────────────────────────────────
//  INIT
// ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", loadGallery);
