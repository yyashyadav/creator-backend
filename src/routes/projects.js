import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createProject,
  deleteProject,
  duplicateProject,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/projectController.js";
import { listProjectVideos, startRender } from "../controllers/videoController.js";

const router = Router();

router.use(authenticate);

router.get("/", listProjects);
router.post("/", createProject);
router.get("/:id", getProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/duplicate", duplicateProject);
router.post("/:id/render", startRender);
router.get("/:id/videos", listProjectVideos);

export default router;
