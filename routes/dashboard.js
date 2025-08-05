const express = require("express");
const dashboardController = require("../controllers/dashboard");

const router = express.Router();

router.route("/").get(dashboardController.overview);

router.route("/products").get(dashboardController.products);

router.route("/products/brands").get(dashboardController.brands);

router.route("/products/categories").get(dashboardController.categories);

router.route("/products/colors").get(dashboardController.colors);

router.route("/products/sizes").get(dashboardController.sizes);

router.route("/users").get(dashboardController.users);

module.exports = router;
