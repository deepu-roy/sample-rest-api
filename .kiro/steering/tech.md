# Technology Stack

## Backend (API)

- **Runtime**: Node.js v18+
- **Framework**: Express.js v4.18+
- **Database**: SQLite3 v5.1+ with native bindings
- **Documentation**: Swagger UI Express + Swagger JSDoc
- **Testing**: Jest v29+ with Supertest for API testing
- **CORS**: Configured for cross-origin requests
- **Body Parsing**: Express body-parser middleware

## Frontend

- **Type**: Static HTML/CSS/JavaScript
- **Server**: http-server for local development
- **Styling**: Custom CSS with responsive design
- **Architecture**: Vanilla JavaScript with modular structure

## Infrastructure

- **Containerization**: Docker with multi-container setup
- **Orchestration**: Docker Compose v3.8
- **Web Server**: Nginx (Alpine) for frontend serving
- **Database Storage**: Docker volumes for SQLite persistence
- **Health Checks**: Built-in container health monitoring

## Development Tools

- **Hot Reload**: Nodemon for API development
- **Package Manager**: npm (primary), yarn (frontend)
- **Testing**: Jest with watch mode support
- **Linting**: Standard JavaScript practices

## Common Commands

### Docker Operations (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up --build

# Stop services
docker-compose down

# Run tests in container
docker exec sample-rest-api-api-1 npm test
```

### Local Development

```bash
# Install all dependencies
npm run install:all

# Start API only
npm run start:api

# Start frontend only
npm run start:frontend

# Start both (parallel)
npm run dev

# Run tests
cd api && npm test

# Watch mode testing
cd api && npm run test:watch
```

### Database Management

- SQLite database auto-initializes on first run
- Seeded with default roles and sample users
- Located at `api/db/database.sqlite` (local) or `/app/db` (Docker)
- Persisted via Docker volumes in containerized setup
