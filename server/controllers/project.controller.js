const router = require("express").Router();
const mongoose = require("mongoose");
const ProjectModel = require("./../models/project.model");
const UserModel = require("./../models/user.model");
const ProjectMembershipModel = require("./../models/projectMembership.model");

const VALID_STATUSES = ["Planning", "Active", "Completed"];

// POST /projects  — Create a project
router.route("/").post(async (req, res, next) => {
  try {
    const { name, description, status, project_lead_id } = req.body;

    // 1. Validate required fields
    if (!name || !description || !status || !project_lead_id) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required: name, description, status, project_lead_id.",
      });
    }

    // 2. Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: `Status must be one of: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    // 3. Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(project_lead_id)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid Project Lead ID format.",
      });
    }

    // 4. Verify the project lead exists
    const lead = await UserModel.findById(project_lead_id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        msg: "Selected Project Lead does not exist.",
      });
    }

    // 5. Create project
    const project = await ProjectModel.create({
      name,
      description,
      status,
      project_lead_id,
    });

    // 6. Auto-add the Project Lead as a member
    await ProjectMembershipModel.create({
      project_id: project._id,
      user_id: project_lead_id,
    });

    return res.status(201).json({
      success: true,
      msg: "Project created successfully.",
      project,
    });
  } catch (err) {
    next(err);
  }
});

// GET /projects  — List all projects (with lead info)
router.route("/").get(async (req, res, next) => {
  try {
    const projects = await ProjectModel.find()
      .populate("project_lead_id", "f_name l_name username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      projects,
    });
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id  — Get a single project
router.route("/:id").get(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid project ID format.",
      });
    }

    const project = await ProjectModel.findById(id).populate(
      "project_lead_id",
      "f_name l_name username"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        msg: "Project does not exist.",
      });
    }

    return res.status(200).json({ success: true, project });
  } catch (err) {
    next(err);
  }
});

// DELETE /projects/:id  — Delete a single project
router.route("/:id").delete(async (req, res, next) => {
    try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          msg: "Invalid project ID format.",
        });
      }
  
      const project = await ProjectModel.findById(id).populate(
        "project_lead_id",
        "f_name l_name username"
      );
  
      if (!project) {
        return res.status(404).json({
          success: false,
          msg: "Project does not exist.",
        });
      }

      project.deleteOne({_id:id})
        .then(pro=>{
            return res.status(200).json({
                success: true,project,
                msg:"Project Deleted!"
            })
        })
        .catch(err=>{
            return next(err);
        })
    } catch (err) {
      next(err);
    }
  });

module.exports = router;