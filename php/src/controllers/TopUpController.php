<?php

// namespace App\Controllers; // Removed namespace

require_once __DIR__ . '/../models/TopUp.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Order.php'; // Added this line
require_once __DIR__ . '/../utils/Response.php';

use Midtrans\Notification;

class TopUpController
{
  private $topUpModel;
  private $userModel;
  private $orderModel; // Added for order handling

  public function __construct()
  {
    $this->topUpModel = new TopUp();
    $this->userModel = new User();
    $this->orderModel = new Order(); // Instantiate Order model

    Midtrans\Config::$serverKey = $_ENV['MIDTRANS_SERVER_KEY'];
    Midtrans\Config::$isProduction = $_ENV['MIDTRANS_ENV'] === 'production';
    Midtrans\Config::$isSanitized = true;
    Midtrans\Config::$is3ds = true;
  }

  public function showTopUpPage()
  {
    \AuthMiddleware::requireLogin(); // Ensure user is logged in
    $user = \AuthMiddleware::getCurrentUser(); // Get current user from session
    $amount = $_GET['amount'] ?? null;
    include __DIR__ . '/../views/topup/index.php';
  }

      public function processTopUp()
    {
      \AuthMiddleware::requireLogin(); // Ensure user is logged in
      $user = \AuthMiddleware::getCurrentUser(); // Get current user from session
      $amount = (int)$_POST['amount'];
      $paymentMethod = $_POST['paymentMethod'] ?? 'midtrans'; // Default to midtrans
  
      if ($amount <= 0) {
        header('Location: /topup?error=Invalid amount');
        exit();
      }
  
      if ($paymentMethod === 'manual') {
          try {
              // For manual top-up, create a PENDING record without Midtrans details
              $this->topUpModel->create($user['user_id'], $amount, null, null, 'PENDING');
              header('Location: /buyer/topup-history?status=pending_manual');
              exit();
          } catch (Exception $e) {
              header('Location: /topup?error=' . $e->getMessage());
              exit();
          }
      } else { // Midtrans payment
          $midtransOrderId = 'TOPUP-' . $user['user_id'] . '-' . time();
  
          $params = [
            'transaction_details' => [
              'order_id' => $midtransOrderId,
              'gross_amount' => $amount,
            ],
            'customer_details' => [
              'first_name' => $user['name'],
              'email' => $user['email'],
            ],
          ];
  
          try {
            $snapToken = Midtrans\Snap::getSnapToken($params);
            $this->topUpModel->create($user['user_id'], $amount, $midtransOrderId, $snapToken, 'PENDING_PAYMENT');
            header('Location: /topup/pay?token=' . $snapToken);
            exit();
          } catch (Exception $e) {
            header('Location: /topup?error=' . $e->getMessage());
            exit();
          }
      }
    }
  public function showPaymentPage()
  {
    \AuthMiddleware::requireLogin(); // Ensure user is logged in
    $snapToken = $_GET['token'];
    $clientKey = $_ENV['MIDTRANS_CLIENT_KEY'];
    $env = $_ENV['MIDTRANS_ENV'];
    include __DIR__ . '/../views/topup/pay.php';
  }

  public function initiateMidtransPayment()
  {
    \AuthMiddleware::requireLogin(); // Ensure user is logged in

    $user = \AuthMiddleware::getCurrentUser(); // Get current user from session

    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    $amount = (int)($data['amount'] ?? 0);

    if ($amount <= 0) {
      \Response::json(['success' => false, 'message' => 'Invalid amount'], 400);
      exit();
    }

    $midtransOrderId = 'TOPUP-' . $user['user_id'] . '-' . time();

    $params = [
      'transaction_details' => [
        'order_id' => $midtransOrderId,
        'gross_amount' => $amount,
      ],
      'item_details' => [
        [
            'id' => 'TOPUP-' . $user['user_id'],
            'price' => $amount,
            'quantity' => 1,
            'name' => 'Top Up Balance'
        ]
      ],
      'customer_details' => [
        'first_name' => $user['name'],
        'email' => $user['email'],
      ],
      // Add more details if needed, e.g., expiry, item_details
    ];

    try {
      $snapToken = Midtrans\Snap::getSnapToken($params);
      $this->topUpModel->create($user['user_id'], $amount, $midtransOrderId, $snapToken, 'PENDING_PAYMENT');

      \Response::json(['success' => true, 'snapToken' => $snapToken, 'midtransOrderId' => $midtransOrderId]);
    } catch (\Exception $e) {
      \Response::json(['success' => false, 'message' => $e->getMessage()], 500);
    }
  }

