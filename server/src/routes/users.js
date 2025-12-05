const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Staff = require("../models/Staff");
const { requireAuth, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password, role, staffId } = req.body;
    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ message: "username, password, role required" });
    }
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token)
      return res.status(401).json({ message: "Admin token required" });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.role !== "admin")
        return res.status(403).json({ message: "Admin role required" });
    } catch (e) {
      return res.status(401).json({ message: "Invalid admin token" });
    }
    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ message: "Username already exists" });

    let staffRef = undefined;
    if (role === "staff") {
      if (!staffId)
        return res
          .status(400)
          .json({ message: "staffId required for staff role" });
      const staff = await Staff.findById(staffId);
      if (!staff) return res.status(404).json({ message: "Staff not found" });
      staffRef = staff._id;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashed,
      role,
      staff: staffRef,
    });
    res
      .status(201)
      .json({ id: user._id, username: user.username, role: user.role });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).populate("staff");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        staff: user.staff,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).populate("staff");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      id: user._id,
      username: user.username,
      role: user.role,
      staff: user.staff,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/admin/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (
      !currentPassword ||
      !newPassword ||
      typeof newPassword !== "string" ||
      !newPassword.trim()
    ) {
      return res
        .status(400)
        .json({ message: "currentPassword and newPassword required" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin role required" });
    }
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ message: "User not found" });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok)
      return res.status(401).json({ message: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    res.json({ id: user._id, username: user.username, role: user.role });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin: update password for a staff user
router.put("/staff/:staffId/password", requireAuth, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { newPassword } = req.body;
    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      !newPassword.trim()
    ) {
      return res.status(400).json({ message: "newPassword required" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin role required" });
    }
    const user = await User.findOne({ staff: staffId });
    if (!user) return res.status(404).json({ message: "Staff user not found" });
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    res.json({ id: user._id, username: user.username, role: user.role });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
// Admin delete staff login by staffId
router.delete("/staff/:staffId", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admin role required" });
    const user = await User.findOne({ staff: req.params.staffId });
    if (!user) return res.status(404).json({ message: "Staff user not found" });
    await User.findByIdAndDelete(user._id);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin maintenance: fix users unique index and purge invalid docs
router.post(
  "/maintenance/fix-username-index",
  requireAuth,
  async (req, res) => {
    try {
      if (req.user.role !== "admin")
        return res.status(403).json({ message: "Admin role required" });
      const purge = await User.deleteMany({
        $or: [
          { username: null },
          { username: { $exists: false } },
          { username: "" },
        ],
      });
      let dropped = false;
      try {
        await User.collection.dropIndex("username_1");
        dropped = true;
      } catch (e) {
        // index might not exist; ignore
      }
      await User.collection.createIndex({ username: 1 }, { unique: true });
      res.json({
        deleted: purge.deletedCount,
        indexRecreated: true,
        indexDropped: dropped,
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

// Bootstrap: create first admin without existing admin, guarded by a bootstrap token
router.post("/bootstrap-admin", async (req, res) => {
  try {
    const token = req.headers["x-bootstrap-token"];
    const expected = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (!expected || !token || token !== expected) {
      return res
        .status(403)
        .json({ message: "Bootstrap token invalid or not set" });
    }
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username and password required" });
    }
    const existsAdmin = await User.findOne({ role: "admin" });
    if (existsAdmin) {
      return res.status(409).json({ message: "Admin already exists" });
    }
    const existsUser = await User.findOne({ username });
    if (existsUser) {
      return res.status(409).json({ message: "Username already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashed,
      role: "admin",
    });
    const jwtToken = jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({
      id: user._id,
      username: user.username,
      role: user.role,
      token: jwtToken,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin: change own password (requires current password)
router.put("/admin/password", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin role required" });
    }
    const { currentPassword, newPassword } = req.body || {};
    if (
      !currentPassword ||
      !newPassword ||
      typeof newPassword !== "string" ||
      !newPassword.trim()
    ) {
      return res
        .status(400)
        .json({ message: "currentPassword and newPassword required" });
    }
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ message: "User not found" });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok)
      return res.status(401).json({ message: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    res.json({ id: user._id, username: user.username, role: user.role });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
