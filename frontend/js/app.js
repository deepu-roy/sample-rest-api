import config from "./config.js";

let currentPage = 1;
const perPage = 6;

// Check API connection on load
async function checkApiConnection() {
  const statusEl = document.getElementById("apiStatus");
  statusEl.classList.remove("d-none");

  try {
    const response = await fetch(`${config.api.url}${config.endpoints.health}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    if (data.status === "healthy") {
      statusEl.classList.replace("alert-info", "alert-success");
      statusEl.textContent = "Connected to API successfully!";
      setTimeout(() => statusEl.classList.add("d-none"), 3000);
      return true;
    } else {
      throw new Error("API reported non-healthy status");
    }
  } catch (error) {
    statusEl.classList.replace("alert-info", "alert-danger");
    statusEl.textContent = `Error connecting to API at ${config.api.url}: ${error.message}`;
    return false;
  }
}

async function init() {
  const isConnected = await checkApiConnection();
  if (isConnected) {
    fetchUsers(currentPage);
  }
}

async function fetchUsers(page = 1) {
  try {
    const response = await fetch(
      `${config.api.url}${config.endpoints.users}?page=${page}&per_page=${perPage}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    renderUsers(data);
    renderPagination(data);
  } catch (error) {
    console.error("Error fetching users:", error);
    document.getElementById("errorAlert")?.remove();
    const alert = document.createElement("div");
    alert.id = "errorAlert";
    alert.className = "alert alert-danger";
    alert.textContent = `Error loading users: ${error.message}. API URL: ${config.api.url}`;
    document
      .querySelector(".container")
      .insertBefore(alert, document.querySelector(".table-responsive"));
  }
}

function renderUsers(data) {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = "";

  data.data.forEach((user) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${user.id}</td>
            <td><img src="${user.avatar}" alt="${
      user.first_name
    }" class="user-avatar"></td>
            <td>${user.first_name} ${user.last_name}</td>
            <td>${user.email}</td>
            <td>${user.job || "N/A"}</td>            <td>
                <i class="btn-delete" data-user-id="${
                  user.id
                }" style="cursor: pointer;">🗑️</i>
            </td>
        `;
    tbody.appendChild(row);
  });
}

function renderPagination(data) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  // Previous button
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `
        <a class="page-link" href="#" data-page="${
          currentPage - 1
        }" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
  pagination.appendChild(prevLi);

  // Page numbers
  for (let i = 1; i <= data.total_pages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;
    li.innerHTML = `
            <a class="page-link" href="#" data-page="${i}">${i}</a>
        `;
    pagination.appendChild(li);
  }

  // Next button
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${
    currentPage === data.total_pages ? "disabled" : ""
  }`;
  nextLi.innerHTML = `
        <a class="page-link" href="#" data-page="${
          currentPage + 1
        }" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
  pagination.appendChild(nextLi);
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) {
    return;
  }

  try {
    const response = await fetch(
      `${config.api.url}${config.endpoints.users}/${id}`,
      {
        method: "DELETE",
      }
    );

    if (response.status === 204) {
      // Refresh the current page
      fetchUsers(currentPage);
    } else {
      throw new Error("Failed to delete user");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    alert("Error deleting user. Please try again.");
  }
}

function changePage(page) {
  if (page < 1) return;
  currentPage = page;
  fetchUsers(page);
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  init();

  // Add global event listeners
  document.addEventListener("click", (e) => {
    // Handle delete buttons
    if (e.target.classList.contains("btn-delete")) {
      const userId = e.target.dataset.userId;
      if (userId) {
        deleteUser(parseInt(userId));
      }
    }

    // Handle pagination clicks
    if (e.target.classList.contains("page-link")) {
      e.preventDefault();
      const page = parseInt(e.target.dataset.page);
      if (!isNaN(page) && page >= 1) {
        changePage(page);
      }
    }
  });
});
