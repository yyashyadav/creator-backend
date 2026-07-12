import express from "express";
import cors from "cors";
import path from "path";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import { projectScenesRouter, sceneRouter } from "./routes/scenes.js";
import videoRoutes from "./routes/videos.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/projects/:projectId/scenes", projectScenesRouter);
app.use("/api/v1/scenes", sceneRouter);
app.use("/api/v1/videos", videoRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
