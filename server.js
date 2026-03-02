const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

const JWT_SECRET = "gsb_super_secret_key_2026";

/* ========================
   MONGODB CONNECTION
======================== */
mongoose.connect("mongodb+srv://gsbadmin:gsb12345@gsb.lecitgo.mongodb.net/gsb?retryWrites=true&w=majority")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("MongoDB Error:", err));

/* ========================
   SCHEMAS
======================== */
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: { type: String, default: "user" } // user or admin
});

const orderSchema = new mongoose.Schema({
    userEmail: String,
    product: String,
    price: Number,
    date: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Order = mongoose.model("Order", orderSchema);

/* ========================
   AUTH MIDDLEWARE
======================== */
function verifyToken(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ message: "Access Denied" });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
}

/* ========================
   REGISTER
======================== */
const bcrypt = require("bcryptjs");

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ message: "User already exists" });
        }

        // 🔐 Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.json({ message: "Registration successful" });

    } catch (error) {
        res.status(500).json({ message: "Error registering user" });
    }
});
/* ========================
   LOGIN
======================== */
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: "Invalid email or password" });
        }

        // 🔐 Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ message: "Invalid email or password" });
        }

        res.json({ message: "Login successful", user });

    } catch (error) {
        res.status(500).json({ message: "Error logging in" });
    }
});

/* ========================
   CREATE ORDER (Protected)
======================== */
app.post("/api/order", verifyToken, async (req, res) => {
    const newOrder = new Order({
        userEmail: req.user.email,
        product: req.body.product,
        price: req.body.price
    });

    await newOrder.save();
    res.json({ message: "Order saved" });
});

/* ========================
   GET ALL ORDERS (Admin Only)
======================== */
app.get("/api/orders", verifyToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
    }

    const orders = await Order.find();
    res.json(orders);
});

/* ========================
   DELETE ORDER (Admin Only)
======================== */
app.post("/api/delete-order", verifyToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
    }

    await Order.findByIdAndDelete(req.body.id);
    res.json({ message: "Order deleted" });
});

/* ========================
   START SERVER
======================== */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});