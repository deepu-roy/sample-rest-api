const request = require("supertest");
const { db, initializeDatabase } = require("../db/init");

// Import the express app
const app = require("../server");

describe("Frontend Validation Tests", () => {
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

  describe("Input Validation", () => {
    it("should validate user input fields", async () => {
      const invalidUserData = {
        name: "",
        job: "",
      };

      const res = await request(app)
        .post("/api/users")
        .send(invalidUserData)
        .expect(400);

      expect(res.body).toHaveProperty("error", "Name and job are required");
    });

    it("should validate role input fields", async () => {
      const invalidRoleData = {
        name: "",
        description: "Invalid role",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(invalidRoleData)
        .expect(400);

      expect(res.body).toHaveProperty(
        "error",
        "Role name is required and must be a non-empty string"
      );
    });

    it("should handle XSS prevention in role names", async () => {
      const xssRoleData = {
        name: "<script>alert('xss')</script>",
        description: "XSS test role",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(xssRoleData)
        .expect(201);

      // The role should be created but the script tag should be stored as-is
      // (XSS prevention happens on the frontend display, not storage)
      expect(res.body.data).toHaveProperty(
        "name",
        "<script>alert('xss')</script>"
      );

      // Clean up
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
      });
    });

    it("should validate numeric inputs", async () => {
      const invalidRoleId = "invalid";

      const res = await request(app)
        .get(`/api/roles/${invalidRoleId}`)
        .expect(400);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("Invalid role ID");
    });
  });

  describe("Form Validation", () => {
    it("should validate required fields in user creation", async () => {
      const incompleteData = {
        name: "Test User",
        // missing job field
      };

      const res = await request(app)
        .post("/api/users")
        .send(incompleteData)
        .expect(400);

      expect(res.body).toHaveProperty("error", "Name and job are required");
    });

    it("should validate role assignment", async () => {
      const invalidRoleData = {
        name: "Test User",
        job: "Tester",
        role_id: 999999, // Non-existent role
      };

      const res = await request(app)
        .post("/api/users")
        .send(invalidRoleData)
        .expect(400);

      expect(res.body).toHaveProperty("error", "Invalid role_id provided");
    });
  });

  describe("Data Sanitization", () => {
    it("should trim whitespace from inputs", async () => {
      const roleData = {
        name: "  Trimmed Role  ",
        description: "  Trimmed Description  ",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(201);

      expect(res.body.data).toHaveProperty("name", "Trimmed Role");
      expect(res.body.data).toHaveProperty(
        "description",
        "Trimmed Description"
      );

      // Clean up
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
      });
    });

    it("should handle empty descriptions correctly", async () => {
      const roleData = {
        name: "Role with Empty Desc",
        description: "",
      };

      const res = await request(app)
        .post("/api/roles")
        .send(roleData)
        .expect(201);

      expect(res.body.data).toHaveProperty("description", null);

      // Clean up
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [res.body.data.id], resolve);
      });
    });
  });
});
