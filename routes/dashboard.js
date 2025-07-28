const express = require("express");
const dashboardController = require("../controllers/dashboard");

const router = express.Router();

router.route("/").get(dashboardController.overview);

module.exports = router;
