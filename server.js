const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

app.use(cors());
app.use(express.json());

let orders = [];

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
    if (orders.length === 0) return res.status(404).json({ message: "No orders yet" });
    res.json(orders[orders.length - 1]);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
