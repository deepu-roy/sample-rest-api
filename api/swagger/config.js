const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");
const config = require(path.join(__dirname, "../config"));

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ReqRes API",
      version: "1.0.0",
      description:
        "A simple implementation of the ReqRes API using Node.js, Express, and SQLite",
    },
    servers: [
      {
        url: config.api.baseUrl,
        description: "API Server",
      },
    ],
  },
  apis: [path.join(__dirname, "../routes/*.js")],
};

module.exports = swaggerJsdoc(options);
