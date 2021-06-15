const express = require("express");
const { User } = require("../models/user");
const router = express.Router();
const _ = require("lodash");
const auth = require("../middlewares/auth");

router.post("/search-user", auth, async (req, res) => {
	const { query } = req.body;
	if (!query) {
		return res.status(400).send({ Error: "Something went wrong" });
	}
	const users = await User.find({ name: { $regex: query, $options: "i" } });
	const editedUsers = users.map(({ _id, displayPicture, name }) => {
		return {
			_id,
			displayPicture,
			name,
		};
	});
	return res.status(200).send(editedUsers);
});

module.exports = router;
