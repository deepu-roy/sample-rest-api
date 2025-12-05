import config from "./config.js";

const createRoleForm = document.getElementById("createRoleForm");
const apiStatus = document.getElementById("apiStatus");
const messageContainer = document.getElementById("messageContainer");

// Show API connection status
function showApiStatus() {
    apiStatus.classList.remove("hidden");
}

// Hide API connection status
function hideApiStatus() {
    apiStatus.classList.add("hidden");
}

// Show message
function showMessage(message, type = "success") {
    const bgColor = type === "success" ? "bg-green-50" : "bg-red-50";
    const borderColor =
        type === "success" ? "border-green-500" : "border-red-500";
    const textColor = type === "success" ? "text-green-700" : "text-red-700";

    messageContainer.innerHTML = `
    <div class="mb-6 p-4 ${bgColor} border-l-4 ${borderColor} ${textColor} rounded-r-lg shadow-sm">
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${type === "success"
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />'
        }
        </svg>
        ${message}
      </div>
    </div>
  `;

    // Scroll to top to show message
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Auto-hide success messages after 3 seconds
    if (type === "success") {
        setTimeout(() => {
            messageContainer.innerHTML = "";
        }, 3000);
    }
}

// Handle form submission
createRoleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const roleName = document.getElementById("roleName").value.trim();
    const roleDescription = document
        .getElementById("roleDescription")
        .value.trim();

    // Validation
    if (!roleName) {
        showMessage("Role name is required", "error");
        return;
    }

    if (roleName.length > 50) {
        showMessage("Role name must be 50 characters or less", "error");
        return;
    }

    if (roleDescription.length > 255) {
        showMessage("Description must be 255 characters or less", "error");
        return;
    }

    try {
        showApiStatus();

        const response = await fetch(`${config.api.url}${config.endpoints.roles}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: roleName,
                description: roleDescription || null,
            }),
        });

        hideApiStatus();

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create role");
        }

        const data = await response.json();

        showMessage("Role created successfully!", "success");

        // Redirect to roles page after a short delay
        setTimeout(() => {
            window.location.href = "roles.html";
        }, 1500);
    } catch (error) {
        hideApiStatus();
        console.error("Error creating role:", error);
        showMessage(error.message || "Failed to create role", "error");
    }
});

// Check API connection on page load
async function checkApiConnection() {
    try {
        showApiStatus();
        const response = await fetch(`${config.api.url}/health`);

        if (!response.ok) {
            throw new Error("API is not responding");
        }

        hideApiStatus();
    } catch (error) {
        console.error("API connection error:", error);
        showMessage(
            "Warning: Unable to connect to API. Please ensure the backend is running.",
            "error"
        );
    }
}

// Initialize
checkApiConnection();
