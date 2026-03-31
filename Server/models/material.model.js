import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    approved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Material = mongoose.model("Material", materialSchema);
export default Material;
