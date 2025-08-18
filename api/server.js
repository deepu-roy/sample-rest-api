const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

// Import configuration
const config = require("./config");
const { initializeDatabase } = require("./db/init");

// Import routes
const usersRouter = require("./routes/users");
const rolesRouter = require("./routes/roles");
const healthRouter = require("./routes/health");
const swaggerDocs = require("./swagger/config");

const app = express();

// Middleware
app.use(
  cors({
    origin: config.cors.origins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(bodyParser.json());

// Serve raw Swagger JSON
app.get("/api-docs/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerDocs);
});

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerDocs));

// Initialize database
initializeDatabase();

// Routes
app.use("/api/users", usersRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/health", healthRouter);

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(config.api.port, config.api.host, () => {
    console.log(`Server is running on ${config.api.baseUrl}`);
    console.log(
      `Swagger documentation available at ${config.api.baseUrl}/api-docs`
    );
    console.log(`Allowing CORS for origins:`, config.cors.origins);
  });
}

// Export the app for testing
module.exports = app;
