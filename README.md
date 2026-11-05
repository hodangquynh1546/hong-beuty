# Hong Beauty Platform

Greenfield implementation using Angular 20, .NET 10 and PostgreSQL. The current version is a **development foundation**, not a finished commerce or booking system.

## Run locally

Set a local PostgreSQL connection string in `ConnectionStrings__Default`. Apply the migration with `dotnet ef database update` from `HongBeautyAPI/`, then run the API project. Run `npm install` and `npm start` from `HongBeautyUI/`; the dev proxy forwards `/api` to the API. A container build is defined in `Dockerfile` and `compose.yaml`, but this workspace has no container runtime to verify it.

The public product list reads from PostgreSQL. No product seed is added, so an empty list is expected until an authorized management flow is implemented. Health check: `/api/v1/health`.

## Status

See [implementation status](docs/IMPLEMENTATION_STATUS.md). The owner supplied the technical conventions in chat and said the source document is no longer required. The project is stored under `/workspace/working/Hong-Beauty` and can be synchronized to the supplied Git repository.
