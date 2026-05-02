require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection failed:", error.message);

    if (!isProduction) {
      process.exit(1);
    }

    console.warn(
      "Continuing without a database connection in production. Set MONGODB_URI on your host."
    );
  }
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
