# Profile API Integration Guide

This document provides details for integrating the frontend with the Profile CRUD API.

## Base URL
All profile-related endpoints are under:
`http://localhost:5000/api/v1/profile`

## Authentication
All Profile endpoints require an active user token. You must pass the JWT token in the `Authorization` header of every request.

```http
Authorization: Bearer <YOUR_JWT_TOKEN>
```

---

## Endpoints

### 1. Create Profile
Creates a new profile for the currently authenticated user.

* **URL**: `/`
* **Method**: `POST`
* **Headers**:
  * `Authorization: Bearer <TOKEN>`
  * `Content-Type: application/json`
* **Body**:
  ```json
  {
    "full_name": "John Doe",
    "bio": "Full Stack Developer",
    "phone_number": "+91-9876543210",
    "avatar_url": "https://example.com/avatar.png"
  }
  ```
* **Success Response**: `201 Created`
  ```json
  {
    "message": "Profile created successfully",
    "profile": {
      "id": "uuid",
      "user_id": "uuid",
      "full_name": "John Doe",
      "bio": "Full Stack Developer",
      "phone_number": "+91-9876543210",
      "avatar_url": "https://example.com/avatar.png",
      "created_at": "timestamp"
    }
  }
  ```

---

### 2. Get Profile
Fetches the profile of the currently authenticated user.

* **URL**: `/`
* **Method**: `GET`
* **Headers**:
  * `Authorization: Bearer <TOKEN>`
* **Success Response**: `200 OK`
  ```json
  {
    "profile": {
      "id": "uuid",
      "user_id": "uuid",
      "full_name": "John Doe",
      "bio": "Full Stack Developer",
      "phone_number": "+91-9876543210",
      "avatar_url": "https://example.com/avatar.png",
      "created_at": "timestamp"
    }
  }
  ```
* **Error Response**: `404 Not Found` (If the profile does not exist yet).

---

### 3. Update Profile
Updates the profile information for the authenticated user.

* **URL**: `/`
* **Method**: `PUT`
* **Headers**:
  * `Authorization: Bearer <TOKEN>`
  * `Content-Type: application/json`
* **Body**: (Send only the fields you wish to update)
  ```json
  {
    "bio": "Senior Full Stack Developer",
    "phone_number": "+91-1122334455"
  }
  ```
* **Success Response**: `200 OK`
  ```json
  {
    "message": "Profile updated successfully",
    "profile": { ...updated profile object... }
  }
  ```

---

### 4. Delete Profile
Deletes the profile of the currently authenticated user.

* **URL**: `/`
* **Method**: `DELETE`
* **Headers**:
  * `Authorization: Bearer <TOKEN>`
* **Success Response**: `200 OK`
  ```json
  {
    "message": "Profile deleted successfully",
    "profile": { ...deleted profile object... }
  }
  ```

---

## Admin Endpoints (Optional)
If you need to manage a different user's profile, you can append their `userId` to the path:
* **GET** `/api/v1/profile/:userId`
* **PUT** `/api/v1/profile/:userId`
* **DELETE** `/api/v1/profile/:userId`
