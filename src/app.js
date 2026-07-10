import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import healthRoutes from "./routes/health.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/health", healthRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
