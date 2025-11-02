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

    const descriptionTextarea = document.getElementById('description');
    quill.root.innerHTML = descriptionTextarea.value;

    const form = document.getElementById('editProductForm');
    const saveBtn = document.getElementById('saveBtn');
    const photoInput = document.getElementById('photo');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const photoInputLabel = document.getElementById('photo-input-label');
    
    const descError = document.getElementById('desc-error');
    const photoError = document.getElementById('photo-error');

    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', () => {
            photoInput.style.display = 'block';
            if (photoInputLabel) photoInputLabel.style.display = 'block';
            changePhotoBtn.style.display = 'none';
        });
    }

    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) { return; }

        if (file.size > 2 * 1024 * 1024) { 
            photoError.textContent = 'File terlalu besar! Maksimal 2MB.';
            e.target.value = '';
            return; 
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { 
            photoError.textContent = 'Tipe file tidak valid. Gunakan JPG, PNG, atau WEBP.';
            e.target.value = '';
            return; 
        }
        
        photoError.textContent = '';
        
        const reader = new FileReader();
        reader.onload = function(event) {
            previewImg.src = event.target.result;
        }
        reader.readAsDataURL(file);
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        saveBtn.disabled = true;
        saveBtn.classList.add('loading');
        saveBtn.textContent = 'Menyimpan...';

        const description = quill.root.innerHTML;
        document.getElementById('description').value = description; 

        const textLength = quill.getText().trim().length;
        if (textLength === 0) {
            descError.textContent = 'Deskripsi tidak boleh kosong.';
            resetSubmitButton();
            return;
        }
        if (quill.root.innerHTML.length > 1000) {
            descError.textContent = 'Deskripsi terlalu panjang.';
            resetSubmitButton();
            return;
        }
        descError.textContent = '';

        const formData = new FormData(form);
        
        const categorySelect = document.getElementById('categories');
        const selectedCategories = Array.from(categorySelect.selectedOptions).map(opt => opt.value);
        
        if (selectedCategories.length === 0) {
            showToast('Pilih minimal satu kategori', 'error');
            resetSubmitButton();
            return;
        }
        
        formData.append('categories', JSON.stringify(selectedCategories));
        
        const productId = form.dataset.productId;

        try {
            const result = await api.post(`/api/seller/products/update/${productId}`, formData);

            if (result.success) {
                showToast(result.message || 'Produk berhasil diupdate');
                setTimeout(() => {
                    window.location.href = '/seller/products';
                }, 1000);
            } else {
                throw new Error(result.message || 'Gagal mengupdate produk');
            }

        } catch (error) {
            console.error('TERJADI ERROR SAAT UPDATE:', error);
            showToast(error.message || 'Terjadi kesalahan', 'error');
            resetSubmitButton();
        }
    });

    function resetSubmitButton() {
        saveBtn.disabled = false;
        saveBtn.classList.remove('loading');
        saveBtn.textContent = 'Simpan Perubahan';
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
});