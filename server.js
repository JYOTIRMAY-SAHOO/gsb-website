const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();

/* ========================
   MIDDLEWARE
======================== */
app.use(bodyParser.json());
app.use(express.static("public"));

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
    password: String
});

const orderSchema = new mongoose.Schema({
    userEmail: String,
    product: String,
    price: Number,
    date: { type: Date, default: Date.now }
});

/* ========================
   MODELS
======================== */
const User = mongoose.model("User", userSchema);
const Order = mongoose.model("Order", orderSchema);

/* ========================
   FILE PATHS
======================== */
const ordersFile = "./data/orders.json";
const priceFile = "./data/prices.json";

/* ========================
   REGISTER API
======================== */
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ message: "User already exists" });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();

        res.json({ message: "Registration successful" });

    } catch (error) {
        res.status(500).json({ message: "Error registering user" });
    }
});

/* ========================
   LOGIN API
======================== */
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, password });
        if (!user) {
            return res.json({ message: "Invalid email or password" });
        }

        const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email
        };

        res.json({ message: "Login successful", user: safeUser });

    } catch (error) {
        res.status(500).json({ message: "Error logging in" });
    }
});

/* ========================
   GET PRICES
======================== */
app.get("/api/prices", (req, res) => {
    const data = fs.readFileSync(priceFile);
    res.json(JSON.parse(data));
});

/* ========================
   UPDATE PRICE
======================== */
app.post("/api/update-price", (req, res) => {
    fs.writeFileSync(priceFile, JSON.stringify(req.body, null, 2));
    res.send("Price Updated");
});

/* ========================
   SAVE ORDER
======================== */
app.post("/api/order", async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.send("Order Saved Successfully");
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

/* ========================
   GET ALL ORDERS
======================== */
app.get("/api/orders", async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

/* ========================
   DELETE ORDER
======================== */
app.post("/api/delete-order", async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.body.id);
        res.send("Order Deleted Successfully");
    } catch (err) {
        res.status(500).send("Delete Failed");
    }
});

/* ========================
   START SERVER
======================== */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});