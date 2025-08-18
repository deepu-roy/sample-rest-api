import config from "./config.js";

let currentEditingRole = null;

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  loadRoles();
  setupEventListeners();
});

function setupEventListeners() {
  // Form submission
  document.getElementById("roleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveRole();
  });

  // Modal cleanup on close
  document
    .getElementById("roleModal")
    .addEventListener("hidden.bs.modal", () => {
      resetForm();
    });
}

async function loadRoles() {
  try {
    showApiStatus("Loading roles...");
    const response = await fetch(
      `${config.api.url}${config.endpoints.roles}?all=true`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const response_data = await response.json();
    const roles = response_data.data || response_data;
    renderRoles(roles);
    hideApiStatus();
  } catch (error) {
    console.error("Error fetching roles:", error);
    showMessage("Error loading roles. Please try again.", "danger");
    hideApiStatus();
  }
}

function renderRoles(roles) {
  const tbody = document.getElementById("rolesTableBody");
  tbody.innerHTML = "";

  if (!roles || roles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No roles found</td>
      </tr>
    `;
    return;
  }

  roles.forEach((role) => {
    const row = document.createElement("tr");

    const statusBadge = role.is_active
      ? '<span class="badge bg-success">Active</span>'
      : '<span class="badge bg-secondary">Inactive</span>';

    const createdDate = role.created_at
      ? new Date(role.created_at).toLocaleDateString()
      : "N/A";

    row.innerHTML = `
      <td>${role.id}</td>
      <td><strong>${escapeHtml(role.name)}</strong></td>
      <td>${escapeHtml(role.description || "No description")}</td>
      <td>${statusBadge}</td>
      <td>${createdDate}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-2" onclick="editRole(${
          role.id
        })" title="Edit Role">
          ✏️ Edit
        </button>
        ${
          role.is_active
            ? `
          <button class="btn btn-sm btn-outline-danger" onclick="confirmDeactivateRole(${
            role.id
          }, '${escapeHtml(role.name)}')" title="Deactivate Role">
            🚫 Deactivate
          </button>
        `
            : ""
        }
      </td>
    `;
    tbody.appendChild(row);
  });
}

function openCreateRoleModal() {
  currentEditingRole = null;
  document.getElementById("roleModalLabel").textContent = "Create New Role";
  document.getElementById("saveRoleBtn").textContent = "Create Role";
  resetForm();
}

async function editRole(roleId) {
  try {
    // Fetch the specific role data from the API
    const response = await fetch(
      `${config.api.url}${config.endpoints.roles}/${roleId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const response_data = await response.json();
    const role = response_data.data || response_data;

    currentEditingRole = {
      id: role.id,
      name: role.name,
      description: role.description || "",
    };

    // Populate the form
    document.getElementById("roleId").value = role.id;
    document.getElementById("roleName").value = role.name;
    document.getElementById("roleDescription").value = role.description || "";

    // Update modal title and button
    document.getElementById("roleModalLabel").textContent = "Edit Role";
    document.getElementById("saveRoleBtn").textContent = "Update Role";

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById("roleModal"));
    modal.show();
  } catch (error) {
    console.error("Error fetching role for editing:", error);
    showMessage("Error loading role data. Please try again.", "danger");
  }
}

async function saveRole() {
  const form = document.getElementById("roleForm");
  const formData = new FormData(form);

  const roleData = {
    name: formData.get("roleName").trim(),
    description: formData.get("roleDescription").trim(),
  };

  // Validate form
  if (!validateRoleForm(roleData)) {
    return;
  }

  const isEditing = currentEditingRole !== null;
  const url = isEditing
    ? `${config.api.url}${config.endpoints.roles}/${currentEditingRole.id}`
    : `${config.api.url}${config.endpoints.roles}`;

  const method = isEditing ? "PUT" : "POST";

  try {
    // Disable save button during request
    const saveBtn = document.getElementById("saveRoleBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = isEditing ? "Updating..." : "Creating...";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(roleData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    // Success
    const action = isEditing ? "updated" : "created";
    showMessage(`Role "${roleData.name}" ${action} successfully!`, "success");

    // Close modal and reload roles
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("roleModal")
    );
    modal.hide();
    loadRoles();
  } catch (error) {
    console.error(`Error ${isEditing ? "updating" : "creating"} role:`, error);
    showMessage(
      error.message ||
        `Error ${isEditing ? "updating" : "creating"} role. Please try again.`,
      "danger"
    );
  } finally {
    // Re-enable save button
    const saveBtn = document.getElementById("saveRoleBtn");
    saveBtn.disabled = false;
    saveBtn.textContent = isEditing ? "Update Role" : "Create Role";
  }
}

function validateRoleForm(roleData) {
  let isValid = true;

  // Clear previous errors
  clearFormErrors();

  // Validate role name
  if (!roleData.name) {
    showFieldError("roleName", "Role name is required");
    isValid = false;
  } else if (roleData.name.length > 50) {
    showFieldError("roleName", "Role name must be 50 characters or less");
    isValid = false;
  }

  // Validate description length
  if (roleData.description && roleData.description.length > 255) {
    showFieldError(
      "roleDescription",
      "Description must be 255 characters or less"
    );
    isValid = false;
  }

  return isValid;
}

function clearFormErrors() {
  const errorElements = document.querySelectorAll(".invalid-feedback");
  errorElements.forEach((el) => (el.textContent = ""));

  const inputElements = document.querySelectorAll(".form-control");
  inputElements.forEach((el) => el.classList.remove("is-invalid"));
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(fieldId + "Error");

  field.classList.add("is-invalid");
  errorElement.textContent = message;
}

function confirmDeactivateRole(roleId, roleName) {
  document.getElementById("deactivateRoleName").textContent = roleName;

  // Set up the confirm button
  const confirmBtn = document.getElementById("confirmDeactivateBtn");
  confirmBtn.onclick = () => deactivateRole(roleId, roleName);

  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById("deactivateModal"));
  modal.show();
}

async function deactivateRole(roleId, roleName) {
  try {
    // Disable confirm button during request
    const confirmBtn = document.getElementById("confirmDeactivateBtn");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Deactivating...";

    const response = await fetch(
      `${config.api.url}${config.endpoints.roles}/${roleId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    // Success
    showMessage(`Role "${roleName}" deactivated successfully!`, "success");

    // Close modal and reload roles
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("deactivateModal")
    );
    modal.hide();
    loadRoles();
  } catch (error) {
    console.error("Error deactivating role:", error);
    showMessage(
      error.message || "Error deactivating role. Please try again.",
      "danger"
    );
  } finally {
    // Re-enable confirm button
    const confirmBtn = document.getElementById("confirmDeactivateBtn");
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Deactivate Role";
  }
}

function resetForm() {
  const form = document.getElementById("roleForm");
  form.reset();
  clearFormErrors();
  currentEditingRole = null;
}

function showMessage(message, type) {
  const container = document.getElementById("messageContainer");
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  container.innerHTML = "";
  container.appendChild(alertDiv);

  // Auto-dismiss success messages after 5 seconds
  if (type === "success") {
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }
}

function showApiStatus(message) {
  const statusDiv = document.getElementById("apiStatus");
  statusDiv.textContent = message;
  statusDiv.classList.remove("d-none");
}

function hideApiStatus() {
  const statusDiv = document.getElementById("apiStatus");
  statusDiv.classList.add("d-none");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Make functions available globally for onclick handlers
window.editRole = editRole;
window.confirmDeactivateRole = confirmDeactivateRole;
window.openCreateRoleModal = openCreateRoleModal;
window.saveRole = saveRole;
