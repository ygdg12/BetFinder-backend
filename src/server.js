require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
const isRender = Boolean(process.env.RENDER);

const startServer = async () => {
  try {
    if ((isProduction || isRender) && !process.env.JWT_SECRET?.trim()) {
      console.error("JWT_SECRET must be set when deployed (RENDER or NODE_ENV=production)");
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
