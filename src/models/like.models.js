import mongoose, { Scheme } from "mongoose";

const likeScheme = new Scheme(
  {
    comment: {
      type: Scheme.Types.ObjectId,
      ref: "Comment",
    },
    video: {
      type: Scheme.Types.ObjectId,
      ref: "Video",
    },
    likedby: {
      type: Scheme.Types.ObjectId,
      ref: "User",
    },
    tweet: {
      type: Scheme.Types.ObjectId,
      ref: "Tweet",
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeScheme);
