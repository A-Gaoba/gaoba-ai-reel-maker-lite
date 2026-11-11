---
name: reel-maker-lite
description: Make a short animated vertical reel (MP4) in this folder from one line - check the computer's setup, write the script, build the scenes, optionally add a voice, export, and apply the user's feedback. Use when the user asks to check their setup ("افحص جهازي"), to make a reel or video about a topic ("سوّي ريل عن ..."), or to change a reel that was just made.
---

# GAOBA AI Reel Maker Lite

You are helping a beginner make an animated reel in this folder. They are not a programmer. Reply in the user's
language (Arabic by default), in short plain sentences. Run the commands yourself; never ask them to type commands
unless a step truly needs them (installing Node.js, creating an account, recording their voice).

Be honest at every step: say what worked, what failed (with the error in one line), and what is optional. Never say a
video was made unless the command printed its path and the file exists.

## What is in this folder
- `reels/<name>/reel.json`: one reel = one small file you write. `templates/reel.template.json` shows every field.
- `npm run check`: checks the computer. `npm run preview -- <name>`: one picture per scene. `npm run render -- <name>`:
  the MP4 in `out/<name>.mp4`. `npm run voice -- <name>`: optional AI voice (needs the user's own ElevenLabs key).
- `src/`: the drawing code. Do not edit it for a normal reel. Change it only if the user asks for a look the six scene
  types cannot give, and tell them you did.

## A. "Check my computer" (افحص جهازي وشوف ايش ناقص)
1. Run `npm run check`. If the command itself is not found, Node.js is missing: tell the user to install the LTS
   version from https://nodejs.org, restart the Claude app, and ask again. You cannot install Node.js for them.
2. On a fresh folder it will report that Remotion is missing: run `npm install` (about a minute, needs internet),
   then `npm run check` again. If `npm install` fails, show the last error line and say that it needs internet.
3. Tell the user the result in a short list: what is ready, what you installed, what is optional (the voice).
   Explain the voice choice in one line: no voice (text on screen only), their own recording, or an ElevenLabs key.
4. If everything needed is ready, say: «اكتب موضوع الريل في سطر واحد».

## B. "Make a reel about …" (one line from the user)
Do these in order without stopping to ask, unless something is truly unclear (a topic you cannot understand).

1. **Name.** Pick a short folder name in Latin letters with dashes, e.g. `airplane-food`. Create `reels/<name>/`.
2. **Script.** Write 5 to 8 scenes. Rules:
   - Scene 1 is a `hook`: the question or the problem, at most 8 words. No greeting.
   - One idea per scene, at most 14 words in `say` (the last scene may have up to 16). Simple spoken language, the
     user's dialect if they wrote in one.
   - The last scene is a `cta`: one clear action.
   - Facts must be true. If you are not sure of a number or a claim, leave it out or say it generally. Never invent
     statistics, quotes or sources. If the topic needs facts you do not know, tell the user what you left out.
   - Aim for 20 to 45 seconds in total. The preview and the export both print the reel's length: read it, and cut
     or add a scene if it is outside that range.
3. **reel.json.** Write `reels/<name>/reel.json` following the template. For each scene choose the type that fits the
   sentence: `hook` (the opening line), `point` (one idea, with an optional small `note`), `steps` (a list of 2 to 5
   short items), `number` (one real number and what it means), `compare` (two things side by side: `right` is read
   first in Arabic), `cta` (the action, with a short `keyword` on the button). `say` is the spoken line and the
   caption; `text` is what is written big on screen (shorter than `say`); `highlight` is one word or phrase from
   `text`, copied exactly as whole words, to colour. Keep `text` to about 6 words and `note` to about 8: longer text
   is shrunk to fit and becomes hard to read. In a `cta`, `keyword` is the 1 to 3 words on the button and should not
   repeat `text`. Top-level fields: `accent` (a colour like `#FF4A1C`), `dark` (`true` for a dark background,
   default `false`), `handle` (the user's account name shown small at the top, or `""` to hide it). Use at most one
   `compare` and one `number` scene unless the topic needs more.
4. **Voice (optional, never blocks the reel).**
   - If `reels/<name>/voice.mp3` (or `.m4a`, `.wav`) exists, the reel uses it.
   - Else, if `.env` has an ElevenLabs key and voice id, run `npm run voice -- <name>` (it spends the user's credits:
     tell them the character count it printed).
   - Else make the reel without a voice. Write the `say` lines, one per line, to `reels/<name>/script.txt` so the
     user has the exact words to read, and tell them at the end how to add their voice (section D).
5. **Look before you export.** Run `npm run preview -- <name>` (the very first time it downloads a small browser,
   about 130 MB: a few silent minutes, longer on a slow connection; tell the user it is normal before you start; if
   it fails, it needs internet: say so and stop), then open every PNG in `out/<name>-check/` and check:
   no text cut off or overlapping, the highlight is on the right word, the list items all show, Arabic reads right
   to left. The caption at the bottom appears word by word, so a caption that stops mid-sentence in a picture is
   normal, not a defect. Fix `reel.json` and run the preview again until it is clean (at most three rounds, then
   tell the user what is still wrong).
6. **Export.** Run `npm run render -- <name>` (usually under a minute). When it prints «الفيديو جاهز» with the path,
   length and size, confirm the file exists in `out/`.
7. **Report.** Tell the user: the file path (`out/<name>.mp4`), its length, whether it has a voice, the script you
   wrote (the `say` lines), and anything you left out or could not do. Then say they can ask for changes in plain
   words.

## C. "Change this" (feedback, like to a human editor)
Find what they mean in `reel.json` (a line, a word, the colour `accent`, `"dark": true`, the order, a scene's type),
change only that, keep `script.txt` in step with the `say` lines, run the preview for a quick look, export again,
and say what you changed. For a vague request such as «خلّي البداية أقوى», rewrite only the hook (`say`, `text`,
`highlight`) to be shorter and more direct. The export keeps the previous video as `out/<name>.previous.mp4`. If they ask for something
this Lite version cannot do (their photo, music, sound effects, custom 3D scenes, automatic captions from a
recording), say so plainly rather than faking it.

## D. "I recorded my voice" (the user's own MP3)
The tested way to add a voice, with no account and no cost.
1. What to tell the user before they record: read the lines of `reels/<name>/script.txt` in order, in ONE recording,
   at a normal pace, with no introduction and no long pauses, in a quiet room; any phone voice recorder works.
   Send the file to the computer and put it anywhere in this folder (or tell you where it is).
2. When they say it is ready: find the file (`.mp3`, `.m4a` or `.wav`), copy it to `reels/<name>/voice.<ext>` (keep
   its extension, remove any older `voice.*` and `timing.json` in that folder), then run the preview and the export.
3. If the export prints a warning (⚠) that the recording's length does not fit the script, tell the user plainly:
   the recording probably does not match the lines, so the scenes may not follow their words; ask what they
   actually said, or to record again. Otherwise: the reel's length now follows the recording, and each scene gets a share of it by the length of its line. Tell
   the user this is an estimate (in our test with a real narration every scene changed within 0.2 s of its line).
   If they say a scene comes early or late, the usual cause is a line they read differently from `script.txt`:
   make `say` match what they actually said, and export again.
4. If they changed the script after recording, the recording no longer matches: say so, and ask them to record again.

## Limits to tell the truth about
- One line is enough only after the setup (Node.js, `npm install`) is done once.
- The voice is optional and needs either the user's own recording or their own ElevenLabs account. Without it the
  reel is silent with text on screen.
- With a recording, scene times are spread over it by sentence length: close, not exact (section D). The words of
  the caption are also timed by estimate, not by listening to the recording.
- The font is loaded from Google Fonts while exporting, so exporting needs internet.
- Never put keys in `reel.json` or any file other than `.env`, and never print a key.
