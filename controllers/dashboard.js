const Brands = require("../models/brands");
const Categories = require("../models/categories");
const Product = require("../models/product");
const Colors = require("../models/Colors");
const Sizes = require("../models/Sizes");
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
  const allBrands = await Brands.findAll({ q, sort });

  res.render("dashboard/products/brands", {
    brands: allBrands,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function categories(req, res) {
  const { q, sort } = req.query;
  const allCategories = await Categories.findAll({ q, sort });

  res.render("dashboard/products/categories", {
    categories: allCategories,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function colors(req, res) {
  const { q, sort } = req.query;
  const allColors = await Colors.findAll({ q, sort });

  res.render("dashboard/products/colors", {
    colors: allColors,
    formatRupiah,
    query: q || "",
    sort: sort || "",
  });
}

async function sizes(req, res) {
  const { q, sort } = req.query;
  const allSizes = await Sizes.findAll({ q, sort });

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
