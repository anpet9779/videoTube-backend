import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { httpOptions } from "../utils/httpOptions.js";

/**
 * Method to generate user access and refresh token
 * @param {userId} userId
 * @returns tokens
 */
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found!");
    }

    const userAccessToken = user.generateAccessToken();
    const userRefreshToken = user.generateRefreshToken();

    user.refreshToken = userRefreshToken;
    await user.save({ validateBeforeSave: false });
    return { userAccessToken, userRefreshToken };
  } catch (error) {
    throw new ApiError(500, "failed generating tokens");
  }
};

/**
 * Method to register user
 * @param {fullname, email, username, password} req.body
 * @returns {userAccessToken, userRefreshToken}
 * @returns user
 */
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  /*   validation --> TODO implement from Zod */

  //checking all fields if empty
  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    // ApiError created in Utils as custom error handler
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists!");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  console.log("avatarLocalPath", avatarLocalPath);
  console.log("coverImageLocalPath", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is missing");
  }

  // Old version of code (for ref only)
  /*   const avatar = await uploadOnCloudinary(avatarLocalPath);

  let coverImage = "";
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }
 */

  //new version
  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("*****uploaded avatar******", avatar);
  } catch (error) {
    console.log("Error uploading avatar", error);
    throw new ApiError(500, "failed to upload avatar");
  }

  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log("*******uploaded coverImage*********", coverImage);
  } catch (error) {
    console.log("Error uploading coverImage", error);
    throw new ApiError(500, "failed to upload coverImage");
  }

  try {
    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    ); //.select is used to remove given fields while extracting the user details

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while creating user");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    console.log("User creation failed", error);
    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    throw new ApiError(
      500,
      "Something went wrong while creating user and images were deleted"
    );
  }
});

/**
 * Method to login user
 * @param {email, password} req.body
 * @returns {userAccessToken, userRefreshToken}
 * @returns user
 */
const loginUser = asyncHandler(async (req, res) => {
  //get data from body
  const { email, username, password } = req.body;

  //validation
  if (!email) {
    console.log(email);
    throw new ApiError(400, "Email is required");
  }

  //Check if user exist
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  //validate password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }

  //Generate Tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(500, "Couldn't find logged in user");
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, httpOptions)
    .cookie("refreshToken", refreshToken, httpOptions)
    .json(
      new ApiResponse(
        200,
        {
          loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

/**
 * Method to logout user
 * @returns {userAccessToken, userRefreshToken}
 * @returns user
 */
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", httpOptions)
    .clearCookie("refreshToken", httpOptions)
    .json(new ApiResponse(200, {}, "user logged out successfully "));
});

/**
 * Method to refresh access token
 * @returns {userAccessToken, userRefreshToken}
 * @returns user
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }
  try {
    //decoding to get _id form token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );

    // Validation
    const user = await User.findById(decodedToken?._id); // taking _id from decoded token
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    //Generating new token

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, httpOptions)
      .cookie("refreshToken", newRefreshToken, httpOptions)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while refreshing access token"
    );
  }
});

/**
 * Method to change password
 * @param {oldPassword, newPassword} req.body
 * @returns {userAccessToken, userRefreshToken}
 * @returns user
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect old password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

/**
 * Method to get current user
 * @returns {user}
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        req.user,
        "Current user details fetched successfully"
      )
    );
});

/**
 * Method to update account details
 * @param {fullname, email} req.body
 * @returns {user}
 * @returns user
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "Fullname and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

/**
 * Method to update user avatar
 * @param {avatar} req.file
 * @returns {user}
 * @returns user
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(500, "Something went wrong while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

/**
 * Method to update user cover image
 * @param {coverImage} req.file
 * @returns {user}
 * @returns user
 */
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(500, "Something went wrong while uploading cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
