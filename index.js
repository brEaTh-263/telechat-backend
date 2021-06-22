const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("./services/notifications");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const { Server } = require("socket.io");
const io = new Server(server);
const { mongoDbURI } = require("./config");
const { Room } = require("./models/room");

app.use(bodyParser.json());
app.use("/auth", authRouter);
app.use("/user", userRouter);
const { getMyChats, sendMessage } = require("./handlers/user")(io);
const { connectMeToRoom, disconnectRoom } = require("./handlers/room")(io);
mongoose.connect(
	`${mongoDbURI}`,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false,
	},
	() => {
		console.log("Connected to mongoose");
	}
);

io.use(async (socket, next) => {
	const _id = socket.handshake.auth._id;

	console.log("Middleware was called!!!");
	if (!_id) {
		return next(new Error("invalid _id"));
	}
	socket._id = _id;

	next();
});

io.on("connection", (socket) => {
	console.log("User connected" + socket.id);
	socket.on("disconnect", () => {
		console.log("User disconnected");
	});

	socket.on("get_my_chats", getMyChats);
	socket.on("connect_me_to_room", connectMeToRoom);
	socket.on("private message", sendMessage);
	socket.on("disconnectRoom", disconnectRoom);
});

server.listen(3000, () => {
	console.log("listening on *:3000");
});
