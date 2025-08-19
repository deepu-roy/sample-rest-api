const request = require("supertest");
const { db, initializeDatabase } = require("../db/init");

// Import the express app
const app = require("../server");

describe("Role Management API Endpoints", () => {
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

  describe("POST /api/roles - Create Role", () => {
    let createdRoleId;

    afterEach(async () => {
      // Clean up created role
      if (createdRoleId) {
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [createdRoleId], () => {
            createdRoleId = null;
            resolve();
          });
        });
      }
    });

    it("should create a new role with name and description", async () => {
      const roleData = {
        name: "Test Role",
        description: "A test role for unit testing",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(201);

      expect(res.body).toHaveProperty("message", "Role created successfully");
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("name", roleData.name);
      expect(res.body.data).toHaveProperty("description", roleData.description);
      expect(res.body.data).toHaveProperty("is_active", 1);
      expect(res.body.data).toHaveProperty("created_at");

      createdRoleId = res.body.data.id;
    });

    it("should create a new role with only name (no description)", async () => {
      const roleData = {
        name: "Test Role No Desc",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(201);

      expect(res.body).toHaveProperty("message", "Role created successfully");
      expect(res.body.data).toHaveProperty("name", roleData.name);
      expect(res.body.data).toHaveProperty("description", null);

      createdRoleId = res.body.data.id;
    });

    it("should create a role with empty description", async () => {
      const roleData = {
        name: "Test Role Empty Desc",
        description: "",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(201);

      expect(res.body.data).toHaveProperty("name", roleData.name);
      expect(res.body.data).toHaveProperty("description", null);

      createdRoleId = res.body.data.id;
    });

    it("should trim whitespace from name and description", async () => {
      const roleData = {
        name: "  Test Role Trimmed  ",
        description: "  Test description with spaces  ",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(201);

      expect(res.body.data).toHaveProperty("name", "Test Role Trimmed");
      expect(res.body.data).toHaveProperty(
        "description",
        "Test description with spaces"
      );

      createdRoleId = res.body.data.id;
    });

    it("should reject role creation without name", async () => {
      const roleData = {
        description: "Role without name",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Role name is required and must be a non-empty string"
      );
    });

    it("should reject role creation with empty name", async () => {
      const roleData = {
        name: "",
        description: "Role with empty name",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Role name is required and must be a non-empty string"
      );
    });

    it("should reject role creation with whitespace-only name", async () => {
      const roleData = {
        name: "   ",
        description: "Role with whitespace name",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Role name is required and must be a non-empty string"
      );
    });

    it("should reject role creation with non-string name", async () => {
      const roleData = {
        name: 123,
        description: "Role with numeric name",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Role name is required and must be a non-empty string"
      );
    });

    it("should reject role creation with non-string description", async () => {
      const roleData = {
        name: "Valid Name",
        description: 123,
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Role description must be a string"
      );
    });

    it("should reject role creation with duplicate name (case insensitive)", async () => {
      // First create a role
      const roleData = {
        name: "Duplicate Test Role",
        description: "First role",
      };

      const firstRes = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(201);

      createdRoleId = firstRes.body.data.id;

      // Try to create another role with same name (different case)
      const duplicateData = {
        name: "DUPLICATE TEST ROLE",
        description: "Second role",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(duplicateData)
        .expect(409);

      expect(res.body).toHaveProperty(
        "error",
        "A role with this name already exists"
      );
    });

    it("should reject role creation with existing role name", async () => {
      // Try to create a role with existing default role name
      const roleData = {
        name: "User",
        description: "Duplicate user role",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(409);

      expect(res.body).toHaveProperty(
        "error",
        "A role with this name already exists"
      );
    });
  });

  describe("PUT /api/roles/:id - Update Role", () => {
    let testRoleId;

    beforeEach(async () => {
      // Create a test role for updating
      const res = await request(app)
        .post("/api/roles")
        .send({
          name: "Update Test Role",
          description: "Role for update testing",
        })
        .expect(201);

      testRoleId = res.body.data.id;
    });

    afterEach(async () => {
      // Clean up test role
      if (testRoleId) {
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [testRoleId], () => {
            testRoleId = null;
            resolve();
          });
        });
      }
    });

    it("should update role name and description", async () => {
      const updateData = {
        name: "Updated Role Name",
        description: "Updated description",
      };

      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty("message", "Role updated successfully");
      expect(res.body.data).toHaveProperty("name", updateData.name);
      expect(res.body.data).toHaveProperty(
        "description",
        updateData.description
      );
      expect(res.body.data).toHaveProperty("id", testRoleId);
    });

    it("should update only role name", async () => {
      const updateData = {
        name: "Only Name Updated",
      };

      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.data).toHaveProperty("name", updateData.name);
      expect(res.body.data).toHaveProperty(
        "description",
        "Role for update testing"
      ); // Original description
    });

    it("should update only role description", async () => {
      const updateData = {
        description: "Only description updated",
      };

      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.data).toHaveProperty("name", "Update Test Role"); // Original name
      expect(res.body.data).toHaveProperty(
        "description",
        updateData.description
      );
    });

    it("should set description to null when empty string provided", async () => {
      const updateData = {
        description: "",
      };

      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.data).toHaveProperty("description", null);
    });

    it("should trim whitespace from updated values", async () => {
      const updateData = {
        name: "  Trimmed Name  ",
        description: "  Trimmed Description  ",
      };

      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.data).toHaveProperty("name", "Trimmed Name");
      expect(res.body.data).toHaveProperty(
        "description",
        "Trimmed Description"
      );
    });

    it("should reject update with invalid role ID", async () => {
      const invalidIds = ["abc", "-1", "0"];

      for (const invalidId of invalidIds) {
        const res = await request(app)
          .put(`/api/roles/${invalidId}`)
          .send({ name: "Test" })
          .expect(400);

        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Invalid role ID");
      }
    });

    it("should reject update for non-existent role", async () => {
      const updateData = {
        name: "Non-existent Role",
      };

      const res = await request(app)
        .put("/api/roles/999999")
        .send(updateData)
        .expect(404);

      expect(res.body).toHaveProperty("error", "Role not found");
    });

    it("should reject update with no fields provided", async () => {
      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "At least one field (name or description) must be provided"
      );
    });

    it("should reject update with empty name", async () => {
      const updateData = {
        name: "",
      };

      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send(updateData)
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Role name must be a non-empty string"
      );
    });

    it("should reject update with whitespace-only name", async () => {
      const updateData = {
        name: "   ",
      };

      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send(updateData)
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Role name must be a non-empty string"
      );
    });

    it("should reject update with non-string name", async () => {
      const updateData = {
        name: 123,
      };

      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send(updateData)
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Role name must be a non-empty string"
      );
    });

    it("should reject update with non-string description", async () => {
      const updateData = {
        description: 123,
      };

      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send(updateData)
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Role description must be a string"
      );
    });

    it("should reject update with duplicate name (case insensitive)", async () => {
      // Try to update to existing role name
      const updateData = {
        name: "admin", // Existing role name in different case
      };

      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send(updateData)
        .expect(409);

      expect(res.body).toHaveProperty(
        "error",
        "A role with this name already exists"
      );
    });

    it("should allow updating role to same name (no change)", async () => {
      const updateData = {
        name: "Update Test Role", // Same name
        description: "New description",
      };

      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .send(updateData)
        .expect(200);

      expect(res.body.data).toHaveProperty("name", updateData.name);
      expect(res.body.data).toHaveProperty(
        "description",
        updateData.description
      );
    });
  });

  describe("DELETE /api/roles/:id - Deactivate Role", () => {
    let testRoleId;

    beforeEach(async () => {
      // Create a test role for deactivation
      const res = await request(app)
        .post("/api/roles")
        .send({
          name: "Deactivate Test Role",
          description: "Role for deactivation testing",
        })
        .expect(201);

      testRoleId = res.body.data.id;
    });

    afterEach(async () => {
      // Clean up test role
      if (testRoleId) {
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [testRoleId], () => {
            testRoleId = null;
            resolve();
          });
        });
      }
    });

    it("should deactivate a role (soft delete)", async () => {
      const res = await request(app)
        .delete(`/api/roles/${testRoleId}`)
        .expect(200);

      expect(res.body).toHaveProperty(
        "message",
        "Role deactivated successfully"
      );
      expect(res.body.data).toHaveProperty("id", testRoleId);
      expect(res.body.data).toHaveProperty("is_active", 0);
      expect(res.body.data).toHaveProperty("name", "Deactivate Test Role");

      // Verify role is not returned in active roles list
      const rolesRes = await request(app).get("/api/roles").expect(200);
      const deactivatedRole = rolesRes.body.data.find(
        (role) => role.id === testRoleId
      );
      expect(deactivatedRole).toBeUndefined();

      // But should still be accessible by direct ID query
      const directRes = await request(app)
        .get(`/api/roles/${testRoleId}`)
        .expect(200);
      expect(directRes.body.data).toHaveProperty("is_active", 0);
    });

    it("should reject deactivation with invalid role ID", async () => {
      const invalidIds = ["abc", "-1", "0"];

      for (const invalidId of invalidIds) {
        const res = await request(app)
          .delete(`/api/roles/${invalidId}`)
          .expect(400);

        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Invalid role ID");
      }
    });

    it("should reject deactivation for non-existent role", async () => {
      const res = await request(app).delete("/api/roles/999999").expect(404);

      expect(res.body).toHaveProperty("error", "Role not found");
    });

    it("should reject deactivation of default User role", async () => {
      const res = await request(app).delete("/api/roles/1").expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Cannot deactivate the default User role"
      );
    });

    it("should reject deactivation of already deactivated role", async () => {
      // First deactivate the role
      await request(app).delete(`/api/roles/${testRoleId}`).expect(200);

      // Try to deactivate again
      const res = await request(app)
        .delete(`/api/roles/${testRoleId}`)
        .expect(400);

      expect(res.body).toHaveProperty("error", "Role is already deactivated");
    });

    it("should preserve existing user assignments when deactivating role", async () => {
      // Create a user with the test role
      const userRes = await request(app)
        .post("/api/users")
        .send({
          name: "Test User",
          job: "Tester",
          role_id: testRoleId,
        })
        .expect(201);

      const userId = userRes.body.id;

      // Deactivate the role
      await request(app).delete(`/api/roles/${testRoleId}`).expect(200);

      // Verify user still has the role assigned
      const userCheckRes = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(userCheckRes.body.data).toHaveProperty("role_id", testRoleId);

      // Clean up user
      await request(app).delete(`/api/users/${userId}`);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle database errors gracefully", async () => {
      // This test would require mocking the database to simulate errors
      // For now, we'll test with a scenario that might cause issues

      // Try to create role with extremely long name
      const longName = "a".repeat(1000);
      const roleData = {
        name: longName,
        description: "Test role with very long name",
      };

      // This might succeed or fail depending on database constraints
      // The important thing is that it doesn't crash the server
      const res = await request(app).post("/api/roles").send(roleData);

      expect([201, 400, 500]).toContain(res.status);

      if (res.status === 201) {
        // Clean up if created
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
        });
      }
    });

    it("should handle concurrent role creation with same name", async () => {
      const roleData = {
        name: `Concurrent Test ${Date.now()}`,
        description: "Testing concurrent creation",
      };

      // Make two simultaneous requests
      const [res1, res2] = await Promise.all([
        request(app).post("/api/roles").send(roleData),
        request(app).post("/api/roles").send(roleData),
      ]);

      // One should succeed (201), one should fail (409 or 500 due to race condition)
      const statuses = [res1.status, res2.status].sort();
      const successCount = statuses.filter((s) => s === 201).length;
      const errorCount = statuses.filter((s) => s === 409 || s === 500).length;

      expect(successCount).toBe(1);
      expect(errorCount).toBe(1);

      // Clean up the created role
      const successfulRes = res1.status === 201 ? res1 : res2;
      if (successfulRes.status === 201) {
        await new Promise((resolve) => {
          db.run(
            "DELETE FROM roles WHERE id = ?",
            [successfulRes.body.data.id],
            resolve
          );
        });
      }
    });

    it("should handle role creation with special characters in name", async () => {
      const specialNames = [
        "Role with spaces",
        "Role-with-dashes",
        "Role_with_underscores",
        "Role.with.dots",
        "Role (with parentheses)",
        "Role & Symbols",
        "Role@Company",
      ];

      for (const name of specialNames) {
        const roleData = {
          name: name,
          description: `Test role: ${name}`,
        };

        const res = await request(app)
          .post("/api/roles")
          .send(roleData)
          .expect(201);

        expect(res.body.data).toHaveProperty("name", name);

        // Clean up
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
        });
      }
    });

    it("should handle role creation with unicode characters", async () => {
      const unicodeNames = [
        "Rôle Français",
        "Роль на русском",
        "角色中文",
        "役割日本語",
        "Función Español",
      ];

      for (const name of unicodeNames) {
        const roleData = {
          name: name,
          description: `Unicode test role: ${name}`,
        };

        const res = await request(app)
          .post("/api/roles")
          .send(roleData)
          .expect(201);

        expect(res.body.data).toHaveProperty("name", name);

        // Clean up
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
        });
      }
    });

    it("should handle role update with partial data correctly", async () => {
      // Create a test role
      const createRes = await request(app)
        .post("/api/roles")
        .send({
          name: "Partial Update Test",
          description: "Original description",
        })
        .expect(201);

      const roleId = createRes.body.data.id;

      // Test updating only name
      const nameUpdateRes = await request(app)
        .put(`/api/roles/${roleId}`)
        .send({ name: "Updated Name Only" })
        .expect(200);

      expect(nameUpdateRes.body.data).toHaveProperty(
        "name",
        "Updated Name Only"
      );
      expect(nameUpdateRes.body.data).toHaveProperty(
        "description",
        "Original description"
      );

      // Test updating only description
      const descUpdateRes = await request(app)
        .put(`/api/roles/${roleId}`)
        .send({ description: "Updated description only" })
        .expect(200);

      expect(descUpdateRes.body.data).toHaveProperty(
        "name",
        "Updated Name Only"
      );
      expect(descUpdateRes.body.data).toHaveProperty(
        "description",
        "Updated description only"
      );

      // Clean up
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [roleId], resolve);
      });
    });

    it("should maintain role assignments when role is deactivated", async () => {
      // Create a test role
      const roleRes = await request(app)
        .post("/api/roles")
        .send({
          name: "Assignment Test Role",
          description: "Role for testing assignments",
        })
        .expect(201);

      const roleId = roleRes.body.data.id;

      // Create a user with this role
      const userRes = await request(app)
        .post("/api/users")
        .send({
          name: "Test User",
          job: "Tester",
          role_id: roleId,
        })
        .expect(201);

      const userId = userRes.body.id;

      // Deactivate the role
      await request(app).delete(`/api/roles/${roleId}`).expect(200);

      // Verify user still has the role assigned
      const userCheckRes = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(userCheckRes.body.data).toHaveProperty("role_id", roleId);

      // Verify role is deactivated but still accessible by ID
      const roleCheckRes = await request(app)
        .get(`/api/roles/${roleId}`)
        .expect(200);

      expect(roleCheckRes.body.data).toHaveProperty("is_active", 0);

      // Clean up
      await request(app).delete(`/api/users/${userId}`);
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [roleId], resolve);
      });
    });

    it("should prevent new user assignments to deactivated roles", async () => {
      // Create and deactivate a test role
      const roleRes = await request(app)
        .post("/api/roles")
        .send({
          name: "Deactivated Assignment Test",
          description: "Role for testing deactivated assignments",
        })
        .expect(201);

      const roleId = roleRes.body.data.id;

      // Deactivate the role
      await request(app).delete(`/api/roles/${roleId}`).expect(200);

      // Try to create a user with the deactivated role
      const userRes = await request(app)
        .post("/api/users")
        .send({
          name: "Test User",
          job: "Tester",
          role_id: roleId,
        })
        .expect(400);

      expect(userRes.body).toHaveProperty("error", "Invalid role_id provided");

      // Clean up
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [roleId], resolve);
      });
    });
  });

  describe("Integration with User Management", () => {
    let testRoleId;
    let testUserId;

    beforeEach(async () => {
      // Create a test role for integration tests
      const roleRes = await request(app)
        .post("/api/roles")
        .send({
          name: "Integration Test Role",
          description: "Role for integration testing",
        })
        .expect(201);

      testRoleId = roleRes.body.data.id;
    });

    afterEach(async () => {
      // Clean up test user if created
      if (testUserId) {
        await request(app).delete(`/api/users/${testUserId}`);
        testUserId = null;
      }

      // Clean up test role
      if (testRoleId) {
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [testRoleId], resolve);
        });
        testRoleId = null;
      }
    });

    it("should allow user creation with custom role", async () => {
      const userRes = await request(app)
        .post("/api/users")
        .send({
          name: "Integration Test User",
          job: "Tester",
          role_id: testRoleId,
        })
        .expect(201);

      testUserId = userRes.body.id;

      // Verify user has the correct role
      const userCheckRes = await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(200);

      expect(userCheckRes.body.data).toHaveProperty("role_id", testRoleId);
      expect(userCheckRes.body.data.role).toHaveProperty(
        "name",
        "Integration Test Role"
      );
    });

    it("should allow role changes for existing users", async () => {
      // Create user with default role
      const userRes = await request(app)
        .post("/api/users")
        .send({
          name: "Role Change Test User",
          job: "Tester",
        })
        .expect(201);

      testUserId = userRes.body.id;

      // Change user's role
      await request(app)
        .put(`/api/users/${testUserId}`)
        .send({ role_id: testRoleId })
        .expect(200);

      // Verify role change
      const userCheckRes = await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(200);

      expect(userCheckRes.body.data).toHaveProperty("role_id", testRoleId);
      expect(userCheckRes.body.data.role).toHaveProperty(
        "name",
        "Integration Test Role"
      );
    });

    it("should filter users by role correctly", async () => {
      // Create multiple users with different roles
      const user1Res = await request(app)
        .post("/api/users")
        .send({
          name: "User 1",
          job: "Tester 1",
          role_id: testRoleId,
        })
        .expect(201);

      const user2Res = await request(app)
        .post("/api/users")
        .send({
          name: "User 2",
          job: "Tester 2",
          role_id: 1, // Default User role
        })
        .expect(201);

      // Filter by test role
      const filteredRes = await request(app)
        .get(`/api/users?role=${testRoleId}`)
        .expect(200);

      expect(filteredRes.body.data).toHaveLength(1);
      expect(filteredRes.body.data[0]).toHaveProperty("id", user1Res.body.id);
      expect(filteredRes.body.data[0]).toHaveProperty("role_id", testRoleId);

      // Clean up users
      await request(app).delete(`/api/users/${user1Res.body.id}`);
      await request(app).delete(`/api/users/${user2Res.body.id}`);
    });

    it("should handle role deactivation with existing user assignments gracefully", async () => {
      // Create user with test role
      const userRes = await request(app)
        .post("/api/users")
        .send({
          name: "Deactivation Test User",
          job: "Tester",
          role_id: testRoleId,
        })
        .expect(201);

      testUserId = userRes.body.id;

      // Deactivate the role
      await request(app).delete(`/api/roles/${testRoleId}`).expect(200);

      // User should still exist with the role
      const userCheckRes = await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(200);

      expect(userCheckRes.body.data).toHaveProperty("role_id", testRoleId);

      // Role should be marked as inactive
      const roleCheckRes = await request(app)
        .get(`/api/roles/${testRoleId}`)
        .expect(200);

      expect(roleCheckRes.body.data).toHaveProperty("is_active", 0);

      // Role should not appear in active roles list
      const activeRolesRes = await request(app).get("/api/roles").expect(200);

      const activeRole = activeRolesRes.body.data.find(
        (role) => role.id === testRoleId
      );
      expect(activeRole).toBeUndefined();
    });
  });
});
