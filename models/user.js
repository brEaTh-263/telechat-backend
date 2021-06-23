const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const userSchema = mongoose.Schema({
	name: {
		required: true,
		type: String,
		minlength: 3,
		default: "User",
		lowercase: true,
		trim: true,
	},
	phoneNumber: {
		type: Number,
		required: true,
		maxLength: 10,
		minlength: 10,
		default: 0,
	},
	displayPicture: {
		type: String,
		default: "",
	},
	pushToken: {
		type: String,
		default: "",
	},
});

userSchema.methods.generateAuthToken = function () {
	const token = jwt.sign({ _id: this._id }, process.env.jwtKey);
	return token;
};

const User = mongoose.model("User", userSchema);
exports.User = User;
