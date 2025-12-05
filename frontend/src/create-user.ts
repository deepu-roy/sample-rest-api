import config from './config.js';
import { Role, RolesResponse, CreateUserResponse } from './types/index.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createUserForm') as HTMLFormElement | null;
    const roleSelect = document.getElementById('role') as HTMLSelectElement | null;

    if (!form || !roleSelect) {
        console.error('Required form elements not found');
        return;
    }

    console.log('Config:', config);
    console.log('API URL:', config.api.url);
    console.log('Roles endpoint:', config.endpoints.roles);

    // Load available roles when page loads
    void loadRoles();

    async function loadRoles(): Promise<void> {
        if (!roleSelect) return;

        try {
            console.log('Loading roles from:', `${config.api.url}${config.endpoints.roles}`);
            const response = await fetch(`${config.api.url}${config.endpoints.roles}`);

            console.log('Roles response status:', response.status);

            if (response.ok) {
                const result: RolesResponse = await response.json();
                console.log('Roles response data:', result);
                // API returns roles wrapped in a 'data' property
                const roles = result.data || [];
                console.log('Extracted roles:', roles);
                populateRoleSelect(roles);
            } else {
                throw new Error(`Failed to load roles: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error loading roles:', error);
            // Show error state in role select
            roleSelect.innerHTML = '<option value="">Error loading roles</option>';
            showError('Failed to load roles. Please refresh the page.');
        }
    }

    function populateRoleSelect(roles: Role[]): void {
        if (!roleSelect) return;

        // Clear loading message
        roleSelect.innerHTML = '';

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a role';
        roleSelect.appendChild(defaultOption);

        // Add role options
        roles.forEach((role) => {
            const option = document.createElement('option');
            option.value = String(role.id);
            option.textContent = role.name;

            // Set default role as selected if it's "User" (typically id: 1)
            if (role.name.toLowerCase() === 'user') {
                option.selected = true;
            }

            roleSelect.appendChild(option);
        });
    }

    function showError(message: string): void {
        if (!form) return;

        // Create or update error alert
        let errorAlert = document.getElementById('errorAlert');
        if (!errorAlert) {
            errorAlert = document.createElement('div');
            errorAlert.id = 'errorAlert';
            errorAlert.className = 'alert alert-danger alert-dismissible fade show';
            errorAlert.innerHTML = `
        <span id="errorMessage"></span>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
            form.parentNode?.insertBefore(errorAlert, form);
        }

        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        errorAlert.style.display = 'block';
    }

    function hideError(): void {
        const errorAlert = document.getElementById('errorAlert');
        if (errorAlert) {
            errorAlert.style.display = 'none';
        }
    }

    form.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        hideError();

        const nameInput = document.getElementById('name') as HTMLInputElement | null;
        const jobInput = document.getElementById('job') as HTMLInputElement | null;
        const emailInput = document.getElementById('email') as HTMLInputElement | null;

        if (!nameInput || !jobInput || !roleSelect) {
            showError('Form elements not found');
            return;
        }

        const name = nameInput.value.trim();
        const job = jobInput.value.trim();
        const email = emailInput?.value.trim() || '';
        const roleId = roleSelect.value;

        // Validation
        if (!name) {
            showError('Name is required');
            return;
        }

        if (!job) {
            showError('Job is required');
            return;
        }

        try {
            const requestBody: { name: string; job: string; email?: string; role_id?: number } = {
                name,
                job,
            };

            if (email) {
                requestBody.email = email;
            }

            if (roleId) {
                requestBody.role_id = parseInt(roleId);
            }

            const response = await fetch(`${config.api.url}${config.endpoints.users}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create user');
            }

            const data: CreateUserResponse = await response.json();
            console.log('User created:', data);

            // Redirect to home page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error creating user:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
            showError(errorMessage);
        }
    });
});
