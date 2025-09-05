const ErrorHandler = require("../utils/Errorhandler");

const authRouter = require("../routes/auth");
const dashboardRouter = require("../routes/dashboard");
const Analytics = require("../models/analytics");
const Order = require("../models/order");
const formatRupiah = require("../lib/helpers/formatRupiah");

function routesCfg(app) {
  app.get("/", async (req, res) => {
    const productTypeAnalytics = await Analytics.productTypeAnalytics();
    const latestOrders = await Order.latestOrders();

    res.render("home", {
      currentPath: req.path,
      productTypes: productTypeAnalytics,
      latestOrders,
      formatRupiah,
    });
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
}

module.exports = routesCfg;
