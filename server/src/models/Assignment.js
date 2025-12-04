const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    dateAssigned: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', AssignmentSchema);

