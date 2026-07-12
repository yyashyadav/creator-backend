import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { uploadSceneImage } from "../middleware/upload.js";
import {
  createScene,
  deleteScene,
  listScenes,
  reorderScene,
  updateScene,
  uploadImage,
} from "../controllers/sceneController.js";

const projectScenesRouter = Router({ mergeParams: true });
const sceneRouter = Router();

projectScenesRouter.use(authenticate);
sceneRouter.use(authenticate);

projectScenesRouter.get("/", listScenes);
projectScenesRouter.post("/", createScene);

sceneRouter.patch("/:id", updateScene);
sceneRouter.delete("/:id", deleteScene);
sceneRouter.patch("/:id/reorder", reorderScene);
sceneRouter.post(
  "/:id/upload-image",
  uploadSceneImage.single("image"),
  uploadImage
);

export { projectScenesRouter, sceneRouter };
