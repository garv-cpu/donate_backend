import express from "express";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import cors from "cors"; // Add CORS middleware

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Use CORS to allow requests from your frontend

const CASHFREE_API_URL = "https://sandbox.cashfree.com/pg/orders";
const MERCHANT_ID = process.env.CASHFREE_APP_ID_TEST;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY_TEST;
const API_VERSION = "2023-08-01";

// ✅ FIXED: Add a validation check for environment variables
if (!MERCHANT_ID || !SECRET_KEY) {
  console.error(
    "Critical error: CASHFREE_APP_ID or CASHFREE_SECRET_KEY is not defined in the environment."
  );
  // Exit the process to prevent the server from starting with invalid keys
  process.exit(1);
}

// Route to create an order
app.post("/create-order", async (req, res) => {
  const { orderId, orderAmount, orderCurrency, orderNote, customerDetails } =
    req.body;

  const orderData = {
    order_id: orderId,
    order_amount: Number(orderAmount),
    order_currency: orderCurrency,
    order_note: orderNote,
    customer_details: customerDetails,
    order_meta: {
      return_url: "https://thankyou-gamma.vercel.app/",
      payment_methods: "upi,cc,dc,app", // ✅ valid codes
    },
  };

  try {
    const response = await axios.post(CASHFREE_API_URL, orderData, {
      headers: {
        "Content-Type": "application/json",
        "x-api-version": API_VERSION,
        "x-request-id": crypto.randomUUID(),
        "x-client-id": MERCHANT_ID,
        "x-client-secret": SECRET_KEY,
        "x-idempotency-key": crypto.randomUUID(),
      },
    });

    console.log("Cashfree response:", response.data);

    const paymentLink = `https://sandbox.cashfree.com/pg/view/gateway/${response.data.payment_session_id}`;

    res.json({
      payment_session_id: response.data.payment_session_id,
      payment_link: paymentLink,
    });
  } catch (error) {
    console.error(
      "Cashfree order creation error:",
      error.response?.data || error.message
    );
    res.status(500).send("Error creating order");
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
