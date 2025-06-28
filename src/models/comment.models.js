import mongoose, { Scheme } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const commentScheme = new Scheme(
  {
    content: {
      type: String,
      trim: true,
    },
    video: {
      type: Scheme.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: Scheme.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

commentScheme.plugin(mongooseAggregatePaginate);
export const Comment = mongoose.model("Comment", commentScheme);
