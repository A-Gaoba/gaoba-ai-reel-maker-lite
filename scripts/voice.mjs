// Optional AI voice with ElevenLabs (your own account and key). Reads the "say" lines of reels/<name>/reel.json,
// writes reels/<name>/voice.mp3 and timing.json (when each scene's line starts and ends).
// Usage: npm run voice -- <name>
// Needs a .env file with ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID (see .env.example). This uses your ElevenLabs
// credits. Your key stays on your computer: it is only sent to api.elevenlabs.io.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const name = process.argv[2];
const fail = (m) => {
  console.error(`\n✗ ${m}\n`);
  process.exit(1);
};
if (!name) fail("اكتب اسم مجلد الريل: npm run voice -- <name>");
const dir = path.join(ROOT, "reels", name);
if (!fs.existsSync(path.join(dir, "reel.json"))) fail(`ما لقيت reels/${name}/reel.json`);
const envFile = path.join(ROOT, ".env");
if (!fs.existsSync(envFile)) fail("ما في ملف .env. انسخ .env.example إلى .env وضع مفتاح ElevenLabs ورقم الصوت.");
const env = Object.fromEntries(
  fs
    .readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const KEY = env.ELEVENLABS_API_KEY;
const VOICE = env.ELEVENLABS_VOICE_ID;
if (!KEY || !VOICE) fail("ملف .env ناقص: ELEVENLABS_API_KEY و ELEVENLABS_VOICE_ID");

const reel = JSON.parse(fs.readFileSync(path.join(dir, "reel.json"), "utf8"));
const lines = reel.scenes.map((s) => s.say.trim());
const text = lines.join("\n");
const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOICE)}/with-timestamps?output_format=mp3_44100_128`, {
  method: "POST",
  headers: { "xi-api-key": KEY, "content-type": "application/json" },
  body: JSON.stringify({ text, model_id: env.ELEVENLABS_MODEL || "eleven_multilingual_v2" }),
});
if (!res.ok) fail(`ElevenLabs رفض الطلب (${res.status}): ${(await res.text()).slice(0, 300)}`);
const data = await res.json();
fs.writeFileSync(path.join(dir, "voice.mp3"), Buffer.from(data.audio_base64, "base64"));

// Each scene's start and end, from the character times ElevenLabs returns.
const al = data.alignment;
const timing = [];
let pos = 0;
for (const line of lines) {
  const a = pos;
  const b = Math.min(pos + line.length - 1, al.characters.length - 1);
  timing.push({ start: al.character_start_times_seconds[a] ?? 0, end: al.character_end_times_seconds[b] ?? 0 });
  pos += line.length + 1; // the newline between lines
}
// a scene stays until the next one starts
for (let i = 0; i < timing.length - 1; i++) timing[i].end = timing[i + 1].start;
timing[0].start = 0;
fs.writeFileSync(path.join(dir, "timing.json"), JSON.stringify(timing, null, 2));
console.log(`\n✓ الصوت: reels/${name}/voice.mp3 · ${text.length} حرف · ${timing.at(-1).end.toFixed(1)} ث\n`);
