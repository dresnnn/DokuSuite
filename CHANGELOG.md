# Changelog

## 0.2.3 - 2025-08-13
### Added
- Admin user management endpoints `/users`, `PATCH /users/{id}`, `DELETE /users/{id}` in OpenAPI

## 0.2.2 - 2025-08-13
### Added
- `/auth/register` and `/auth/invite` endpoints in OpenAPI
- Public photo endpoint `/public/shares/{token}/photos/{id}`
- `Photo` schema fields `location_id`, `order_id`, `calendar_week`, `hash`, `phash`, `is_duplicate`

## 0.2.1 - 2025-08-13
### Fixed
- Align OpenAPI contracts with current server schemas for orders, shares, locations and photos

## 0.2.0 - 2025-08-12
### Added
- POST `/orders` endpoint to create orders
- PATCH `/orders/{id}` endpoint to update orders
