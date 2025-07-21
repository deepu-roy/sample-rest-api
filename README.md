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

## Recent Improvements

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

## API Documentation

Once the API server is running, you can access the Swagger documentation at:
`http://localhost:3000/api-docs`

## Database

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
- User CRUD operation tests
- Pagination tests
- Error handling tests

## Available Endpoints

### Users

- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Health Check

- `GET /health` - Check API health status

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
