import mongoose, { Scheme } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userScheme = new Scheme(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    avatar: {
      type: String, // Cloudinary URL
      required: true,
    },

    coverImage: {
      type: String, // Cloudinary URL
    },

    watchHistory: [
      {
        type: Scheme.Types.ObjectId,
        ref: "Video",
      },
    ],

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

/* Using methods to encrypt password only when it not getting modified i.e on save only  
 
Schema->pre() method is used here

*/

userScheme.pre("save", async function (next) {
  if (!this.modified("password")) return next();
  this.password = bcrypt.hash(this.password, 10);
});

/* Using schema methods to check / compare password */
userScheme.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userScheme.methods.generateAccessToken = async function () {
  //shortlived access token
  jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};
userScheme.methods.generateRefreshToken = async function () {
  //shortlived access token
  jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model("User", userScheme);
