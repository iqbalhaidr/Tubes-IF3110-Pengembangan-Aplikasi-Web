/**
 * Dashboard Store Edit Modal Management
 * Handles the edit store information modal on the seller dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    const editStoreForm = document.getElementById('editStoreForm');
    const editStoreModal = document.getElementById('editStoreModal');
    
    // Guard: If required elements don't exist, skip initialization
    if (!editStoreForm || !editStoreModal) {
        console.warn('Store edit modal elements not found');
        return;
    }

    // Initialize Quill Editor for store description
    if (typeof Quill !== 'undefined') {
        window.storeDescriptionEditor = new Quill('#storeDescriptionEditor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            },
            placeholder: 'Describe your store, what makes it unique...'
        });

        // Monitor description editor for focus/blur
        const wrapper = document.getElementById('storeDescriptionWrapper');
        window.storeDescriptionEditor.on('editor-change', () => {
            clearFieldError('store_description');
        });

        window.storeDescriptionEditor.root.addEventListener('focus', () => {
            if (wrapper) wrapper.classList.add('is-focused');
        });

        window.storeDescriptionEditor.root.addEventListener('blur', () => {
            if (wrapper) wrapper.classList.remove('is-focused');
        });
    }

    // Store Form - Field Clear Error
    editStoreForm.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('input', () => {
            clearFieldError(field.name);
        });
    });

    // Logo File Input Preview
    const logoFileInput = document.getElementById('edit_store_logo');
    if (logoFileInput) {
        logoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById('logoPreview');
            
            if (file && preview) {
                clearFieldError('store_logo');
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    preview.innerHTML = `<img src="${event.target.result}" alt="Logo preview" style="max-width: 100%; max-height: 100%; border-radius: 6px;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Store Form - Submit
    editStoreForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear all previous errors
        editStoreForm.querySelectorAll('.error-message').forEach(msg => {
            msg.classList.remove('show');
            msg.textContent = '';
        });

        // Validate store name
        const storeName = document.getElementById('edit_store_name').value.trim();
        if (!storeName) {
            showFieldError('store_name', 'Store name is required');
            return;
        }

        if (storeName.length > 100) {
            showFieldError('store_name', 'Store name cannot exceed 100 characters');
            return;
        }

        // Prepare form data
        const formData = new FormData(editStoreForm);
        
        // Get store description from Quill if available
        if (window.storeDescriptionEditor) {
            const description = window.storeDescriptionEditor.root.innerHTML;
            formData.set('store_description', description);
        }

        // Disable submit button
        const submitBtn = document.getElementById('editStoreSubmit');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const response = await fetch('/api/store/update', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors && typeof data.errors === 'object') {
                    // Show field-specific errors
                    for (const [field, message] of Object.entries(data.errors)) {
                        showFieldError(field, message);
                    }
                } else {
                    showFieldError('store_name', data.message || 'Failed to update store');
                }
                return;
            }

            // Success
            showSuccessMessage('Store updated successfully');
            
            // Close modal after 1.5 seconds
            setTimeout(() => {
                if (editStoreModal) {
                    editStoreModal.classList.add('hidden');
                }
                // Optional: Reload page to reflect changes
                location.reload();
            }, 1500);

        } catch (error) {
            console.error('Error updating store:', error);
            showFieldError('store_name', 'An error occurred while updating the store');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});

/**
 * Clear error message for a field
 */
function clearFieldError(fieldName) {
    const input = document.getElementById(`edit_${fieldName}`);
    if (!input) return;

    input.classList.remove('is-invalid');
    const errorElement = document.getElementById(`edit_${fieldName}Error`);
    if (errorElement) {
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }
}

/**
 * Show error message for a field
 */
function showFieldError(fieldName, message) {
    const input = document.getElementById(`edit_${fieldName}`);
    if (!input) return;

    input.classList.add('is-invalid');
    const errorElement = document.getElementById(`edit_${fieldName}Error`);
    if (errorElement) {
        errorElement.classList.add('show');
        errorElement.textContent = message;
    }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    // You can implement a toast/notification here
    console.log('Success:', message);
}
