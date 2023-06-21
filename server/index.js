const express = require("express");
const CORS = require("cors");
const app = express();
const path = require("path");

const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
require("dotenv").config();
mongoose.set("strictQuery", false);

const clientRouter = require("./routes/clientRoutes");
const professionalRouter = require("./routes/professionalRoutes");
const shopRouter = require("./routes/shopRoutes");
const adminRouter = require("./routes/adminRoutes");

app.use(express.json());
app.use(cookieParser());
app.use(
  CORS({
    origin: [process.env.ORIGIN],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Access-Control-Allow-Headers"],
  })
);

mongoose
  .connect(process.env.MONGOOSE_LINK, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("MONGODB CONNECTED");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/", clientRouter);
app.use("/professional", professionalRouter);
app.use("/shop", shopRouter);
app.use("/admin", adminRouter);

app.use("/uploads", express.static("./uploads"));

const PORT = process.env.PORT || 4001;

const server = app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON ${PORT}`);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.ORIGIN,
  },
});

io.on("connection", (socket) => {
  socket.on("setup", (userData) => {
    socket.join(userData);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    // console.log("user joined Romm :" + room)
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"))
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    if (!chat.users) return console.log("chat.users not defined");
    chat.users.forEach((user) => {
      if (user.refId == newMessageRecieved.sender.refId) return;

      socket.in(user.refId).emit("message recieved", newMessageRecieved);
    });
  });


  socket.off("setup", () => {
    console.log('USER DISCONNECTED')
    socket.leave(userData);
  });

});
