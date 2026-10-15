# v0.3.0 — Focused park journey

## Scope delivered
Only Number Trail and Maze Runner are exposed. Each has 30 sequential puzzles with contiguous unlocking per local profile. Existing SQLite storage is retained, including old game history; archived engines remain for compatibility. The home is a winding park journey with chapter markers, trees, cleared stars, current puzzle, score and calendar-day streak. Quotes and four-tab navigation removed. Settings: player name, language, haptics and reduced motion. A short result spring animation respects reduced motion; there is no floating board animation.

Maze Runner uses a deterministic DFS perfect maze, start rider and destination house, hedge walls and original code-drawn park artwork inspired by the user's reference. It is a route-to-exit game, not a fill-every-cell game. Number Trail keeps ascending checkpoints and full board coverage. Both support drag/tap, retract, undo, reset, assisted hints and automatic completion.

## Fixes addressing phone feedback
The dock participates in normal flex layout inside the bottom SafeAreaView, not an absolute overlay at physical bottom. Gameplay has no ScrollView; its responsive board reserves height for system insets and controls. Gesture ownership begins on touch-down, with board-local coordinates, no asynchronous measureInWindow at drag start, and quarter-cell segment sampling to capture fast swipes. Native responder termination is refused while drawing. Accessible cells expose activation actions separately from the drawing surface. Background time is excluded from the timer. Actual Android gesture/navigation revalidation is still required: browser emulation cannot certify native touch behavior.

## Battle and scoring
2–4 names, same phone, identical deterministic puzzle/variant for all players, clean results ranked ahead of assisted results, then time/moves. Final standings show the leader and remaining placements. A points score subtracts time/moves with a floor; hints halve it. Best per-puzzle score contributes once to journey score. Battle attempts do not unlock solo progress. Completed solo puzzles remain replayable. Streak uses local calendar days.

## Social boundary
Invite/share opens the native share sheet with the project/build page; it does not send automatically. No fabricated friends, online status or public leaderboard. Real friend requests, authenticated cross-device challenge links and public rankings still require the planned Supabase/Node setup and credentials. No new paid services or permissions.

## Validation
TypeScript and Expo lint pass. 11 engine tests cover legacy behavior, 3,000 Number Trail boards, 600 maze variants, contiguous unlocking, profile/game isolation, battle exclusion, scoring and calendar streak. Browser acceptance covers uninterrupted fast drag solutions for both games, unlock/reload persistence, two-player battle and 320px layout, with no runtime errors. Web export passed. Native APK build status is tracked by the on-demand GitHub Actions workflow; a JS export is not an APK.

## Android acceptance
Install the v0.3.0 test build and verify three-button navigation and gesture navigation, uninterrupted fast drags with turns, invalid/wall crossing, background/resume timer, airplane-mode persistence, TalkBack and increased font scale. Do not claim the reported native issues resolved on-device until these pass. Test signing is for alpha sideloading, not Play release.

## Build record
v0.3.0 Android job: https://github.com/sundaramseth/dimag-ka-dangal/actions/runs/38808369339 (source 17b172894e7639523217ad22a5ec8ec597c82e09). Dispatched after source validation. Native compilation result is pending at the time this report was committed; no phone acceptance is claimed. Result animation and current-node fade use native-driver animation; controls and board stay stationary. Compact 13px body/button typography replaces large promotional copy.
