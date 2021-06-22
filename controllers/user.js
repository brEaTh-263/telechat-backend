const _ = require("lodash");
const { User } = require("../models/user");

exports.searchForUser = async (req, res) => {
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
};

exports.editMyDisplayPicture = async (req, res) => {
	try {
		const { _id } = req.user;
		let user = await User.findById(_id);
		if (!user) {
			return res
				.status(404)
				.send({ Error: "User with given id was not found!" });
		}
		user.displayPicture = req.file.location;
		await user.save();

		return res
			.status(200)
			.send({
				status: "Display picture added",
				displayPicture: user.displayPicture,
			});
	} catch (error) {
		return res.status(505).send({ Error: "Something went wrong" });
	}
};
