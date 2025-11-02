import Search from "../models/search.model.js";
import User from "../models/user.model.js";

export const search = async (req, res) => {
    const query = req.query.q;
    const currentUserId = req.user?._id;

    if (!query) {
        return res.status(400).json({ message: "Query not found" });
    }

    try {
        // Search users by fullname
        let users = await User.find({
            $or: [
                { fullname: { $regex: query, $options: "i" } },
            ],
        })
            .select("fullname username profilepic_id followers following")
            .limit(20)
            .lean();

        //  Prioritize followers/following
        users.sort((a, b) => {
            const aPriority =
                a.followers?.includes(currentUserId) ||
                a.following?.includes(currentUserId);
            const bPriority =
                b.followers?.includes(currentUserId) ||
                b.following?.includes(currentUserId);

            if (aPriority && !bPriority) return -1;
            if (!aPriority && bPriority) return 1;
            return 0;
        });

        // Keep only safe info
        users = users.map((u) => ({
            _id: u._id,
            fullname: u.fullname,
            profilePic_id: u.profilePic_id,
        }));

        //  Optional: Search posts if needed
        let posts = [];
        if (query) {
            posts = await Search.find({
                $or: [
                    { caption: { $regex: query, $options: "i" } },
                    { tags: { $regex: query, $options: "i" } },
                ],
            }).limit(10);
        }

        res.json({ users, posts });
    } catch (error) {
        console.log("Search error", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
