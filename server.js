import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Cashfree Production API Base
const CASHFREE_API_BASE = "https://api.cashfree.com/pg";
const CASHFREE_CLIENT_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_SECRET_KEY;

// Donation endpoint
app.post("/donate", async (req, res) => {
  try {
    const { name, email, phone, amount } = req.body;

    // create unique order id
    const orderId = `donate_${Date.now()}`;

    // call Cashfree Orders API
    const response = await axios.post(
      `${CASHFREE_API_BASE}/orders`,
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: phone || `cust_${Date.now()}`,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
        },
      },
      {
        headers: {
          "x-client-id": CASHFREE_CLIENT_ID,
          "x-client-secret": CASHFREE_CLIENT_SECRET,
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json",
        },
      }
    );

    const paymentSessionId = response.data.payment_session_id;

    // ✅ New way: Production Checkout URL
    const checkoutUrl = `https://cashfree.com/pg/view/checkout?payment_session_id=${paymentSessionId}`;

    res.json({
      success: true,
      orderId,
      paymentSessionId,
      checkoutUrl,
    });
  } catch (err) {
    console.error("Cashfree error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: "Payment init failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
