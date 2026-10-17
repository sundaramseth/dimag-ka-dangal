# Dimag Ka Dangal

An Android-first, ad-free puzzle adventure with **Number Trail** and **Maze Runner**. v0.5.0 adds an opening screen, original companions, distinct game worlds, visible gems, paid hints, multiple sound effects and an authenticated online arena.

[Version 0.5.0 report](docs/PHASE_5_REPORT.md) · [Google activation](docs/OAUTH_SETUP.md) · [Earlier report](docs/PHASE_4_REPORT.md)

The arena database and authenticated path validator are deployed. Friends, presence, same-puzzle matchmaking, match chat and top50/self/friends ranking code are implemented and tested as detailed in the report. **Google provider activation and public email SMTP are still required**; real two-phone Auth/online acceptance is pending. Offline solo/family play needs no login. No fake players or public scores.

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

Email auth and handle-based friend requests are connected to Supabase with protected RPCs. Two-device email/session testing remains pending; public boards, live matches, presence/chat, cloud wallet and Node competition backend are subsequent phases. Do not add fake users/scores to imply these work. No ads, phone OTP, AI services or paid hosting.

## Reports
- [Phased roadmap + full implementation brief](docs/IMPLEMENTATION_PLAN.md)
- [Phase 1 report](docs/PHASE_1_REPORT.md)
- [Number Trail / Phase 2 update](docs/PHASE_2_REPORT.md)
- [Test checklist](docs/TESTING.md)

App code lives in `apps/mobile/src`. Pure engine currently lives in `src/engine`; extract it to `packages/game-engine` when the Node service begins, rather than introducing unused packages now. Planned online stack: Node.js/TypeScript + Supabase Auth/Postgres, Pusher as an optional private-channel transport within verified free quotas.
