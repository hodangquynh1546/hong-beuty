# Integration design

Provider adapters will implement Application ports for payment, shipping, storage and notification. Configuration and credentials come from environment variables or a production secret store. No provider is active yet. A provider cannot be marked production-ready until credentials, signature and amount verification, retries, idempotency, webhook ordering and sandbox or live tests are complete.

The local development version has no real payment, shipping, mail or media credentials. COD and internal order logic can be built before paid integrations.
