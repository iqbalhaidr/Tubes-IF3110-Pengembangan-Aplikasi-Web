import midtransclient from 'midtrans-client';
import { pool } from '../db.js';

const apiClient = new midtransclient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export const handleWebhook = async (req, res) => {
    console.log('Webhook received:', req.body);
    const notification = req.body;

    try {
        const statusResponse = await apiClient.transaction.notification(notification);
        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`);

        let newStatus;
        if (transactionStatus == 'capture') {
            if (fraudStatus == 'accept') {
                newStatus = 'SUCCESS';
            }
        } else if (transactionStatus == 'settlement') {
            newStatus = 'SUCCESS';
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            newStatus = 'FAILED';
        } else if (transactionStatus == 'pending') {
            newStatus = 'PENDING';
        }

        if (newStatus) {
            if (orderId.startsWith('TOPUP-')) {
                await updateTopUpStatus(orderId, newStatus);
            } else if (orderId.startsWith('ORDER-')) {
                await updateOrderStatus(orderId, newStatus);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Error');
    }
};

async function updateTopUpStatus(orderId, status) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM top_up_history WHERE midtrans_order_id = $1 FOR UPDATE', [orderId]);
        const topUp = rows[0];

        if (topUp && topUp.status !== 'SUCCESS') {
            await client.query('UPDATE top_up_history SET status = $1 WHERE midtrans_order_id = $2', [status, orderId]);
            if (status === 'SUCCESS') {
                await client.query('UPDATE "user" SET balance = balance + $1 WHERE user_id = $2', [topUp.amount, topUp.user_id]);
            }
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function updateOrderStatus(orderId, status) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM "order" WHERE midtrans_order_id = $1 FOR UPDATE', [orderId]);
        
        for (const order of rows) {
            if (order.status !== 'APPROVED' && order.status !== 'RECEIVED' && order.status !== 'ON_DELIVERY') {
                let newStatus;
                if (status === 'SUCCESS') {
                    newStatus = 'WAITING_APPROVAL';
                } else if (status === 'FAILED') {
                    newStatus = 'REJECTED';
                }

                if (newStatus) {
                    await client.query('UPDATE "order" SET status = $1 WHERE order_id = $2', [newStatus, order.order_id]);
                }
            }
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
