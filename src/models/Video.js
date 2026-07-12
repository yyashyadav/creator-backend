import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "cancelled"],
      default: "queued",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    resolution: {
      type: String,
      default: "1080p",
    },
    fileUrl: {
      type: String,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    renderStartedAt: {
      type: Date,
      default: null,
    },
    renderCompletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

videoSchema.index({ projectId: 1, createdAt: -1 });

const Video = mongoose.model("Video", videoSchema);

export default Video;
