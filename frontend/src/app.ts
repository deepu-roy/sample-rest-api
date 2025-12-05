import config from './config.js';
import { PaginatedUsersResponse, User, HealthResponse } from './types/index.js';

let currentPage = 1;
const perPage = 6;

// Check API connection on load
async function checkApiConnection(): Promise<boolean> {
    const statusEl = document.getElementById('apiStatus');
    if (!statusEl) return false;

    statusEl.classList.remove('hidden');

    try {
        const response = await fetch(`${config.api.url}${config.endpoints.health}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: HealthResponse = await response.json();

        if (data.status === 'healthy') {
            statusEl.className =
                'mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg shadow-sm';
            statusEl.innerHTML =
                '<div class="flex items-center"><svg class="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>Connected to API successfully!</div>';
            setTimeout(() => statusEl.classList.add('hidden'), 3000);
            return true;
        } else {
            throw new Error('API reported non-healthy status');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        statusEl.className =
            'mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm';
        statusEl.innerHTML = `<div class="flex items-center"><svg class="w-5 h-5 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>Error connecting to API at ${config.api.url}: ${errorMessage}</div>`;
        return false;
    }
}

async function init(): Promise<void> {
    const isConnected = await checkApiConnection();
    if (isConnected) {
        await fetchUsers(currentPage);
    }
}

async function fetchUsers(page = 1): Promise<void> {
    try {
        const response = await fetch(
            `${config.api.url}${config.endpoints.users}?page=${page}&per_page=${perPage}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: PaginatedUsersResponse = await response.json();
        renderUsers(data);
        renderPagination(data);
    } catch (error) {
        console.error('Error fetching users:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        document.getElementById('errorAlert')?.remove();
        const alert = document.createElement('div');
        alert.id = 'errorAlert';
        alert.className =
            'mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm';
        alert.innerHTML = `<div class="flex items-center"><svg class="w-5 h-5 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>Error loading users: ${errorMessage}. API URL: ${config.api.url}</div>`;
        const mainEl = document.querySelector('main');
        const bgWhiteEl = document.querySelector('.bg-white');
        if (mainEl && bgWhiteEl) {
            mainEl.insertBefore(alert, bgWhiteEl);
        }
    }
}

function renderUsers(data: PaginatedUsersResponse): void {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    data.data.forEach((user: User) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-blue-50 transition-colors duration-150';

        const roleClass = user.role ? `role-${user.role.name.toLowerCase()}` : 'role-user';
        const roleName = user.role ? user.role.name : 'User';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.id}</td>
            <td class="px-6 py-4 whitespace-nowrap"><img src="${user.avatar}" alt="${user.first_name}" class="user-avatar"></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.first_name} ${user.last_name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${user.job || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="role-badge ${roleClass}">${roleName}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                    <a href="edit-user.html?id=${user.id}" class="btn-edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                    </a>
                    <button class="btn-delete" data-user-id="${user.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderPagination(data: PaginatedUsersResponse): void {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    pagination.innerHTML = '';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`;
    prevBtn.disabled = currentPage === 1;
    prevBtn.dataset.page = String(currentPage - 1);
    prevBtn.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
  `;
    pagination.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= data.total_pages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.dataset.page = String(i);
        pageBtn.textContent = String(i);
        pagination.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn ${currentPage === data.total_pages ? 'opacity-50 cursor-not-allowed' : ''}`;
    nextBtn.disabled = currentPage === data.total_pages;
    nextBtn.dataset.page = String(currentPage + 1);
    nextBtn.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  `;
    pagination.appendChild(nextBtn);
}

async function deleteUser(id: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    try {
        const response = await fetch(`${config.api.url}${config.endpoints.users}/${id}`, {
            method: 'DELETE',
        });

        if (response.status === 204) {
            // Refresh the current page
            await fetchUsers(currentPage);
        } else {
            throw new Error('Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
    }
}

function changePage(page: number): void {
    if (page < 1) return;
    currentPage = page;
    void fetchUsers(page);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    void init();

    // Add global event listeners
    document.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        // Handle delete buttons
        const deleteBtn = target.closest('.btn-delete') as HTMLButtonElement | null;
        if (deleteBtn) {
            const userId = deleteBtn.dataset.userId;
            if (userId) {
                void deleteUser(parseInt(userId));
            }
            return;
        }

        // Handle pagination clicks
        if (target.classList.contains('pagination-btn') || target.closest('.pagination-btn')) {
            e.preventDefault();
            const button = (
                target.classList.contains('pagination-btn')
                    ? target
                    : target.closest('.pagination-btn')
            ) as HTMLButtonElement;
            if (button && !button.disabled) {
                const page = parseInt(button.dataset.page || '0');
                if (!isNaN(page) && page >= 1) {
                    changePage(page);
                }
            }
        }
    });
});
