document.addEventListener('DOMContentLoaded', () => {

    const quill = new Quill('#quill-editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{'list': 'ordered'}, {'list': 'bullet'}],
            ]
        }
    });

    const form = document.getElementById('addProductForm');
    const saveBtn = document.getElementById('saveBtn');
    const photoInput = document.getElementById('photo');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    
    const nameError = document.getElementById('name-error');
    const descError = document.getElementById('desc-error');
    const photoError = document.getElementById('photo-error');

    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) {
            previewContainer.style.display = 'none';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            photoError.textContent = 'File terlalu besar! Maksimal 2MB.';
            e.target.value = '';
            previewContainer.style.display = 'none';
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            photoError.textContent = 'Tipe file tidak valid. Gunakan JPG, PNG, atau WEBP.';
            e.target.value = ''; 
            previewContainer.style.display = 'none';
            return;
        }

        photoError.textContent = '';
        
        const reader = new FileReader();
        reader.onload = function(event) {
            previewImg.src = event.target.result;
            previewContainer.style.display = 'flex';
            photoInput.style.display = 'none';
        }
        reader.readAsDataURL(file);
    });

    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', () => {
            photoInput.value = ''; 
            photoInput.style.display = 'block';
            previewContainer.style.display = 'none';
            previewImg.src = '#';
        });
    }

    // Modal elements
    const addConfirmModal = document.getElementById('addConfirmModal');
    const confirmAddBtn = document.getElementById('confirmAddBtn');
    const cancelAddBtn = document.getElementById('cancelAddBtn');
    let pendingFormData = null;

    function showAddModal() {
        addConfirmModal.classList.add('is-visible');
        addConfirmModal.setAttribute('aria-hidden', 'false');
    }

    function hideAddModal() {
        addConfirmModal.classList.remove('is-visible');
        addConfirmModal.setAttribute('aria-hidden', 'true');
        pendingFormData = null;
    }

    // Close modal when clicking cancel button
    cancelAddBtn.addEventListener('click', hideAddModal);

    // Close modal when clicking outside (on overlay)
    addConfirmModal.addEventListener('click', function(e) {
        if (e.target === addConfirmModal) {
            hideAddModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && addConfirmModal.classList.contains('is-visible')) {
            hideAddModal();
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const description = quill.root.innerHTML;
        document.getElementById('description').value = description;

        const textLength = quill.getText().trim().length;
        if (textLength === 0) {
            descError.textContent = 'Deskripsi tidak boleh kosong.';
            return;
        }
        if (quill.root.innerHTML.length > 1000) {
            descError.textContent = 'Deskripsi terlalu panjang.';
            return;
        }
        descError.textContent = '';

        const categorySelect = document.getElementById('categories');
        const selectedCategories = Array.from(categorySelect.selectedOptions).map(opt => opt.value);
        
        console.log('Selected Categories:', selectedCategories);
        console.log('Total selected:', selectedCategories.length);
        
        if (selectedCategories.length === 0) {
            showToast('Pilih minimal satu kategori', 'error');
            categorySelect.focus();
            categorySelect.style.boxShadow = '0 0 0 3px rgba(211, 47, 47, 0.3)';
            setTimeout(() => {
                categorySelect.style.boxShadow = '';
            }, 2000);
            return;
        }

        // Prepare form data and store it
        pendingFormData = new FormData(form);
        pendingFormData.append('categories', JSON.stringify(selectedCategories));

        // Show confirmation modal
        showAddModal();
    });

    // Handle confirmation button
    confirmAddBtn.addEventListener('click', async function() {
        if (!pendingFormData) return;

        confirmAddBtn.disabled = true;
        confirmAddBtn.textContent = 'Menambahkan...';

        try {
            console.log('Mengirim data produk baru...');
            const result = await api.post('/api/seller/products/create', pendingFormData);
        
            console.log('Hasil dari server:', result);
            
            if (result.success) {
                showToast(result.message || 'Produk berhasil ditambahkan');
                hideAddModal();
                setTimeout(() => {
                    window.location.href = '/seller/products';
                }, 1000);
            } else {
                throw new Error(result.message || 'Gagal menambahkan produk');
            }
        
        } catch (error) {
            console.error('TERJADI ERROR SAAT SUBMIT:', error);
            
            if (error.rawResponse) {
                console.error('Raw Response dari Server:', error.rawResponse);
            }
            
            showToast(error.message || 'Terjadi kesalahan', 'error');
            confirmAddBtn.disabled = false;
            confirmAddBtn.textContent = 'Ya, Tambahkan Produk';
        }
    });

    function resetSubmitButton() {
        saveBtn.disabled = false;
        saveBtn.classList.remove('loading');
        saveBtn.textContent = 'Simpan';
    }

    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    // Add visual feedback for category selection
    const categorySelect = document.getElementById('categories');
    
    function updateCategoryFeedback() {
        const selected = Array.from(categorySelect.selectedOptions);
        console.log(`Category Selection Updated: ${selected.length} selected`);
    }
    
    categorySelect.addEventListener('change', updateCategoryFeedback);
    
    // Initialize on page load
    updateCategoryFeedback();
});