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
const { Room } = require("./models/room");
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

io.use(async (socket, next) => {
	const _id = socket.handshake.auth._id;
	const receiverId = socket.handshake.auth.receiverId;
	const roomId = socket.handshake.auth.roomId;
	// console.log("Room Id" + roomId);
	if (!_id) {
		return next(new Error("invalid _id"));
	}
	if (roomId) {
		const room = await Room.findById(roomId);
		if (room) {
			socket._id = _id;
			socket.roomId = roomId;
			return next();
		}
	}
	const userIds = [receiverId, _id];

	const availableRoom = await Room.findOne({
		userIds: {
			$size: userIds.length,
			$all: [...userIds],
		},
	});
	if (availableRoom) {
		socket._id = _id;
		socket.roomId = availableRoom._id;
		return next();
	}

	const room = new Room({
		userIds: userIds,
		messages: [],
	});
	await room.save();

	socket._id = _id;
	socket.roomId = room._id;
	next();
});

io.on("connection", (socket) => {
	console.log("Users connected");
	socket.on("disconnect", () => {
		socket.leave(socket.roomId.toString());
		console.log("User disconnected");
	});
	socket.emit("room", { roomId: socket.roomId });
	socket.join(socket.roomId.toString());
	socket.on("private message", async ({ content, to }) => {
		console.log("Room Id" + socket.roomId);
		const room = await Room.findById(socket.roomId);
		console.log("Pushing into db");
		console.log(room);
		room.messages.push(content);
		await room.save();
		socket.in(socket.roomId.toString()).emit("private message", {
			content: content,
			from: socket._id,
		});
		// socket.in(socket.roomId).emit("private message", {
		// 	content: content,
		// 	from: socket._id,
		// });
	});
});

server.listen(3000, () => {
	console.log("listening on *:3000");
});
