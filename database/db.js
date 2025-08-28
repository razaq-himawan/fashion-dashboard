const mysql = require("mysql2/promise");
const Envs = require("../config/env");

const pool = mysql.createPool({
  host: Envs.DB_HOST,
  user: Envs.DB_USER,
  password: Envs.DB_PASSWORD,
  database: Envs.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

module.exports = pool;
