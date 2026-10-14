const router = require("express").Router({ mergeParams: true });
const mongoose = require("mongoose");
const ProjectModel = require("./../models/project.model");
const UserModel = require("./../models/user.model");
const ProjectMembershipModel = require("./../models/projectMembership.model");

// Helper: is the requester the project lead?
const isProjectLead = async (projectId, requesterId) => {
  if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) return false;
  const project = await ProjectModel.findById(projectId);
  if (!project) return false;
  return project.project_lead_id.toString() === requesterId.toString();
};

// GET /projects/:projectId/members
router.route("/").get(async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, msg: "Invalid project ID format." });
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, msg: "Project does not exist." });
    }

    const memberships = await ProjectMembershipModel.find({ project_id: projectId })
      .populate("user_id", "f_name l_name username");

    return res.status(200).json({
      success: true,
      memberships,
      project_lead_id: project.project_lead_id,
    });
  } catch (err) {
    next(err);
  }
});

// POST /projects/:projectId/members  — only the lead can add
router.route("/").post(async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { user_id } = req.body;
    const requesterId = req.header("x-user-id");

    if (!user_id) {
      return res.status(400).json({ success: false, msg: "user_id is required." });
    }

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(user_id)
    ) {
      return res.status(400).json({ success: false, msg: "Invalid project or user ID format." });
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, msg: "Project does not exist." });
    }

    // Only the project lead can manage members
    const allowed = await isProjectLead(projectId, requesterId);
    if (!allowed) {
      return res
        .status(403)
        .json({ success: false, msg: "Only the Project Lead can add members." });
    }

    const user = await UserModel.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, msg: "User does not exist." });
    }

    const existing = await ProjectMembershipModel.findOne({
      project_id: projectId,
      user_id,
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, msg: "User is already a member of this project." });
    }

    const membership = await ProjectMembershipModel.create({
      project_id: projectId,
      user_id,
    });

    const populated = await membership.populate("user_id", "f_name l_name username");

    return res.status(201).json({
      success: true,
      msg: "Member added successfully.",
      membership: populated,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, msg: "User is already a member of this project." });
    }
    next(err);
  }
});

// DELETE /projects/:projectId/members/:userId — only the lead can remove
router.route("/:userId").delete(async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;
    const requesterId = req.header("x-user-id");

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ success: false, msg: "Invalid project or user ID format." });
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, msg: "Project does not exist." });
    }

    const allowed = await isProjectLead(projectId, requesterId);
    if (!allowed) {
      return res
        .status(403)
        .json({ success: false, msg: "Only the Project Lead can remove members." });
    }

    if (project.project_lead_id.toString() === userId) {
      return res
        .status(403)
        .json({ success: false, msg: "The Project Lead cannot be removed from the project." });
    }

    const deleted = await ProjectMembershipModel.findOneAndDelete({
      project_id: projectId,
      user_id: userId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, msg: "Membership not found." });
    }

    return res.status(200).json({ success: true, msg: "Member removed successfully." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;