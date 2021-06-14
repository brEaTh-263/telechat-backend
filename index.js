const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const { mongoDbURI } = require("./config");
app.use(bodyParser.json());
app.use("/auth", authRouter);
app.use("/user", userRouter);
mongoose.connect(
	`${mongoDbURI}`,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	},
	() => {
		console.log("Connected to mongoose");
	}
);

server.listen(3000, () => {
	console.log("listening on *:3000");
});
