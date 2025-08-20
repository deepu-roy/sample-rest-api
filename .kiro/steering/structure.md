# Project Structure

## Root Level Organization

```text
sample-rest-api/
├── api/                    # Backend Express.js application
├── frontend/               # Static frontend application
├── docker-compose.yml      # Multi-container orchestration
├── package.json           # Root package with workspace scripts
└── database.sqlite        # SQLite database (local development)
```

## API Directory (`/api`)

```text
api/
├── server.js              # Main application entry point
├── package.json           # Backend dependencies and scripts
├── Dockerfile             # API container configuration
├── .dockerignore          # Docker build exclusions
├── config/                # Application configuration
├── db/                    # Database setup and initialization
├── routes/                # Express route handlers
│   ├── users.js           # User CRUD operations with roles
│   ├── roles.js           # Role management endpoints
│   └── health.js          # Health check endpoint
├── swagger/               # API documentation configuration
└── tests/                 # Jest test suites
    ├── setup.js           # Test environment setup
    ├── roles.test.js      # Role management tests
    └── frontend-validation.test.js # Frontend integration tests
```

## Frontend Directory (`/frontend`)

```text
frontend/
├── index.html             # Main application page
├── create-user.html       # User creation form
├── edit-user.html         # User editing interface
├── roles.html             # Role management page
├── app.js                 # Main application logic
├── create-user.js         # User creation functionality
├── package.json           # Frontend dependencies
├── Dockerfile             # Frontend container configuration
├── nginx.conf             # Nginx server configuration
├── docker-entrypoint.sh   # Container startup script
├── css/                   # Stylesheets and themes
└── js/                    # Modular JavaScript components
```

## Key Architectural Patterns

### API Structure

- **Route-based organization**: Each entity (users, roles) has dedicated route files
- **Middleware chain**: CORS → Body Parser → Routes → Error Handling
- **Database abstraction**: Centralized database initialization and connection
- **Swagger integration**: Auto-generated documentation from JSDoc comments

### Frontend Architecture

- **Page-based routing**: Separate HTML files for different views
- **Modular JavaScript**: Feature-specific JS files for each page
- **Shared components**: Common utilities in `/js` directory
- **Responsive design**: CSS organized by component and layout

### Database Schema

- **users table**: Core user data with role foreign key relationship
- **roles table**: Role definitions with metadata (name, description, status)
- **Relational integrity**: Proper foreign key constraints between users and roles

### Container Architecture

- **API container**: Node.js Alpine with SQLite3 native compilation
- **Frontend container**: Nginx Alpine serving static files with API proxy
- **Volume persistence**: SQLite database persisted across container restarts
- **Health monitoring**: Container-level health checks for both services

## File Naming Conventions

- **Kebab-case**: For HTML files and directories (`create-user.html`)
- **camelCase**: For JavaScript files and functions (`createUser.js`)
- **lowercase**: For route files and database-related files (`users.js`)
- **UPPERCASE**: For environment and Docker files (`Dockerfile`, `.env`)
