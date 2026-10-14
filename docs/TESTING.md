# Phase 1 test and device checklist

## Automated
From apps/mobile: npm ci; npm run typecheck; npm test; npm run lint.
The engine suite covers 400 path variants, 400 sum variants, deterministic generation, invalid answers, four-rotation identity, memory length/cell constraints, and clean/time/move ordering.
Optional browser smoke: npm run export:web; npx playwright install chromium; node --import tsx scripts/smoke.ts. CHROMIUM_EXECUTABLE can point at an installed Chromium. The browser preview uses localStorage and does not prove Android SQLite compatibility.

## Native Android acceptance (must still be performed on a device)
- Install a standalone APK, turn airplane mode on and start all three games without Metro.
- Create two profiles, finish a clean and assisted solve, force-stop/reopen; records and settings survive.
- Rotate path tiles, undo, restart and check a wrong/correct solution at levels 1 and 10.
- Toggle sum cells and test target matching, hints, undo and restart.
- Observe memory cues, intentionally miss, replay, finish; leave screen during reveal and confirm no leftover timers.
- Family 2–4 players: names unique, pass phone screen identifies next player, last turn shows all results, rematch starts at first player.
- Background mid-round: result marked assisted; timer includes background elapsed duration.
- Verify 320px-class phone, font scaling, TalkBack labels, 44px+ touch targets, Hindi glyphs, reduced motion and haptics on/off.
- Verify result share, feedback export and cancellation; no silent upload, no fake online boards.
- Test a full storage/device write failure and visible error; export before uninstall (local uninstall can remove records).
- Keep release signing material private; do not use a debug key for production.

## Feedback session
Ask 10–15 people to try with minimal instructions. Record time-to-first-solve, repeated plays, rule confusion, difficulty choice, crashes and whether pass-and-play feels fun. Do not infer IQ or demand from praise alone. Only advance online work after correcting game clarity and blocking crashes.

## Number Trail update
Eight engine tests now include 1,000 Number Trail variants. Try starting on a blank/wrong numbered cell, a diagonal, a wall, a skipped checkpoint and finishing early. Drag in each direction, retract by one cell, undo and restart. Confirm all 40 levels are selectable and Number Trail works in local family rounds. A valid alternate full route must be accepted, not only the stored reference solution. Hints realign to a known solution and mark the score assisted.
