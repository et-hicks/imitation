import { NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { requireAuth } from "@/lib/auth";
import { getOrCreateUser, jsonResponse } from "@/lib/api-helpers";

const MAX_RAW_BYTES = 10 * 1024 * 1024; // 10 MB

function getS3Client() {
  return new S3Client({
    endpoint: process.env.AWS_ENDPOINT_URL_S3 ?? "https://fly.storage.tigris.dev",
    region: process.env.AWS_REGION ?? "auto",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = await getOrCreateUser(authResult);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ detail: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return jsonResponse({ detail: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return jsonResponse({ detail: "File must be an image" }, { status: 400 });
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  if (rawBuffer.byteLength > MAX_RAW_BYTES) {
    return jsonResponse({ detail: "Image must be under 10 MB" }, { status: 400 });
  }

  let webpBuffer: Buffer;
  try {
    webpBuffer = await sharp(rawBuffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return jsonResponse({ detail: "Failed to process image" }, { status: 400 });
  }

  const bucket = process.env.BUCKET_NAME;
  if (!bucket) {
    return jsonResponse({ detail: "Storage not configured" }, { status: 500 });
  }

  const key = `cards/${user.id}/${crypto.randomUUID()}.webp`;

  try {
    const s3 = getS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: webpBuffer,
        ContentType: "image/webp",
      })
    );
  } catch (err) {
    console.error("Tigris upload failed:", err);
    return jsonResponse({ detail: "Upload failed" }, { status: 500 });
  }

  const endpoint = process.env.AWS_ENDPOINT_URL_S3 ?? "https://fly.storage.tigris.dev";
  const url = `${endpoint}/${bucket}/${key}`;
  return jsonResponse({ url });
}
