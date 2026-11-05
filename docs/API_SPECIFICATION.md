# API specification

Implemented endpoints:

| Method | Path | Result |
|---|---|---|
| GET | `/api/v1/health` | `200` if PostgreSQL connects, otherwise `503` |
| GET | `/api/v1/products?search=` | Active products from PostgreSQL; empty array when none |
| GET | `/api/v1/products/{id}` | Product or `404` |
| POST | `/api/v1/auth/register` | Customer registration and HttpOnly session cookie |
| POST | `/api/v1/auth/login` | Customer login and HttpOnly session cookie |
| POST | `/api/v1/auth/logout` | End session |
| GET | `/api/v1/auth/me` | Current customer or `401` |

All monetary values are decimal on the server. Product prices returned by the catalog are informational; future checkout will re-read server-side prices. The development API exposes Swagger. Password recovery, email verification, administration and transactional business endpoints are pending.
