# ECE Farewell Gallery 2026 🎓
### Cloudinary-Powered · No Database Required

A full-stack media gallery where **Cloudinary is the only storage and data source** — no MongoDB, no local file system.

---

## 📁 Project Structure

```
farewell-cloudinary/
├── index.html        ← Student gallery (popup + grid + search)
├── admin.html        ← Admin panel (login + upload + manage)
├── style.css         ← Shared stylesheet (gallery + admin)
├── script.js         ← Gallery JavaScript
├── admin.js          ← Admin JavaScript
├── server.js         ← Express API server (Cloudinary backend)
├── package.json
└── .env.example      ← Copy to .env with your Cloudinary keys
```

---

## 🚀 Setup in 3 Steps

### Step 1 — Get Cloudinary credentials

1. Sign up free at [cloudinary.com](https://cloudinary.com)
2. Go to **Dashboard** → copy your:
   - Cloud Name
   - API Key
   - API Secret

### Step 2 — Configure the backend

```bash
cp .env.example .env
```
Edit `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

### Step 3 — Run the server

```bash
npm install
npm run dev       # development (with nodemon)
# or
npm start         # production
```

Server starts at `http://localhost:5000`

---

## 🔧 Frontend Configuration

In both `script.js` and `admin.js`, update:

```js
const API_BASE = "http://localhost:5000";
// ↓ Change to your Render URL before deploying:
const API_BASE = "https://your-app.onrender.com";
```

Then open `index.html` in a browser, or deploy to Vercel.

---

## 🔐 Admin Login

| Field    | Default value |
|----------|--------------|
| Username | `admin`      |
| Password | `ece2026`    |

> Change these in `admin.js` → `const CREDS = { ... }` before going live.

---

## 🌐 API Reference

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/`   | Health check |
| `POST` | `/upload` | Upload image/video to Cloudinary folder `farewell/` |
| `GET`  | `/media` | List all media in `farewell/` (images + videos) |
| `DELETE` | `/media/:publicId?resource_type=image` | Delete from Cloudinary |

### POST /upload

- Body: `multipart/form-data`
- Field name: `file`
- Accepts: JPG, PNG, GIF, WebP, MP4, MOV, WebM (up to 200 MB)
- Auto-detects resource type

### GET /media

Returns a JSON array of Cloudinary resource objects:
```json
[
  {
    "public_id": "farewell/photo_001",
    "secure_url": "https://res.cloudinary.com/...",
    "resource_type": "image",
    "format": "jpg",
    "created_at": "2026-04-20T10:00:00Z"
  }
]
```

---

## ☁️ Deployment

### Backend → Render

1. Push project to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Add Environment Variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Build command: `npm install`
5. Start command: `node server.js`

### Frontend → Vercel

1. Put `index.html`, `admin.html`, `style.css`, `script.js`, `admin.js` in a separate folder
2. Update `API_BASE` in both JS files to your Render URL
3. Import into [vercel.com](https://vercel.com) — no build step needed

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (custom), Vanilla JS ES6+ |
| Backend  | Node.js, Express.js |
| Storage  | Cloudinary (images + videos) |
| Upload   | Multer (memory storage) + streamifier |
| Fonts    | Cormorant Garamond + Outfit (Google Fonts) |

---

Made with ❤️ by the ECE Department · Farewell 2026
