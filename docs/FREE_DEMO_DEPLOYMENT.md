# Free demo deployment

The repository includes a Render Blueprint for a single free web service. It uses the
existing Dockerfile to serve the Angular build and .NET API from one origin. A separate
Neon Free PostgreSQL database is required; its PostgreSQL URL belongs in
Render's secret environment variable `DATABASE_URL`, never in Git.

The account owner must create and verify their own Render and Neon accounts and
authorize access to the source repository. Do not reuse a token disclosed in a chat.

Set the three bootstrap admin variables only for the initial deployment, with a unique
password of at least 16 characters. Remove them after the one-time admin marker has
been created. The app applies EF migrations on startup when
`HONG_BEAUTY_MIGRATE_ON_START=true`; review migrations before using a database with
real customer data. Health check: `/api/v1/health`.

If the owner registered as a Customer before admin bootstrap, set
`HONG_BEAUTY_PROMOTE_EXISTING_ADMIN=true` and keep all three bootstrap variables set.
The bootstrap email must exactly match the registered account. On the next deployment,
the account is promoted once, its password is replaced by the bootstrap password, and
existing sessions are invalidated. Sign out and sign in with the bootstrap password.
After confirming Admin access, remove the promotion flag and bootstrap password from
Render. Never send these values over chat.

Render Free cannot send mail through the usual SMTP ports. For email verification and
password reset, create a Brevo free account, verify a sender address, then set
`AccountEmail__BrevoApiKey` and `AccountEmail__From` in Render's Environment page.
`AccountEmail__From` must be the verified sender. The app uses Render's
`RENDER_EXTERNAL_URL` for the link base; `AccountEmail__BaseUrl` can override it if
there is a custom HTTPS domain. Redeploy and test delivery end to end. Without these
settings, verification returns a clear 503 error.

This is a trial environment, not production. Render Free may sleep after inactivity,
has an ephemeral file system, and restricts outbound SMTP ports. Neon Free has usage
limits. No real payment, shipping, or product image upload is enabled without provider
setup and end-to-end verification.
