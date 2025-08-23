const pool = require("../database/db");

const Product = {
  async findAll() {
    const [rows] = await pool.query(
      `SELECT p.*, 
              pt.nama AS product_type,
              b.nama AS brand,
              c.nama AS category,
              co.nama AS color,
              s.nama AS size
       FROM products p
       LEFT JOIN product_types pt ON p.product_type_id = pt.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN colors co ON p.color_id = co.id
       LEFT JOIN sizes s ON p.size_id = s.id
       ORDER BY p.created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, 
              pt.nama AS product_type,
              b.nama AS brand,
              c.nama AS category,
              co.nama AS color,
              s.nama AS size
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

  async findByName(nama) {
    const [rows] = await pool.query(
      `SELECT * FROM products WHERE nama LIKE ?`,
      [`%${nama}%`]
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

  async sort(column = "nama", order = "ASC") {
    const allowedColumns = ["harga", "nama", "stock", "created_at"];
    const allowedOrder = ["ASC", "DESC"];

    const sortColumn = allowedColumns.includes(column) ? column : "nama";
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
      SELECT pt.nama, COUNT(p.id) AS total
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      GROUP BY pt.nama
      ORDER BY total DESC
    `);
    return rows;
  },

  async countByTypeWithStock() {
    const [rows] = await pool.query(`
    SELECT 
      pt.nama, 
      COUNT(p.id) AS total_products,
      SUM(p.stock) AS total_stock
    FROM products p
    LEFT JOIN product_types pt ON p.product_type_id = pt.id
    GROUP BY pt.nama
    ORDER BY total_stock DESC
  `);
    return rows;
  },
};

module.exports = Product;
