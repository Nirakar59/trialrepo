import mongoose from "mongoose";

const postSchema = mongoose.Schema(
   {
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref:"User",
         required: true,
      },
      text: {
         type: String,
         default: "",
      },
      image:[ {
         type: String,
         default:"",
      }],
      likes: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
         },
      ],
      comments: [
         {
            userId: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "User",
               required: true,
            },
            text: {
               type: String,
               required: true,
            },
            likes: [
               {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "User",
               },
            ],
            replies: [
               {
                  userId: {
                     type: mongoose.Schema.Types.ObjectId,
                     ref: "User",
                     required: true,
                  },
                  text: {
                     type: String,
                     required: true,
                  },
                  likes: [
                     {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                     },
                  ],
                  createdAt: {
                     type: Date,
                     default: Date.now,
                  },
                  updatedAt: Date,
               },
            ],
            sharedFrom: { 
               type: mongoose.Schema.Types.ObjectId, 
               ref: "Post" 

            },
            createdAt: {
               type: Date,
               default: Date.now,
            },
            updatedAt: Date,
         },
      ],
   },
   {
      timestamps: true,
   }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
