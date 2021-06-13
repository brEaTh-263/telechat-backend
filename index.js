const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userRouter = require("./routes/auth");
const { mongoDbURI } = require("./config");
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
app.use(bodyParser.json());
server.listen(3000, () => {
	console.log("listening on *:3000");
});
