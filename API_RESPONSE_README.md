## API Response and Pagination Guide (Frontend)

### Overview
All endpoints return a consistent JSON shape. Success payloads include an optional `meta` object for lists. Errors are normalized globally.

### Success Shape
```json
{
  "success": true,
  "message": "Items fetched successfully",
  "data": {},
  "meta": {
    "totalItems": 0,
    "itemCount": 0,
    "itemsPerPage": 10,
    "totalPages": 0,
    "currentPage": 1,
    "sortBy": "createdAt:desc",
    "filters": { "status": "active" },
    "search": "shirt"
  }
}
```

- For single-resource endpoints, `meta` is omitted.
- For list endpoints, `meta` is always present and computed by the backend.

### Error Shape
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field": "Field is required"
  }
}
```

- Non-validation errors also follow the same structure, using `errors.general` when no field map is available.

### Pagination and Query Conventions

Supported query params (global, for all list endpoints):
- `page` (number, default 1)
- `limit` (number, default 10)
- `sortBy` (string, e.g. `createdAt:desc`)
- `q` or `search` (string)
- Any additional query param is treated as a filter and echoed back under `meta.filters`.

Examples:
```
GET /products?page=2&limit=20&sortBy=createdAt:desc&q=sugar&status=active
GET /suppliers?page=1&limit=10&search=dhl&country=ET
```

The response `meta` for lists:
- `totalItems`: total rows available on server
- `itemCount`: number of items in this page (`data.length`)
- `itemsPerPage`: `limit`
- `totalPages`: `ceil(totalItems / itemsPerPage)`
- `currentPage`: `page`
- `sortBy`: passthrough of request value
- `filters`: all non-reserved query parameters
- `search`: passthrough of `q` or `search`

### Standard Endpoints (Examples)

#### Suppliers
- Create: `POST /suppliers`
- List: `GET /suppliers?page=1&limit=20&q=term&status=active`
- Get one: `GET /suppliers/:id`
- Update: `PATCH /suppliers/:id`
- Delete: `DELETE /suppliers/:id`

Request (create):
```json
{
  "fullName": "ACME Logistics",
  "email": "ops@acme.com",
  "phone": "+251900000000",
  "company": "ACME",
  "address": "Addis Ababa",
  "reference": "RF-1",
  "description": "Preferred courier"
}
```

Response (list):
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

### Products (note on images)
- Images are served from `/uploads/`.
- Full image URL format: `{base}/uploads/products/{filename}`

Example mapping on the frontend:
```json
{
  "base": "http://localhost:3001",
  "prefix": "/uploads/products",
  "imgSrc": "http://localhost:3001/uploads/products/image-xxxx.png"
}
```

### HTTP Status Codes
- 200/201: success responses (with `success: true`)
- 400/422: validation and bad request errors (with `success: false` and `errors` map)
- 401/403/404/409/500: standardized error payloads as above

### Notes for Frontend Implementation
- Always rely on `success` to branch logic.
- For lists, rely on `meta` for pagination controls.
- Use `meta.filters` to persist and rebuild filter UIs.
- Prefer `sortBy` format: `field:direction` (e.g., `name:asc`, `createdAt:desc`).
- When submitting filters, send them as query params; the backend will echo them in `meta.filters`.

### Backend Guarantees (What’s enabled globally)
- Global response interceptor formats success payloads and builds `meta` for lists.
- Global exception filter normalizes all errors to the shared error shape.


