require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createViews() {
  const client = await pool.connect();
  console.log("Connected to PostgreSQL. Creating views...");

  try {
    // Drop old view if it exists (to avoid conflicts)
    await client.query(`DROP MATERIALIZED VIEW IF EXISTS view_latest_order;`);

    // ---- PRODUCTS ----
    await client.query(`
      CREATE OR REPLACE VIEW view_product_stock_summary AS
      SELECT 
        pt.id AS product_type_id,
        pt.name AS type_name,
        COALESCE(SUM(p.stock), 0) AS current_stock,
        (COALESCE(SUM(p.stock), 0) + COALESCE(SUM(CASE 
            WHEN o.created_at >= (CURRENT_DATE - INTERVAL '1 month') 
              AND o.status IN ('paid','shipped','completed')
            THEN oi.quantity ELSE 0 END), 0)
        ) AS last_month_stock
      FROM product_types pt
      LEFT JOIN products p ON p.product_type_id = pt.id
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON oi.order_id = o.id
      GROUP BY pt.id, pt.name;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW view_top_selling_products AS
      SELECT 
        p.id, p.name, p.product_code,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('paid','shipped','completed')
      GROUP BY p.id, p.name, p.product_code
      ORDER BY total_sold DESC;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW view_revenue_by_type AS
      SELECT 
        pt.name AS product_type,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('paid','shipped','completed')
      GROUP BY pt.name
      ORDER BY total_revenue DESC;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW view_stock_usage AS
      SELECT 
        p.id, p.name, p.product_code, p.stock,
        COALESCE(SUM(oi.quantity), 0) AS sold_quantity,
        (p.stock + COALESCE(SUM(oi.quantity), 0)) AS initial_stock
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
        AND o.status IN ('paid','shipped','completed')
      GROUP BY p.id, p.name, p.product_code, p.stock
      ORDER BY sold_quantity DESC;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW view_revenue_by_category AS
      SELECT 
        c.name AS category,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('paid','shipped','completed')
      GROUP BY c.name
      ORDER BY total_revenue DESC;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW view_revenue_by_brand AS
      SELECT 
        b.name AS brand,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('paid','shipped','completed')
      GROUP BY b.name
      ORDER BY total_revenue DESC;
    `);

    // ---- SALES ----
    await client.query(`
      CREATE OR REPLACE VIEW view_sales_per_month AS
      SELECT 
        TO_CHAR(o.created_at, 'YYYY-MM') AS month,
        COUNT(o.id) AS total_orders,
        SUM(o.total_amount) AS total_revenue
      FROM orders o
      WHERE o.status IN ('paid','shipped','completed')
      GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
      ORDER BY month DESC;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW view_sales_daily_current_month AS
      SELECT 
        DATE(o.created_at) AS day,
        COUNT(o.id) AS total_orders,
        SUM(o.total_amount) AS total_revenue
      FROM orders o
      WHERE o.status IN ('paid','shipped','completed')
        AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      GROUP BY DATE(o.created_at)
      ORDER BY day ASC;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW view_monthly_growth AS
      SELECT 
        TO_CHAR(o.created_at, 'YYYY-MM') AS month,
        SUM(o.total_amount) AS total_revenue,
        COUNT(o.id) AS total_orders,
        LAG(SUM(o.total_amount)) OVER (ORDER BY TO_CHAR(o.created_at, 'YYYY-MM')) AS last_month_revenue,
        LAG(COUNT(o.id)) OVER (ORDER BY TO_CHAR(o.created_at, 'YYYY-MM')) AS last_month_orders,
        ROUND(
          (SUM(o.total_amount) - LAG(SUM(o.total_amount)) OVER (ORDER BY TO_CHAR(o.created_at, 'YYYY-MM')))
          / NULLIF(LAG(SUM(o.total_amount)) OVER (ORDER BY TO_CHAR(o.created_at, 'YYYY-MM')), 0) * 100,
          2
        ) AS revenue_growth_percent,
        ROUND(
          (COUNT(o.id) - LAG(COUNT(o.id)) OVER (ORDER BY TO_CHAR(o.created_at, 'YYYY-MM')))
          / NULLIF(LAG(COUNT(o.id)) OVER (ORDER BY TO_CHAR(o.created_at, 'YYYY-MM')), 0) * 100,
          2
        ) AS order_growth_percent
      FROM orders o
      WHERE o.status IN ('paid','shipped','completed')
      GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
      ORDER BY month DESC;
    `);

    // ---- USERS ----
    await client.query(`
      CREATE MATERIALIZED VIEW view_latest_order AS
      SELECT 
        o.id AS order_id,
        o.user_id,
        u.username,
        o.status,
        o.total_amount,
        o.created_at,
        COUNT(oi.id) AS total_items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status IN ('pending','paid','shipped','completed')
      GROUP BY o.id, o.user_id, u.username, o.status, o.total_amount, o.created_at
      ORDER BY o.created_at DESC
      LIMIT 5;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW view_user_stats AS
      SELECT 
        u.id AS user_id,
        u.username,
        u.email,
        u.role,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        COALESCE(AVG(o.total_amount), 0) AS avg_order_value,
        MAX(o.created_at) AS last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.username, u.email, u.role
      ORDER BY total_spent DESC;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW view_top_customers AS
      SELECT 
        u.id AS user_id,
        u.username,
        u.email,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        COALESCE(AVG(o.total_amount), 0) AS avg_order_value
      FROM users u
      JOIN orders o ON u.id = o.user_id
      WHERE o.status IN ('paid','shipped','completed')
      GROUP BY u.id, u.username, u.email
      ORDER BY total_spent DESC;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW view_inactive_users AS
      SELECT 
        u.id AS user_id,
        u.username,
        u.email,
        u.role,
        u.created_at
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE o.id IS NULL
      ORDER BY u.created_at ASC;
    `);

    console.log(
      "✅ All analytics views created successfully (with materialized latest orders)."
    );
  } catch (err) {
    console.error("❌ Error creating views:", err);
  } finally {
    client.release();
  }
}

createViews();
