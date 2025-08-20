import express from "express";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const CASHFREE_API_URL = "https://api.cashfree.com/pg/orders";
const MERCHANT_ID = process.env.CASHFREE_APP_ID;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const API_VERSION = "2023-08-01";

app.use(express.json());

// Route to create an order
app.post("/create-order", async (req, res) => {
  const { orderId, orderAmount, orderCurrency, orderNote, customerDetails } =
    req.body;

  const orderData = {
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: orderCurrency,
    order_note: orderNote,
    customer_details: customerDetails,
    // ✅ ADDED: The required return_url for redirection after payment
    order_meta: {
      return_url: "https://thankyou-gamma.vercel.app/",
    },
  };

  try {
    const response = await axios.post(
      `${CASHFREE_API_URL}/sessions`,
      orderData,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-version": API_VERSION,
          "x-request-id": crypto.randomUUID(),
          "x-client-id": MERCHANT_ID, // ADDED: Client ID for authentication
          "x-client-secret": SECRET_KEY, // ADDED: Secret Key for authentication
          "x-idempotency-key": crypto.randomUUID(),
        },
      }
    );

    res.json({ payment_session_id: response.data.payment_session_id });
  } catch (error) {
    console.error(
      "Cashfree order creation error:",
      error.response?.data || error.message
    );
    res.status(500).send("Error creating order");
  }
});

// Route to verify payment status
app.get("/verify-payment/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const response = await axios.get(`${CASHFREE_API_URL}/${orderId}`, {
      headers: {
        "Content-Type": "application/json",
        "x-api-version": API_VERSION,
        "x-request-id": crypto.randomUUID(),
        "x-client-id": MERCHANT_ID, // ADDED: Client ID for authentication
        "x-client-secret": SECRET_KEY, // ADDED: Secret Key for authentication
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Cashfree verification error:",
      error.response?.data || error.message
    );
    res.status(500).send("Error verifying payment");
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
