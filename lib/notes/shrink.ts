/** Shrink phone photos in the browser before upload: long edge ~2000px, JPEG. */

/** Size that fits within maxEdge on the long side, keeping the aspect ratio. Never upscales. */
export function targetSize(
  w: number,
  h: number,
  maxEdge = 2000
): { width: number; height: number } {
  const long = Math.max(w, h);
  if (long <= maxEdge) return { width: w, height: h };
  const scale = maxEdge / long;
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/** Browser only: decode, resize on a canvas, re-encode as JPEG (q 0.85). */
export async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const { width, height } = targetSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare the photo");
    ctx.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Could not prepare the photo"))),
        "image/jpeg",
        0.85
      )
    );
  } finally {
    bitmap.close();
  }
}
