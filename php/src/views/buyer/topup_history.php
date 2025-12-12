<?php 
include __DIR__ . '/../components/header.php';
?>

<div class="container my-5">
    <h1>Top Up History</h1>

    <?php if (!empty($topUpHistory)): ?>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Midtrans Order ID</th>
                    <th>Created At</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($topUpHistory as $topUp): ?>
                    <tr>
                        <td><?= htmlspecialchars($topUp['top_up_id']) ?></td>
                        <td>Rp <?= number_format($topUp['amount'], 0, ',', '.') ?></td>
                        <td><?= htmlspecialchars($topUp['status']) ?></td>
                        <td><?= htmlspecialchars($topUp['midtrans_order_id'] ?? '-') ?></td>
                        <td><?= htmlspecialchars($topUp['created_at']) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php else: ?>
        <p>No top-up history found.</p>
    <?php endif; ?>

    <a href="/topup" class="btn btn-primary">Back to Top Up</a>
</div>

<?php 
include __DIR__ . '/../components/footer.php';
?>
