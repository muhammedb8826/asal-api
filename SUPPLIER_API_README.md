## Supplier API Guide (Frontend)

This guide documents the Supplier endpoints and expected request/response shapes. All responses use the global format and pagination meta documented in `API_RESPONSE_README.md`.

Base URL examples:
- Local: `http://localhost:3001`
- Production: your deployed API base

### Entity shape (Supplier)
```json
{
  "id": "uuid",
  "fullName": "ACME Logistics",
  "email": "ops@acme.com",
  "phone": "+251900000000",
  "company": "ACME",
  "address": "Addis Ababa",
  "reference": "RF-001",
  "description": "Preferred courier",
  "createdAt": "2025-11-01T00:00:00.000Z",
  "updatedAt": "2025-11-01T00:00:00.000Z"
}
```

### Global response shapes
- Success (single or list with meta): see `API_RESPONSE_README.md`
- Error: `{ success: false, message, errors: { field: message } }`

### Endpoints

#### Create Supplier
- Method: POST
- URL: `/suppliers`
- Body (JSON or form-urlencoded):
```json
{
  "fullName": "ACME Logistics",
  "email": "ops@acme.com",
  "phone": "+251900000000",
  "company": "ACME",
  "address": "Addis Ababa",
  "reference": "RF-001",
  "description": "Preferred courier"
}
```
- Response 201:
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": { "id": "uuid", "fullName": "ACME Logistics", "phone": "+251900000000" }
}
```

Validation errors (example):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "fullName": "fullName should not be empty" }
}
```

#### List Suppliers (pagination, search, filters)
- Method: GET
- URL: `/suppliers`
- Query params (global):
  - `page` (default 1), `limit` (default 10)
  - `sortBy` (e.g., `createdAt:desc`)
  - `q` or `search` for free-text
  - Additional query params are treated as filters and echoed in `meta.filters`

Examples:
```
GET /suppliers?page=1&limit=10&sortBy=createdAt:desc&q=acme&status=active
```

- Response 200:
```json
{
  "success": true,
  "message": "Items fetched successfully",
  "data": [ { "id": "uuid", "fullName": "ACME Logistics", "phone": "+251..." } ],
  "meta": {
    "totalItems": 57,
    "itemCount": 10,
    "itemsPerPage": 10,
    "totalPages": 6,
    "currentPage": 1,
    "sortBy": "createdAt:desc",
    "filters": { "status": "active" },
    "search": "acme"
  }
}
```

#### Get Supplier by ID
- Method: GET
- URL: `/suppliers/:id`
- Response 200:
```json
{
  "success": true,
  "message": "Items fetched successfully",
  "data": { "id": "uuid", "fullName": "ACME Logistics" }
}
```

#### Update Supplier
- Method: PATCH
- URL: `/suppliers/:id`
- Body (partial allowed):
```json
{
  "fullName": "ACME Logistics PLC",
  "email": "ops@acme.com",
  "phone": "+251900000000",
  "company": "ACME",
  "address": "Addis Ababa",
  "reference": "RF-001",
  "description": "Preferred courier"
}
```
- Response 200:
```json
{
  "success": true,
  "message": "Resource updated successfully",
  "data": { "id": "uuid", "fullName": "ACME Logistics PLC" }
}
```

#### Delete Supplier
- Method: DELETE
- URL: `/suppliers/:id`
- Response 204 (no content body, success wrapper still returned by interceptor as success with empty data may be omitted based on handler):
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Frontend tips
- Always check `success`.
- For lists, build pagination controls from `meta` (do not compute client-side totals).
- Persist filters and `sortBy` via query params; the backend echoes them in `meta`.
- Debounce search input when using `q`/`search`.

### Common errors
- 400/422: validation issues (see `errors` map)
- 404: wrong `id`
- 409: duplicates (e.g., unique `phone` or `fullName`)


