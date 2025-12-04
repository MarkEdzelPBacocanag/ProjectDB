const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    serviceType: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', ServiceSchema);

