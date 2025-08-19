import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ⚡ Cashfree Sandbox Keys (replace with live in production)
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_BASE = "https://api.cashfree.com/pg";
// change to  for live

// ✅ Create Donation Order
app.post("/donate", async (req, res) => {
  try {
    const { amount, donorName, donorEmail, phone } = req.body;

    const orderId = "donate_" + Date.now(); // unique order id
    const customerId =
      donorEmail?.replace(/[^a-zA-Z0-9_-]/g, "_") || "guest_" + Date.now();

    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId, // ✅ sanitized
        customer_name: donorName || "Guest Donor",
        customer_email: donorEmail || "guest@example.com",
        customer_phone: phone,
      },
      order_meta: {
        return_url: "client://payment-success?order_id={order_id}",
      },
    };

    // Call Cashfree API
    const response = await axios.post(
      `${CASHFREE_API_BASE}/orders`,
      orderPayload,
      {
        headers: {
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      success: true,
      paymentSessionId: response.data.payment_session_id,
      orderId,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Donation order failed" });
  }
});

// ✅ Verify Payment (optional, for logs)
app.post("/verify-payment", async (req, res) => {
  try {
    const { orderId } = req.body;

    const response = await axios.get(`${CASHFREE_API_BASE}/orders/${orderId}`, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
      },
    });

    res.json({ success: true, order: response.data });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res
      .status(500)
      .json({ success: false, error: "Payment verification failed" });
  }
});

app.listen(5000, () => {
  console.log("Cashfree Donate Backend running on http://localhost:5000");
});
