const mongoose = require('mongoose');

const ResidentSchema = new mongoose.Schema(
  {
    residentId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    birthDate: { type: Date, required: true },
    contactNumber: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resident', ResidentSchema);
