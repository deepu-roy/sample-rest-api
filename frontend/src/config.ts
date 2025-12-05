import { Config, EnvConfig } from './types/index.js';

// Runtime configuration that can be injected
const defaultEnv: EnvConfig = {
    API_HOST: 'localhost',
    API_PORT: '3000',
};

const envConfig: EnvConfig = window._env_ || defaultEnv;

const config: Config = {
    api: {
        // Use window._env_ for runtime configuration
        host: envConfig.API_HOST,
        port: envConfig.API_PORT,
        get baseUrl(): string {
            return `http://${this.host}:${this.port}`;
        },
        get url(): string {
            return `${this.baseUrl}/api`;
        },
    },
    endpoints: {
        users: '/users',
        roles: '/roles',
        health: '/health',
    },
    get apiUrl(): string {
        return this.api.url; // For backward compatibility
    },
};

export default config;
