const { Room } = require("../models/room");
const { User } = require("../models/user");
const { Expo } = require("expo-server-sdk");
const expo = require("../services/notifications");
module.exports = (io) => {
	const getMyChats = async function ({ _id }) {
		const socket = this;
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
				room.messages.reverse();

				return {
					_id: room._id,
					messages: room.messages,
					userIds: x,
				};
			})
		);

		io.to(socket.id).emit("your_rooms", populatedRooms);
	};

	const sendMessage = async function ({ content, to }) {
		const socket = this;
		const room = await Room.findById(socket.roomId);
		console.log(room);
		room.messages.push(content);
		await room.save();
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
				for (let chunk of chunks) {
					try {
						let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
						console.log(ticketChunk);
						tickets.push(...ticketChunk);
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
	};

	return {
		getMyChats,
		sendMessage,
	};
};
