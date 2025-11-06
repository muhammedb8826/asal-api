# Frontend Changes Required - Purchase & GRN Reliability Improvements

This document outlines the frontend changes needed after implementing reliability improvements for Purchase and GRN operations.

## Summary of Backend Changes

The backend now enforces:
1. **Purchase editing restrictions** when GRNs exist
2. **Purchase deletion prevention** when GRNs exist
3. **GRN status-based restrictions** (cannot edit/delete COMPLETE GRNs)
4. **Database transactions** for all GRN operations (atomicity)
5. **Optimistic locking** for product inventory (version column)

---

## Required Frontend Changes

### 1. Purchase Management UI

#### A. Check for GRNs Before Editing
**Action Required:**
- Before showing the purchase edit form, check if the purchase has associated GRNs
- You can check this by:
  - Fetching GRNs for the purchase: `GET /grns?purchaseId=<purchaseId>` (if endpoint supports filtering)
  - Or checking the purchase details response for GRN count/status

**UI Behavior:**
- If purchase has GRNs:
  - Show warning banner: *"⚠️ This purchase has received items (GRNs). Editing is restricted."*
  - Display received vs ordered quantities for each item
  - Disable delete button for items that have GRN references
  - Prevent quantity reductions below already received amounts

#### B. Purchase Item Editing Restrictions
**When editing purchase items:**
- **Cannot delete items** that have been received in GRNs
- **Cannot reduce quantity** below already received quantity

**Error Messages to Handle:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "general": "Cannot delete purchase item <id> (product: <productId>) because it has been received in GRNs"
  }
}
```

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "general": "Cannot reduce quantity for product <productId>. New baseQuantity (<new>) is less than received quantity (<received>)"
  }
}
```

**UI Recommendations:**
- Show received quantity next to ordered quantity for each item
- Disable quantity input if trying to reduce below received
- Show tooltip: "Cannot reduce below <received> (already received)"
- Disable delete button for items with GRN references
- Show icon/badge indicating which items have been received

#### C. Purchase Deletion Restrictions
**Action Required:**
- Check if purchase has GRNs before showing delete button
- Disable delete button if GRNs exist

**Error Message to Handle:**
```json
{
  "success": false,
  "message": "Cannot delete purchase because it has associated GRNs (Goods Receipt Notes). Please delete the GRNs first.",
  "errors": {
    "general": "Cannot delete purchase because it has associated GRNs (Goods Receipt Notes). Please delete the GRNs first."
  }
}
```

**UI Recommendations:**
- Show delete button as disabled with tooltip: "Cannot delete purchase with received items"
- Or show warning: "This purchase has <N> GRN(s). Delete GRNs first."
- Provide link to view associated GRNs

---

### 2. GRN Management UI

#### A. Status-Based Editing Restrictions
**Action Required:**
- Check GRN `status` before allowing edits
- If `status === 'COMPLETE'`:
  - **Disable item editing** (hide/disable item edit controls)
  - **Disable delete button**
  - **Allow only metadata updates** (note, receivedBy fields)

**UI Behavior:**
- Show status badge prominently: `PENDING`, `PARTIAL`, `COMPLETE`
- For COMPLETE GRNs:
  - Show message: *"✓ This GRN is complete. Items cannot be edited or deleted."*
  - Disable item list editing
  - Show metadata fields (note, receivedBy) as editable only
  - Hide/disable delete button

**Error Messages to Handle:**
```json
{
  "success": false,
  "message": "Cannot edit items for GRN with status COMPLETE. Only metadata fields (note, receivedBy, etc.) can be updated.",
  "errors": {
    "general": "Cannot edit items for GRN with status COMPLETE. Only metadata fields (note, receivedBy, etc.) can be updated."
  }
}
```

#### B. Status-Based Deletion Restrictions
**Action Required:**
- Check GRN `status` before showing delete button
- If `status === 'COMPLETE'`: Disable/hide delete button

**Error Message to Handle:**
```json
{
  "success": false,
  "message": "Cannot delete GRN with status COMPLETE. Completed GRNs cannot be deleted.",
  "errors": {
    "general": "Cannot delete GRN with status COMPLETE. Completed GRNs cannot be deleted."
  }
}
```

**UI Recommendations:**
- Show delete button as disabled with tooltip: "Completed GRNs cannot be deleted"
- Or show warning badge: "Completed - Cannot Delete"

---

### 3. Enhanced User Experience

#### A. Purchase List View
**Recommended Additions:**
- Show indicator if purchase has GRNs (e.g., badge: "Has GRNs")
- Show received status: "Fully Received", "Partially Received", "Not Received"
- Color-code or icon to indicate which purchases can be edited/deleted

#### B. Purchase Detail View
**Recommended Additions:**
- **GRN Status Section**: Show list of associated GRNs with their statuses
- **Received vs Ordered**: For each purchase item, show:
  - Ordered: `<baseQuantity>`
  - Received: `<totalReceived>` (sum across all GRNs)
  - Remaining: `<ordered - received>`
