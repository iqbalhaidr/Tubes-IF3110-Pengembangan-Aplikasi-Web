/**
 * Profile Edit Modal Management
 */

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 5000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon map
    const iconMap = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    toast.innerHTML = `
        <span class="toast-icon">${iconMap[type] || '•'}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" type="button">×</button>
    `;

    toastContainer.appendChild(toast);

    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 300);
    });

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('leaving');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    button.textContent = isHidden ? '🙈' : '👁️';
}

/**
 * Show password confirmation modal (yes/no confirmation)
 * Returns true if user confirms, false if cancelled
 */
function showPasswordConfirmationModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('passwordConfirmModal');
        const confirmBtn = document.getElementById('passwordConfirmSubmit');
        const cancelBtn = document.getElementById('passwordConfirmCancel');
        const closeBtn = document.getElementById('passwordConfirmClose');

        if (!modal || !confirmBtn || !cancelBtn) {
            console.warn('Password confirmation modal elements not found');
            resolve(false);
            return;
        }

        // Show modal
        openModal('passwordConfirmModal');

        const handleConfirm = () => {
            closeModal('passwordConfirmModal');
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            closeModal('passwordConfirmModal');
            cleanup();
            resolve(false);
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        };

        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            closeBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeyDown);
        };

        // Add event listeners
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        closeBtn.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleKeyDown);
    });
}

function clearFieldError(fieldName, prefix = '') {
    const fullName = prefix ? prefix + '_' + fieldName : fieldName;
    const input = document.getElementById(fullName);
    if (!input) return;

    input.classList.remove('is-invalid');
    const errorElement = document.getElementById(fullName + 'Error');
    if (errorElement) {
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }
}

function showFieldError(fieldName, message, prefix = '') {
    const fullName = prefix ? prefix + '_' + fieldName : fieldName;
    const input = document.getElementById(fullName);
    if (!input) return;

    input.classList.add('is-invalid');
    const errorElement = document.getElementById(fullName + 'Error');
    if (errorElement) {
        errorElement.classList.add('show');
        errorElement.textContent = message;
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeBuyerProfileEdit();
});

/**
 * Buyer Profile Edit
 */
