const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user");

const auth = require("../middlewares/auth");

router.post("/search-user", auth, UserController.searchForUser);

module.exports = router;
