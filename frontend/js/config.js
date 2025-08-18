// Runtime configuration that can be injected
window._env_ = window._env_ || {
  API_HOST: "localhost",
  API_PORT: "3000",
};

const config = {
  api: {
    // Use window._env_ for runtime configuration
    host: window._env_.API_HOST,
    port: window._env_.API_PORT,
    get baseUrl() {
      return `http://${this.host}:${this.port}`;
    },
    get url() {
      return `${this.baseUrl}/api`;
    },
  },
  endpoints: {
    users: "/users",
    roles: "/roles",
    health: "/health",
  },
  get apiUrl() {
    return this.api.url; // For backward compatibility
  },
};

export default config;
