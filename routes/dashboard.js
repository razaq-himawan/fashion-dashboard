const express = require("express");
const dashboardController = require("../controllers/dashboard");

const isAuth = require("../middlewares/isAuth");

const router = express.Router();

router.route("/").get(isAuth, dashboardController.overview);

router.route("/products").get(dashboardController.products);

router.route("/products/brands").get(dashboardController.brands);

router.route("/products/categories").get(dashboardController.categories);

router.route("/products/colors").get(dashboardController.colors);

router.route("/products/sizes").get(dashboardController.sizes);

router.route("/users").get(dashboardController.users);

router.route("/orders").get(dashboardController.orders);

module.exports = router;
