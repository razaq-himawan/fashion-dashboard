const pool = require("../database/db");
const paginate = require("../lib/helpers/paginate");

const Brand = {
  async findAll({ q, sort, page, perPage } = {}) {
    let baseQuery = `SELECT * FROM brands`;

    const params = [];

    if (q) {
      baseQuery += ` WHERE name LIKE ?`;
      params.push(`%${q}%`, `%${q}%`);
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
    const [rows] = await pool.query(
      `SELECT * FROM brands WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  },
};

module.exports = Brand;
