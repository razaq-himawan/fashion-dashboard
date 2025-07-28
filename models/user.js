const pool = require("../database/db");
const bcrypt = require("bcrypt");

const User = {
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
      cb(null, { id: user.id, username: user.username });
    });
  },

  deserializeUser(user, cb) {
    process.nextTick(function () {
      return cb(null, user);
    });
  },
};

module.exports = User;
