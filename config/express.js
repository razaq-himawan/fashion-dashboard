const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");

const Envs = require("./env");

function expressCfg(app, express, passport) {
  app.engine("ejs", ejsMate);
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride("_method"));

  app.use(
    session({
      secret: Envs.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: Date.now() + 24 * 60 * 60 * 1000,
      },
    })
  );
  app.use(flash());
  app.use(passport.authenticate("session"));

  app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
  });
}

module.exports = expressCfg;
