#!/usr/bin/env node
/**
 * OG image generator — produces public/og-image.png (1200×630).
 *
 * This is a standalone script. It uses the `canvas` package if available,
 * otherwise falls back to a hand-rolled PNG (dependency-free).
 *
 * Run:  node scripts/gen-og.mjs
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const __dirname = __dirname;
const publicDir = path.resolve(__dirname, "..", "public");
const ogPath = path.join(publicDir, "og-image.png");

// ── Hand-rolled PNG (fallback) ──────────────────────────────────────────────

function crc32(data) {
  let crc = 0xffffffff;
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  for (let i = 0; i < data.length; i++) crc = t[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const tb = Buffer.from(type, "ascii");
  const buf = Buffer.alloc(4 + 4 + data.length + 4);
  buf.writeUInt32BE(data.length, 0);
  tb.copy(buf, 4);
  data.copy(buf, 8);
  buf.writeUInt32BE(crc32(Buffer.concat([tb, data])), 8 + data.length);
  return buf;
}

function rawPNG(w, h) {
  const bytes = [];
  for (let y = 0; y < h; y++) {
    bytes.push(0); // filter: none
    for (let x = 0; x < w; x++) {
      const xInBar = x < 12;
      const isGrid = (x % 40 === 0) || (y % 40 === 0);
      if (xInBar) {
        bytes.push(216, 246, 81, 255);
      } else if (isGrid) {
        bytes.push(240, 234, 220, 255);
      } else {
        bytes.push(247, 241, 227, 255);
      }
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  let p = signature;
  p = Buffer.concat([p, chunk("IHDR", ihdr)]);
  const idat = zlib.deflateSync(Buffer.from(bytes));
  p = Buffer.concat([p, chunk("IDAT", idat)]);
  p = Buffer.concat([p, chunk("IEND", Buffer.alloc(0))]);
  return p;
}

// ── Canvas-based generation (preferred) ─────────────────────────────────────

function generateWithCanvas(w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  // bg
  ctx.fillStyle = "#f7f1e3";
  ctx.fillRect(0, 0, w, h);

  // left bar
  ctx.fillStyle = "#d8f651";
  ctx.fillRect(0, 0, 12, h);

  // diagonal texture
  ctx.strokeStyle = "rgba(36,31,28,0.06)";
  ctx.lineWidth = 1;
  for (let i = -h; i < w + h; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i - h, h);
    ctx.stroke();
  }

  // name
  ctx.fillStyle = "#241f1c";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "bold 72px Bricolage Grotesque, system-ui, sans-serif";
  ctx.fillText("Gilles Momeni", 80, 120);

  // title
  ctx.fillStyle = "#5c5349";
  ctx.font = "500 36px Instrument Sans, system-ui, sans-serif";
  ctx.fillText("Full-Stack & Mobile Developer", 80, 210);
  ctx.fillText("CTO at UHCx · Founder at Zepythagore", 80, 260);

  // underline
  ctx.strokeStyle = "#d8f651";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(80, 310);
  ctx.lineTo(420, 310);
  ctx.stroke();

  // skills
  ctx.fillStyle = "#241f1c";
  ctx.font = "600 28px Bricolage Grotesque, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  const skills = [
    "Web Development",
    "Mobile Apps",
    "IoT & AI",
    "Data Science",
    "UX/UI Design",
    "Startup Building",
  ];
  skills.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    ctx.fillText(s, w - 80 - col * 280, h - 160 + row * 60);
  });

  // avatar
  ctx.fillStyle = "#241f1c";
  ctx.beginPath();
  ctx.arc(80, h - 80, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8f651";
  ctx.font = "bold 28px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GM", 80, h - 80);

  // url
  ctx.fillStyle = "#8c8275";
  ctx.font = "400 22px JetBrains Mono, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("gilles-momeni.vercel.app", 80, h - 30);

  // ©
  ctx.fillStyle = "#a09888";
  ctx.font = "400 16px JetBrains Mono, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("© 2026 Gilles Momeni", w - 80, h - 30);

  return canvas.toBuffer("image/png");
}

// ── Entry ────────────────────────────────────────────────────────────────────

async function main() {
  let data;
  try {
    const { createCanvas } = require("canvas");
    data = generateWithCanvas(OG_WIDTH, OG_HEIGHT);
    console.log("✓ Canvas OG image generated.");
  } catch (e) {
    console.log("canvas not available, writing fallback PNG...");
    data = rawPNG(OG_WIDTH, OG_HEIGHT);
    console.log("✓ Fallback PNG written.");
  }

  fs.writeFileSync(ogPath, data);
  console.log(`  → ${ogPath} (${(data.length / 1024).toFixed(1)} kB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
