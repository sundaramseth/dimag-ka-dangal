# Dimag Ka Dangal — implementation roadmap

## Current scope revision — v0.3.0
The latest user direction supersedes the original four-game UI: expose only **Number Trail** and **Maze Runner**. Use a park/garden theme, compact labels, stationary gameplay, a scrollable winding journey map, sequential puzzle unlocking, score/streak and restrained completion/unlock animation. Bottom controls must respect Android system navigation. No promotional quotes. Thirty puzzles per game; preserve existing local history. Same-phone battles now use the identical puzzle for all participants. Native share sheet supports review invitations. The v0.3.0 report is a product revision report, **not** a claim that the online Phase 3 below is complete. Next priority is phone acceptance of drag and safe areas; authenticated social features follow after that acceptance.

The original phases below remain historical/planned context; removed games are archived engines rather than active product choices.

## v0.4.0 feedback revision
Prioritize celebrations, once-only gems/chapter bonuses, cosmetic unlocks, seconds-only result timing, original audio and a bottom-to-top map with ten puzzles per chapter. Maze difficulty grows through branching 8/10/12 grids and crystal collection. Maintain fixed screens and optimize long drawing sessions. Authenticated friend requests/invite distribution are implemented as a beta activation path; hosted deployment must be verified before calling the app online. See PHASE_4_REPORT.md and ONLINE_SETUP.md.

## Product brief / master implementation prompt
Build an Android-first, ad-free social puzzle app for Sundaram Seth. Use React Native (React), Expo, TypeScript, offline SQLite, and later a Node.js TypeScript API with Supabase Auth/Postgres. Reserve Pusher for authenticated live-match transport, not storage or authority. Do not provision paid services. Ship phases as working, verified increments and document limitations honestly.

Players should understand a game in seconds. Use original visual designs and level content, bilingual Hindi/English copy, large touch targets, shape-coded colours, optional haptics, reduced motion and clear offline states. Never claim IQ improvement. Never invent users, online status or public leaderboard scores.

## Phase 1 — original offline playable alpha (historical)
- Expo Android app; no account, server, ads or credentials required.
- Three original puzzle implementations: rotating path tiles (Rang Raasta), target-sum grid (Jod Jamao), and sequence memory (Yaadon Ki Baazi).
- Ten deterministic levels per game; bounded difficulty progression; all levels solvable.
- Tutorial/rules, timer, hints (assisted result), restart, result and replay.
- SQLite local profiles, attempts, settings, feedback; personal bests and local family standings.
- Pass-and-play family match on one device: 2–4 named players, fresh equal-difficulty puzzles each turn, results and rematch.
- Hindi/English UI, reduced motion, haptics preference, OS result/feedback sharing.
- Signed/standalone APK is a subsequent build deliverable if Android SDK/JDK are available; otherwise provide reproducible commands, never call a web bundle an APK.
- Verify engines, scoring, persistence semantics, TypeScript, bundle generation and available UI smoke testing.

## Phase 2 — feedback and polish
Device tests with 10–15 volunteers, startup/restart persistence, small screens, backgrounding, low-end performance, accessibility, content improvements. Add 30 more reviewed levels. No spending required. Feedback is exported intentionally, not silently uploaded.

## Phase 3 — online social beta
Supabase Google Auth and Postgres; Node TypeScript service routes/contracts. Profiles/unique handles, follow/unfollow (one-way), friendship state machine (request/cancel/accept/decline/remove), block/report, private family circles, invite code/QR and WhatsApp share sheet. Beat-my-score challenge and Friends/Family/Public boards. Public boards opt-in; offline attempts never become ranked records. RLS and membership checks. Account deletion. API keys/secrets stay out of app. Google login does not supply phone contacts. Contacts discovery/OTP is deferred and opt-in.

## Phase 4 — live duel
Node authoritative round start/submission/result; Supabase durable match state; Pusher private channels only if current free allowance suits workload. Choose one realtime transport per match (Pusher OR Supabase fallback), not duplicate streams. Presence is approximate and privacy-controlled. Ready countdown, reconnect grace, timeout, rematch, signed one-time submissions, server solution validation and basic anti-abuse. Do not expose full puzzle solutions to ranked clients. Latency policy and pause forfeits explicit. Emoji reactions initially; free-text chat deferred.

## Phase 5 — launch preparation
Privacy/data safety, age-audience decision and applicable Families requirements, moderation/report/block workflows, delete account, install-referrer/App Links invite continuity, Android signing and AAB. New personal Play accounts may need 12 continuous opted-in testers for 14 days before production application. Play registration is US$25 one-time if a new account is required. Store review/discovery/revenue is not guaranteed.

## Phase 6 — measured growth
Track consent-appropriate retention, accepted invites, completed matches, crashes and backend usage. Add public matchmaking when player supply exists. Ads remain absent until a separately agreed future change; no ads during timed play. Optional contact discovery requires verified phones, explicit permission/discoverability, abuse protection and separately estimated OTP cost.

## Ranking specification
Compare identical game/version/difficulty. Correct finish required. Clean and assisted boards separate. For speed board: elapsed time ascending, moves tie-breaker. Current local battle uses the same puzzle seed for every turn for directly comparable scores; pass-and-play is casual and observing advantage remains. Daily online boards: one ranked first attempt, server-validated; practice unranked. Weekly league points later derived only from eligible rounds, not unlimited grinding.

## Architecture
apps/mobile — Expo TypeScript UI and SQLite adapters.
apps/mobile/src/engine — pure deterministic generators, validators, scoring, tests; extract to packages/game-engine when Node backend begins.
apps/server — Node API introduced Phase 3 (not a needless Phase 1 server).
docs — product brief, phase reports, testing/build instructions.

## Budget and constraints
Development/local APK testing: zero incremental cash assuming existing hardware/internet. Online beta targets free quotas, not unlimited free uptime/capacity. No custom domain, phone OTP, paid builds, paid graphics, AI API, ads SDK or paid promotion in Phase 1. Reassess quota exhaustion before enabling costs. Supabase free project pause and Pusher caps must be verified before live provisioning. Node deployment choice remains contingent on free hosting limits.

## Delivery acceptance
A fresh checkout installs from lockfile; named profiles/settings/results survive app restart; 30 levels are valid; all three games reach real results; family rounds rotate players; reset/retry/save failures are visible; offline family boards label device scope; README explains running and building; reports distinguish tested code from unverified native/device behavior.

## v0.5.0 feedback iteration
Companion-led landing/journey, per-game worlds, visible gem wallet/paid hints, audible move/level/win feedback; authenticated presence, friend requests, invitation/public pairing, validated server results, private match chat and public top50/self + all-friend rankings. See PHASE_5_REPORT.md for deployment/tests and OAUTH_SETUP.md for the remaining external Google/SMTP activation.
