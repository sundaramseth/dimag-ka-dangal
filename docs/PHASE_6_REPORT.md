# Adventure review build 0.6.0

This release addresses the 14-point tester review. It is an ad-free review build, not a Play Store production release.

| Request | Implementation |
| --- | --- |
| Result for both players | Authoritative server winner is announced by name on both result views. The unfinished player is taken to the final result too. Winner cheers/fireworks; opponent receives congratulations/rematch text and a sad companion. A submitted puzzle is not called an online victory. |
| Google identity | On an authenticated session, an own-user RPC reads Google display name/photo and creates a unique handle automatically. Existing generic Player 1 names are repaired; chosen names/handles remain. Auth UUID remains the account identity. |
| Live profile edits | Separate full-screen Profile: name, unique handle, Google photo, companion, optional gender/country. Save updates shared client state immediately, with guarded refresh and Realtime own-profile events. No change to Google account data. |
| More puzzles | 120 deterministic puzzles per game, 12 chapters of 10. Number Trail grows to 7×7 in later chapters and keeps alternate passages rather than walling every non-solution edge. Existing first 30 boards are preserved. This is a finite playable catalog, not a claim to enumerate every possible puzzle. |
| Touch feedback and celebrations | Throttled selection haptics on accepted moves; double vibration and double visual blink on blocked moves. Solo confetti and delayed reward panel differ from online winner fireworks. Haptics/motion settings are respected. |
| Map and stars | Shared 1–5-star rule, best historical stars visible on nodes immediately. Dragon gate at each chapter finale, danger pass at puzzle 7. Entry/exit gate markers, boat/bridge crossings and chapter transition animation. |
| Navigation and screens | Single hand-drawn bottom navigation row; full-screen settings, profile, arena, friends and ranks with doodle back control. Safe-area layout retained. Map connectors use SVG paths instead of thousands of tiny View segments. |
| Tappable resources/title | Home and game photo/name open Profile; gems open Themes/hint wallet. Offline-bundled Cinzel Decorative title and Baloo 2 gameplay type, with included OFL licenses. |
| Board size/theme/story | Wider responsive board and less header reservation. Distinct Trail/Maze palettes, themed tile patterns, unique named chapter stories and companions. |
| Character expression | Twelve original companions, default chapter companion or chosen character; bob/cheer/smile/sad expressions. No paid art or reused stock maze illustrations. |
| Easy start/matchmaking | Solo Play remains login-free. Google login automatically provisions identity/handle. Arena includes game choice, one opponent-search action, current opponent/wait state and friend invites. |
| Settings vs Profile | Preferences remain in Settings; identity fields live in Profile. Google standard sign-in does not provide gender or location: country code/flag and gender are optional choices, never invented or silently geolocated. |
| Incoming invite anywhere | Global Accept & play / Decline notice, Realtime participant signals plus 3-second foreground polling fallback. Presence and expiry remain server controlled. |
| Maze shapes and danger scenery | Original square chapters retained; chapter 4 introduces real concentric-ring topology and curved walls, then diamond/octagon/cross footprints. Later chapters cycle geometry with new seeds/stories. Danger/finale scenes include animated bats and a dragon gate emblem. |

## Scoring and economy

- No hint, under **10,000 ms**: 5 stars. Exactly 10 seconds belongs to the next tier.
- Under 30 seconds: 4; under 60: 3; under 120: 2; otherwise 1.
- Assisted solves cap at 3 stars. The same function drives result and map, retaining the best earned stars on replay.
- First solo clear earns 12 gems (6 assisted), once per game/puzzle; chapter completion adds 40 once. Hints cost 5. No duplicate gem farming on practice or online/family rounds.
- Gems/progress remain local SQLite on Android, localStorage in web preview. They are not a cloud wallet. Public rankings continue using server-verified online match results, not local stars or editable scores.
- Existing public matchmaking stays within the compatible first 20 puzzles, so old review clients can still face new clients on identical boards. New geometry is currently solo/family. No fake online players.

## Backend

Additive migration `20261017191604_adventure_profiles.sql` deployed to the existing project. Own-user bootstrap/edit RPCs enforce `auth.uid()`; new fields have validation; authenticated direct writes stay denied. Profile metadata never authorizes access. Match reads and Realtime events are participant scoped through RLS. Profiles remain own-row reads. Existing verified result writer, chat limits and rankings remain.

Hosted checks confirmed five profile columns, three Realtime publication memberships, match RLS, anonymous bootstrap denial and authenticated edit privilege. Advisor warnings for intentionally authenticated SECURITY DEFINER RPCs remain reviewed; table-only denial for private result/chat/rating/presence/event tables is intentional. Existing account-level leaked-password-protection notice was not changed. [Supabase advisor reference](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Validation completed before native build

- TypeScript and Expo lint.
- 20 engine tests, including 360 new-catalog Maze/Trail variant combinations, deterministic valid paths, ring seam adjacency, masked footprints and exact star boundaries; existing 600-maze and Number Trail regression suites also pass.
- 240 legacy/new boards compared: first 30 × four seeds × both games are identical.
- PKCE secure-random/S256 adapter regression.
- PGlite friends/arena isolation and ranking tests; profile bootstrap, unique handles, own-row reads, custom-name preservation and invalid avatar/country/anonymous denial tests.
- Web export and standalone Android JS/assets export.
- Browser regression: mouse/touch drag with stroke resume, thicker single SVG path, persistent paid hints/gems, delayed results, local family fairness, actual web audio progression, 320×568 fixed controls.
- Social UI fixtures: accept/send friends, live status, top50+self, 65 friends without the public cap, global invite, loser sees named winner, profile/avatar/country save reflected on landing.
- Circular touch fixture: curved movement, radial corridors, wrap seam, successful solve and immediate map stars.

Browser social/Auth tests use isolated mocked identities; they do not claim a completed real Google sign-in or two-phone online session. User-provided screenshots/reviews confirm prior real usage, but the new APK still needs device acceptance for vibration strength, sustained drag performance, native audio, Google photo/session resume, invite delivery and both-player end screens. No hardware frame-rate measurement is claimed.

## Build and delivery

Version 0.6.0, Android versionCode 7, unchanged package ID. Native APK build/checksum/signature and release URL will be recorded after CI completes. No paid service, asset, ad SDK or contact/location permission was added.
