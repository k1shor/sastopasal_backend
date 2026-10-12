
const UserModel = require("../models/userModel");
const TokenModel = require("../models/tokenModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { emailSender } = require("../utils/emailSender");

const sendMailSafely = async (mailOptions) => {
    try {
        await emailSender(mailOptions);
        return true;
    } catch (error) {
        console.log("Email sending skipped or failed:", error.message);
        return false;
    }
};

// ================= REGISTER =================
exports.register = async (req, res) => {
    const { username, email, password, role } = req.body;
    const selectedRole = Number(role) === 1 ? 1 : 0;

    // Check if username already exists
    let usernameExists = await UserModel.findOne({ username });

    if (usernameExists) {
        return res.status(400).json({ error: "Username already exists." });
    }

    // Check if email already exists
    let emailExists = await UserModel.findOne({ email });

    if (emailExists) {
        return res.status(400).json({ error: "Email already registered." });
    }

    // Hash password before saving
    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    let user = await UserModel.create({
        username,
        email,
        password: hashedPassword,
        role: selectedRole,
        sellerStatus: selectedRole === 1 ? "pending" : "none"
    });

    if (!user) {
        return res.status(400).json({ error: "Failed to register user." });
    }

    // Create email verification token
    let token = await TokenModel.create({
        user: user._id,
        token: crypto.randomBytes(16).toString("hex")
    });

    if (!token) {
        return res.status(400).json({ error: "Token generation failed." });
    }

    const URL = `http://localhost:5173/verify/${token.token}`;

    // Send verification email. If Gmail is not configured, registration should still work for testing.
    const emailSent = await sendMailSafely({
        from: "noreply@sastopasal.com",
        to: email,
        subject: "Verify your account",
        text: `Open this link to verify your account: ${URL}`,
        html: `<a href="${URL}"><button>Verify Account</button></a>`
    });

    let userResponse = user.toObject();
    delete userResponse.password;

    res.send({
        message: "User registered successfully.",
        user: userResponse,
        emailSent,
        verificationToken: emailSent ? undefined : token.token
    });
};

// ================= EMAIL VERIFICATION =================
exports.emailVerification = async (req, res) => {
    let token = await TokenModel.findOne({ token: req.params.token });

    if (!token) {
        return res.status(400).json({ error: "Invalid or expired token." });
    }

    let user = await UserModel.findById(token.user);

    if (!user) {
        return res.status(400).json({ error: "User not found." });
    }

    if (user.isVerified) {
        return res.status(400).json({ error: "User already verified." });
    }

    user.isVerified = true;
    await user.save();

    await TokenModel.findByIdAndDelete(token._id);

    res.send({ message: "Email verified successfully." });
};

// ================= RESEND VERIFICATION =================
exports.resendVerification = async (req, res) => {
    let user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
        return res.status(400).json({ error: "Email not registered." });
    }

    if (user.isVerified) {
        return res.status(400).json({ error: "User already verified." });
    }

    let token = await TokenModel.create({
        user: user._id,
        token: crypto.randomBytes(16).toString("hex")
    });

    const URL = `http://localhost:5173/verify/${token.token}`;

    const emailSent = await sendMailSafely({
        from: "noreply@sastopasal.com",
        to: user.email,
        subject: "Verify your account",
        text: `Verify your account using this link: ${URL}`,
        html: `<a href="${URL}"><button>Verify</button></a>`
    });

    res.send({
        message: emailSent ? "Verification email sent." : "Verification token created, but email was not sent.",
        emailSent,
        verificationToken: emailSent ? undefined : token.token
    });
};

