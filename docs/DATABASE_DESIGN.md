# Database design

PostgreSQL 17 is the development database. Migration `InitialCatalog` creates `products` with a unique slug, nonnegative inventory enforced in domain behavior, prices stored as numeric(18,2), and creation timestamp. Later migrations will add customers, permissions, orders, payments, shipments, staff schedules and bookings. The current migration has been applied against a local PostgreSQL development cluster.

Checkout must reserve stock using a conditional update or row lock inside a transaction. Booking must prevent overlapping staff appointments with a database constraint and transaction. These protections are planned and are not yet implemented.
