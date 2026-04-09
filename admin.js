// ═══════════════════════════════════════════════════════
//  ECE FAREWELL GALLERY 2026 — admin.js
// ═══════════════════════════════════════════════════════

// 🔧 Change to your deployed backend URL
const API_BASE = "http://localhost:5000";

// Hardcoded admin credentials (change before deploying)
const CREDS = { user: "admin", pass: "ece2026" };

let pickedFile = null;

// ───────────────────────────────────────────────────────
//  AUTH
// ───────────────────────────────────────────────────────
function doLogin() {
  const u = document.getElementById("l-user").value.trim();
  const p = document.getElementById("l-pass").value.trim();
  const errEl = document.getElementById("l-err");

  if (u === CREDS.user && p === CREDS.pass) {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
  } else {
    errEl.textContent = "⚠️ Incorrect username or password.";
    setTimeout(() => (errEl.textContent = ""), 3000);
  }
}

function doLogout() {
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("l-user").value = "";
  document.getElementById("l-pass").value = "";
}

// Login on Enter
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && !document.getElementById("login-screen").classList.contains("hidden")) {
    doLogin();
  }
});

// ───────────────────────────────────────────────────────
//  TABS
// ───────────────────────────────────────────────────────
function switchTab(name, btn) {
  ["upload", "manage"].forEach(t => {
    document.getElementById(`tab-${t}`).style.display = t === name ? "block" : "none";
    document.getElementById(`nav-${t}`)?.classList.toggle("on", t === name);
  });
  if (name === "manage") loadManageTable();
}

// ───────────────────────────────────────────────────────
//  FILE PICK & PREVIEW
// ───────────────────────────────────────────────────────
function onFilePick(e) {
  const file = e.target.files[0];
  if (file) setFile(file);
}

function setFile(file) {
  pickedFile = file;
  const isImg = file.type.startsWith("image/");
  const url   = URL.createObjectURL(file);
  const mediaEl = document.getElementById("preview-media");

  mediaEl.innerHTML = isImg
    ? `<img src="${url}" alt="preview" style="max-width:100%;max-height:220px;border-radius:10px;"/>`
    : `<video src="${url}" controls style="max-width:100%;max-height:220px;border-radius:10px;"></video>`;

  document.getElementById("prev-name").textContent = file.name;
  const pill = document.getElementById("prev-pill");
  pill.textContent  = isImg ? "🖼️ Image" : "🎬 Video";
  pill.className    = `type-pill ${isImg ? "pill-img" : "pill-vid"}`;

  document.getElementById("dz-placeholder").style.display = "none";
  document.getElementById("preview-wrap").style.display   = "block";
}

function resetUpload() {
  pickedFile = null;
  document.getElementById("file-in").value = "";
  document.getElementById("dz-placeholder").style.display = "block";
  document.getElementById("preview-wrap").style.display   = "none";
  document.getElementById("preview-media").innerHTML      = "";
  document.getElementById("prog-wrap").style.display      = "none";
}

// ───────────────────────────────────────────────────────
//  DRAG & DROP
// ───────────────────────────────────────────────────────
function onDragOver(e) {
  e.preventDefault();
  document.getElementById("drop-zone").classList.add("over");
}
function onDragLeave() {
  document.getElementById("drop-zone").classList.remove("over");
}
function onDrop(e) {
  e.preventDefault();
  document.getElementById("drop-zone").classList.remove("over");
  const file = e.dataTransfer.files[0];
  if (file) setFile(file);
}

