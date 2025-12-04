const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "staff"] },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
