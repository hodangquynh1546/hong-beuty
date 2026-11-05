# Hong Beauty Platform

Greenfield implementation using Angular 20, .NET 10 and PostgreSQL. The current version includes a development foundation and basic customer authentication; it is not a finished commerce or booking system.

## Run locally

Set a local PostgreSQL connection string in `ConnectionStrings__Default`. Apply the migration with EF Core tooling, then run the API project on port 5000 (`--no-launch-profile`). Run `npm install` and `npm start` from `HongBeautyUI/`; the dev proxy forwards `/api` to port 5000. A container build and database migration service are defined in `Dockerfile` and `compose.yaml`; see [deployment notes](docs/DEPLOYMENT.md). This workspace has no container runtime to verify that path.

The public product list reads from PostgreSQL. No product seed is added, so an empty list is expected until an authorized management flow is implemented. Customer registration, login, logout and current-user endpoints use an HttpOnly session cookie. Health check: `/api/v1/health`.

## Status

See [implementation status](docs/IMPLEMENTATION_STATUS.md). The owner supplied the technical conventions in chat and said the source document is no longer required. The project is stored under `/workspace/working/Hong-Beauty` and can be synchronized to the supplied Git repository.
