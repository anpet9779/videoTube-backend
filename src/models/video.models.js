import mongoose, { Scheme } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoScheme = new Scheme(
  {
    videoFile: {
      type: String, // Cloudinary URL
      required: true,
    },
    thumbnail: {
      type: String, // Cloudinary URL
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    owner: {
      type: Scheme.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

videoScheme.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoScheme);
