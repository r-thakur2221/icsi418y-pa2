const router = require("express").Router({ mergeParams: true });
const mongoose = require("mongoose");
const ProjectModel = require("./../models/project.model");
const UserModel = require("./../models/user.model");
const ProjectMembershipModel = require("./../models/projectMembership.model");
const UserStoryModel = require("./../models/userStory.model");

const VALID_PRIORITIES = ["High", "Medium", "Low"];
const VALID_STORY_STATUSES = ["To Do", "In Progress", "Done"];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// null / undefined / ""  => valid, means Unassigned
// otherwise must be a real user AND a current member of the project
async function validateAssignee(projectId, assignedUserId) {
  if (
    assignedUserId === null ||
    assignedUserId === undefined ||
    assignedUserId === ""
  ) {
    return { ok: true, value: null };
  }
  if (!isValidId(assignedUserId)) {
    return { ok: false, msg: "Invalid assigned_user_id format." };
  }
  const user = await UserModel.findById(assignedUserId);
  if (!user) {
    return { ok: false, msg: "Assigned user does not exist." };
  }
  const membership = await ProjectMembershipModel.findOne({
    project_id: projectId,
    user_id: assignedUserId,
  });
  if (!membership) {
    return { ok: false, msg: "Assigned user is not a member of this project." };
  }
  return { ok: true, value: assignedUserId };
}

/* GET /projects/:projectId/stories — list (all statuses) */
router.route("/").get(async (req, res, next) => {
  try {
    const { projectId } = req.params;
    if (!isValidId(projectId)) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid project ID format." });
    }
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, msg: "Project does not exist." });
    }

    const stories = await UserStoryModel.find({ project_id: projectId })
      .populate("assigned_user_id", "f_name l_name username")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, stories });
  } catch (err) {
    next(err);
  }
});

/* POST /projects/:projectId/stories — create (status forced to "To Do") */
router.route("/").post(async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, assigned_user_id } = req.body;

    if (!isValidId(projectId)) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid project ID format." });
    }
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, msg: "Project does not exist." });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, msg: "Title is required." });
    }
    if (!description || !description.trim()) {
      return res
        .status(400)
        .json({ success: false, msg: "Description is required." });
    }
    if (!priority || !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        msg: `Priority must be one of: ${VALID_PRIORITIES.join(", ")}.`,
      });
    }

    const assigneeCheck = await validateAssignee(projectId, assigned_user_id);
    if (!assigneeCheck.ok) {
      return res.status(400).json({ success: false, msg: assigneeCheck.msg });
    }

    const story = await UserStoryModel.create({
      project_id: projectId,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "To Do", // forced on create
      assigned_user_id: assigneeCheck.value,
    });

    const populated = await story.populate(
      "assigned_user_id",
      "f_name l_name username"
    );

    return res
      .status(201)
      .json({ success: true, msg: "Story created.", story: populated });
  } catch (err) {
    next(err);
  }
});

/* PUT /projects/:projectId/stories/:storyId — update (project_id immutable) */
router.route("/:storyId").put(async (req, res, next) => {
  try {
    const { projectId, storyId } = req.params;
    const { title, description, priority, status, assigned_user_id } = req.body;

    if (!isValidId(projectId) || !isValidId(storyId)) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid project or story ID format." });
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, msg: "Project does not exist." });
    }

    const story = await UserStoryModel.findOne({
      _id: storyId,
      project_id: projectId,
    });
    if (!story) {
      return res
        .status(404)
        .json({ success: false, msg: "Story not found in this project." });
    }

    if (title !== undefined && (!title || !title.trim())) {
      return res
        .status(400)
        .json({ success: false, msg: "Title cannot be blank." });
    }
    if (description !== undefined && (!description || !description.trim())) {
      return res
        .status(400)
        .json({ success: false, msg: "Description cannot be blank." });
    }
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        msg: `Priority must be one of: ${VALID_PRIORITIES.join(", ")}.`,
      });
    }
    if (status !== undefined && !VALID_STORY_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: `Status must be one of: ${VALID_STORY_STATUSES.join(", ")}.`,
      });
    }

    if (assigned_user_id !== undefined) {
      const assigneeCheck = await validateAssignee(projectId, assigned_user_id);
      if (!assigneeCheck.ok) {
        return res.status(400).json({ success: false, msg: assigneeCheck.msg });
      }
      story.assigned_user_id = assigneeCheck.value;
    }

    if (title !== undefined) story.title = title.trim();
    if (description !== undefined) story.description = description.trim();
    if (priority !== undefined) story.priority = priority;
    if (status !== undefined) story.status = status;
    // project_id is intentionally not assignable

    const saved = await story.save();
    const populated = await saved.populate(
      "assigned_user_id",
      "f_name l_name username"
    );

    return res
      .status(200)
      .json({ success: true, msg: "Story updated.", story: populated });
  } catch (err) {
    next(err);
  }
});

/* DELETE /projects/:projectId/stories/:storyId */
router.route("/:storyId").delete(async (req, res, next) => {
  try {
    const { projectId, storyId } = req.params;

    if (!isValidId(projectId) || !isValidId(storyId)) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid project or story ID format." });
    }

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, msg: "Project does not exist." });
    }

    const deleted = await UserStoryModel.findOneAndDelete({
      _id: storyId,
      project_id: projectId,
    });
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, msg: "Story not found in this project." });
    }

    return res
      .status(200)
      .json({ success: true, msg: "Story deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;