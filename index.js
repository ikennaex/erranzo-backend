const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/dbConfig");
const { initSocket } = require("./config/socket");

const app = express();
require("dotenv").config();

connectDB();

app.use(express.json()); 
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://erranzo.onrender.com",
      "https://erranzo.vercel.app"
    ],
    credentials: true,
  })
);

// Routes
app.use("/auth", require("./routes/registerRoute"));
app.use("/auth", require("./routes/loginRoute"));
app.use("/auth", require("./routes/verifyEmailRoute"));
app.use("/auth", require("./routes/resetPasswordRoute"));
app.use("/user", require("./routes/userRoute"));
app.use("/errands", require("./routes/errandRoutes"));
app.use("/api", require("./routes/testRoute"));
app.use("/profile", require("./routes/profileRoute"));
app.use("/search", require("./routes/searchRoute"));
app.use("/chat", require("./routes/chatRoute"));
app.use("/expo-token", require("./routes/expoTokenRoute"));


app.use("/admin", require("./routes/adminLoginRoute"));
app.use("/admin", require("./routes/adminRoutes"));

// stripe and wallet routes
app.use("/api/stripe", require("./routes/stripeRoute"));
app.use("/api/wallet", require("./routes/walletRoute"));
app.use("/api/errand", require("./routes/errandRoutes"));

// payout routes 
app.use("/api/payout", require("./routes/payoutRoutes"));

app.use(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/stripeWebhookRoute")
);


app.get("/", (req, res) => res.send("Hello World")); 

const server = http.createServer(app);
initSocket(server);

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Server running on port ${port}`));
