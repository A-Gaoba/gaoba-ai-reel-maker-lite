import { loadFont } from "@remotion/google-fonts/ReadexPro";
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { type ReelData, type Scene, type Slot, wordsAt } from "./timing";

/**
 * GAOBA AI Reel Maker Lite — the whole reel is drawn from reels/<name>/reel.json.
 * Six scene types (hook, point, steps, number, compare, cta), one accent shape that travels from scene to scene so
 * the reel feels like one move, cards that turn in depth between scenes, a drifting background for parallax, and a
 * word-by-word caption. Everything is a function of the frame: no state, no randomness.
 */
const { fontFamily } = loadFont("normal", { weights: ["400", "700"], subsets: ["arabic", "latin"] });

export type ReelProps = { reel: ReelData; voice: string | null; exact: Slot[] | null; slots: Slot[]; total: number };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const out = (u: number) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
const inOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Shrinks long text so it stays inside its box. */
const fit = (base: number, text: string, comfy: number) => Math.round(base * Math.min(1, Math.sqrt(comfy / Math.max(1, text.length))));

type Box = { x: number; y: number; w: number; h: number; r: number };
/** Where the accent shape sits in each kind of scene. */
const anchor = (s: Scene): Box => {
  switch (s.type) {
    case "hook":
      return { x: 140, y: 1090, w: 800, h: 26, r: 13 };
    case "point":
      return { x: 918, y: 600, w: 22, h: 430, r: 11 };
    case "steps":
      return { x: 918, y: 430, w: 22, h: 110, r: 11 };
    case "number":
      return { x: 230, y: 470, w: 620, h: 620, r: 310 };
    case "compare":
      return { x: 529, y: 520, w: 22, h: 700, r: 11 };
    case "cta":
      return { x: 140, y: 1010, w: 800, h: 190, r: 95 };
  }
};

const Highlight: React.FC<{ text: string; word?: string; color: string }> = ({ text, word, color }) => {
  // whole words only: «مش» must not colour the middle of «المشكلة»
  const ws = text.split(" "),
    hs = (word ?? "").trim().split(" ").filter(Boolean);
  let at = -1;
  if (hs.length) for (let i = 0; i + hs.length <= ws.length && at < 0; i++) if (hs.every((h, k) => ws[i + k] === h)) at = i;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {ws.slice(0, at).join(" ")}{at > 0 ? " " : ""}
      <span style={{ color }}>{hs.join(" ")}</span>
      {at + hs.length < ws.length ? " " : ""}{ws.slice(at + hs.length).join(" ")}
    </>
  );
};

