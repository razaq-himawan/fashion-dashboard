require("dotenv").config();
const mysql = require("mysql2/promise");

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPrice(min = 50000, max = 1000000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomStock(min = 5, max = 100) {
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

  // Get product types
  const [productTypes] = await connection.query(
    "SELECT id, nama FROM product_types"
  );

  // Get mapping product_type → allowed sizes
  const [ptsRows] = await connection.query(`
    SELECT pts.product_type_id, s.id AS size_id, s.nama AS size_name
    FROM product_type_sizes pts
    JOIN sizes s ON pts.size_id = s.id
  `);

  const productTypeSizeMap = {};
  for (const row of ptsRows) {
    if (!productTypeSizeMap[row.product_type_id]) {
      productTypeSizeMap[row.product_type_id] = [];
    }
    productTypeSizeMap[row.product_type_id].push({
      id: row.size_id,
      name: row.size_name,
    });
  }

  const products = [];

  for (let i = 1; i <= 60; i++) {
    const productType = getRandomElement(productTypes);
    const brand = getRandomElement(brands);
    const category = getRandomElement(categories);
    const color = getRandomElement(colors);

    let sizeId = null;
    let sizeName = "";
    if (productTypeSizeMap[productType.id]) {
      const randomSize = getRandomElement(productTypeSizeMap[productType.id]);
      sizeId = randomSize.id;
      sizeName = randomSize.name;
    }

    const name =
      `${productType.nama} ${brand.nama} ${color.nama}` +
      (sizeName ? ` ${sizeName}` : "");

    const price = getRandomPrice();
    const productCode = generateProductCode(i);
    const stock = getRandomStock();

    products.push([
      productCode,
      name,
      productType.id,
      brand.id,
      category.id,
      color.id,
      sizeId,
      price,
      stock,
    ]);
  }

  const insertQuery = `
    INSERT INTO products (
      product_code, nama, product_type_id, brand_id, category_id, color_id, size_id, harga, stock
    ) VALUES ?
  `;

  await connection.query(insertQuery, [products]);

  console.log("✅ Successfully inserted 60 products.");
  await connection.end();
}

seedProducts().catch((err) => {
  console.error("❌ Failed to insert products:", err);
});
