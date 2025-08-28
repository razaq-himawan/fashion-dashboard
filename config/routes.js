const ErrorHandler = require("../utils/Errorhandler");

const PRODUCT_TYPES = require("../lib/types/product");

const authRouter = require("../routes/auth");
const dashboardRouter = require("../routes/dashboard");
const Product = require("../models/product");

function routesCfg(app) {
  app.get("/", async (req, res) => {
    const productTypesWithStock = await Product.findAllTypesWithStock();

    res.render("home", {
      currentPath: req.path,
      productTypes: productTypesWithStock,
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
