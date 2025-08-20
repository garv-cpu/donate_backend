import express from "express";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import dotenv from 'dotenv'
dotenv.config()

const app = express();
app.use(express.json())

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
        return_url: "https://pocketnotes.com/thankyou?order_id={order_id}",
      },
      order_note: "Donation to Pocket Notes",
    };

    const response = await cashfree.PGCreateOrder(orderRequest);
    res.json({
      success: true,
      order: response.data, // includes payment_link
    });
  } catch (err) {
    console.error("Cashfree error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
