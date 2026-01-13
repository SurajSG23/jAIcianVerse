import mongoose from "mongoose";

const summarySchema = new mongoose.Schema(
  {
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
  },
  { timestamps: true }
);

const Summary = mongoose.model("Summary", summarySchema);
export default Summary;
