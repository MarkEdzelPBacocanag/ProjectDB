const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', StaffSchema);

