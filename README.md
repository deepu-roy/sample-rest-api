# ReqRes API Implementation

A simple implementation of the ReqRes API using Node.js, Express, and SQLite, with a separate frontend application.

## Project Structure

The project is organized into two main components:

```
sample-rest-api/
├── docker-compose.yml # Docker Compose configuration
├── api/                # Backend API
│   ├── Dockerfile     # API Docker configuration
│   ├── .dockerignore  # Docker ignore file
│   ├── routes/        # API route handlers
│   ├── swagger/       # API documentation
│   ├── tests/         # API tests
│   ├── db/           # Database setup and initialization
│   ├── package.json  # API dependencies
│   └── server.js     # API entry point
│
└── frontend/          # Frontend application
    ├── Dockerfile     # Frontend Docker configuration
    ├── docker-entrypoint.sh # Frontend startup script
    ├── nginx.conf     # Nginx configuration
    ├── css/          # Stylesheets
    ├── js/           # JavaScript files
    ├── index.html    # Main page
    └── package.json  # Frontend dependencies
```

## Prerequisites

### For Docker (Recommended)

- Docker
- Docker Compose

### For Local Development

- Node.js (v18 or higher)
- npm (Node Package Manager)

## Quick Start with Docker Compose

The easiest way to run the entire application is using Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd sample-rest-api

# Start all services
docker-compose up -d

# View logs (optional)
docker-compose logs -f

# Stop all services
docker-compose down
```

After running `docker-compose up -d`, the services will be available at:

- **API**: <http://localhost:3000>
- **Frontend**: <http://localhost:5000>
- **API Documentation**: <http://localhost:3000/api-docs>

### Docker Compose Commands

```bash
# Start services in background
docker-compose up -d

# Start services with logs visible
docker-compose up

# Stop services
docker-compose down

# View logs for all services
docker-compose logs

# View logs for specific service
docker-compose logs api
docker-compose logs frontend

# Rebuild and start services
docker-compose up --build

# Remove containers and networks
docker-compose down --volumes

# Check service status
docker-compose ps
```

### Docker Architecture

The application uses a multi-container Docker setup:

- **API Container**: Runs the Node.js/Express API server

  - Built from `node:18-alpine` base image
  - Includes SQLite3 native bindings compiled for Alpine Linux
  - Exposes port 3000
  - Persists SQLite database using Docker volumes

- **Frontend Container**: Runs the frontend using Nginx
  - Built from `nginx:alpine` base image
  - Serves static files and proxies API requests
  - Exposes port 5000 (mapped to internal port 80)
  - Environment variables configure API connection

### Troubleshooting Docker Setup

If you encounter issues:

```bash
# Rebuild containers from scratch
docker-compose down --volumes
docker-compose build --no-cache
docker-compose up -d

# Check container logs
docker-compose logs api
docker-compose logs frontend

# Verify containers are running
docker-compose ps

# Access container shell for debugging
docker exec -it sample-rest-api-api-1 sh
docker exec -it sample-rest-api-frontend-1 sh
```

## Local Development Setup

If you prefer to run the application locally without Docker:

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

## Features

### Role-Based User Management

The application now includes comprehensive role-based user management:

- **Three Default Roles**: User, Admin, and Moderator
- **Role Assignment**: Users can be assigned roles during creation and editing
- **Role Filtering**: Filter users by role in the user list
- **Role Display**: User roles are displayed with color-coded badges in the interface
- **Role Validation**: API validates role assignments and prevents invalid role IDs

### User Interface Enhancements

- **Enhanced User Grid**: Displays user roles with styled badges
- **Create User Form**: Includes role selection dropdown
- **Edit User Form**: Allows role changes with confirmation prompts
- **Role Change Warnings**: Visual indicators when changing user roles
- **Error Handling**: Comprehensive error messages for role-related operations

### API Improvements

- **Role Endpoints**: Full CRUD operations for role management
- **User-Role Relationships**: Proper foreign key relationships in the database
- **Role Filtering**: Query users by role ID with pagination support
- **Audit Logging**: Role changes are logged for audit purposes
- **Data Validation**: Comprehensive validation for role assignments

## Recent Improvements

### Role Management System

Added comprehensive role-based access control:

- Database schema updated with roles table and user-role relationships
- Role assignment and validation in user creation/update operations
- Frontend interfaces for role selection and management
- Role filtering capabilities in user listings

### SQLite3 Architecture Compatibility Fix

The Docker setup has been enhanced to resolve SQLite3 native binding issues:

- Added build dependencies (python3, make, g++) to the API container
- Implemented proper SQLite3 rebuilding for Alpine Linux architecture
- Added `.dockerignore` to prevent host `node_modules` conflicts
- Ensured native modules are compiled within the container environment

### Network Configuration Fix

Fixed frontend-to-API connectivity issues:

- Updated environment variables to use `localhost` instead of Docker internal hostnames
- Configured proper CORS settings for browser-based requests
- Ensured API is accessible from both Docker network and host machine

## Usage Examples

### Role Management

#### Creating a User with a Role

```bash
# Create a user with Admin role
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Admin",
    "job": "System Administrator",
    "role_id": 2
  }'
