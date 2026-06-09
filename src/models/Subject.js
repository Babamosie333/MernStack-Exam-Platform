const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
