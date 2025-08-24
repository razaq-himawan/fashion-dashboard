const Product = require("../models/product");
const formatRupiah = require("../utils/formatRupiah");

function overview(req, res) {
  res.render("dashboard/overview");
}

async function products(req, res) {
  const { q, sort } = req.query;
  const allProducts = await Product.findAll({ q, sort });

  res.render("dashboard/products", {
    products: allProducts,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

function brands(req, res) {
  res.render("dashboard/products/brands");
}

function categories(req, res) {
  res.render("dashboard/products/categories");
}

function colors(req, res) {
  res.render("dashboard/products/colors");
}

function sizes(req, res) {
  res.render("dashboard/products/sizes");
}

function users(req, res) {
  res.render("dashboard/users");
}

function orders(req, res) {
  res.render("dashboard/orders");
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
};
