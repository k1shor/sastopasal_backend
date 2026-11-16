require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const connection = require("./db/connection");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

app.get("/", (req, res) => {
    res.json({ message: "SastoPasal backend is running." });
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Keep API errors as JSON, including multer upload errors.
app.use((error, req, res, next) => {
    console.log(error.message);

    const status = error.status || (error.name === "MulterError" ? 400 : 500);

    res.status(status).json({
        error: error.message || "Internal server error."
    });
});

const PORT = process.env.PORT || 5000;

const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

if (connection.readyState === 1) {
    startServer();
} else {
    connection.once("open", startServer);
}

module.exports = app;
