import Project from "../models/Project.js";
import Scene from "../models/Scene.js";
import Video from "../models/Video.js";
import { enqueueRenderJob, cancelRenderJob } from "../services/queue.js";

function formatVideo(video) {
  return {
    id: video._id,
    projectId: video.projectId,
    status: video.status,
    progress: video.progress,
    resolution: video.resolution,
    fileUrl: video.fileUrl,
    durationSeconds: video.durationSeconds,
    errorMessage: video.errorMessage,
    renderStartedAt: video.renderStartedAt,
    renderCompletedAt: video.renderCompletedAt,
    createdAt: video.createdAt,
  };
}

async function getOwnedProject(projectId, userId) {
  return Project.findOne({ _id: projectId, userId });
}

export async function startRender(req, res, next) {
  try {
    const project = await getOwnedProject(req.params.id, req.user._id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    }

    const scenes = await Scene.find({ projectId: project._id }).sort({ order: 1 });

    if (scenes.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_SCENES", message: "Add at least one scene before rendering" },
      });
    }

    const activeRender = await Video.findOne({
      projectId: project._id,
      status: { $in: ["queued", "processing"] },
    });

    if (activeRender) {
      return res.status(409).json({
        success: false,
        error: {
          code: "RENDER_IN_PROGRESS",
          message: "A render is already in progress for this project",
        },
        data: { videoId: activeRender._id },
      });
    }

    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

    const video = await Video.create({
      projectId: project._id,
      userId: req.user._id,
      status: "queued",
      progress: 0,
      durationSeconds: totalDuration,
    });

    try {
      await enqueueRenderJob({
        videoId: video._id,
        projectId: project._id,
        userId: req.user._id,
      });
    } catch (enqueueError) {
      await Video.findByIdAndDelete(video._id);
      project.status = "draft";
      await project.save();
      throw enqueueError;
    }

    project.status = "rendering";
    await project.save();

    res.status(202).json({
      success: true,
      data: { video: formatVideo(video) },
    });
  } catch (error) {
    next(error);
  }
}

export async function getVideoStatus(req, res, next) {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Video not found" },
      });
    }

    res.json({
      success: true,
      data: {
        status: video.status,
        progress: video.progress,
        errorMessage: video.errorMessage,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getVideo(req, res, next) {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Video not found" },
      });
    }

    res.json({
      success: true,
      data: { video: formatVideo(video) },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelRender(req, res, next) {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Video not found" },
      });
    }

    if (!["queued", "processing"].includes(video.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: "Only queued or in-progress renders can be cancelled",
        },
      });
    }

    if (video.status === "queued") {
      await cancelRenderJob(video._id);
    }

    video.status = "cancelled";
    video.errorMessage = "Cancelled by user";
    video.renderCompletedAt = new Date();
    await video.save();

    await Project.findByIdAndUpdate(video.projectId, { status: "draft" });

    res.json({
      success: true,
      data: { video: formatVideo(video) },
    });
  } catch (error) {
    next(error);
  }
}

export async function retryRender(req, res, next) {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Video not found" },
      });
    }

    if (video.status !== "failed") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: "Only failed renders can be retried",
        },
      });
    }

    video.status = "queued";
    video.progress = 0;
    video.errorMessage = null;
    video.renderStartedAt = null;
    video.renderCompletedAt = null;
    await video.save();

    await Project.findByIdAndUpdate(video.projectId, { status: "rendering" });

    await enqueueRenderJob({
      videoId: video._id,
      projectId: video.projectId,
      userId: video.userId,
    });

    res.json({
      success: true,
      data: { video: formatVideo(video) },
    });
  } catch (error) {
    next(error);
  }
}

export async function listProjectVideos(req, res, next) {
  try {
    const project = await getOwnedProject(req.params.id, req.user._id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    }

    const videos = await Video.find({ projectId: project._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: { videos: videos.map(formatVideo) },
    });
  } catch (error) {
    next(error);
  }
}
