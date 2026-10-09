const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProjectMembershipSchema = new Schema(
  {
    project_id: {
      type: Schema.Types.ObjectId,
      ref: "project",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate memberships at the DB level
ProjectMembershipSchema.index({ project_id: 1, user_id: 1 }, { unique: true });

const ProjectMembershipModel = mongoose.model(
  "projectMembership",
  ProjectMembershipSchema
);
module.exports = ProjectMembershipModel;