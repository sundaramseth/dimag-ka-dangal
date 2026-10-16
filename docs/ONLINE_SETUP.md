# Activating friends without rebuilding the APK

1. Select the intended Supabase development project. Apply `supabase/migrations/202610160001_friends.sql` once through migrations. It only creates `dangal_*` objects; do not run against an unrelated database without review.
2. Keep normal email verification enabled. Configure project email delivery/site redirect appropriate for testers. New users confirm email, then sign in in the app.
3. Obtain the project HTTPS URL and **publishable** `sb_publishable_...` client key. Never put a service/secret key in the app, repository or configuration.
4. Replace `config/cloud.json` with `{"version":1,"ready":true,"url":"https://PROJECT.supabase.co","publishableKey":"sb_publishable_..."}` only after the schema is ready. Alternatively set the two `EXPO_PUBLIC_...` build values from `apps/mobile/.env.example`.
5. Open Friends → Retry connection. Test with two confirmed accounts: unique handles, send, incoming visibility, accept, remove, cancellation and wrong-account access. No online completion is claimed until these tests pass against the actual project.
6. Publish the alpha GitHub release with asset filename `Dimag-Ka-Dangal.apk`; test the exact shared download URL signed out. Installed app link: `dangal://friend/HANDLE`. New installs use the handle/manual second tap; no deferred-link service is configured.

Local database policy tests:

```sh
cd supabase/tests
npm ci
npm test
```

These use isolated PGlite PostgreSQL and an auth.uid emulation. They do not create test accounts in production or prove hosted Auth/email delivery.
