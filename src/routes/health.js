import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "creator-api",
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
