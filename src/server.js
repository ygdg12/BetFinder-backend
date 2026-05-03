require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

const startServer = async () => {
  try {
    if (isProduction && !process.env.JWT_SECRET) {
      console.error("JWT_SECRET must be set in production (tokens cannot be issued without it)");
      process.exit(1);
    }

    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
