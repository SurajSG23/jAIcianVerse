import cloudinary from "../config/cloudinary";
import { Readable } from "stream";

export const uploadTextAsFile = async (
  text: string,
  filename: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "summaries",
        public_id: filename.replace(".txt", ""),
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );

    Readable.from(text).pipe(stream);
  });
};
