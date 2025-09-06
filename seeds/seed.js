require("dotenv").config();
const { Pool } = require("pg");
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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedDatabase() {
  const client = await pool.connect();
  console.log("Connected to PostgreSQL");

  try {
    await client.query("BEGIN");

    // Drop in correct order
    await client.query(`
      DROP TABLE IF EXISTS order_items, orders, products, product_type_sizes, product_types,
      brands, categories, colors, sizes, users CASCADE;
    `);

    // Drop enums if they exist
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          DROP TYPE user_role;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
          DROP TYPE order_status;
        END IF;
      END
      $$;
    `);

    // Create enums
    await client.query(`CREATE TYPE user_role AS ENUM ('owner', 'manager');`);
    await client.query(
      `CREATE TYPE order_status AS ENUM ('pending','paid','shipped','completed','cancelled');`
    );

    // Function for updated_at auto-update
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Users
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role user_role NOT NULL DEFAULT 'manager',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Reference tables
    const refTables = ["brands", "categories", "colors", "sizes"];
    for (const table of refTables) {
      await client.query(`
        CREATE TABLE ${table} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // Product types
    await client.query(`
      CREATE TABLE product_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE product_type_sizes (
        id SERIAL PRIMARY KEY,
        product_type_id INT NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
        size_id INT NOT NULL REFERENCES sizes(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Products
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        product_code VARCHAR(50) UNIQUE,
        name TEXT NOT NULL,
        product_type_id INT REFERENCES product_types(id),
        brand_id INT REFERENCES brands(id),
        category_id INT REFERENCES categories(id),
        color_id INT REFERENCES colors(id),
        size_id INT REFERENCES sizes(id),
        price NUMERIC(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Orders
    await client.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        status order_status DEFAULT 'pending',
        total_amount NUMERIC(10,2) NOT NULL,
        customer_name VARCHAR(100),
        customer_email VARCHAR(150),
        customer_phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Order Items
    await client.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id),
        quantity INT NOT NULL DEFAULT 1,
        price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Functions + triggers for stock management
    await client.query(`
      CREATE OR REPLACE FUNCTION reduce_stock() RETURNS TRIGGER AS $$
      BEGIN
        UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_reduce_stock
      AFTER INSERT ON order_items
      FOR EACH ROW
      EXECUTE FUNCTION reduce_stock();
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION restore_stock() RETURNS TRIGGER AS $$
      BEGIN
        UPDATE products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_restore_stock
      AFTER DELETE ON order_items
      FOR EACH ROW
      EXECUTE FUNCTION restore_stock();
    `);

    // Trigger to refresh updated_at when stock changes
    await client.query(`
      CREATE OR REPLACE FUNCTION update_product_timestamp() RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_product_timestamp
      BEFORE UPDATE OF stock ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_product_timestamp();
    `);

    // Attach updated_at triggers
    const tablesWithUpdatedAt = [
      "users",
      "brands",
      "categories",
      "colors",
      "sizes",
      "product_types",
      "product_type_sizes",
      "products",
      "orders",
      "order_items",
    ];

    for (const table of tablesWithUpdatedAt) {
      await client.query(`
        CREATE TRIGGER ${table}_set_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      `);
    }

    // Seed data helper
    const insertValues = async (table, values) => {
      for (const val of values) {
        await client.query(`INSERT INTO ${table} (name) VALUES ($1)`, [val]);
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
    const { rows: sizes } = await client.query("SELECT * FROM sizes");
    const sizeMap = {};
    for (const size of sizes) {
      sizeMap[size.name] = size.id;
    }

    // Insert product types + product_type_sizes
    for (const type of PRODUCT_TYPES) {
      const res = await client.query(
        "INSERT INTO product_types (name) VALUES ($1) RETURNING id",
        [type.name]
      );
      const productTypeId = res.rows[0].id;

      for (const sizeName of type.sizes) {
        const sizeId = sizeMap[sizeName];
        if (sizeId) {
          await client.query(
            "INSERT INTO product_type_sizes (product_type_id, size_id) VALUES ($1, $2)",
            [productTypeId, sizeId]
          );
        }
      }
    }

    // Create admin + managers
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("admin123", saltRounds);
    await client.query(
      `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
      ["admin", "admin@example.com", hashedPassword, "owner"]
    );

    const managerUser = [
      { username: "ivan", email: "ivan@example.com" },
      { username: "julian", email: "julian@example.com" },
      { username: "katarina", email: "katarina@example.com" },
    ];

    for (const u of managerUser) {
      const pw = await bcrypt.hash("password123", saltRounds);
      await client.query(
        `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [u.username, u.email, pw, "manager"]
      );
    }

    await client.query("COMMIT");
    console.log(
      "✅ Database seeded successfully with auto-updated timestamps."
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error seeding database:", err);
  } finally {
    client.release();
  }
}

seedDatabase();