// ================= FORGET PASSWORD =================
exports.forgetPassword = async (req, res) => {
    let user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
        return res.status(400).json({ error: "Email not found." });
    }

    let token = await TokenModel.create({
        user: user._id,
        token: crypto.randomBytes(24).toString("hex")
    });

    const URL = `http://localhost:5173/resetpassword/${token.token}`;

    const emailSent = await sendMailSafely({
        from: "noreply@sastopasal.com",
        to: user.email,
        subject: "Reset Password",
        text: `Reset your password here: ${URL}`,
        html: `<a href="${URL}"><button>Reset Password</button></a>`
    });

    res.send({
        message: emailSent ? "Password reset link sent." : "Password reset token created, but email was not sent.",
        emailSent,
        resetToken: emailSent ? undefined : token.token
    });
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
    let token = await TokenModel.findOne({ token: req.params.token });

    if (!token) {
        return res.status(400).json({ error: "Invalid token." });
    }

    let user = await UserModel.findById(token.user);

    if (!user) {
        return res.status(400).json({ error: "User not found." });
    }

    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(req.body.password, salt);

    user.password = hashedPassword;
    await user.save();

    await TokenModel.findByIdAndDelete(token._id);

    res.send({ message: "Password updated successfully." });
};

// ================= LOGIN =================
exports.login = async (req, res) => {
    const { email, password } = req.body;

    let user = await UserModel.findOne({ email });

    if (!user) {
        return res.status(400).json({ error: "Email not registered." });
    }

    let match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.status(401).json({ error: "Incorrect password." });
    }

    if (!user.isVerified) {
        return res.status(400).json({ error: "Please verify your email first." });
    }

    let token = jwt.sign(
        {
            _id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            sellerStatus: user.sellerStatus
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.send({
        message: "Login successful.",
        token,
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            sellerStatus: user.sellerStatus
        }
    });
};

// ================= GET USERS =================
exports.getUsersList = async (req, res) => {
    let users = await UserModel.find().select("-password");

    if (!users) {
        return res.status(400).json({ error: "Something went wrong." });
    }

    res.send(users);
};

// ================= GET PROFILE =================
exports.getProfile = async (req, res) => {
    let user = await UserModel.findById(req.user._id).select("-password");

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    res.send(user);
};

// ================= UPDATE PROFILE =================
exports.updateProfile = async (req, res) => {
    let user = await UserModel.findByIdAndUpdate(
        req.user._id,
        {
            username: req.body.username,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address
        },
        { new: true }
    ).select("-password");

    if (!user) {
        return res.status(400).json({ error: "Failed to update profile." });
    }

    res.send({
        message: "Profile updated successfully.",
        user
    });
};

// ================= DELETE USER =================
exports.deleteUser = async (req, res) => {
    let user = await UserModel.findByIdAndDelete(req.params.id);

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    res.send({ message: "User deleted successfully." });
};

// ================= VERIFY USER BY ADMIN =================
exports.verifyByAdmin = async (req, res) => {
    let user = await UserModel.findById(req.params.id);

    if (!user) {
        return res.status(400).json({ error: "User not found." });
    }

    if (user.isVerified) {
        return res.status(400).json({ error: "User already verified." });
    }

    user.isVerified = true;
    await user.save();

    res.send({
        success: true,
        message: "User verified by admin."
    });
};

// ================= UPDATE USER ROLE =================
exports.updateRole = async (req, res) => {
    const selectedRole = Number(req.body.role);

    let user = await UserModel.findByIdAndUpdate(
        req.params.id,
        {
            role: selectedRole,
            sellerStatus: selectedRole === 1 ? "approved" : "none"
        },
        { new: true }
    );

    if (!user) {
        return res.status(400).json({ error: "Failed to update role." });
    }

    res.send({
        message: "User role updated.",
        user
    });
};

// ================= UPDATE SELLER STATUS =================
exports.updateSellerStatus = async (req, res) => {
    let user = await UserModel.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    if (user.role !== 1) {
        return res.status(400).json({ error: "This user is not a seller." });
    }

    user.sellerStatus = req.body.sellerStatus || user.sellerStatus;
    await user.save();

    res.send({
        message: "Seller status updated.",
        user
    });
};
