const config = {
  api: {
    port: process.env.API_PORT || 3000,
    host: process.env.API_HOST || "0.0.0.0", // Use 0.0.0.0 for container compatibility
    get baseUrl() {
      const displayHost = this.host === "0.0.0.0" ? "localhost" : this.host;
      return `http://${displayHost}:${this.port}`;
    },
  },
  database: {
    path: process.env.DB_PATH || "./db",
    filename: "database.sqlite",
    get fullPath() {
      return `${this.path}/${this.filename}`;
    },
  },
  cors: {
    // In development, allow frontend origin. In production, use CORS_ORIGINS env var
    get origins() {
      if (process.env.CORS_ORIGINS) {
        return process.env.CORS_ORIGINS.split(",");
      }
      // Default development configuration
      return ["http://localhost:5000", "http://127.0.0.1:5000"];
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
};

module.exports = config;
