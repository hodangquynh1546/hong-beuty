# Project requirements

Hong Beauty will support product sales and beauty service bookings through one public Angular site, a customer area, an administration area, and a .NET API backed by PostgreSQL. Business data must be stored in the database. Money is calculated by the backend; inventory and booking availability require database-level concurrency protection. Payment, shipping, cloud media and notifications require provider adapters with verified webhook handling and idempotency.

The provided technical conventions require Angular 20, Kendo UI 23.3.0, .NET 10, EF Core 10 and PostgreSQL. See `IMPLEMENTATION_STATUS.md` for what has actually been delivered; this document is a requirement statement, not a completion claim.
