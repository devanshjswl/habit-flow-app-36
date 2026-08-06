/** Client-side media compression so shared photos and clips stay light. */

const MAX_IMAGE_EDGE = 1600;
const IMAGE_QUALITY = 0.72;

export interface CompressResult {
  file: File;
  originalBytes: number;
  bytes: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", IMAGE_QUALITY));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}

/** Re-encodes a clip through a canvas at a lower bitrate. Falls back to the original if unsupported. */
async function compressVideo(file: File, onProgress?: (pct: number) => void): Promise<File> {
  if (typeof MediaRecorder === "undefined") return file;

  const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) =>
    MediaRecorder.isTypeSupported(m),
  );
  if (!mime) return file;

  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read video"));
    });

    // Clips only — anything long stays untouched to avoid a slow re-encode.
    if (!isFinite(video.duration) || video.duration > 120) return file;

    const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(2, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(2, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    const stream = canvas.captureStream(24);
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_200_000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

    const done = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    recorder.start();
    await video.play();

    let raf = 0;
    const draw = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      onProgress?.(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
      raf = requestAnimationFrame(draw);
    };
    draw();

    await new Promise<void>((resolve) => {
      video.onended = () => resolve();
    });

    cancelAnimationFrame(raf);
    recorder.stop();
    await done;

    const blob = new Blob(chunks, { type: mime.split(";")[0] });
    if (!blob.size || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webm", { type: "video/webm" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressMedia(file: File, onProgress?: (pct: number) => void): Promise<CompressResult> {
  const originalBytes = file.size;
  let out = file;
  try {
    if (file.type.startsWith("image")) out = await compressImage(file);
    else if (file.type.startsWith("video")) out = await compressVideo(file, onProgress);
  } catch {
    out = file;
  }
  onProgress?.(100);
  return { file: out, originalBytes, bytes: out.size };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
