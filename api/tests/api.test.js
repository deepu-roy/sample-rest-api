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

    it("should list users with pagination and include role information", async () => {
      const res = await request(app)
        .get("/api/users?page=1&per_page=2")
        .expect(200);

      expect(res.body).toHaveProperty("page", 1);
      expect(res.body).toHaveProperty("per_page", 2);
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBeTruthy();

      // Verify role information is included
      if (res.body.data.length > 0) {
        const user = res.body.data[0];
        expect(user).toHaveProperty("role_id");
        expect(user).toHaveProperty("role");
        if (user.role) {
          expect(user.role).toHaveProperty("id");
          expect(user.role).toHaveProperty("name");
          expect(user.role).toHaveProperty("description");
        }
      }
    });

    it("should create a new user with default role", async () => {
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

      // Verify user was created with default role
      const userRes = await request(app)
        .get(`/api/users/${createdUserId}`)
        .expect(200);

      expect(userRes.body.data).toHaveProperty("role_id", 1); // Default role
    });

    it("should create a new user with specified role", async () => {
      const userData = {
        name: "Jane Admin",
        job: "Administrator",
        role_id: 2, // Admin role
      };

      const res = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty("name", userData.name);
      expect(res.body).toHaveProperty("job", userData.job);
      expect(res.body).toHaveProperty("id");

      // Verify user was created with specified role
      const userRes = await request(app)
        .get(`/api/users/${res.body.id}`)
        .expect(200);

      expect(userRes.body.data).toHaveProperty("role_id", 2);
      expect(userRes.body.data.role).toHaveProperty("name", "Admin");

      // Clean up
      await request(app).delete(`/api/users/${res.body.id}`).expect(204);
    });

    it("should reject user creation with invalid role", async () => {
      const userData = {
        name: "Invalid Role User",
        job: "Test",
        role_id: 999, // Non-existent role
      };

      const res = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(400);

      expect(res.body).toHaveProperty("error", "Invalid role_id provided");
    });

    it("should get a user by ID with role information", async () => {
      const res = await request(app)
        .get(`/api/users/${createdUserId}`)
        .expect(200);

      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("id", createdUserId);
      expect(res.body.data).toHaveProperty("role_id");
      expect(res.body.data).toHaveProperty("role");

      if (res.body.data.role) {
        expect(res.body.data.role).toHaveProperty("id");
        expect(res.body.data.role).toHaveProperty("name");
        expect(res.body.data.role).toHaveProperty("description");
      }
    });

    it("should update a user without changing role", async () => {
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

    it("should update a user's role", async () => {
      const updateData = {
        role_id: 2, // Admin role (we know this exists)
      };

      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty("updatedAt");

      // Verify role was updated
      const userRes = await request(app)
        .get(`/api/users/${createdUserId}`)
        .expect(200);

      expect(userRes.body.data).toHaveProperty("role_id", 2);
      expect(userRes.body.data.role).toHaveProperty("name", "Admin");
    });

    it("should reject role update with invalid role", async () => {
      const updateData = {
        role_id: 999, // Non-existent role
      };

      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .send(updateData)
        .expect(400);

      expect(res.body).toHaveProperty("error", "Invalid role_id provided");
    });

    it("should reject update with no valid fields", async () => {
      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Name, job, or role_id is required"
      );
    });

    it("should return 404 when updating non-existent user", async () => {
      const updateData = {
        name: "Non-existent User",
      };

      const res = await request(app)
        .put("/api/users/999999")
        .send(updateData)
        .expect(404);

      expect(res.body).toHaveProperty("error", "User not found");
    });

    it("should delete a user", async () => {
      await request(app).delete(`/api/users/${createdUserId}`).expect(204);

      // Verify user is deleted
      await request(app).get(`/api/users/${createdUserId}`).expect(404);
    });

    it("should handle non-existent user", async () => {
      await request(app).get("/api/users/999999").expect(404);
    });

    describe("Role Filtering", () => {
      let userRole1Id, userRole2Id, userRole3Id;

      beforeAll(async () => {
        // Create test users with different roles for filtering tests
        const user1 = await request(app)
          .post("/api/users")
          .send({ name: "User Role1", job: "Test User", role_id: 1 })
          .expect(201);
        userRole1Id = user1.body.id;

        const user2 = await request(app)
          .post("/api/users")
          .send({ name: "Admin Role2", job: "Test Admin", role_id: 2 })
          .expect(201);
        userRole2Id = user2.body.id;

        const user3 = await request(app)
          .post("/api/users")
          .send({ name: "User Role3", job: "Test User", role_id: 1 })
          .expect(201);
        userRole3Id = user3.body.id;
      });

      afterAll(async () => {
        // Clean up test users
        if (userRole1Id) await request(app).delete(`/api/users/${userRole1Id}`);
        if (userRole2Id) await request(app).delete(`/api/users/${userRole2Id}`);
        if (userRole3Id) await request(app).delete(`/api/users/${userRole3Id}`);
      });

      it("should filter users by role ID", async () => {
        const res = await request(app).get("/api/users?role=1").expect(200);

        expect(res.body).toHaveProperty("data");
        expect(Array.isArray(res.body.data)).toBeTruthy();

        // All returned users should have role_id = 1
        res.body.data.forEach((user) => {
          expect(user.role_id).toBe(1);
          expect(user.role.name).toBe("User");
        });

        // Should include our test user
        const testUser = res.body.data.find((user) => user.id === userRole1Id);
        expect(testUser).toBeDefined();
      });

      it("should filter users by admin role", async () => {
        const res = await request(app).get("/api/users?role=2").expect(200);

        expect(res.body).toHaveProperty("data");
        expect(Array.isArray(res.body.data)).toBeTruthy();

        // All returned users should have role_id = 2
        res.body.data.forEach((user) => {
          expect(user.role_id).toBe(2);
          expect(user.role.name).toBe("Admin");
        });

        // Should include our test user
        const testUser = res.body.data.find((user) => user.id === userRole2Id);
        expect(testUser).toBeDefined();
      });

      it("should filter users by user role", async () => {
        const res = await request(app).get("/api/users?role=1").expect(200);

        expect(res.body).toHaveProperty("data");
        expect(Array.isArray(res.body.data)).toBeTruthy();

        // All returned users should have role_id = 1
        res.body.data.forEach((user) => {
          expect(user.role_id).toBe(1);
          expect(user.role.name).toBe("User");
        });

        // Should include our test user
        const testUser = res.body.data.find((user) => user.id === userRole3Id);
        expect(testUser).toBeDefined();
      });

      it("should return empty results for non-existent role", async () => {
        const res = await request(app).get("/api/users?role=999").expect(200);

        expect(res.body).toHaveProperty("data");
        expect(res.body.data).toHaveLength(0);
        expect(res.body.total).toBe(0);
        expect(res.body.total_pages).toBe(0);
      });

      it("should handle role filtering with pagination", async () => {
        const res = await request(app)
          .get("/api/users?role=1&page=1&per_page=1")
          .expect(200);

        expect(res.body).toHaveProperty("page", 1);
        expect(res.body).toHaveProperty("per_page", 1);
        expect(res.body).toHaveProperty("total");
        expect(res.body).toHaveProperty("total_pages");
        expect(res.body.data.length).toBeLessThanOrEqual(1);

        if (res.body.data.length > 0) {
          expect(res.body.data[0].role_id).toBe(1);
        }
      });

      it("should reject invalid role parameter - non-numeric", async () => {
        const res = await request(app)
          .get("/api/users?role=invalid")
          .expect(400);

        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Invalid role parameter");
      });

      it("should reject invalid role parameter - negative number", async () => {
        const res = await request(app).get("/api/users?role=-1").expect(400);

        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Invalid role parameter");
      });

      it("should reject invalid role parameter - zero", async () => {
        const res = await request(app).get("/api/users?role=0").expect(400);

        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Invalid role parameter");
      });

      it("should work without role filter (backward compatibility)", async () => {
        const res = await request(app).get("/api/users").expect(200);

        expect(res.body).toHaveProperty("data");
        expect(Array.isArray(res.body.data)).toBeTruthy();
        expect(res.body.total).toBeGreaterThan(0);

        // Should include users with different roles
        const roleIds = res.body.data.map((user) => user.role_id);
        const uniqueRoles = [...new Set(roleIds)];
        expect(uniqueRoles.length).toBeGreaterThan(1);
      });

      it("should maintain correct total count with role filtering", async () => {
        // Get total users with role 1
        const role1Res = await request(app)
          .get("/api/users?role=1")
          .expect(200);

        // Get total users with role 2
        const role2Res = await request(app)
          .get("/api/users?role=2")
          .expect(200);

        // Get all users
        const allRes = await request(app).get("/api/users").expect(200);

        // The sum of filtered results should be less than or equal to total
        expect(role1Res.body.total + role2Res.body.total).toBeLessThanOrEqual(
          allRes.body.total
        );
      });
    });
  });

  describe("Roles API", () => {
    it("should list all active roles", async () => {
      const res = await request(app).get("/api/roles").expect(200);

      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify each role has required properties
      res.body.data.forEach((role) => {
        expect(role).toHaveProperty("id");
        expect(role).toHaveProperty("name");
        expect(role).toHaveProperty("description");
        expect(role).toHaveProperty("is_active");
        expect(role).toHaveProperty("created_at");
        expect(role.is_active).toBe(1); // Should only return active roles
      });
    });

    it("should get a specific role by ID", async () => {
      // First get all roles to find a valid ID
      const rolesRes = await request(app).get("/api/roles").expect(200);
      const firstRole = rolesRes.body.data[0];

      const res = await request(app)
        .get(`/api/roles/${firstRole.id}`)
        .expect(200);

      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("id", firstRole.id);
      expect(res.body.data).toHaveProperty("name", firstRole.name);
      expect(res.body.data).toHaveProperty("description");
      expect(res.body.data).toHaveProperty("is_active");
      expect(res.body.data).toHaveProperty("created_at");
    });

    it("should return 404 for non-existent role", async () => {
      const res = await request(app).get("/api/roles/999999").expect(404);

      expect(res.body).toHaveProperty("error", "Role not found");
    });

    it("should return 400 for invalid role ID", async () => {
      const invalidIds = ["abc", "-1", "0"];

      for (const invalidId of invalidIds) {
        const res = await request(app)
          .get(`/api/roles/${invalidId}`)
          .expect(400);

        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Invalid role ID");
      }
    });

    it("should handle empty role ID by routing to list endpoint", async () => {
      // When empty string is provided, it routes to /api/roles/ which is the list endpoint
      const res = await request(app).get("/api/roles/").expect(200);

      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    it("should verify default roles exist", async () => {
      const res = await request(app).get("/api/roles").expect(200);

      const roleNames = res.body.data.map((role) => role.name);
      expect(roleNames).toContain("User");
      expect(roleNames).toContain("Admin");
      expect(roleNames).toContain("Moderator");
    });

    it("should return roles ordered by name", async () => {
      const res = await request(app).get("/api/roles").expect(200);

      const roleNames = res.body.data.map((role) => role.name);
      const sortedNames = [...roleNames].sort();
      expect(roleNames).toEqual(sortedNames);
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
