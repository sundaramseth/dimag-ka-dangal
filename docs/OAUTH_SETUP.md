# Activate Google login for the Android review build

The app's Google button and PKCE callback are implemented. The current project reports Google disabled. No Google secret belongs in the app, GitHub or chat.

1. In the owner's Google Cloud console, select/create the intended project. Configure Google Auth Platform branding/audience for Dimag Ka Dangal. Use the owner's own support/contact account. Do not accept any new terms or change billing without the owner.
2. Use only OpenID/email/basic profile scopes. For a Testing audience, add the intended tester accounts yourself; do not send unsolicited invitations or grant Cloud team access to testers.
3. Create a **Web application OAuth client** (Supabase brokers browser OAuth; this build does not use native Google SDK credentials). Authorized redirect URI: `https://qwpkqfnxbghwjztnytqh.supabase.co/auth/v1/callback`.
4. Enter that client ID and secret privately into Supabase Authentication → Providers → Google and enable it. Do not paste secrets in chat or commit them. This account/security-sensitive setup needs the owner present.
5. Supabase URL Configuration → redirect allow list: `dangal://auth/callback` (saved and verified on 17 October 2026 during the 0.5.1 fixes). The app scheme is already `dangal`. Add web development callbacks only if actually using them, with exact origins.
6. On two Android phones: tap Continue with Google, choose the tester account, return to app, save unique handles, verify session restore after restart, send/accept/remove friend, observe foreground/background presence, invite/accept a game, solve the same puzzle, check verified result, chat and ranking. Then repeat public matchmaking with two simultaneous online players.

Email/password remains available but public confirmation email delivery requires custom SMTP. Do not disable email verification to bypass this. Official docs: https://supabase.com/docs/guides/auth/social-login/auth-google and https://supabase.com/docs/guides/auth/auth-smtp .
