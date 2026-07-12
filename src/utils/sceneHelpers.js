import Scene from "../models/Scene.js";
import Project from "../models/Project.js";

export async function syncProjectStats(projectId) {
  const scenes = await Scene.find({ projectId }).sort({ order: 1 });
  const sceneCount = scenes.length;
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const thumbnailUrl =
    scenes.find((scene) => scene.characterImageUrl)?.characterImageUrl || null;

  await Project.findByIdAndUpdate(projectId, {
    sceneCount,
    totalDuration,
    thumbnailUrl,
    lastEditedAt: new Date(),
  });
}

export function formatScene(scene) {
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

export async function getOwnedProject(projectId, userId) {
  return Project.findOne({ _id: projectId, userId });
}

export async function getOwnedScene(sceneId, userId) {
  const scene = await Scene.findById(sceneId);
  if (!scene) return null;

  const project = await getOwnedProject(scene.projectId, userId);
  if (!project) return null;

  return { scene, project };
}

export function getNextOrder(scenes) {
  if (scenes.length === 0) return 1000;
  return scenes[scenes.length - 1].order + 1000;
}
