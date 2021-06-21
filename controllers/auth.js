const { accountSid, authToken, serviceSid } = require("../config");
const client = require("twilio")(accountSid, authToken);
const _ = require("lodash");
const { User } = require("../models/user");

exports.signInUser = async (req, res) => {
	let { phoneNumber } = req.body;
	if (!phoneNumber) {
		return res.status(400).send({ Error: "Something went wrong" });
	}
	try {
		client.verify
			.services(serviceSid)
			.verifications.create({
				to: `+91${phoneNumber}`,
				channel: "sms",
			})
			.then((data) => {
				console.log(data);
				const details = _.pick(data, ["status", "to", "valid"]);
				res.status(200).send({ details });
			})
			.catch((err) => {
				console.log(err);
				res.status(400).send({ Error: "Something went wrong" });
			});
	} catch (error) {
		console.log(error);
		return res.status(505).send(err.message);
	}
};

exports.createUserWithGivenOtp = async (req, res) => {
	let { phoneNumber, code, name } = req.body;

	if (!phoneNumber || !code || !name) {
		return res.status(400).send("Something went wrong");
	}

	try {
		const data = await client.verify
			.services(serviceSid)
			.verificationChecks.create({
				to: `+91${phoneNumber}`,
				code: req.body.code,
			});
		console.log(data);
		if (data.status === "pending") {
			throw new Error();
		}

		let user = new User({ phoneNumber, name });
		await user.save();
		console.log(user);
		const token = user.generateAuthToken();
		const details = _.pick(user, ["name", "displayPicture", "phoneNumber"]);
		return res.status(200).send({ token, _id: user._id, details });
	} catch (error) {
		console.log(error);
		return res.status(505).send("Something went wrong");
	}
};

exports.autoLoginUser = async (req, res) => {
	const { _id } = req.user;
	try {
		let user = await User.findById(_id);
		const token = user.generateAuthToken();
		const details = _.pick(user, ["name", "displayPicture", "phoneNumber"]);
		return res.status(200).send({ token, _id: user._id, details });
	} catch (error) {
		console.log(error);
		return res.status(500).send({ Error: "Something went wrong" });
	}
};

exports.pushUserToken = async (req, res) => {
	try {
		let { pushToken } = req.body;
		if (!pushToken) {
			return res.status(400).send({ Error: "Something went wrong" });
		}
		const { _id } = req.user;
		const user = await User.findByIdAndUpdate(_id, {
			$set: {
				pushToken: pushToken,
			},
		});
		if (!user) {
			return res.status(400).send({ Error: "Something went wrong" });
		}
		return res.status(200).send({ success: "Token Received" });
	} catch (error) {
		console.log(error);
		return res.status(400).send({ Error: "Something went wrong" });
	}
};
