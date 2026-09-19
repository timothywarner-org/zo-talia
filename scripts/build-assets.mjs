#!/usr/bin/env node
// Zo-Talia asset pipeline. One-shot; no watcher.
//
// Reads:  assets-inbox/<action>/{video.*, still.*, sound.*}
// Writes: assets/<action>/{clip.mp4, still.png, sound.m4a}
//         assets/manifest.json
//
// Contract enforced for every action:
//   - clip.mp4:   H.264 baseline, 400x400 yuv420p, 24fps, CRF 30, no audio, faststart
//   - still.png:  400x400, transparent padding (contain)
//   - sound.m4a:  AAC 64kbps mono 44.1kHz, leading-silence trimmed, loudnorm
//
// Validation (hard fail): dims != 400x400, duration > 3s, clip size > 500KB.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INBOX = path.join(ROOT, 'assets-inbox');
const OUTBOX = path.join(ROOT, 'assets');
const MANIFEST = path.join(OUTBOX, 'manifest.json');

// Action metadata drives the user-facing label and sort order in the manifest.
// Keep in sync with the pre-refactor table in js/app.js.
const ACTIONS = [
  { name: 'click-left',   label: 'Hey!' },
  { name: 'click-middle', label: 'W-was?!' },
  { name: 'click-right',  label: 'Awesome!' },
  { name: 'drink-beer',   label: 'Prost!' },
  { name: 'write-diary',  label: 'Dear diary…' }
];
const DEFAULT_CLIP = 'click-middle';

const VIDEO_EXTS = ['.mov', '.mp4', '.m4v', '.webm', '.gif'];
const STILL_EXTS = ['.png', '.jpg', '.jpeg', '.gif'];
const AUDIO_EXTS = ['.wav', '.mp3', '.m4a', '.aac', '.ogg', '.opus'];

const MAX_CLIP_BYTES = 500 * 1024;
const MAX_DURATION_S = 3.0;

function die(msg) {
  process.stderr.write(`\x1b[31m[build-assets] ${msg}\x1b[0m\n`);
  process.exit(1);
}

function info(msg) {
  process.stdout.write(`[build-assets] ${msg}\n`);
}

function run(cmd, args, { allowFail = false } = {}) {
  const res = spawnSync(cmd, args, { encoding: 'utf8' });
  if (res.error && res.error.code === 'ENOENT') {
    die(`${cmd} not found on PATH. Install FFmpeg (https://ffmpeg.org/download.html) and retry.`);
  }
  if (!allowFail && res.status !== 0) {
    process.stderr.write(res.stdout || '');
    process.stderr.write(res.stderr || '');
    die(`${cmd} ${args.join(' ')}\nexit ${res.status}`);
  }
  return res;
}

async function findInput(dir, exts, baseName) {
  const entries = await fs.readdir(dir).catch(() => []);
  const match = entries.find(f => {
    const base = path.parse(f).name.toLowerCase();
    const ext = path.parse(f).ext.toLowerCase();
    return base === baseName && exts.includes(ext);
  });
  return match ? path.join(dir, match) : null;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function encodeVideo(input, output) {
  // scale+pad keeps aspect ratio and pads to 400x400 with black (H.264 can't
  // carry alpha). fps=24 and -g 12 give a keyframe every 0.5s — fast seeks.
  const vf = 'scale=400:400:force_original_aspect_ratio=decrease,pad=400:400:(ow-iw)/2:(oh-ih)/2:color=black,fps=24';
  run('ffmpeg', [
    '-y',
    '-i', input,
    '-vf', vf,
    '-c:v', 'libx264',
    '-profile:v', 'baseline',
    '-level', '3.1',
    '-pix_fmt', 'yuv420p',
    '-crf', '30',
    '-g', '12',
    '-keyint_min', '12',
    '-movflags', '+faststart',
    '-an',
    output
  ]);
}

function encodeAudio(input, output) {
  // silenceremove: trim initial silence below -50dB (first detected run only).
  // loudnorm: EBU R128 target, so every clip lands at ~the same perceived level.
  const af = 'silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,loudnorm=I=-16:TP=-1.5:LRA=11';
  run('ffmpeg', [
    '-y',
    '-i', input,
    '-af', af,
    '-ar', '44100',
    '-ac', '1',
    '-c:a', 'aac',
    '-b:a', '64k',
    output
  ]);
}

function extractFirstFrame(clipMp4, tmpPng) {
  run('ffmpeg', [
    '-y',
    '-ss', '0',
    '-i', clipMp4,
    '-frames:v', '1',
    tmpPng
  ]);
}

async function makeStill(sourceImg, output) {
  // contain fit with transparent padding so the still matches the clip frame.
  await sharp(sourceImg)
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(output);
}

function probe(file) {
  const res = run('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,duration',
    '-show_entries', 'format=duration,size',
    '-of', 'json',
    file
  ]);
  return JSON.parse(res.stdout);
}

