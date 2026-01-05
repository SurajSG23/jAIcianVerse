import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";

const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    userType,
    branch,
    semester,
  } = req.body;


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
    password, // ⚠️ hash later
    role: userType, // map userType → role
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

export default { registerUser };
