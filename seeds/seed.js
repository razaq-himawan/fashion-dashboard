require("dotenv").config();

const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

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
      `DROP TABLE IF EXISTS products, users, brands, categories, colors, sizes`
    );

    // Create tables
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

    const refTables = ["brands", "categories", "colors", "sizes"];
    for (const table of refTables) {
      await connection.query(`
        CREATE TABLE ${table} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nama VARCHAR(255) UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);
    }

    await connection.query(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_code VARCHAR(50) UNIQUE,
        nama TEXT NOT NULL,
        brand_id INT,
        category_id INT,
        color_id INT,
        size_id INT,
        harga DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (brand_id) REFERENCES brands(id),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (color_id) REFERENCES colors(id),
        FOREIGN KEY (size_id) REFERENCES sizes(id)
      );
    `);

    // Seed reference tables
    const insertValues = async (table, values) => {
      for (const val of values) {
        await connection.query(`INSERT INTO ${table} (nama) VALUES (?)`, [val]);
      }
    };

    await insertValues("brands", [
      "Adidas",
      "Gucci",
      "H&M",
      "Nike",
      "Zara",
      "Rolex",
      "Casio",
      "Daniel Wellington",
      "Levi's",
      "Uniqlo",
      "Ray-Ban",
      "Oakley",
      "Fossil",
      "Swatch",
      "The North Face",
      "Under Armour",
      "Reebok",
      "Puma",
      "Hermès",
      "Supreme",
    ]);

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

    // Hash passwords with bcrypt
    const saltRounds = 10;
    const user = {
      username: "admin",
      email: "admin@example.com",
      password: "admin123",
      role: "owner",
    };

    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    await connection.query(
      `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [user.username, user.email, hashedPassword, user.role]
    );

    console.log("✅ Database seeded successfully.");
  } catch (err) {
    console.error("❌ Error seeding database:", err);
  } finally {
    await connection.end();
  }
}

seedDatabase();
