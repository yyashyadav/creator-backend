import Scene from "../models/Scene.js";
import {
  formatScene,
  getNextOrder,
  getOwnedProject,
  getOwnedScene,
  syncProjectStats,
} from "../utils/sceneHelpers.js";

function getFileUrl(req, filename) {
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

export async function listScenes(req, res, next) {
  try {
    const project = await getOwnedProject(req.params.projectId, req.user._id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    }

    const scenes = await Scene.find({ projectId: project._id }).sort({ order: 1 });

    res.json({
      success: true,
      data: { scenes: scenes.map(formatScene) },
    });
  } catch (error) {
    next(error);
  }
}

export async function createScene(req, res, next) {
  try {
    const project = await getOwnedProject(req.params.projectId, req.user._id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    }

    const existingScenes = await Scene.find({ projectId: project._id }).sort({
      order: 1,
    });

    const scene = await Scene.create({
      projectId: project._id,
      order: getNextOrder(existingScenes),
      dialogue: req.body?.dialogue?.trim() || "",
      duration: req.body?.duration || 2,
    });

    await syncProjectStats(project._id);

    res.status(201).json({
      success: true,
      data: { scene: formatScene(scene) },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateScene(req, res, next) {
  try {
    const owned = await getOwnedScene(req.params.id, req.user._id);

    if (!owned) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Scene not found" },
      });
    }

    const { scene } = owned;
    const { dialogue, duration, position, dialoguePosition, dialogueShape } = req.body;

    if (dialogue !== undefined) {
      scene.dialogue = dialogue.trim();
    }

    if (duration !== undefined) {
      const parsedDuration = Number(duration);
      if (Number.isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 60) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Duration must be between 1 and 60 seconds",
          },
        });
      }
      scene.duration = parsedDuration;
    }

    if (position !== undefined) {
      scene.position = position;
    }

    if (dialoguePosition !== undefined) {
      const x = Number(dialoguePosition.x);
      const y = Number(dialoguePosition.y);

      if (Number.isNaN(x) || Number.isNaN(y) || x < 0 || x > 100 || y < 0 || y > 100) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Dialogue position must have x and y between 0 and 100",
          },
        });
      }

      scene.dialoguePosition = { x, y };
    }

    if (dialogueShape !== undefined) {
      const validShapes = ["speech", "thought", "shout", "caption", "whisper"];
      if (!validShapes.includes(dialogueShape)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid dialogue shape",
          },
        });
      }
      scene.dialogueShape = dialogueShape;
    }

    await scene.save();
    await syncProjectStats(scene.projectId);

    res.json({
      success: true,
      data: { scene: formatScene(scene) },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteScene(req, res, next) {
  try {
    const owned = await getOwnedScene(req.params.id, req.user._id);

    if (!owned) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Scene not found" },
      });
    }

    const { scene } = owned;
    await scene.deleteOne();
    await syncProjectStats(scene.projectId);

    res.json({
      success: true,
      data: { message: "Scene deleted successfully" },
    });
  } catch (error) {
    next(error);
  }
}

export async function reorderScene(req, res, next) {
  try {
    const owned = await getOwnedScene(req.params.id, req.user._id);

    if (!owned) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Scene not found" },
      });
    }

    const { scene } = owned;
    const { direction } = req.body;

    if (!["up", "down"].includes(direction)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Direction must be 'up' or 'down'",
        },
      });
    }

    const scenes = await Scene.find({ projectId: scene.projectId }).sort({ order: 1 });
    const index = scenes.findIndex((item) => item._id.equals(scene._id));

    if (direction === "up" && index > 0) {
      const previous = scenes[index - 1];
      const currentOrder = scene.order;
      scene.order = previous.order;
      previous.order = currentOrder;
      await Promise.all([scene.save(), previous.save()]);
    }

    if (direction === "down" && index < scenes.length - 1) {
      const next = scenes[index + 1];
      const currentOrder = scene.order;
      scene.order = next.order;
      next.order = currentOrder;
      await Promise.all([scene.save(), next.save()]);
    }

    await syncProjectStats(scene.projectId);

    const updatedScenes = await Scene.find({ projectId: scene.projectId }).sort({
      order: 1,
    });

    res.json({
      success: true,
      data: { scenes: updatedScenes.map(formatScene) },
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadImage(req, res, next) {
  try {
    const owned = await getOwnedScene(req.params.id, req.user._id);

    if (!owned) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Scene not found" },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Image file is required" },
      });
    }

    const { scene } = owned;
    scene.characterImageUrl = getFileUrl(req, req.file.filename);
    await scene.save();
    await syncProjectStats(scene.projectId);

    res.json({
      success: true,
      data: { scene: formatScene(scene) },
    });
  } catch (error) {
    next(error);
  }
}
