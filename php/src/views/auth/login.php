<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Nimonspedia</title>
    <link rel="stylesheet" href="/public/css/auth.css">
</head>
<body>
    <div class="auth-wrapper">
        <!-- Left Panel - Welcome Section -->
        <div class="auth-left">
            <h1>Welcome<br>Back!</h1>
        </div>

        <!-- Right Panel - Login Form -->
        <div class="auth-right">
            <div class="auth-header">
                <h2>Login</h2>
            </div>

            <div id="alertContainer"></div>

            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="Enter your email">
                    <div class="error-message" id="emailError"></div>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="password" name="password" required placeholder="Enter your password">
                        <button type="button" class="toggle-password" onclick="togglePassword('password', this)" aria-label="Show password">
                            <span class="toggle-label">Show</span>
                        </button>
                    </div>
                    <div class="error-message" id="passwordError"></div>
                </div>

                <button type="submit" class="submit-btn" id="submitBtn">Login</button>

                <div class="auth-footer">
                    don't have an account? <a href="/auth/register">register</a>
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
            label.textContent = isHidden ? 'Hide' : 'Show';
            button.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
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
                showAlert('Unable to submit form at the moment.', 'error');
                return;
            }

            const formData = new FormData(form);
            const initialText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading"></span>Signing in...';

            try {
                const data = await window.api.post('/auth/login', formData);

                if (data && data.success) {
                    showAlert('Login successful!', 'success');
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
                    const message = response.message || 'An error occurred. Please try again.';
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
