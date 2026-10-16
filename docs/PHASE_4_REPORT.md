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

Created the dedicated **Dimag Ka Dangal** project (`qwpkqfnxbghwjztnytqh`, Mumbai/ap-south-1) in sundaramseth's Org after the user selected a separate project and the provider quoted **$0/month**. The provider reports ACTIVE_HEALTHY. Applied `dangal_authenticated_friends` migration. `config/cloud.json` now publishes only the project URL and modern public client key with `ready:true`; no server secret was fetched or stored. The APK loads this configuration at connection time.

Live verification: hosted Auth settings return 200 with email signup enabled and email verification required. Anonymous HTTP reads of all three tables and the friends RPC return 401. Live SQL confirms RLS and no client table writes. A transaction using three synthetic auth IDs verified request, recipient-only accept, third-party isolation, direct-write denial, removal and anonymous denial; every row rolled back. These are hosted database/API checks, not two-device email/session acceptance. No test email was sent and no permanent test account was created. Real email delivery, confirmation redirect behaviour, secure-session restore and two-phone requests still need acceptance with tester-owned accounts. No live battle/public leaderboard or cloud wallet is claimed.

Security advisor review: five authenticated SECURITY DEFINER RPC notices are intentional because these constrained endpoints implement the authorized operations with explicit actor/participant checks, fixed empty search_path, no dynamic SQL, and revoked PUBLIC/anon execution. The internal request ledger has RLS and no policies/role privileges, intentionally denying all client access. Advisory explanations: [signed-in definer RPC](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [RLS without policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Reviewed current Supabase changelog and docs. Local gems remain cosmetic and unverified by a server.

## Tester distribution
Native sharing targets the latest public GitHub APK asset (`Dimag-Ka-Dangal.apk`). A friend invite includes a handle and an installed-app deep link. New installers must install and then tap the deep link or enter the handle; deferred install attribution is not claimed. The public release/asset must be verified before distribution is marked ready.

## Validation
15 engine tests, 3,000 trail boards, 600 new maze variants; maze branch/size/crystal checks; reward idempotency, chapter bonus, theme gating/purchase and progress migration. Typecheck/lint and web export pass. Browser tests cover continuous drags, upward map, celebration delay, reward persistence, theme purchase/reload, battle, small viewport and chapter-three maze completion. PostgreSQL policy tests pass locally. Native build/result and release verification are appended after completion.

## Remaining before wider online/Play launch
Test two confirmed accounts across devices and verify email delivery/confirmation redirect/logout/requests. Server-authoritative competitions, cloud wallet sync, account deletion/moderation, production signing and Play submission are subsequent work. No fake players, public scores or online presence were added.

Initial Android run 38942330065 passed native compilation and apksigner verification. Inspection confirmed version 0.4.0/code 4, both ARM ABIs, matching v0.3.0 signer and no microphone permission. During cloud activation, replaced AbortSignal.timeout with the owned AbortController signal for Android compatibility. That source is being rebuilt in run https://github.com/sundaramseth/dimag-ka-dangal/actions/runs/38944887588 (source 27466de26575b5a9e9a6d70f3a1cb1d4d5dd279d). Only the final corrected APK will be delivered; final hash/release evidence follows.
