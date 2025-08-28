const User = require("../models/user");

function loginForm(req, res) {
  res.render("auth/login", { currentPath: req.path });
}

function logout(req, res) {
  req.logOut((err) => {
    if (err) return next(err);

    req.flash("success", "You are logged out");
    res.redirect("/");
  });
}

module.exports = { loginForm, logout };
