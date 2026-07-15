/**
 * Client-side image helpers for character portraits. Everything is stored
 * directly in the character record (as a data URI or plain URL) — there's no
 * backend, so a fresh upload gets downscaled and re-encoded here to keep
 * localStorage usage small (a 160px JPEG thumbnail is typically 5-20KB).
 */

const MAX_DIMENSION = 160;
const JPEG_QUALITY = 0.82;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // 15MB — sanity cap before we even try

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/** Downscale + re-encode an uploaded image file into a small JPEG data URI. */
export function fileToThumbnailDataUrl(file: File): Promise<string> {
  if (!isImageFile(file)) {
    return Promise.reject(new Error("That file isn't an image."));
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return Promise.reject(new Error("That image is too large (max 15MB)."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't decode that image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Couldn't process that image."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
