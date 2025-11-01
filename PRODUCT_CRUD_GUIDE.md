# Product CRUD API Documentation

Backend reference for creating and managing Products.

Base URL: `https://asal-api.qenenia.com`

---

## API Endpoints

All endpoints are prefixed with the base URL: `https://asal-api.qenenia.com`

### Base Endpoint

```text
/products
```

---

## Endpoints

### 1. Create Product

**POST** `/products`

Creates a new product.

**Request Body:**

This endpoint accepts `multipart/form-data` with the product data as JSON fields and an optional image file:

**Fields:**

- `name`: string (required)
- `internalNote`: string (optional)
- `reorderLevel`: number (required)
- `categoryId`: string (required, UUID)
- `canBePurchased`: boolean (optional, default: true)
- `canBeSold`: boolean (optional, default: true)
- `quantity`: number (optional, default: 0)
- `unitCategoryId`: string (optional, UUID)
- `defaultUomId`: string (optional, UUID)
- `purchaseUomId`: string (optional, UUID)

**File:**

- `image`: file (optional, accepts: JPEG, PNG, GIF, WebP)

**Response (201 Created):**

```json
{
  "id": "uuid-here",
  "name": "Widget Pro 5000",
  "internalNote": "High-quality widget for professional use",
  "reorderLevel": 10,
  "categoryId": "uuid-here",
  "canBePurchased": true,
  "canBeSold": true,
  "quantity": 100,
  "unitCategoryId": "uuid-here",
  "defaultUomId": "uuid-here",
  "purchaseUomId": "uuid-here",
  "image": "widget-pro-5000.jpg",
  "createdAt": "2025-11-01T00:00:00.000Z",
  "updatedAt": "2025-11-01T00:00:00.000Z"
}
```

**Validation Rules:**

- `name`: Required, must be a non-empty string, must be unique
- `internalNote`: Optional, string
- `reorderLevel`: Required, must be a number
- `categoryId`: Required, must be a valid UUID
- `canBePurchased`: Optional, boolean, defaults to `true`
- `canBeSold`: Optional, boolean, defaults to `true`
- `quantity`: Optional, must be a number, defaults to `0` if not provided
- `unitCategoryId`: Optional, must be a valid UUID if provided
- `defaultUomId`: Optional, must be a valid UUID if provided
- `purchaseUomId`: Optional, must be a valid UUID if provided
- `image`: Optional, uploaded image file (accepts: JPEG, PNG, GIF, WebP)

---

### 2. Get All Products (with pagination)

**GET** `/products?page=1&limit=20&q=searchTerm`

Retrieves a paginated list of products with optional search.

**Query Parameters:**

- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `q` (optional): Search term (searches in product name)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid-here",
      "name": "Widget Pro 5000",
      "internalNote": "High-quality widget for professional use",
      "reorderLevel": 10,
      "categoryId": "uuid-here",
      "canBePurchased": true,
      "canBeSold": true,
      "quantity": 100,
      "unitCategoryId": "uuid-here",
      "defaultUomId": "uuid-here",
      "purchaseUomId": "uuid-here",
      "image": "widget-pro-5000.jpg",
      "createdAt": "2025-11-01T00:00:00.000Z",
      "updatedAt": "2025-11-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 3. Get Single Product

**GET** `/products/:id`

Retrieves a single product by ID.

**Response (200 OK):**

```json
{
  "id": "uuid-here",
  "name": "Widget Pro 5000",
  "internalNote": "High-quality widget for professional use",
  "reorderLevel": 10,
  "categoryId": "uuid-here",
  "canBePurchased": true,
  "canBeSold": true,
  "quantity": 100,
  "unitCategoryId": "uuid-here",
  "defaultUomId": "uuid-here",
  "purchaseUomId": "uuid-here",
  "image": "widget-pro-5000.jpg",
  "createdAt": "2025-11-01T00:00:00.000Z",
  "updatedAt": "2025-11-01T00:00:00.000Z"
}
```

