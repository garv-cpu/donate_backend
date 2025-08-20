import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const CASHFREE_API_URL = 'https://sandbox.cashfree.com/pg/orders';
const MERCHANT_ID = process.env.CASHFREE_APP_ID;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const API_VERSION = '2023-08-01';

app.use(express.json());

// Route to create an order
app.post('/donate', async (req, res) => {
  const { orderId, orderAmount, orderCurrency, orderNote, customerDetails } = req.body;

  const orderData = {
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: orderCurrency,
    order_note: orderNote,
    customer_details: customerDetails,
    // Add return_url here if needed for redirection after payment
  };

  try {
    const response = await axios.post(
      `${CASHFREE_API_URL}/sessions`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': API_VERSION,
          'x-request-id': crypto.randomUUID(),
          'x-client-id': MERCHANT_ID, // ADDED: Client ID for authentication
          'x-client-secret': SECRET_KEY, // ADDED: Secret Key for authentication
        },
      }
    );

    // Check if the response was successful
    if (response.status === 200) {
      res.json(response.data);
    } else {
      console.error('Cashfree API error:', response.data);
      res.status(response.status).send('Cashfree API error');
    }

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Error creating order');
  }
});

// Route to verify payment status
app.post('/verify-payment', async (req, res) => {
  const { orderId, paymentId } = req.body;

  try {
    const response = await axios.get(
      `${CASHFREE_API_URL}/orders/${orderId}/payments/${paymentId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': API_VERSION,
          'x-request-id': crypto.randomUUID(),
          'x-client-id': MERCHANT_ID, // ADDED: Client ID for authentication
          'x-client-secret': SECRET_KEY, // ADDED: Secret Key for authentication
        },
      }
    );

    if (response.status === 200) {
      res.json(response.data);
    } else {
      console.error('Cashfree API error:', response.data);
      res.status(response.status).send('Cashfree API error');
    }

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Error verifying payment');
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});