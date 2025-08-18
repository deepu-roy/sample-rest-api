const rolesRouter = require("./routes/roles");

console.log("Roles router:", rolesRouter);
console.log("Router stack:", rolesRouter.stack);

// Check if routes are registered
rolesRouter.stack.forEach((layer, index) => {
  console.log(`Route ${index}:`, {
    path: layer.route ? layer.route.path : "no path",
    methods: layer.route ? Object.keys(layer.route.methods) : "no methods",
  });
});
