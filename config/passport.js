const LocalStrategy = require("passport-local");

const User = require("../models/user");

function passportCfg(passport) {
  passport.use(new LocalStrategy(User.verify));
  passport.serializeUser(User.serializeUser);
  passport.deserializeUser(User.deserializeUser);
}

module.exports = passportCfg;
