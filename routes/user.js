const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user");
const { upload } = require("../services/image");

const singleUpload = upload.single("image");

const auth = require("../middlewares/auth");

router.post("/search-user", auth, UserController.searchForUser);

router.post(
	"/edit-dp",
	auth,
	singleUpload,
	UserController.editMyDisplayPicture
);

module.exports = router;
