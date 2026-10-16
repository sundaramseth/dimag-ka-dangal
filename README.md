# Dimag Ka Dangal

An Android-first, ad-free puzzle game with **Number Trail** and **Maze Runner**. v0.4.0 adds gem rewards, delayed celebrations, original music, a bottom-to-top three-chapter journey, unlockable cosmetics and denser crystal-collection mazes. Gameplay stays fixed; progress/wallets persist locally.

[Version 0.4.0 report](docs/PHASE_4_REPORT.md) · [Online activation](docs/ONLINE_SETUP.md). Friends/auth/requests client and RLS migration are implemented; live activation remains pending while `config/cloud.json` has `ready:false`. This is not a claim of deployed multiplayer or a verified public ranking.

## Start
Requires Node 22.13+ (SDK 57), npm, and an Android phone/emulator for native verification.

```sh
cd apps/mobile
npm ci
npm start
```

Use an SDK 57-compatible Expo Go installation for development where supported, or create a development build. `npm run web` is an optional browser preview; it uses localStorage rather than native SQLite. No Supabase/Pusher credentials are needed for Phase 1.

## Verify
```sh
npm run typecheck
npm test
npm run lint
npm run export:android
npm run export:web
```

## Standalone Android APK (free local build)
Install Android Studio/SDK and the SDK-compatible JDK, set Android SDK environment paths, connect a device if needed, then:

```sh
cd apps/mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

Windows: `gradlew.bat assembleRelease`. The output is normally `app/build/outputs/apk/release/app-release.apk`. Default generated release builds may use a debug signing key: fine for controlled alpha testing, NOT a production signing policy. Configure and back up your own release key before Play launch; do not commit it. Run the built APK in airplane mode to verify independence from Metro.

Optional EAS preview config is supplied, but requires your Expo account and is subject to free build quotas. No EAS build was claimed or purchased here. An Expo export is a JS/assets bundle, not an APK.

## Implemented / deferred
Android persistence uses expo-sqlite with parameterized writes and ordered saves. Browser preview uses localStorage. Attempts retained to preserve puzzle unlock history. Results/hints/backgrounding are labelled. Feedback remains local until explicit sharing. Profile and exported family names may contain personal data; share intentionally.

No network social data yet: friends/following, requests, public boards, cloud login, realtime invitations/chat and Node backend are subsequent phases. Do not add fake users/scores to imply these work. No ads, phone OTP, AI services or paid hosting.

## Reports
- [Phased roadmap + full implementation brief](docs/IMPLEMENTATION_PLAN.md)
- [Phase 1 report](docs/PHASE_1_REPORT.md)
- [Number Trail / Phase 2 update](docs/PHASE_2_REPORT.md)
- [Test checklist](docs/TESTING.md)

App code lives in `apps/mobile/src`. Pure engine currently lives in `src/engine`; extract it to `packages/game-engine` when the Node service begins, rather than introducing unused packages now. Planned online stack: Node.js/TypeScript + Supabase Auth/Postgres, Pusher as an optional private-channel transport within verified free quotas.
