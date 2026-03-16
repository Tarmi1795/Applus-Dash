import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import * as XLSX from "xlsx";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // In-memory store for the latest uploaded data
  let latestData: any[] | null = null;

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Endpoint to get the latest uploaded data
  app.get("/api/data", (req, res) => {
    if (!latestData) {
      return res.status(404).json({ error: "No data uploaded yet" });
    }
    res.json(latestData);
  });

  // POST hook for Excel VBA Macro
  // Handles application/octet-stream as sent by the user's script
  app.post("/api/upload", express.raw({ type: "application/octet-stream", limit: "50mb" }), (req, res) => {
    try {
      console.log("Received upload request from Excel Macro");
      
      const buffer = req.body;
      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: "Empty body" });
      }

      // Parse the Excel buffer
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      // Store the data
      latestData = jsonData;
      
      console.log(`Successfully parsed ${jsonData.length} rows from Excel upload`);
      
      res.json({ 
        status: "success", 
        message: "File processed successfully", 
        rows: jsonData.length 
      });
    } catch (error) {
      console.error("Error processing Excel upload:", error);
      res.status(500).json({ error: "Failed to process Excel file" });
    }
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
    console.log(`API Endpoint ready at: http://localhost:${PORT}/api/upload`);
  });
}

startServer();
