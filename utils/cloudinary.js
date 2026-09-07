const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (
  fileBuffer,
  folder = "erranzer_ids",
  returnDetails = false,
  options = {}
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);

        if (returnDetails) {
          return resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }

        resolve(result.secure_url);
      }
    ).end(fileBuffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Error deleting from Cloudinary:", err);
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};