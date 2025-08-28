function isAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    req.flash("error", "You are not logged in");
    return res.redirect("/login");
  }

  next();
}

module.exports = isAuth;
