const express = require("express");
const Request = require("../models/Request");
const Resident = require("../models/Resident");
const Service = require("../models/Service");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const { residentId, serviceId, status } = req.query;
  const q = {};
  if (residentId) q.resident = residentId;
  if (serviceId) q.$or = [{ service: serviceId }, { services: serviceId }];
  if (status) q.status = status;
  const items = await Request.find(q)
    .populate("resident")
    .populate("service")
    .populate("services")
    .sort({ dateRequested: -1 });
  res.json(items);
});

router.post(
  "/",
  requireAuth,
  requireRole("admin", "staff"),
  async (req, res) => {
    try {
      const { residentId, serviceId, serviceIds = [], status } = req.body;
      const resident = await Resident.findById(residentId);
      if (!resident)
        return res.status(404).json({ message: "Resident not found" });
      let payload = { resident: resident._id, status: status || "pending" };
      if (Array.isArray(serviceIds) && serviceIds.length > 0) {
        const count = await Service.countDocuments({
          _id: { $in: serviceIds },
        });
        if (count !== serviceIds.length)
          return res
            .status(404)
            .json({ message: "One or more services not found" });
        payload.services = serviceIds;
      } else if (serviceId) {
        const service = await Service.findById(serviceId);
        if (!service)
          return res.status(404).json({ message: "Service not found" });
        payload.service = service._id;
      } else {
        return res
          .status(400)
          .json({ message: "serviceId or serviceIds required" });
      }
      const item = await Request.create(payload);
      const populated = await Request.findById(item._id)
        .populate("resident")
        .populate("service")
        .populate("services");
      res.status(201).json(populated);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
);

router.get("/:id", async (req, res) => {
  const item = await Request.findById(req.params.id)
    .populate("resident")
    .populate("service")
    .populate("services");
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

router.put(
  "/:id",
  requireAuth,
  requireRole("staff", "admin"),
  async (req, res) => {
    try {
      const allowed = ["pending", "in_progress", "completed"];
      const payload = {};
      if (typeof req.body.status === "string") {
        const s = req.body.status.trim();
        if (!allowed.includes(s)) {
          return res.status(400).json({ message: "Invalid status" });
        }
        payload.status = s;
      }
      const item = await Request.findByIdAndUpdate(req.params.id, payload, {
        new: true,
      })
        .populate("resident")
        .populate("service")
        .populate("services");
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }
);

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const item = await Request.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  res.status(204).end();
});

module.exports = router;
