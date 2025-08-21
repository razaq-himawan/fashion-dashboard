const express = require("express");
const AuthController = require("../controllers/auth");
const passport = require("passport");
const isLoggedIn = require("../middlewares/isLoggedIn");

const router = express.Router();

router
  .route("/login")
  .get(isLoggedIn, AuthController.loginForm)
  .post(
    isLoggedIn,
    passport.authenticate("local", {
      successRedirect: "/dashboard",
      failureRedirect: "/login",
      failureFlash: true,
    })
  );

router.post("/logout", AuthController.logout);

module.exports = router;