**Error Response (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "Product not found"
}
```

---

### 4. Update Product

**PATCH** `/products/:id`

Updates an existing product.

**Request Body:**

This endpoint accepts `multipart/form-data` with the product data as JSON fields and an optional image file. All fields are optional:

**Fields (all optional):**

- `name`: string
- `internalNote`: string
- `reorderLevel`: number
- `categoryId`: string (UUID)
- `canBePurchased`: boolean
- `canBeSold`: boolean
- `quantity`: number
- `unitCategoryId`: string (UUID)
- `defaultUomId`: string (UUID)
- `purchaseUomId`: string (UUID)

**File (optional):**

- `image`: file (accepts: JPEG, PNG, GIF, WebP)

**Response (200 OK):**

```json
{
  "id": "uuid-here",
  "name": "Updated Widget Pro 5000",
  "internalNote": "Updated description",
  "reorderLevel": 15,
  "categoryId": "uuid-here",
  "canBePurchased": true,
  "canBeSold": true,
  "quantity": 150,
  "unitCategoryId": "uuid-here",
  "defaultUomId": "uuid-here",
  "purchaseUomId": "uuid-here",
  "image": "updated-widget.jpg",
  "createdAt": "2025-11-01T00:00:00.000Z",
  "updatedAt": "2025-11-01T12:00:00.000Z"
}
```

**Validation Rules:**

- All fields optional
- If provided, same validation rules as create apply

---

### 5. Delete Product

**DELETE** `/products/:id`

Deletes a product permanently.

**Response (204 No Content):**

Empty body on success.

**Error Response (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "Product not found"
}
```

---

## Authentication

The Product endpoints do not require authentication. All endpoints are publicly accessible without JWT tokens.

---

## Data Model

### Product Entity

```typescript
interface Product {
  id: string;                    // UUID
  name: string;                  // Unique product name
  internalNote: string | null;   // Optional internal notes
  reorderLevel: number;          // Minimum stock level before reordering
  categoryId: string;            // UUID reference to Category
  canBePurchased: boolean;       // Can this product be purchased
  canBeSold: boolean;            // Can this product be sold
  quantity: number;              // Current stock quantity
  unitCategoryId: string | null; // UUID reference to UnitCategory
  defaultUomId: string | null;   // UUID reference to default UOM
  purchaseUomId: string | null;  // UUID reference to purchase UOM
  image: string | null;          // Uploaded image filename
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

Product not found

```json
{
  "statusCode": 404,
  "message": "Product not found"
}
```

### 409 Conflict

Name uniqueness constraint violation

```json
{
  "statusCode": 409,
  "message": "Product with this name already exists"
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

- Product names must be unique across the system
- Deleting a product may affect related records (pricing, purchases, sales, orders, etc.)
- The `quantity` field represents current inventory level and is optional when creating a product (defaults to 0)
- Quantity is typically updated via purchase operations or when importing data from Excel
- `reorderLevel` is used to trigger inventory alerts when stock is low
- Products must have a valid `categoryId` (reference to an existing Category)
- UOM-related fields (`unitCategoryId`, `defaultUomId`, `purchaseUomId`) are optional but recommended for proper inventory management
- The `image` field in the response contains the filename of the uploaded image (e.g., "image-1234567890-987654321.jpg")
- Uploaded images are stored in the `./uploads/products/` directory and can be accessed via `/uploads/products/{filename}`
- Search is case-insensitive and matches partial names

---

## Related Entities

When creating or updating a product, you may need to reference:

- **Category**: Created via `/categories` endpoint (see `CATEGORY_CRUD_GUIDE.md`)
- **UnitCategory**: Created via `/unit-categories` endpoint (see `UOM_CATEGORY_API.md`)
- **UOM (Unit of Measure)**: Created via `/uoms` endpoint (see `UOM_CATEGORY_API.md`)

---

## Example Workflow

1. Create a Category (if not exists): `POST /categories`
2. Create a UnitCategory (e.g., "Weight"): `POST /unit-categories`
3. Create UOMs for that category (e.g., "Kilogram", "Gram"): `POST /uoms`
4. Create the Product: `POST /products` with references to the created entities
5. List products: `GET /products`
6. Update product details: `PATCH /products/:id`
7. Delete product: `DELETE /products/:id`
