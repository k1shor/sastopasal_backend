const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

// check if user is logged in
exports.auth = async (req, res, next) => {

    // get token from header
    const token = req.header("Authorization");

    // check if token exists
    if (!token) {
        return res.status(401).json({ error: "Access denied." });
    }

    try {

        // remove Bearer from token
        const realToken = token.replace("Bearer ", "");

        // verify token
        const decoded = jwt.verify(realToken, process.env.JWT_SECRET);

        // get latest user data from database, because role/status may change after login
        const user = await UserModel.findById(decoded._id).select("-password");

        if (!user) {
            return res.status(401).json({ error: "Invalid user." });
        }

        // store user data in request
        req.user = user;

        next();

    } catch (err) {
        return res.status(401).json({ error: "Invalid token." });
    }
};


// check admin role
exports.isAdmin = (req, res, next) => {

    if (req.user.role !== 2) {
        return res.status(403).json({ error: "Admin access only." });
    }

    next();
};


// check seller role
exports.isSeller = (req, res, next) => {

    if (req.user.role !== 1) {
        return res.status(403).json({ error: "Seller access only." });
    }

    if (req.user.sellerStatus !== "approved") {
        return res.status(403).json({ error: "Seller account is not approved yet." });
    }

    next();
};
