const pool = require("../database/db");

const Product = {
  async findAll({ q, sort } = {}) {
    let baseQuery = `
    SELECT p.id,
           p.product_code,
           p.name,
           p.price,
           p.stock,
           pt.name AS product_type,
           b.name AS brand,
           c.name AS category,
           co.name AS color,
           s.name AS size
    FROM products p
    LEFT JOIN product_types pt ON p.product_type_id = pt.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN colors co ON p.color_id = co.id
    LEFT JOIN sizes s ON p.size_id = s.id
  `;

    const params = [];

    if (q) {
      baseQuery += ` WHERE p.name LIKE ? OR p.product_code LIKE ?`;
      params.push(`%${q}%`, `%${q}%`);
    }

    const allowedSorts = {
      price_asc: "p.price ASC",
      price_desc: "p.price DESC",
      stock_asc: "p.stock ASC",
      stock_desc: "p.stock DESC",
      newest: "p.created_at DESC",
    };

    baseQuery += ` ORDER BY ${allowedSorts[sort] || "p.created_at DESC"}`;

    const [rows] = await pool.query(baseQuery, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, 
              pt.name AS product_type,
              b.name AS brand,
              c.name AS category,
              co.name AS color,
              s.name AS size
       FROM products p
       LEFT JOIN product_types pt ON p.product_type_id = pt.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN colors co ON p.color_id = co.id
       LEFT JOIN sizes s ON p.size_id = s.id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  },

  async findByCode(product_code) {
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE product_code = ? LIMIT 1`,
      [product_code]
    );
    return rows[0];
  },

  async findByName(name) {
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE name LIKE ?`,
      [`%${name}%`]
    );
    return rows;
  },

  async findByType(typeId) {
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE product_type_id = ?`,
      [typeId]
    );
    return rows;
  },

  async findAllTypesWithStock() {
    const [rows] = await pool.query(
      `SELECT 
       pt.id,
       pt.name,
       COALESCE(
         SUM(
           CASE 
             WHEN p.created_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
              AND p.created_at < DATE_FORMAT(CURRENT_DATE + INTERVAL 1 MONTH, '%Y-%m-01')
             THEN p.stock ELSE 0
           END
         ), 0
       ) AS totalStock,
       COALESCE(
         SUM(
           CASE 
             WHEN p.created_at >= DATE_FORMAT(CURRENT_DATE - INTERVAL 1 MONTH, '%Y-%m-01')
              AND p.created_at < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
             THEN p.stock ELSE 0
           END
         ), 0
       ) AS lastMonthStock
     FROM product_types pt
     LEFT JOIN products p ON pt.id = p.product_type_id
     GROUP BY pt.id, pt.name
     ORDER BY pt.id`
    );
    return rows;
  },

  async findByBrand(brandId) {
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE brand_id = ?`,
      [brandId]
    );
    return rows;
  },

  async findByCategory(categoryId) {
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE category_id = ?`,
      [categoryId]
    );
    return rows;
  },

  async findByColor(colorId) {
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE color_id = ?`,
      [colorId]
    );
    return rows;
  },

  async findBySize(sizeId) {
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE size_id = ?`,
      [sizeId]
    );
    return rows;
  },

  async sort(column = "name", order = "ASC") {
    const allowedColumns = ["price", "name", "stock", "created_at"];
    const allowedOrder = ["ASC", "DESC"];

    const sortColumn = allowedColumns.includes(column) ? column : "name";
    const sortOrder = allowedOrder.includes(order.toUpperCase())
      ? order.toUpperCase()
      : "ASC";

    const [rows] = await pool.query(
      `SELECT * FROM products ORDER BY ${sortColumn} ${sortOrder}`
    );
    return rows;
  },

  async countByType() {
    const [rows] = await pool.query(`
      SELECT pt.name, COUNT(p.id) AS total
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      GROUP BY pt.name
      ORDER BY total DESC
    `);
    return rows;
  },

  async countByTypeWithStock() {
    const [rows] = await pool.query(`
    SELECT 
      pt.name, 
      COUNT(p.id) AS total_products,
      SUM(p.stock) AS total_stock
    FROM products p
    LEFT JOIN product_types pt ON p.product_type_id = pt.id
    GROUP BY pt.name
    ORDER BY total_stock DESC
  `);
    return rows;
  },
};

module.exports = Product;