function initializeBuyerProfileEdit() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    
    // Guard: If required elements don't exist, this isn't a buyer profile page
    if (!editProfileBtn || !editProfileModal) {
        console.warn('Buyer profile elements not found');
        return;
    }

    const editProfileForm = document.getElementById('editProfileForm');
    const changePasswordForm = document.getElementById('changePasswordForm');

    // Get current user data from the page (these are rendered by the controller)
    let currentUserData = {
        name: '',
        address: ''
    };

    // Try to extract current data from the profile page
    const profileDetails = document.querySelectorAll('.profile-detail-row');
    profileDetails.forEach(row => {
        const dt = row.querySelector('dt');
        const dd = row.querySelector('dd');
        if (dt && dd) {
            const label = dt.textContent.trim();
            const value = dd.textContent.trim();
            if (label === 'Full Name') currentUserData.name = value;
            if (label === 'Address') currentUserData.address = value;
        }
    });

    // Edit Profile Modal - Open
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('edit_name');
            const addressInput = document.getElementById('edit_address');
            
            if (nameInput && addressInput) {
                nameInput.value = currentUserData.name;
                addressInput.value = currentUserData.address;
                openModal('editProfileModal');
            }
        });
    }

    // Edit Profile Modal - Close
    const editProfileClose = document.getElementById('editProfileClose');
    const editProfileCancel = document.getElementById('editProfileCancel');
    const editProfileOverlay = document.getElementById('editProfileOverlay');

    [editProfileClose, editProfileCancel, editProfileOverlay].forEach(element => {
        if (element) {
            element.addEventListener('click', () => closeModal('editProfileModal'));
        }
    });

    // Edit Profile Form - Field Clear
    if (editProfileForm) {
        editProfileForm.querySelectorAll('input, textarea').forEach(field => {
            field.addEventListener('input', () => {
                clearFieldError(field.name, 'edit');
            });
        });
    }

    // Edit Profile Form - Submit
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!window.api || typeof window.api.post !== 'function') {
                alert('API not available');
                return;
            }

            const name = document.getElementById('edit_name').value.trim();
            const address = document.getElementById('edit_address').value.trim();
            const submitBtn = document.getElementById('editProfileSubmit');
            const originalText = submitBtn.textContent;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading"></span>Saving...';

            const formData = new FormData();
            formData.append('name', name);
            formData.append('address', address);

            try {
                const response = await window.api.post('/auth/update-profile', formData);

                if (response.success) {
                    currentUserData = { name, address };
                    closeModal('editProfileModal');
                    showToast('Profile updated successfully! 🎉', 'success', 3000);
                    // Reload page to show updated data
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                } else {
                    if (response.errors) {
                        Object.keys(response.errors).forEach(field => {
                            showFieldError(field, response.errors[field], 'edit');
                        });
                        showToast(response.message || 'Failed to update profile', 'error');
                    } else {
                        showToast(response.message || 'Failed to update profile', 'error');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (error.errors) {
                    Object.keys(error.errors).forEach(field => {
                        showFieldError(field, error.errors[field], 'edit');
                    });
                    showToast(error.message || 'An error occurred', 'error');
                } else {
                    showToast(error.message || 'An error occurred while updating profile', 'error');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Change Password Modal - Open
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            changePasswordForm.reset();
            document.querySelectorAll('#changePasswordForm input').forEach(input => {
                input.classList.remove('is-invalid');
            });
            document.querySelectorAll('#changePasswordForm .error-message').forEach(el => {
                el.classList.remove('show');
                el.textContent = '';
            });
            openModal('changePasswordModal');
        });
    }

    // Change Password Modal - Close
    const changePasswordClose = document.getElementById('changePasswordClose');
    const changePasswordCancel = document.getElementById('changePasswordCancel');
    const changePasswordOverlay = document.getElementById('changePasswordOverlay');

    [changePasswordClose, changePasswordCancel, changePasswordOverlay].forEach(element => {
        if (element) {
            element.addEventListener('click', () => closeModal('changePasswordModal'));
        }
    });

    // Change Password Form - Field Clear
    if (changePasswordForm) {
        changePasswordForm.querySelectorAll('input').forEach(field => {
            field.addEventListener('input', () => {
                if (field.name === 'old_password') {
                    clearFieldError('current_password', '');
                } else {
                    clearFieldError(field.name, '');
                }
            });
        });
    }

    // Change Password Form - Submit
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!window.api || typeof window.api.post !== 'function') {
                alert('API not available');
                return;
            }

            const oldPassword = document.getElementById('current_password').value;
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_new_password').value;
            const submitBtn = document.getElementById('changePasswordSubmit');
            const originalText = submitBtn.textContent;

            // Clear previous errors
            clearFieldError('current_password', '');
            clearFieldError('new_password', '');
            clearFieldError('confirm_new_password', '');

            // Validate: Password mismatch
            if (newPassword !== confirmPassword) {
                showFieldError('new_password', 'Passwords do not match', '');
                showFieldError('confirm_new_password', 'Passwords do not match', '');
                return;
            }

            // Validate: New password same as current password
            if (oldPassword === newPassword) {
                showFieldError('new_password', 'New password must be different from current password', '');
                return;
            }

            // Show password confirmation modal
            const confirmResult = await showPasswordConfirmationModal();
            
            if (!confirmResult) {
                // User cancelled
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading"></span>Changing...';

            const formData = new FormData();
            formData.append('old_password', oldPassword);
            formData.append('new_password', newPassword);
            formData.append('new_password_confirm', confirmPassword);

            try {
                const response = await window.api.post('/auth/change-password', formData);

                if (response.success) {
                    closeModal('changePasswordModal');
                    closeModal('passwordConfirmModal');
                    showToast('Password changed successfully! 🔐', 'success', 3000);
                    changePasswordForm.reset();
                } else {
                    if (response.errors) {
                        Object.keys(response.errors).forEach(field => {
                            const mappedField = field === 'old_password' ? 'current_password' : field;
                            showFieldError(mappedField, response.errors[field], '');
                        });
                        showToast(response.message || 'Failed to change password', 'error');
                    } else {
                        showToast(response.message || 'Failed to change password', 'error');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (error.errors) {
                    Object.keys(error.errors).forEach(field => {
                        const mappedField = field === 'old_password' ? 'current_password' : field;
                        showFieldError(mappedField, error.errors[field], '');
                    });
                    showToast(error.message || 'An error occurred', 'error');
                } else {
                    showToast(error.message || 'An error occurred', 'error');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
}

/**
 * Only Buyer Profile Edit is supported
 * Sellers now use the dashboard for store management
 */
