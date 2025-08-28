const Brand = require("../models/brand");
const Category = require("../models/category");
const Product = require("../models/product");
const Color = require("../models/color");
const Size = require("../models/size");
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

async function brands(req, res) {
  const { q, sort } = req.query;
  const allBrands = await Brand.findAll({ q, sort });

  res.render("dashboard/products/brands", {
    brands: allBrands,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function categories(req, res) {
  const { q, sort } = req.query;
  const allCategories = await Category.findAll({ q, sort });

  res.render("dashboard/products/categories", {
    categories: allCategories,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function colors(req, res) {
  const { q, sort } = req.query;
  const allColors = await Color.findAll({ q, sort });

  res.render("dashboard/products/colors", {
    colors: allColors,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function sizes(req, res) {
  const { q, sort } = req.query;
  const allSizes = await Size.findAll({ q, sort });

  res.render("dashboard/products/sizes", {
    sizes: allSizes,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function users(req, res) {
  res.render("dashboard/users");
}

async function orders(req, res) {
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
