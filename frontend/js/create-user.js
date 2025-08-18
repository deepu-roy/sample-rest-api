import config from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createUserForm");
  const roleSelect = document.getElementById("role");

  console.log("Config:", config);
  console.log("API URL:", config.api.url);
  console.log("Roles endpoint:", config.endpoints.roles);

  // Load available roles when page loads
  loadRoles();

  async function loadRoles() {
    try {
      console.log(
        "Loading roles from:",
        `${config.api.url}${config.endpoints.roles}`
      );
      const response = await fetch(
        `${config.api.url}${config.endpoints.roles}`
      );

      console.log("Roles response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Roles response data:", result);
        // API returns roles wrapped in a 'data' property
        const roles = result.data || result;
        console.log("Extracted roles:", roles);
        populateRoleSelect(roles);
      } else {
        throw new Error(
          `Failed to load roles: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      // Show error state in role select
      roleSelect.innerHTML = '<option value="">Error loading roles</option>';
      showError("Failed to load roles. Please refresh the page.");
    }
  }

  function populateRoleSelect(roles) {
    // Clear loading message
    roleSelect.innerHTML = "";

    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a role";
    roleSelect.appendChild(defaultOption);

    // Add role options
    roles.forEach((role) => {
      const option = document.createElement("option");
      option.value = role.id;
      option.textContent = role.name;

      // Set default role as selected if it's "User" (typically id: 1)
      if (role.name.toLowerCase() === "user") {
        option.selected = true;
      }

      roleSelect.appendChild(option);
    });
  }

  function showError(message) {
    // Create or update error alert
    let errorAlert = document.getElementById("errorAlert");
    if (!errorAlert) {
      errorAlert = document.createElement("div");
      errorAlert.id = "errorAlert";
      errorAlert.className = "alert alert-danger alert-dismissible fade show";
      errorAlert.innerHTML = `
        <span id="errorMessage"></span>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      form.parentNode.insertBefore(errorAlert, form);
    }

    document.getElementById("errorMessage").textContent = message;
    errorAlert.style.display = "block";
  }

  function hideError() {
    const errorAlert = document.getElementById("errorAlert");
    if (errorAlert) {
      errorAlert.style.display = "none";
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const nameInput = document.getElementById("name");
    const jobInput = document.getElementById("job");
    const roleInput = document.getElementById("role");

    // Validate role selection
    if (!roleInput.value) {
      showError("Please select a role for the user.");
      return;
    }

    const userData = {
      name: nameInput.value,
      job: jobInput.value,
      role_id: parseInt(roleInput.value),
    };

    try {
      const response = await fetch(
        `${config.api.url}${config.endpoints.users}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (response.status === 201) {
        const data = await response.json();
        alert("User created successfully!");
        window.location.href = "index.html";
      } else {
        // Handle different error scenarios
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = "Failed to create user";

        if (response.status === 400) {
          if (errorData.message && errorData.message.includes("role")) {
            errorMessage = "Invalid role selected. Please choose a valid role.";
          } else {
            errorMessage = errorData.message || "Invalid user data provided.";
          }
        } else if (response.status === 404) {
          errorMessage =
            "Selected role not found. Please choose a different role.";
        } else if (response.status >= 500) {
          errorMessage = "Server error occurred. Please try again later.";
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      showError(error.message || "Error creating user. Please try again.");
    }
  });
});
