const express = require("express");
const CORS = require("cors");
const app = express();
const path = require("path");

const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const clientRouter = require("./routes/clientRoutes");
const professionalRouter = require("./routes/professionalRoutes");
const shopRouter = require("./routes/shopRoutes");
const adminRouter = require("./routes/adminRoutes");

app.use(express.json());
app.use(cookieParser());
app.use(
  CORS({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Access-Control-Allow-Headers"],
  })
);

mongoose
  .connect("mongodb://127.0.0.1:27017/project-build-dream")
  .then(() => {
    console.log("connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/", clientRouter);
app.use("/professional", professionalRouter);
app.use("/shop", shopRouter);
app.use("/admin", adminRouter);

app.use("/uploads", express.static(path.join(__dirname, "uploads", "clients")));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
