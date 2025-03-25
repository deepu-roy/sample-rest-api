const request = require("supertest");
const express = require("express");
const { db, initializeDatabase } = require("../db/init");

// Import the express app
const app = require("../server");

describe("API Endpoints", () => {
  beforeAll(async () => {
    // Initialize the test database
    await initializeDatabase();
  });

  afterAll(async () => {
    // Close the database connection
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        resolve();
      });
    });
  });

  describe("Health Check", () => {
    it("should return healthy status", async () => {
      const res = await request(app).get("/api/health").expect(200);

      expect(res.body).toHaveProperty("status", "healthy");
      expect(res.body).toHaveProperty("timestamp");
    });
  });

  describe("Users API", () => {
    let createdUserId;

    it("should list users with pagination", async () => {
      const res = await request(app)
        .get("/api/users?page=1&per_page=2")
        .expect(200);

      expect(res.body).toHaveProperty("page", 1);
      expect(res.body).toHaveProperty("per_page", 2);
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    it("should create a new user", async () => {
      const userData = {
        name: "John Doe",
        job: "Software Engineer",
      };

      const res = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty("name", userData.name);
      expect(res.body).toHaveProperty("job", userData.job);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("createdAt");

      createdUserId = res.body.id;
    });

    it("should get a user by ID", async () => {
      const res = await request(app)
        .get(`/api/users/${createdUserId}`)
        .expect(200);

      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("id", createdUserId);
    });

    it("should update a user", async () => {
      const updateData = {
        name: "John Updated",
        job: "Senior Engineer",
      };

      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty("name", updateData.name);
      expect(res.body).toHaveProperty("job", updateData.job);
      expect(res.body).toHaveProperty("updatedAt");
    });

    it("should delete a user", async () => {
      await request(app).delete(`/api/users/${createdUserId}`).expect(204);

      // Verify user is deleted
      await request(app).get(`/api/users/${createdUserId}`).expect(404);
    });

    it("should handle non-existent user", async () => {
      await request(app).get("/api/users/999999").expect(404);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid user creation data", async () => {
      const invalidData = {
        // Missing required fields
      };

      await request(app).post("/api/users").send(invalidData).expect(400);
    });

    it("should handle invalid update data", async () => {
      const invalidData = {
        // Empty update
      };

      await request(app).put("/api/users/1").send(invalidData).expect(400);
    });
  });
});