- **Edit Restrictions Indicator**: Show which items can/cannot be edited

#### C. GRN List View
**Recommended Additions:**
- Show status badge prominently (`PENDING`, `PARTIAL`, `COMPLETE`)
- Disable edit/delete actions for COMPLETE GRNs
- Show received percentage: "50% Received", "100% Complete"

#### D. GRN Detail View
**Recommended Additions:**
- Show status prominently at top
- If COMPLETE: Show success message and disable item editing
- Show received vs ordered for each item
- Link to parent Purchase

---

### 4. Error Handling

#### New Error Scenarios to Handle

1. **Purchase Item Deletion Blocked**
   - Error: `"Cannot delete purchase item <id> (product: <productId>) because it has been received in GRNs"`
   - Action: Show user-friendly message with link to view GRNs

2. **Purchase Quantity Reduction Blocked**
   - Error: `"Cannot reduce quantity for product <productId>. New baseQuantity (<new>) is less than received quantity (<received>)"`
   - Action: Show received quantity and prevent reduction

3. **Purchase Deletion Blocked**
   - Error: `"Cannot delete purchase because it has associated GRNs (Goods Receipt Notes). Please delete the GRNs first."`
   - Action: Show list of GRNs with links to delete them

4. **GRN Item Editing Blocked (COMPLETE)**
   - Error: `"Cannot edit items for GRN with status COMPLETE. Only metadata fields (note, receivedBy, etc.) can be updated."`
   - Action: Disable item editing, allow only metadata

5. **GRN Deletion Blocked (COMPLETE)**
   - Error: `"Cannot delete GRN with status COMPLETE. Completed GRNs cannot be deleted."`
   - Action: Disable delete button, show explanation

---

### 5. API Endpoint Considerations

#### Check Purchase GRN Status
**Recommended Approach:**
- Option 1: Add GRN count to purchase detail response (backend enhancement)
- Option 2: Fetch GRNs separately: `GET /grns?purchaseId=<purchaseId>` (if filtering supported)
- Option 3: Check purchase items for received quantities

#### Check GRN Status
- GRN status is included in all GRN responses
- Check `data.status` field: `'PENDING'`, `'PARTIAL'`, or `'COMPLETE'`

---

### 6. Implementation Checklist

- [ ] Add GRN status check before showing GRN edit/delete buttons
- [ ] Disable item editing for COMPLETE GRNs
- [ ] Disable delete button for COMPLETE GRNs
- [ ] Show status badges on GRN list and detail views
- [ ] Add purchase GRN check before allowing purchase edits
- [ ] Show received vs ordered quantities for purchase items
- [ ] Disable purchase item deletion for items with GRNs
- [ ] Prevent quantity reduction below received amounts
- [ ] Disable purchase delete button if GRNs exist
- [ ] Handle all new error messages with user-friendly UI
- [ ] Add visual indicators (badges, icons) for restricted operations
- [ ] Update error handling to show helpful messages with action links

---

### 7. Example UI States

#### Purchase with GRNs - Edit Form
```
┌─────────────────────────────────────┐
│ ⚠️ This purchase has 2 GRN(s)     │
│ Editing is restricted               │
└─────────────────────────────────────┘

Items:
┌──────────────────────────────────────────────┐
│ Product A                                    │
│ Ordered: 100 | Received: 50 | Remaining: 50 │
│ [Quantity: 100] (disabled if < 50)          │
│ [Delete] (disabled - has GRNs)              │
└──────────────────────────────────────────────┘
```

#### GRN with Status COMPLETE
```
┌─────────────────────────────────────┐
│ GRN-0001                    [COMPLETE] │
│ ✓ This GRN is complete               │
│ Items cannot be edited or deleted     │
└─────────────────────────────────────┘

[Edit Note] [Edit Received By] [Delete] (disabled)
```

---

## Testing Checklist

- [ ] Test editing purchase with no GRNs (should work normally)
- [ ] Test editing purchase with GRNs (should show restrictions)
- [ ] Test deleting purchase item with GRN references (should fail with error)
- [ ] Test reducing quantity below received (should fail with error)
- [ ] Test deleting purchase with GRNs (should fail with error)
- [ ] Test editing COMPLETE GRN items (should fail with error)
- [ ] Test editing COMPLETE GRN metadata (should work)
- [ ] Test deleting COMPLETE GRN (should fail with error)
- [ ] Test editing PENDING/PARTIAL GRN (should work)
- [ ] Test deleting PENDING/PARTIAL GRN (should work)

---

## Notes

- All restrictions are enforced server-side, so frontend restrictions are for UX only
- Backend will always return appropriate error messages if restrictions are violated
- Frontend should prevent invalid operations before sending requests (better UX)
- Always handle error responses gracefully with user-friendly messages

