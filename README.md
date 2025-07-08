# ReqRes API Implementation

A simple implementation of the ReqRes API using Node.js, Express, and SQLite, with a separate frontend application.

## Project Structure

The project is organized into two main components:

```
sample-rest-api/
├── api/                # Backend API
│   ├── routes/        # API route handlers
│   ├── swagger/       # API documentation
│   ├── tests/         # API tests
│   ├── db/           # Database setup and initialization
│   ├── package.json  # API dependencies
│   └── server.js     # API entry point
│
└── frontend/          # Frontend application
    ├── css/          # Stylesheets
    ├── js/           # JavaScript files
    ├── index.html    # Main page
    └── package.json  # Frontend dependencies
```

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation and Setup

### API Setup

```bash
cd api
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Applications

### Start the API Server

```bash
cd api
npm start      # Regular mode
npm run dev    # Development mode with auto-reload
```

The API server will start on `http://localhost:3000`

### Start the Frontend

```bash
cd frontend
npm start
```

The frontend will be available at `http://localhost:5000`

## API Documentation

Once the API server is running, you can access the Swagger documentation at:
`http://localhost:3000/api-docs`

## Database

The SQLite database will be automatically created and initialized in the `api/db` directory when you first run the API server.

## Running Tests

The API includes a comprehensive test suite:

```bash
cd api
npm test          # Run tests once
npm run test:watch # Run tests in watch mode
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