const SceneView: React.FC<{ s: Scene; t: number; slot: Slot; ink: string; mute: string; accent: string; card: string }> = ({ s, t, slot, ink, mute, accent, card }) => {
  const local = t - slot.start,
    dur = slot.end - slot.start;
  const rise = (delay: number, d = 40): React.CSSProperties => {
    const k = out(seg(local, delay, delay + 0.5));
    return { opacity: clamp(k * 1.5), transform: `translateY(${(1 - k) * d}px)` };
  };
  const base: React.CSSProperties = { position: "absolute", direction: "rtl", textAlign: "right", color: ink, fontWeight: 700, lineHeight: 1.25 };
  if (s.type === "hook") {
    const text = s.text ?? s.say;
    return <div style={{ ...base, left: 140, width: 800, top: 520, height: 540, display: "flex", alignItems: "flex-end", fontSize: fit(118, text, 34), ...rise(0.05) }}>
      <div><Highlight text={text} word={s.highlight} color={accent} /></div>
    </div>;
  }
  if (s.type === "point") {
    const text = s.text ?? s.say;
    return (
      <>
        <div style={{ ...base, left: 140, width: 740, top: 600, fontSize: fit(88, text, 44), ...rise(0.05) }}>
          <Highlight text={text} word={s.highlight} color={accent} />
        </div>
        {s.note && <div style={{ ...base, left: 140, width: 740, top: 1080, fontWeight: 400, fontSize: 48, color: mute, ...rise(0.5) }}>{s.note}</div>}
      </>
    );
  }
  if (s.type === "steps") {
    const items = (s.items ?? []).slice(0, 5);
    return (
      <>
        <div style={{ ...base, left: 140, width: 740, top: 430, fontSize: fit(76, s.title ?? "", 22), ...rise(0.05) }}>{s.title}</div>
        {items.map((it, i) => {
          const at = 0.35 + (i * Math.max(0.5, dur - 1.2)) / Math.max(1, items.length);
          return (
            <div key={i} style={{ ...base, left: 140, width: 800, top: 620 + i * 150, display: "flex", alignItems: "center", gap: 28, ...rise(at, 60) }}>
              <div style={{ width: 96, height: 96, borderRadius: 28, background: ink, color: card, fontSize: 54, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: fit(58, it, 24) }}>{it}</div>
            </div>
          );
        })}
      </>
    );
  }
  if (s.type === "number") {
    const v = s.value ?? "";
    const pop = out(seg(local, 0.1, 0.6));
    return (
      <>
        <div style={{ position: "absolute", left: 230, top: 470, width: 620, height: 620, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: fit(230, v, 4), direction: "ltr", transform: `scale(${lerp(0.7, 1, pop)})`, opacity: clamp(pop * 2) }}>{v}</div>
        <div style={{ ...base, left: 140, width: 800, top: 1140, textAlign: "center", fontSize: fit(66, s.label ?? "", 30), ...rise(0.45) }}>{s.label}</div>
      </>
    );
  }
  if (s.type === "compare") {
    const sides = [s.right, s.left];
    return (
      <>
        {sides.map((c, i) =>
          c ? (
            <div key={i} style={{ ...base, left: i === 0 ? 570 : 90, width: 420, top: 540, height: 660, background: card, borderRadius: 40, padding: 40, boxSizing: "border-box", boxShadow: "0 30px 60px rgba(0,0,0,0.10)", ...rise(0.1 + i * Math.min(1.2, dur * 0.35), 70) }}>
              <div style={{ fontSize: fit(76, c.title, 10), color: i === 1 ? accent : ink }}>{c.title}</div>
              <div style={{ fontSize: fit(58, c.text, 34), fontWeight: 400, marginTop: 36, color: ink }}>{c.text}</div>
            </div>
          ) : null,
        )}
      </>
    );
  }
  const text = s.text ?? s.say;
  const pulse = 1 + 0.03 * Math.sin(local * 5);
  return (
    <>
      <div style={{ ...base, left: 140, width: 800, top: 520, height: 430, display: "flex", alignItems: "flex-end", fontSize: fit(84, text, 44), ...rise(0.05) }}>
        <div>{text}</div>
      </div>
      {s.keyword && <div style={{ position: "absolute", left: 140, top: 1010, width: 800, height: 190, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: fit(100, s.keyword, 10), transform: `scale(${pulse})`, ...{ opacity: clamp(out(seg(local, 0.3, 0.8)) * 1.5) } }}>{s.keyword}</div>}
    </>
  );
};

