// Renders reels/<name>/reel.json to out/<name>.mp4 (1080×1920, 30 fps).
// Usage: npm run render -- <name>            → the MP4
//        npm run preview -- <name>           → one PNG per scene in out/<name>-check/ (look at them before the MP4)
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const stills = args.includes("--stills");
const name = args.find((a) => !a.startsWith("--"));
const fail = (m) => {
  console.error(`\n✗ ${m}\n`);
  process.exit(1);
};
if (!name) fail("اكتب اسم مجلد الريل: npm run render -- <name>   (المجلدات داخل reels/)");
const dir = path.join(ROOT, "reels", name);
const file = path.join(dir, "reel.json");
if (!fs.existsSync(file)) fail(`ما لقيت ${path.relative(ROOT, file)}`);

let reel;
try {
  reel = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) {
  fail(`reel.json فيه خطأ في الكتابة: ${e.message}`);
}
const TYPES = ["hook", "point", "steps", "number", "compare", "cta"];
if (!Array.isArray(reel.scenes) || !reel.scenes.length) fail("reel.json لازم يكون فيه scenes (مشهد واحد على الأقل)");
reel.scenes.forEach((s, i) => {
  if (!TYPES.includes(s.type)) fail(`المشهد ${i + 1}: النوع «${s.type}» غير معروف. الأنواع: ${TYPES.join(", ")}`);
  if (typeof s.say !== "string" || !s.say.trim()) fail(`المشهد ${i + 1}: ناقص السطر المنطوق "say"`);
});

// The voice (optional): reels/<name>/voice.mp3 | .m4a | .wav, and exact times from scripts/voice.mjs if present.
const pub = path.join(ROOT, "public", "_reel");
fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(pub, { recursive: true });
let voice = null;
for (const ext of ["mp3", "m4a", "wav"]) {
  const v = path.join(dir, `voice.${ext}`);
  if (fs.existsSync(v)) {
    fs.copyFileSync(v, path.join(pub, `voice.${ext}`));
    voice = `_reel/voice.${ext}`;
    break;
  }
}
let exact = null;
const tf = path.join(dir, "timing.json");
if (voice && fs.existsSync(tf)) {
  const t = JSON.parse(fs.readFileSync(tf, "utf8"));
  if (Array.isArray(t) && t.length === reel.scenes.length) exact = t;
}

console.log(`\n${name}: ${reel.scenes.length} مشاهد · ${voice ? "بصوت" : "بدون صوت (كلام مكتوب فقط)"}`);
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: path.join(ROOT, "public") });
const inputProps = { reel, voice, exact, slots: [], total: 0 };
const composition = await selectComposition({ serveUrl, id: "Reel", inputProps });
const seconds = composition.durationInFrames / composition.fps;
const out = path.join(ROOT, "out");
fs.mkdirSync(out, { recursive: true });

if (stills) {
  const sdir = path.join(out, `${name}-check`);
  fs.rmSync(sdir, { recursive: true, force: true });
  fs.mkdirSync(sdir, { recursive: true });
  const slots = composition.props.slots;
  for (let i = 0; i < slots.length; i++) {
    const t = slots[i].start + (slots[i].end - slots[i].start) * 0.8;
    const output = path.join(sdir, `scene-${String(i + 1).padStart(2, "0")}.png`);
    await renderStill({ serveUrl, composition, inputProps, frame: Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps)), output, scale: 0.4 });
  }
  console.log(`✓ صور الفحص: ${path.relative(ROOT, sdir)}  (${slots.length} صور · طول الريل ${seconds.toFixed(1)} ث)\n`);
} else {
  const output = path.join(out, `${name}.mp4`);
  // keep the last export: a new one never silently replaces the only copy
  if (fs.existsSync(output)) fs.copyFileSync(output, path.join(out, `${name}.previous.mp4`));
  // a recording much shorter or longer than the script usually means it does not match the lines
  if (voice && !exact) {
    const read = reel.scenes.reduce((a, s) => a + Math.max(2.2, s.say.trim().split(/\s+/).length * 0.42 + 0.9), 0);
    const ratio = seconds / read;
    if (ratio < 0.72 || ratio > 1.5) console.log(`⚠ التسجيل طوله ${seconds.toFixed(1)} ث والنص يحتاج تقريبًا ${read.toFixed(0)} ث: يبدو أن التسجيل لا يطابق أسطر النص، فتوقيت المشاهد قد لا يطابق الكلام.`);
  }
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    codec: "h264",
    outputLocation: output,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 10);
      if (p !== last) {
        last = p;
        process.stdout.write(`  ${p * 10}%`);
      }
    },
  });
  const mb = fs.statSync(output).size / 1e6;
  console.log(`\n✓ الفيديو جاهز: ${path.relative(ROOT, output)}  (${seconds.toFixed(1)} ث · ${mb.toFixed(1)} MB · 1080×1920)\n`);
}
