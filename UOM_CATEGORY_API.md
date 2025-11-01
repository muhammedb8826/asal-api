# UOM & Unit Category API Documentation

Backend reference for creating and managing Unit Categories and Units of Measure (UOM).

Base URL: `https://asal-api.qenenia.com`

---

## Unit Category
Represents a measurement dimension (e.g., Weight, Length, Volume).

Entity fields (current backend):
- id (uuid)
- name (string, unique)
- description (string)
- constant (boolean)
- constantValue (number)
- createdAt (ISO Date)
- updatedAt (ISO Date)

### Endpoints
- Create: POST `/unit-categories`
  - Body:
```json
{
  "name": "Weight",
  "description": "Mass/weight units",
  "constant": true,
  "constantValue": 1
}
```
- List (pagination/search): GET `/unit-categories?page=1&limit=20&q=wei`
  - Response:
```json
{ "data": [ { "id": "...", "name": "Weight", "description": "...", "constant": true, "constantValue": 1, "createdAt": "...", "updatedAt": "..." } ], "total": 1 }
```
- Get one: GET `/unit-categories/:id`
- Update: PATCH `/unit-categories/:id`
  - Body (any subset):
```json
{ "name": "Mass", "description": "Mass units" }
```
- Delete: DELETE `/unit-categories/:id`

Validation
- name: required, unique
- description: required (per current entity)
- constant: required boolean
- constantValue: required number

---

## UOM (Unit of Measure)
Represents a specific unit within a category.

Entity fields (current backend):
- id (uuid)
- name (string)
- abbreviation (string)
- conversionRate (decimal as string; multiplier to base unit; > 0)
- baseUnit (boolean) — indicates category base
- unitCategoryId (uuid)
- createdAt (ISO Date)
- updatedAt (ISO Date)

Constraints
- Unique: (name, abbreviation, unitCategoryId)
- Check: conversionRate > 0
- Index: unitCategoryId

### Endpoints
- Create: POST `/uoms`
  - Body:
```json
{
  "name": "Kilogram",
  "abbreviation": "kg",
  "conversionRate": "1",
  "baseUnit": true,
  "unitCategoryId": "<categoryId>"
}
```
- List (pagination/filter/search): GET `/uoms?page=1&limit=20&unitCategoryId=<id>&q=kg`
  - Response:
```json
{ "data": [ { "id": "...", "name": "Kilogram", "abbreviation": "kg", "conversionRate": "1", "baseUnit": true, "unitCategoryId": "...", "createdAt": "...", "updatedAt": "..." } ], "total": 1 }
```
- Get one: GET `/uoms/:id`
- Update: PATCH `/uoms/:id`
  - Body (any subset):
```json
{ "abbreviation": "KG", "conversionRate": "1.000000000" }
```
- Delete: DELETE `/uoms/:id`

Validation
- name, abbreviation: required strings
- conversionRate: required positive decimal string (precision 18, scale 9)
- baseUnit: required boolean
- unitCategoryId: required uuid

Notes
- Exactly one base unit per category is recommended. If needed, enforce via migration with a partial unique index.
- For quantities: base quantity = enteredQuantity × conversionRate.

---

## Error Responses
- 400 Bad Request (validation)
- 404 Not Found (invalid id)
- 409 Conflict (uniqueness violation)
- 500 Internal Server Error

---

## Quick Create Flow
1) Create Unit Category (e.g., Weight)
2) Create base UOM (e.g., Kilogram, conversionRate="1", baseUnit=true)
3) Create secondary UOMs in same category (e.g., Gram, conversionRate="0.001", baseUnit=false)
