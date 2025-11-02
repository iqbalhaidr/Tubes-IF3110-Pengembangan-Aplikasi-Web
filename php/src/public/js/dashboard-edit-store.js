let quillStoreEditor = null;

document.addEventListener('DOMContentLoaded', () => {
    const editStoreBtn = document.getElementById('editStoreBtn');
    const editStoreModal = document.getElementById('editStoreModal');
    const editStoreForm = document.getElementById('editStoreForm');
    const editStoreClose = document.getElementById('editStoreClose');
    const editStoreCancel = document.getElementById('editStoreCancel');
    const editStoreOverlay = document.getElementById('editStoreOverlay');
    
    if (!editStoreForm || !editStoreModal || !editStoreBtn) {
        console.warn('Store edit modal elements not found');
        return;
    }

    if (typeof Quill !== 'undefined') {
        quillStoreEditor = new Quill('#quill-editor-store', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            },
            placeholder: 'Describe your store, what makes it unique...'
        });

        quillStoreEditor.on('text-change', function() {
            const length = quillStoreEditor.getLength() - 1;
            const errorDiv = document.getElementById('store-desc-error');
            
            if (length > 5000) {
                quillStoreEditor.deleteText(5000, length);
                if (errorDiv) {
                    errorDiv.textContent = 'Maximum 5000 characters';
                    errorDiv.style.display = 'block';
                }
            } else {
                if (errorDiv) {
                    errorDiv.textContent = '';
                    errorDiv.style.display = 'none';
                }
            }
        });

        quillStoreEditor.on('editor-change', () => {
            clearFieldError('store_description');
        });
    }

    editStoreBtn.addEventListener('click', async () => {
        try {
            const response = await api.get('/api/store/data');
            
            if (response.success && response.store) {
                const store = response.store;
                
                document.getElementById('edit_store_name').value = store.store_name || '';
                
                if (quillStoreEditor && store.store_description) {
                    quillStoreEditor.root.innerHTML = store.store_description;
                }
                
                const currentLogoPreview = document.getElementById('current-logo-preview');
                if (currentLogoPreview) {
                    if (store.store_logo_path) {
                        currentLogoPreview.innerHTML = `
                            <img src="/${store.store_logo_path}" alt="Current logo" 
                                 style="max-width: 150px; max-height: 150px; border-radius: 8px;">
                            <p style="margin-top: 8px; font-size: 0.875rem; color: #666;">Current logo</p>
                        `;
                    } else {
                        currentLogoPreview.innerHTML = '<p style="color: #999;">No logo uploaded</p>';
                    }
                }
            }
            
            editStoreModal.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error loading store data:', error);
            showToast('Failed to load store data', 'error');
        }
    });

    const closeModal = () => {
        editStoreModal.classList.add('hidden');
        editStoreForm.reset();
        if (quillStoreEditor) {
            quillStoreEditor.setText('');
        }
        clearAllErrors();
    };

    if (editStoreClose) editStoreClose.addEventListener('click', closeModal);
    if (editStoreCancel) editStoreCancel.addEventListener('click', closeModal);
    if (editStoreOverlay) editStoreOverlay.addEventListener('click', closeModal);

    const logoFileInput = document.getElementById('edit_store_logo');
    if (logoFileInput) {
        logoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const previewDiv = document.getElementById('logo-preview-new');
            const previewImg = document.getElementById('logo-preview-img');
            
            if (file && previewDiv && previewImg) {
                clearFieldError('store_logo');
                
                const maxSize = 2 * 1024 * 1024; 
                if (file.size > maxSize) {
                    showFieldError('store_logo', 'Logo size must not exceed 2MB');
                    logoFileInput.value = '';
                    previewDiv.style.display = 'none';
                    return;
                }
                
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    showFieldError('store_logo', 'Logo must be JPG, PNG, or WEBP');
                    logoFileInput.value = '';
                    previewDiv.style.display = 'none';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewImg.src = event.target.result;
                    previewDiv.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    editStoreForm.querySelectorAll('input').forEach(field => {
        field.addEventListener('input', () => {
            clearFieldError(field.name);
        });
    });
    editStoreForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        clearAllErrors();

        const storeName = document.getElementById('edit_store_name').value.trim();
        if (!storeName) {
            showFieldError('store_name', 'Store name is required');
            return;
        }

        if (storeName.length > 100) {
            showFieldError('store_name', 'Store name cannot exceed 100 characters');
            return;
        }
        if (quillStoreEditor) {
            const descLength = quillStoreEditor.getLength() - 1;
            if (descLength > 5000) {
                showFieldError('store_description', 'Description cannot exceed 5000 characters');
                return;
            }
        }

        const formData = new FormData(editStoreForm);
        
        if (quillStoreEditor) {
            const description = quillStoreEditor.root.innerHTML;
            formData.set('store_description', description);
        }

        const submitBtn = document.getElementById('editStoreSubmit');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const data = await api.post('/api/store/update', formData);

            if (!data.success) {
                showFieldError('store_name', data.message || 'Failed to update store');
                return;
            }

            showToast('Store updated successfully!', 'success');
            
            setTimeout(() => {
                closeModal();
                location.reload();
            }, 1000);

        } catch (error) {
            console.error('Error updating store:', error);
            showFieldError('store_name', 'An error occurred while updating the store');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});


function clearAllErrors() {
    document.querySelectorAll('.error-message, .validation-error').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
}

function clearFieldError(fieldName) {
    const input = document.getElementById(`edit_${fieldName}`);
    if (input) {
        input.classList.remove('is-invalid');
    }
    
    const errorElement = document.getElementById(`edit_${fieldName}Error`);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
    
    const validationError = document.getElementById(`${fieldName}-error`);
    if (validationError) {
        validationError.textContent = '';
        validationError.style.display = 'none';
    }
}

function showFieldError(fieldName, message) {
    const input = document.getElementById(`edit_${fieldName}`);
    if (input) {
        input.classList.add('is-invalid');
    }
    
    const errorElement = document.getElementById(`edit_${fieldName}Error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    const validationError = document.getElementById(`${fieldName}-error`);
    if (validationError) {
        validationError.textContent = message;
        validationError.style.display = 'block';
    }
}