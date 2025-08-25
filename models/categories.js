const pool = require("../database/db");

const Categories = {
  async findAll({ q, sort } = {}) {
    let baseQuery = `SELECT * FROM categories`;

    const params = [];

    if (q) {
      baseQuery += ` WHERE name LIKE ?`;
      params.push(`%${q}%`, `%${q}%`);
    }

    const allowedSorts = {
      name_asc: "name ASC",
      name_desc: "name DESC",
      newest: "created_at DESC",
    };

    baseQuery += ` ORDER BY ${allowedSorts[sort] || "created_at DESC"}`;

    const [rows] = await pool.query(baseQuery, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM categories WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  },
};

module.exports = Categories;
