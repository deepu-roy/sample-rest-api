import { AppConfig } from '../types';

const config: AppConfig = {
    api: {
        port: process.env.API_PORT || 3000,
        host: process.env.API_HOST || '0.0.0.0',
        get baseUrl(): string {
            const displayHost = this.host === '0.0.0.0' ? 'localhost' : this.host;
            return `http://${displayHost}:${this.port}`;
        },
    },
    database: {
        path: process.env.DB_PATH || './db',
        filename: 'database.sqlite',
        get fullPath(): string {
            return `${this.path}/${this.filename}`;
        },
    },
    cors: {
        get origins(): string | string[] {
            if (process.env.CORS_ORIGINS) {
                return process.env.CORS_ORIGINS.split(',');
            }
            return '*';
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
};

export default config;
