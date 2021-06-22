const { Room } = require("../models/room");
const { User } = require("../models/user");

module.exports = (io) => {
	const connectMeToRoom = async function ({ _id, receiverId }) {
		const socket = this;
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
	};

	const disconnectRoom = function ({ roomId }) {
		const socket = this;
		socket.leave(roomId);
	};

	return {
		connectMeToRoom,
		disconnectRoom,
	};
};
