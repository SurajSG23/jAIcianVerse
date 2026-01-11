import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    quote: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      default: "Professor",
      trim: true,
    },
    src: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
