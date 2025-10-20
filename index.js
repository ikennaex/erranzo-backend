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

app.get("/", (req, res) => res.send("Hello World"));

const server = http.createServer(app);
initSocket(server);

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Server running on port ${port}`));
