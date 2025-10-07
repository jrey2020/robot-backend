require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const app = express();

const PORT = process.env.PORT || 5000;

// 🗝️ Stripe secret key (test mode)
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


app.use(cors());
app.use(express.json());

// 🛒 Store orders in memory
let orders = [];
let currentId = 1;

// ✅ Health check
app.get("/", (req, res) => {
    res.send("✅ Backend is live and ready!");
});

// 💳 Create Payment Intent (Stripe)
app.post("/create-payment-intent", async (req, res) => {
    try {
        const { amount } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            automatic_payment_methods: { enabled: true },
        });
        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// ✅ Create new order
app.post("/orders", (req, res) => {
    const { customer, address, city, zip, items } = req.body;

    const total = items.reduce((sum, item) => sum + item.price, 0);

    const newOrder = {
        id: currentId++,
        customer,
        address,
        city,
        zip,
        items,
        total,
        status: "pending",
        createdAt: new Date(),
    };

    orders.push(newOrder);
    console.log("🆕 New order received:", newOrder);
    res.json(newOrder);
});

// ✅ Get ALL orders
app.get("/orders", (req, res) => {
    res.json(orders);
});

// ✅ Get latest order
app.get("/orders/latest", (req, res) => {
    if (orders.length === 0) {
        return res.status(404).json({ message: "No orders yet" });
    }
    res.json(orders[orders.length - 1]);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
