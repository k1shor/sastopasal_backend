const UserModel = require("../models/userModel");
const TokenModel = require("../models/tokenModel");

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { emailSender } = require("../utils/emailSender");

// =================REGISTER =================
exports.register = async (req, res) => {

    // get data from request body
    const { username, email, password } = req.body;
    // check if username already exists
    let usernameExists = await UserModel.findOne({ username });

    if (usernameExists) {
        return res.status(400).json({ error: "Username already exists." });
    }
    // check if email already exists
    let emailExists = await UserModel.findOne({ email });

    if (emailExists) {
        return res.status(400).json({ error: "Email already registered." });
    }
    // hash password before saving
    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);

    //create new user
    let user = await UserModel.create({
        username,
        email,
        password: hashedPassword
    });

    if (!user) {
        return res.status(400).json({ error: "Failed to register user." });
    }
    //create email verification token
    let token = await TokenModel.create({
        user: user._id,
        token: crypto.randomBytes(16).toString("hex")
    });

    if (!token) {
        return res.status(400).json({ error: "Token generation failed." });
    }

    // verification link
    const URL = `http://localhost:5173/verify/${token.token}`;

    // send verification email
    emailSender({
        from: "noreply@sastopasal.com",
        to: email,
        subject: "Verify your account",
        text: `Open this link to verify your account: ${URL}`,
        html: `<a href="${URL}"><button>Verify Account</button></a>`
    });

    // send success response
    res.send({
        message: "User registered successfully.",
        user
    });

};

// =================EMAIL VERIFICATION =================
exports.emailVerification = async (req, res) => {

    // find token
    let token = await TokenModel.findOne({ token: req.params.token });

    if (!token) {
        return res.status(400).json({ error: "Invalid or expired token." });
    }

    // find user
    let user = await UserModel.findById(token.user);

    if (!user) {
        return res.status(400).json({ error: "User not found." });
    }

    // check if already verified
    if (user.isVerified) {
        return res.status(400).json({ error: "User already verified." });
    }

    // verify user
    user.isVerified = true;
    await user.save();

    res.send({ message: "Email verified successfully." });

};

// =================RESEND VERIFICATION =================
exports.resendVerification = async (req, res) => {

    // check email
    let user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
        return res.status(400).json({ error: "Email not registered." });
    }

    if (user.isVerified) {
        return res.status(400).json({ error: "User already verified." });
    }

    // create new token
    let token = await TokenModel.create({
        user: user._id,
        token: crypto.randomBytes(16).toString("hex")
    });

    const URL = `http://localhost:5173/verify/${token.token}`;

    // send email
    emailSender({
        from: "noreply@sastopasal.com",
        to: user.email,
        subject: "Verify your account",
        text: `Verify your account using this link: ${URL}`,
        html: `<a href="${URL}"><button>Verify</button></a>`
    });

    res.send({ message: "Verification email sent." });

};

// =================FORGET PASSWORD =================
exports.forgetPassword = async (req, res) => {

    // check email
    let user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
        return res.status(400).json({ error: "Email not found." });
    }

    // create reset token
    let token = await TokenModel.create({
        user: user._id,
        token: crypto.randomBytes(24).toString("hex")
    });

    const URL = `http://localhost:5173/resetpassword/${token.token}`;

    // send email
    emailSender({
        from: "noreply@sastopasal.com",
        to: user.email,
        subject: "Reset Password",
        text: `Reset your password here: ${URL}`,
        html: `<a href="${URL}"><button>Reset Password</button></a>`
    });

    res.send({ message: "Password reset link sent." });

};

// =================RESET PASSWORD =================
exports.resetPassword = async (req, res) => {

    // verify token
    let token = await TokenModel.findOne({ token: req.params.token });

    if (!token) {
        return res.status(400).json({ error: "Invalid token." });
    }

    // find user
    let user = await UserModel.findById(token.user);

    if (!user) {
        return res.status(400).json({ error: "User not found." });
    }

    // hash new password
    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(req.body.password, salt);

    // update password
    user.password = hashedPassword;
    await user.save();

    res.send({ message: "Password updated successfully." });

};

// =================LOGIN =================
exports.login = async (req, res) => {

    // get login details
    const { email, password } = req.body;

    // check email
    let user = await UserModel.findOne({ email });

    if (!user) {
        return res.status(400).json({ error: "Email not registered." });
    }

    // compare password
    let match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.status(401).json({ error: "Incorrect password." });
    }

    // check verification
    if (!user.isVerified) {
        return res.status(400).json({ error: "Please verify your email first." });
    }

    // create jwt token
    let token = jwt.sign(
        {
            _id: user._id,
            email: user.email,
            username: user.username,
            role: user.role
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
            role: user.role
        }
    });

};

// =================GET USERS =================
exports.getUsersList = async (req, res) => {

    // get all users
    let users = await UserModel.find();

    if (!users) {
        return res.status(400).json({ error: "Something went wrong." });
    }

    res.send(users);

};
// =================VERIFY USER BY ADMIN =================
exports.verifyByAdmin = async (req, res) => {

    // find user
    let user = await UserModel.findById(req.params.id);

    if (!user) {
        return res.status(400).json({ error: "User not found." });
    }

    if (user.isVerified) {
        return res.status(400).json({ error: "User already verified." });
    }

    // verify user
    user.isVerified = true;
    await user.save();

    res.send({
        success: true,
        message: "User verified by admin."
    });

};

// =================UPDATE USER ROLE =================
exports.updateRole = async (req, res) => {

    // update role directly
    let user = await UserModel.findByIdAndUpdate(
        req.params.id,
        { role: req.body.role },
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
