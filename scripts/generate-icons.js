const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, renderPixel) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Deflate compression
  ihdrData[11] = 0; // Filter method 0
  ihdrData[12] = 0; // No interlace
  const ihdrChunk = makeChunk("IHDR", ihdrData);

  // Scanlines: 1 byte filter per line + width * 4 bytes
  const rawBytes = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderPixel(x, y, width, height);
      rawBytes[offset++] = r;
      rawBytes[offset++] = g;
      rawBytes[offset++] = b;
      rawBytes[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawBytes);
  const idatChunk = makeChunk("IDAT", compressedData);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate PITA Brand Icon
function renderPitaIcon(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.44;

  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background circle / rounded container
  // Subtle emerald gradient from top to bottom (#10b981 to #047857)
  const t = y / size;
  const bgR = Math.round(16 * (1 - t) + 4 * t);
  const bgG = Math.round(185 * (1 - t) + 120 * t);
  const bgB = Math.round(129 * (1 - t) + 87 * t);

  // Maskable background fill
  // Letter 'P' geometry
  // Stem: x from cx - 0.22*size to cx - 0.10*size, y from cy - 0.26*size to cy + 0.26*size
  const stemLeft = cx - size * 0.22;
  const stemRight = cx - size * 0.08;
  const stemTop = cy - size * 0.26;
  const stemBottom = cy + size * 0.26;

  const inStem = x >= stemLeft && x <= stemRight && y >= stemTop && y <= stemBottom;

  // Bowl: outer arc centered at (cx - size*0.08, cy - size*0.09)
  const bowlCenterY = cy - size * 0.09;
  const bowlCenterX = cx - size * 0.08;
  const bowlOuterR = size * 0.17;
  const bowlInnerR = size * 0.06;

  const bdx = x - bowlCenterX;
  const bdy = y - bowlCenterY;
  const bdist = Math.sqrt(bdx * bdx + bdy * bdy);

  const inBowl =
    bdx >= 0 &&
    bdist <= bowlOuterR &&
    bdist >= bowlInnerR &&
    y >= stemTop &&
    y <= bowlCenterY + bowlOuterR;

  // Small tennis / padel ball accent in bottom right of P
  const ballCx = cx + size * 0.16;
  const ballCy = cy + size * 0.18;
  const ballRadius = size * 0.07;
  const ballDist = Math.sqrt((x - ballCx) * (x - ballCx) + (y - ballCy) * (y - ballCy));
  const inBall = ballDist <= ballRadius;

  if (inStem || inBowl) {
    return [255, 255, 255, 255]; // Crisp white letter P
  }

  if (inBall) {
    // Vibrant neon lime padel ball
    return [220, 252, 30, 255];
  }

  // Smooth antialiasing / background
  return [bgR, bgG, bgB, 255];
}

const outDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

[192, 512].forEach((size) => {
  const buf = createPng(size, size, (x, y) => renderPitaIcon(x, y, size));
  const filename = `icon-${size}x${size}.png`;
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, buf);
  console.log(`Generated ${filePath} (${buf.length} bytes)`);
});
