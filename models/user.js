const pool = require("../database/db");
const bcrypt = require("bcrypt");
const paginate = require("../lib/helpers/paginate");

const User = {
  async findAll({ q, sort, page, perPage } = {}) {
    let baseQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.created_at,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
    `;

    const params = [];

    if (q) {
      baseQuery += ` WHERE u.username LIKE ? OR u.email LIKE ?`;
      params.push(`%${q}%`, `%${q}%`);
    }

    baseQuery += ` GROUP BY u.id`;

    const allowedSorts = {
      username_asc: "u.username ASC",
      username_desc: "u.username DESC",
      newest: "u.created_at DESC",
      oldest: "u.created_at ASC",
      total_spent_desc: "total_spent DESC",
      total_spent_asc: "total_spent ASC",
    };

    return paginate(baseQuery, params, { sort, allowedSorts, page, perPage });
  },

  async findByUsername(username) {
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE username = ? LIMIT 1`,
      [username]
    );
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  },

  async validatePassword(password, user) {
    return await bcrypt.compare(password, user.password_hash);
  },

  async verify(username, password, cb) {
    try {
      const user = await User.findByUsername(username);
      if (!user) {
        return cb(null, false, { message: "Incorrect username or password." });
      }
      const isValid = await User.validatePassword(password, user);
      if (!isValid) {
        return cb(null, false, { message: "Incorrect username or password." });
      }
      return cb(null, user);
    } catch (err) {
      return cb(err);
    }
  },

  serializeUser(user, cb) {
    process.nextTick(function () {
      cb(null, { id: user.id, username: user.username, role: user.role });
    });
  },

  deserializeUser(user, cb) {
    process.nextTick(function () {
      return cb(null, user);
    });
  },
};

module.exports = User;
