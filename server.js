const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const JWT_SECRET = "gsb_super_secret_key";

/* ========================
   MONGODB CONNECTION
======================== */
mongoose.connect("mongodb+srv://gsbadmin:gsb12345@gsb.lecitgo.mongodb.net/gsb?retryWrites=true&w=majority")
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

/* ========================
   SCHEMAS
======================== */

const userSchema = new mongoose.Schema({
name:String,
email:String,
password:String,
role:{type:String,default:"customer"}
});

const orderSchema = new mongoose.Schema({
userEmail:String,
name:String,
phone:String,
product:String,
quantity:Number,
price:Number,
date:{type:Date,default:Date.now}
});

const User = mongoose.model("User",userSchema);
const Order = mongoose.model("Order",orderSchema);

/* ========================
   AUTH MIDDLEWARE
======================== */

function verifyToken(req,res,next){
const token=req.headers["authorization"];
if(!token) return res.status(403).json({message:"No token"});
try{
const verified=jwt.verify(token,JWT_SECRET);
req.user=verified;
next();
}catch(err){
res.status(400).json({message:"Invalid token"});
}
}

/* ========================
   REGISTER
======================== */

app.post("/api/register",async(req,res)=>{

const {name,email,password}=req.body;

const existing=await User.findOne({email});
if(existing) return res.json({message:"User already exists"});

const hashed=await bcrypt.hash(password,10);

const user=new User({
name,
email,
password:hashed
});

await user.save();

res.json({message:"Account created"});
});

/* ========================
   LOGIN
======================== */

app.post("/api/login",async(req,res)=>{

const {email,password}=req.body;

const user=await User.findOne({email});

if(!user) return res.json({message:"Invalid email or password"});

const match=await bcrypt.compare(password,user.password);

if(!match) return res.json({message:"Invalid email or password"});

const token=jwt.sign({
email:user.email,
role:user.role
},JWT_SECRET);

res.json({
message:"Login successful",
token,
user
});

});

/* ========================
   GET PRICES
======================== */

app.get("/api/prices",(req,res)=>{
const prices=JSON.parse(fs.readFileSync("data/prices.json"));
res.json(prices);
});

/* ========================
   CREATE ORDER
======================== */

app.post("/api/order",verifyToken,async(req,res)=>{

const {name,phone,product,quantity,price}=req.body;

const order=new Order({
userEmail:req.user.email,
name,
phone,
product,
quantity,
price
});

await order.save();

res.json({message:"Order saved"});
});

/* ========================
   GET ORDERS
======================== */

app.get("/api/orders",verifyToken,async(req,res)=>{

if(req.user.role==="admin"){
const orders=await Order.find();
return res.json(orders);
}

const orders=await Order.find({userEmail:req.user.email});
res.json(orders);

});

/* ========================
   DELETE ORDER
======================== */

app.post("/api/delete-order",verifyToken,async(req,res)=>{

if(req.user.role!=="admin"){
return res.status(403).json({message:"Admin only"});
}

await Order.findByIdAndDelete(req.body.id);

res.json({message:"Order deleted"});
});

const PORT=process.env.PORT||10000;

app.listen(PORT,()=>{
console.log("Server running on port "+PORT);
});