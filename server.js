import express from "express";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import dotenv from "dotenv";
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors())

// Init Cashfree SDK
const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

app.post("/donate", async (req, res) => {
  try {
    const { name, email, phone, amount } = req.body;

    const orderRequest = {
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `cust_${Date.now()}`,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
      },
      order_meta: {
        return_url: "https://thankyou-gamma.vercel.app/",
      },
      order_note: "Donation to Pocket Notes",
    };

    // ✅ Create order
    const response = await cashfree.PGCreateOrder(orderRequest);

    // ✅ Grab sessionId from Cashfree response
    const paymentSessionId = response.data.payment_session_id;

    // ✅ Build correct checkout URL
    const checkoutUrl = `https://payments.cashfree.com/pg/view/checkout?payment_session_id=${paymentSessionId}`;


    res.json({
      success: true,
      checkoutUrl,
    });
  } catch (err) {
    console.error("Cashfree error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () =>
  console.log("✅ Server running on http://localhost:5000")
);