  public function notificationHandler()
  {
    error_log("NOTIFICATION: Midtrans notification handler initiated.");
    $notif = new Notification();

    $transaction = $notif->transaction_status;
    $type = $notif->payment_type;
    $orderId = $notif->order_id;
    $fraud = $notif->fraud_status;

    error_log("NOTIFICATION: Received data - Order ID: $orderId, Status: $transaction, Type: $type, Fraud: $fraud.");
    error_log("TOPUP_HANDLER: Raw notification data - transaction: $transaction, type: $type, fraud: $fraud");

    if (strpos($orderId, 'TOPUP-') === 0) {
        error_log("NOTIFICATION: Delegating to handleTopUpNotification for Order ID: $orderId.");
        $this->handleTopUpNotification($orderId, $transaction, $type, $fraud);
    } elseif (strpos($orderId, 'ORDER-') === 0) {
        error_log("NOTIFICATION: Delegating to handleOrderNotification for Order ID: $orderId.");
        $this->handleOrderNotification($notif, $orderId, $transaction, $type, $fraud);
    } else {
        error_log("NOTIFICATION: ERROR - Unknown order ID format received: $orderId.");
        \Response::json(['status' => 'error', 'message' => 'Unknown order ID format'], 400);
        exit();
    }
  }

  private function handleTopUpNotification($orderId, $transaction, $type, $fraud)
  {
    error_log("TOPUP_HANDLER: Initiated for Order ID: $orderId.");
    $topup = $this->topUpModel->findByMidtransOrderId($orderId);

    if (!$topup) {
        error_log("TOPUP_HANDLER: ERROR - TopUp record not found for order ID: $orderId.");
        \Response::json(['status' => 'error', 'message' => 'TopUp record not found'], 404);
        exit();
    }

    error_log("TOPUP_HANDLER: Found TopUp record (ID: {$topup['top_up_id']}, Current Status: {$topup['status']}).");
    error_log("TOPUP_HANDLER: Details of topup record: " . json_encode($topup));

    if ($topup['status'] === 'COMPLETED') {
        error_log("TOPUP_HANDLER: TopUp ID {$topup['top_up_id']} already COMPLETED. Skipping duplicate notification.");
        \Response::json(['status' => 'ok', 'message' => 'TopUp already completed']);
        exit();
    }

    $oldStatus = $topup['status'];
    $newStatus = $oldStatus;

    if ($transaction == 'capture') {
        if ($type == 'credit_card') {
            if ($fraud == 'challenge') {
                $newStatus = 'CHALLENGE';
            } else {
                $newStatus = 'SUCCESS'; // Changed from COMPLETED to SUCCESS
            }
        }
    } else if ($transaction == 'settlement') {
        $newStatus = 'SUCCESS'; // Changed from COMPLETED to SUCCESS
    } else if ($transaction == 'pending') {
        $newStatus = 'PENDING';
    } else if ($transaction == 'deny') {
        $newStatus = 'DENIED';
    } else if ($transaction == 'expire') {
        $newStatus = 'EXPIRED';
    } else if ($transaction == 'cancel') {
        $newStatus = 'CANCELLED';
    }

    error_log("TOPUP_HANDLER: Determined new status: $newStatus (from transaction: $transaction).");

    if ($newStatus !== $oldStatus) {
        error_log("TOPUP_HANDLER: Updating status for TopUp ID {$topup['top_up_id']} from $oldStatus to $newStatus.");
        $updateResult = $this->topUpModel->updateStatus($topup['midtrans_order_id'], $newStatus);
        if ($updateResult) {
            error_log("TOPUP_HANDLER: Status update successful for TopUp ID {$topup['top_up_id']}.");
        } else {
            error_log("TOPUP_HANDLER: ERROR - Status update FAILED for TopUp ID {$topup['top_up_id']}.");
        }

        if ($newStatus === 'SUCCESS') { // Changed from COMPLETED to SUCCESS
            error_log("TOPUP_HANDLER: Attempting to add balance for User ID {$topup['user_id']}, Amount: {$topup['amount']}.");
            error_log("TOPUP_HANDLER: Topup amount: {$topup['amount']}, User ID: {$topup['user_id']}");
            $balanceResult = $this->userModel->topUpBalance($topup['user_id'], $topup['amount']);
            error_log("TOPUP_HANDLER: Result of topUpBalance call: " . json_encode($balanceResult));
            if ($balanceResult['success']) {
                error_log("TOPUP_HANDLER: Balance added successfully for User ID {$topup['user_id']}. New balance: {$balanceResult['balance']}.");
            } else {
                error_log("TOPUP_HANDLER: ERROR - Failed to add balance for User ID {$topup['user_id']}: {$balanceResult['message']}.");
            }
        }
    } else {
        error_log("TOPUP_HANDLER: Status for TopUp ID {$topup['top_up_id']} remains $oldStatus (no change needed).");
    }

    \Response::json(['status' => 'ok', 'message' => 'TopUp notification processed']);
  }

