import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgBuffer = readFileSync(join(__dirname, "../public/favicon.svg"));

for (const size of [192, 512]) {
  const boltSize = Math.round(size * 0.72);
  const padding = Math.round((size - boltSize) / 2);

  const background = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 109, g: 40, b: 217, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const bolt = await sharp(svgBuffer)
    .resize(boltSize, boltSize)
    .png()
    .toBuffer();

  await sharp(background)
    .composite([{ input: bolt, top: padding, left: padding }])
    .toFile(join(__dirname, `../public/icon-${size}.png`));

  console.log(`Generated public/icon-${size}.png`);
}
