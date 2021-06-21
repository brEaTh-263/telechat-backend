const mongoose = require("mongoose");

const RoomSchema = mongoose.Schema({
	userIds: {
		type: Array,
		default: [],
		required: true,
	},
	messages: {
		type: Array,
		default: [],
	},
});

const Room = mongoose.model("Room", RoomSchema);

exports.Room = Room;
