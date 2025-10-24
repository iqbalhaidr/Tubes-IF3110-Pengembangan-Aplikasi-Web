<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Nimonspedia</title>
    <link rel="stylesheet" href="/public/css/auth.css">
</head>
<body>
    <div class="auth-wrapper">
        <!-- Left Panel - Welcome Section -->
        <div class="auth-left">
            <h1>Welcome<br>to<br>NimonsPedia!</h1>
        </div>

        <!-- Right Panel - Register Form -->
        <div class="auth-right">
            <div class="auth-header">
                <h2>Register</h2>
                <p class="subtitle">Pilih Role</p>
            </div>

            <div id="alertContainer"></div>

            <form id="registerForm" class="auth-form">
                <!-- Role Selection -->
                <div class="role-selection">
                    <div class="role-option">
                        <input type="radio" id="roleBuyer" name="role" value="BUYER" required>
                        <label for="roleBuyer">Buyer</label>
                    </div>
                    <div class="role-option">
                        <input type="radio" id="roleSeller" name="role" value="SELLER" required>
                        <label for="roleSeller">Seller</label>
                    </div>
                </div>
                <div class="error-message" id="roleError"></div>

                <!-- Name Field -->
                <div class="form-group">
                    <label for="name">Name</label>
                    <input type="text" id="name" name="name" required placeholder="Enter your full name">
                    <div class="error-message" id="nameError"></div>
                </div>

                <!-- Email Field -->
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required placeholder="Enter your email">
                    <div class="error-message" id="emailError"></div>
                </div>

                <!-- Password Fields -->
                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="password" name="password" required placeholder="Enter your password">
                        <button type="button" class="toggle-password" onclick="togglePassword('password', this)">
                            <span class="show-icon">👁️</span>
                        </button>
                    </div>
                    <small class="password-hint">Min 8 characters: uppercase, lowercase, number, symbol</small>
                    <div class="error-message" id="passwordError"></div>
                </div>

                <div class="form-group">
                    <label for="password_confirm">Confirm Password</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="password_confirm" name="password_confirm" required placeholder="Confirm your password">
                        <button type="button" class="toggle-password" onclick="togglePassword('password_confirm', this)">
                            <span class="show-icon">👁️</span>
                        </button>
                    </div>
                    <div class="error-message" id="password_confirmError"></div>
                </div>

                <!-- Address Field -->
                <div class="form-group">
                    <label for="address">Address</label>
                    <textarea id="address" name="address" required placeholder="Enter your complete address"></textarea>
                    <div class="error-message" id="addressError"></div>
                </div>

                <button type="submit" class="submit-btn" id="submitBtn">Register</button>

                <div class="auth-footer">
                    already have an account? <a href="/auth/login">login</a>
                </div>
            </form>
        </div>
    </div>

    <script>
        const form = document.getElementById('registerForm');
        const submitBtn = document.getElementById('submitBtn');
        const alertContainer = document.getElementById('alertContainer');
        const formInputs = form.querySelectorAll('input, select, textarea');

        // Toggle password visibility
        function togglePassword(inputId, button) {
            const input = document.getElementById(inputId);
            const icon = button.querySelector('.show-icon');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = '🙈';
            } else {
                input.type = 'password';
                icon.textContent = '👁️';
            }
        }

        // Clear error on input
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                input.classList.remove('is-invalid');
                document.getElementById(input.id + 'Error').classList.remove('show');
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading"></span>Creating account...';

            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('Registration successful! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = data.data.redirect;
                    }, 500);
                } else {
                    if (data.errors) {
                        Object.keys(data.errors).forEach(field => {
                            const input = document.getElementById(field);
                            const errorElement = document.getElementById(field + 'Error');
                            if (input) {
                                input.classList.add('is-invalid');
                                errorElement.textContent = data.errors[field];
                                errorElement.classList.add('show');
                            }
                        });
                    } else {
                        showAlert(data.message, 'error');
                    }
                }
            } catch (error) {
                showAlert('An error occurred. Please try again.', 'error');
                console.error('Error:', error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Create Account';
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
