const router = require("express").Router({ mergeParams: true });
const mongoose = require("mongoose");
const ProjectModel = require("./../models/project.model");
const UserModel = require("./../models/user.model");
const ProjectMembershipModel = require("./../models/projectMembership.model");

// GET /projects/:projectId/members  — List members of a project
router.route("/").get(async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid project ID format.",
      });
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        msg: "Project does not exist.",
      });
    }

    const memberships = await ProjectMembershipModel.find({
      project_id: projectId,
    }).populate("user_id", "f_name l_name username");

    return res.status(200).json({
      success: true,
      memberships,
      project_lead_id: project.project_lead_id,
    });
  } catch (err) {
    next(err);
  }
});

// POST /projects/:projectId/members  — Add a member
router.route("/").post(async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { user_id } = req.body;

    // 1. Validate input
    if (!user_id) {
      return res.status(400).json({
        success: false,
        msg: "user_id is required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(user_id)
    ) {
      return res.status(400).json({
        success: false,
        msg: "Invalid project or user ID format.",
      });
    }

    // 2. Verify project exists
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        msg: "Project does not exist.",
      });
    }

    // 3. Verify user exists
    const user = await UserModel.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User does not exist.",
      });
    }

    // 4. Prevent duplicate membership
    const existing = await ProjectMembershipModel.findOne({
      project_id: projectId,
      user_id,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        msg: "User is already a member of this project.",
      });
    }

    // 5. Create membership
    const membership = await ProjectMembershipModel.create({
      project_id: projectId,
      user_id,
    });

    const populated = await membership.populate(
      "user_id",
      "f_name l_name username"
    );

    return res.status(201).json({
      success: true,
      msg: "Member added successfully.",
      membership: populated,
    });
  } catch (err) {
    // Duplicate key safety net (race condition)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        msg: "User is already a member of this project.",
      });
    }
    next(err);
  }
});

// DELETE /projects/:projectId/members/:userId  — Remove a member
router.route("/:userId").delete(async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        msg: "Invalid project or user ID format.",
      });
    }

    // 1. Verify project exists
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        msg: "Project does not exist.",
      });
    }

    // 2. Prevent removing the Project Lead
    if (project.project_lead_id.toString() === userId) {
      return res.status(403).json({
        success: false,
        msg: "The Project Lead cannot be removed from the project.",
      });
    }

    // 3. Find and delete membership
    const deleted = await ProjectMembershipModel.findOneAndDelete({
      project_id: projectId,
      user_id: userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        msg: "Membership not found.",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Member removed successfully.",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;