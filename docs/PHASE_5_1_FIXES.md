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
