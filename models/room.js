const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema({
	message: {
		type: String,
		required: true,
	},
	senderId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
});

const RoomSchema = mongoose.Schema({
	firstId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	secondId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	messages: {
		type: [MessageSchema],
	},
});

const Room = mongoose.model("Room", RoomSchema);
exports.Room = Room;
