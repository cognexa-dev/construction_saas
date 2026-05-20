# Forever Buildcon - API Documentation (Phase 1)

## Base URL
`http://localhost:5000/api/v1`

## Authentication

### POST /auth/login
```json
// Request
{ "email": "admin@foreverbuildcon.com", "password": "Admin@123" }

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900,
    "id": "uuid",
    "email": "admin@foreverbuildcon.com",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "admin",
    "status": "active"
  }
}
```

### POST /auth/refresh
```json
// Request
{ "refreshToken": "eyJ..." }
// Response 200: new accessToken + refreshToken
```

### POST /auth/logout
```json
// Request
{ "refreshToken": "eyJ..." }
```

### POST /auth/logout-all
```
// Header: Authorization: Bearer <accessToken>
```

### GET /auth/me
```
// Header: Authorization: Bearer <accessToken>
// Response: current user object
```

## Users (Admin / Owner only)

All user endpoints require: `Authorization: Bearer <accessToken>`

### GET /users
```
Query params: page, limit, search, role, status
Roles allowed: admin, owner
```

### GET /users/:id
```
Roles allowed: admin, owner
```

### POST /users
```json
// Roles allowed: admin
{
  "email": "user@example.com",
  "password": "Pass@123",
  "firstName": "Ramesh",
  "lastName": "Patel",
  "phone": "9876543213",
  "role": "supervisor"
}
```

### PUT /users/:id
```json
// Roles allowed: admin
{
  "firstName": "Updated",
  "lastName": "Name",
  "role": "owner",
  "status": "inactive"
}
```

### DELETE /users/:id
```
// Roles allowed: admin
```

### PATCH /users/:id/toggle-status
```
// Roles allowed: admin
// Toggles active <-> inactive
```

## Health Check
### GET /health
```json
{ "status": "ok", "timestamp": "2025-04-19T..." }
```

## Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["field-level errors if any"]
}
```

## Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Server Error |
