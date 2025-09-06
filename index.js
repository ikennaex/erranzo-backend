const express = require("express");
const app = express();
const port = process.env.PORT || 4000; 
const cors = require("cors")
const connectDB = require("./config/dbConfig");
const registerRoute = require("./routes/registerRoute");
const loginRoute = require("./routes/loginRoute");
const profileRoute = require("./routes/profileRoute");
const verifyEmailRoute = require("./routes/verifyEmailRoute");
const errandRoutes = require("./routes/errandRoutes");
const cookieParser = require("cookie-parser");


require('dotenv').config();

// database connection 
connectDB() 

// middelwares
app.use(express.json());
app.use(cookieParser());

// cors middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

// Route handlers
app.use("/auth", registerRoute);
app.use("/auth", loginRoute);
app.use("/auth", verifyEmailRoute);
app.use("/user", profileRoute);

// Errand Routes
app.use("/errands", errandRoutes);

// 



// server test 
app.get("/", (req, res) => {
  res.send("Hello World");
});






// run server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
