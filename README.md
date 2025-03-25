# ReqRes API Implementation

A simple implementation of the ReqRes API using Node.js, Express, and SQLite.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Database Setup

The application will automatically create and initialize the SQLite database when you first run the server.

## Running the Application

Start the server:

```bash
npm start
```

The server will start on `http://localhost:3000`

## Available Endpoints

### Users

- GET /api/users - List all users
- POST /api/users - Create a new user
- GET /api/users/{id} - Get user by ID
- PUT /api/users/{id} - Update user
- DELETE /api/users/{id} - Delete user

## API Documentation

The API is implemented according to the OpenAPI 3.0.0 specification. For detailed API documentation, please refer to the OpenAPI specification file.
