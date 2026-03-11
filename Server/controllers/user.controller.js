import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import fetch from "node-fetch";
import { hashPassword, comparePassword } from "../utils/password.utils.js";
import generateToken from "../config/generateToken.js";
import chatbotPrompt, { buildRAGPrompt } from "../aiConfig/prompts/chatbot.prompt.js";
import { generateWithLocalAI } from "../aiConfig/config/localAI.js";
import { geminiModel } from "../aiConfig/config/gemini.config.js";
import { generateWithOpenRouter } from "../aiConfig/config/openrouter.config.ts";

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
      profileImage: user.profileImage,

      // academic info
      branch: user.branch,
      semester: user.semester,
      department: user.department,

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

const fetchUserDetails = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,

      // academic info
      branch: user.branch,
      semester: user.semester,
      department: user.department,

      // gamification / system info
      points: user.points,
      contributions: user.contributions,
      subjectsHandled: user.subjectsHandled,

      // metadata
      createdAt: user.createdAt,
    },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const {
    name,
    email,
    branch,
    semester,
    profileImage, // Cloudinary URL string
  } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Update only if value exists
  user.name = name ?? user.name;
  user.email = email ?? user.email;
  user.branch = branch ?? user.branch;
  user.semester = semester ?? user.semester;
  user.profileImage = profileImage ?? user.profileImage;

  const updatedUser = await user.save();

  res.status(200).json({
    message: "Profile updated successfully",
    user: {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      branch: updatedUser.branch,
      semester: updatedUser.semester,
      profileImage: updatedUser.profileImage,
      points: updatedUser.points,
      contributions: updatedUser.contributions,
      subjectsHandled: updatedUser.subjectsHandled,
      createdAt: updatedUser.createdAt,
    },
  });
});

const incrementPoint = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { point } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $inc: { points: point },
    },
    { new: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    message: "Points updated successfully",
    points: user.points,
  });
});

const callAIModel = asyncHandler(async (req, res) => {
  const { query, model } = req.query;
  const prompt = chatbotPrompt(query);

  // Fetch RAG context from the semantic search service
  let ragContext = "";
  try {
    const ragRes = await fetch("http://localhost:5001/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK: 4 }),
      signal: AbortSignal.timeout(5000),
    });
    if (ragRes.ok) {
      const ragData = await ragRes.json();
      if (ragData.chunks?.length) {
        ragContext = ragData.chunks.join("\n\n");
      }
    }
  } catch {
    // RAG service unavailable — proceed without context
  }

  let response = "";

  const ragPrompt = buildRAGPrompt(query, ragContext);

  if (model === "gemini") {
    response = (await geminiModel.generateContent(ragPrompt)).response?.text();
  } else {
    response = await generateWithLocalAI(ragPrompt);
  }

  res.status(200).json({
    message: "success",
    data: response,
  });
});

export default {
  registerUser,
  loginUser,
  updateProfile,
  incrementPoint,
  fetchUserDetails,
  callAIModel,
};
