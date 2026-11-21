const mongoose = require("mongoose");

const mongoUri =
  process.env.MONGO_URI || process.env.mongoURI || process.env.DATABASE_LOCAL;

if (!mongoUri) {
  console.log(
    "MONGO_URI is not set. Copy .env.example to .env and fill in the database connection string.",
  );
} else {
  console.log("Connecting to DB...");

  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("MongoDB Connected");
    })
    .catch((error) => {
      console.log("MongoDB connection error:", error.message);
    });
}

module.exports = mongoose.connection;
