<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Create Account - Nimonspedia</title>
	<link rel="stylesheet" href="/public/css/auth.css">
</head>
<body class="auth-register-page buyer-register">
	<div class="auth-wrapper register-layout">
		<aside class="auth-left register-panel buyer-accent">
			<div class="register-pane is-active" data-role-pane="buyer">
				<h1>Join Nimonspedia</h1>
				<p>Discover trusted stores, track orders, and manage your balance in one dashboard.</p>
				<ul class="auth-highlight-list">
					<li>Curated categories and smart filters</li>
					<li>Secure checkout with balance tracking</li>
					<li>Personalized recommendations soon</li>
				</ul>
			</div>
			<div class="register-pane" data-role-pane="seller">
				<h1>Open Your Storefront</h1>
				<p>Launch a branded store, manage inventory, and delight Nimons everywhere.</p>
				<div class="seller-checklist">
					<h3>Get ready with:</h3>
					<ul>
						<li>Business contact information</li>
						<li>A memorable store name</li>
						<li>Short description of your offerings</li>
						<li>Logo in PNG, JPG, or WEBP (max 2MB)</li>
					</ul>
				</div>
				<div class="seller-support">
					<p>Our team is ready to help approved sellers onboard quickly.</p>
				</div>
			</div>
		</aside>

		<section class="auth-right register-right">
			<div class="register-tabs" role="tablist">
				<button type="button" class="register-tab is-active" data-register-option="buyer" aria-selected="true" aria-controls="registerBuyerForm">
					<span class="tab-text">
						<span class="tab-title">Buyer</span>
						<span class="tab-subtitle">Shop, track orders, earn rewards</span>
					</span>
					<span class="tab-indicator">B</span>
				</button>
				<button type="button" class="register-tab" data-register-option="seller" aria-selected="false" aria-controls="registerSellerForm">
					<span class="tab-text">
						<span class="tab-title">Seller</span>
						<span class="tab-subtitle">Launch store, manage catalog</span>
					</span>
					<span class="tab-indicator">S</span>
				</button>
			</div>

			<div class="auth-header">
				<div class="header-group is-active" data-role-header="buyer">
					<h2>Create Buyer Account</h2>
					<p class="subtitle">Fill in your personal details below.</p>
				</div>
				<div class="header-group" data-role-header="seller">
					<h2>Create Seller Account</h2>
					<p class="subtitle">Provide account and storefront information to start selling.</p>
				</div>
			</div>

			<div id="buyerAlertContainer"></div>

			<form id="registerBuyerForm" class="auth-form register-form is-active" data-role-form="buyer">
				<input type="hidden" name="role" value="BUYER">

				<div class="form-group">
					<label for="buyer_name">Full Name</label>
					<input type="text" id="buyer_name" name="name" required placeholder="Enter your full name">
					<div class="error-message" id="buyer_nameError"></div>
				</div>

				<div class="form-group">
					<label for="buyer_email">Email</label>
					<input type="email" id="buyer_email" name="email" required placeholder="Enter your email">
					<div class="error-message" id="buyer_emailError"></div>
				</div>

				<div class="form-group">
					<label for="buyer_password">Password</label>
					<div class="password-input-wrapper">
						<input type="password" id="buyer_password" name="password" required placeholder="Create a password">
						<button type="button" class="toggle-password" onclick="togglePassword('buyer_password', this)" aria-label="Show password">
							<span class="toggle-label">Show</span>
						</button>
					</div>
					<small class="password-hint">Min 8 characters with uppercase, lowercase, number, and symbol.</small>
					<div class="error-message" id="buyer_passwordError"></div>
				</div>

				<div class="form-group">
					<label for="buyer_password_confirm">Confirm Password</label>
					<div class="password-input-wrapper">
						<input type="password" id="buyer_password_confirm" name="password_confirm" required placeholder="Re-enter your password">
						<button type="button" class="toggle-password" onclick="togglePassword('buyer_password_confirm', this)" aria-label="Show password">
							<span class="toggle-label">Show</span>
						</button>
					</div>
					<div class="error-message" id="buyer_password_confirmError"></div>
				</div>

				<div class="form-group">
					<label for="buyer_address">Address</label>
					<textarea id="buyer_address" name="address" required placeholder="Enter your complete address"></textarea>
					<div class="error-message" id="buyer_addressError"></div>
				</div>

				<button type="submit" class="submit-btn" id="buyerSubmitBtn">Create Buyer Account</button>
			</form>

			<div id="sellerAlertContainer"></div>

			<form id="registerSellerForm" class="auth-form register-form" data-role-form="seller" enctype="multipart/form-data" novalidate hidden>
				<input type="hidden" name="role" value="SELLER">

				<div class="form-group">
					<label for="seller_name">Full Name</label>
					<input type="text" id="seller_name" name="name" required placeholder="Owner full name">
					<div class="error-message" id="seller_nameError"></div>
				</div>

				<div class="form-group">
					<label for="seller_email">Email</label>
					<input type="email" id="seller_email" name="email" required placeholder="Business email">
					<div class="error-message" id="seller_emailError"></div>
				</div>

				<div class="form-group">
					<label for="seller_password">Password</label>
					<div class="password-input-wrapper">
						<input type="password" id="seller_password" name="password" required placeholder="Create strong password">
						<button type="button" class="toggle-password" onclick="togglePassword('seller_password', this)" aria-label="Show password">
							<span class="toggle-label">Show</span>
						</button>
					</div>
					<small class="password-hint">Min 8 characters with uppercase, lowercase, number, and symbol.</small>
					<div class="error-message" id="seller_passwordError"></div>
				</div>

				<div class="form-group">
					<label for="seller_password_confirm">Confirm Password</label>
					<div class="password-input-wrapper">
						<input type="password" id="seller_password_confirm" name="password_confirm" required placeholder="Re-enter password">
						<button type="button" class="toggle-password" onclick="togglePassword('seller_password_confirm', this)" aria-label="Show password">
							<span class="toggle-label">Show</span>
						</button>
					</div>
					<div class="error-message" id="seller_password_confirmError"></div>
				</div>

				<div class="form-group">
					<label for="seller_address">Business Address</label>
					<textarea id="seller_address" name="address" required placeholder="Where do you operate from?"></textarea>
					<div class="error-message" id="seller_addressError"></div>
				</div>

				<div class="form-group">
					<label for="seller_store_name">Store Name</label>
					<input type="text" id="seller_store_name" name="store_name" required maxlength="100" placeholder="Storefront name visible to buyers">
					<div class="form-hint">Max 100 characters.</div>
					<div class="error-message" id="seller_store_nameError"></div>
				</div>

				<div class="form-group">
					<label for="seller_store_description">Store Description</label>
					<textarea id="seller_store_description" name="store_description" required placeholder="Describe your products and value proposition"></textarea>
					<div class="form-hint">Share at least a short paragraph about what you sell.</div>
					<div class="error-message" id="seller_store_descriptionError"></div>
				</div>

				<div class="form-group">
					<label for="seller_store_logo">Store Logo</label>
					<input type="file" id="seller_store_logo" name="store_logo" accept="image/png,image/jpeg,image/webp" required>
					<div class="form-hint">Upload PNG, JPG, or WEBP image up to 2MB.</div>
					<div class="error-message" id="seller_store_logoError"></div>
				</div>

				<button type="submit" class="submit-btn" id="sellerSubmitBtn">Create Seller Account</button>
			</form>

			<div class="auth-footer login-redirect">
				Already have an account? <a href="/auth/login">Login here</a>
			</div>
		</section>
	</div>

	<script src="/public/js/api.js"></script>
	<script>
		function togglePassword(inputId, button) {
			const input = document.getElementById(inputId);
			if (!input) {
				return;
			}
			const label = button.querySelector('.toggle-label');
			const isHidden = input.type === 'password';
			input.type = isHidden ? 'text' : 'password';
			if (label) {
				label.textContent = isHidden ? 'Hide' : 'Show';
			}
			button.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
		}

		document.addEventListener('DOMContentLoaded', () => {
			const body = document.body;
			const tabs = document.querySelectorAll('[data-register-option]');
			const forms = {
				buyer: document.getElementById('registerBuyerForm'),
				seller: document.getElementById('registerSellerForm')
			};
			const alertContainers = {
				buyer: document.getElementById('buyerAlertContainer'),
				seller: document.getElementById('sellerAlertContainer')
			};
			const headers = document.querySelectorAll('[data-role-header]');
			const panes = document.querySelectorAll('[data-role-pane]');
			const leftPanel = document.querySelector('.register-panel');

			function setActiveRole(role) {
				const target = role === 'seller' ? 'seller' : 'buyer';

				tabs.forEach(tab => {
					const isActive = tab.dataset.registerOption === target;
					if (tab.classList.contains('register-tab')) {
						tab.classList.toggle('is-active', isActive);
						tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
					}
				});

				Object.keys(forms).forEach(key => {
					const formElement = forms[key];
					if (!formElement) {
						return;
					}
					const isActive = key === target;
					formElement.classList.toggle('is-active', isActive);
					formElement.hidden = !isActive;
					formElement.style.display = isActive ? '' : 'none';
				});

				panes.forEach(pane => {
					const isActive = pane.dataset.rolePane === target;
					pane.classList.toggle('is-active', isActive);
					pane.hidden = !isActive;
				});

				headers.forEach(group => {
					const isActive = group.dataset.roleHeader === target;
					group.classList.toggle('is-active', isActive);
					group.hidden = !isActive;
				});

				body.classList.remove('buyer-register', 'seller-register');
				body.classList.add(`${target}-register`);

				if (leftPanel) {
					leftPanel.classList.remove('buyer-accent', 'seller-accent');
					leftPanel.classList.add(target === 'seller' ? 'seller-accent' : 'buyer-accent');
				}

				const url = new URL(window.location.href);
				url.searchParams.set('role', target);
				window.history.replaceState({}, '', url);
			}

			tabs.forEach(tab => {
				tab.addEventListener('click', () => {
					const target = tab.dataset.registerOption;
					if (target) {
						setActiveRole(target);
					}
				});
			});

			const initialRoleParam = new URLSearchParams(window.location.search).get('role');
			setActiveRole(initialRoleParam === 'seller' ? 'seller' : 'buyer');

			const buyerForm = forms.buyer;
			const buyerSubmitBtn = document.getElementById('buyerSubmitBtn');

			function clearBuyerError(element) {
				if (!element) {
					return;
				}
				element.classList.remove('is-invalid');
				const errorElement = document.getElementById(element.id + 'Error');
				if (errorElement) {
					errorElement.classList.remove('show');
				}
			}

			buyerForm.querySelectorAll('input, textarea').forEach(input => {
				input.addEventListener('input', () => clearBuyerError(input));
			});

			buyerForm.addEventListener('submit', async (event) => {
				event.preventDefault();

				if (!window.api || typeof window.api.post !== 'function') {
					showAlert('buyer', 'Unable to submit form at the moment.', 'error');
					return;
				}

				const formData = new FormData(buyerForm);
				const initialText = buyerSubmitBtn.textContent;
				buyerSubmitBtn.disabled = true;
				buyerSubmitBtn.innerHTML = '<span class="loading"></span>Creating account...';

				try {
					const data = await window.api.post('/auth/register/buyer', formData);
					if (data && data.success) {
						showAlert('buyer', 'Buyer account created! Redirecting...', 'success');
						setTimeout(() => {
							window.location.href = data.data.redirect;
						}, 600);
					}
				} catch (error) {
					handleFormErrors('buyer', error);
				} finally {
					buyerSubmitBtn.disabled = false;
					buyerSubmitBtn.textContent = initialText;
				}
			});

			const sellerForm = forms.seller;
			const sellerSubmitBtn = document.getElementById('sellerSubmitBtn');

			function clearSellerError(element) {
				if (!element) {
					return;
				}
				element.classList.remove('is-invalid');
				const errorElement = document.getElementById(element.id + 'Error');
				if (errorElement) {
					errorElement.classList.remove('show');
				}
			}

			sellerForm.querySelectorAll('input, textarea').forEach(input => {
				const eventName = input.type === 'file' ? 'change' : 'input';
				input.addEventListener(eventName, () => clearSellerError(input));
			});

			sellerForm.addEventListener('submit', async (event) => {
				event.preventDefault();

				if (!window.api || typeof window.api.post !== 'function') {
					showAlert('seller', 'Unable to submit form at the moment.', 'error');
					return;
				}

				const formData = new FormData(sellerForm);
				const initialText = sellerSubmitBtn.textContent;
				sellerSubmitBtn.disabled = true;
				sellerSubmitBtn.innerHTML = '<span class="loading"></span>Creating account...';

				try {
					const data = await window.api.post('/auth/register/seller', formData);
					if (data && data.success) {
						showAlert('seller', 'Seller account created! Redirecting to dashboard...', 'success');
						setTimeout(() => {
							window.location.href = data.data.redirect;
						}, 600);
					}
				} catch (error) {
					handleFormErrors('seller', error);
				} finally {
					sellerSubmitBtn.disabled = false;
					sellerSubmitBtn.textContent = initialText;
				}
			});

			function handleFormErrors(type, error) {
				const response = error || {};
				if (response.errors) {
					Object.keys(response.errors).forEach(field => {
						const fieldId = `${type}_${field}`;
						const input = document.getElementById(fieldId);
						const errorElement = document.getElementById(`${fieldId}Error`);
						if (input && errorElement) {
							input.classList.add('is-invalid');
							errorElement.textContent = response.errors[field];
							errorElement.classList.add('show');
						}
					});
				} else {
					const message = response.message || 'An error occurred. Please try again.';
					showAlert(type, message, 'error');
				}
			}

			function showAlert(type, message, alertType) {
				const container = alertContainers[type];
				if (!container) {
					return;
				}
				const alert = document.createElement('div');
				alert.className = `alert alert-${alertType} show`;
				alert.textContent = message;
				container.innerHTML = '';
				container.appendChild(alert);

				if (alertType === 'error') {
					setTimeout(() => {
						alert.classList.remove('show');
					}, 5000);
				}
			}
		});
	</script>
</body>
</html>
