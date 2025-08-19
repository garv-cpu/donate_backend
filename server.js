import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Cashfree Keys
const CASHFREE_APP_ID = "YOUR_APP_ID";
const CASHFREE_SECRET_KEY = "YOUR_SECRET_KEY";

// Toggle environment
const ENV = process.env.NODE_ENV === "production" ? "PROD" : "TEST";

// Endpoint: Create donation order
app.post("/donate", async (req, res) => {
  try {
    const { name, email, phone, amount } = req.body;

    if (!name || !email || !phone || !amount) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const orderId = `donate_${Date.now()}`;

    // Cashfree API URL
    const url =
      ENV === "PROD"
        ? "https://api.cashfree.com/pg/orders"
        : "https://sandbox.cashfree.com/pg/orders";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2022-09-01",
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: `cust_${Date.now()}`,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
        },
      }),
    });

    const data = await response.json();

    if (data?.payment_session_id) {
      // Correct checkout URL
      const checkoutUrl =
        ENV === "PROD"
          ? `https://payments.cashfree.com/pg/checkout?payment_session_id=${data.payment_session_id}`
          : `https://sandbox.cashfree.com/pg/checkout?payment_session_id=${data.payment_session_id}`;

      return res.json({
        success: true,
        orderId,
        paymentSessionId: data.payment_session_id,
        checkoutUrl,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Cashfree order creation failed", data });
    }
  } catch (err) {
    console.error("Error creating donation order:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
