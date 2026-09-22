#!/usr/bin/env node
/**
 * OG image generator — produces public/og-image.png (1200×630).
 *
 * Uses the `canvas` package if available; falls back to a hand-rolled PNG
 * (dependency-free) otherwise.
 *
 * Run:  node scripts/gen-og.mjs
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "public");
const ogPath = path.join(publicDir, "og-image.png");
const W = 1200;
const H = 630;

// ─── Hand-rolled PNG (fallback when canvas is absent) ───────────────────────

function crc32(buf) {
  let c = 0xffffffff;
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let v = i;
    for (let j = 0; j < 8; j++) v = v & 1 ? (0xedb88320 ^ (v >>> 1)) : (v >>> 1);
    t[i] = v;
  }
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function plainPNG(w, h) {
  // Cream #f7f1e3 with left green bar #d8f651 and faint diagonal grid
  const raw = Buffer.alloc(w * h * 4 + h); // 1 extra byte per row (filter none)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter byte
    for (let x = 0; x < w; x++) {
      const off = y * (w * 4 + 1) + 1 + x * 4;
      if (x < 12) {
        raw.writeUInt8(216, off);
        raw.writeUInt8(246, off + 1);
        raw.writeUInt8(81, off + 2);
        raw.writeUInt8(255, off + 3);
      } else if ((x % 40 === 0) || (y % 40 === 0)) {
        raw.writeUInt8(239, off);
        raw.writeUInt8(233, off + 1);
        raw.writeUInt8(221, off + 2);
        raw.writeUInt8(255, off + 3);
      } else {
        raw.writeUInt8(247, off);
        raw.writeUInt8(241, off + 1);
        raw.writeUInt8(227, off + 2);
        raw.writeUInt8(255, off + 3);
      }
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const idat = zlib.deflateSync(raw);
  let png = sig;
  png = Buffer.concat([png, makeChunk("IHDR", ihdr)]);
  png = Buffer.concat([png, makeChunk("IDAT", idat)]);
  png = Buffer.concat([png, makeChunk("IEND", Buffer.alloc(0))]);
  return png;
}

// ─── Canvas path ─────────────────────────────────────────────────────────────

function canvasPNG(w, h) {
  const { createCanvas } = require("canvas");
  const cvs = createCanvas(w, h);
  const ctx = cvs.getContext("2d");

  // bg
  ctx.fillStyle = "#f7f1e3";
  ctx.fillRect(0, 0, w, h);

  // left accent bar
  ctx.fillStyle = "#d8f651";
  ctx.fillRect(0, 0, 12, h);

  // diagonal grid
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

  // title lines
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

  // skills grid (bottom-right)
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

  // avatar mark (bottom-left circle)
  ctx.fillStyle = "#241f1c";
  ctx.beginPath();
  ctx.arc(80, h - 80, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8f651";
  ctx.font = "bold 28px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GM", 80, h - 80);

  // url (bottom-left)
  ctx.fillStyle = "#8c8275";
  ctx.font = "400 22px JetBrains Mono, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("gilles-momeni.vercel.app", 80, h - 30);

  // copyright (bottom-right)
  ctx.fillStyle = "#a09888";
  ctx.font = "400 16px JetBrains Mono, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("© 2026 Gilles Momeni", w - 80, h - 30);

  return cvs.toBuffer("image/png");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  let data;
  try {
    data = canvasPNG(W, H);
    console.log("✓ Canvas OG image");
  } catch (e) {
    data = plainPNG(W, H);
    console.log("✓ fallback PNG (canvas unavailable)");
  }
  fs.writeFileSync(ogPath, data);
  console.log(`  → ${ogPath} (${(data.length / 1024).toFixed(1)} kB)`);
}

main();