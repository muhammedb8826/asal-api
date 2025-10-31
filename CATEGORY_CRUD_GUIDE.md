# Category CRUD API Documentation

This guide documents the Category CRUD API endpoints for frontend integration.

## API Endpoints

All endpoints are prefixed with the base URL: `https://asal-api.qenenia.com`

### Base Endpoint
```
/categories
```

## Endpoints

### 1. Create Category
**POST** `/categories`

Creates a new category.

**Request Body:**
```json
{
  "name": "Electronics",
  "status": true,
  "description": "Electronic items and devices"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-here",
  "name": "Electronics",
  "status": true,
  "description": "Electronic items and devices",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Validation Rules:**
- `name`: Required, must be a non-empty string, must be unique
- `status`: Optional, boolean, defaults to `true`
- `description`: Optional, string

---

### 2. Get All Categories (with pagination)
**GET** `/categories?page=1&limit=20&q=searchTerm`

Retrieves a paginated list of categories with optional search.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `q` (optional): Search term (searches in category name)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-here",
      "name": "Electronics",
      "status": true,
      "description": "Electronic items and devices",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 10
}
```

---

### 3. Get Single Category
**GET** `/categories/:id`

Retrieves a single category by ID.

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "name": "Electronics",
  "status": true,
  "description": "Electronic items and devices",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Category not found"
}
```

---

### 4. Update Category
**PATCH** `/categories/:id`

Updates an existing category.

**Request Body (all fields optional):**
```json
{
  "name": "Updated Electronics",
  "status": false,
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "name": "Updated Electronics",
  "status": false,
  "description": "Updated description",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

**Validation Rules:**
- All fields optional
- If provided, same validation rules as create apply

---

### 5. Delete Category
**DELETE** `/categories/:id`

Deletes a category permanently.

**Response (204 No Content):**
Empty body on success.

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Category not found"
}
```

---

## Authentication

The Category endpoints do not require authentication. All endpoints are publicly accessible without JWT tokens.

---

## Data Model

### Category Entity

```typescript
interface Category {
  id: string;                    // UUID
  name: string;                  // Unique category name
  status: boolean;               // Active/inactive status
  description: string | null;    // Optional description
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

---

## Error Handling

Common error responses:

### 400 Bad Request
Invalid request data (validation errors)
```json
{
  "statusCode": 400,
  "message": ["name must be a string", "name should not be empty"],
  "error": "Bad Request"
}
```

### 404 Not Found
Category not found
```json
{
  "statusCode": 404,
  "message": "Category not found"
}
```

### 409 Conflict
Name uniqueness constraint violation
```json
{
  "statusCode": 409,
  "message": "Category with this name already exists"
}
```

### 500 Internal Server Error
Server error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Notes

- Category names must be unique across the system
- Deleting a category may affect items that reference it (check foreign key constraints)
- The `status` field can be used to deactivate categories without deleting them
- Search is case-insensitive and matches partial names
