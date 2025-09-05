const pool = require("../database/db");
const paginate = require("../lib/helpers/paginate");

const Product = {
  async findAll({ q, sort, page, perPage } = {}) {
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
      id_asc: "p.id ASC",
      id_desc: "p.id DESC",
      price_asc: "p.price ASC",
      price_desc: "p.price DESC",
      stock_asc: "p.stock ASC",
      stock_desc: "p.stock DESC",
      newest: "p.created_at DESC",
    };

    return paginate(baseQuery, params, { sort, allowedSorts, page, perPage });
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

  async lowStock(threshold = 5) {
    const [rows] = await pool.query(
      `SELECT id, product_code, name, stock, price
       FROM products
       WHERE stock <= ?
       ORDER BY stock ASC`,
      [threshold]
    );
    return rows;
  },
};

module.exports = Product;
