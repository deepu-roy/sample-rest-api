// Type definitions for the frontend

export interface EnvConfig {
    API_HOST: string;
    API_PORT: string;
}

export interface ApiConfig {
    host: string;
    port: string;
    readonly baseUrl: string;
    readonly url: string;
}

export interface Endpoints {
    users: string;
    roles: string;
    health: string;
}

export interface Config {
    api: ApiConfig;
    endpoints: Endpoints;
    readonly apiUrl: string;
}

export interface Role {
    id: number;
    name: string;
    description: string | null;
    is_active: number;
    created_at: string;
}

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
    job: string | null;
    role_id: number;
    role: Role | null;
}

export interface PaginatedUsersResponse {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    data: User[];
}

export interface RolesResponse {
    data: Role[];
}

export interface SingleUserResponse {
    data: User;
}

export interface SingleRoleResponse {
    data: Role;
}

export interface HealthResponse {
    status: string;
    timestamp: string;
}

export interface CreateUserResponse {
    name: string;
    job: string;
    id: number;
    createdAt: string;
}

export interface UpdateUserResponse {
    name: string;
    job: string | null;
    role_id?: number;
    updatedAt: string;
}

// Extend Window to include _env_
declare global {
    interface Window {
        _env_?: EnvConfig;
        closeDeactivateModal?: () => void;
    }
}
