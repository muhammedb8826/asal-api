# RBAC & Users API Guide (Frontend)

Base URL: `http://localhost:3001`

## Roles
- Enum `Role`: `ADMIN`, `PURCHASOR`, `FINANCE`, `STOREKEEPER`, `USER` (see `src/enums/role.enum.ts`).
- Decorator `@Roles(...roles)` restricts access.
- Guard `RolesGuard` reads roles from `request.user` (JWT payload) and enforces route access.

JWT expectation (example):
```json
{
  "sub": "<userId>",
  "email": "admin@example.com",
  "role": "ADMIN"
}
```
Backend also accepts `roles` on `user` if your auth provider sets that key.

## Users Entity (summary)
- Table: `user`
- Database columns (snake_case): `id`, `email` (unique), `password`, `address`, `first_name`, `last_name`,
  `middle_name`, `phone` (unique), `gender` (enum: `MALE`, `FEMALE`), `profile`, `roles` (enum: `ADMIN`, `PURCHASOR`, `FINANCE`, `STOREKEEPER`, `USER`), `is_active`, timestamps
- API DTOs use camelCase: `firstName`, `lastName`, `middleName`, `isActive` (automatically mapped to snake_case columns)

Note: The existing schema contains `confirm_password` and `passwordRT` for compatibility.

## Endpoints
All Users endpoints require `ADMIN` role via `@Roles(Role.ADMIN)`.

### Create User
- Method: POST
- URL: `/users`
- Body:
```json
{
  "email": "jane@example.com",
  "password": "StrongP@ss1",
  "confirmPassword": "StrongP@ss1",
  "address": "Addis Ababa",
  "firstName": "Jane",
  "lastName": "Doe",
  "middleName": "Marie",
  "phone": "+251900000000",
  "gender": "FEMALE",
  "profile": "",
  "roles": "PURCHASOR",
  "isActive": true
}
```
- Response: standard success with created user
- Notes:
  - All field names use camelCase (e.g., `firstName`, `lastName`, `isActive`). The backend automatically maps these to snake_case database columns.
  - `confirmPassword` is required and must match `password`.

### List Users
- Method: GET
- URL: `/users?page=1&limit=20&q=jane`
- Query:
  - `page` (default 1)
  - `limit` (default 20)
  - `q` (search in `email`/`phone`)
- Response: standard paginated success

### Get User
- Method: GET
- URL: `/users/:id`

### Update User
- Method: PATCH
- URL: `/users/:id`
- Body: any subset of create fields (partial, using camelCase)
- Example:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "isActive": false
}
```

### Delete User
- Method: DELETE
- URL: `/users/:id`

### Change My Password
- Method: PATCH
- URL: `/users/me/change-password`
- Auth: any signed-in user (JWT required)
- Body:
```json
{
  "currentPassword": "OldP@ss1",
  "newPassword": "NewP@ss2",
  "confirmNewPassword": "NewP@ss2"
}
```
- Responses:
  - 204 No Content on success
  - 400 if new password and confirmation do not match
  - 401 if current password is incorrect or user not authenticated

### Get My Profile
- Method: GET
- URL: `/users/me`
- Auth: any signed-in user (JWT required)
- Response: standard success with current user data

### Update My Profile
- Method: PATCH
- URL: `/users/me`
- Auth: any signed-in user (JWT required)
- Body: any subset of user fields (partial, using camelCase)
- Note: Users cannot update `roles` or `isActive` (admin-only fields)
- Example:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+251900000000",
  "address": "New Address"
}
```

### Upload My Profile Image
- Method: **PATCH** (not PUT)
- URL: **`/users/me/profile`** (plural "users", not "user")
- Auth: any signed-in user (JWT required)
- Headers:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: multipart/form-data` (set automatically by client)
- Multipart form-data:
  - Field name: `image` (file)
- Limits: max 5MB
- On success: 200 OK with updated user (field `profile` is the stored filename)
- Files are stored under `uploads/profiles/`; serve via your static files config (already enabled in `main.ts`).
- **Common mistakes:**
  - ❌ `PUT /user/profile` (wrong method and path)
  - ✅ `PATCH /users/me/profile` (correct)

## How to Use Roles in Other Controllers
Example:
```ts
import { Roles } from '../auth/roles.decorator';
import { Role } from '../enums/role.enum';

@Roles(Role.ADMIN)
@Get('secure')
findSecure() { /* ... */ }
```
The `RolesGuard` is registered globally in `UsersModule` via `APP_GUARD`. If you want it global across the whole app, move that provider to `AppModule`.

## Frontend Notes
- Ensure your auth layer sets `user.role` (or `user.roles`) in the request context (e.g., via JWT validation middleware) so the guard can read it.
- Handle 403 responses by showing an "Insufficient permissions" message.
- Hide/disable UI actions based on the current user's role to avoid unnecessary 403s.

## Common Errors
- **404 Not Found**: Wrong endpoint path (e.g., `/user/profile` instead of `/users/me/profile`) or wrong HTTP method (e.g., `PUT` instead of `PATCH`)
- **401 Unauthorized**: Missing or invalid JWT token in `Authorization` header
- **403 Forbidden**: user lacks required role or JWT missing role claim
- **409 Conflict**: creating user with duplicate `email` or `phone`
- **400 Validation**: invalid email/phone or missing fields, or no file uploaded for profile image

## Roadmap (optional)
- Role management UI
- Per-resource permissions (beyond enum roles)
- Audit logging for user changes

