import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  unitNumber: { type: Number, required: true },
  name: { type: String },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  materials: [{ type: mongoose.Schema.Types.ObjectId, ref: "Material" }],
});

const Unit = mongoose.model("Unit", unitSchema);
export default Unit;
