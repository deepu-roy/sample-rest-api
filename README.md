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

## Running Tests

The project includes a comprehensive test suite that covers all API endpoints. To run the tests:

```bash
# Run tests once
npm test

# Run tests in watch mode (useful during development)
npm run test:watch
```

The test suite includes:

- Health check endpoint tests
- User CRUD operation tests
- Pagination tests
- Error handling tests

## Available Endpoints

### Users

- GET /api/users - List all users
- POST /api/users - Create a new user
- GET /api/users/{id} - Get user by ID
- PUT /api/users/{id} - Update user
- DELETE /api/users/{id} - Delete user

### Health Check

- GET /health - Check API health status

## API Documentation

The API is implemented according to the OpenAPI 3.0.0 specification. You can access the API documentation in two ways:

1. Interactive Swagger UI:

```
http://localhost:3000/api-docs
```

2. Raw OpenAPI/Swagger JSON specification:

```
http://localhost:3000/api-docs.json
```

The Swagger UI provides an interactive interface for testing the API endpoints, while the JSON specification can be used with other OpenAPI tools or for programmatic access to the API documentation.
