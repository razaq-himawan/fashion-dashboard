require("dotenv").config();

const Envs = {
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "toko_fashion",
  SESSION_SECRET: process.env.SESSION_SECRET || "is-it-a-secret?",
  PORT: process.env.PORT || "3000",
};

module.exports = Envs;
