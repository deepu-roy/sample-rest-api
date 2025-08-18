const request = require("supertest");
const app = require("./server");

async function testRoleEndpoints() {
  console.log("Testing role endpoints...");

  try {
    // Test GET /api/roles
    console.log("1. Testing GET /api/roles");
    const getRes = await request(app).get("/api/roles");
    console.log("GET /api/roles status:", getRes.status);
    console.log(
      "GET /api/roles response:",
      JSON.stringify(getRes.body, null, 2)
    );

    // Test POST /api/roles
    console.log("\n2. Testing POST /api/roles");
    const postRes = await request(app)
      .post("/api/roles")
      .send({ name: "Test Role", description: "Test description" });
    console.log("POST /api/roles status:", postRes.status);
    console.log(
      "POST /api/roles response:",
      JSON.stringify(postRes.body, null, 2)
    );

    if (postRes.status === 201) {
      const roleId = postRes.body.data.id;

      // Test PUT /api/roles/:id
      console.log("\n3. Testing PUT /api/roles/" + roleId);
      const putRes = await request(app)
        .put(`/api/roles/${roleId}`)
        .send({
          name: "Updated Test Role",
          description: "Updated description",
        });
      console.log("PUT /api/roles status:", putRes.status);
      console.log(
        "PUT /api/roles response:",
        JSON.stringify(putRes.body, null, 2)
      );

      // Test DELETE /api/roles/:id
      console.log("\n4. Testing DELETE /api/roles/" + roleId);
      const deleteRes = await request(app).delete(`/api/roles/${roleId}`);
      console.log("DELETE /api/roles status:", deleteRes.status);
      console.log(
        "DELETE /api/roles response:",
        JSON.stringify(deleteRes.body, null, 2)
      );
    }
  } catch (error) {
    console.error("Error testing endpoints:", error);
  }

  process.exit(0);
}

testRoleEndpoints();
