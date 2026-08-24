import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Serve uploads directory with range support and explicit mime types
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir, {
    acceptRanges: true,
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.mp4') res.setHeader('Content-Type', 'video/mp4');
      else if (ext === '.webm') res.setHeader('Content-Type', 'video/webm');
      else if (ext === '.mov') res.setHeader('Content-Type', 'video/quicktime');
      else if (ext === '.mkv') res.setHeader('Content-Type', 'video/x-matroska');
      else if (ext === '.avi') res.setHeader('Content-Type', 'video/x-msvideo');
      else if (ext === '.jpg' || ext === '.jpeg') res.setHeader('Content-Type', 'image/jpeg');
      else if (ext === '.png') res.setHeader('Content-Type', 'image/png');
      else if (ext === '.webp') res.setHeader('Content-Type', 'image/webp');
      else if (ext === '.gif') res.setHeader('Content-Type', 'image/gif');
    }
  }));

  // Fast streaming file upload handler (direct stream to disk)
  app.post("/api/upload", (req, res) => {
    try {
      const contentType = (req.headers["content-type"] || "").toLowerCase();
      let extension = (req.headers["x-file-extension"] as string || "").toLowerCase().trim();

      if (!extension || extension === 'bin' || extension === 'octet-stream') {
        if (contentType.includes('video/mp4')) extension = 'mp4';
        else if (contentType.includes('video/webm')) extension = 'webm';
        else if (contentType.includes('video/quicktime')) extension = 'mov';
        else if (contentType.includes('video/')) extension = 'mp4';
        else if (contentType.includes('image/jpeg')) extension = 'jpg';
        else if (contentType.includes('image/png')) extension = 'png';
        else if (contentType.includes('image/webp')) extension = 'webp';
        else extension = 'mp4';
      }

      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 12)}.${extension}`;
      const filePath = path.join(uploadsDir, filename);
      const writeStream = fs.createWriteStream(filePath);

      req.pipe(writeStream);

      writeStream.on('finish', () => {
        res.json({ url: `/uploads/${filename}` });
      });

      writeStream.on('error', (err) => {
        console.error("Write stream error:", err);
        res.status(500).json({ error: "Failed to write uploaded file stream." });
      });

      req.on('error', (err) => {
        console.error("Req stream error:", err);
        res.status(500).json({ error: "Network error during upload stream." });
      });
    } catch (error) {
      console.error("Upload handler error:", error);
      res.status(500).json({ error: "Failed to process upload." });
    }
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
