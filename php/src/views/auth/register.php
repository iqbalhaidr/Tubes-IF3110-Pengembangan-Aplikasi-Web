<?php $authCssVersion = filemtime(__DIR__ . '/../../public/css/auth.css'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Create Account - Nimonspedia</title>
	<link rel="stylesheet" href="/public/css/auth.css?v=<?= $authCssVersion ?>">
</head>
<body class="auth-body register-page buyer-register">
	<div class="auth-shell register-shell">
		<div class="auth-brand">Nimonspedia</div>
		<p class="auth-tagline">Satu akun untuk menjelajah katalog Nimons dan membuka toko favoritmu.</p>

		<div class="register-card">
			<div class="register-tabs" role="tablist">
				<button type="button" class="register-tab is-active" data-register-option="buyer" aria-selected="true" aria-controls="registerBuyerForm">
					<span class="tab-title">Buyer</span>
					<span class="tab-subtitle">Belanja produk Nimons</span>
				</button>
				<button type="button" class="register-tab" data-register-option="seller" aria-selected="false" aria-controls="registerSellerForm">
					<span class="tab-title">Seller</span>
					<span class="tab-subtitle">Kelola katalog & toko</span>
				</button>
			</div>

			<div class="auth-header">
				<div class="header-group is-active" data-role-header="buyer">
					<h2>Buat akun Buyer</h2>
					<p class="subtitle">Masukkan data diri untuk mulai belanja.</p>
				</div>
				<div class="header-group" data-role-header="seller">
					<h2>Buat akun Seller</h2>
					<p class="subtitle">Informasi toko membantu pembeli menemukanmu.</p>
				</div>
			</div>

			<div id="buyerAlertContainer"></div>

			<form id="registerBuyerForm" class="auth-form register-form is-active" data-role-form="buyer">
				<input type="hidden" name="role" value="BUYER">

				<div class="form-group">
					<label for="buyer_name">Nama lengkap</label>
					<input type="text" id="buyer_name" name="name" required placeholder="Nama lengkap kamu">
					<div class="error-message" id="buyer_nameError"></div>
				</div>

				<div class="form-group">
					<label for="buyer_email">Email</label>
					<input type="email" id="buyer_email" name="email" required placeholder="Email aktif">
					<div class="error-message" id="buyer_emailError"></div>
				</div>

				<div class="form-group">
					<label for="buyer_password">Password</label>
					<div class="password-input-wrapper">
						<input type="password" id="buyer_password" name="password" required placeholder="Minimal 8 karakter">
						<button type="button" class="toggle-password" onclick="togglePassword('buyer_password', this)" aria-label="Tampilkan password">
							<span class="toggle-label">Tampilkan</span>
						</button>
					</div>
					<small class="password-hint">Gunakan kombinasi huruf besar, kecil, angka, dan simbol.</small>
					<div class="error-message" id="buyer_passwordError"></div>
				</div>

				<div class="form-group">
					<label for="buyer_password_confirm">Konfirmasi password</label>
					<div class="password-input-wrapper">
						<input type="password" id="buyer_password_confirm" name="password_confirm" required placeholder="Ulangi password">
						<button type="button" class="toggle-password" onclick="togglePassword('buyer_password_confirm', this)" aria-label="Tampilkan password">
							<span class="toggle-label">Tampilkan</span>
						</button>
					</div>
					<div class="error-message" id="buyer_password_confirmError"></div>
				</div>

				<div class="form-group">
					<label for="buyer_address">Alamat lengkap</label>
					<textarea id="buyer_address" name="address" required placeholder="Tuliskan alamat pengiriman"></textarea>
					<div class="error-message" id="buyer_addressError"></div>
				</div>

				<button type="submit" class="submit-btn" id="buyerSubmitBtn">Daftar sebagai Buyer</button>
				<p class="auth-note">Ingin membuka toko? <button class="link-button" type="button" data-register-option="seller">Daftar sebagai seller</button></p>
			</form>

			<div id="sellerAlertContainer"></div>

			<form id="registerSellerForm" class="auth-form register-form" data-role-form="seller" enctype="multipart/form-data" novalidate hidden>
				<input type="hidden" name="role" value="SELLER">

				<div class="form-group">
					<label for="seller_name">Nama pemilik</label>
					<input type="text" id="seller_name" name="name" required placeholder="Nama pemilik toko">
					<div class="error-message" id="seller_nameError"></div>
				</div>

				<div class="form-group">
					<label for="seller_email">Email</label>
					<input type="email" id="seller_email" name="email" required placeholder="Email bisnis">
					<div class="error-message" id="seller_emailError"></div>
				</div>

				<div class="form-group">
					<label for="seller_password">Password</label>
					<div class="password-input-wrapper">
						<input type="password" id="seller_password" name="password" required placeholder="Minimal 8 karakter">
						<button type="button" class="toggle-password" onclick="togglePassword('seller_password', this)" aria-label="Tampilkan password">
							<span class="toggle-label">Tampilkan</span>
						</button>
					</div>
					<small class="password-hint">Gunakan kombinasi huruf besar, kecil, angka, dan simbol.</small>
					<div class="error-message" id="seller_passwordError"></div>
				</div>

				<div class="form-group">
					<label for="seller_password_confirm">Konfirmasi password</label>
					<div class="password-input-wrapper">
						<input type="password" id="seller_password_confirm" name="password_confirm" required placeholder="Ulangi password">
						<button type="button" class="toggle-password" onclick="togglePassword('seller_password_confirm', this)" aria-label="Tampilkan password">
							<span class="toggle-label">Tampilkan</span>
						</button>
					</div>
					<div class="error-message" id="seller_password_confirmError"></div>
				</div>

				<div class="form-group">
					<label for="seller_address">Alamat usaha</label>
					<textarea id="seller_address" name="address" required placeholder="Lokasi operasional"></textarea>
					<div class="error-message" id="seller_addressError"></div>
				</div>

				<div class="form-group">
					<label for="seller_store_name">Nama toko</label>
					<input type="text" id="seller_store_name" name="store_name" required maxlength="100" placeholder="Nama yang tampil ke pembeli">
					<div class="form-hint">Maksimal 100 karakter.</div>
					<div class="error-message" id="seller_store_nameError"></div>
				</div>

				<div class="form-group">
					<label for="seller_store_description">Deskripsi toko</label>
					<textarea id="seller_store_description" name="store_description" required placeholder="Ceritakan produk dan nilai jual"></textarea>
					<div class="form-hint">Berikan gambaran singkat tentang produkmu.</div>
					<div class="error-message" id="seller_store_descriptionError"></div>
				</div>

				<div class="form-group">
					<label for="seller_store_logo">Logo toko</label>
					<input type="file" id="seller_store_logo" name="store_logo" accept="image/png,image/jpeg,image/webp" required>
					<div class="form-hint">PNG, JPG, atau WEBP maksimal 2MB.</div>
					<div class="error-message" id="seller_store_logoError"></div>
				</div>

				<button type="submit" class="submit-btn" id="sellerSubmitBtn">Daftar sebagai Seller</button>
				<p class="auth-note">Mau belanja saja? <button class="link-button" type="button" data-register-option="buyer">Daftar sebagai buyer</button></p>
			</form>

			<div class="auth-footer login-redirect">
				Sudah punya akun? <a href="/auth/login">Masuk di sini</a>
			</div>
		</div>
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
				label.textContent = isHidden ? 'Sembunyikan' : 'Tampilkan';
			}
			button.setAttribute('aria-label', isHidden ? 'Sembunyikan password' : 'Tampilkan password');
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
				});

				headers.forEach(group => {
					const isActive = group.dataset.roleHeader === target;
					group.classList.toggle('is-active', isActive);
					group.hidden = !isActive;
				});

				body.classList.remove('buyer-register', 'seller-register');
				body.classList.add(`${target}-register`);

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

			if (buyerForm && buyerSubmitBtn) {
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
						showAlert('buyer', 'Saat ini formulir tidak dapat dikirim. Coba lagi nanti.', 'error');
						return;
					}

					const formData = new FormData(buyerForm);
					const initialText = buyerSubmitBtn.textContent;
					buyerSubmitBtn.disabled = true;
					buyerSubmitBtn.innerHTML = '<span class="loading"></span>Memproses...';

					try {
						const data = await window.api.post('/auth/register/buyer', formData);
						if (data && data.success) {
							showAlert('buyer', 'Akun buyer berhasil dibuat! Mengalihkan...', 'success');
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
			}

			const sellerForm = forms.seller;
			const sellerSubmitBtn = document.getElementById('sellerSubmitBtn');

			if (sellerForm && sellerSubmitBtn) {
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
						showAlert('seller', 'Saat ini formulir tidak dapat dikirim. Coba lagi nanti.', 'error');
						return;
					}

					const formData = new FormData(sellerForm);
					const initialText = sellerSubmitBtn.textContent;
					sellerSubmitBtn.disabled = true;
					sellerSubmitBtn.innerHTML = '<span class="loading"></span>Memproses...';

					try {
						const data = await window.api.post('/auth/register/seller', formData);
						if (data && data.success) {
							showAlert('seller', 'Akun seller berhasil dibuat! Mengalihkan...', 'success');
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
			}

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
					const message = response.message || 'Terjadi kesalahan. Silakan coba lagi.';
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
