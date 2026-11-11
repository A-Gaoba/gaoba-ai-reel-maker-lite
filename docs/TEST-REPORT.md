# Test report — GAOBA AI Reel Maker Lite v0.1

Tested on 2026-11-11, Windows 11, Node.js 22.13.1, npm 11.4.2, Remotion 4.0.542, in clean folders named
`AI Video Editor` (with the space, as in the reel) that contained only this repository's files.

## What was tested and passed

| # | Test | Result |
|---|---|---|
| 1 | `npm run check` before installing | Reports Node.js and npm present, Remotion missing, voice optional. Installs nothing. |
| 2 | `npm install` | 225 packages, 16–48 s on this machine. |
| 3 | `npm run check` after installing | «الأساسيات جاهزة». |
| 4 | `npm run preview -- example-airplane-food` (first run) | Downloaded Chrome Headless Shell (131 MB, once), then 6 PNGs. About 2 minutes the first time; 6.5 minutes once while the machine was busy with another render. |
| 5 | `npm run render -- example-airplane-food` | **Real MP4**: H.264, 1080×1920, 30 fps, 28.5 s, 5.0 MB, no audio. 48 s to export. This file is `docs/example.mp4`. |
| 6 | **A real narration as the user's own recording** | A 17.1 s spoken Arabic recording of six lines, with the true start time of each line known. MP4 with an AAC audio track (−19 LUFS). Each scene's estimated start was within **0.20 s** of the true start of its line (errors: −0.15, −0.17, −0.15, −0.20, +0.05, +0.04 s). |
| 7 | Fresh-user test 1: a separate Claude agent given only the clean folder and two messages («افحص جهازي وشوف ايش ناقص», «سوّي ريل عن ليش القهوة تصحّينا») | Checked, installed, wrote its own 6-scene reel, previewed, looked at the pictures, exported: **MP4, 1080×1920, 26.9 s, silent**. About 4 minutes in all. |
| 8 | Fresh-user test 2, after the instructions were fixed: a new agent, a new clean folder, four messages (check · «سوّي ريل عن ليش لازم نشرب ماي أول ما نصحى» · «خلّي البداية أقوى، وغيّر اللون للأزرق» · «سجّلت صوتي… حطّه على الريل وصدّره») | All four handled, every export succeeded: 29.8 s silent → 29.3 s with a rewritten hook and a blue accent → 17.6 s **with the recording's audio**. It fixed one wrapped title after looking at the preview pictures. No edits to `src/` or `scripts/`. |
| 9 | Export safeguards (added after test 8) | The previous export is kept as `out/<name>.previous.mp4`; a recording whose length does not fit the script prints a warning (seen with the 17.6 s recording on a 29 s script). |
| 10 | Arabic rendering | Right-to-left, letters joined, Readex Pro loaded from Google Fonts, the highlight on whole words only. |

Both fresh-user agents were asked to criticise the instructions. Their findings that could mislead a beginner were
fixed: where the one-time browser download happens and how long it can take, captions that stop mid-sentence in a
still being normal, word limits for `text` / `note` / `keyword`, what `dark` and `handle` do, what to say without
internet, keeping `script.txt` in step with changes, keeping the previous export, and warning about a recording that
does not match the script. **The fixes made after test 8 were checked by hand (test 9), not by a third fresh agent.**

A bug found and fixed during testing: the highlight coloured the middle of a longer word («مش» inside «المشكلة»).

## What was NOT tested

- **macOS and Linux.** Windows 11 only.
- **The ElevenLabs voice script (`npm run voice`).** Written against the documented "with-timestamps" endpoint but
  never run: it needs a paid account and key. Treat it as experimental.
- **A real beginner in the Claude desktop app.** The fresh-user tests used agents with the same instructions, not a
  person clicking through the app. Installing the app, choosing Local and selecting the folder (steps 1–3 of the
  guide) were not exercised by them.
- **A phone recording made by a beginner.** Test 6 used a clean studio-quality narration read exactly as written.
  A recording with long pauses, an introduction or changed words will be less accurate; the warning in test 9 only
  catches a large mismatch in length.
- **Rendering without internet**, and a machine without Node.js (the check's message for that case is written, not
  observed).

## What needs setup or an outside service

| Need | Why | Cost |
|---|---|---|
| Claude desktop app with Claude Code | runs the instructions | a paid Claude plan (Pro or higher at the time of writing; see claude.com/pricing) |
| Node.js LTS | runs the tools | free |
| `npm install` + one browser download (about 130 MB) | Remotion and its renderer | free; Remotion has its own licence (free for individuals and small teams) |
| Internet while exporting | the font comes from Google Fonts | free |
| Voice (optional) | your own recording (tested), or your own ElevenLabs account (untested) | free, or ElevenLabs credits |

## Does it do what the reel's six steps say?

| The reel says | Lite |
|---|---|
| 1 the desktop app, not the browser | Yes (the user's own step). |
| 2 a folder named AI Video Editor that holds the instructions and every finished reel | Yes: this repository is that folder; reels are saved in `out/`. |
| 3 new chat → Local → the folder | Yes (the user's own step). |
| 4 "check my computer": installs what is missing, says where to click | Yes for the packages. Node.js itself must be installed by the user. |
| 5 one line → writes the script | Yes. |
| 5 … records the voice | Partly: the user's own recording (tested) or their ElevenLabs account (untested). No voice is generated for free. |
| 5 … animates every scene | Yes, with six ready scene types. |
| 5 … times the on-screen words to every word | By estimate, not by listening to the audio. |
| 5 … checks the motion before you see it | Partly: it looks at one still per scene, not at the motion. |
| 6 say what is wrong and it fixes it | Yes (test 8). |

## Honest summary

After a one-time setup, one line does produce a real animated MP4. It is a text-motion reel: six scene types, card
turns between scenes, a travelling accent shape, a drifting background and word-by-word captions. It has no music,
no sound effects, no photos or footage, no 3D scenes, and it does not check facts. It is not the system used for
GAOBA AI's own reels.
