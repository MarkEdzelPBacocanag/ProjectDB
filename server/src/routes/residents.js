const express = require('express');
const Resident = require('../models/Resident');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const items = await Resident.find().sort({ name: 1 });
  res.json(items);
});

router.post('/', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const item = await Resident.create(req.body);
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  const item = await Resident.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

router.put('/:id', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const item = await Resident.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const resident = await Resident.findById(req.params.id);
  if (!resident) return res.status(404).json({ message: 'Not found' });
  const Request = require('../models/Request');
  const Assignment = require('../models/Assignment');
  const requests = await Request.find({ resident: resident._id }, { _id: 1 });
  const reqIds = requests.map((r) => r._id);
  if (reqIds.length > 0) {
    await Assignment.deleteMany({ request: { $in: reqIds } });
    await Request.deleteMany({ _id: { $in: reqIds } });
  }
  await Resident.findByIdAndDelete(resident._id);
  res.status(204).end();
});

module.exports = router;
