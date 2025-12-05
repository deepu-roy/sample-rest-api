import { Request, Response, NextFunction } from 'express';

// Database types
export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
    job: string | null;
    role_id: number;
}

export interface UserWithRole extends User {
    role: Role | null;
    role_name?: string;
    role_description?: string;
    role_is_active?: number;
}

export interface Role {
    id: number;
    name: string;
    description: string | null;
    is_active: number;
    created_at: string;
}

// API Response types
export interface PaginatedResponse<T> {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    data: T[];
}

export interface SingleResponse<T> {
    data: T;
}

export interface MessageResponse {
    message: string;
    data?: unknown;
}

export interface ErrorResponse {
    error: string;
}

// Request types
export interface CreateUserRequest {
    name: string;
    job?: string;
    role_id?: number;
    email?: string;
}

export interface UpdateUserRequest {
    name?: string;
    job?: string;
    role_id?: number;
    email?: string;
}

export interface CreateRoleRequest {
    name: string;
    description?: string;
}

export interface UpdateRoleRequest {
    name?: string;
    description?: string;
}

// Express extended types
export interface TypedRequest<T = unknown> extends Request {
    body: T;
}

export interface TypedRequestQuery<T = unknown> extends Request {
    query: T & Request['query'];
}

// Query parameter types
export interface UserQueryParams {
    page?: string;
    per_page?: string;
    role?: string;
}

export interface RoleQueryParams {
    all?: string;
}

// Database row types (as returned by sqlite3)
export interface UserRow {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
    job: string | null;
    role_id: number;
    role_name?: string;
    role_description?: string;
    role_is_active?: number;
}

export interface RoleRow {
    id: number;
    name: string;
    description: string | null;
    is_active: number;
    created_at: string;
}

export interface CountRow {
    count: number;
    total?: number;
}

export interface TableInfoRow {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: unknown;
    pk: number;
}

// Config types
export interface ApiConfig {
    port: number | string;
    host: string;
    readonly baseUrl: string;
}

export interface DatabaseConfig {
    path: string;
    filename: string;
    readonly fullPath: string;
}

export interface CorsConfig {
    readonly origins: string | string[];
    methods: string[];
    allowedHeaders: string[];
}

export interface AppConfig {
    api: ApiConfig;
    database: DatabaseConfig;
    cors: CorsConfig;
}

// Middleware types
export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
