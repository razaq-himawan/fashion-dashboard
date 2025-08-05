require("dotenv").config();
const mysql = require("mysql2/promise");

const PRODUCT_TYPES = [
  "Baju",
  "Celana",
  "Sepatu",
  "Tas",
  "Jam",
  "Kacamata",
  "Perhiasan",
  "Tumbler",
  "Jaket",
  "Topi",
];

// Produk yang memiliki ukuran
const SIZE_MAP = {
  Baju: ["S", "M", "L", "XL"],
  Celana: ["S", "M", "L", "XL"],
  Jaket: ["S", "M", "L", "XL"],
  Sepatu: ["38", "39", "40", "41"],
  Jam: ["38mm", "40mm", "42mm"],
  Perhiasan: ["15mm", "16mm", "17mm"],
  Tumbler: ["500ml", "1L"],
  Tas: ["Free Size"],
  Topi: ["Free Size"],
  Kacamata: ["Free Size"],
};

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPrice(min = 50000, max = 1000000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProductCode(i) {
  return `PRD-${String(i).padStart(5, "0")}`;
}

async function seedProducts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("Connected to database. Generating products...");

  const getIds = async (table) => {
    const [rows] = await connection.query(`SELECT id, nama FROM ${table}`);
    return rows;
  };

  const brands = await getIds("brands");
  const categories = await getIds("categories");
  const colors = await getIds("colors");
  const sizes = await getIds("sizes");

  const sizeMapByName = {};
  for (const size of sizes) {
    sizeMapByName[size.nama] = size.id;
  }

  const products = [];

  for (let i = 1; i <= 60; i++) {
    const productType = getRandomElement(PRODUCT_TYPES);
    const brand = getRandomElement(brands);
    const category = getRandomElement(categories);
    const color = getRandomElement(colors);

    let sizeId = null;
    if (SIZE_MAP[productType]) {
      const allowedSizes = SIZE_MAP[productType];
      const randomSizeName = getRandomElement(allowedSizes);
      sizeId = sizeMapByName[randomSizeName] || null;
    }

    const name =
      `${productType} ${brand.nama} ${color.nama}` +
      (sizeId
        ? ` ${Object.keys(sizeMapByName).find(
            (k) => sizeMapByName[k] === sizeId
          )}`
        : "");
    const price = getRandomPrice();
    const productCode = generateProductCode(i);

    products.push([
      productCode,
      name,
      brand.id,
      category.id,
      color.id,
      sizeId,
      price,
    ]);
  }

  const insertQuery = `
    INSERT INTO products (
      product_code, nama, brand_id, category_id, color_id, size_id, harga
    ) VALUES ?
  `;

  await connection.query(insertQuery, [products]);

  console.log("✅ Successfully inserted 60 products.");
  await connection.end();
}

seedProducts().catch((err) => {
  console.error("❌ Failed to insert products:", err);
});
