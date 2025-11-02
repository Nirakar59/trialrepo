import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";

export const getHomeData = async (req,res) => {


    try {
        const userId = req.user.id;

        //current user details 
       const user = await User.findById(userId).select("username profilePic followers following");

       //posts of people they follow
       
        const followingIds = user.following.concat(userId); 
    const feed = await Post.find({ user: { $in: followingIds } })
      .populate("user", "username profilePic")
      .sort({ createdAt: -1 })
      .limit(20);

      //notifications 
      const notifications = await Notification.find({ user: userId })
      .populate("sender", "username profilePic")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        profilePic: user.profilePic,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        unreadNotifications: notifications.filter(n => !n.isRead).length
      },
      feed: feed.map(post => ({
        id: post._id,
        user: post.user,
        text: post.text,
        image: post.image,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        isLikedByCurrentUser: post.likes.includes(userId),
        createdAt: post.createdAt
      })),
      notifications
    });



    } catch (error) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
;}