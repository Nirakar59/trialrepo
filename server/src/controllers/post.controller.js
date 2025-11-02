import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { createNotification } from "./notification.controller.js";
import cloudinary from "../lib/cloudinary.js";


// ------------------------- Socket.IO -------------------------
let io;
let onlineUsers;

/**
 * Set the Socket.IO instance and online users map for real-time notifications.
 * @param {Object} socketIO - Socket.IO instance
 * @param {Map} onlineUsersMap - Map of online users
 */
export const setNotificationIO = (socketIO, onlineUsersMap) => {
    io = socketIO;
    onlineUsers = onlineUsersMap;
};

// ------------------------- Helper Functions -------------------------
const uploadImage = async (image) => {
    if (!image) return null;
    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${image.toString('base64')}`, {
        folder: "posts",
        resource_type: "image",
    });
    return result.secure_url;
};

export const notifyFollowers = async (userId, userName, postId) => {
    const followers = await User.find({ following: userId });
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

    for (const follower of followers) {
        const exists = await Notification.findOne({
            to: follower._id,
            from: userId,
            type: "follow",
            createdAt: { $gte: cutoff },
        });

        if (!exists) {
            await createNotification({
                to: follower._id,
                from: userId,
                type: "follow",
                message: `${userName} created a new post`,
                relatedPost: postId,
                io,
                onlineUsers,
            });
        }
    }
};

// ------------------------- CREATE POST -------------------------
export const createPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { text } = req.body;
        const image = req.files;


        if (!text && (!image || image.length === 0)) {
            return res.status(400).json({ message: "Text or image is required" });
        }

        let uploadedImages = [];

        if (image && image.length > 0) {

            const imagesArray = Array.isArray(image) ? image : [image];

            for (const img of imagesArray) {
                const url = await uploadImage(img.buffer);
                uploadedImages.push(url);
            }
        }

        const newPost = await Post.create({
            userId,
            text: text || "",
            image: uploadedImages,
        });
        // Notify followers
        await notifyFollowers(userId, req.user.name, newPost._id);

        res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (err) {
        console.error("Create post error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
// ------------------------- GET USER POSTS -------------------------
export const getAllPost = async (req, res) => {
    try {
        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .populate('userId', 'fullname username profilePics')
            .populate({
                path: 'comments.userId',
                select: 'fullname username profilePics' // Select only the fields you need
            })
            .populate({
                path: 'comments.replies.userId',
                select: 'fullname username profilePics' // Select only the fields you need
            });
        // console.log(posts)

        //filter null userId posts
        const filteredPosts = posts.filter(post => post.userId !== null);

        res.status(200).json({ success: true, posts: filteredPosts });

    } catch (err) {
        console.error("Get posts error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSinglePost = async (req, res) => {
    try {
        const {postId} = req.params;
        const post = await Post.findById(postId)
            .sort({ createdAt: -1 })
            .populate('userId', 'fullname username profilePics')
            .populate({
                path: 'comments.userId',
                select: 'fullname username profilePics' // Select only the fields you need
            })
            .populate({
                path: 'comments.replies.userId',
                select: 'fullname username profilePics' // Select only the fields you need
            });

        res.status(200).json({ success: true,post });

    } catch (err) {
        console.error("Get posts error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ------------------------- GET MY POSTS ------------------------- 
export const getMyPosts = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const posts = await Post.find({ userId: currentUserId }).populate("userId", "fullname username profilePics").sort({ createdAt: -1 });
        res.status(200).json({ posts });
    } catch (err) {
        console.error("Get my posts error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ------------------------- SHARE POST -------------------------
export const sharePost = async (req, res) => {
    try {
        const { postId, text } = req.body;
        const userId = req.user._id;

        const originalPost = await Post.findById(postId);
        if (!originalPost) return res.status(404).json({ message: "Original post not found" });

        const sharedPost = await Post.create({
            userId,
            text: text || "",
            sharedFrom: originalPost._id,
            images: originalPost.images,
        });

        if (originalPost.userId.toString() !== userId.toString()) {
            await createNotification({
                to: originalPost.userId,
                from: userId,
                type: "share",
                message: `${req.user.name} shared your post`,
                relatedPost: sharedPost._id,
                io,
                onlineUsers,
            });
        }

        res.status(201).json({ message: "Post shared successfully", post: sharedPost });
    } catch (err) {
        console.error("Share post error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ------------------------- DELETE POST -------------------------
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });
        if (post.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await post.deleteOne();
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
        console.error("Delete post error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ------------------------- LIKE / UNLIKE POST -------------------------
export const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userId = req.user._id;
        const hasLiked = post.likes.includes(userId.toString());

        if (hasLiked) {
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
            await Notification.findOneAndDelete({
                to: post.userId,
                from: userId,
                type: "like",
                relatedPost: post._id,
            });
            await post.save();
            return res.status(200).json({ message: "Like removed", likesCount: post.likes.length, post });
        }

        post.likes.push(userId);
        await post.save();

        if (post.userId.toString() !== userId.toString()) {
            const exists = await Notification.findOne({
                to: post.userId,
                from: userId,
                type: "like",
                relatedPost: post._id,
                link: `http://localhost:5173/posts/${post._id}`,
            });
            if (!exists) {
                await createNotification({
                    to: post.userId,
                    from: userId,
                    type: "like",
                    message: `${req.user.fullname} liked your post`,
                    relatedPost: post._id,
                    io,
                    onlineUsers,
                });
            }
        }

        res.status(200).json({ message: "Post liked", likesCount: post.likes.length, post });
    } catch (err) {
        console.error("Like post error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ------------------------- COMMENT / REPLY -------------------------
export const postComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: "Comment text is required" });

        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = { userId: req.user._id, text, createdAt: new Date() };
        post.comments.push(comment);
        await post.save();

        // Populate the userId field of the newly added comment
        const updatedPost = await Post.findById(req.params.postId)
            .populate({
                path: 'comments.userId',
                select: 'fullname username profilePics' // Select only the fields you need
            });

        // Get the newly added comment (last one in the comments array)
        const newComment = updatedPost.comments[updatedPost.comments.length - 1];

        // Handle notification logic
        if (post.userId.toString() !== req.user._id.toString()) {
            const exists = await Notification.findOne({
                to: post.userId,
                from: req.user._id,
                type: "comment",
                relatedPost: post._id,
            });

            if (!exists) {
                await createNotification({
                    to: post.userId,
                    from: req.user._id,
                    type: "comment",
                    message: `${req.user.fullname} commented on your post`,
                    relatedPost: post._id,
                    link: `http://localhost:5173/posts/${post._id}`,
                });
            }
        }

        res.status(201).json({
            message: "Comment added",
            comment: {
                ...newComment.toObject(),
                userId: {
                    _id: newComment.userId._id,
                    fullname: newComment.userId.fullname,
                    profile_picture: newComment.userId.profilePics
                }
            },
            commentsCount: updatedPost.comments.length
        });
    } catch (err) {
        console.error("Comment error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ------------------------- REPLY TO COMMENT -------------------------
export const addReply = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: "Reply text is required" });

        const post = await Post.findById(postId);
        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        const reply = { userId: req.user._id, text, createdAt: new Date() };
        comment.replies.push(reply);
        await post.save();

        // Populate the userId for the new reply (and related fields)
        const updatedPost = await Post.findById(postId)
            .populate({
                path: 'comments.replies.userId', // Populate userId in replies within comments
                select: 'fullname profile_picture' // Select specific fields (adjust if field is 'profilepic')
            });

        // Find the specific comment and extract the newly added reply
        const updatedComment = updatedPost.comments.id(commentId);
        const newReply = updatedComment.replies[updatedComment.replies.length - 1];

        // Handle notification logic (notify comment author if not the same user)
        if (comment.userId.toString() !== req.user._id.toString()) {
            await createNotification({
                to: comment.userId,
                from: req.user._id,
                type: "reply",
                message: `${req.user.name} replied to your comment`,
                relatedPost: post._id,
            });
        }

        res.status(201).json({ message: "Reply added", reply: newReply });
    } catch (err) {
        console.error("Add reply error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ------------------------- COMMENT / REPLY LIKE -------------------------
export const toggleLike = async (req, res) => {
    try {
        const { postId, commentId, replyId } = req.params;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        let target;
        if (replyId) {
            const comment = post.comments.id(commentId);
            if (!comment) return res.status(404).json({ message: "Comment not found" });
            target = comment.replies.id(replyId);
            if (!target) return res.status(404).json({ message: "Reply not found" });
        } else {
            target = post.comments.id(commentId);
            if (!target) return res.status(404).json({ message: "Comment not found" });
        }

        const idx = target.likes.indexOf(req.user._id);
        if (idx === -1) target.likes.push(req.user._id);
        else target.likes.splice(idx, 1);

        await post.save();
        res.status(200).json({ message: "Like updated", likesCount: target.likes.length });
    } catch (err) {
        console.error("Toggle like error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ------------------------- EDIT COMMENT / REPLY -------------------------
export const editText = async (req, res) => {
    try {
        const { postId, commentId, replyId } = req.params;
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: "Text is required" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        let target;
        if (replyId) {
            const comment = post.comments.id(commentId);
            if (!comment) return res.status(404).json({ message: "Comment not found" });
            target = comment.replies.id(replyId);
            if (!target) return res.status(404).json({ message: "Reply not found" });
        } else {
            target = post.comments.id(commentId);
            if (!target) return res.status(404).json({ message: "Comment not found" });
        }

        if (target.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        target.text = text;
        target.updatedAt = new Date();
        await post.save();

        res.status(200).json({ message: "Updated successfully", target });
    } catch (err) {
        console.error("Edit text error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
