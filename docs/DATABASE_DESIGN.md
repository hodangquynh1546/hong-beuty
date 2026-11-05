# Database design

PostgreSQL 17 is the development database. Migration `InitialCatalog` creates `products` with a unique slug, prices stored as numeric(18,2), and creation timestamp. `AddUserAccounts` stores customer identity and permissions. `AuthLifecycle` stores hashed, expiring, single-use verification/reset tokens and the account security stamp. These migrations were applied against a local PostgreSQL development cluster. Later migrations will add orders, payments, shipments, staff schedules and bookings.

Checkout must reserve stock using a conditional update or row lock inside a transaction. Booking must prevent overlapping staff appointments with a database constraint and transaction. These protections are planned and are not yet implemented.
