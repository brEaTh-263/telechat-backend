const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const { Server } = require("socket.io");
const io = new Server(server);
const { mongoDbURI } = require("./config");
app.use(bodyParser.json());
app.use("/auth", authRouter);
app.use("/user", userRouter);
mongoose.connect(
	`${mongoDbURI}`,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	},
	() => {
		console.log("Connected to mongoose");
	}
);

io.on("connection", (socket) => {
	console.log("Users connected");
	socket.on("Message", (msg) => {
		console.log(msg);
	});
});

server.listen(3000, () => {
	console.log("listening on *:3000");
});
