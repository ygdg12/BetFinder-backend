const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { getDbDiagnostics } = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const propertyRoutes = require("./routes/property.routes");
const bookingRoutes = require("./routes/booking.routes");
const adminRoutes = require("./routes/admin.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

const allowedOrigin = process.env.CLIENT_URL || "*";

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigin === "*" ? true : allowedOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (req, res) => {
  const db = getDbDiagnostics();
  const response = {
    ok: db.connected,
    db: {
      connected: db.connected,
      readyState: db.readyState,
    },
  };

  if (db.error) {
    response.db.error = db.error;
  }

  res.status(db.connected ? 200 : 503).json(response);
});

app.use((req, res, next) => {
  if (req.path === "/api/health") {
    return next();
  }

  if (!getDbDiagnostics().connected) {
    return res.status(503).json({
      message: "Service unavailable: database is not connected",
    });
  }

  return next();
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
