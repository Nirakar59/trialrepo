import express from "express";
import { createPost, deletePost,getSinglePost, getAllPost,getMyPosts, likePost, postComment, addReply, toggleLike, editText, sharePost } from "../controllers/post.controller.js";
import upload from "../middleware/upload.middleware.js"
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Post routes
router.post("/createpost", protectRoute, upload.array("image", 5),createPost);
router.get("/getAllpost", protectRoute, getAllPost);
router.get("/getpostbyid/:postId", protectRoute, getSinglePost);

router.get("/getmyposts", protectRoute, getMyPosts);
router.delete("/deletepost/:postId", protectRoute, deletePost);
router.put("/likepost/:postId", protectRoute, likePost);

// Comment routes
router.post("/:postId/comments", protectRoute, postComment);
router.post("/:postId/comments/:commentId/replies", protectRoute, addReply);
router.put("/:postId/comments/:commentId/like", protectRoute, toggleLike);
router.put("/:postId/comments/:commentId/replies/:replyId/like", protectRoute, toggleLike);
router.put("/:postId/comments/:commentId", protectRoute, editText);
router.put("/:postId/comments/:commentId/replies/:replyId", protectRoute, editText);
// NEW ROUTE
router.post("/share", protectRoute, sharePost);

export default router;
