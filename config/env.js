require("dotenv").config();

const Envs = {
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgres://postgres@localhost:5432/toko_fashion",
  SESSION_SECRET: process.env.SESSION_SECRET || "is-it-a-secret?",
  PORT: process.env.PORT || "3000",
};

module.exports = Envs;
