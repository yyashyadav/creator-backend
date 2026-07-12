import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { cancelRender, getVideo, getVideoStatus, retryRender } from "../controllers/videoController.js";

const router = Router();

router.use(authenticate);

router.get("/:id/status", getVideoStatus);
router.post("/:id/cancel", cancelRender);
router.post("/:id/retry", retryRender);
router.get("/:id", getVideo);

export default router;
