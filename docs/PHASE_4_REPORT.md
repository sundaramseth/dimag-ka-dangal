# v0.4.0 — Rewards, chapter journeys and social beta preparation

## Requested product changes
Keep stationary gameplay, compact text and only Number Trail / Maze Runner. Celebrate every solve before showing Next; award gems, unlock cosmetic themes, use seconds rather than the old 900-style score. Make the maze genuinely branching, show a bottom-to-top journey, add chapter scenery and music, retain progress, and prepare real authenticated friends/invite downloads for testers.

## Implemented gameplay
- 30 puzzles per game, grouped into three chapters of ten. Journey climbs from bottom to top and opens near current progress. Emerald Woods, Mountain Pass and Hidden Falls have distinct colours, mountains, trees and waterfall scenery.
- New randomized Prim maze generator with far-apart endpoints and misleading branches: 8×8, 10×10 and 12×12 boards. Two/three crystals must be collected before reaching home. Rider follows the drawn path. Valid reference routes remain deterministic for identical puzzle/variant.
- First solo clear: 12 gems, or 6 with hints. A complete ten-puzzle chapter grants a further 40 once. Replays/family variants cannot farm gems. Old solo wins migrate into a per-profile wallet without resetting stored progress.
- Twilight / Glacier / Ember cosmetics cost 60/100/150 gems and require 5/10/20 wins; equip persists. Automatic chapter themes remain free. Both game path colours change with the equipped theme.
- Celebration: native-driver confetti and star/card animation, victory chime, gems and chapter bonus, followed by Next after 1.9 seconds (0.4 with reduced motion). Timer/results/sharing use seconds, not raw calculated points. Celebrations also occur on replays, without duplicate gems.
- Original bundled ambient loop plus victory audio; separate music/effect toggles, foreground playback, no microphone or background playback permission requested.

## Drawing performance
Static grid/walls are memoized separately from the changing path. Fast input is sampled and queued to one animation frame; all pending cells flush on release. Page coordinates are anchored at touch-down rather than remeasuring during movement. Ten-percent interior hysteresis reduces accidental boundary undo. Pending frames cancel when unmounted. Smaller screens suppress decorative header scenery to reserve board space. Fixed controls remain inside safe-area layout.

These are concrete mitigations, not a claim that all phones are now smooth. Long-session Android drawing, touch corners, three-button navigation, audio interruptions and background/resume still need phone acceptance.

## Online implementation and current activation boundary
Added Supabase email sign-in/signup (confirmation supported), private handle/profile, request/accept/decline/cancel/remove friends, periodic/manual refresh, native invite sharing and a `dangal://friend/<handle>` route. Session tokens use native SecureStore, not game SQLite. Web preview sessions are not persisted.

A reviewed migration creates namespaced tables, RLS, participant-only reads, no client table writes, constrained security-definer RPCs and a serialized ten-requests/hour cap. An isolated PostgreSQL policy suite checks allow/deny cases, third-party isolation and anonymous rejection. This emulates `auth.uid()` for tests; it does not replace live Supabase Auth testing.

The Supabase plugin installation was confirmed, but its project/SQL tools were not exposed in this session. **No cloud project, schema or real user account has been claimed provisioned.** `config/cloud.json` is intentionally `ready:false`. The app can pick up a future public URL/publishable key from that same repository endpoint without a new APK; secret/service keys are rejected. Friends show a setup/retry state until activation. Offline games/rewards remain usable. Local gems are not a server-verified currency or ranked score.

## Tester distribution
Native sharing targets the latest public GitHub APK asset (`Dimag-Ka-Dangal.apk`). A friend invite includes a handle and an installed-app deep link. New installers must install and then tap the deep link or enter the handle; deferred install attribution is not claimed. The public release/asset must be verified before distribution is marked ready.

## Validation
15 engine tests, 3,000 trail boards, 600 new maze variants; maze branch/size/crystal checks; reward idempotency, chapter bonus, theme gating/purchase and progress migration. Typecheck/lint and web export pass. Browser tests cover continuous drags, upward map, celebration delay, reward persistence, theme purchase/reload, battle, small viewport and chapter-three maze completion. PostgreSQL policy tests pass locally. Native build/result and release verification are appended after completion.

## Remaining before wider online/Play launch
Apply migration to the intended Supabase project, publish only its public configuration, test two confirmed accounts across devices, and verify email delivery/logout/requests. Server-authoritative competitions, cloud wallet sync, account deletion/moderation, production signing and Play submission are subsequent work. No fake players, public scores or online presence were added.

Android build run: https://github.com/sundaramseth/dimag-ka-dangal/actions/runs/38942330065 (source 0187ec96471a5068f6d9f847f6b1b4b3b8afb17b). Dispatched after runtime source comparison and validation. Native completion and downloadable artifact verification are pending at this report revision.
