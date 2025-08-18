import config from "./config.js";

let currentUser = null;
let availableRoles = [];
let originalRoleId = null;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("editUserForm");
  const roleSelect = document.getElementById("role");
  const roleChangeWarning = document.getElementById("roleChangeWarning");

  // Get user ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");

  if (!userId) {
    showError("No user ID provided");
    return;
  }

  // Load user data and roles
  Promise.all([loadUser(userId), loadRoles()])
    .then(() => {
      populateForm();
      showForm();
    })
    .catch((error) => {
      console.error("Error loading data:", error);
      showError(error.message);
    });

  async function loadUser(id) {
    try {
      const response = await fetch(
        `${config.api.url}${config.endpoints.users}/${id}`
      );

      if (response.ok) {
        const result = await response.json();
        console.log("User API response:", result);
        // API returns user wrapped in a 'data' property
        currentUser = result.data || result;
        console.log("Extracted user data:", currentUser);
        originalRoleId =
          currentUser.role_id ||
          (currentUser.role ? currentUser.role.id : null);
        console.log("Original role ID:", originalRoleId);
      } else if (response.status === 404) {
        throw new Error("User not found");
      } else {
        throw new Error("Failed to load user data");
      }
    } catch (error) {
      throw new Error(`Error loading user: ${error.message}`);
    }
  }

  async function loadRoles() {
    try {
      const response = await fetch(
        `${config.api.url}${config.endpoints.roles}`
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Roles API response:", result);
        // API returns roles wrapped in a 'data' property
        availableRoles = result.data || result;
        console.log("Available roles:", availableRoles);
      } else {
        throw new Error("Failed to load roles");
      }
    } catch (error) {
      throw new Error(`Error loading roles: ${error.message}`);
    }
  }

  function populateForm() {
    console.log("Populating form with user:", currentUser);
    console.log("Available roles for select:", availableRoles);

    // Populate user fields
    document.getElementById(
      "name"
    ).value = `${currentUser.first_name} ${currentUser.last_name}`;
    document.getElementById("email").value = currentUser.email;
    document.getElementById("job").value = currentUser.job || "";

    // Populate role select
    populateRoleSelect();

    // Set current role info
    const currentRoleInfo = document.getElementById("currentRoleInfo");
    if (currentUser.role) {
      currentRoleInfo.textContent = `Current role: ${currentUser.role.name}`;
    } else {
      currentRoleInfo.textContent = "Current role: User (default)";
    }
  }

  function populateRoleSelect() {
    console.log("Populating role select with originalRoleId:", originalRoleId);

    // Clear loading message
    roleSelect.innerHTML = "";

    // Add role options
    availableRoles.forEach((role) => {
      const option = document.createElement("option");
      option.value = role.id;
      option.textContent = role.name;

      // Select current role
      if (originalRoleId && role.id === originalRoleId) {
        console.log(
          `Selecting role ${role.name} (ID: ${role.id}) as current role`
        );
        option.selected = true;
      } else if (!originalRoleId && role.name.toLowerCase() === "user") {
        console.log(`Selecting default User role (ID: ${role.id})`);
        option.selected = true;
      }

      roleSelect.appendChild(option);
    });

    console.log("Role select populated, current value:", roleSelect.value);
  }

  function showForm() {
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("editUserForm").style.display = "block";
  }

  function showError(message) {
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("errorMessage").textContent = message;
    document.getElementById("errorState").style.display = "block";
  }

  function showAlert(message, type = "danger") {
    // Remove existing alerts
    const existingAlert = document.querySelector(".alert-dismissible");
    if (existingAlert) {
      existingAlert.remove();
    }

    // Create new alert
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      <span>${message}</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    form.parentNode.insertBefore(alert, form);
  }

  function hideAlert() {
    const alert = document.querySelector(".alert-dismissible");
    if (alert) {
      alert.remove();
    }
  }

  function checkRoleChange() {
    const selectedRoleId = parseInt(roleSelect.value);
    const selectedRole = availableRoles.find(
      (role) => role.id === selectedRoleId
    );
    const originalRole = availableRoles.find(
      (role) => role.id === originalRoleId
    ) || { name: "User" };

    if (selectedRoleId !== originalRoleId) {
      // Show role change warning
      document.getElementById("oldRoleName").textContent = originalRole.name;
      document.getElementById("newRoleName").textContent = selectedRole.name;
      roleChangeWarning.classList.remove("d-none");
    } else {
      // Hide role change warning
      roleChangeWarning.classList.add("d-none");
    }
  }

  // Listen for role changes
  roleSelect.addEventListener("change", checkRoleChange);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const nameInput = document.getElementById("name");
    const jobInput = document.getElementById("job");
    const roleInput = document.getElementById("role");
    const saveButton = document.getElementById("saveButton");

    // Validate role selection
    if (!roleInput.value) {
      showAlert("Please select a role for the user.");
      return;
    }

    // Disable save button during submission
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    const selectedRoleId = parseInt(roleInput.value);
    const isRoleChanged = selectedRoleId !== originalRoleId;

    // Show confirmation for role changes
    if (isRoleChanged) {
      const selectedRole = availableRoles.find(
        (role) => role.id === selectedRoleId
      );
      const originalRole = availableRoles.find(
        (role) => role.id === originalRoleId
      ) || { name: "User" };

      const confirmMessage = `Are you sure you want to change this user's role from "${originalRole.name}" to "${selectedRole.name}"? This will affect their permissions.`;

      if (!confirm(confirmMessage)) {
        // Reset button state
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
        return;
      }
    }

    // Parse name into first and last name
    const nameParts = nameInput.value.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const userData = {
      first_name: firstName,
      last_name: lastName,
      job: jobInput.value,
      role_id: selectedRoleId,
    };

    try {
      const response = await fetch(
        `${config.api.url}${config.endpoints.users}/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (response.ok) {
        const updatedUser = await response.json();

        // Show success message with role change info
        let successMessage = "User updated successfully!";
        if (isRoleChanged) {
          const newRole = availableRoles.find(
            (role) => role.id === selectedRoleId
          );
          successMessage += ` Role changed to ${newRole.name}.`;
        }

        showAlert(successMessage, "success");

        // Update original role ID to prevent duplicate warnings
        originalRoleId = selectedRoleId;

        // Hide role change warning
        roleChangeWarning.classList.add("d-none");

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000);
      } else {
        // Handle different error scenarios
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = "Failed to update user";

        if (response.status === 400) {
          if (errorData.message && errorData.message.includes("role")) {
            errorMessage = "Invalid role selected. Please choose a valid role.";
          } else {
            errorMessage = errorData.message || "Invalid user data provided.";
          }
        } else if (response.status === 404) {
          if (errorData.message && errorData.message.includes("role")) {
            errorMessage =
              "Selected role not found. Please choose a different role.";
          } else {
            errorMessage = "User not found.";
          }
        } else if (response.status >= 500) {
          errorMessage = "Server error occurred. Please try again later.";
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      showAlert(error.message || "Error updating user. Please try again.");
    } finally {
      // Reset button state
      saveButton.disabled = false;
      saveButton.textContent = "Save Changes";
    }
  });
});
