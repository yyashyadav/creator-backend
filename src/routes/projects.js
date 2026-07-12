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

const router = Router();

router.use(authenticate);

router.get("/", listProjects);
router.post("/", createProject);
router.get("/:id", getProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/duplicate", duplicateProject);

export default router;
