/**
 * Dashboard JavaScript
 * Handles dashboard interactions and event listeners
 */

document.addEventListener('DOMContentLoaded', () => {
    // Edit Store Button - Open Modal and Load Data
    const editStoreBtn = document.getElementById('editStoreBtn');
    const editStoreModal = document.getElementById('editStoreModal');
    
    if (editStoreBtn && editStoreModal) {
        editStoreBtn.addEventListener('click', async () => {
            // Load store data
            try {
                const data = await api.get('/api/store/get-store-info');
                
                if (data.success) {
                    // Populate form fields
                    const storeNameInput = document.getElementById('edit_store_name');
                    if (storeNameInput) {
                        storeNameInput.value = data.data.store_name || '';
                    }
                    
                    // Load logo preview if exists
                    const logoPreview = document.getElementById('logoPreview');
                    if (data.data.store_logo_path && logoPreview) {
                        logoPreview.innerHTML = `<img src="/public/${data.data.store_logo_path}" alt="Store logo" style="max-width: 100%; max-height: 100%; border-radius: 6px;">`;
                    }
                    
                    // Load description into Quill
                    if (window.storeDescriptionEditor && data.data.store_description) {
                        window.storeDescriptionEditor.root.innerHTML = data.data.store_description;
                    }
                }
            } catch (error) {
                console.error('Error loading store data:', error);
            }
            
            // Open modal
            editStoreModal.classList.remove('hidden');
        });
    }

    // Edit Store Modal - Close Handlers
    const editStoreClose = document.getElementById('editStoreClose');
    const editStoreCancel = document.getElementById('editStoreCancel');
    const editStoreOverlay = document.getElementById('editStoreOverlay');

    [editStoreClose, editStoreCancel, editStoreOverlay].forEach(element => {
        if (element) {
            element.addEventListener('click', () => {
                if (editStoreModal) {
                    editStoreModal.classList.add('hidden');
                }
            });
        }
    });

    // Optional: Add animation to summary cards on page load
    const summaryCards = document.querySelectorAll('.summary-card');
    summaryCards.forEach((card, index) => {
        card.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s backwards`;
    });

    // Optional: Add animation to action cards
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach((card, index) => {
        card.style.animation = `fadeInUp 0.5s ease ${(summaryCards.length + index) * 0.1}s backwards`;
    });
});

// Add fadeInUp animation
if (!document.querySelector('style[data-dashboard]')) {
    const style = document.createElement('style');
    style.setAttribute('data-dashboard', 'true');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}
