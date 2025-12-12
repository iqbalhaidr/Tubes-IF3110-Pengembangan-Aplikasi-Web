<?php
require_once __DIR__ . '/../components/header.php';
?>

<div class="container my-5">
    <div class="row justify-content-center">
        <div class="col-lg-6">
            <div class="card shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0">Top Up Balance</h4>
                </div>
                <div class="card-body">
                    <?php if (isset($_GET['error'])) : ?>
                        <div class="alert alert-danger" role="alert">
                            <?= htmlspecialchars($_GET['error']) ?>
                        </div>
                    <?php endif; ?>
                    <form action="/topup/process" method="POST">
                        <div class="mb-3">
                            <label for="amount" class="form-label">Amount</label>
                            <input type="number" class="form-control" id="amount" name="amount" min="10000" required value="<?= isset($amount) ? htmlspecialchars($amount) : '' ?>">
                            <div class="form-text">Minimum top up amount is IDR 10,000.</div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Payment Method</label>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="paymentMethod" id="paymentMidtrans" value="midtrans" checked>
                                <label class="form-check-label" for="paymentMidtrans">
                                    Midtrans
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="paymentMethod" id="paymentManual" value="manual">
                                <label class="form-check-label" for="paymentManual">
                                    Manual Top Up (Admin Approval Required)
                                </label>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary w-100">Top Up Now</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
require_once __DIR__ . '/../components/footer.php';
?>
