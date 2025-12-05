import config from './config';
import { Role, RolesResponse, SingleUserResponse, User } from './types';

let currentUser: User | null = null;
let availableRoles: Role[] = [];
let originalRoleId: number | null = null;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('editUserForm') as HTMLFormElement | null;
    const roleSelect = document.getElementById('role') as HTMLSelectElement | null;
    const roleChangeWarning = document.getElementById('roleChangeWarning') as HTMLElement | null;

    if (!form || !roleSelect) {
        console.error('Required form elements not found');
        return;
    }

    // Get user ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        showError('No user ID provided');
        return;
    }

    // Load user data and roles
    Promise.all([loadUser(userId), loadRoles()])
        .then(() => {
            populateForm();
            showForm();
        })
        .catch((error) => {
            console.error('Error loading data:', error);
            showError(error.message);
        });

    async function loadUser(id: string): Promise<void> {
        try {
            const response = await fetch(`${config.api.url}${config.endpoints.users}/${id}`);

            if (response.ok) {
                const result: SingleUserResponse = await response.json();
                console.log('User API response:', result);
                // API returns user wrapped in a 'data' property
                currentUser = result.data;
                console.log('Extracted user data:', currentUser);

                const rawRoleId =
                    currentUser.role_id || (currentUser.role ? currentUser.role.id : null);
                originalRoleId = rawRoleId ? rawRoleId : null;

                console.log('Original role ID:', originalRoleId);
            } else if (response.status === 404) {
                throw new Error('User not found');
            } else {
                throw new Error('Failed to load user data');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Error loading user: ${errorMessage}`);
        }
    }

    async function loadRoles(): Promise<void> {
        try {
            const response = await fetch(`${config.api.url}${config.endpoints.roles}`);

            if (response.ok) {
                const result: RolesResponse = await response.json();
                console.log('Roles API response:', result);
                // API returns roles wrapped in a 'data' property
                availableRoles = result.data || [];
                console.log('Available roles:', availableRoles);
            } else {
                throw new Error('Failed to load roles');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Error loading roles: ${errorMessage}`);
        }
    }

    function populateForm(): void {
        if (!currentUser) return;

        console.log('Populating form with user:', currentUser);
        console.log('Available roles for select:', availableRoles);

        // Populate user fields
        const nameInput = document.getElementById('name') as HTMLInputElement | null;
        const emailInput = document.getElementById('email') as HTMLInputElement | null;
        const jobInput = document.getElementById('job') as HTMLInputElement | null;

        if (nameInput) {
            nameInput.value = `${currentUser.first_name} ${currentUser.last_name}`;
        }
        if (emailInput) {
            emailInput.value = currentUser.email;
        }
        if (jobInput) {
            jobInput.value = currentUser.job || '';
        }

        // Populate role select
        populateRoleSelect();

        // Set current role info
        const currentRoleInfo = document.getElementById('currentRoleInfo');
        if (currentRoleInfo) {
            if (currentUser.role) {
                currentRoleInfo.textContent = `Current role: ${currentUser.role.name}`;
            } else {
                currentRoleInfo.textContent = 'Current role: User (default)';
            }
        }
    }

    function populateRoleSelect(): void {
        if (!roleSelect) return;

        console.log('Populating role select with originalRoleId:', originalRoleId);

        // Clear loading message
        roleSelect.innerHTML = '';

        // Add role options
        availableRoles.forEach((role) => {
            const option = document.createElement('option');
            option.value = String(role.id);
            option.textContent = role.name;

            // Select current role
            // Ensure we compare numbers
            if (originalRoleId && role.id === originalRoleId) {
                console.log(`Selecting role ${role.name} (ID: ${role.id}) as current role`);
                option.selected = true;
            } else if (!originalRoleId && role.name.toLowerCase() === 'user') {
                console.log(`Selecting default User role (ID: ${role.id})`);
                option.selected = true;
                // If user had no role, treat default 'User' role as their original role to avoid unnecessary warnings
                originalRoleId = role.id;
            }

            roleSelect.appendChild(option);
        });

        console.log('Role select populated, current value:', roleSelect.value);
    }

    function showForm(): void {
        const loadingState = document.getElementById('loadingState');
        const editForm = document.getElementById('editUserForm');

        loadingState?.classList.add('hidden');
        editForm?.classList.remove('hidden');
    }

    function showError(message: string): void {
        const loadingState = document.getElementById('loadingState');
        const errorMessage = document.getElementById('errorMessage');
        const errorState = document.getElementById('errorState');

        loadingState?.classList.add('hidden');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        errorState?.classList.remove('hidden');
    }

    function showAlert(message: string, type: 'danger' | 'success' = 'danger'): void {
        if (!form) return;

        // Remove existing alerts
        const existingAlert = document.querySelector('.alert-dismissible');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
      <span>${message}</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

        form.parentNode?.insertBefore(alert, form);
    }

    function hideAlert(): void {
        const alert = document.querySelector('.alert-dismissible');
        if (alert) {
            alert.remove();
        }
    }

    function checkRoleChange(): void {
        if (!roleSelect || !roleChangeWarning) return;

        const selectedRoleId = parseInt(roleSelect.value);
        // Ensure originalRoleId is treated as number for comparison
        const currentOriginalRoleId = originalRoleId ? originalRoleId : null;

        const selectedRole = availableRoles.find((role) => role.id === selectedRoleId);
        const originalRole = availableRoles.find((role) => role.id === currentOriginalRoleId) || {
            name: 'User',
        };

        if (selectedRoleId !== currentOriginalRoleId) {
            // Show role change warning
            const oldRoleName = document.getElementById('oldRoleName');
            const newRoleName = document.getElementById('newRoleName');

            if (oldRoleName) oldRoleName.textContent = originalRole.name;
            if (newRoleName) newRoleName.textContent = selectedRole ? selectedRole.name : 'Unknown';

            roleChangeWarning.classList.remove('hidden');
        } else {
            // Hide role change warning
            roleChangeWarning.classList.add('hidden');
        }
    }

    // Listen for role changes
    roleSelect.addEventListener('change', checkRoleChange);

    form.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        hideAlert();

        const nameInput = document.getElementById('name') as HTMLInputElement | null;
        const jobInput = document.getElementById('job') as HTMLInputElement | null;
        const saveButton = document.getElementById('saveButton') as HTMLButtonElement | null;

        if (!nameInput || !jobInput || !roleSelect || !saveButton) {
            showAlert('Form elements not found');
            return;
        }

        // Validate role selection
        if (!roleSelect.value) {
            showAlert('Please select a role for the user.');
            return;
        }

        // Disable save button during submission
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';

        const selectedRoleId = parseInt(roleSelect.value);
        const currentOriginalRoleId = originalRoleId ? originalRoleId : null;
        const isRoleChanged = selectedRoleId !== currentOriginalRoleId;

        // Show confirmation for role changes
        if (isRoleChanged) {
            const selectedRole = availableRoles.find((role) => role.id === selectedRoleId);
            const originalRole = availableRoles.find(
                (role) => role.id === currentOriginalRoleId
            ) || {
                name: 'User',
            };

            const confirmMessage = `Are you sure you want to change this user's role from "${originalRole.name}" to "${selectedRole?.name}"? This will affect their permissions.`;

            if (!confirm(confirmMessage)) {
                // Reset button state
                saveButton.disabled = false;
                saveButton.textContent = 'Save Changes';
                return;
            }
        }

        // Parse name into first and last name
        const nameParts = nameInput.value.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const userData = {
            first_name: firstName,
            last_name: lastName,
            job: jobInput.value,
            role_id: selectedRoleId,
        };

        try {
            const response = await fetch(`${config.api.url}${config.endpoints.users}/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                await response.json(); // Consume the response

                // Show success message with role change info
                let successMessage = 'User updated successfully!';
                if (isRoleChanged) {
                    const newRole = availableRoles.find((role) => role.id === selectedRoleId);
                    successMessage += ` Role changed to ${newRole?.name}.`;
                }

                showAlert(successMessage, 'success');

                // Update original role ID to prevent duplicate warnings
                originalRoleId = selectedRoleId;

                // Hide role change warning
                roleChangeWarning?.classList.add('hidden');

                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                // Handle different error scenarios
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = 'Failed to update user';

                if (response.status === 400) {
                    if (errorData.message && errorData.message.includes('role')) {
                        errorMessage = 'Invalid role selected. Please choose a valid role.';
                    } else {
                        errorMessage = errorData.message || 'Invalid user data provided.';
                    }
                } else if (response.status === 404) {
                    if (errorData.message && errorData.message.includes('role')) {
                        errorMessage = 'Selected role not found. Please choose a different role.';
                    } else {
                        errorMessage = 'User not found.';
                    }
                } else if (response.status >= 500) {
                    errorMessage = 'Server error occurred. Please try again later.';
                }

                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            const errMsg =
                error instanceof Error ? error.message : 'Error updating user. Please try again.';
            showAlert(errMsg);
        } finally {
            // Reset button state
            saveButton.disabled = false;
            saveButton.textContent = 'Save Changes';
        }
    });
});
