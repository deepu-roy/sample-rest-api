import config from './config.js';
import { SingleRoleResponse } from './types/index.js';

const editRoleForm = document.getElementById('editRoleForm') as HTMLFormElement | null;
const apiStatus = document.getElementById('apiStatus');
const messageContainer = document.getElementById('messageContainer');
const saveRoleBtn = document.getElementById('saveRoleBtn') as HTMLButtonElement | null;

// Get role ID from URL
const urlParams = new URLSearchParams(window.location.search);
const roleId = urlParams.get('id');

if (!roleId) {
    showMessage('No role ID provided', 'error');
    if (saveRoleBtn) {
        saveRoleBtn.disabled = true;
    }
} else {
    void loadRole(roleId);
}

// Show API connection status
function showApiStatus(): void {
    apiStatus?.classList.remove('hidden');
}

// Hide API connection status
function hideApiStatus(): void {
    apiStatus?.classList.add('hidden');
}

// Show message
function showMessage(message: string, type: 'success' | 'error' = 'success'): void {
    if (!messageContainer) return;

    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500';
    const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';

    messageContainer.innerHTML = `
    <div class="mb-6 p-4 ${bgColor} border-l-4 ${borderColor} ${textColor} rounded-r-lg shadow-sm">
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${
              type === 'success'
                  ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />'
                  : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />'
          }
        </svg>
        ${message}
      </div>
    </div>
  `;

    // Scroll to top to show message
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (messageContainer) {
                messageContainer.innerHTML = '';
            }
        }, 3000);
    }
}

async function loadRole(id: string): Promise<void> {
    try {
        showApiStatus();
        const response = await fetch(`${config.api.url}${config.endpoints.roles}/${id}`);
        hideApiStatus();

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData: SingleRoleResponse = await response.json();
        const role = responseData.data;

        const roleIdInput = document.getElementById('roleId') as HTMLInputElement | null;
        const roleNameInput = document.getElementById('roleName') as HTMLInputElement | null;
        const roleDescriptionInput = document.getElementById(
            'roleDescription'
        ) as HTMLTextAreaElement | null;

        if (roleIdInput) roleIdInput.value = String(role.id);
        if (roleNameInput) roleNameInput.value = role.name;
        if (roleDescriptionInput) roleDescriptionInput.value = role.description || '';
    } catch (error) {
        console.error('Error loading role:', error);
        showMessage('Error loading role data. Please try again.', 'error');
        hideApiStatus();
    }
}

// Handle form submission
editRoleForm?.addEventListener('submit', async (e: Event) => {
    e.preventDefault();

    const roleIdInput = document.getElementById('roleId') as HTMLInputElement | null;
    const roleNameInput = document.getElementById('roleName') as HTMLInputElement | null;
    const roleDescriptionInput = document.getElementById(
        'roleDescription'
    ) as HTMLTextAreaElement | null;

    const id = roleIdInput?.value || '';
    const roleName = roleNameInput?.value.trim() || '';
    const roleDescription = roleDescriptionInput?.value.trim() || '';

    // Validation
    if (!roleName) {
        showMessage('Role name is required', 'error');
        return;
    }

    if (roleName.length > 50) {
        showMessage('Role name must be 50 characters or less', 'error');
        return;
    }

    if (roleDescription.length > 255) {
        showMessage('Description must be 255 characters or less', 'error');
        return;
    }

    try {
        showApiStatus();
        if (saveRoleBtn) {
            saveRoleBtn.disabled = true;
            saveRoleBtn.innerHTML = 'Updating...';
        }

        const response = await fetch(`${config.api.url}${config.endpoints.roles}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: roleName,
                description: roleDescription || null,
            }),
        });

        hideApiStatus();

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update role');
        }

        showMessage('Role updated successfully!', 'success');

        // Redirect to roles page after a short delay
        setTimeout(() => {
            window.location.href = 'roles.html';
        }, 1500);
    } catch (error) {
        console.error('Error updating role:', error);
        const errorMessage =
            error instanceof Error ? error.message : 'Error updating role. Please try again.';
        showMessage(errorMessage, 'error');
        if (saveRoleBtn) {
            saveRoleBtn.disabled = false;
            saveRoleBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Update Role
        `;
        }
    }
});
