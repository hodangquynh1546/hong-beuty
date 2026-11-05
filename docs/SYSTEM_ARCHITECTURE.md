# System architecture

One ASP.NET Core artifact serves the Angular SPA and `/api/v1` from one origin in production. The API depends on Application and Infrastructure for dependency registration. Application depends only on Domain; Infrastructure implements Application ports and persists domain entities with EF Core. Angular uses relative `/api` paths and a development proxy.

Features are grouped under `Features/`. Cross-cutting middleware handles correlation IDs, authentication, authorization, validation, exceptions and structured logs. External providers will be accessed through Application ports and Infrastructure adapters, never directly from controllers.
