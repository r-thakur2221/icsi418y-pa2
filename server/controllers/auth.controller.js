const router = require("express").Router();
const UserModel = require("./../models/user.model");

// POST /auth/register  — Signup
router.route("/register").post(async (req, res, next) => {
  try {
    const { f_name, l_name, username, password } = req.body;

    // Validate all fields present
    if (!f_name || !l_name || !username || !password) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required.",
      });
    }

    // Check for existing username
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        msg: "Username already exists. Please choose another.",
      });
    }

    //Create and save new user
    const newUser = new UserModel({ f_name, l_name, username, password });
    const saved = await newUser.save();

    return res.status(201).json({
      success: true,
      msg: "Signup successful! You can now log in.",
      user: {
        _id: saved._id,
        f_name: saved.f_name,
        l_name: saved.l_name,
        username: saved.username,
      },
    });
  } catch (err) {
    // Mongoose duplicate key (race condition safety net)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        msg: "Username already exists. Please choose another.",
      });
    }
    next(err);
  }
});

// POST /auth/login  — Login
router.route("/login").post(async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate fields present
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        msg: "Username and password are required.",
      });
    }

    // Find user by username
    const user = await UserModel.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "Username does not exist.",
      });
    }

    // Compare password
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        msg: "Incorrect password.",
      });
    }

    // Success
    return res.status(200).json({
      success: true,
      msg: `Welcome back, ${user.f_name}! Login successful.`,
      user: {
        _id: user._id,
        f_name: user.f_name,
        l_name: user.l_name,
        username: user.username,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;