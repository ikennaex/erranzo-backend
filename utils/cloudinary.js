const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (
  fileBuffer,
  folder = "erranzer_ids",
  returnDetails = false
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
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

module.exports = {
  uploadToCloudinary,
};