async function buildAction(meta) {
  const srcDir = path.join(INBOX, meta.name);
  const dstDir = path.join(OUTBOX, meta.name);
  await ensureDir(dstDir);

  const videoIn = await findInput(srcDir, VIDEO_EXTS, 'video');
  const audioIn = await findInput(srcDir, AUDIO_EXTS, 'sound');
  const stillIn = await findInput(srcDir, STILL_EXTS, 'still');

  if (!videoIn) die(`${meta.name}: missing video.* in ${srcDir}`);
  if (!audioIn) die(`${meta.name}: missing sound.* in ${srcDir}`);

  const clipOut = path.join(dstDir, 'clip.mp4');
  const soundOut = path.join(dstDir, 'sound.m4a');
  const stillOut = path.join(dstDir, 'still.png');

  info(`${meta.name}: encoding clip`);
  encodeVideo(videoIn, clipOut);

  info(`${meta.name}: encoding sound`);
  encodeAudio(audioIn, soundOut);

  info(`${meta.name}: rendering still`);
  if (stillIn) {
    await makeStill(stillIn, stillOut);
  } else {
    const tmpPng = path.join(dstDir, '_firstframe.png');
    extractFirstFrame(clipOut, tmpPng);
    await makeStill(tmpPng, stillOut);
    await fs.unlink(tmpPng).catch(() => {});
  }

  // Validate the encoded clip.
  const clipStat = await fs.stat(clipOut);
  if (clipStat.size > MAX_CLIP_BYTES) {
    die(`${meta.name}: clip.mp4 is ${clipStat.size} bytes (> ${MAX_CLIP_BYTES}). Shorten the source or lower CRF.`);
  }
  const vProbe = probe(clipOut);
  const stream = (vProbe.streams && vProbe.streams[0]) || {};
  if (stream.width !== 400 || stream.height !== 400) {
    die(`${meta.name}: clip.mp4 is ${stream.width}x${stream.height}, expected 400x400.`);
  }
  const dur = parseFloat((vProbe.format && vProbe.format.duration) || stream.duration || '0');
  if (dur > MAX_DURATION_S) {
    die(`${meta.name}: clip.mp4 duration ${dur.toFixed(2)}s > ${MAX_DURATION_S}s. Trim the source.`);
  }

  return {
    name: meta.name,
    label: meta.label,
    clip: `assets/${meta.name}/clip.mp4`,
    still: `assets/${meta.name}/still.png`,
    sound: `assets/${meta.name}/sound.m4a`,
    durationMs: Math.round(dur * 1000)
  };
}

async function main() {
  // Fail fast if ffmpeg is missing before we start any work.
  run('ffmpeg', ['-version'], { allowFail: true });

  const inboxExists = await fs.stat(INBOX).then(() => true, () => false);
  if (!inboxExists) die(`assets-inbox/ not found at ${INBOX}. Drop source files per README.`);

  await ensureDir(OUTBOX);

  const built = [];
  for (const meta of ACTIONS) {
    built.push(await buildAction(meta));
  }

  const manifest = {
    version: 1,
    defaultAction: DEFAULT_CLIP,
    actions: built
  };
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  info(`wrote ${path.relative(ROOT, MANIFEST)} (${built.length} actions)`);
}

main().catch(err => die(err.stack || String(err)));
