import multer from "multer";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGES, MAX_IMAGE_BYTES } from "../utils/constants.js";
import { ApiError } from "../utils/apiError.js";
import { cloudinaryEnabled, uploadBuffer } from "../config/cloudinary.js";

// Memory storage: buffers stream straight to Cloudinary, nothing touches disk or MongoDB.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_IMAGES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest("Only JPEG, PNG and WEBP images are allowed"));
    }
    cb(null, true);
  },
});

export const uploadImages = (field = "images", max = MAX_IMAGES) => upload.array(field, max);
export const uploadSingleImage = (field = "image") => upload.single(field);

/** Uploads every file on the request to Cloudinary and returns image metadata documents. */
export async function persistUploads(files = [], folder) {
  if (!files.length) return [];
  if (!cloudinaryEnabled) {
    throw new ApiError(503, "Image uploads are unavailable: Cloudinary is not configured");
  }
  return Promise.all(files.map((file) => uploadBuffer(file, folder)));
}
