// models/userStory.model.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserStorySchema = new Schema(
  {
    project_id: {
      type: Schema.Types.ObjectId,
      ref: "project",
      required: true,
      immutable: true, // project_id must never change
    },
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      required: true,
      enum: ["High", "Medium", "Low"],
    },
    status: {
      type: String,
      required: true,
      enum: ["To Do", "In Progress", "Done"],
      default: "To Do",
    },
    assigned_user_id: {
      type: Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  { timestamps: true }
);

// Fast lookups for backlog by project and for member-removal guard
UserStorySchema.index({ project_id: 1 });
UserStorySchema.index({ project_id: 1, assigned_user_id: 1 });

module.exports = mongoose.model("userStory", UserStorySchema);