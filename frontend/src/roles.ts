import config from './config.js';
import { Role, RolesResponse } from './types/index.js';

// Modal helper functions
window.closeDeactivateModal = function (): void {
    const modal = document.getElementById('deactivateModal');
    modal?.classList.add('hidden');
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    void loadRoles();
});

async function loadRoles(): Promise<void> {
    try {
        showApiStatus('Loading roles...');
        const response = await fetch(`${config.api.url}${config.endpoints.roles}?all=true`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const response_data: RolesResponse = await response.json();
        const roles = response_data.data || [];
        renderRoles(roles);
        hideApiStatus();
    } catch (error) {
        console.error('Error fetching roles:', error);
        showMessage('Error loading roles. Please try again.', 'danger');
        hideApiStatus();
    }
}

function renderRoles(roles: Role[]): void {
    const tbody = document.getElementById('rolesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!roles || roles.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-500">No roles found</td>
      </tr>
    `;
        return;
    }

    roles.forEach((role) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-blue-50 transition-colors duration-150';

        const statusBadge = role.is_active
            ? '<span class="status-badge-active">Active</span>'
            : '<span class="status-badge-inactive">Inactive</span>';

        const createdDate = role.created_at
            ? new Date(role.created_at).toLocaleDateString()
            : 'N/A';

        row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${role.id}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${escapeHtml(role.name)}</td>
      <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(role.description || 'No description')}</td>
      <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${createdDate}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div class="flex items-center gap-2">
          <button class="btn-edit" data-role-id="${role.id}" data-action="edit" title="Edit Role">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          ${
              role.is_active
                  ? `
          <button class="btn-deactivate" data-role-id="${role.id}" data-role-name="${escapeHtml(role.name).replace(/"/g, '&quot;')}" data-action="deactivate" title="Deactivate Role">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Deactivate
          </button>
        `
                  : ''
          }
        </div>
      </td>
    `;
        tbody.appendChild(row);
    });

    // Add event listeners for action buttons
    tbody.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button[data-action]') as HTMLButtonElement | null;
        if (!button) return;

        const roleId = parseInt(button.dataset.roleId || '0');
        const action = button.dataset.action;

        if (action === 'edit') {
            window.location.href = `edit-role.html?id=${roleId}`;
        } else if (action === 'deactivate') {
            const roleName = button.dataset.roleName || '';
            confirmDeactivateRole(roleId, roleName);
        }
    });
}

function confirmDeactivateRole(roleId: number, roleName: string): void {
    const deactivateRoleName = document.getElementById('deactivateRoleName');
    if (deactivateRoleName) {
        deactivateRoleName.textContent = roleName;
    }

    // Set up the confirm button
    const confirmBtn = document.getElementById('confirmDeactivateBtn') as HTMLButtonElement | null;
    if (confirmBtn) {
        confirmBtn.onclick = () => void deactivateRole(roleId, roleName);
    }

    // Show the modal
    const modal = document.getElementById('deactivateModal');
    modal?.classList.remove('hidden');
}

async function deactivateRole(roleId: number, roleName: string): Promise<void> {
    const confirmBtn = document.getElementById('confirmDeactivateBtn') as HTMLButtonElement | null;

    try {
        // Disable confirm button during request
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Deactivating...';
        }

        const response = await fetch(`${config.api.url}${config.endpoints.roles}/${roleId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // Success
        showMessage(`Role "${roleName}" deactivated successfully!`, 'success');

        // Close modal and reload roles
        window.closeDeactivateModal?.();
        await loadRoles();
    } catch (error) {
        console.error('Error deactivating role:', error);
        const errorMessage =
            error instanceof Error ? error.message : 'Error deactivating role. Please try again.';
        showMessage(errorMessage, 'danger');
    } finally {
        // Re-enable confirm button
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Deactivate Role';
        }
    }
}

function showMessage(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const alertDiv = document.createElement('div');

    const typeClasses: Record<string, string> = {
        success: 'bg-green-50 border-l-4 border-green-500 text-green-700',
        danger: 'bg-red-50 border-l-4 border-red-500 text-red-700',
        warning: 'bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700',
        info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-700',
    };

    alertDiv.className = `${typeClasses[type] || typeClasses.info} p-4 rounded-r-lg shadow-sm mb-4 fade-in`;
    alertDiv.innerHTML = `
    <div class="flex items-center justify-between">
      <p>${message}</p>
      <button type="button" class="ml-4 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  `;

    container.innerHTML = '';
    container.appendChild(alertDiv);

    // Auto-dismiss success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

function showApiStatus(message: string): void {
    const statusDiv = document.getElementById('apiStatus');
    if (!statusDiv) return;

    statusDiv.innerHTML = `<div class="flex items-center"><svg class="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>${message}</div>`;
    statusDiv.classList.remove('hidden');
}

function hideApiStatus(): void {
    const statusDiv = document.getElementById('apiStatus');
    statusDiv?.classList.add('hidden');
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
