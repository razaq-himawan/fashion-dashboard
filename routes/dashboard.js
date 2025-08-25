const express = require("express");
const dashboardController = require("../controllers/dashboard");

const isAuth = require("../middlewares/isAuth");

const wrapAsync = require("../utils/wrapAsync");

const router = express.Router();

router.route("/").get(isAuth, dashboardController.overview);

router.route("/products").get(wrapAsync(dashboardController.products));

router.route("/products/brands").get(wrapAsync(dashboardController.brands));

router.route("/products/categories").get(wrapAsync(dashboardController.categories));

router.route("/products/colors").get(wrapAsync(dashboardController.colors));

router.route("/products/sizes").get(wrapAsync(dashboardController.sizes));

router.route("/users").get(wrapAsync(dashboardController.users));

router.route("/orders").get(wrapAsync(dashboardController.orders));

module.exports = router;
