<?php
require_once __DIR__ . '/../components/header.php';
?>

<div class="container my-5">
    <div class="row justify-content-center">
        <div class="col-lg-6">
            <div class="card shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0">Complete Your Payment</h4>
                </div>
                <div class="card-body text-center">
                    <p>Click the button below to complete your payment.</p>
                    <div id="snap-container"></div>
                    <button id="pay-button" class="btn btn-success">Pay Now</button>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="<?= $clientKey ?>"></script>
<script type="text/javascript">
    document.getElementById('pay-button').onclick = function() {
        snap.pay('<?= $snapToken ?>', {
            onSuccess: function(result) {
                console.log('success', result);
                window.location.href = '/profile?topup=success';
            },
            onPending: function(result) {
                console.log('pending', result);
                window.location.href = '/profile?topup=pending';
            },
            onError: function(result) {
                console.log('error', result);
                window.location.href = '/topup?error=Payment failed';
            },
            onClose: function() {
                console.log('customer closed the popup without finishing the payment');
            }
        });
    };
</script>

<?php
require_once __DIR__ . '/../components/footer.php';
?>
