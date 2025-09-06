require("dotenv").config();
const { Pool } = require("pg");

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPrice(min = 20000, max = 100000, step = 1000) {
  const range = Math.floor((max - min) / step);
  const randomStep = Math.floor(Math.random() * (range + 1));
  return min + randomStep * step;
}

function getRandomStock(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProductCode(i) {
  return `PRD-${String(i).padStart(5, "0")}`;
}

function getRandomDateInMonth(monthOffset = 0) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + monthOffset;

  if (month < 0) {
    month += 12;
    year -= 1;
  } else if (month > 11) {
    month -= 12;
    year += 1;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);

  return new Date(year, month, day, hour, minute, second);
}

function getRandomDateWithinLastMonths(maxMonthsAgo = 6) {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - maxMonthsAgo);
  const time =
    past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(time);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedProductsAndOrders() {
  const client = await pool.connect();
  console.log("Connected to PostgreSQL. Generating products...");

  try {
    await client.query("BEGIN");

    const getIds = async (table) => {
      const res = await client.query(`SELECT id, name FROM ${table}`);
      return res.rows;
    };

    const brands = await getIds("brands");
    const categories = await getIds("categories");
    const colors = await getIds("colors");

    const { rows: productTypes } = await client.query(
      "SELECT id, name FROM product_types"
    );

    const { rows: ptsRows } = await client.query(`
      SELECT pts.product_type_id, s.id AS size_id, s.name AS size_name
      FROM product_type_sizes pts
      JOIN sizes s ON pts.size_id = s.id
    `);

    const productTypeSizeMap = {};
    for (const row of ptsRows) {
      if (!productTypeSizeMap[row.product_type_id])
        productTypeSizeMap[row.product_type_id] = [];
      productTypeSizeMap[row.product_type_id].push({
        id: row.size_id,
        name: row.size_name,
      });
    }

    const products = [];
    const productStockMap = {};

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

      const name = `${productType.name} ${brand.name} ${color.name}${
        sizeName ? ` ${sizeName}` : ""
      }`;
      const price = getRandomPrice();
      const productCode = generateProductCode(i);
      const initialStock = getRandomStock(50, 100);

      products.push({
        product_code: productCode,
        name,
        product_type_id: productType.id,
        brand_id: brand.id,
        category_id: category.id,
        color_id: color.id,
        size_id: sizeId,
        price,
        stock: initialStock,
        created_at: getRandomDateWithinLastMonths(6),
      });
      productStockMap[i] = initialStock;
    }

    for (const p of products) {
      await client.query(
        `INSERT INTO products 
        (product_code, name, product_type_id, brand_id, category_id, color_id, size_id, price, stock, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          p.product_code,
          p.name,
          p.product_type_id,
          p.brand_id,
          p.category_id,
          p.color_id,
          p.size_id,
          p.price,
          p.stock,
          p.created_at,
        ]
      );
    }

    console.log("✅ Inserted products with initial stock.");

    // Orders
    console.log("Generating orders over the past 6 months...");

    const { rows: productRows } = await client.query(
      "SELECT id, price FROM products"
    );

    const orderItems = [];

    for (let monthOffset = -5; monthOffset <= 0; monthOffset++) {
      const base = 3 + (6 + monthOffset);
      const numOrders = getRandomStock(base, base + 5);

      for (let o = 0; o < numOrders; o++) {
        const itemsCount = Math.floor(Math.random() * 3) + 1;
        const chosenProducts = [];
        let totalAmount = 0;

        for (let j = 0; j < itemsCount; j++) {
          const product = getRandomElement(productRows);
          if (!productStockMap[product.id] || productStockMap[product.id] <= 0)
            continue;

          const maxQty = Math.min(productStockMap[product.id], 5);
          if (maxQty <= 0) continue;

          const quantity = getRandomStock(1, maxQty);
          productStockMap[product.id] -= quantity;

          totalAmount += product.price * quantity;

          chosenProducts.push({
            product_id: product.id,
            quantity,
            price: product.price,
          });
        }

        if (chosenProducts.length === 0) continue;

        const createdAt = getRandomDateInMonth(monthOffset);

        let status;
        if (monthOffset < -2) {
          status = getRandomElement(["completed", "completed", "shipped"]);
        } else if (monthOffset < 0) {
          status = getRandomElement(["completed", "shipped", "paid"]);
        } else {
          status = getRandomElement(["pending", "paid", "cancelled"]);
        }

        const customerName = `Guest ${Math.floor(Math.random() * 1000)}`;
        const customerEmail = `guest${Math.floor(
          Math.random() * 1000
        )}@example.com`;

        const orderRes = await client.query(
          `INSERT INTO orders (user_id, customer_name, customer_email, status, total_amount, created_at)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [null, customerName, customerEmail, status, totalAmount, createdAt]
        );
        const orderId = orderRes.rows[0].id;

        for (const item of chosenProducts) {
          orderItems.push([
            orderId,
            item.product_id,
            item.quantity,
            item.price,
          ]);
        }
      }
    }

    for (const item of orderItems) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)",
        item
      );
    }

    await client.query("COMMIT");
    console.log(`✅ Inserted ${orderItems.length} order items over 6 months.`);
    console.log("✅ Seeding complete with realistic guest sales data.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Failed to seed database:", err);
  } finally {
    client.release();
  }
}

seedProductsAndOrders();
