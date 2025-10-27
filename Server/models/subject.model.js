import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    branch: { type: String, required: true },
    semester: { type: Number, required: true },

    units: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit" }],
  },
  { timestamps: true }
);

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;