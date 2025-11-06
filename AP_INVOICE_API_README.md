# AP (Supplier Invoice) API Guide (Frontend)

Base URL: `http://localhost:3001`

## Data Model
- Header
  - `id` (uuid)
  - `series` (string, auto-generated: AP-0001, AP-0002, ...)
  - `supplierId` (uuid)
  - `purchaseId` (uuid, optional) – links invoice to a PO
  - `invoiceDate` (ISO string)
  - `reference` (string)
  - `note` (string)
  - `totalAmount` (number)
  - `createdAt`, `updatedAt`
- Line Item
  - `id` (uuid)
  - `invoiceId` (uuid)
  - `purchaseItemId` (uuid)
  - `quantity` (number, positive)
  - `unitPrice` (number, positive)
  - `amount` (number) – `quantity * unitPrice`
  - `uomId` (uuid)
  - `baseUomId` (uuid, must be product category base unit)
  - `unit` (number, computed = selectedUom.conversionRate / baseUom.conversionRate)
  - `baseQuantity` (number, computed = quantity * unit)

## Endpoints

### Create Invoice
- Method: POST
- URL: `/ap-invoices`
- Body:
```json
{
  "supplierId": "<uuid>",
  "purchaseId": "<uuid>",
  "invoiceDate": "2025-11-06T00:00:00.000Z",
  "reference": "INV-123",
  "note": "",
  "items": [
    {
      "purchaseItemId": "<uuid>",
      "quantity": 10,
      "unitPrice": 12.5,
      "uomId": "<uuid>",
      "baseUomId": "<uuid>"
    }
  ]
}
```
- Response (201): standard success wrapper with invoice and `items`
- Validation (3-way match):
  - Invoiced base quantity (across all invoices) ≤ Received base quantity (across GRNs)
  - Invoiced base quantity ≤ Ordered base quantity
  - UOM category consistency and base unit enforcement

### List Invoices
- Method: GET
- URL: `/ap-invoices?page=1&limit=20&q=AP-0001`
- Query: `page`, `limit`, `q` (search in series/reference)

### Get Invoice
- Method: GET
- URL: `/ap-invoices/:id`

### Update Invoice (replace items)
- Method: PATCH
- URL: `/ap-invoices/:id`
- Body: same item shape; replaces all items after validation

### Delete Invoice
- Method: DELETE
- URL: `/ap-invoices/:id`

## Frontend Notes
- `series` auto-generated if omitted
- Always send positive `quantity` and `unitPrice`
- Use purchase details and GRNs to present remaining to invoice per line
- Handle validation errors for over-invoicing gracefully

