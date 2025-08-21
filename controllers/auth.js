const User = require("../models/user");

function loginForm(req, res) {
  res.render("auth/login", { currentPath: req.path });
}

module.exports = { loginForm };
