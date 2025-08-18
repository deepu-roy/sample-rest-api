# Design Document

## Overview

The user role assignment feature will extend the existing user management system to support role-based functionality. The design integrates with the current SQLite database, Express.js API, and Bootstrap frontend while maintaining backward compatibility and following existing patterns.

The system will support predefined roles with the ability to assign roles during user creation and modify them afterward. The implementation will use a normalized database approach with a separate roles table and role assignments linked to users.

## Architecture

### Database Layer

- **Roles Table**: Stores available roles with metadata
- **User-Role Relationship**: Extends existing users table with role_id foreign key
- **Migration Strategy**: Backward-compatible schema updates with default role assignment

### API Layer

- **Extended User Endpoints**: Modify existing CRUD operations to handle role data
- **Role Management Endpoints**: New endpoints for role operations
- **Validation Layer**: Role existence and permission validation

### Frontend Layer

- **Enhanced User Forms**: Add role selection to create/edit user interfaces
- **Role Display**: Show role information in user listings and details
- **Dynamic Role Loading**: Fetch available roles from API

## Components and Interfaces

### Database Schema

```sql
-- New roles table
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Modify existing users table
ALTER TABLE users ADD COLUMN role_id INTEGER DEFAULT 1;
ALTER TABLE users ADD CONSTRAINT fk_user_role
  FOREIGN KEY (role_id) REFERENCES roles(id);
```

### API Endpoints

#### Extended User Endpoints

- `GET /api/users` - Include role information in response
- `GET /api/users/:id` - Include role details
- `POST /api/users` - Accept role_id in request body
- `PUT /api/users/:id` - Allow role_id updates

#### New Role Endpoints

- `GET /api/roles` - List all active roles
- `GET /api/roles/:id` - Get specific role details
- `POST /api/roles` - Create new role
- `PUT /api/roles/:id` - Update existing role
- `DELETE /api/roles/:id` - Deactivate role (soft delete)

### Data Models

#### Role Model

```javascript
{
  id: number,
  name: string,
  description: string,
  is_active: boolean,
  created_at: string
}
```

#### Extended User Model

```javascript
{
  id: number,
  email: string,
  first_name: string,
  last_name: string,
  avatar: string,
  job: string,
  role_id: number,
  role: {
    id: number,
    name: string,
    description: string
  }
}
```

### Frontend Components

#### Role Selection Component

- Dropdown/select interface for role selection
- Dynamic loading of available roles
- Default role pre-selection

#### User Display Enhancement

- Role badge/label in user cards
- Role information in user details
- Role-based styling (optional)

#### Role Management Interface

- Dedicated role management page (roles.html)
- Role listing table with edit/deactivate actions
- Role creation form with validation
- Role editing modal or inline editing
- Confirmation dialogs for destructive actions

## Error Handling

### Database Level

- Foreign key constraint violations
- Role existence validation
- Transaction rollback on failures

### API Level

- HTTP 400 for invalid role assignments
- HTTP 404 for non-existent roles
- HTTP 500 for database errors
- Detailed error messages in response body

### Frontend Level

- Form validation for role selection
- Error message display for failed operations
- Graceful degradation if roles API is unavailable

## Testing Strategy

### Database Testing

- Schema migration tests
- Foreign key constraint validation
- Default role assignment verification

### API Testing

- Extended user CRUD operations with roles
- Role endpoint functionality
- Error handling scenarios
- Swagger documentation updates

### Frontend Testing

- Role selection form functionality
- User creation with role assignment
- Role display in user interfaces
- Role management interface functionality
- Role creation and editing workflows
- Error handling and user feedback

### Integration Testing

- End-to-end user creation with role assignment
- Role modification workflows
- Database consistency validation

## Implementation Considerations

### Default Roles

The system will initialize with these default roles:

- **User** (id: 1) - Default role for new users
- **Admin** (id: 2) - Administrative privileges
- **Moderator** (id: 3) - Limited administrative access

### Backward Compatibility

- Existing users will be assigned the default "User" role
- Current API responses remain valid with additional role fields
- Frontend gracefully handles missing role data

### Performance

- Role data cached in memory for frequent access
- Efficient JOIN queries for user-role relationships
- Minimal additional database queries

### Security

- Role validation on all user operations
- Audit logging for role changes
- Input sanitization for role-related data
