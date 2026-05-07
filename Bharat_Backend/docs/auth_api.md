
# Auth API Documentation

This documentation provides details about the authentication APIs for user signup and login.

## Base URL

The base URL for all API endpoints is: `/api/v1`

---

## Signup

This endpoint allows a new user to create an account.

- **URL:** `/auth/signup`
- **Method:** `POST`
- **Headers:**
  - `Content-Type: application/json`

### Request Body

| Field    | Type   | Description          | Required |
| -------- | ------ | -------------------- | -------- |
| `name`   | String | The name of the user | Yes      |
| `email`  | String | The email of the user| Yes      |
| `password`| String | The password of the user| Yes    |

**Example:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "yoursecurepassword"
}
```

### Success Response

- **Status Code:** `201 Created`

**Example:**

```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

### Error Response

- **Status Code:** `400 Bad Request`

**Example:**

```json
{
  "message": "Name, email, and password are required"
}
```

---

## Login

This endpoint allows an existing user to log in.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Headers:**
  - `Content-Type: application/json`

### Request Body

| Field    | Type   | Description          | Required |
| -------- | ------ | -------------------- | -------- |
| `email`  | String | The email of the user| Yes      |
| `password`| String | The password of the user| Yes    |

**Example:**

```json
{
  "email": "john.doe@example.com",
  "password": "yoursecurepassword"
}
```

### Success Response

- **Status Code:** `200 OK`

**Example:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

### Error Response

- **Status Code:** `400 Bad Request`

**Example:**

```json
{
  "message": "Email and password are required"
}
```