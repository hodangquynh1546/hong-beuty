# Deployment

The repository contains a single-origin container build. `compose.yaml` starts PostgreSQL, applies EF migrations using the `migrate` image target, then starts the API with the Angular assets. Copy `.env.example` to a private `.env`, replace all placeholders with unique values, and keep that file outside Git. An HTTPS reverse proxy, backups, monitoring and a production host are still required. This Compose definition has not been exercised here because the workspace has no container runtime.

Review every future migration before applying it to production and take a database backup first. The initial migration only creates the product catalog. No payment, shipping or media provider should be enabled without valid credentials and sandbox verification.
