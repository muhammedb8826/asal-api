# AP Invoice Features - Complete Implementation Guide

This document describes all the features implemented for AP (Accounts Payable) Invoice management.

## Features Implemented

### 1. Enhanced AP Invoice Entity
- **supplierInvoiceNumber**: Unique supplier invoice number per supplier
- **paymentTerms**: Payment terms in days (e.g., 30, 60)
- **dueDate**: Computed from invoiceDate + paymentTerms
- **status**: DRAFT, POSTED, PARTIALLY_PAID, PAID, CLOSED
- **paidAmount**: Total amount paid against invoice
- **outstandingAmount**: Computed as totalAmount - paidAmount

### 2. Invoice Validations
- **Unique supplierInvoiceNumber**: Validates uniqueness per supplier
- **Price tolerance**: 2% variance allowed from PO price (configurable)
- **3-way match**: Invoiced quantity ≤ Received (GRN) and ≤ Ordered (PO)
- **UOM validation**: UOMs must be in same category, base UOM must be category base unit

### 3. Supplier Payments
- **Create Payment**: POST `/supplier-payments`
  - Auto-generates series (PAY-0001, PAY-0002, ...)
  - Can apply payment to multiple invoices in one transaction
  - Automatically updates invoice status (POSTED → PARTIALLY_PAID → PAID)
  - Updates invoice outstandingAmount

- **List Payments**: GET `/supplier-payments?page=1&limit=20&q=...&supplierId=...`
- **Get Payment**: GET `/supplier-payments/:id`
- **Delete Payment**: DELETE `/supplier-payments/:id` (only if no applications)

### 4. Supplier Credits
- **Create Credit**: POST `/supplier-credits`
  - Auto-generates series (CREDIT-0001, CREDIT-0002, ...)
  - Can apply credit to multiple invoices in one transaction
  - Automatically updates invoice outstandingAmount (reduces by credit amount)
  - Updates credit status (DRAFT → POSTED → PARTIALLY_APPLIED → FULLY_APPLIED)

- **List Credits**: GET `/supplier-credits?page=1&limit=20&q=...&supplierId=...`
- **Get Credit**: GET `/supplier-credits/:id`
- **Delete Credit**: DELETE `/supplier-credits/:id` (only if no applications)

### 5. Reporting Endpoints

#### AP Aging Report
- **GET** `/reports/ap-aging`
- Returns invoices grouped by aging buckets:
  - 0-30 days
  - 31-60 days
  - 61-90 days
  - 90+ days
- Includes count and total outstanding per bucket

#### Supplier Statement
- **GET** `/reports/suppliers/:supplierId/statement`
- Returns:
  - All invoices for supplier (with paid/credited/outstanding amounts)
  - All payments with applications
  - All credits with applications
  - Summary totals (total invoiced, paid, credited, outstanding)

#### Variance Report
- **GET** `/reports/variance?purchaseId=<uuid>` (optional)
- Compares:
  - Ordered vs Received vs Invoiced quantities
  - PO price vs Invoice price
  - Shows quantity and price variances

### 6. Invoice Outstanding Balance
- **GET** `/ap-invoices/:id/outstanding`
- Returns: invoiceId, totalAmount, paidAmount, outstandingAmount

## API Endpoints Summary

### AP Invoices
- `POST /ap-invoices` - Create invoice
- `GET /ap-invoices` - List invoices
- `GET /ap-invoices/:id` - Get invoice
- `GET /ap-invoices/:id/outstanding` - Get outstanding balance
- `PATCH /ap-invoices/:id` - Update invoice
- `DELETE /ap-invoices/:id` - Delete invoice

### Supplier Payments
- `POST /supplier-payments` - Create payment (with applications)
- `GET /supplier-payments` - List payments
- `GET /supplier-payments/:id` - Get payment
- `DELETE /supplier-payments/:id` - Delete payment

### Supplier Credits
- `POST /supplier-credits` - Create credit (with applications)
- `GET /supplier-credits` - List credits
- `GET /supplier-credits/:id` - Get credit
- `DELETE /supplier-credits/:id` - Delete credit

### Reports
- `GET /reports/ap-aging` - AP aging report
- `GET /reports/suppliers/:supplierId/statement` - Supplier statement
- `GET /reports/variance?purchaseId=<uuid>` - Variance report

## Data Flow

1. **Create Invoice** → Status: DRAFT or POSTED
2. **Apply Payment** → Updates invoice paidAmount, outstandingAmount, status
3. **Apply Credit** → Updates invoice outstandingAmount (reduces it)
4. **Status Transitions**:
   - DRAFT → POSTED (when posted)
   - POSTED → PARTIALLY_PAID (when payment applied)
   - PARTIALLY_PAID → PAID (when fully paid)
   - Credits reduce outstanding but don't change status to PAID

## Frontend Integration Notes

- **Invoice Creation**: Include supplierInvoiceNumber, paymentTerms, status
- **Payment Application**: Send applications array with invoiceId and amount
- **Credit Application**: Send applications array with invoiceId and amount
- **Outstanding Balance**: Use `/ap-invoices/:id/outstanding` to show remaining balance
- **Aging Report**: Display buckets with counts and totals
- **Supplier Statement**: Show complete transaction history per supplier
- **Variance Report**: Highlight quantity/price discrepancies

## Validation Rules

1. **Supplier Invoice Number**: Must be unique per supplier
2. **Price Tolerance**: Invoice price can vary up to 2% from PO price
3. **Payment Application**: Cannot exceed invoice outstanding amount
4. **Credit Application**: Cannot exceed invoice total (minus paid)
5. **3-way Match**: Invoiced quantity must be ≤ received and ≤ ordered

