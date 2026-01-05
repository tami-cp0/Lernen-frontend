# Lernen Backend API Documentation

**Version:** 1.0.0  
**Base URL:** `/api/v1`  
**Author:** Oluwatamilore Olugbesan

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
    - [Auth Endpoints](#auth-endpoints)
    - [User Endpoints](#user-endpoints)
    - [Chat Endpoints](#chat-endpoints)
4. [Error Handling](#error-handling)
5. [Data Models](#data-models)

---

## Overview

The Lernen Backend API provides endpoints for user authentication, profile management, and AI-powered chat functionality with document processing. The API uses JWT-based authentication and supports both email magic links and Google OAuth sign-in.

### Core Features

-   **Magic Link Authentication** - Passwordless email-based login
-   **Google OAuth** - Social authentication via Google
-   **User Management** - Profile updates and user administration
-   **AI Chat** - GPT-4o-mini powered conversations with document context
-   **Document Processing** - PDF and DOCX upload with vector search capabilities

### CORS Configuration

The API accepts requests from:

-   `http://localhost:3000`
-   `http://127.0.0.1:3000`
-   Configured frontend URL (from environment)

**Allowed Methods:** GET, POST, PUT, PATCH, OPTIONS  
**Credentials:** Supported (cookies/auth headers)

---

## Authentication

The API uses JWT-based authentication with two types of tokens:

-   **Access Token** - Used for authenticated API requests (include in `Authorization: Bearer <token>`)
-   **Refresh Token** - Used to obtain new access tokens when they expire

### Protected Endpoints

Protected endpoints require the `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

## API Endpoints

### Auth Endpoints

#### 1. Request Magic Link

**Endpoint:** `POST /auth/magic-link`  
**Authentication:** Public  
**Description:** Sends a magic link to the provided email address. Creates an account if the user doesn't exist.

**Request Body:**

```json
{
	"email": "user@example.com"
}
```

**Success Response (200):**

```json
{
	"message": "Magic link sent! Please check your email"
}
```

**Error Responses:**

-   `400 Bad Request` - Invalid email format

---

#### 2. Verify Sign-In Token

**Endpoint:** `POST /auth/verify-token`  
**Authentication:** Public  
**Description:** Verifies a temporary sign-in token from magic link or Google pre-sign-in. Token is single-use and consumed on verification.

**Request Body:**

```json
{
	"token": "temporary-sign-in-token"
}
```

**Success Response - Onboarded User (200):**

```json
{
	"message": "Sign in successful",
	"data": {
		"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
		"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	}
}
```

**Success Response - Not Onboarded (200):**

```json
{
	"message": "User not onboarded",
	"data": {
		"onboarded": false,
		"id": "550e8400-e29b-41d4-a716-446655440000",
		"provider": "email",
		"names": {
			"firstName": "Ada",
			"lastName": "Lovelace"
		}
	}
}
```

**Error Responses:**

-   `400 Bad Request` - Invalid, expired, or already-used token

---

#### 3. Complete Onboarding

**Endpoint:** `PUT /auth/onboard?provider=email|google`  
**Authentication:** Public (requires data from verify-token response)  
**Description:** Completes user onboarding and activates the account. Returns authentication tokens.

**Query Parameters:**

-   `provider` (required): `email` or `google`

**Request Body:**

```json
{
	"id": "550e8400-e29b-41d4-a716-446655440000",
	"firstName": "John",
	"lastName": "Doe",
	"educationLevel": "Bachelor's Degree",
	"preferences": ["Machine Learning", "Web Development"],
	"token": "verification-token-from-verify-endpoint"
}
```

**Success Response (200):**

```json
{
	"message": "User onboarding successful",
	"data": {
		"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
		"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	}
}
```

**Error Responses:**

-   `400 Bad Request` - Invalid input or user not found

---

#### 4. Google Sign-In

**Endpoint:** `POST /auth/google/callback`  
**Authentication:** Public  
**Description:** Exchanges Google authorization code for user info and authentication.

**Request Body:**

```json
{
	"code": "google-authorization-code"
}
```

**Success Response - Onboarded User (200):**

```json
{
	"message": "Sign in successful",
	"data": {
		"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
		"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
		"onboarded": true
	}
}
```

**Success Response - Requires Onboarding (200):**

```json
{
	"message": "Please complete onboarding.",
	"data": {
		"token": "temp-sign-in-token",
		"provider": "google",
		"id": "550e8400-e29b-41d4-a716-446655440000",
		"names": {
			"firstName": "Ada",
			"lastName": "Lovelace"
		},
		"onboarded": false
	}
}
```

**Error Responses:**

-   `400 Bad Request` - Invalid code, token exchange failed, or email not verified

---

#### 5. Refresh Tokens

**Endpoint:** `POST /auth/refresh?provider=email|google`  
**Authentication:** Refresh token required  
**Description:** Refreshes both access and refresh tokens using a valid refresh token.

**Headers:**

```
Authorization: Bearer <refresh_token>
```

**Query Parameters:**

-   `provider` (required): `email` or `google`

**Success Response (200):**

```json
{
	"message": "Tokens refreshed successfully",
	"data": {
		"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
		"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	}
}
```

**Error Responses:**

-   `401 Unauthorized` - Invalid or expired refresh token

---

### User Endpoints

#### 1. Get User Profile

**Endpoint:** `GET /users/profile`  
**Authentication:** Required (Access token)  
**Description:** Retrieves the authenticated user's complete profile.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
	"message": "User profile retrieved successfully",
	"data": {
		"user": {
			"id": "550e8400-e29b-41d4-a716-446655440000",
			"email": "user@example.com",
			"firstName": "John",
			"lastName": "Doe",
			"role": "user",
			"educationLevel": "Bachelor's Degree",
			"preferences": ["AI", "Web Dev"],
			"createdAt": "2024-01-01T00:00:00.000Z",
			"updatedAt": "2024-01-01T00:00:00.000Z"
		}
	}
}
```

**Error Responses:**

-   `401 Unauthorized` - Missing or invalid access token

---

#### 2. Update Profile

**Endpoint:** `PUT /users/update-profile`  
**Authentication:** Required (Access token)  
**Description:** Updates the authenticated user's profile information. At least one field must be provided.

**Request Body (all fields optional, but at least one required):**

```json
{
	"firstName": "Jane",
	"lastName": "Smith",
	"role": "user",
	"educationLevel": "Master's Degree"
}
```

**Success Response (200):**

```json
{
	"message": "Profile updated successfully",
	"data": {
		"user": {
			"id": "550e8400-e29b-41d4-a716-446655440000",
			"email": "user@example.com",
			"firstName": "Jane",
			"lastName": "Smith",
			"role": "user",
			"educationLevel": "Master's Degree"
		}
	}
}
```

**Error Responses:**

-   `400 Bad Request` - No fields provided or invalid values
-   `401 Unauthorized` - Missing or invalid access token

**Notes:**

-   Users cannot update their role to 'admin'
-   Maximum 50 characters for firstName and lastName

---

#### 3. Get All Users (Admin Only)

**Endpoint:** `GET /users/all`  
**Authentication:** Required (Admin role)  
**Description:** Retrieves all users except other admins. Admin-only endpoint.

**Success Response (200):**

```json
{
	"message": "All users fetched successfully",
	"data": {
		"users": [
			{
				"id": "550e8400-e29b-41d4-a716-446655440000",
				"email": "user1@example.com",
				"firstName": "John",
				"lastName": "Doe",
				"role": "user"
			},
			{
				"id": "550e8400-e29b-41d4-a716-446655440001",
				"email": "user2@example.com",
				"firstName": "Jane",
				"lastName": "Smith",
				"role": "user"
			}
		]
	}
}
```

**Error Responses:**

-   `401 Unauthorized` - Missing or invalid access token
-   `403 Forbidden` - User is not an admin

---

#### 4. Get User by ID or Email (Admin Only)

**Endpoint:** `GET /users/:identifier/user`  
**Authentication:** Required (Admin role)  
**Description:** Retrieves a specific user by their ID (UUID) or email address.

**Request Body:**

```json
{
	"identifier": "user@example.com"
}
```

or

```json
{
	"identifier": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**

```json
{
	"message": "User fetched successfully",
	"data": {
		"user": {
			"id": "550e8400-e29b-41d4-a716-446655440000",
			"email": "user@example.com",
			"firstName": "John",
			"lastName": "Doe",
			"role": "user",
			"createdAt": "2024-01-01T00:00:00.000Z"
		}
	}
}
```

**Error Responses:**

-   `400 Bad Request` - User not found
-   `401 Unauthorized` - Missing or invalid access token
-   `403 Forbidden` - User is not an admin

---

### Chat Endpoints

#### 1. Get All Chats

**Endpoint:** `GET /chats`  
**Authentication:** Required (Access token)  
**Description:** Retrieves all chats belonging to the authenticated user, ordered by creation date (newest first).

**Success Response (200):**

```json
{
	"message": "Chats retrieved successfully",
	"data": {
		"chats": [
			{
				"id": "chat-uuid-1",
				"title": "Machine Learning Discussion",
				"createdAt": "2024-01-15T10:30:00.000Z",
				"updatedAt": "2024-01-15T12:45:00.000Z"
			},
			{
				"id": "chat-uuid-2",
				"title": "Python Basics",
				"createdAt": "2024-01-14T09:00:00.000Z",
				"updatedAt": "2024-01-14T10:00:00.000Z"
			}
		]
	}
}
```

**Error Responses:**

-   `401 Unauthorized` - Missing or invalid access token

---

#### 2. Get Chat with Messages

**Endpoint:** `GET /chats/:chatId/messages`  
**Authentication:** Required (Access token)  
**Description:** Retrieves a specific chat with all messages and uploaded documents.

**URL Parameters:**

-   `chatId` - The UUID of the chat

**Success Response (200):**

```json
{
	"message": "Chat retrieved successfully",
	"data": {
		"chat": {
			"id": "chat-uuid",
			"title": "AI Discussion",
			"createdAt": "2024-01-15T10:30:00.000Z",
			"updatedAt": "2024-01-15T12:45:00.000Z"
		},
		"messages": [
			{
				"id": "message-uuid-1",
				"role": "user",
				"content": "What is machine learning?",
				"tokens": 5,
				"createdAt": "2024-01-15T10:31:00.000Z"
			},
			{
				"id": "message-uuid-2",
				"role": "assistant",
				"content": "Machine learning is a subset of AI...",
				"tokens": 150,
				"createdAt": "2024-01-15T10:31:30.000Z"
			}
		],
		"documents": [
			{
				"id": "doc-uuid",
				"filename": "ml-guide.pdf",
				"fileId": "openai-file-id",
				"vectorStoreId": "openai-vs-id",
				"uploadedAt": "2024-01-15T10:30:00.000Z"
			}
		]
	}
}
```

**Error Responses:**

-   `400 Bad Request` - Chat not found
-   `401 Unauthorized` - Missing or invalid access token

---

#### 3. Send Message

**Endpoint:** `POST /chats/:chatId/send-message`  
**Authentication:** Required (Access token)  
**Description:** Sends a message to an existing chat or creates a new chat if chatId is "new". Uses OpenAI GPT-4o-mini with file search capabilities to search through uploaded documents in the chat's vector store. Saves the conversation turn (user + assistant messages) to the database.

**URL Parameters:**

-   `chatId` - Chat UUID or `"new"` to create a new chat

**Request Body:**

```json
{
	"message": "Explain neural networks",
	"selectedDocumentIds": [
		"123e4567-e89b-12d3-a456-426614174000",
		"123e4567-e89b-12d3-a456-426614174001"
	],
	"helpful": true
}
```

**Field Details:**

-   **`message`** (string, **required**)
    -   The message content to send
    -   Must be a non-empty string
    -   When creating a new chat (chatId = "new"), the first 16 characters become the chat title
    -   Example: `"Hello, World!"`
-   **`selectedDocumentIds`** (array of strings, **optional**)
    -   Array of document IDs to reference for retrieval context
    -   Each ID must be a valid string (typically UUID format)
    -   Maximum 3 document IDs allowed per message
    -   Documents must exist in the specified chat
    -   Example: `["123e4567-e89b-12d3-a456-426614174000"]`
    -   Validation: Must be an array, each element must be a string
-   **`helpful`** (boolean, **optional**)
    -   Feedback indicator for whether the previous message was helpful
    -   Must be a boolean value (true/false)
    -   Used to track conversation quality
    -   Example: `true`

**Success Response (200):**

```json
{
	"message": "Message sent successfully",
	"data": {
		"chatId": "123e4567-e89b-12d3-a456-426614174000",
		"chatTitle": "Explain neural n",
		"userMessage": {
			"id": "msg-123e4567-e89b-12d3-a456-426614174000",
			"content": "Explain neural networks",
			"role": "user",
			"tokens": 3
		},
		"assistantMessage": {
			"id": "msg-123e4567-e89b-12d3-a456-426614174001",
			"content": "Neural networks are computing systems inspired by...",
			"role": "assistant",
			"tokens": 245
		},
		"totalTokens": 248
	}
}
```

**Error Responses:**

-   `400 Bad Request` - Chat not found (when chatId is not "new"), invalid input, or validation errors

    ```json
    {
    	"statusCode": 400,
    	"message": "Chat not found",
    	"error": "Bad Request"
    }
    ```

    Possible error messages:

    -   `"Chat not found"`
    -   `"message must be a string"`
    -   `"message is required and cannot be empty"`
    -   `"selectedDocumentIds must be an array of IDs"`
    -   `"Each document ID must be a string"`
    -   `"You can provide at most 3 document IDs"`
    -   `"helpful must be a boolean value"`

-   `401 Unauthorized` - Missing or invalid access token

-   `500 Internal Server Error` - OpenAI API error or unexpected server error
    ```json
    {
    	"statusCode": 500,
    	"message": "OpenAI API error message",
    	"error": "Internal Server Error"
    }
    ```

**Behavior Notes:**

-   When `chatId` is `"new"`:
    -   Creates a new chat with the authenticated user as owner
    -   First 16 characters of the message become the chat title
    -   Returns the newly created chat ID in the response
-   When `chatId` is an existing UUID:
    -   Must belong to the authenticated user
    -   Uses the chat's existing vector store for document context
-   AI Model Configuration:
    -   Model: GPT-4o-mini
    -   Capabilities: File search through vector store
    -   Searches through all uploaded documents in the chat
    -   Token usage is tracked and returned in response
-   Maximum Limits:
    -   3 document IDs can be referenced per message
    -   Only documents uploaded to the specific chat can be referenced

---

#### 4. Create New Chat

**Endpoint:** `POST /chats/create`  
**Authentication:** Required (Access token)  
**Description:** Creates a new empty chat for the authenticated user. The chat can later be populated with messages and documents. Optionally accepts a custom UUID for the chat.

**Request Body:**

```json
{
	"chatId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Request Fields:**

-   **`chatId`** (string, optional): Custom UUID for the chat. If not provided, a UUID will be auto-generated

**Success Response (201 Created):**

```json
{
	"message": "Chat created successfully",
	"chatId": "123e4567-e89b-12d3-a456-426614174000",
	"title": "Chat",
	"createdAt": "2025-07-15T12:34:56.789Z"
}
```

**Response Fields:**

-   **`message`** (string): Confirmation message
-   **`chatId`** (string): UUID of the newly created chat (either provided or auto-generated)
-   **`title`** (string): The chat title (always "Chat")
-   **`createdAt`** (string): ISO 8601 timestamp of chat creation

**Error Responses:**

-   `400 Bad Request` - Invalid UUID format
    ```json
    {
    	"statusCode": 400,
    	"message": ["chatId must be a UUID"],
    	"error": "Bad Request"
    }
    ```
-   `401 Unauthorized` - Missing or invalid access token
    ```json
    {
    	"statusCode": 401,
    	"message": "Unauthorized",
    	"error": "Unauthorized"
    }
    ```
-   `409 Conflict` - A chat with the provided ID already exists
    ```json
    {
    	"statusCode": 409,
    	"message": "A chat with this ID already exists",
    	"error": "Conflict"
    }
    ```

**Usage Notes:**

-   Creates an empty chat with no messages or documents
-   Chat is created with default title "Chat"
-   You can optionally provide a custom UUID if you want to control the chat ID (useful for client-side synchronization)
-   If no chatId is provided, the database will auto-generate one
-   Chat is immediately available for use
-   Can be used before uploading documents or sending messages
-   Useful for organizing chats before adding content
-   Title can be updated later when sending first message or uploading documents

**cURL Examples:**

```bash
# Create chat with auto-generated UUID
curl -X POST "http://localhost:3000/api/v1/chats/create" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# Create chat with custom UUID
curl -X POST "http://localhost:3000/api/v1/chats/create" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chatId": "123e4567-e89b-12d3-a456-426614174000"}'
```

---

#### 5. Upload Documents

**Endpoint:** `POST /chats/:chatId/upload-document`  
**Authentication:** Required (Access token)  
**Content-Type:** `multipart/form-data`  
**Description:** Uploads PDF or DOCX files to a specific chat or creates a new chat if chatId is "new". Files are processed through OpenAI's vector store for AI chat functionality. Maximum 5 documents per chat (existing + new uploads combined).

**URL Parameters:**

-   `chatId` - Chat UUID or `"new"` to create a new chat

**Form Data Fields:**

```
files: [file1.pdf, file2.docx]      (required)
message: "What is a bot?"           (optional)
```

**Field Details:**

-   **`files`** (file array, **required**)
    -   Array of file objects to upload
    -   **Accepted formats:** PDF (`.pdf`), Word documents (`.docx`)
    -   **Size limit:** 10MB per file
    -   **Quantity limit:** Maximum 5 files per request
    -   **Chat limit:** Maximum 5 documents total per chat (existing + new)
    -   Files are uploaded to OpenAI's vector store for document search
    -   Each file must pass format and size validation
-   **`message`** (string, **optional**)
    -   User query or message text
    -   Used as chat title when creating a new chat (chatId = "new")
    -   When provided with new chat: first 16 characters become the chat title
    -   Can be sent along with file uploads for context
    -   Example: `"What is a bot?"`
    -   Validation: Must be a string if provided

**File Requirements:**

-   **Supported Formats:**
    -   PDF: `.pdf`
    -   Word: `.docx`
-   **Size Limit:** Maximum 10MB per file
-   **Per Request:** Maximum 5 files can be uploaded at once
-   **Per Chat:** Maximum 5 documents total (if chat already has documents, upload slots are reduced)
-   **Processing:** Files are uploaded to OpenAI's file storage and vector store

**Success Response (200):**

```json
{
	"message": "All files uploaded successfully",
	"remainingSlots": 1,
	"chatId": "123e4567-e89b-12d3-a456-426614174000",
	"successfulUploads": [
		{
			"id": "doc-123e4567-e89b-12d3-a456-426614174000",
			"name": "document.pdf"
		},
		{
			"id": "doc-123e4567-e89b-12d3-a456-426614174001",
			"name": "research.docx"
		}
	],
	"failedUploads": []
}
```

**Response Fields:**

-   **`message`** (string): Summary of upload operation
    -   `"All files uploaded successfully"` - All files processed
    -   May indicate partial success if some files failed
-   **`remainingSlots`** (number): Number of upload slots remaining for this chat
    -   Range: 0-5
    -   Indicates how many more documents can be uploaded to this chat
    -   Example: If 2 documents uploaded, remainingSlots = 3
-   **`chatId`** (string): UUID of the chat (newly created or existing)
    -   Format: UUID v4
    -   Example: `"123e4567-e89b-12d3-a456-426614174000"`
-   **`successfulUploads`** (array): List of successfully uploaded documents
    -   Each object contains:
        -   `id` (string): Document ID with `doc-` prefix
        -   `name` (string): Original filename
-   **`failedUploads`** (array): List of failed upload attempts
    -   Each object contains:
        -   `name` (string): Original filename that failed
        -   `reason` (string, optional): Reason for failure
            -   Examples: `"No remaining upload slots"`, `"File too large"`, `"Invalid file type"`

**Partial Success Example (200):**

```json
{
	"message": "2 of 3 files uploaded successfully",
	"remainingSlots": 0,
	"chatId": "123e4567-e89b-12d3-a456-426614174000",
	"successfulUploads": [
		{
			"id": "doc-123e4567-e89b-12d3-a456-426614174000",
			"name": "document.pdf"
		},
		{
			"id": "doc-123e4567-e89b-12d3-a456-426614174001",
			"name": "research.docx"
		}
	],
	"failedUploads": [
		{
			"name": "extra-file.pdf",
			"reason": "No remaining upload slots"
		}
	]
}
```

**Error Responses:**

-   `400 Bad Request` - Validation errors or chat issues

    ```json
    {
    	"statusCode": 400,
    	"message": "Error message",
    	"error": "Bad Request"
    }
    ```

    Possible error messages:

    -   `"No files uploaded"` - Request contained no files
    -   `"Chat not found"` - Specified chat UUID doesn't exist or doesn't belong to user
    -   `"Only docx or pdf files are allowed!"` - Invalid file format detected
    -   `"File too large"` - One or more files exceed 3MB limit
    -   `"message must be a string"` - Invalid message field type

-   `401 Unauthorized` - Missing or invalid access token

    ```json
    {
    	"statusCode": 401,
    	"message": "Unauthorized",
    	"error": "Unauthorized"
    }
    ```

-   `413 Payload Too Large` - File size exceeds limit
    ```json
    {
    	"statusCode": 413,
    	"message": "File too large",
    	"error": "Payload Too Large"
    }
    ```

**Behavior Notes:**

-   **New Chat Creation (`chatId = "new"`)**:
    -   Creates a new chat owned by the authenticated user
    -   If `message` field provided: first 16 characters become chat title
    -   If no `message`: a default title is generated
    -   Returns the new chat ID in response
-   **Existing Chat (`chatId = UUID`)**:
    -   Must belong to the authenticated user
    -   Checks remaining upload slots before processing
    -   If chat already has 5 documents, all uploads will fail
-   **File Processing**:
    -   Files are uploaded to OpenAI's file storage
    -   Added to the chat's vector store for semantic search
    -   Vector store enables AI to search through document content
    -   Processing is asynchronous but response waits for completion
-   **Slot Management**:
    -   Each chat has exactly 5 upload slots
    -   Slots are consumed by successful uploads
    -   Failed uploads don't consume slots
    -   `remainingSlots` in response shows available capacity
-   **Partial Uploads**:
    -   If attempting to upload more files than slots available, first N files succeed
    -   Remaining files are marked as failed with reason "No remaining upload slots"
    -   Response still returns 200 status with partial success details

**cURL Example:**

```bash
curl -X POST "http://localhost:3000/api/v1/chats/new/upload-document" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "files=@document1.pdf" \
  -F "files=@document2.docx" \
  -F "message=Research papers"
```

---

#### 6. Remove Document

**Endpoint:** `DELETE /chats/:chatId/remove-document`  
**Authentication:** Required (Access token)  
**Description:** Removes a document from a chat and cleans up all associated resources including vector embeddings and cloud storage.

**URL Parameters:**

-   `chatId` - The UUID of the chat

**Request Body:**

```json
{
	"documentId": "doc-uuid-to-remove"
}
```

**Success Response (200):**

```json
{
	"message": "Document removed successfully"
}
```

**Error Responses:**

-   `400 Bad Request` - Chat not found or document not found in chat
    ```json
    {
    	"statusCode": 400,
    	"message": "Chat not found",
    	"error": "Bad Request"
    }
    ```
    or
    ```json
    {
    	"statusCode": 400,
    	"message": "Document not found in this chat",
    	"error": "Bad Request"
    }
    ```
-   `401 Unauthorized` - Missing or invalid access token
-   `500 Internal Server Error` - Error during deletion process

**Cleanup Process:**

-   Deletes all document chunks from ChromaDB vector store
-   Deletes the file from S3/Cloudflare R2 cloud storage
-   Removes document metadata from database

**Notes:**

-   Only the chat owner can remove documents from their chats
-   Document must exist in the specified chat
-   All associated data (embeddings, file, metadata) is permanently deleted
-   This action is irreversible

---

#### 7. Update Message Feedback

**Endpoint:** `PATCH /chats/:chatId/messages/:messageId/feedback`  
**Authentication:** Required (Access token)  
**Description:** Updates the helpful status of a specific message in a chat. Allows users to mark messages as helpful or not helpful after they've been sent.

**URL Parameters:**

-   `chatId` - The UUID of the chat
-   `messageId` - The UUID of the message

**Request Body:**

```json
{
	"helpful": true
}
```

**Request Fields:**

-   **`helpful`** (boolean, required): Whether the message was helpful (true/false)

**Success Response (200):**

```json
{
	"message": "Feedback updated successfully",
	"messageId": "123e4567-e89b-12d3-a456-426614174001",
	"helpful": true
}
```

**Response Fields:**

-   **`message`** (string): Confirmation message
-   **`messageId`** (string): UUID of the updated message
-   **`helpful`** (boolean): Updated helpful status

**Error Responses:**

-   `400 Bad Request` - Chat not found or message not found in chat
    ```json
    {
    	"statusCode": 400,
    	"message": "Chat not found",
    	"error": "Bad Request"
    }
    ```
    or
    ```json
    {
    	"statusCode": 400,
    	"message": "Message not found in this chat",
    	"error": "Bad Request"
    }
    ```
-   `401 Unauthorized` - Missing or invalid access token

**Usage Notes:**

-   Only the chat owner can update feedback for messages in their chats
-   Message must exist in the specified chat
-   Can be called multiple times to update the feedback status
-   Useful for collecting user feedback on AI responses

**cURL Example:**

```bash
curl -X PATCH "http://localhost:3000/api/v1/chats/123e4567-e89b-12d3-a456-426614174000/messages/123e4567-e89b-12d3-a456-426614174001/feedback" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"helpful": true}'
```

---

#### 8. Get Signed URL for Document Download

**Endpoint:** `GET /chats/:chatId/documents/:documentId/sign`  
**Authentication:** Required (Access token)  
**Description:** Generates a temporary signed URL to download a document from a chat. The URL expires after 1 day (86400 seconds).

**URL Parameters:**

-   `chatId` - The UUID of the chat
-   `documentId` - The UUID of the document

**Success Response (200):**

```json
{
	"message": "Signed URL generated successfully",
	"data": {
		"signedUrl": "https://s3.tebi.io/bucket/key?signature=...",
		"fileName": "document.pdf",
		"expiresIn": 86400
	}
}
```

**Response Fields:**

-   **`message`** (string): Confirmation message
-   **`data`** (object): Contains the signed URL and metadata
    -   **`signedUrl`** (string): Temporary S3 URL for downloading the document
    -   **`fileName`** (string): Original filename of the document
    -   **`expiresIn`** (number): Time in seconds until URL expires (86400 = 1 day)

**Error Responses:**

-   `400 Bad Request` - Chat not found or document not found in chat
    ```json
    {
    	"statusCode": 400,
    	"message": "Chat not found",
    	"error": "Bad Request"
    }
    ```
    or
    ```json
    {
    	"statusCode": 400,
    	"message": "Document not found in this chat",
    	"error": "Bad Request"
    }
    ```
-   `401 Unauthorized` - Missing or invalid access token
    ```json
    {
    	"statusCode": 401,
    	"message": "Unauthorized",
    	"error": "Unauthorized"
    }
    ```

**Usage Notes:**

-   Only the chat owner can generate signed URLs for documents in their chats
-   Document must exist in the specified chat
-   Generated URL is valid for 1 day (86400 seconds)
-   URL can be used to directly download the file from S3 storage
-   After expiration, a new signed URL must be requested
-   Useful for on-demand document downloads without exposing permanent S3 URLs
-   Frontend should call this endpoint when user clicks "download" on a document

**cURL Example:**

```bash
curl -X GET "http://localhost:3000/api/v1/chats/123e4567-e89b-12d3-a456-426614174000/documents/doc-123e4567-e89b-12d3-a456-426614174001/sign" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Security Notes:**

-   Signed URLs are temporary and expire automatically
-   Each request generates a unique signed URL
-   URLs cannot be reused after expiration
-   Only authorized users can generate signed URLs for their documents

---

#### 9. Delete Chat

**Endpoint:** `DELETE /chats/:chatId/delete`  
**Authentication:** Required (Access token)  
**Description:** Permanently deletes a chat and all associated messages and documents.

**URL Parameters:**

-   `chatId` - The UUID of the chat to delete

**Success Response (204):**
No content returned on successful deletion.

**Error Responses:**

-   `400 Bad Request` - Chat not found
-   `401 Unauthorized` - Missing or invalid access token

**Notes:**

-   Cascades to delete all messages and documents
-   Only chat owner can delete their chats
-   This action is irreversible

---

## Error Handling

### Standard Error Response Format

All error responses follow this structure:

```json
{
	"statusCode": 400,
	"message": "Error description",
	"error": "Error Type"
}
```

### Common HTTP Status Codes

| Status Code | Description                                      |
| ----------- | ------------------------------------------------ |
| 200         | Success - Request completed successfully         |
| 204         | No Content - Success with no response body       |
| 400         | Bad Request - Invalid input or validation error  |
| 401         | Unauthorized - Missing or invalid authentication |
| 403         | Forbidden - Insufficient permissions             |
| 409         | Conflict - Resource already exists               |
| 413         | Payload Too Large - File size exceeds limit      |
| 500         | Internal Server Error - Server-side error        |

### Common Error Messages

**Authentication Errors:**

-   `"Invalid token"` - Token is malformed or invalid
-   `"Token has expired"` - Token is no longer valid
-   `"Token already used"` - Single-use token already consumed
-   `"Access denied"` - Insufficient permissions

**Validation Errors:**

-   `"Validation failed"` - Input validation error
-   `"email must be a valid email address"` - Invalid email format
-   `"At least one field must be provided"` - Missing required fields
-   `"File too large"` - File exceeds size limit
-   `"Only docx or pdf files are allowed!"` - Invalid file type

**Resource Errors:**

-   `"User not found"` - User doesn't exist
-   `"Chat not found"` - Chat doesn't exist or doesn't belong to user
-   `"Document not found in this chat"` - Document doesn't exist in chat

---

## Data Models

### User Object

```typescript
{
  id: string;                    // UUID
  email: string;                 // User email address
  firstName: string;             // User first name
  lastName: string;              // User last name
  role: "user" | "admin";        // User role
  educationLevel?: string;       // Education level (optional)
  preferences?: string[];        // User preferences (optional)
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### Chat Object

```typescript
{
	id: string; // UUID
	title: string; // Chat title (first 16 chars of first message)
	userId: string; // Owner UUID
	createdAt: string; // ISO 8601 timestamp
	updatedAt: string; // ISO 8601 timestamp
}
```

### Message Object

```typescript
{
	id: string; // UUID
	chatId: string; // Parent chat UUID
	role: 'user' | 'assistant'; // Message sender
	content: string; // Message text
	tokens: number; // Token count
	createdAt: string; // ISO 8601 timestamp
}
```

### Document Object

```typescript
{
	id: string; // UUID
	chatId: string; // Parent chat UUID
	filename: string; // Original filename
	fileId: string; // OpenAI file ID
	vectorStoreId: string; // OpenAI vector store ID
	uploadedAt: string; // ISO 8601 timestamp
}
```

### Auth Provider Types

```typescript
type AuthProvider = 'email' | 'google';
```

### Role Types

```typescript
type Role = 'user' | 'admin';
```

---

## Best Practices

### 1. Token Management

-   Store tokens securely (e.g., httpOnly cookies or secure storage)
-   Implement token refresh logic before access token expires
-   Clear tokens on logout
-   Handle 401 errors by refreshing or re-authenticating

### 2. Error Handling

-   Always check response status codes
-   Display user-friendly error messages
-   Log detailed errors for debugging
-   Implement retry logic for network errors

### 3. File Uploads

-   Validate file size and type on frontend before upload
-   Show upload progress to users
-   Handle upload failures gracefully
-   Inform users of file limits (10MB, PDF/DOCX only)

### 4. Chat Management

-   Poll or use websockets for real-time updates (if implemented)
-   Cache chat lists to reduce API calls
-   Implement optimistic UI updates for better UX
-   Handle "new" chatId properly when creating chats

### 5. API Rate Limiting

-   Implement debouncing for search/filter operations
-   Cache responses where appropriate
-   Batch requests when possible
-   Handle 429 (Too Many Requests) if rate limiting is implemented

---

## Environment & Configuration

### Base URL

```
Development: http://localhost:<PORT>/api/v1
Production: https://your-domain.com/api/v1
```

### Required Headers

**For JSON requests:**

```
Content-Type: application/json
```

**For authenticated requests:**

```
Authorization: Bearer <access_token>
```

**For file uploads:**

```
Content-Type: multipart/form-data
```

---

## Support & Contact

For API issues or questions:

-   **Author:** Oluwatamilore Olugbesan
-   **Repository:** Lernen-backend

---

**Last Updated:** November 14, 2025  
**API Version:** 1.0.0
