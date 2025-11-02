<?php
$profileSections = $profileSections ?? [];
$metaSummary = $metaSummary ?? [];
$profileTitle = $profileTitle ?? 'Profile';
$profileSubtitle = $profileSubtitle ?? '';
$mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css');

// Set navbar type and active link (Buyer only)
$navbarType = 'buyer';
$activeLink = 'profile';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Profile</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/modal.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/profile.css?v=<?= $mainCssVersion ?>">
</head>
<body class="profile-page">
    <?php include __DIR__ . '/../components/navbar.php'; ?>

    <main class="profile-main">
        <div class="container">
            <header class="profile-header" data-role-header="buyer">
                <span class="profile-kicker">Account Overview</span>
                <h1 class="profile-title"><?= htmlspecialchars($profileTitle) ?></h1>
                <p class="profile-subtitle"><?= htmlspecialchars($profileSubtitle) ?></p>
            </header>

            <section class="profile-layout">
                <div class="profile-panels">
                    <?php foreach ($profileSections as $section): ?>
                        <article class="profile-card">
                            <div class="profile-card-header">
                                <h2><?= htmlspecialchars($section['title']) ?></h2>
                            </div>
                            <dl class="profile-details">
                                <?php foreach ($section['items'] as $item): ?>
                                    <div class="profile-detail-row">
                                        <dt><?= htmlspecialchars($item['label']) ?></dt>
                                        <dd>
                                            <?= nl2br(htmlspecialchars($item['value'])) ?>
                                        </dd>
                                    </div>
                                <?php endforeach; ?>
                            </dl>
                        </article>
                    <?php endforeach; ?>
                </div>
                <aside class="profile-sidebar">
                    <div class="profile-card summary-card">
                        <div class="profile-card-header">
                            <h2>Quick Summary</h2>
                        </div>
                        <dl class="profile-details">
                            <?php foreach ($metaSummary as $item): ?>
                                <div class="profile-detail-row">
                                    <dt><?= htmlspecialchars($item['label']) ?></dt>
                                    <dd><?= nl2br(htmlspecialchars($item['value'])) ?></dd>
                                </div>
                            <?php endforeach; ?>
                        </dl>
                        <div class="profile-actions">
                            <button type="button" class="btn btn-primary" id="editProfileBtn">Edit Profile</button>
                            <button type="button" class="btn btn-secondary" id="changePasswordBtn">Change Password</button>
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    </main>

    <!-- Buyer Edit Profile Modal -->
    <?php if ($currentRole === 'BUYER'): ?>
        <!-- Edit Profile Modal -->
        <div id="editProfileModal" class="modal hidden">
            <div class="modal-overlay" id="editProfileOverlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Profile</h2>
                    <button type="button" class="modal-close" id="editProfileClose">&times;</button>
                </div>
                <form id="editProfileForm" class="modal-form">
                    <div class="form-group">
                        <label for="edit_name">Full Name</label>
                        <input type="text" id="edit_name" name="name" required placeholder="Your full name">
                        <div class="error-message" id="edit_nameError"></div>
                    </div>
                    <div class="form-group">
                        <label for="edit_address">Address</label>
                        <textarea id="edit_address" name="address" required placeholder="Your complete address"></textarea>
                        <div class="error-message" id="edit_addressError"></div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="editProfileCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="editProfileSubmit">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Change Password Modal -->
        <div id="changePasswordModal" class="modal hidden">
            <div class="modal-overlay" id="changePasswordOverlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Change Password</h2>
                    <button type="button" class="modal-close" id="changePasswordClose">&times;</button>
                </div>
                <form id="changePasswordForm" class="modal-form">
                    <div class="form-group">
                        <label for="current_password">Current Password</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="current_password" name="old_password" required placeholder="Enter current password">
                            <button type="button" class="toggle-password" onclick="togglePassword('current_password', this)"></button>
                        </div>
                        <div class="error-message" id="current_passwordError"></div>
                    </div>
                    <div class="form-group">
                        <label for="new_password">New Password</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="new_password" name="new_password" required placeholder="Minimum 8 characters">
                            <button type="button" class="toggle-password" onclick="togglePassword('new_password', this)"></button>
                        </div>
                        <small class="password-hint">Use a combination of uppercase, lowercase, numbers, and symbols.</small>
                        <div class="error-message" id="new_passwordError"></div>
                    </div>
                    <div class="form-group">
                        <label for="confirm_new_password">Confirm New Password</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="confirm_new_password" name="new_password_confirm" required placeholder="Repeat new password">
                            <button type="button" class="toggle-password" onclick="togglePassword('confirm_new_password', this)"></button>
                        </div>
                        <div class="error-message" id="confirm_new_passwordError"></div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="changePasswordCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="changePasswordSubmit">Change Password</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Password Confirmation Modal -->
        <div id="passwordConfirmModal" class="modal hidden">
            <div class="modal-overlay" id="passwordConfirmOverlay"></div>
            <div class="modal-content modal-small password-confirm-modal">
                <div class="modal-header">
                    <h2>Confirm Password Change</h2>
                    <button type="button" class="modal-close" id="passwordConfirmClose">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="confirm-text">Are you sure you want to change your password? This action cannot be undone.</p>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" id="passwordConfirmCancel">No, Cancel</button>
                    <button type="button" class="btn btn-primary" id="passwordConfirmSubmit">Yes</button>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>
    <script src="/public/js/api.js"></script>
    <script src="/public/js/balance.js"></script>
    <script src="/public/js/main.js"></script>
    <script src="/public/js/profile-edit.js"></script>
</body>
</html>
