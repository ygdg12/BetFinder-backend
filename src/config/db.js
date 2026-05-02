const mongoose = require("mongoose");

let lastDbError = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    lastDbError = "MONGODB_URI is required";
    throw new Error(lastDbError);
  }

  try {
    await mongoose.connect(mongoUri);
    lastDbError = null;
    console.log("MongoDB connected");
  } catch (error) {
    lastDbError = error.message || "Unknown database connection error";
    throw error;
  }
};

const getDbDiagnostics = () => ({
  connected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  error: lastDbError,
});

module.exports = { connectDB, getDbDiagnostics };
