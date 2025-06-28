import mongoose, { Scheme } from "mongoose";

const tweetScheme = new Scheme(
  {
    content: {
      type: String,
      trim: true,
    },
    owner: {
      type: Scheme.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Tweet = mongoose.model("Tweet", tweetScheme);
