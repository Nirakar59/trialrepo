import User from "../models/user.model.js";
import Notifi from "../models/notification.model.js";
import Post from "../models/post.model.js";
import cloudinary from "../lib/cloudinary.js";

// SEND CONNECTION REQUEST
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.params; // ID of user to send request to
    const currentUserId = req.user._id;

    if (userId === String(currentUserId)) {
      return res.status(400).json({ message: "You cannot send a connection request to yourself" });
    }

    const userToConnect = await User.findById(userId);
    if (!userToConnect) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already connected
    if (userToConnect.connections.includes(currentUserId)) {
      return res.status(400).json({ message: "You are already connected with this user" });
    }

    console.log(userToConnect.connectionRequests,userToConnect.connectionRequests.includes(currentUserId))

    // Check if request already sent
    if (userToConnect.connectionRequests.includes(currentUserId)) {
      return res.status(400).json({ message: "Connection request already sent" });
    }

    // Add connection request
    userToConnect.connectionRequests.push(currentUserId);
    await userToConnect.save();

    // Create notification
    const notification = new Notifi({
      from: currentUserId,
      to: userId,
      type: "connect",
      message: `${req.user.fullname} sent you a connection request`
    });
    await notification.save();

    res.status(200).json({ message: "Connection request sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Pending connection requests
export const getPendingConnectionRequests = async (req, res) => {
  try {
    const {userId} = req.params; // get user ID from URL
    const user = await User.findById(userId).populate("connectionRequests", "username fullname profilePics bio");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user)
    res.status(200).json(user.connectionRequests);
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ACCEPT CONNECTION REQUEST
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.params; // ID of user whose request is being accepted
    const currentUserId = req.user._id;

    if (userId === String(currentUserId)) {
      return res.status(400).json({ message: "You cannot accept a request from yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const userToConnect = await User.findById(userId);

    if (!userToConnect || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request exists
    if (!currentUser.connectionRequests.includes(userId)) {
      return res.status(400).json({ message: "No connection request from this user" });
    }

    // Add to mutual connections
    if (!currentUser.connections.includes(userId)) {
      currentUser.connections.push(userId);
      userToConnect.connections.push(currentUserId);
    }

    // Remove from connection requests
    currentUser.connectionRequests.pull(userId);
    await currentUser.save();
    await userToConnect.save();

    // Create notification
    const notification = new Notifi({
      from: currentUserId,
      to: userId,
      type: "connect",
      message: `${req.user.fullname} accepted your connection request`
    });
    await notification.save();

    res.status(200).json({ message: "Connection request accepted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REJECT CONNECTION REQUEST
export const rejectConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.params; // ID of user whose request is being rejected
    const currentUserId = req.user._id;

    if (userId === String(currentUserId)) {
      return res.status(400).json({ message: "You cannot reject a request from yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request exists
    if (!currentUser.connectionRequests.includes(userId)) {
      return res.status(400).json({ message: "No connection request from this user" });
    }

    // Remove from connection requests
    currentUser.connectionRequests.pull(userId);
    await currentUser.save();

    res.status(200).json({ message: "Connection request rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REMOVE CONNECTION
export const removeConnection = async (req, res) => {
  try {
    const { userId } = req.params; // ID of user to remove from connections
    const currentUserId = req.user._id;

    if (userId === String(currentUserId)) {
      return res.status(400).json({ message: "You cannot remove yourself from connections" });
    }

    const currentUser = await User.findById(currentUserId);
    const userToRemove = await User.findById(userId);

    if (!userToRemove || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if connected
    if (!currentUser.connections.includes(userId)) {
      return res.status(400).json({ message: "You are not connected with this user" });
    }

    // Remove from mutual connections
    currentUser.connections.pull(userId);
    userToRemove.connections.pull(currentUserId);
    await currentUser.save();
    await userToRemove.save();

    res.status(200).json({ message: "Connection removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// get connections
export const getConnections = async (req, res) => {
    try {
        const {userId }= req.params; // get user ID from URL
        const user = await User.findById(userId).populate("connections", "username fullname profilePics bio");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user.connections);
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}
//  FOLLOW USER 
export const followUser = async (req, res) => {
    try {
        const { userId } = req.params; // ID of user to follow
        const currentUser = req.user._id;
        // console.log("current user", req.user)
        // console.log(userId, currentUser)
        if (userId === String(currentUser)) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const userToFollow = await User.findById(userId);
        if (!userToFollow) return res.status(404).json({ message: "User not found" });
        // console.log("user to follow", userToFollow)
        // Check if already following
        if (userToFollow.followers.includes(currentUser)) {
            return res.status(400).json({ message: "Already following this user" });
        }

        // update followers/following  
        userToFollow.followers.push(currentUser);
        await userToFollow.save();

        await User.findByIdAndUpdate(currentUser, { $push: { following: userId } });

        //CREATE NOTIFICATION
        const notification = new Notifi({
            from: currentUser,
            to: userId,
            type: "follow",
            message: `${req.user.fullname} followed you`,
        });
        await notification.save();
        res.status(200).json({ message: "User followed successfully" });

        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UNFOLLOW USER 
export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.params; // ID of user to unfollow
        const currentUser = req.user._id;

        if (userId === String(currentUser)) {
            return res.status(400).json({ message: "You cannot unfollow yourself" });
        }

        const userToUnfollow = await User.findById(userId);
        if (!userToUnfollow) return res.status(404).json({ message: "User not found" });

        // Check if not following
        if (!userToUnfollow.followers.includes(currentUser)) {
            return res.status(400).json({ message: "You are not following this user" });
        }

        userToUnfollow.followers.pull(currentUser);
        await userToUnfollow.save();

        await User.findByIdAndUpdate(currentUser, { $pull: { following: userId } });

        res.status(200).json({ message: "User unfollowed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//  GET FOLLOWERS 
export const getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate("followers", "username fullname profilePics bio");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user.followers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//  GET FOLLOWING 
export const getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate("following", "username fullname profilePics bio");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user.following);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// GET OWN PROFILE 
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password -__v")
            .populate("followers", "username fullname profilePicture")
            .populate("following", "username fullname profilePicture");

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

//  GET MY PROFILE WITH POSTS
export const getMyProfile = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const user = await User.findById(currentUserId)
            .select("-password")
            .populate("followers", "fullname username profilePics ")
            .populate("following", "fullname username profilePics ")
            .lean();

        if (!user) return res.status(404).json({ message: "User not found" });

        const posts = await Post.find({ userId: currentUserId }).populate("userId", "fullname username profilePics").populate("comments.userId", "fullname username profilePics").populate("comments.replies.userId", "fullname username profilePics").sort({ createdAt: -1 });

        res.status(200).json({ user, posts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//  GET OTHER USER PROFILE WITH POSTS 
export const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const user = await User.findById(userId)
            .select("-email -password -__v -createAT -updatedAt")
            .populate("followers", "fullname username profilePics")
            .populate("following", "fullname username profilePics")
            .lean();

        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if current user is following this user
        const isFollowing = user.followers.some(follower => String(follower._id) === String(currentUserId));

        // Calculate mutual followers
        const currentUser = await User.findById(currentUserId)
            .select("following followers")
            .populate("following", "fullname username profilePics")
            .populate("followers", "fullname username profilePics")
            .lean();

        // Mutual followers = users that both follow each other
        const mutualFollowers = user.followers.filter(follower =>
            currentUser.following.some(f => String(f._id) === String(follower._id))
        );

        const posts = await Post.find({ userId }).sort({ createdAt: -1 }).populate("userId", "fullname username profilePics");

        res.status(200).json({
            user,
            posts,
            isFollowing,
            mutualFollowers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//inside of bio there is profilepic,cover_photo,bio,and location
export const setbio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, location } = req.body;


        if (bio && bio.length > 200) {
            return res.status(400).json({ message: "Bio must be under 200 characters" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }


        if (bio) user.bio = bio;
        if (location) user.location = location;


        if (req.file?.profilePics) {
            const uploadPP = await cloudinary.uploader.upload(req.file.profilePics);
            user.profilePics = uploadPP.secure_url;
        }


        if (req.file?.cover_photo) {
            const uploadCover = await cloudinary.uploader.upload(req.file.cover_photo);
            user.cover_photo = uploadCover.secure_url;
        }

        await user.save();

        res.status(200).json({ message: "Profile updated successfully", profile: user });

    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


//get the all bio 
export const getbio = async (req, res) => {
    try {
        const userId = req.params.id; // get user ID from URL
        const user = await User.findById(userId).select("-password, -email");

        if (!user) {
            return res.status(404).json({ message: "Bio not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

//get all users except current user
export const getAllUsers = async (req, res) => {
    try {
        const userId = req.user._id;
        const users = await User.find({ _id: { $ne: userId } }).select("-password, -email");

        res.status(200).json(users);
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// Utility function to upload a single file to Cloudinary
const uploadToCloudinary = async (file, folder) => {
    if (!file) return null;
    
    try {
        const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64Image, {
            resource_type: 'image',
            folder,
        });
        return result.secure_url;
    } catch (error) {
        console.error(`Cloudinary upload error for ${folder}:`, error);
        throw new Error(`Failed to upload ${folder} image`);
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, username, bio, location } = req.body;
        console.log(req.body,'need to update like this')
        // Check if any updates are provided
        if (!fullName && !username && !bio && !location && !req.files) {
            return res.status(400).json({ message: 'No updates provided' });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields only if provided
        if (fullName) user.fullname = fullName;
        if (username) user.username = username;
        if (bio) user.bio = bio;
        if (location) user.location = location;

        // Handle file uploads
        if (req.files) {
            if (req.files.profilePics) {
                const profilePicFile = Array.isArray(req.files.profilePics) 
                    ? req.files.profilePics[0] 
                    : req.files.profilePics;
                user.profilePics = await uploadToCloudinary(profilePicFile, 'profiles');
            }
            if (req.files.cover_photo) {
                const coverPhotoFile = Array.isArray(req.files.cover_photo) 
                    ? req.files.cover_photo[0] 
                    : req.files.cover_photo;
                user.cover_photo = await uploadToCloudinary(coverPhotoFile, 'profiles');
            }
        }

        // Save updated user
        await user.save();

        // Fetch updated user without password
        const updatedUser = await User.findById(userId).select('-password');
        console.log('updated like this',updatedUser)
        return res.status(200).json({ 
            message: 'Profile updated successfully', 
            user: updatedUser 
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ 
            message: 'Internal Server Error', 
            error: error.message 
        });
    }
};
         
export const getOwnProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("-password -__v");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.log("Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};