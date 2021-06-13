const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const userSchema = mongoose.Schema({
	name: {
		required: true,
		type: String,
		minlength: 3,
		default: "User",
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
});

userSchema.methods.generateAuthToken = function () {
	const token = jwt.sign({ _id: this._id }, "somethingprivate");
	return token;
};

const User = mongoose.model("User", userSchema);
exports.User = User;
