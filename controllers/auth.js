const User = require("../models/user");

function loginForm(req, res) {
  res.render("auth/login", { currentPath: req.path });
}

function login(req, res) {
  // TODO: login
}

// TODO: register

module.exports = { loginForm };
