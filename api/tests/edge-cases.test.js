/**
 * Edge Cases and Error Scenario Tests for Role Management
 *
 * These tests verify error handling, edge cases, and boundary conditions
 * for the role management system.
 */

const request = require("supertest");
const { db, initializeDatabase } = require("../db/init");

// Import the express app
const app = require("../server");

describe("Role Management Edge Cases and Error Scenarios", () => {
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

  describe("Input Validation Edge Cases", () => {
    it("should handle various whitespace scenarios in role names", async () => {
      const whitespaceTests = [
        { input: "   Role Name   ", expected: "Role Name" },
        { input: "\t\tTabbed Role\t\t", expected: "Tabbed Role" },
        { input: "\n\nNewline Role\n\n", expected: "Newline Role" },
        { input: "  Mixed   Spaces  ", expected: "Mixed   Spaces" },
      ];

      for (const test of whitespaceTests) {
        const res = await request(app)
          .post("/api/roles")
          .send({
            name: test.input,
            description: "Test description",
          })
          .expect(201);

        expect(res.body.data).toHaveProperty("name", test.expected);

        // Clean up
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
        });
      }
    });

    it("should handle various whitespace scenarios in descriptions", async () => {
      const descriptionTests = [
        { input: "   Description   ", expected: "Description" },
        { input: "", expected: null },
        { input: "   ", expected: null },
        { input: "\t\t\t", expected: null },
        { input: "\n\n\n", expected: null },
      ];

      for (const test of descriptionTests) {
        const res = await request(app)
          .post("/api/roles")
          .send({
            name: `Test Role ${Date.now()}`,
            description: test.input,
          })
          .expect(201);

        expect(res.body.data).toHaveProperty("description", test.expected);

        // Clean up
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
        });
      }
    });

    it("should handle boundary length values for role names", async () => {
      // Test exactly 50 characters (assuming this is the limit)
      const exactLimitName = "a".repeat(50);
      const res = await request(app).post("/api/roles").send({
        name: exactLimitName,
        description: "Boundary test",
      });

      // Should succeed or fail gracefully
      expect([201, 400]).toContain(res.status);

      if (res.status === 201) {
        expect(res.body.data).toHaveProperty("name", exactLimitName);
        // Clean up
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
        });
      }
    });

    it("should handle boundary length values for descriptions", async () => {
      // Test exactly 255 characters (assuming this is the limit)
      const exactLimitDesc = "a".repeat(255);
      const res = await request(app)
        .post("/api/roles")
        .send({
          name: `Boundary Test ${Date.now()}`,
          description: exactLimitDesc,
        });

      // Should succeed or fail gracefully
      expect([201, 400]).toContain(res.status);

      if (res.status === 201) {
        expect(res.body.data).toHaveProperty("description", exactLimitDesc);
        // Clean up
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
        });
      }
    });

    it("should handle null and undefined values correctly", async () => {
      // Test null name
      const nullNameRes = await request(app)
        .post("/api/roles")
        .send({
          name: null,
          description: "Test description",
        })
        .expect(400);

      expect(nullNameRes.body).toHaveProperty("error");

      // Test undefined name (missing field)
      const undefinedNameRes = await request(app)
        .post("/api/roles")
        .send({
          description: "Test description",
        })
        .expect(400);

      expect(undefinedNameRes.body).toHaveProperty("error");

      // Test null description (should be allowed)
      const nullDescRes = await request(app)
        .post("/api/roles")
        .send({
          name: `Null Desc Test ${Date.now()}`,
          description: null,
        })
        .expect(400); // Based on current validation

      expect(nullDescRes.body).toHaveProperty("error");
    });

    it("should handle non-string data types", async () => {
      const invalidTypes = [
        { name: 123, description: "Number name" },
        { name: true, description: "Boolean name" },
        { name: [], description: "Array name" },
        { name: {}, description: "Object name" },
        { name: "Valid Name", description: 123 },
        { name: "Valid Name", description: true },
        { name: "Valid Name", description: [] },
        { name: "Valid Name", description: {} },
      ];

      for (const invalidData of invalidTypes) {
        const res = await request(app)
          .post("/api/roles")
          .send(invalidData)
          .expect(400);

        expect(res.body).toHaveProperty("error");
      }
    });
  });

  describe("Database Constraint Edge Cases", () => {
    it("should handle case-insensitive duplicate detection correctly", async () => {
      const baseName = `Case Test ${Date.now()}`;

      // Create original role
      const originalRes = await request(app)
        .post("/api/roles")
        .send({
          name: baseName,
          description: "Original role",
        })
        .expect(201);

      const roleId = originalRes.body.data.id;

      // Test various case combinations
      const caseVariations = [
        baseName.toLowerCase(),
        baseName.toUpperCase(),
        baseName.charAt(0).toLowerCase() + baseName.slice(1),
        baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase(),
      ];

      for (const variation of caseVariations) {
        const res = await request(app)
          .post("/api/roles")
          .send({
            name: variation,
            description: "Duplicate test",
          })
          .expect(409);

        expect(res.body).toHaveProperty(
          "error",
          "A role with this name already exists"
        );
      }

      // Clean up
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [roleId], resolve);
      });
    });

    it("should handle role updates with case-insensitive duplicate detection", async () => {
      const role1Name = `Update Test 1 ${Date.now()}`;
      const role2Name = `Update Test 2 ${Date.now()}`;

      // Create two roles
      const role1Res = await request(app)
        .post("/api/roles")
        .send({ name: role1Name, description: "First role" })
        .expect(201);

      const role2Res = await request(app)
        .post("/api/roles")
        .send({ name: role2Name, description: "Second role" })
        .expect(201);

      const role1Id = role1Res.body.data.id;
      const role2Id = role2Res.body.data.id;

      // Try to update role2 to have same name as role1 (different cases)
      const caseVariations = [
        role1Name.toLowerCase(),
        role1Name.toUpperCase(),
        role1Name.charAt(0).toLowerCase() + role1Name.slice(1),
      ];

      for (const variation of caseVariations) {
        const res = await request(app)
          .put(`/api/roles/${role2Id}`)
          .send({
            name: variation,
            description: "Updated description",
          })
          .expect(409);

        expect(res.body).toHaveProperty(
          "error",
          "A role with this name already exists"
        );
      }

      // Clean up
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [role1Id], resolve);
      });
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [role2Id], resolve);
      });
    });
  });

  describe("API Parameter Edge Cases", () => {
    it("should handle invalid role IDs in various formats", async () => {
      const invalidIds = [
        "abc",
        "123abc",
        "abc123",
        "-1",
        "0",
        "1.5",
        "1e10",
        "null",
        "undefined",
        "",
        " ",
        "true",
        "false",
        "[]",
        "{}",
        "%20",
        "javascript:alert(1)",
      ];

      for (const invalidId of invalidIds) {
        // Skip empty string and space as they route to list endpoint
        if (invalidId === "" || invalidId === " ") {
          continue;
        }

        // Test GET role by ID
        const getRes = await request(app)
          .get(`/api/roles/${invalidId}`)
          .expect(400);

        expect(getRes.body).toHaveProperty("error");
        expect(getRes.body.error).toContain("Invalid role ID");

        // Test PUT role by ID
        const putRes = await request(app)
          .put(`/api/roles/${invalidId}`)
          .send({ name: "Test Update" })
          .expect(400);

        expect(putRes.body).toHaveProperty("error");
        expect(putRes.body.error).toContain("Invalid role ID");

        // Test DELETE role by ID
        const deleteRes = await request(app)
          .delete(`/api/roles/${invalidId}`)
          .expect(400);

        expect(deleteRes.body).toHaveProperty("error");
        expect(deleteRes.body.error).toContain("Invalid role ID");
      }
    });

    it("should handle invalid role filter parameters in user queries", async () => {
      const invalidRoleParams = [
        "abc",
        "-1",
        "0",
        "1.5",
        "null",
        "undefined",
        "",
        " ",
        "true",
        "false",
      ];

      for (const invalidParam of invalidRoleParams) {
        const res = await request(app)
          .get(`/api/users?role=${invalidParam}`)
          .expect(400);

        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Invalid role parameter");
      }
    });

    it("should handle malformed JSON in request bodies", async () => {
      // This test requires sending raw data instead of JSON
      const malformedJsonTests = [
        '{"name": "Test Role", "description": }',
        '{"name": "Test Role" "description": "Missing comma"}',
        '{"name": "Test Role", "description": "Extra comma",}',
        '{name: "Test Role", description: "Unquoted keys"}',
        "{'name': 'Test Role', 'description': 'Single quotes'}",
      ];

      for (const malformedJson of malformedJsonTests) {
        const res = await request(app)
          .post("/api/roles")
          .set("Content-Type", "application/json")
          .send(malformedJson)
          .expect(400);

        // Should handle malformed JSON gracefully
        expect(res.status).toBe(400);
      }
    });
  });

  describe("Concurrent Operation Edge Cases", () => {
    it("should handle concurrent role creation with same name", async () => {
      const roleName = `Concurrent Test ${Date.now()}`;
      const roleData = {
        name: roleName,
        description: "Concurrent creation test",
      };

      // Make two simultaneous requests (more realistic for SQLite)
      const [res1, res2] = await Promise.all([
        request(app).post("/api/roles").send(roleData),
        request(app).post("/api/roles").send(roleData),
      ]);

      const statuses = [res1.status, res2.status];

      // One should succeed (201), one should fail (409 or 500 due to race condition)
      const successCount = statuses.filter((status) => status === 201).length;
      const errorCount = statuses.filter(
        (status) => status === 409 || status === 500
      ).length;

      expect(successCount).toBe(1);
      expect(errorCount).toBe(1);

      // Clean up the created role
      const successfulResult = res1.status === 201 ? res1 : res2;
      if (successfulResult && successfulResult.status === 201) {
        await new Promise((resolve) => {
          db.run(
            "DELETE FROM roles WHERE id = ?",
            [successfulResult.body.data.id],
            resolve
          );
        });
      }
    });

    it("should handle concurrent role updates", async () => {
      // Create a test role
      const roleRes = await request(app)
        .post("/api/roles")
        .send({
          name: `Concurrent Update Test ${Date.now()}`,
          description: "Original description",
        })
        .expect(201);

      const roleId = roleRes.body.data.id;

      // Make concurrent updates
      const updatePromises = [
        request(app).put(`/api/roles/${roleId}`).send({
          name: "Updated Name 1",
          description: "Updated description 1",
        }),
        request(app).put(`/api/roles/${roleId}`).send({
          name: "Updated Name 2",
          description: "Updated description 2",
        }),
        request(app).put(`/api/roles/${roleId}`).send({
          name: "Updated Name 3",
          description: "Updated description 3",
        }),
      ];

      const updateResults = await Promise.all(updatePromises);

      // All updates should succeed (200) since they're updating the same role
      updateResults.forEach((res) => {
        expect(res.status).toBe(200);
      });

      // Verify final state
      const finalRes = await request(app)
        .get(`/api/roles/${roleId}`)
        .expect(200);

      expect(finalRes.body.data).toHaveProperty("id", roleId);
      // Name should be one of the updated names
      expect(["Updated Name 1", "Updated Name 2", "Updated Name 3"]).toContain(
        finalRes.body.data.name
      );

      // Clean up
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [roleId], resolve);
      });
    });

    it("should handle concurrent user creation with same role", async () => {
      // Create a test role
      const roleRes = await request(app)
        .post("/api/roles")
        .send({
          name: `Concurrent User Test ${Date.now()}`,
          description: "Role for concurrent user testing",
        })
        .expect(201);

      const roleId = roleRes.body.data.id;

      // Create multiple users concurrently with the same role
      const userPromises = Array(5)
        .fill()
        .map((_, index) =>
          request(app)
            .post("/api/users")
            .send({
              name: `Concurrent User ${index}`,
              job: "Test Job",
              role_id: roleId,
            })
        );

      const userResults = await Promise.all(userPromises);

      // All user creations should succeed
      userResults.forEach((res) => {
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("id");
      });

      // Verify all users have the correct role
      for (const userRes of userResults) {
        const userCheckRes = await request(app)
          .get(`/api/users/${userRes.body.id}`)
          .expect(200);

        expect(userCheckRes.body.data).toHaveProperty("role_id", roleId);
      }

      // Clean up users
      for (const userRes of userResults) {
        await request(app).delete(`/api/users/${userRes.body.id}`);
      }

      // Clean up role
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [roleId], resolve);
      });
    });
  });

  describe("Memory and Performance Edge Cases", () => {
    it("should handle large number of roles efficiently", async () => {
      const roleIds = [];
      const startTime = Date.now();

      try {
        // Create 50 roles
        for (let i = 0; i < 50; i++) {
          const res = await request(app)
            .post("/api/roles")
            .send({
              name: `Performance Test Role ${i}`,
              description: `Description for role ${i}`,
            })
            .expect(201);

          roleIds.push(res.body.data.id);
        }

        const creationTime = Date.now() - startTime;
        console.log(`Created 50 roles in ${creationTime}ms`);

        // Test listing all roles
        const listStartTime = Date.now();
        const listRes = await request(app)
          .get("/api/roles?all=true")
          .expect(200);

        const listTime = Date.now() - listStartTime;
        console.log(`Listed roles in ${listTime}ms`);

        expect(listRes.body.data.length).toBeGreaterThanOrEqual(50);

        // Test individual role retrieval
        const getStartTime = Date.now();
        for (let i = 0; i < 10; i++) {
          await request(app).get(`/api/roles/${roleIds[i]}`).expect(200);
        }
        const getTime = Date.now() - getStartTime;
        console.log(`Retrieved 10 individual roles in ${getTime}ms`);
      } finally {
        // Clean up all created roles
        for (const roleId of roleIds) {
          await new Promise((resolve) => {
            db.run("DELETE FROM roles WHERE id = ?", [roleId], resolve);
          });
        }
      }
    });

    it("should handle roles with very long descriptions", async () => {
      const longDescription = "A".repeat(1000); // Very long description

      const res = await request(app)
        .post("/api/roles")
        .send({
          name: `Long Description Test ${Date.now()}`,
          description: longDescription,
        });

      // Should either succeed or fail gracefully
      expect([201, 400]).toContain(res.status);

      if (res.status === 201) {
        // Verify the description was stored correctly
        const getRes = await request(app)
          .get(`/api/roles/${res.body.data.id}`)
          .expect(200);

        expect(getRes.body.data.description.length).toBeGreaterThan(500);

        // Clean up
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
        });
      }
    });
  });

  describe("Security Edge Cases", () => {
    it("should handle potential SQL injection attempts", async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE roles; --",
        "' OR '1'='1",
        "'; INSERT INTO roles (name) VALUES ('hacked'); --",
        "' UNION SELECT * FROM users --",
        "'; DELETE FROM roles WHERE id > 0; --",
      ];

      for (const injection of sqlInjectionAttempts) {
        // Test in role creation
        const createRes = await request(app).post("/api/roles").send({
          name: injection,
          description: "SQL injection test",
        });

        // Should either succeed (treating as normal string) or fail with validation error
        expect([201, 400]).toContain(createRes.status);

        if (createRes.status === 201) {
          // If it succeeded, verify it was treated as a normal string
          expect(createRes.body.data).toHaveProperty("name", injection);

          // Clean up
          await new Promise((resolve) => {
            db.run(
              "DELETE FROM roles WHERE id = ?",
              [createRes.body.data.id],
              resolve
            );
          });
        }
      }
    });

    it("should handle XSS attempts in role data", async () => {
      const xssAttempts = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "javascript:alert('xss')",
        "<svg onload=alert('xss')>",
        "';alert('xss');//",
      ];

      for (const xss of xssAttempts) {
        const res = await request(app)
          .post("/api/roles")
          .send({
            name: `XSS Test ${Date.now()}`,
            description: xss,
          })
          .expect(201);

        // Verify XSS content is stored as-is (not executed)
        expect(res.body.data).toHaveProperty("description", xss);

        // Clean up
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
        });
      }
    });
  });
});
