const express = require('express');
const Assignment = require('../models/Assignment');
const Request = require('../models/Request');
const Staff = require('../models/Staff');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { requestId, staffId } = req.query;
  const q = {};
  if (requestId) q.request = requestId;
  if (staffId) q.staff = staffId;
  const items = await Assignment.find(q)
    .populate({ path: 'request', populate: ['resident', 'service'] })
    .populate('staff')
    .sort({ dateAssigned: -1 });
  res.json(items);
});

router.post('/', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { requestId, staffId, dateAssigned } = req.body;
    const request = await Request.findById(requestId);
    const staff = await Staff.findById(staffId);
    if (!request || !staff) return res.status(404).json({ message: 'Request or Staff not found' });
    const item = await Assignment.create({ request: request._id, staff: staff._id, dateAssigned });
    const populated = await Assignment.findById(item._id)
      .populate({ path: 'request', populate: ['resident', 'service'] })
      .populate('staff');
    res.status(201).json(populated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  const item = await Assignment.findById(req.params.id)
    .populate({ path: 'request', populate: ['resident', 'service'] })
    .populate('staff');
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const item = await Assignment.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

module.exports = router;
