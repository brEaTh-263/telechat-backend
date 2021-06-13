const { User } = require("../models/user");
const express = require("express");
const _ = require("lodash");
const { accountSid, authToken, serviceSid } = require("../config");
const router = express.Router();
const client = require("twilio")(accountSid, authToken);

router.post("/sign-in", async (req, res) => {
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
		return res.status(505).send(err.message);
	}
});

router.post("/authenticate-phonenumber", async (req, res) => {
	let { phoneNumber, code, name } = req.body;

	if (!phoneNumber || !code || !name) {
		return res.status(400).send("Something went wrong");
	}
	console.log(code, phoneNumber);
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

		let user = new User({ phoneNumber: phoneNumber, name: name });
		user = await user.save();
		const token = user.generateAuthToken();
		return res.status(200).send({ token });
	} catch (error) {
		console.log(error);
		return res.status(505).send("Something went wrong");
	}
});

module.exports = router;
