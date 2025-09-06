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
    let paramIndex = 1;

    if (q) {
      baseQuery += ` WHERE p.name ILIKE $${paramIndex} OR p.product_code ILIKE $${
        paramIndex + 1
      }`;
      params.push(`%${q}%`, `%${q}%`);
      paramIndex += 2;
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
    const result = await pool.query(
      `
      SELECT p.*, 
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
      WHERE p.id = $1
      LIMIT 1
      `,
      [id]
    );
    return result.rows[0];
  },

  async findByCode(product_code) {
    const result = await pool.query(
      `SELECT * FROM products WHERE product_code = $1 LIMIT 1`,
      [product_code]
    );
    return result.rows[0];
  },

  async findByName(name) {
    const result = await pool.query(
      `SELECT * FROM products WHERE name ILIKE $1`,
      [`%${name}%`]
    );
    return result.rows;
  },

  async findByType(typeId) {
    const result = await pool.query(
      `SELECT * FROM products WHERE product_type_id = $1`,
      [typeId]
    );
    return result.rows;
  },

  async findByBrand(brandId) {
    const result = await pool.query(
      `SELECT * FROM products WHERE brand_id = $1`,
      [brandId]
    );
    return result.rows;
  },

  async findByCategory(categoryId) {
    const result = await pool.query(
      `SELECT * FROM products WHERE category_id = $1`,
      [categoryId]
    );
    return result.rows;
  },

  async findByColor(colorId) {
    const result = await pool.query(
      `SELECT * FROM products WHERE color_id = $1`,
      [colorId]
    );
    return result.rows;
  },

  async findBySize(sizeId) {
    const result = await pool.query(
      `SELECT * FROM products WHERE size_id = $1`,
      [sizeId]
    );
    return result.rows;
  },

  async sort(column = "name", order = "ASC") {
    const allowedColumns = ["price", "name", "stock", "created_at"];
    const allowedOrder = ["ASC", "DESC"];

    const sortColumn = allowedColumns.includes(column) ? column : "name";
    const sortOrder = allowedOrder.includes(order.toUpperCase())
      ? order.toUpperCase()
      : "ASC";

    const result = await pool.query(
      `SELECT * FROM products ORDER BY ${sortColumn} ${sortOrder}`
    );
    return result.rows;
  },

  async lowStock(threshold = 5) {
    const result = await pool.query(
      `
      SELECT id, product_code, name, stock, price
      FROM products
      WHERE stock <= $1
      ORDER BY stock ASC
      `,
      [threshold]
    );
    return result.rows;
  },
};

module.exports = Product;
