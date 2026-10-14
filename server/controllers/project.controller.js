const router = require("express").Router();
const mongoose = require("mongoose");
const ProjectModel = require("./../models/project.model");
const UserModel = require("./../models/user.model");
const ProjectMembershipModel = require("./../models/projectMembership.model");

const VALID_STATUSES = ["Planning", "Active", "Completed"];

// Helper: confirm the requester is the project lead
const isLead = (project, requesterId) =>
  project &&
  requesterId &&
  project.project_lead_id.toString() === requesterId.toString();

/* POST /projects — create                                             */
router.route("/").post(async (req, res, next) => {
  try {
    const { name, description, status, project_lead_id } = req.body;

    if (!name || !description || !status || !project_lead_id) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required: name, description, status, project_lead_id.",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: `Status must be one of: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(project_lead_id)) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid Project Lead ID format." });
    }

    const lead = await UserModel.findById(project_lead_id);
    if (!lead) {
      return res
        .status(404)
        .json({ success: false, msg: "Selected Project Lead does not exist." });
    }

    const project = await ProjectModel.create({
      name,
      description,
      status,
      project_lead_id,
    });

    // Auto-add the lead as a member
    await ProjectMembershipModel.create({
      project_id: project._id,
      user_id: project_lead_id,
    });

    return res
      .status(201)
      .json({ success: true, msg: "Project created successfully.", project });
  } catch (err) {
    next(err);
  }
});

/* GET /projects — list                  */

router.route("/").get(async (req, res, next) => {
  try {
    const { mine } = req.query;
    let filter = {};

    if (mine && mongoose.Types.ObjectId.isValid(mine)) {
      const memberships = await ProjectMembershipModel.find({
        user_id: mine,
      }).select("project_id");
      filter = { _id: { $in: memberships.map((m) => m.project_id) } };
    }

    const projects = await ProjectModel.find(filter)
      .populate("project_lead_id", "f_name l_name username")
      .sort({ createdAt: -1 });

    // member_count aggregation
    const counts = await ProjectMembershipModel.aggregate([
      { $match: { project_id: { $in: projects.map((p) => p._id) } } },
      { $group: { _id: "$project_id", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(
      counts.map((c) => [c._id.toString(), c.count])
    );

    const enriched = projects.map((p) => ({
      ...p.toObject(),
      member_count: countMap[p._id.toString()] || 0,
    }));

    return res.status(200).json({ success: true, projects: enriched });
  } catch (err) {
    next(err);
  }
});

/* GET /projects/:id — single                                          */
router.route("/:id").get(async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid project ID format." });
    }

    const project = await ProjectModel.findById(id).populate(
      "project_lead_id",
      "f_name l_name username"
    );
    if (!project) {
      return res
        .status(404)
        .json({ success: false, msg: "Project does not exist." });
    }

    return res.status(200).json({ success: true, project });
  } catch (err) {
    next(err);
  }
});

/* PUT /projects/:id — full update (lead only)                         */
router.route("/:id").put(async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.header("x-user-id");
    const { name, description, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid project ID format." });
    }

    const project = await ProjectModel.findById(id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, msg: "Project does not exist." });
    }

    if (!isLead(project, requesterId)) {
      return res
        .status(403)
        .json({ success: false, msg: "Only the Project Lead can edit this project." });
    }

    // Validate presence of required fields
    if (!name || !description || !status) {
      return res
        .status(400)
        .json({ success: false, msg: "Name, description and status are required." });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: `Status must be one of: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    project.name = name.trim();
    project.description = description.trim();
    project.status = status;

    const saved = await project.save();
    const populated = await saved.populate(
      "project_lead_id",
      "f_name l_name username"
    );

    return res.status(200).json({
      success: true,
      msg: "Project updated successfully.",
      project: populated,
    });
  } catch (err) {
    next(err);
  }
});

/* PATCH /projects/:id/status — quick status toggle (lead only)        */
router.route("/:id/status").patch(async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.header("x-user-id");
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid project ID format." });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: `Status must be one of: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    const project = await ProjectModel.findById(id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, msg: "Project does not exist." });
    }

    if (!isLead(project, requesterId)) {
      return res
        .status(403)
        .json({ success: false, msg: "Only the Project Lead can change the status." });
    }

    project.status = status;
    const saved = await project.save();

    return res
      .status(200)
      .json({ success: true, msg: "Status updated.", project: saved });
  } catch (err) {
    next(err);
  }
});

/* DELETE /projects/:id — optional (lead only)                         */
router.route("/:id").delete(async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.header("x-user-id");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid project ID format." });
    }

    const project = await ProjectModel.findById(id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, msg: "Project does not exist." });
    }

    if (!isLead(project, requesterId)) {
      return res
        .status(403)
        .json({ success: false, msg: "Only the Project Lead can delete this project." });
    }

    await ProjectMembershipModel.deleteMany({ project_id: id });
    await ProjectModel.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ success: true, msg: "Project deleted successfully." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;