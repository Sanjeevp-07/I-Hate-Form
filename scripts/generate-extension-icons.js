import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// CRC32 table & calculation
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function encodeRGBAtoPNG(width, height, rgbaBuffer) {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk("IHDR", ihdr);

  // Scanlines with filter byte 0
  const rawScanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (width * 4 + 1);
    rawScanlines[scanlineOffset] = 0; // Filter: None
    const rgbaOffset = y * width * 4;
    rgbaBuffer.copy(rawScanlines, scanlineOffset + 1, rgbaOffset, rgbaOffset + width * 4);
  }

  const compressedData = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = createChunk("IDAT", compressedData);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Renders an icon at the specified size with anti-aliasing.
 */
function renderIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const radius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;

  // Coordinate check for squircle / rounded rect
  function getSquircleAlpha(x, y) {
    const dx = Math.max(0, Math.abs(x - cx) - (size / 2 - radius));
    const dy = Math.max(0, Math.abs(y - cy) - (size / 2 - radius));
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= radius - 0.5) return 1.0;
    if (dist >= radius + 0.5) return 0.0;
    return Math.max(0, Math.min(1, radius + 0.5 - dist));
  }

  // Draw pixel by pixel with anti-aliased subpixel sampling
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const cornerAlpha = getSquircleAlpha(x, y);

      if (cornerAlpha <= 0) {
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
        continue;
      }

      // Background gradient: Deep Indigo to Violet-Blue (#1e1b4b -> #4338ca -> #6366f1)
      const t = (x + y) / (size * 2);
      let r = Math.round(15 + t * 45); // 15 -> 60
      let g = Math.round(23 + t * 55); // 23 -> 78
      let b = Math.round(42 + t * 180); // 42 -> 222
      let a = 255;

      // Subtle outer border highlight
      const nx = x / size;
      const ny = y / size;
      const borderDist = Math.min(nx, 1 - nx, ny, 1 - ny);
      if (borderDist < 0.08) {
        r = Math.min(255, r + 30);
        g = Math.min(255, g + 40);
        b = Math.min(255, b + 60);
      }

      // Draw Emblem: Lightning bolt & spark checkmark
      // Normalized coords [-1, 1]
      const px = (x - cx) / (size * 0.42);
      const py = (y - cy) / (size * 0.42);

      // Check if point is inside lightning/spark geometry
      let inEmblem = false;

      // Lightning bolt segments
      // Top segment: (-0.1, -0.85) to (0.45, -0.15) to (-0.05, -0.05)
      // Bottom segment: (0.1, 0.05) to (-0.45, 0.85) to (0.1, 0.15)
      if (
        (py >= -0.85 && py <= -0.05 && px >= -0.4 - py * 0.3 && px <= 0.45 - py * 0.5) ||
        (py >= -0.15 && py <= 0.85 && px >= -0.45 - py * 0.4 && px <= 0.3 - py * 0.3)
      ) {
        // Refine jagged lightning shape
        if (
          (py < 0.05 && px > -0.35 + py * 0.1 && px < 0.45 + py * 0.6) ||
          (py >= 0.0 && px > -0.45 + py * 0.4 && px < 0.3 + py * 0.2)
        ) {
          inEmblem = true;
        }
      }

      // Secondary AI Spark (top right starlet)
      const sx = px - 0.55;
      const sy = py + 0.55;
      const sparkDist = Math.sqrt(sx * sx + sy * sy);
      if (sparkDist < 0.28 && Math.abs(sx * sy) < 0.025) {
        inEmblem = true;
      }

      if (inEmblem) {
        // Emblem gradient: Vibrant Electric Cyan to Amber Gold (#38bdf8 -> #fbbf24)
        const et = (px + 1) / 2;
        r = Math.round(56 + et * 195);  // 56 -> 251
        g = Math.round(189 + et * 2);   // 189 -> 191
        b = Math.round(248 - et * 212); // 248 -> 36
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = Math.round(a * cornerAlpha);
    }
  }

  return encodeRGBAtoPNG(size, size, buf);
}

// Generate icons
const outDir = path.resolve("apps/extension/public/icons");
fs.mkdirSync(outDir, { recursive: true });

const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const png = renderIcon(size);
  const targetPath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(targetPath, png);
  console.log(`Generated ${targetPath} (${png.length} bytes)`);
}

// Also write main icon.png
fs.writeFileSync(path.resolve("apps/extension/public/icon.png"), renderIcon(128));
console.log("All extension icons generated successfully!");
