const express = require("express");
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://gsbadmin:gsb12345@gsb.lecitgo.mongodb.net/gsb?retryWrites=true&w=majority")
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));
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

const Order = mongoose.model("Order", orderSchema);
const User = mongoose.model("User", userSchema);
const bodyParser = require("body-parser");
const fs = require("fs");
const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ message: "User already exists" });
        }

        const newUser = new User({
            name,
            email,
            password
        });

        await newUser.save();

        res.json({ message: "Registration successful" });

    } catch (error) {
        res.status(500).json({ message: "Error registering user" });
    }
});
const ordersFile = "./data/orders.json";
const priceFile = "./data/prices.json";

app.get("/api/prices", (req, res) => {
    const data = fs.readFileSync(priceFile);
    res.json(JSON.parse(data));
});

app.post("/api/update-price", (req, res) => {
    fs.writeFileSync(priceFile, JSON.stringify(req.body));
    res.send("Price Updated");
});

app.post("/api/order", (req, res) => {
    try {
        let orders = [];

        if (fs.existsSync(ordersFile)) {
            const data = fs.readFileSync(ordersFile, "utf8");
            orders = data ? JSON.parse(data) : [];
        }

orders.push({
    id: Date.now(),
    ...req.body,
   date: new Date(Date.now() + (5.5 * 60 * 60 * 1000)).toISOString().replace('T', ' ').substring(0, 19)
});
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

        res.send("Order Saved Successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

app.get("/api/orders", (req, res) => {
    const orders = fs.readFileSync(ordersFile);
    res.json(JSON.parse(orders));
});
app.post("/api/delete-order", (req, res) => {
    try {
        const id = parseInt(req.body.id);

        let orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));

        const updatedOrders = orders.filter(order => order.id !== id);

        fs.writeFileSync(ordersFile, JSON.stringify(updatedOrders, null, 2));

        res.send("Order Deleted Successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Delete Failed");
    }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
