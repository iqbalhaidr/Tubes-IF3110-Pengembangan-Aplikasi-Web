<?php

require_once __DIR__ . '/../utils/Database.php';

use Exception;
use PDO;

class TopUp
{
  private $db;

  public function __construct()
  {
    $this->db = Database::getInstance();
  }

  public function create($userId, $amount, $midtransOrderId, $snapToken, $status = 'PENDING')
  {
    $stmt = $this->db->prepare("INSERT INTO top_up_history (user_id, amount, midtrans_order_id, snap_token, status) VALUES (:user_id, :amount, :midtrans_order_id, :snap_token, :status) RETURNING top_up_id");
    $stmt->execute([
      ':user_id' => $userId,
      ':amount' => $amount,
      ':midtrans_order_id' => $midtransOrderId,
      ':snap_token' => $snapToken,
      ':status' => $status
    ]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result['top_up_id'];
  }

  public function findByMidtransOrderId($midtransOrderId)
  {
    $stmt = $this->db->prepare("SELECT * FROM top_up_history WHERE midtrans_order_id = :midtrans_order_id");
    $stmt->execute([':midtrans_order_id' => $midtransOrderId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
  }

  public function updateStatus($midtransOrderId, $status)
  {
    $stmt = $this->db->prepare("UPDATE top_up_history SET status = :status WHERE midtrans_order_id = :midtrans_order_id");
    return $stmt->execute([
      ':status' => $status,
      ':midtrans_order_id' => $midtransOrderId
    ]);

  }

  public function getTopUpHistoryByUserId($userId)
  {
    $stmt = $this->db->prepare("SELECT * FROM top_up_history WHERE user_id = :user_id ORDER BY created_at DESC");
    $stmt->execute([':user_id' => $userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }
}
