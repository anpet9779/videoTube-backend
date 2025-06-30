import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
/* Configure Cloudinary */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_sceret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(`file uploaded on cloudinary. file scr:${response.url}`);

    // Once file uploaded remove it from local server
    fs.unlink(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
