import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String },

    role: {
      type: String,
      enum: ["student", "professor"],
      default: "student",
    },

    // Student-specific fields
    branch: { type: String },
    semester: { type: Number },
    points: { type: Number, default: 0 },
    contributions: {
      notesUploaded: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Material" },
      ],
      questionsAnswered: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Discussion" },
      ],
    },

    // Professor-specific fields
    department: { type: String },
    subjectsHandled: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    announcements: [
      {
        title: String,
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
