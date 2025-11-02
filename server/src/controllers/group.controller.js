import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { emitToGroup } from "../sockets/socket.io.js";

// Create a new group
export const createGroup = async (req, res) => {
  const { name, description, members } = req.body;
  const groupPhoto = req.file;
  let photoUrl = "";

  try {
    if (!name) {
      return res.status(400).json({ message: "Group name is required." });
    }

    if (groupPhoto) {
      const mime = groupPhoto.mimetype;
      const mimeToTypeMap = {
        "image/jpeg": "image",
        "image/png": "image",
        "image/gif": "image",
      };

      const media_type = mimeToTypeMap[mime];
      if (!media_type) {
        return res.status(400).json({ message: "Unsupported media type. Only images (JPEG, PNG, GIF) are allowed." });
      }

      const base64Media = `data:${mime};base64,${groupPhoto.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(base64Media, {
        resource_type: "image",
        folder: "group_photos",
      });
      console.log(result); // For debugging
      photoUrl = result.secure_url;
    }

    const group = await Group.create({
      name,
      description: description || "",
      members: members ? [...JSON.parse(members), req.user._id] : [req.user._id],
      admins: [req.user._id],
      photo: photoUrl,
    });

    res.status(201).json({ message: "Group created successfully", group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



//invite members to group
export const inviteMembers = async (req, res) =>  {
    try {
        const { groupId } = req.params;
        const { userIds } = req.body; // array of user IDs
        const group = await Group.findById(groupId);

        if (!group) return res.status(404).json({ message: "Group not found" });

        // Only admin can invite
        if (String(group.admins) !== String(req.user._id)) {
            return res.status(403).json({ message: "Only admin can invite users" });
        }

        // Add new members if not already present
        userIds.forEach((id) => {
            if (!group.members.includes(id)) {
                group.members.push(id);
            }
        });

        await group.save();

         // Notify all existing members about new members
        group.members.forEach((memberId) => {
            if (String(memberId) !== String(req.user._id)) {
                req.io.to(memberId.toString()).emit("groupNotification", {
                    message: `${req.user.username} added new members to ${group.name}`,
                    groupId,
                });
            }
        });

        res.status(200).json({ message: "Users invited successfully", group });
        res.status(200).json({ message: "Users invited successfully", group });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

};


//remove members from group 
export const removeMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("members", "username email fullname profilePics")
      .populate("admins", "username email fullname profilePics");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const userId = req.user._id; // assuming req.user is set by auth middleware

    // Check if requester is an admin
    const isAdmin = group.admins.some(admin => String(admin._id) === String(userId));
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    // Prevent admin from removing themselves
    const isAdminRemovingSelf = group.admins.some(admin => String(admin._id) === String(memberId));
    if (isAdminRemovingSelf) {
      return res.status(403).json({ message: "Admin cannot remove themselves" });
    }

    // Prevent removing other admins (optional, recommended)
    const memberToRemove = group.members.find(m => String(m._id) === String(memberId));
    if (!memberToRemove) {
      return res.status(404).json({ message: "Member not found in group" });
    }

    const isTargetAnAdmin = group.admins.some(admin => String(admin._id) === String(memberId));
    if (isTargetAnAdmin) {
      return res.status(403).json({ message: "Cannot remove another admin" });
    }

    // Remove member
    group.members = group.members.filter(m => String(m._id) !== String(memberId));
    await group.save();

    // Emit socket event
    req.app.get('io')?.to(groupId).emit('group-updated', {
      groupId,
      action: 'remove',
      memberId,
    });

    res.status(200).json({
      message: "Member removed successfully",
      group,
    });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ error: err.message });
  }
};


//leave group
export const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);

        if (!group) return res.status(404).json({ message: "Group not found" });

        // Admin cannot leave without assigning new admin
        if (String(group.admins) === String(req.user._id)) {
            return res.status(400).json({
                message: "You are the admin. Transfer admin role before leaving."
            });
        }

        group.members = group.members.filter((m) => String(m) !== String(req.user._id));
        await group.save();

        res.status(200).json({ message: "You have left the group", group });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

//give admin role to another member 
export const transferAdmin = async (req, res) => {
    try {
        const { groupId, newAdminId } = req.body;
        const group = await Group.findById(groupId);

        if (!group) return res.status(404).json({ message: "Group not found" });

        // Only current admin can transfer
        if (String(group.admin) !== String(req.user._id)) {
            return res.status(403).json({ message: "Only current admin can transfer admin role" });
        }

        // New admin must be a member
        if (!group.members.includes(newAdminId)) {
            return res.status(400).json({ message: "New admin must be a member of the group" });
        }

        // Transfer admin role
        group.admins = newAdminId;

        await group.save();

        // Notify all members about admin is another member 

        group.members.forEach((id) => {
            req.io.to(id.toString()).emit("groupNotification", {
                message: `${req.user.username} transferred admin role to another member`,
                groupId,
            });
        });
        res.status(200).json({ message: "Admin role transferred successfully", group });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { groupId } = req.params;
    const media = req.file;
    let media_url = "";

    // 1️⃣ Upload media if exists
    if (media) {
      const mime = media.mimetype;
      const mimeToTypeMap = {
        "image/jpeg": "image",
        "image/png": "image",
        "image/gif": "image",
        "video/mp4": "video",   
        "video/quicktime": "video", 
        "application/pdf": "file",
        "application/msword": "file",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "file",
      };
        const media_type = mimeToTypeMap[mime];
        if (!media_type) {
          return res.status(400).json({ message: "Unsupported media type." });
        }
        const resource_type = media_type === "file" ? "raw" : media_type;
        const base64Media = `data:${mime};base64,${media.buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(base64Media, {
          resource_type,
            folder: "messages",
        });
        media_url = result.secure_url;
    }

    // 2️⃣ Validate input
    if (!groupId && !receiverId)
      return res.status(400).json({ error: "Receiver or group is required." });

    // 3️⃣ Create message (either group or DM)
    const message = await Message.create({
      sender: req.user._id,
      group: groupId || null,
      text,
      media_url,
      message_type: req.file ? "image" : "text",
    });

    // 4️⃣ Emit socket events
    emitToGroup(groupId, "receive-message", {
      _id: message._id,
      sender: {_id: req.user._id, fullname: req.user.fullname, profilePics: req.user.profilePics },
      text,
      media_url,
      message_type: req.file ? "image" : "text",
      createdAt: message.createdAt,
    });

    return res.status(201).json({...message._doc, sender: {_id: req.user._id, fullname: req.user.fullname, profilePics: req.user.profilePics }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// Get messages of a group
export const getMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const messages = await Message.find({ group: groupId })
            .populate("sender", "username email fullname profilePics")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update group info (name, description, photo)
export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "group_photos",
            });
            updateData.photo = result.secure_url;
        }

        const updatedGroup = await Group.findByIdAndUpdate(groupId, updateData, { new: true });

        // Notify all members about group update
        updatedGroup.members.forEach((memberId) => {
            req.io.to(memberId.toString()).emit("groupUpdated", updatedGroup);
        });

        res.json(updatedGroup);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getMyGroups = async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user._id }).populate("admins", "username email").populate("members", "fullname profilePics");
        res.status(200).json({ groups });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getGroupById = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId)
            .populate("admins", "username email")
            .populate("members", "username email fullname profilePic");
        res.status(200).json({ group });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
