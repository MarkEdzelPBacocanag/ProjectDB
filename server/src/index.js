const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/projectdb";
const PORT = process.env.PORT;
const dbKind = MONGO_URI.startsWith("mongodb+srv://") ? "Atlas" : "local";
console.log(
  `Starting BarangayLink API on port ${PORT} (DB: ${dbKind}). Health: /health, API base: /api`
);

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log(`MongoDB connected (${dbKind})`);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes (mounted later when implemented)
app.use("/api/users", require("./routes/users"));
app.use("/api/residents", require("./routes/residents"));
app.use("/api/staff", require("./routes/staff"));
app.use("/api/services", require("./routes/services"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/assignments", require("./routes/assignments"));

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server Error" });
});

app.listen(PORT, () => {
  console.log(
    `Server ready at http://localhost:${PORT} (API: /api, health: /health)`
  );
});
