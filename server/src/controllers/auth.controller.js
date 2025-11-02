import bcrypt from "bcryptjs"
import User from "../models/user.model.js"
import { generateToken } from "../utils/generatetokens.js"
import sendOtp, { sendResetPasswordEmail } from "../lib/nodemailer.js"

// Temporary storage for pending signups (you can replace with Redis or MongoDB if needed)
const pendingUsers = new Map();

// ------------------- SIGNUP -------------------
export const signup = async (req, res) => {
  const { fullname, password, email } = req.body;

  try {
    if (!fullname || !password || !email)
      return res.status(400).json({ message: "All fields are required" });

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password and store temporarily
    const salt = await bcrypt.genSalt(13);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP and expiry
    const verifyOtp = Math.floor(100000 + Math.random() * 900000);
    const verifyOtpExpireAT = Date.now() + 10 * 60 * 1000; // 10 mins

    // Create username and profile pic URL
    const username = email.split("@")[0];
    const profilePics = `https://avatar.iran.liara.run/username?username=${username}`;

    // Store pending user data (not yet in DB)
    pendingUsers.set(email, {
      fullname,
      email,
      username,
      profilePics,
      hashedPassword,
      verifyOtp,
      verifyOtpExpireAT,
    });

    // Send OTP to email
    await sendOtp(email, verifyOtp);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email for verification",
    });
  } catch (error) {
    console.log("SignUp Error:", error.message);
    res.status(500).json({ message: "Internal Server Error!!" });
  }
};

// ------------------- VERIFY OTP -------------------
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp)
      return res.status(400).json({ message: "All fields are required" });

    // Check pending user
    const pendingUser = pendingUsers.get(email);
    if (!pendingUser) {
      return res.status(400).json({ message: "No pending signup found or already verified" });
    }

    // Validate OTP
    if (pendingUser.verifyOtp.toString() !== otp.toString()) {
      return res.status(400).json({ message: "Invalid OTP!!" });
    }

    if (pendingUser.verifyOtpExpireAT < Date.now()) {
      pendingUsers.delete(email);
      return res.status(400).json({ message: "OTP Expired!!" });
    }

    // Create user in database
    const newUser = await User.create({
      fullname: pendingUser.fullname,
      email: pendingUser.email,
      username: pendingUser.username,
      profilePics: pendingUser.profilePics,
      password: pendingUser.hashedPassword,
      isVerified: true,
    });

    // Cleanup pending user
    pendingUsers.delete(email);

    // Generate token and respond
    const token = generateToken(newUser._id, res);

    res.status(200).json({
      success: true,
      message: "OTP verified and account created successfully",
      _id: newUser._id,
      email: newUser.email,
      fullName: newUser.fullname,
      token,
    });
  } catch (error) {
    console.log("VerifyOtp Error:", error.message);
    res.status(500).json({ message: "Internal Server Error!!" });
  }
};

// ------------------- LOGIN -------------------
export const login = async (req, res) => {
  const { password, email } = req.body;
  try {
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials!!" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid Credentials!!" });
    }

    const token = generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      email: user.email,
      fullName: user.fullname,
      username: user.username,
      bio: user.bio,
      location: user.location,
      profilePics: user.profilePics,
      cover_photo: user.cover_photo,
      followers: user.followers,
      following: user.following,
      connections: user.connections,
      connectionsRequest: user.connectionRequests,
      token,
    });
  } catch (error) {
    console.log("LogIn Error:", error);
    res.status(500).json({ message: "Internal Server Error!!" });
  }
};

// ------------------- LOGOUT -------------------
export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Logout Error:", error);
    res.status(500).json({ message: "Internal Server Error!!" });
  }
};

// ------------------- FORGOT PASSWORD -------------------
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found!!" });
    }

    const reSetOtp = Math.floor(100000 + Math.random() * 900000);
    const reSetOtpExpireAT = Date.now() + 10 * 60 * 1000;

    user.resetPasswordToken = reSetOtp;
    user.resetPasswordExpire = reSetOtpExpireAT;
    await user.save();
    await sendResetPasswordEmail(email, reSetOtp);

    res.status(200).json({
      message: "OTP sent to your email",
      data: { email, reSetOtp },
    });
  } catch (error) {
    console.log("ForgotPassword Error:", error);
    res.status(500).json({ message: "Internal Server Error!!" });
  }
};

// ------------------- RESET PASSWORD -------------------
export const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;
  try {
    if (!email || !otp || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found!!" });
    }

    if (user.resetPasswordToken !== otp) {
      return res.status(400).json({ message: "Invalid OTP!!" });
    }

    if (user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ message: "OTP Expired!!" });
    }

    const salt = await bcrypt.genSalt(13);
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log("ResetPassword Error:", error);
    res.status(500).json({ message: "Internal Server Error!!" });
  }
};