export const Reel: React.FC<ReelProps> = ({ reel, voice, slots }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (!slots.length) return <AbsoluteFill style={{ background: "#F4F1EA" }} />;
  const dark = !!reel.dark;
  const bg = dark ? "#121212" : "#F4F1EA",
    ink = dark ? "#F4F1EA" : "#161616",
    mute = dark ? "rgba(244,241,234,0.55)" : "rgba(22,22,22,0.5)",
    card = dark ? "#1E1E1E" : "#FFFFFF",
    accent = reel.accent ?? "#FF4A1C";
  const T = 0.45; // hand-over between two scenes
  let cur = slots.findIndex((sl) => t < sl.end);
  if (cur < 0) cur = slots.length - 1;

  // The accent shape travels from this scene's place to the next one's while the cards turn.
  const a = anchor(reel.scenes[cur]!),
    b = anchor(reel.scenes[Math.min(cur + 1, slots.length - 1)]!);
  const k = inOut(seg(t, slots[cur]!.end - T * 0.5, slots[cur]!.end + T * 0.5));
  const first = out(seg(t, 0.15, 0.8));
  const box: Box = { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k), r: lerp(a.r, b.r, k) };
  // steps: the bar grows down the list as the items arrive
  const sc = reel.scenes[cur]!;
  const grow = sc.type === "steps" ? lerp(110, 110 + Math.min(5, sc.items?.length ?? 0) * 150, seg(t, slots[cur]!.start + 0.3, slots[cur]!.end - 0.6)) : null;

  const drift = t * 14;
  return (
    <AbsoluteFill style={{ background: bg, fontFamily, overflow: "hidden" }}>
      {/* far layer: slow shapes (parallax) */}
      <AbsoluteFill style={{ transform: `translate(${-drift * 0.6 - cur * 40}px, ${Math.sin(t * 0.4) * 20}px)` }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ position: "absolute", left: 120 + i * 420, top: 260 + ((i * 577) % 1200), width: 520, height: 520, borderRadius: 260, background: i % 3 === 0 ? accent : ink, opacity: i % 3 === 0 ? 0.07 : 0.035 }} />
        ))}
      </AbsoluteFill>
      {/* mid layer: hairlines moving a little faster */}
      <AbsoluteFill style={{ transform: `translateX(${-drift * 1.4 - cur * 90}px)` }}>
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: i * 180, top: 0, width: 2, height: 1920, background: ink, opacity: 0.05 }} />
        ))}
      </AbsoluteFill>

      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w * (cur === 0 && reel.scenes[0]!.type === "hook" ? first : 1), height: grow && k === 0 ? grow : box.h, borderRadius: box.r, background: accent }} />

      {/* the scenes: each card turns in from the side in depth and leaves the other way */}
      <AbsoluteFill style={{ perspective: 1600 }}>
        {reel.scenes.map((s, i) => {
          const sl = slots[i]!;
          if (t < sl.start - T * 0.5 || t > sl.end + T * 0.5) return null;
          const enter = i === 0 ? 1 : out(seg(t, sl.start - T * 0.5, sl.start + T * 0.6));
          const leave = i === slots.length - 1 ? 0 : inOut(seg(t, sl.end - T * 0.5, sl.end + T * 0.5));
          const dir = i % 2 === 0 ? 1 : -1;
          const push = 1 + 0.035 * seg(t, sl.start, sl.end);
          const x = (1 - enter) * dir * -520 + leave * dir * 520;
          const ry = (1 - enter) * dir * 38 - leave * dir * 38;
          const z = -(1 - enter) * 260 - leave * 260;
          return (
            <AbsoluteFill key={i} style={{ opacity: clamp(enter * 1.6) * clamp((1 - leave) * 1.6), transform: `translate3d(${x}px, 0, ${z}px) rotateY(${ry}deg) scale(${push})`, transformOrigin: "50% 45%" }}>
              <SceneView s={s} t={t} slot={sl} ink={ink} mute={mute} accent={accent} card={card} />
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>

      {/* the caption: the scene's line, word by word */}
      <div style={{ position: "absolute", left: 90, width: 900, top: 1380, direction: "rtl", textAlign: "center", fontSize: 46, fontWeight: 700, lineHeight: 1.5 }}>
        {wordsAt(sc.say, slots[cur]!, t).map((x, i) => (
          <span key={i} style={{ color: x.on ? ink : "transparent", marginInline: 7, display: "inline-block", transform: `translateY(${x.on ? 0 : 12}px)` }}>
            {x.w}
          </span>
        ))}
      </div>
      {reel.handle && <div style={{ position: "absolute", left: 60, top: 150, fontSize: 34, fontWeight: 700, color: mute, direction: "ltr" }}>{reel.handle}</div>}
      {voice && <Audio src={staticFile(voice)} />}
    </AbsoluteFill>
  );
};