```

#### Filtering Users by Role

```bash
# Get all Admin users
curl "http://localhost:3000/api/users?role=2"

# Get all Users with pagination
curl "http://localhost:3000/api/users?role=1&page=1&per_page=5"
```

#### Updating User Role

```bash
# Change user role to Moderator
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": 3
  }'
```

#### Getting Available Roles

```bash
# List all available roles
curl http://localhost:3000/api/roles

# Get specific role details
curl http://localhost:3000/api/roles/2
```

### Frontend Features

- **User Creation**: Select roles from dropdown when creating users
- **User Editing**: Change user roles with confirmation prompts
- **Role Display**: Color-coded role badges in the user list
- **Role Filtering**: Filter users by role in the interface (coming soon)

## API Documentation

Once the API server is running, you can access the Swagger documentation at:
`http://localhost:3000/api-docs`

The documentation includes detailed information about:

- All available endpoints
- Request/response schemas
- Role management operations
- Error codes and responses

## Database

### Schema

The application uses SQLite with the following main tables:

- **users**: Stores user information with role assignments
  - `id`, `email`, `first_name`, `last_name`, `avatar`, `job`, `role_id`
- **roles**: Stores available roles
  - `id`, `name`, `description`, `is_active`, `created_at`

### Default Data

The database is automatically seeded with:

- **Default Roles**: User (ID: 1), Admin (ID: 2), Moderator (ID: 3)
- **Sample Users**: Two users with different role assignments

### Docker Setup

The SQLite database is automatically managed by Docker:

- Database files are stored in a named Docker volume (`sample-rest-api-db`)
- Data persists between container restarts
- Database is initialized automatically on first startup
- Located at `/app/db/database.sqlite` inside the API container

### Local Development

The SQLite database will be automatically created and initialized in the `api/db` directory when you first run the API server locally.

## Running Tests

The API includes a comprehensive test suite:

```bash
cd api
npm test          # Run tests once
npm run test:watch # Run tests in watch mode
```

### Running Tests in Docker

```bash
# Run tests inside the API container
docker exec sample-rest-api-api-1 npm test

# Or run tests during build (add to Dockerfile if needed)
docker-compose exec api npm test
```

The test suite includes:

- Health check endpoint tests
- User CRUD operation tests with role management
- Role management endpoint tests
- Role filtering and pagination tests
- Role validation and error handling tests
- Audit logging tests for role changes

## Available Endpoints

### Users

- `GET /api/users` - List all users (supports pagination and role filtering)
  - Query parameters:
    - `page` - Page number (default: 1)
    - `per_page` - Items per page (default: 6)
    - `role` - Filter by role ID (optional)
- `POST /api/users` - Create a new user (with role assignment)
- `GET /api/users/{id}` - Get user by ID (includes role information)
- `PUT /api/users/{id}` - Update user (supports role changes)
- `DELETE /api/users/{id}` - Delete user

### Roles

- `GET /api/roles` - List all active roles
- `GET /api/roles/{id}` - Get role by ID

### Health Check

- `GET /api/health` - Check API health status

## Environment Variables

The application supports the following environment variables:

### API Container

- `NODE_ENV` - Environment mode (production/development)
- `DB_PATH` - Database file path (default: `/app/db`)

### Frontend Container

- `API_HOST` - API server hostname (default: `localhost`)
- `API_PORT` - API server port (default: `3000`)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
