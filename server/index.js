const express = require("express");
const CORS = require("cors");
const app = express();

// const adminrouter = require("./routes/admin");
const clientRouter = require("./routes/clientRoutes");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

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
app.use("/uploads", express.static("./uploads"));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
