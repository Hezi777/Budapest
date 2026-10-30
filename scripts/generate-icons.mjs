// Renders the PNG app icons from public/icon.svg.
import { readFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync("public/icon.svg", "utf8");
// iOS paints transparent corners black and Android masks icons itself, so
// those two get the square, full-bleed tile.
const square = Buffer.from(svg.replace('rx="112"', 'rx="0"'));

for (const [input, size, out] of [
  [Buffer.from(svg), 192, "public/icon-192.png"],
  [Buffer.from(svg), 512, "public/icon-512.png"],
  [square, 512, "public/icon-maskable-512.png"],
  [square, 180, "src/app/apple-icon.png"],
]) {
  await sharp(input).resize(size, size).png().toFile(out);
  console.log(out);
}
