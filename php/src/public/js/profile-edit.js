/**
 * Profile Edit Modal Management
 */

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    button.textContent = isHidden ? '🙈' : '👁️';
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
    const roleHeader = document.querySelector('[data-role-header]');
    const isSeller = roleHeader && roleHeader.dataset.roleHeader === 'seller';

    if (isSeller) {
        initializeSellerProfileEdit();
    } else {
        initializeBuyerProfileEdit();
    }
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
                    // Reload page to show updated data
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                } else {
                    if (response.errors) {
                        Object.keys(response.errors).forEach(field => {
                            showFieldError(field, response.errors[field], 'edit');
                        });
                    } else {
                        alert(response.message || 'Failed to update profile');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (error.errors) {
                    Object.keys(error.errors).forEach(field => {
                        showFieldError(field, error.errors[field], 'edit');
                    });
                } else {
                    alert(error.message || 'An error occurred while updating profile');
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

            if (newPassword !== confirmPassword) {
                showFieldError('new_password_confirm', 'Passwords do not match', '');
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
                    alert('Password changed successfully');
                    changePasswordForm.reset();
                } else {
                    if (response.errors) {
                        Object.keys(response.errors).forEach(field => {
                            const mappedField = field === 'old_password' ? 'current_password' : field;
                            showFieldError(mappedField, response.errors[field], '');
                        });
                    } else {
                        alert(response.message || 'Failed to change password');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (error.errors) {
                    Object.keys(error.errors).forEach(field => {
                        const mappedField = field === 'old_password' ? 'current_password' : field;
                        showFieldError(mappedField, error.errors[field], '');
                    });
                } else {
                    alert(error.message || 'An error occurred');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
}

/**
 * Seller Store Edit
 */
function initializeSellerProfileEdit() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editStoreModal = document.getElementById('editStoreModal');
    
    // Guard: If required elements don't exist, this isn't a seller profile page
    if (!editProfileBtn || !editStoreModal) {
        console.warn('Seller profile elements not found');
        return;
    }

    const editStoreForm = document.getElementById('editStoreForm');
    let storeDescriptionEditor = null;

    // Get current store data from the page
    let currentStoreData = {
        store_name: '',
        store_description: '',
        store_logo_path: ''
    };

    // Try to extract current data from the profile page
    const profileDetails = document.querySelectorAll('.profile-detail-row');
    profileDetails.forEach(row => {
        const dt = row.querySelector('dt');
        const dd = row.querySelector('dd');
        if (dt && dd) {
            const label = dt.textContent.trim();
            if (label === 'Store Name') {
                const storeNameText = dd.textContent.trim();
                if (storeNameText !== 'Complete your store profile') {
                    currentStoreData.store_name = storeNameText;
                }
            }
            if (label === 'Store Logo') {
                const img = dd.querySelector('img');
                if (img) {
                    const src = img.getAttribute('src');
                    if (src) {
                        currentStoreData.store_logo_path = src.replace('/public/', '');
                    }
                }
            }
            if (label === 'Store Description') {
                const html = dd.innerHTML;
                if (!html.includes('Tell buyers what makes your store unique')) {
                    currentStoreData.store_description = html;
                }
            }
        }
    });

    // Initialize Quill Editor for store description
    if (typeof Quill !== 'undefined') {
        storeDescriptionEditor = new Quill('#edit_store_description_editor', {
            theme: 'snow',
            placeholder: 'Tell buyers what makes your store unique...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote'],
                    ['link']
                ]
            }
        });

        storeDescriptionEditor.on('text-change', () => {
            const wrapper = document.querySelector('[data-editor-wrapper="edit_store_description"]');
            if (wrapper) {
                wrapper.classList.remove('is-invalid');
            }
            const errorElement = document.getElementById('edit_store_descriptionError');
            if (errorElement) {
                errorElement.classList.remove('show');
            }
        });

        const wrapper = document.querySelector('[data-editor-wrapper="edit_store_description"]');
        if (wrapper) {
            wrapper.addEventListener('focusin', () => {
                wrapper.classList.add('is-focused');
            });
            wrapper.addEventListener('focusout', () => {
                wrapper.classList.remove('is-focused');
            });
        }
    }

    // Edit Store Modal - Open
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            document.getElementById('edit_store_name').value = currentStoreData.store_name;
            
            if (storeDescriptionEditor) {
                // Create a temporary container to parse HTML
                const temp = document.createElement('div');
                temp.innerHTML = currentStoreData.store_description;
                storeDescriptionEditor.setContents(
                    storeDescriptionEditor.clipboard.convert({ html: temp.innerHTML })
                );
            }

            // Show logo preview if exists
            const logoPreview = document.getElementById('logoPreview');
            const logoPlaceholder = document.getElementById('logoPlaceholder');
            if (currentStoreData.store_logo_path) {
                logoPreview.src = '/public/' + currentStoreData.store_logo_path;
                logoPreview.style.display = 'block';
                logoPlaceholder.style.display = 'none';
            } else {
                logoPreview.style.display = 'none';
                logoPlaceholder.style.display = 'block';
            }

            openModal('editStoreModal');
        });
    }

    // Edit Store Modal - Close
    const editStoreClose = document.getElementById('editStoreClose');
    const editStoreCancel = document.getElementById('editStoreCancel');
    const editStoreOverlay = document.getElementById('editStoreOverlay');

    [editStoreClose, editStoreCancel, editStoreOverlay].forEach(element => {
        if (element) {
            element.addEventListener('click', () => closeModal('editStoreModal'));
        }
    });

    // Edit Store Form - Field Clear
    if (editStoreForm) {
        editStoreForm.querySelectorAll('input, textarea').forEach(field => {
            if (field.type === 'hidden') return;
            field.addEventListener('input', () => {
                clearFieldError(field.name, 'edit_store');
            });
            field.addEventListener('change', () => {
                clearFieldError(field.name, 'edit_store');
            });
        });
    }

    // Logo File Input Preview
    const logoFileInput = document.getElementById('edit_store_logo');
    if (logoFileInput) {
        logoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const logoPreview = document.getElementById('logoPreview');
            const logoPlaceholder = document.getElementById('logoPlaceholder');

            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    logoPreview.src = event.target.result;
                    logoPreview.style.display = 'block';
                    logoPlaceholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Edit Store Form - Submit
    if (editStoreForm) {
        editStoreForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!window.api || typeof window.api.post !== 'function') {
                alert('API not available');
                return;
            }

            const storeName = document.getElementById('edit_store_name').value.trim();
            const storeDescription = storeDescriptionEditor ? storeDescriptionEditor.root.innerHTML : '';
            const logoFile = document.getElementById('edit_store_logo').files[0];
            const submitBtn = document.getElementById('editStoreSubmit');
            const originalText = submitBtn.textContent;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading"></span>Saving...';

            const formData = new FormData();
            formData.append('store_name', storeName);
            formData.append('store_description', storeDescription);
            if (logoFile) {
                formData.append('store_logo', logoFile);
            }

            try {
                const response = await window.api.post('/seller/update-store', formData);

                if (response.success) {
                    currentStoreData = {
                        store_name: storeName,
                        store_description: storeDescription,
                        store_logo_path: response.data?.store_logo_path || currentStoreData.store_logo_path
                    };
                    closeModal('editStoreModal');
                    // Reload page to show updated data
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                } else {
                    if (response.errors) {
                        Object.keys(response.errors).forEach(field => {
                            showFieldError(field, response.errors[field], 'edit_store');
                        });
                    } else {
                        alert(response.message || 'Failed to update store information');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (error.errors) {
                    Object.keys(error.errors).forEach(field => {
                        showFieldError(field, error.errors[field], 'edit_store');
                    });
                } else {
                    alert(error.message || 'An error occurred while updating store information');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
}
