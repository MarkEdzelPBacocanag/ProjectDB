const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    dateRequested: { type: Date, required: true, default: Date.now },
    status: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Request', RequestSchema);
