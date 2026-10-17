# 0.5.1 — Login setup and drag fixes

## Login findings and live changes (17 October 2026)
- Owner signed in to Supabase dashboard through the secure sign-in flow. Google provider is disabled; Client IDs and OAuth Client Secret fields are empty. Account creation is enabled and email confirmation is enabled. Custom SMTP is disabled.
- Added and verified exact allowed Android redirect `dangal://auth/callback`; there were previously no allowed redirects. No wildcard was added.
- Email signup now explicitly requests the same callback. Previously its confirmation link could fall back to the default localhost site URL. Google callback remains PKCE with secure RNG/S256. Failed callback exchanges can be retried.
- Simplified player-facing provider/delivery errors, removing owner setup jargon. This does not substitute for activating the provider.
- Google Cloud console still shows Site Unavailable in this browser after one reload. No OAuth client/secret was created or copied. The owner must create a Web OAuth client with authorized redirect `https://qwpkqfnxbghwjztnytqh.supabase.co/auth/v1/callback`, then enter its Client ID/Secret privately into Supabase Google provider and enable it. See OAUTH_SETUP.md.
- Email verification for public testers requires custom SMTP. Confirmation and nonce checks remain enabled. No fake login, anonymous bypass, user creation or account deletion was performed. Real Google/email login and two-phone acceptance are still pending setup.

## Drag and stroke changes
- A dedicated native leaf input surface receives touches. Coordinates no longer depend on whether the initial touch landed on a nested number/runner view, a plausible source of native offset jumps.
- One SVG path replaces one native View per visited path segment; rounded stroke grows from 8 pixels to 11–18 pixels depending on cell size. Original companions and checkpoint markers remain.
- Axis-specific 4% entry tolerance replaces the previous 10% two-axis dead zone, so a finger moving along a row edge is not blocked just for being near the perpendicular boundary. Sparse-event interpolation remains bounded. Release samples its final coordinate before flushing.
- Coalesced cells now update path state once per frame batch instead of once per sampled cell, with moves preserved and puzzle validation unchanged.
- react-native-svg installed through SDK 57 Expo installer and locked to 15.15.4. Native prebuild/build required; not an OTA-only patch.

## Verification
- TypeScript/lint and 16 engine/reward tests plus native PKCE checks passed during implementation. Prior full gameplay suite passes with the new renderer. Expanded real Chromium touch and mouse drag/resume tests, single-SVG/stroke-width assertions, intercepted email-signup redirect assertion (no real account/email sent), all gameplay checks and social UI fixtures pass. Android Hermes export also passes.
- Physical Android long-session smoothness is not yet measured. Login will not be called fixed until real provider/account flow passes. Final native packaging evidence will be added after the build.

## Final package and owner Google activation
- Owner configured Google provider on 17 October 2026. Public Auth settings now report Google enabled. Initial PKCE authorization request returns HTTP 302 to accounts.google.com with a configured client and the exact Supabase callback. No credential value was read or logged. This verifies provider activation/initial redirect, not completed Google consent, session exchange or phone login.
- Final native run https://github.com/sundaramseth/dimag-ka-dangal/actions/runs/39051212116 succeeded from `bb66b938f2b044e43fdba93203f121eafe5d6b8b`. Source checks, database policy suites, native compile and apksigner verification passed.
- APK `Dimag-Ka-Dangal-0.5.1-test.apk`: 65,867,506 bytes; version 0.5.1/code 6; package com.sundaramseth.dimagkadangal; Android 7+; ARM64 and ARMv7. ZIP integrity, workflow digest and APK checksum match. New input surface and email callback are bundled.
- APK SHA-256: `4c1e0938cfe4df9211715baab5a253b626a05f5529b6a4b7c5d3e8e93ebd88f4`. Certificate SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c` matches previous review versions for an in-place update.
- Email confirmation remains required; custom SMTP is still pending for public tester email signup. Google activation does not configure SMTP. Native phone login, session restore and two-phone play still need acceptance. Long-session touch smoothness remains a physical-device acceptance item.
