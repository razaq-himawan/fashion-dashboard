const express = require("express");
const expressCfg = require("./config/express");

const passportCfg = require("./config/passport");
const passport = require("passport");
const routesCfg = require("./config/routes");

const app = express();

expressCfg(app, express, passport);
passportCfg(passport);
routesCfg(app);

app.listen(process.env.PORT, () => {
  console.log(
    `Example app listening on port http://localhost:${process.env.PORT}`
  );
});
