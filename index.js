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
const { Expo } = require("expo-server-sdk");
app.use(bodyParser.json());
app.use("/auth", authRouter);
app.use("/user", userRouter);
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

const expo = new Expo();

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
	// console.log("User connected" + socket._id);
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

		let x = [];
		let newuser = await User.findById(existingRoom.userIds[0]);
		x.push(newuser);
		newuser = await User.findById(existingRoom.userIds[1]);
		x.push(newuser);

		let populatedRoom = {
			_id: existingRoom._id,
			messages: existingRoom.messages,
			userIds: x,
		};

		socket.emit("room", {
			newRoomId: socket.roomId,
			existingRoom: populatedRoom,
		});
	});
	socket.on("private message", async ({ content, to }) => {
		const room = await Room.findById(socket.roomId);
		console.log(room);
		room.messages.push(content);
		await room.save();
		let clients = io.sockets.adapter.rooms.get(socket.roomId.toString());
		const user = await User.findById(to);
		const { pushToken, name } = user;
		let messages = [];
		if (pushToken) {
			if (!Expo.isExpoPushToken(pushToken)) {
				console.error(`Push token ${pushToken} is not a valid Expo push token`);
				return;
			}
			let existingRoom;
			if (room.messages.length < 2) {
				let x = [];
				let newuser = await User.findById(room.userIds[0]);
				x.push(newuser);
				newuser = await User.findById(room.userIds[1]);
				x.push(newuser);

				existingRoom = {
					_id: room._id,
					messages: room.messages,
					userIds: x,
				};
			}
			const title =
				content.user.name[0].toUpperCase() + content.user.name.slice(1);

			messages.push({
				to: pushToken,
				sound: "default",
				title: title,
				body: content.text,
				data: { content, roomId: socket.roomId, room: existingRoom },
			});
			let chunks = expo.chunkPushNotifications(messages);
			let tickets = [];
			(async () => {
				// Send the chunks to the Expo push notification service. There are
				// different strategies you could use. A simple one is to send one chunk at a
				// time, which nicely spreads the load out over time:
				for (let chunk of chunks) {
					try {
						let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
						console.log(ticketChunk);
						tickets.push(...ticketChunk);
						// NOTE: If a ticket contains an error code in ticket.details.error, you
						// must handle it appropriately. The error codes are listed in the Expo
						// documentation:
						// https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
					} catch (error) {
						console.error(error);
					}
				}
			})();
		}

		socket.to(socket.roomId.toString()).emit("private message", {
			content: content,
			from: socket._id,
		});
	});
	socket.on("disconnectRoom", async ({ roomId }) => {
		socket.leave(roomId);
	});
});

server.listen(3000, () => {
	console.log("listening on *:3000");
});
