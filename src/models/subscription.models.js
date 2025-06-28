import mongoose, { Scheme } from "mongoose";

const subscriptionScheme = new Scheme(
  {
    subscriber: {
      type: Scheme.Types.ObjectId,
      ref: "User",
    },
    Channel: {
      type: Scheme.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionScheme);
