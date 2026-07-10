import mongoose from "mongoose";

export async function connectDB() {
  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/creator";
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}
