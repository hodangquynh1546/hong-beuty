# Free demo deployment

The repository includes a Render Blueprint for a single free web service. It uses the
existing Dockerfile to serve the Angular build and .NET API from one origin. A separate
Neon Free PostgreSQL database is required; its PostgreSQL URL belongs in
Render's secret environment variable `DATABASE_URL`, never in Git.

The account owner must create and verify their own Render and Neon accounts and
authorize access to the source repository. The current repository credential was
rejected with HTTP 403; deployment cannot use the latest source until that is
resolved. Do not reuse a token disclosed in a chat.

Set the three bootstrap admin variables only for the initial deployment, with a unique
password of at least 16 characters. Remove them after the one-time admin marker has
been created. The app applies EF migrations on startup when
`HONG_BEAUTY_MIGRATE_ON_START=true`; review migrations before using a database with
real customer data. Health check: `/api/v1/health`.

This is a trial environment, not production. Render Free may sleep after inactivity,
has an ephemeral file system, and restricts outbound SMTP ports. Neon Free has usage
limits. No real payment, shipping, email delivery, or product image upload is enabled
without provider setup and end-to-end verification.
