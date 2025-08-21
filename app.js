require("dotenv").config();

const express = require("express");
const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");

const pool = require("./database/db");
const ErrorHandler = require("./utils/Errorhandler");

const authRouter = require("./routes/auth");
const dashboardRouter = require("./routes/dashboard");
const User = require("./models/user");

const PRODUCT_TYPES = require("./utils/types/pruduct");

const app = express();

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected!");
    connection.release();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
})();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
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
passport.use(new LocalStrategy(User.verify));
passport.serializeUser(User.serializeUser);
passport.deserializeUser(User.deserializeUser);

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.get("/", (req, res) => {
  res.render("home", { currentPath: req.path, productTypes: PRODUCT_TYPES });
});

app.use("/", authRouter);
app.use("/dashboard", dashboardRouter);

app.all("/{*any}", (req, res, next) => {
  next(new ErrorHandler("Page not found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh no, something went wrong!";
  res.status(statusCode).render("error", { err });
});

app.listen(process.env.PORT, () => {
  console.log(
    `Example app listening on port http://localhost:${process.env.PORT}`
  );
});
