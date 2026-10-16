# Online friends — deployed development backend

Dedicated project: **Dimag Ka Dangal**, `qwpkqfnxbghwjztnytqh`, ap-south-1, sundaramseth's Org. Provider quote at creation: $0/month. Friends migration and public config are deployed. Auth email signup is enabled with verification required. Anonymous Data API and RPC requests are denied. A hosted transaction test passed and rolled back all synthetic rows.

## Tester acceptance still required
Open Friends, create your own account, confirm its email, then sign in and choose a unique handle. Repeat on another phone/account. Send a handle request, check incoming visibility, accept, remove and cancel; check logout/session restore. Verify the email confirmation landing page too: Auth site/redirect settings and delivery must be checked with real tester emails before wider distribution. Do not disable verification to bypass this test. No real email/account acceptance test is claimed yet.

## Deployment / recovery reference

1. Select the intended Supabase development project. Apply `supabase/migrations/202610160001_friends.sql` once through migrations. It only creates `dangal_*` objects; do not run against an unrelated database without review.
2. Keep normal email verification enabled. Configure project email delivery/site redirect appropriate for testers. New users confirm email, then sign in in the app.
3. Obtain the project HTTPS URL and **publishable** `sb_publishable_...` client key. Never put a service/secret key in the app, repository or configuration.
4. Replace `config/cloud.json` with `{"version":1,"ready":true,"url":"https://PROJECT.supabase.co","publishableKey":"sb_publishable_..."}` only after the schema is ready. Alternatively set the two `EXPO_PUBLIC_...` build values from `apps/mobile/.env.example`.
5. Open Friends → Retry connection. Test with two confirmed accounts: unique handles, send, incoming visibility, accept, remove, cancellation and wrong-account access. The hosted database is verified; the complete two-device Auth/session flow remains pending until these tests pass.
6. Publish the alpha GitHub release with asset filename `Dimag-Ka-Dangal.apk`; test the exact shared download URL signed out. Installed app link: `dangal://friend/HANDLE`. New installs use the handle/manual second tap; no deferred-link service is configured.

Local database policy tests:

```sh
cd supabase/tests
npm ci
npm test
```

These use isolated PGlite PostgreSQL and an auth.uid emulation. They do not create test accounts in production or prove hosted Auth/email delivery.

Hosted policy test: `supabase/tests/hosted_rollback.sql` was run against the dedicated development project. It inserts synthetic UUID-only auth rows inside a transaction, tests role-scoped operations, then rolls back. It does not test actual JWT issuance or email. Never run test SQL against an unrelated project.

## Public email signup prerequisite
No custom SMTP provider was configured in this new project. Supabase's default SMTP only delivers to organization team addresses, so ordinary testers cannot yet complete email signup. Connect a user-owned SMTP service and configure sender/site/redirect settings before opening friends to general testers. Verification remains enabled; no team access was granted and no delivery limit was bypassed. [Official SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp). Backend/API deployment is complete, but public email delivery and full two-device Auth acceptance remain blocked by this external setup.
