<?php $authCssVersion = filemtime(__DIR__ . '/../../public/css/auth.css'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Nimonspedia</title>
    <link rel="stylesheet" href="/public/css/auth.css?v=<?= $authCssVersion ?>">
</head>
<body class="auth-body login-page">
    <div class="auth-shell">
        <div class="auth-brand">Nimonspedia</div>
        <p class="auth-tagline">Masuk untuk melanjutkan pengalaman belanja dan kelola Nimons Anda.</p>

        <div class="auth-card">
            <h1 class="auth-title">Masuk ke akun</h1>

            <div id="alertContainer"></div>

            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="Email kamu">
                    <div class="error-message" id="emailError"></div>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="password" name="password" required placeholder="Password">
                        <button type="button" class="toggle-password" onclick="togglePassword('password', this)" aria-label="Tampilkan password">
                            <span class="toggle-label">Tampilkan</span>
                        </button>
                    </div>
                    <div class="error-message" id="passwordError"></div>
                </div>

                <button type="submit" class="submit-btn" id="submitBtn">Masuk</button>

                <div class="auth-footer">
                    Belum punya akun? <a href="/auth/register">Daftar sekarang</a>
                </div>
            </form>
        </div>
    </div>

    <script src="/public/js/api.js"></script>
    <script>
        const form = document.getElementById('loginForm');
        const submitBtn = document.getElementById('submitBtn');
        const alertContainer = document.getElementById('alertContainer');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        // Toggle password visibility
        function togglePassword(inputId, button) {
            const input = document.getElementById(inputId);
            const label = button.querySelector('.toggle-label');
            const isHidden = input.type === 'password';

            input.type = isHidden ? 'text' : 'password';
            label.textContent = isHidden ? 'Sembunyikan' : 'Tampilkan';
            button.setAttribute('aria-label', isHidden ? 'Sembunyikan password' : 'Tampilkan password');
        }

        // Clear error on input
        emailInput.addEventListener('input', () => {
            emailInput.classList.remove('is-invalid');
            document.getElementById('emailError').classList.remove('show');
        });

        passwordInput.addEventListener('input', () => {
            passwordInput.classList.remove('is-invalid');
            document.getElementById('passwordError').classList.remove('show');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!window.api || typeof window.api.post !== 'function') {
                console.error('API helper not available');
                showAlert('Saat ini formulir tidak dapat dikirim. Coba lagi nanti.', 'error');
                return;
            }

            const formData = new FormData(form);
            const initialText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading"></span>Memproses...';

            try {
                const data = await window.api.post('/auth/login', formData);

                if (data && data.success) {
                    showAlert('Login berhasil! Mengalihkan...', 'success');
                    setTimeout(() => {
                        window.location.href = data.data.redirect;
                    }, 500);
                }
            } catch (error) {
                const response = error || {};

                if (response.errors) {
                    Object.keys(response.errors).forEach(field => {
                        const input = document.getElementById(field);
                        const errorElement = document.getElementById(field + 'Error');
                        if (input && errorElement) {
                            input.classList.add('is-invalid');
                            errorElement.textContent = response.errors[field];
                            errorElement.classList.add('show');
                        }
                    });
                } else {
                    const message = response.message || 'Terjadi kesalahan. Silakan coba lagi.';
                    showAlert(message, 'error');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = initialText;
            }
        });

        function showAlert(message, type) {
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} show`;
            alert.textContent = message;
            alertContainer.innerHTML = '';
            alertContainer.appendChild(alert);

            if (type === 'error') {
                setTimeout(() => {
                    alert.classList.remove('show');
                }, 5000);
            }
        }
    </script>
</body>
</html>
