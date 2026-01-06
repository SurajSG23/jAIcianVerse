import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import { hashPassword, comparePassword } from "../utils/password.utils.js";
import generateToken from "../config/generateToken.js";
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    userType, // "student" | "professor"
    branch,
    semester,
    department,
  } = req.body;

  if (!name || !email || !password || !userType) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  if (userType === "student" && (!branch || !semester)) {
    res.status(400);
    throw new Error("Branch and semester are required for students");
  }

  if (userType === "professor" && !department) {
    res.status(400);
    throw new Error("Department is required for professors");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const hashedPassword = await hashPassword(password);

  const userData = {
    name,
    email,
    password: hashedPassword,
    role: userType,
  };

  if (userType === "student") {
    userData.branch = branch;
    userData.semester = Number(semester);
  }

  if (userType === "professor") {
    userData.department = department;
  }

  const user = await User.create(userData);

  res.status(201).json({
    message: `${userType} registered successfully`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    res.status(401).send("Invalid email or password");
    throw new Error("Invalid email or password");
  }

  res.status(200).json({
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,

      // academic info
      branch: user.branch,
      semester: user.semester,

      // gamification / system info
      points: user.points,
      contributions: user.contributions,
      subjectsHandled: user.subjectsHandled,

      // metadata
      createdAt: user.createdAt,

      // auth
      token: generateToken(user._id),
    },
  });
});

export default { registerUser, loginUser };