  private function handleOrderNotification($notif, $orderId, $transaction, $type, $fraud)
  {
    error_log("ORDER_HANDLER: Initiated for primary Order ID: $orderId.");

    // Determine the new status based on Midtrans transaction status
    $newStatus = null;
    if (($transaction == 'capture' || $transaction == 'settlement') && $fraud == 'accept') {
        $newStatus = 'WAITING_APPROVAL';
    } else if ($transaction == 'cancel' || $transaction == 'deny' || $transaction == 'expire') {
        $newStatus = 'REJECTED';
    }

    if ($newStatus) {
        error_log("ORDER_HANDLER: New status is '$newStatus'. Updating all related orders for parent Midtrans ID $orderId.");
        $updatedOrders = $this->orderModel->updateOrderStatusByBuyerAndTimestamp($orderId, $newStatus);

        if ($updatedOrders) {
            error_log("ORDER_HANDLER: Successfully updated " . count($updatedOrders) . " orders related to Midtrans ID $orderId.");
        } else {
            error_log("ORDER_HANDLER: ERROR or no orders to update for Midtrans ID $orderId (they may have been updated already).");
        }
    } else {
        error_log("ORDER_HANDLER: No status change needed for transaction status '$transaction' and fraud status '$fraud'.");
    }
    
    \Response::json(['status' => 'ok', 'message' => 'Order notification processed']);
  }

  private function updateSingleOrderStatus($midtransOrderId, $newStatus) {
    $order = $this->orderModel->findByMidtransOrderId($midtransOrderId);

    if (!$order) {
        error_log("ORDER_HANDLER: ERROR - Order record not found for Midtrans order ID: $midtransOrderId.");
        // We should not send a 404 response here, as other orders might be processed.
        return; 
    }

    error_log("ORDER_HANDLER: Found Order record (ID: {$order['order_id']}, Current Status: {$order['status']}).");

    if (in_array($order['status'], ['WAITING_APPROVAL', 'APPROVED', 'ON_DELIVERY', 'RECEIVED', 'REJECTED'])) {
        error_log("ORDER_HANDLER: Order ID {$order['order_id']} already in {$order['status']}. Skipping duplicate notification.");
        return;
    }

    $oldStatus = $order['status'];

    if ($newStatus !== $oldStatus) {
        error_log("ORDER_HANDLER: Updating status for Order ID {$order['order_id']} from $oldStatus to $newStatus.");
        $updateResult = $this->orderModel->updateStatusByMidtransOrderId($midtransOrderId, $newStatus);
        if ($updateResult) {
            error_log("ORDER_HANDLER: Status update successful for Order ID {$order['order_id']}.");
        } else {
            error_log("ORDER_HANDLER: ERROR - Status update FAILED for Order ID {$order['order_id']}.");
        }
    } else {
        error_log("ORDER_HANDLER: Status for Order ID {$order['order_id']} remains $oldStatus (no change needed).");
    }
  }
}
