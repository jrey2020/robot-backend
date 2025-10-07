const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});

let orders = [];

// ✅ Stripe route
app.post("/create-payment-intent", async (req, res) => {
    try {
        const { amount } = req.body;
        console.log("💰 Creating payment intent for:", amount);

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            automatic_payment_methods: { enabled: true },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("❌ Stripe error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Robot + Order routes
io.on("connection", (socket) => {
    console.log("🤖 Robot connected:", socket.id);
});

app.post("/orders", (req, res) => {
    const order = { id: orders.length + 1, ...req.body, status: "received" };
    orders.push(order);
    io.emit("new_order", order);
    console.log("📦 New order:", order);
    res.json({ id: order.id });
});

app.get("/orders/latest", (req, res) => {
    if (orders.length === 0)
        return res.status(404).json({ message: "No orders yet" });
    res.json(orders[orders.length - 1]);
});

// ✅ Handle Render's port correctly
const PORT = process.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () =>
    console.log(`🚀 Server running on port ${PORT}`)
);
