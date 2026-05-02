# Sound assets — license & attribution

Phase A.5 (Decision D35) — sound assets used by the student opt-in audio
feedback. All assets here MUST be free for commercial use without attribution
required (Pixabay) or with the equivalent permissive terms (Mixkit license).

## Files

| File           | Trigger                          | Source | License |
|----------------|----------------------------------|--------|---------|
| `correct.mp3`  | Correct answer in `/student/topics/[id]/session` | [Mixkit SFX 2017](https://mixkit.co/free-sound-effects/correct/) — "Correct answer tone" | [Mixkit License](https://mixkit.co/license/) — free for commercial use without attribution |
| `badge.mp3`    | Newly-unlocked badge card on `/student/topics/[id]/complete` | [Mixkit SFX 1432](https://mixkit.co/free-sound-effects/win/) — "Game level up" | [Mixkit License](https://mixkit.co/license/) — free for commercial use without attribution |
| `level-up.mp3` | Level-up overlay on `/student/topics/[id]/complete` (Phase B / D24) | [Mixkit SFX 1430](https://mixkit.co/free-sound-effects/) — short positive cue | [Mixkit License](https://mixkit.co/license/) — free for commercial use without attribution |

## Replacement guidance

Both sounds were chosen as a starting point. Per User Advocate review (F8 +
F14): prefer warm/character-y sounds (chirp, bell, soft pop) over corporate UI
"bings" — the dialog promises *Pio's* sound, so the chosen audio should feel
like the bird mascot, not a banking app notification.

If you replace either file:

1. Keep the same filename and path.
2. Keep the file size **under ~50 KB each** (the bundle gate assumes ~100 KB
   total for the two MP3s combined — see Decision C1 in the Phase A.5 design
   doc).
3. Encode as MP3, mono, ≤22 kHz, ≤2 seconds duration.
4. Update the table above with the new source + license.
5. License must permit commercial use. Pixabay sounds are simplest (no
   attribution ever needed since 2019).

## Mixkit license summary (for reference)

- Free to use commercially without attribution
- Cannot be redistributed or sold as standalone audio files
- Full terms: <https://mixkit.co/license/>

The use here (bundling the audio inside a web app where the audio is incidental
to the app's primary purpose, not the app's main offering) is permitted under
the Mixkit license.
