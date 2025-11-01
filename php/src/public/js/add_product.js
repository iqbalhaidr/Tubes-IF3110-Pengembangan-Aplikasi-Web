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
        if (quill.root.innerHTML.length > 5000) {
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

        try {
            console.log('Mengirim data produk baru...'); 
            const result = await api.post('/api/seller/products/create', formData);
        
            console.log('Hasil dari server:', result); 
            
            if (result.success) {
                showToast(result.message || 'Produk berhasil ditambahkan');
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
            resetSubmitButton();
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
});