const pool = require("../database/db");
const paginate = require("../lib/helpers/paginate");

const Order = {
  async findAll({ q, sort, page, perPage } = {}) {
    let baseQuery = `
      SELECT 
        o.id,
        o.status,
        o.total_amount,
        o.created_at,
        o.updated_at,
        COALESCE(u.username, o.customer_name) AS customer_name,
        COALESCE(u.email, o.customer_email) AS customer_email,
        COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    const params = [];

    if (q) {
      baseQuery += ` WHERE COALESCE(u.username, o.customer_name) LIKE ? OR COALESCE(u.email, o.customer_email) LIKE ?`;
      params.push(`%${q}%`, `%${q}%`);
    }

    baseQuery += ` GROUP BY o.id, o.status, o.total_amount, o.created_at, o.updated_at, u.username, u.email, o.customer_name, o.customer_email`;

    const allowedSorts = {
      id_asc: "o.id ASC",
      id_desc: "o.id DESC",
      name_asc: "customer_name ASC",
      name_desc: "customer_name DESC",
      newest: "o.created_at DESC",
      oldest: "o.created_at ASC",
      total_desc: "o.total_amount DESC",
      total_asc: "o.total_amount ASC",
    };

    return paginate(baseQuery, params, { sort, allowedSorts, page, perPage });
  },

  async findById(id) {
    const [orderRows] = await pool.query(
      `
      SELECT 
        o.*,
        COALESCE(u.username, o.customer_name) AS customer_name,
        COALESCE(u.email, o.customer_email) AS customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ? LIMIT 1
      `,
      [id]
    );

    if (orderRows.length === 0) return null;
    const order = orderRows[0];

    const [itemRows] = await pool.query(
      `
      SELECT 
        oi.*,
        p.name AS product_name,
        p.product_code
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      `,
      [id]
    );

    order.items = itemRows;
    return order;
  },

  async latestOrders(limit = 5) {
    const [rows] = await pool.query(
      `
        SELECT 
          o.id AS order_id,
          o.status,
          o.total_amount,
          o.created_at,
          o.updated_at,
          COALESCE(u.username, o.customer_name) AS customer_name,
          COALESCE(u.email, o.customer_email) AS customer_email,
          COUNT(oi.id) AS item_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status IN ('pending','paid','shipped','completed')
        GROUP BY o.id, o.status, o.total_amount, o.created_at, o.updated_at, u.username, u.email, o.customer_name, o.customer_email
        ORDER BY o.created_at DESC
        LIMIT ?;
      `,
      [limit]
    );
    return rows;
  },
};

module.exports = Order;
