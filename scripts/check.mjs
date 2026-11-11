// "افحص جهازي": checks what this computer needs to make a reel and says, in plain Arabic, what is missing.
// Usage: npm run check        (safe: it installs nothing and sends nothing anywhere)
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rows = [];
const add = (ok, name, detail, fix = "") => rows.push({ ok, name, detail, fix });

const major = Number(process.versions.node.split(".")[0]);
add(major >= 18, "Node.js", `v${process.versions.node}`, major >= 18 ? "" : "نزّل Node.js (نسخة LTS) من https://nodejs.org ثم أعد الفحص");

const npm = spawnSync("npm -v", { encoding: "utf8", shell: true });
add(npm.status === 0, "npm", npm.status === 0 ? `v${npm.stdout.trim()}` : "غير موجود", npm.status === 0 ? "" : "يأتي مع Node.js: أعد تثبيت Node.js");

const installed = fs.existsSync(path.join(ROOT, "node_modules", "remotion", "package.json"));
add(installed, "برنامج الحركة والفيديو (Remotion)", installed ? "مثبّت" : "ناقص", installed ? "" : "شغّل: npm install   (مرة واحدة، يحتاج إنترنت، بضع دقائق)");

const env = fs.existsSync(path.join(ROOT, ".env")) ? fs.readFileSync(path.join(ROOT, ".env"), "utf8") : "";
const key = /^ELEVENLABS_API_KEY=\S+/m.test(env) && /^ELEVENLABS_VOICE_ID=\S+/m.test(env);
add(
  true,
  "الصوت (اختياري)",
  key ? "مفتاح ElevenLabs موجود في .env" : "لا يوجد مفتاح صوت",
  key ? "" : "اختياري: سجّل صوتك بنفسك وضعه في مجلد الريل باسم voice.mp3، أو انسخ .env.example إلى .env وضع مفتاح ElevenLabs. بدون صوت يخرج الريل بكلام مكتوب فقط.",
);

let disk = null;
try {
  const s = fs.statfsSync(ROOT);
  disk = (s.bavail * s.bsize) / 1e9;
} catch {
  disk = null;
}
if (disk !== null) add(disk > 2, "مساحة القرص", `${disk.toFixed(1)} GB فاضية`, disk > 2 ? "" : "فضّي 2 GB على الأقل");

console.log("\nفحص الجهاز — GAOBA AI Reel Maker Lite\n");
for (const r of rows) console.log(`${r.ok ? "✓" : "✗"} ${r.name}: ${r.detail}${r.fix ? `\n   ← ${r.fix}` : ""}`);
const missing = rows.filter((r) => !r.ok);
console.log(missing.length ? `\nالناقص: ${missing.map((r) => r.name).join("، ")}` : "\nالأساسيات جاهزة. اكتب موضوع الريل في سطر واحد.");
console.log("ملاحظة: أول مرة تُرسم فيها الصور أو الفيديو يُنزَّل متصفح صغير للرسم (حوالي 130 MB، مرة واحدة، دقيقة أو دقيقتان)، والخط يُحمَّل من الإنترنت.\n");
process.exit(missing.length ? 1 : 0);
