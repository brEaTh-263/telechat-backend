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
const { User } = require("./models/user");
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
	console.log("Middleware was called!!!");
	if (!_id) {
		return next(new Error("invalid _id"));
	}
	if (!receiverId) {
		return next();
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
	console.log("User connected" + socket.id);
	socket.on("disconnect", () => {
		if (socket.roomId) {
			socket.leave(socket.roomId.toString());
			socket.removeAllListeners();
		}
		console.log("User disconnected");
	});

	socket.on("get_my_chats", async ({ _id }) => {
		const allRooms = await Room.find({
			userIds: _id,
		});
		// console.log(allRooms);
		const populatedRooms = await Promise.all(
			allRooms.map(async (room) => {
				let x = [];

				let newuser = await User.findById(room.userIds[0]);

				x.push(newuser);
				newuser = await User.findById(room.userIds[1]);
				x.push(newuser);

				return {
					_id: room._id,
					messages: room.messages,
					userIds: x,
				};
			})
		);

		io.to(socket.id).emit("your_rooms", populatedRooms);
	});
	if (socket.roomId) socket.emit("room", { roomId: socket.roomId });
	if (socket.roomId) {
		console.log("Trying to join a roooooommmm!!!");
		socket.join(socket.roomId.toString());
	}
	socket.on("connect_me_to_room", async ({ _id, receiverId }) => {
		console.log("connect_me_to_room CALLED");
		console.log("Trying to join a roooooommmm!!!");
		const userIds = [receiverId, _id];

		const availableRoom = await Room.findOne({
			userIds: {
				$size: userIds.length,
				$all: [...userIds],
			},
		});
		let existingRoom;
		if (availableRoom) {
			socket._id = _id;
			socket.roomId = availableRoom._id;
			existingRoom = availableRoom;
		} else {
			const room = new Room({
				userIds: userIds,
				messages: [],
			});
			await room.save();
			socket.roomId = room._id;
			existingRoom = room;
		}
		console.log(socket.roomId);

		socket.join(socket.roomId.toString());
		socket.emit("room", { roomId: socket.roomId, existingRoom });
	});
	socket.on("private message", async ({ content, to }) => {
		console.log("Room Id" + socket.roomId);
		const room = await Room.findById(socket.roomId);
		console.log("Pushing into db");
		console.log(room);
		room.messages.push(content);
		await room.save();
		let clients = io.sockets.adapter.rooms.get(socket.roomId.toString());

		console.log("All members");
		console.log(clients);
		socket.to(socket.roomId.toString()).emit("private message", {
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
