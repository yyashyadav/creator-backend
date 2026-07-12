import "dotenv/config";
import fs from "fs";
import path from "path";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import "./models/index.js";

const port = process.env.PORT || 5000;
const videosDir = path.join(process.cwd(), "uploads", "videos");

async function start() {
  fs.mkdirSync(videosDir, { recursive: true });
  await connectDB();

  app.listen(port, () => {
    console.log(`🚀 Creator API running on http://localhost:${port}`);
    console.log(`   Health: http://localhost:${port}/api/v1/health`);
  });
}

start();
