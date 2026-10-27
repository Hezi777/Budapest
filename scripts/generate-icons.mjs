// Renders the PNG app icons from public/icon.svg.
import sharp from "sharp";

const svg = "public/icon.svg";
for (const [size, out] of [
  [192, "public/icon-192.png"],
  [512, "public/icon-512.png"],
  [180, "src/app/apple-icon.png"],
]) {
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(out);
}
