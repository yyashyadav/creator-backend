import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import "./models/index.js";

const port = process.env.PORT || 5000;

async function start() {
  await connectDB();

  app.listen(port, () => {
    console.log(`🚀 Creator API running on http://localhost:${port}`);
    console.log(`   Health: http://localhost:${port}/api/v1/health`);
  });
}

start();
