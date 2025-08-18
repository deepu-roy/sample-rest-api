const express = require("express");
const app = express();

// Add body parser middleware
app.use(express.json());

// Simple test routes
app.get("/test", (req, res) => {
  res.json({ message: "GET works" });
});

app.post("/test", (req, res) => {
  res.json({ message: "POST works", body: req.body });
});

// Import and use the roles router
const rolesRouter = require("./routes/roles");
app.use("/api/roles", rolesRouter);

// List all registered routes
app._router.stack.forEach(function (r) {
  if (r.route && r.route.path) {
    console.log("Route:", r.route.path, Object.keys(r.route.methods));
  } else if (r.name === "router") {
    r.handle.stack.forEach(function (rr) {
      if (rr.route) {
        console.log(
          "Nested route:",
          rr.route.path,
          Object.keys(rr.route.methods)
        );
      }
    });
  }
});

const port = 3001;
app.listen(port, () => {
  console.log(`Debug server running on port ${port}`);
});
