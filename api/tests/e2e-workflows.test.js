/**
 * End-to-End Workflow Tests for Role Management
 *
 * These tests verify complete user workflows from start to finish,
 * including role creation, user assignment, role modification, and deactivation.
 */

const request = require("supertest");
const { db, initializeDatabase } = require("../db/init");

// Import the express app
const app = require("../server");

describe("End-to-End Role Management Workflows", () => {
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

  describe("Complete Role Lifecycle Workflow", () => {
    let roleId;
    let userId;

    it("should complete full role lifecycle: create -> assign -> modify -> deactivate", async () => {
      // Step 1: Create a new role
      const createRoleRes = await request(app)
        .post("/api/roles")
        .send({
          name: "Project Manager",
          description: "Manages project deliverables and timelines",
        })
        .expect(201);

      roleId = createRoleRes.body.data.id;
      expect(createRoleRes.body.data).toHaveProperty("name", "Project Manager");
      expect(createRoleRes.body.data).toHaveProperty("is_active", 1);

      // Step 2: Verify role appears in active roles list
      const rolesListRes = await request(app).get("/api/roles").expect(200);

      const createdRole = rolesListRes.body.data.find(
        (role) => role.id === roleId
      );
      expect(createdRole).toBeDefined();
      expect(createdRole.name).toBe("Project Manager");

      // Step 3: Create a user with the new role
      const createUserRes = await request(app)
        .post("/api/users")
        .send({
          name: "Alice Johnson",
          job: "Senior Project Manager",
          role_id: roleId,
        })
        .expect(201);

      userId = createUserRes.body.id;

      // Step 4: Verify user has the correct role
      const userRes = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(userRes.body.data).toHaveProperty("role_id", roleId);
      expect(userRes.body.data.role).toHaveProperty("name", "Project Manager");

      // Step 5: Filter users by the new role
      const filteredUsersRes = await request(app)
        .get(`/api/users?role=${roleId}`)
        .expect(200);

      expect(filteredUsersRes.body.data).toHaveLength(1);
      expect(filteredUsersRes.body.data[0]).toHaveProperty("id", userId);

      // Step 6: Update the role information
      const updateRoleRes = await request(app)
        .put(`/api/roles/${roleId}`)
        .send({
          name: "Senior Project Manager",
          description: "Manages complex projects and leads project teams",
        })
        .expect(200);

      expect(updateRoleRes.body.data).toHaveProperty(
        "name",
        "Senior Project Manager"
      );

      // Step 7: Verify user's role information is updated
      const updatedUserRes = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(updatedUserRes.body.data.role).toHaveProperty(
        "name",
        "Senior Project Manager"
      );

      // Step 8: Create another user to test role assignment preservation
      const secondUserRes = await request(app)
        .post("/api/users")
        .send({
          name: "Bob Smith",
          job: "Project Manager",
          role_id: roleId,
        })
        .expect(201);

      const secondUserId = secondUserRes.body.id;

      // Step 9: Deactivate the role
      const deactivateRes = await request(app)
        .delete(`/api/roles/${roleId}`)
        .expect(200);

      expect(deactivateRes.body.data).toHaveProperty("is_active", 0);

      // Step 10: Verify role no longer appears in active roles list
      const activeRolesRes = await request(app).get("/api/roles").expect(200);

      const deactivatedRole = activeRolesRes.body.data.find(
        (role) => role.id === roleId
      );
      expect(deactivatedRole).toBeUndefined();

      // Step 11: Verify role is still accessible by direct ID
      const directRoleRes = await request(app)
        .get(`/api/roles/${roleId}`)
        .expect(200);

      expect(directRoleRes.body.data).toHaveProperty("is_active", 0);

      // Step 12: Verify existing users still have the role assigned
      const finalUserRes = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(finalUserRes.body.data).toHaveProperty("role_id", roleId);

      const secondFinalUserRes = await request(app)
        .get(`/api/users/${secondUserId}`)
        .expect(200);

      expect(secondFinalUserRes.body.data).toHaveProperty("role_id", roleId);

      // Step 13: Verify new users cannot be assigned the deactivated role
      const newUserRes = await request(app)
        .post("/api/users")
        .send({
          name: "Charlie Brown",
          job: "Project Manager",
          role_id: roleId,
        })
        .expect(400);

      expect(newUserRes.body).toHaveProperty(
        "error",
        "Invalid role_id provided"
      );

      // Cleanup
      await request(app).delete(`/api/users/${userId}`);
      await request(app).delete(`/api/users/${secondUserId}`);
      await new Promise((resolve) => {
        db.run("DELETE FROM roles WHERE id = ?", [roleId], resolve);
      });
    });
  });

  describe("Role Conflict Resolution Workflow", () => {
    let roleId1, roleId2;

    afterEach(async () => {
      // Clean up test roles
      if (roleId1) {
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [roleId1], () => {
            roleId1 = null;
            resolve();
          });
        });
      }
      if (roleId2) {
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [roleId2], () => {
            roleId2 = null;
            resolve();
          });
        });
      }
    });

    it("should handle role name conflicts during creation and updates", async () => {
      // Step 1: Create first role
      const role1Res = await request(app)
        .post("/api/roles")
        .send({
          name: "Team Lead",
          description: "Leads a development team",
        })
        .expect(201);

      roleId1 = role1Res.body.data.id;

      // Step 2: Try to create role with same name (should fail)
      const duplicateRes = await request(app)
        .post("/api/roles")
        .send({
          name: "Team Lead",
          description: "Another team lead role",
        })
        .expect(409);

      expect(duplicateRes.body).toHaveProperty(
        "error",
        "A role with this name already exists"
      );

      // Step 3: Try to create role with same name but different case (should fail)
      const caseInsensitiveRes = await request(app)
        .post("/api/roles")
        .send({
          name: "TEAM LEAD",
          description: "Case insensitive duplicate",
        })
        .expect(409);

      expect(caseInsensitiveRes.body).toHaveProperty(
        "error",
        "A role with this name already exists"
      );

      // Step 4: Create second role with different name
      const role2Res = await request(app)
        .post("/api/roles")
        .send({
          name: "Technical Lead",
          description: "Provides technical guidance",
        })
        .expect(201);

      roleId2 = role2Res.body.data.id;

      // Step 5: Try to update second role to have same name as first (should fail)
      const updateConflictRes = await request(app)
        .put(`/api/roles/${roleId2}`)
        .send({
          name: "Team Lead",
          description: "Updated description",
        })
        .expect(409);

      expect(updateConflictRes.body).toHaveProperty(
        "error",
        "A role with this name already exists"
      );

      // Step 6: Update second role to same name with different case (should fail)
      const updateCaseRes = await request(app)
        .put(`/api/roles/${roleId2}`)
        .send({
          name: "team lead",
          description: "Updated description",
        })
        .expect(409);

      expect(updateCaseRes.body).toHaveProperty(
        "error",
        "A role with this name already exists"
      );

      // Step 7: Update role to same name (no change) should succeed
      const noChangeRes = await request(app)
        .put(`/api/roles/${roleId1}`)
        .send({
          name: "Team Lead",
          description: "Updated description for same role",
        })
        .expect(200);

      expect(noChangeRes.body.data).toHaveProperty("name", "Team Lead");
      expect(noChangeRes.body.data).toHaveProperty(
        "description",
        "Updated description for same role"
      );

      // Step 8: Update role to unique name should succeed
      const validUpdateRes = await request(app)
        .put(`/api/roles/${roleId2}`)
        .send({
          name: "Senior Technical Lead",
          description: "Senior technical guidance role",
        })
        .expect(200);

      expect(validUpdateRes.body.data).toHaveProperty(
        "name",
        "Senior Technical Lead"
      );
    });
  });

  describe("Multi-User Role Assignment Workflow", () => {
    let roleId;
    let userIds = [];

    beforeEach(async () => {
      // Create a test role
      const roleRes = await request(app)
        .post("/api/roles")
        .send({
          name: "QA Engineer",
          description: "Quality assurance engineer",
        })
        .expect(201);

      roleId = roleRes.body.data.id;
    });

    afterEach(async () => {
      // Clean up users
      for (const userId of userIds) {
        await request(app).delete(`/api/users/${userId}`);
      }
      userIds = [];

      // Clean up role
      if (roleId) {
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [roleId], resolve);
        });
        roleId = null;
      }
    });

    it("should handle multiple users with same role and role transitions", async () => {
      // Step 1: Create multiple users with the same role
      const userNames = ["Alice QA", "Bob QA", "Charlie QA"];

      for (const name of userNames) {
        const userRes = await request(app)
          .post("/api/users")
          .send({
            name: name,
            job: "QA Engineer",
            role_id: roleId,
          })
          .expect(201);

        userIds.push(userRes.body.id);
      }

      // Step 2: Verify all users have the correct role
      for (const userId of userIds) {
        const userRes = await request(app)
          .get(`/api/users/${userId}`)
          .expect(200);

        expect(userRes.body.data).toHaveProperty("role_id", roleId);
        expect(userRes.body.data.role).toHaveProperty("name", "QA Engineer");
      }

      // Step 3: Filter users by role and verify count
      const filteredRes = await request(app)
        .get(`/api/users?role=${roleId}`)
        .expect(200);

      expect(filteredRes.body.data).toHaveLength(3);
      expect(filteredRes.body.total).toBe(3);

      // Step 4: Change one user's role to Admin
      const roleChangeRes = await request(app)
        .put(`/api/users/${userIds[0]}`)
        .send({ role_id: 2 }) // Admin role
        .expect(200);

      // Step 5: Verify filtered results are updated
      const updatedFilterRes = await request(app)
        .get(`/api/users?role=${roleId}`)
        .expect(200);

      expect(updatedFilterRes.body.data).toHaveLength(2);
      expect(updatedFilterRes.body.total).toBe(2);

      // Step 6: Verify the changed user has new role
      const changedUserRes = await request(app)
        .get(`/api/users/${userIds[0]}`)
        .expect(200);

      expect(changedUserRes.body.data).toHaveProperty("role_id", 2);
      expect(changedUserRes.body.data.role).toHaveProperty("name", "Admin");

      // Step 7: Update the role name and verify all remaining users see the change
      await request(app)
        .put(`/api/roles/${roleId}`)
        .send({
          name: "Senior QA Engineer",
          description: "Senior quality assurance engineer",
        })
        .expect(200);

      // Step 8: Verify remaining users have updated role name
      for (let i = 1; i < userIds.length; i++) {
        const userRes = await request(app)
          .get(`/api/users/${userIds[i]}`)
          .expect(200);

        expect(userRes.body.data.role).toHaveProperty(
          "name",
          "Senior QA Engineer"
        );
      }

      // Step 9: Deactivate role and verify users retain assignments
      await request(app).delete(`/api/roles/${roleId}`).expect(200);

      for (let i = 1; i < userIds.length; i++) {
        const userRes = await request(app)
          .get(`/api/users/${userIds[i]}`)
          .expect(200);

        expect(userRes.body.data).toHaveProperty("role_id", roleId);
        expect(userRes.body.data.role).toHaveProperty("is_active", 0);
      }

      // Step 10: Verify no new users can be assigned the deactivated role
      const newUserRes = await request(app)
        .post("/api/users")
        .send({
          name: "David QA",
          job: "QA Engineer",
          role_id: roleId,
        })
        .expect(400);

      expect(newUserRes.body).toHaveProperty(
        "error",
        "Invalid role_id provided"
      );
    });
  });

  describe("Error Recovery Workflow", () => {
    let roleId;
    let userId;

    afterEach(async () => {
      // Clean up
      if (userId) {
        await request(app).delete(`/api/users/${userId}`);
        userId = null;
      }
      if (roleId) {
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [roleId], resolve);
        });
        roleId = null;
      }
    });

    it("should handle error scenarios gracefully and maintain data integrity", async () => {
      // Step 1: Create a role successfully
      const roleRes = await request(app)
        .post("/api/roles")
        .send({
          name: "Data Analyst",
          description: "Analyzes business data",
        })
        .expect(201);

      roleId = roleRes.body.data.id;

      // Step 2: Try to create user with invalid role (should fail gracefully)
      const invalidRoleRes = await request(app)
        .post("/api/users")
        .send({
          name: "Invalid User",
          job: "Analyst",
          role_id: 99999,
        })
        .expect(400);

      expect(invalidRoleRes.body).toHaveProperty(
        "error",
        "Invalid role_id provided"
      );

      // Step 3: Create user with valid role
      const userRes = await request(app)
        .post("/api/users")
        .send({
          name: "Valid User",
          job: "Data Analyst",
          role_id: roleId,
        })
        .expect(201);

      userId = userRes.body.id;

      // Step 4: Try to update user with invalid role (should fail gracefully)
      const invalidUpdateRes = await request(app)
        .put(`/api/users/${userId}`)
        .send({ role_id: 99999 })
        .expect(400);

      expect(invalidUpdateRes.body).toHaveProperty(
        "error",
        "Invalid role_id provided"
      );

      // Step 5: Verify user still has original role after failed update
      const userCheckRes = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(userCheckRes.body.data).toHaveProperty("role_id", roleId);

      // Step 6: Try to update non-existent role (should fail gracefully)
      const nonExistentRoleRes = await request(app)
        .put("/api/roles/99999")
        .send({
          name: "Non-existent Role",
          description: "This should fail",
        })
        .expect(404);

      expect(nonExistentRoleRes.body).toHaveProperty("error", "Role not found");

      // Step 7: Try to deactivate non-existent role (should fail gracefully)
      const deactivateNonExistentRes = await request(app)
        .delete("/api/roles/99999")
        .expect(404);

      expect(deactivateNonExistentRes.body).toHaveProperty(
        "error",
        "Role not found"
      );

      // Step 8: Try to deactivate default User role (should fail gracefully)
      const deactivateDefaultRes = await request(app)
        .delete("/api/roles/1")
        .expect(400);

      expect(deactivateDefaultRes.body).toHaveProperty(
        "error",
        "Cannot deactivate the default User role"
      );

      // Step 9: Try to deactivate already deactivated role
      await request(app).delete(`/api/roles/${roleId}`).expect(200);

      const deactivateAgainRes = await request(app)
        .delete(`/api/roles/${roleId}`)
        .expect(400);

      expect(deactivateAgainRes.body).toHaveProperty(
        "error",
        "Role is already deactivated"
      );

      // Step 10: Verify data integrity - user still exists with deactivated role
      const finalUserRes = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(finalUserRes.body.data).toHaveProperty("role_id", roleId);
      expect(finalUserRes.body.data.role).toHaveProperty("is_active", 0);
    });
  });

  describe("Pagination and Filtering Workflow", () => {
    let testRoleIds = [];
    let testUserIds = [];

    beforeEach(async () => {
      // Create multiple test roles
      const roleNames = [
        "Developer",
        "Designer",
        "Product Manager",
        "DevOps Engineer",
      ];

      for (const name of roleNames) {
        const roleRes = await request(app)
          .post("/api/roles")
          .send({
            name: name,
            description: `${name} role for testing`,
          })
          .expect(201);

        testRoleIds.push(roleRes.body.data.id);
      }

      // Create users with different roles
      const userData = [
        {
          name: "Dev User 1",
          job: "Frontend Developer",
          role_id: testRoleIds[0],
        },
        {
          name: "Dev User 2",
          job: "Backend Developer",
          role_id: testRoleIds[0],
        },
        { name: "Design User 1", job: "UI Designer", role_id: testRoleIds[1] },
        { name: "Design User 2", job: "UX Designer", role_id: testRoleIds[1] },
        { name: "PM User", job: "Product Manager", role_id: testRoleIds[2] },
        {
          name: "DevOps User",
          job: "DevOps Engineer",
          role_id: testRoleIds[3],
        },
      ];

      for (const user of userData) {
        const userRes = await request(app)
          .post("/api/users")
          .send(user)
          .expect(201);

        testUserIds.push(userRes.body.id);
      }
    });

    afterEach(async () => {
      // Clean up users
      for (const userId of testUserIds) {
        await request(app).delete(`/api/users/${userId}`);
      }
      testUserIds = [];

      // Clean up roles
      for (const roleId of testRoleIds) {
        await new Promise((resolve) => {
          db.run("DELETE FROM roles WHERE id = ?", [roleId], resolve);
        });
      }
      testRoleIds = [];
    });

    it("should handle complex filtering and pagination scenarios", async () => {
      // Step 1: Test role filtering with different roles
      const devUsersRes = await request(app)
        .get(`/api/users?role=${testRoleIds[0]}`)
        .expect(200);

      expect(devUsersRes.body.data).toHaveLength(2);
      expect(devUsersRes.body.total).toBe(2);

      const designUsersRes = await request(app)
        .get(`/api/users?role=${testRoleIds[1]}`)
        .expect(200);

      expect(designUsersRes.body.data).toHaveLength(2);
      expect(designUsersRes.body.total).toBe(2);

      // Step 2: Test pagination with role filtering
      const paginatedRes = await request(app)
        .get(`/api/users?role=${testRoleIds[0]}&page=1&per_page=1`)
        .expect(200);

      expect(paginatedRes.body.data).toHaveLength(1);
      expect(paginatedRes.body.total).toBe(2);
      expect(paginatedRes.body.total_pages).toBe(2);
      expect(paginatedRes.body.page).toBe(1);
      expect(paginatedRes.body.per_page).toBe(1);

      // Step 3: Test second page
      const secondPageRes = await request(app)
        .get(`/api/users?role=${testRoleIds[0]}&page=2&per_page=1`)
        .expect(200);

      expect(secondPageRes.body.data).toHaveLength(1);
      expect(secondPageRes.body.page).toBe(2);

      // Step 4: Deactivate a role and test filtering
      await request(app).delete(`/api/roles/${testRoleIds[2]}`).expect(200);

      // Users with deactivated role should still appear in filtered results
      const deactivatedRoleUsersRes = await request(app)
        .get(`/api/users?role=${testRoleIds[2]}`)
        .expect(200);

      expect(deactivatedRoleUsersRes.body.data).toHaveLength(1);
      expect(deactivatedRoleUsersRes.body.data[0].role).toHaveProperty(
        "is_active",
        0
      );

      // Step 5: Test filtering with non-existent role
      const nonExistentRoleRes = await request(app)
        .get("/api/users?role=99999")
        .expect(200);

      expect(nonExistentRoleRes.body.data).toHaveLength(0);
      expect(nonExistentRoleRes.body.total).toBe(0);

      // Step 6: Test all users without filtering (should include all test users)
      const allUsersRes = await request(app).get("/api/users").expect(200);

      // Should include our test users plus any existing users
      expect(allUsersRes.body.total).toBeGreaterThanOrEqual(6);

      // Step 7: Test role list includes all active roles
      const activeRolesRes = await request(app).get("/api/roles").expect(200);

      const activeTestRoles = activeRolesRes.body.data.filter(
        (role) => testRoleIds.includes(role.id) && role.is_active
      );
      expect(activeTestRoles).toHaveLength(3); // One was deactivated

      // Step 8: Test role list with all=true includes deactivated roles
      const allRolesRes = await request(app)
        .get("/api/roles?all=true")
        .expect(200);

      const allTestRoles = allRolesRes.body.data.filter((role) =>
        testRoleIds.includes(role.id)
      );
      expect(allTestRoles).toHaveLength(4); // All roles including deactivated
    });
  });
});
