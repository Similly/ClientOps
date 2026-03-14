import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const uploadDir = process.env.UPLOAD_DIR ?? "uploads";
const maxMb = Number(process.env.MAX_UPLOAD_MB ?? "10");

export async function saveUpload(file: File) {
  if (!file.type) {
    throw new Error("Unknown file type");
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File exceeds ${maxMb}MB limit`);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeName}`;

  const dir = path.join(process.cwd(), uploadDir);
  await fs.mkdir(dir, { recursive: true });
  const storedPath = path.join(dir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storedPath, buffer);

  return {
    storedPath: path.join(uploadDir, fileName),
    mimeType: file.type,
    sizeBytes: file.size,
    originalName: file.name,
  };
}
