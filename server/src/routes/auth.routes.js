import express from "express"

import { login, logout, signup, verifyOtp, forgotPassword, resetPassword} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verifyOtp", verifyOtp);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword", resetPassword);
export default router;