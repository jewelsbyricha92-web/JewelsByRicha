/**
 * One-off, re-runnable: uploads every image in public/images/{stock,hero} to Cloudinary, then
 *   1. repoints ProductImage / Category / Collection URLs in the database that still use /images/... paths,
 *   2. writes prisma/seed-data/cloudinary-urls.json (local path -> Cloudinary URL) so a fresh seed uses Cloudinary too.
 * Uploads are idempotent (same public_id, overwrite). Run:  node scripts/migrate-images-to-cloudinary.mjs
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw new Error("CLOUDINARY_* is not set in .env");
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });

const ROOT = path.resolve("public/images");
const map = {};

for (const dir of ["stock", "hero"]) {
  const files = fs.readdirSync(path.join(ROOT, dir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  for (const f of files) {
    const local = `/images/${dir}/${f}`;
    const publicId = `jewelsbyricha/${dir}/${path.parse(f).name}`;
    const res = await cloudinary.uploader.upload(path.join(ROOT, dir, f), { public_id: publicId, overwrite: true, resource_type: "image" });
    // q_auto/f_auto = Cloudinary picks the best format and quality per browser
    map[local] = res.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
    console.log("uploaded", local, "->", map[local]);
  }
}

fs.writeFileSync("prisma/seed-data/cloudinary-urls.json", JSON.stringify(map, null, 2) + "\n");

const prisma = new PrismaClient();
let changed = 0;
for (const img of await prisma.productImage.findMany({ where: { url: { startsWith: "/images/" } } })) {
  if (map[img.url]) {
    await prisma.productImage.update({ where: { id: img.id }, data: { url: map[img.url] } });
    changed++;
  }
}
const left = await prisma.productImage.count({ where: { url: { startsWith: "/images/" } } });
console.log(`\n${Object.keys(map).length} files uploaded, ${changed} product image rows updated, ${left} still local.`);
await prisma.$disconnect();
