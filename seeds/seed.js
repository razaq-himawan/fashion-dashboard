require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const PRODUCT_TYPES = [
  { name: "Baju", sizes: ["S", "M", "L", "XL"] },
  { name: "Celana", sizes: ["S", "M", "L", "XL"] },
  { name: "Sepatu", sizes: ["38", "39", "40", "41"] },
  { name: "Tas", sizes: ["Free Size"] },
  { name: "Jam", sizes: ["38mm", "40mm", "42mm"] },
  { name: "Kacamata", sizes: ["Free Size"] },
  { name: "Perhiasan", sizes: ["15mm", "16mm", "17mm"] },
  { name: "Tumbler", sizes: ["500ml", "1L"] },
  { name: "Jaket", sizes: ["S", "M", "L", "XL"] },
  { name: "Topi", sizes: ["Free Size"] },
];

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("Connected to the database.");

  try {
    await connection.query(
      `DROP TABLE IF EXISTS products, users, brands, categories, colors, sizes, product_type_sizes, product_types`
    );

    // Users
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('owner', 'manager') NOT NULL DEFAULT 'manager',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Reference tables
    const refTables = ["brands", "categories", "colors", "sizes"];
    for (const table of refTables) {
      await connection.query(`
        CREATE TABLE ${table} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);
    }

    // Product types
    await connection.query(`
      CREATE TABLE product_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE product_type_sizes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_type_id INT NOT NULL,
        size_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_type_id) REFERENCES product_types(id),
        FOREIGN KEY (size_id) REFERENCES sizes(id)
      );
    `);

    // Products
    await connection.query(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_code VARCHAR(50) UNIQUE,
        name TEXT NOT NULL,
        product_type_id INT,
        brand_id INT,
        category_id INT,
        color_id INT,
        size_id INT,
        price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_type_id) REFERENCES product_types(id),
        FOREIGN KEY (brand_id) REFERENCES brands(id),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (color_id) REFERENCES colors(id),
        FOREIGN KEY (size_id) REFERENCES sizes(id)
      );
    `);

    // Seed data
    const insertValues = async (table, values) => {
      for (const val of values) {
        await connection.query(`INSERT INTO ${table} (name) VALUES (?)`, [val]);
      }
    };

    await insertValues("brands", ["Adidas", "Gucci", "H&M", "Nike", "Zara"]);
    await insertValues("categories", ["Pria", "Wanita", "Anak-anak"]);
    await insertValues("colors", [
      "Biru",
      "Hijau",
      "Hitam",
      "Kuning",
      "Merah",
      "Putih",
    ]);
    await insertValues("sizes", [
      "S",
      "M",
      "L",
      "XL",
      "38",
      "39",
      "40",
      "41",
      "38mm",
      "40mm",
      "42mm",
      "Free Size",
      "15mm",
      "16mm",
      "17mm",
      "500ml",
      "1L",
    ]);

    // Map sizes by name
    const [sizes] = await connection.query("SELECT * FROM sizes");
    const sizeMap = {};
    for (const size of sizes) {
      sizeMap[size.name] = size.id;
    }

    // Insert product types & product_type_sizes
    for (const type of PRODUCT_TYPES) {
      const [res] = await connection.query(
        "INSERT INTO product_types (name) VALUES (?)",
        [type.name]
      );
      const productTypeId = res.insertId;

      for (const sizeName of type.sizes) {
        const sizeId = sizeMap[sizeName];
        if (sizeId) {
          await connection.query(
            "INSERT INTO product_type_sizes (product_type_id, size_id) VALUES (?, ?)",
            [productTypeId, sizeId]
          );
        }
      }
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("admin123", saltRounds);
    await connection.query(
      `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ["admin", "admin@example.com", hashedPassword, "owner"]
    );

    console.log("✅ Database seeded successfully.");
  } catch (err) {
    console.error("❌ Error seeding database:", err);
  } finally {
    await connection.end();
  }
}

seedDatabase();
