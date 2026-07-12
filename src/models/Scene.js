import mongoose from "mongoose";

const sceneSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
    },
    characterImageUrl: {
      type: String,
      default: null,
    },
    dialogue: {
      type: String,
      default: "",
      trim: true,
    },
    duration: {
      type: Number,
      default: 2,
      min: 1,
      max: 60,
    },
    position: {
      type: String,
      enum: ["left", "center", "right"],
      default: "center",
    },
    dialoguePosition: {
      x: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
      y: {
        type: Number,
        default: 18,
        min: 0,
        max: 100,
      },
    },
    dialogueShape: {
      type: String,
      enum: ["speech", "thought", "shout", "caption", "whisper"],
      default: "speech",
    },
    scale: {
      type: Number,
      default: 1,
    },
    backgroundUrl: {
      type: String,
      default: null,
    },
    animation: {
      in: {
        type: String,
        enum: ["fadeIn", "none"],
        default: "fadeIn",
      },
      out: {
        type: String,
        enum: ["fadeOut", "none"],
        default: "fadeOut",
      },
      textEffect: {
        type: String,
        enum: ["typing", "none"],
        default: "typing",
      },
    },
    audioUrl: {
      type: String,
      default: null,
    },
    voiceConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

sceneSchema.index({ projectId: 1, order: 1 });

const Scene = mongoose.model("Scene", sceneSchema);

export default Scene;
