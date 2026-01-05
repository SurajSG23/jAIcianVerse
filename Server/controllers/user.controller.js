import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";

const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password, userType, branch, semester } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: userType,
    branch: userType === "student" ? branch : undefined,
    semester: userType === "student" ? Number(semester) : undefined,
  });

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const registerProfessor = asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department) {
    res.status(400);
    throw new Error("All fields are required");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const professor = await User.create({
    name,
    email,
    password,
    role: "professor",
    department,
  });

  res.status(201).json({
    message: "Professor registered successfully",
    professor: {
      id: professor._id,
      name: professor.name,
      email: professor.email,
      role: professor.role,
      department: professor.department,
    },
  });
});

export default { registerStudent, registerProfessor };
