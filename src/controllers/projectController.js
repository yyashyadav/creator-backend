import Project from "../models/Project.js";
import Scene from "../models/Scene.js";
import Video from "../models/Video.js";

function formatProject(project) {
  return {
    id: project._id,
    title: project.title,
    description: project.description,
    status: project.status,
    thumbnailUrl: project.thumbnailUrl,
    sceneCount: project.sceneCount,
    totalDuration: project.totalDuration,
    lastEditedAt: project.lastEditedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function formatScene(scene) {
  return {
    id: scene._id,
    projectId: scene.projectId,
    order: scene.order,
    characterImageUrl: scene.characterImageUrl,
    dialogue: scene.dialogue,
    duration: scene.duration,
    position: scene.position,
    dialoguePosition: {
      x: scene.dialoguePosition?.x ?? 50,
      y: scene.dialoguePosition?.y ?? 18,
    },
    dialogueShape: scene.dialogueShape || "speech",
    scale: scene.scale,
    backgroundUrl: scene.backgroundUrl,
    animation: scene.animation,
    createdAt: scene.createdAt,
    updatedAt: scene.updatedAt,
  };
}

async function getOwnedProject(projectId, userId) {
  return Project.findOne({ _id: projectId, userId });
}

export async function listProjects(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find({ userId: req.user._id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      success: true,
      data: {
        projects: projects.map(formatProject),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req, res, next) {
  try {
    const { title, description } = req.body;
    const now = new Date();

    const project = await Project.create({
      userId: req.user._id,
      title: title?.trim() || "Untitled Project",
      description: description?.trim() || "",
      lastEditedAt: now,
    });

    res.status(201).json({
      success: true,
      data: { project: formatProject(project) },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProject(req, res, next) {
  try {
    const project = await getOwnedProject(req.params.id, req.user._id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    }

    const scenes = await Scene.find({ projectId: project._id }).sort({ order: 1 });

    res.json({
      success: true,
      data: {
        project: formatProject(project),
        scenes: scenes.map(formatScene),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req, res, next) {
  try {
    const project = await getOwnedProject(req.params.id, req.user._id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    }

    const { title, description, status } = req.body;

    if (title !== undefined) {
      if (!title?.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Title cannot be empty" },
        });
      }
      project.title = title.trim();
    }

    if (description !== undefined) {
      project.description = description.trim();
    }

    if (status !== undefined) {
      project.status = status;
    }

    project.lastEditedAt = new Date();
    await project.save();

    res.json({
      success: true,
      data: { project: formatProject(project) },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const project = await getOwnedProject(req.params.id, req.user._id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    }

    await Promise.all([
      Scene.deleteMany({ projectId: project._id }),
      Video.deleteMany({ projectId: project._id }),
      project.deleteOne(),
    ]);

    res.json({
      success: true,
      data: { message: "Project deleted successfully" },
    });
  } catch (error) {
    next(error);
  }
}

export async function duplicateProject(req, res, next) {
  try {
    const project = await getOwnedProject(req.params.id, req.user._id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    }

    const scenes = await Scene.find({ projectId: project._id }).sort({ order: 1 });
    const now = new Date();

    const duplicate = await Project.create({
      userId: req.user._id,
      title: `${project.title} (Copy)`,
      description: project.description,
      status: "draft",
      thumbnailUrl: project.thumbnailUrl,
      sceneCount: project.sceneCount,
      totalDuration: project.totalDuration,
      lastEditedAt: now,
    });

    if (scenes.length > 0) {
      const duplicateScenes = scenes.map((scene) => ({
        projectId: duplicate._id,
        order: scene.order,
        characterImageUrl: scene.characterImageUrl,
        dialogue: scene.dialogue,
        duration: scene.duration,
        position: scene.position,
        dialoguePosition: scene.dialoguePosition,
        dialogueShape: scene.dialogueShape,
        scale: scene.scale,
        backgroundUrl: scene.backgroundUrl,
        animation: scene.animation,
        audioUrl: scene.audioUrl,
        voiceConfig: scene.voiceConfig,
      }));

      await Scene.insertMany(duplicateScenes);
    }

    res.status(201).json({
      success: true,
      data: { project: formatProject(duplicate) },
    });
  } catch (error) {
    next(error);
  }
}
