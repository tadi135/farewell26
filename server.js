// ═══════════════════════════════════════════════════════
//  ECE FAREWELL GALLERY 2026 — server.js
//  Node.js + Express + Cloudinary (NO MongoDB)
//
//  Install:  npm install express cors cloudinary multer dotenv
//  Run:      node server.js  (or: npm run dev with nodemon)
// ═══════════════════════════════════════════════════════

require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const multer     = require("multer");
const { v2: cloudinary } = require("cloudinary");
const streamifier = require("streamifier");

const app  = express();
const PORT = process.env.PORT || 5000;

// ───────────────────────────────────────────────────────
//  MIDDLEWARE
// ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ───────────────────────────────────────────────────────
//  CLOUDINARY CONFIG
//  Set these in your .env file:
//    CLOUDINARY_CLOUD_NAME=your_cloud_name
//    CLOUDINARY_API_KEY=your_api_key
//    CLOUDINARY_API_SECRET=your_api_secret
// ───────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ───────────────────────────────────────────────────────
//  MULTER — store file in memory (then pipe to Cloudinary)
//  We use memory storage so we don't need a local /uploads folder
// ───────────────────────────────────────────────────────
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max
  fileFilter: (req, file, cb) => {
    const ok = /image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|webm|mov|avi|mkv|quicktime)/;
    if (ok.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only images and videos are allowed."), false);
  },
});

// ───────────────────────────────────────────────────────
//  HELPER: Upload buffer to Cloudinary as a stream
// ───────────────────────────────────────────────────────
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    // Pipe the in-memory buffer into the Cloudinary upload stream
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// ═══════════════════════════════════════════════════════
//  API ROUTES
// ═══════════════════════════════════════════════════════

// ── Health check ────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "ECE Farewell Gallery API is live 🎓" });
});

// ───────────────────────────────────────────────────────
//  POST /upload
//  Upload a photo or video to Cloudinary
//  Body: multipart/form-data with field "file"
// ───────────────────────────────────────────────────────
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided." });
    }

    // Determine resource type from mimetype
    const isVideo     = req.file.mimetype.startsWith("video/");
    const resourceType = isVideo ? "video" : "image";

    // Upload to Cloudinary
    // folder: "farewell" keeps all gallery media organised
    const result = await uploadToCloudinary(req.file.buffer, {
      folder:        "farewell",
      resource_type: "auto",    // let Cloudinary auto-detect image vs video
      use_filename:  true,
      unique_filename: true,
    });

    // Return the Cloudinary response fields the frontend needs
    res.status(201).json({
      public_id:     result.public_id,
      secure_url:    result.secure_url,
      resource_type: result.resource_type,
      format:        result.format,
      created_at:    result.created_at,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Upload failed." });
  }
});

// ───────────────────────────────────────────────────────
//  GET /media
//  Fetch all media in the "farewell" Cloudinary folder
//  Returns a JSON array of resource objects
// ───────────────────────────────────────────────────────
app.get("/media", async (req, res) => {
  try {
    // Fetch images
    const imgRes = await cloudinary.api.resources({
      type:          "upload",
      prefix:        "farewell/",
      resource_type: "image",
      max_results:   500,
    });

    // Fetch videos
    const vidRes = await cloudinary.api.resources({
      type:          "upload",
      prefix:        "farewell/",
      resource_type: "video",
      max_results:   500,
    });

    // Combine and sort newest first
    const all = [...imgRes.resources, ...vidRes.resources].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json(all);
  } catch (err) {
    console.error("GET /media error:", err);
    res.status(500).json({ error: "Failed to fetch media from Cloudinary." });
  }
});

// ───────────────────────────────────────────────────────
//  DELETE /media/:publicId
//  Delete a resource from Cloudinary by public_id
//  Query param: ?resource_type=image|video
//
//  Note: public_id may contain "/" (e.g. "farewell/photo")
//        so we accept it as a URL-encoded param
// ───────────────────────────────────────────────────────
app.delete("/media/:publicId(*)", async (req, res) => {
  try {
    const publicId     = req.params.publicId;
    const resourceType = req.query.resource_type || "image";

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "ok") {
      res.json({ message: `Deleted ${publicId}` });
    } else if (result.result === "not found") {
      res.status(404).json({ error: "Resource not found in Cloudinary." });
    } else {
      res.status(400).json({ error: result.result });
    }
  } catch (err) {
    console.error("DELETE error:", err);
    res.status(500).json({ error: "Deletion failed." });
  }
});

// ───────────────────────────────────────────────────────
//  START SERVER
// ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Server running → http://localhost:${PORT}`);
  console.log(`📦  Cloudinary cloud: ${process.env.CLOUDINARY_CLOUD_NAME || "(not set)"}\n`);
});
