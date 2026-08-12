import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

export const cloudinaryEnabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
} else {
  console.warn("[cloudinary] Credentials missing — image uploads will be rejected with 503.");
}

/** Uploads an in-memory Multer file buffer to Cloudinary and returns image metadata. */
export function uploadBuffer(file, folder = env.cloudinary.folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );
    stream.end(file.buffer);
  });
}

export async function destroyImage(publicId) {
  if (!cloudinaryEnabled || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.warn(`[cloudinary] destroy failed for ${publicId}: ${e.message}`);
  }
}

export { cloudinary };
