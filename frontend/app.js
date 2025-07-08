import config from "./config.js";

let currentPage = 1;
const perPage = 6;

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
    const data = await response.json();
    renderUsers(data);
    renderPagination(data);
  } catch (error) {
    console.error("Error fetching users:", error);
    alert("Error loading users. Please try again.");
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
            <td>${user.job || "N/A"}</td>
            <td>
                <i class="btn-delete" onclick="deleteUser(${user.id})">🗑️</i>
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
        <a class="page-link" href="#" onclick="changePage(${
          currentPage - 1
        })" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
  pagination.appendChild(prevLi);

  // Page numbers
  for (let i = 1; i <= data.total_pages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;
    li.innerHTML = `
            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        `;
    pagination.appendChild(li);
  }

  // Next button
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${
    currentPage === data.total_pages ? "disabled" : ""
  }`;
  nextLi.innerHTML = `
        <a class="page-link" href="#" onclick="changePage(${
          currentPage + 1
        })" aria-label="Next">
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
      `${config.apiUrl}${config.endpoints.users}/${id}`,
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

// Load initial data
document.addEventListener("DOMContentLoaded", () => {
  fetchUsers(currentPage);
});
