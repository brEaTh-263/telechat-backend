const express = require("express");

const AuthController = require("../controllers/auth");
const auth = require("../middlewares/auth");
const router = express.Router();

router.post("/push-token", auth, AuthController.pushUserToken);

router.post("/sign-in", AuthController.signInUser);

router.post("/authenticate-phonenumber", AuthController.createUserWithGivenOtp);

router.get("/autoLogIn", auth, AuthController.autoLoginUser);

module.exports = router;
