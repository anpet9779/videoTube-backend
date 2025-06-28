import mongoose, { Scheme } from "mongoose";

const playlistScheme = new Scheme(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },

    video: [
      {
        type: Scheme.Types.ObjectId,
        ref: "Video",
      },
    ],

    owner: {
      type: Scheme.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistScheme);