// ───────────────────────────────────────────────────────
//  UPLOAD
// ───────────────────────────────────────────────────────
async function doUpload() {
  if (!pickedFile) { showToast("Please select a file first.", "err"); return; }

  const formData = new FormData();
  formData.append("file", pickedFile);

  // UI: show progress
  const progWrap  = document.getElementById("prog-wrap");
  const progFill  = document.getElementById("prog-fill");
  const progLabel = document.getElementById("prog-label");
  progWrap.style.display  = "flex";
  progFill.style.width    = "0%";
  progLabel.textContent   = "Uploading to Cloudinary…";

  const btn = document.getElementById("upload-btn");
  btn.disabled    = true;
  btn.textContent = "Uploading…";

  // Fake progress animation
  let pct = 0;
  const ticker = setInterval(() => {
    if (pct < 82) { pct += Math.random() * 14; progFill.style.width = Math.min(pct, 82) + "%"; }
  }, 220);

  try {
    const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
    clearInterval(ticker);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }

    const data = await res.json();
    progFill.style.width  = "100%";
    progLabel.textContent = "Done! ✅";
    showToast(`✅ Uploaded: ${data.public_id}`, "ok");
    setTimeout(() => resetUpload(), 1400);
  } catch (err) {
    clearInterval(ticker);
    progLabel.textContent = "Upload failed ❌";
    showToast(`❌ ${err.message}`, "err");
  } finally {
    btn.disabled    = false;
    btn.textContent = "⬆ Upload to Cloudinary";
    setTimeout(() => (progWrap.style.display = "none"), 2200);
  }
}

// ───────────────────────────────────────────────────────
//  MANAGE TABLE
// ───────────────────────────────────────────────────────
async function loadManageTable() {
  const tbody   = document.getElementById("media-tbody");
  const loading = document.getElementById("adm-loading");
  const empty   = document.getElementById("adm-empty");
  const tw      = document.getElementById("table-wrap");

  loading.style.display = "flex";
  empty.style.display   = "none";
  tw.style.display      = "none";
  tbody.innerHTML       = "";

  try {
    const res  = await fetch(`${API_BASE}/media`);
    const data = await res.json();
    loading.style.display = "none";

    if (!data.length) { empty.style.display = "block"; return; }
    tw.style.display = "block";

    data.forEach((item, i) => {
      const isImg = item.resource_type === "image";
      const date  = item.created_at
        ? new Date(item.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
        : "—";
      const rawId = item.public_id || "";
      const shortId = rawId.includes("/") ? rawId.split("/").pop() : rawId;

      const thumb = isImg
        ? `<img class="t-thumb" src="${item.secure_url}" alt="thumb"/>`
        : `<div class="t-vid-thumb">🎬</div>`;

      const typePill = isImg
        ? `<span class="type-pill pill-img">Image</span>`
        : `<span class="type-pill pill-vid">Video</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${thumb}</td>
        <td title="${rawId}">${shortId}</td>
        <td>${typePill}</td>
        <td class="t-url"><a href="${item.secure_url}" target="_blank" style="color:inherit">${item.secure_url.slice(0,40)}…</a></td>
        <td class="t-date">${date}</td>
        <td>
          <button class="btn-del" onclick="deleteMedia('${rawId}', '${item.resource_type}', this)">
            🗑 Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    loading.style.display = "none";
    showToast("⚠️ Failed to load media.", "err");
  }
}

async function deleteMedia(publicId, resourceType, btn) {
  if (!confirm(`Delete "${publicId}"?\nThis removes it from Cloudinary permanently.`)) return;
  btn.disabled    = true;
  btn.textContent = "…";

  try {
    const res = await fetch(`${API_BASE}/media/${encodeURIComponent(publicId)}?resource_type=${resourceType}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Delete failed");
    showToast("🗑 Deleted successfully.", "ok");
    btn.closest("tr").remove();
  } catch (err) {
    btn.disabled    = false;
    btn.textContent = "🗑 Delete";
    showToast("❌ Could not delete.", "err");
  }
}

// ───────────────────────────────────────────────────────
//  TOAST
// ───────────────────────────────────────────────────────
let _t;
function showToast(msg, type = "") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className   = `toast show ${type}`;
  clearTimeout(_t);
  _t = setTimeout(() => el.classList.remove("show"), 3600);
}
