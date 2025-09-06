const pool = require("../database/db");
const paginate = require("../lib/helpers/paginate");

const Category = {
  async findAll({ q, sort, page, perPage } = {}) {
    let baseQuery = `SELECT * FROM categories`;
    const params = [];
    let paramIndex = 1;

    if (q) {
      baseQuery += ` WHERE name ILIKE $${paramIndex}`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    const allowedSorts = {
      id_asc: "id ASC",
      id_desc: "id DESC",
      name_asc: "name ASC",
      name_desc: "name DESC",
      newest: "created_at DESC",
    };

    return paginate(baseQuery, params, { sort, allowedSorts, page, perPage });
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT * FROM categories WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0];
  },
};

module.exports = Category;
