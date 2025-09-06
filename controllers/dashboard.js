const Brand = require("../models/brand");
const Category = require("../models/category");
const Product = require("../models/product");
const Color = require("../models/color");
const Size = require("../models/size");
const Order = require("../models/order");
const User = require("../models/user");
const Analytics = require("../models/analytics");

const formatRupiah = require("../lib/helpers/formatRupiah");
const capitalize = require("../lib/helpers/capitalize");

async function overview(req, res) {
  const [
    topProducts,
    revenueByType,
    salesPerMonth,
    dailySales,
    monthlyGrowth,
    topCustomers,
  ] = await Promise.all([
    Analytics.topSellingProducts(5),
    Analytics.revenueByType(),
    Analytics.salesPerMonth(),
    Analytics.dailySalesCurrentMonth(),
    Analytics.monthlyGrowth(),
    Analytics.topCustomers(5),
  ]);

  res.render("dashboard/overview", {
    topProducts,
    revenueByType,
    salesPerMonth,
    dailySales,
    monthlyGrowth,
    topCustomers,
    formatRupiah,
  });
}

async function products(req, res) {
  const { q, sort } = req.query;
  const productsData = await Product.findAll({
    q,
    sort,
    page: req.query.page,
  });

  res.render("dashboard/products", {
    products: productsData.rows,
    pagination: productsData,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function brands(req, res) {
  const { q, sort } = req.query;
  const brandsData = await Brand.findAll({
    q,
    sort,
    page: req.query.page,
  });

  res.render("dashboard/products/brands", {
    brands: brandsData.rows,
    pagination: brandsData,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function categories(req, res) {
  const { q, sort } = req.query;
  const categoriesData = await Category.findAll({
    q,
    sort,
    page: req.query.page,
  });

  res.render("dashboard/products/categories", {
    categories: categoriesData.rows,
    pagination: categoriesData,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function colors(req, res) {
  const { q, sort } = req.query;
  const colorsData = await Color.findAll({
    q,
    sort,
    page: req.query.page,
  });

  res.render("dashboard/products/colors", {
    colors: colorsData.rows,
    pagination: colorsData,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function sizes(req, res) {
  const { q, sort } = req.query;
  const sizesData = await Size.findAll({
    q,
    sort,
    page: req.query.page,
  });

  res.render("dashboard/products/sizes", {
    sizes: sizesData.rows,
    pagination: sizesData,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function users(req, res) {
  const { q, sort } = req.query;
  const usersData = await User.findAll({
    q,
    sort,
    page: req.query.page,
  });

  res.render("dashboard/users", {
    users: usersData.rows,
    pagination: usersData,
    capitalize,
    query: q || "",
    sort: sort || "",
  });
}

async function orders(req, res) {
  const { q, sort } = req.query;
  const ordersData = await Order.findAll({
    q,
    sort,
    page: req.query.page,
  });

  res.render("dashboard/orders", {
    orders: ordersData.rows,
    pagination: ordersData,
    formatRupiah,
    capitalize,
    query: q || "",
    sort: sort || "",
  });
}

async function settings(req, res) {
  res.render("dashboard/settings");
}

module.exports = {
  overview,
  products,
  brands,
  categories,
  colors,
  sizes,
  users,
  orders,
  settings,
};
