// Delete require cache to force fresh load
delete require.cache[require.resolve("./server")];
delete require.cache[require.resolve("./routes/roles")];

const request = require("supertest");
const app = require("./server");

async function testRoleEndpoints() {
  console.log("Testing fresh role endpoints...");

  try {
    // Test POST /api/roles
    console.log("Testing POST /api/roles");
    const postRes = await request(app)
      .post("/api/roles")
      .send({ name: "Fresh Test Role", description: "Fresh test description" });
    console.log("POST /api/roles status:", postRes.status);
    console.log(
      "POST /api/roles response:",
      JSON.stringify(postRes.body, null, 2)
    );
  } catch (error) {
    console.error("Error testing endpoints:", error);
  }

  process.exit(0);
}

testRoleEndpoints();
