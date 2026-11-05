# Hong Beauty Platform

Greenfield implementation using Angular 20, .NET 10 and PostgreSQL. The current version includes the development foundation, customer authentication, account recovery, role permission grants, and product/category management; it is not a finished commerce or booking system.

## Run locally

Set a local PostgreSQL connection string in `ConnectionStrings__Default`. Apply the migration with EF Core tooling, then run the API project on port 5000 (`--no-launch-profile`). Run `npm install` and `npm start` from `HongBeautyUI/`; the dev proxy forwards `/api` to port 5000. A container build and database migration service are defined in `Dockerfile` and `compose.yaml`; see [deployment notes](docs/DEPLOYMENT.md). This workspace has no container runtime to verify that path.

The public product list reads from PostgreSQL. No product seed is added, so an empty list is expected until an admin creates products. Admin category and product management require the `catalog.write` permission. Product images currently use HTTPS URL references; upload and storage integration remain pending. Customer registration, login, logout and current-user endpoints use an HttpOnly session cookie. Account recovery requires configured email delivery in production. A one-time initial admin can be created using the bootstrap environment variables listed in `.env.example`; public registration always creates a Customer account. Health check: `/api/v1/health`.

## Status

See [implementation status](docs/IMPLEMENTATION_STATUS.md). The owner supplied the technical conventions in chat and said the source document is no longer required. Publishing to the supplied Git repository currently requires a credential with Contents write permission.
