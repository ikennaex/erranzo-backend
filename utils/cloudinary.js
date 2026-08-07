const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (
  fileBuffer,
  folder = "erranzer_ids"
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      )
      .end(fileBuffer);
  });
};

module.exports = { uploadToCloudinary };