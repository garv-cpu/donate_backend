// server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ✅ Cashfree Base URLs
const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg/orders"
    : "https://sandbox.cashfree.com/pg/orders";

const CASHFREE_CHECKOUT_URL =
  process.env.CASHFREE_ENV === "production"
    ? "https://payments.cashfree.com/pg/view/checkout?payment_session_id="
    : "https://sandbox.cashfree.com/pg/view/checkout?payment_session_id=";

// ✅ Create Donate Order API
app.post("/donate", async (req, res) => {
  try {
    const { name, email, phone, amount } = req.body;

    const orderId = `donate_${Date.now()}`;

    const response = await axios.post(
      CASHFREE_BASE_URL,
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: `cust_${Date.now()}`,
          customer_name: name || "Guest User",
          customer_email: email || "guest@example.com",
          customer_phone: phone || "9999999999",
        },
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json",
        },
      }
    );

    const paymentSessionId = response.data.payment_session_id;
    const checkoutUrl = `${CASHFREE_CHECKOUT_URL}${paymentSessionId}`;
    console.log("Cashfree API response:", response.data);

    res.json({
      success: true,
      orderId,
      paymentSessionId,
      checkoutUrl,
    });
  } catch (error) {
    console.error("Cashfree Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Cashfree Donate Backend running on http://localhost:${PORT}`);
});
