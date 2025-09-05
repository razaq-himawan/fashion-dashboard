const pool = require("../../database/db");

async function paginate(
  baseQuery,
  params = [],
  { sort, allowedSorts = {}, page = 1, perPage = 5 }
) {
  page = Math.max(Number(page) || 1, 1);
  perPage = Math.max(Number(perPage) || 1, 1);

  const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS t`;
  const [countRows] = await pool.query(countQuery, params);
  const total = countRows[0].total;

  const totalPages = Math.max(Math.ceil(total / perPage), 1);

  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * perPage;

  const orderBy = allowedSorts[sort] || "";

  const query = `
    ${baseQuery}
    ${orderBy ? `ORDER BY ${orderBy}` : ""}
    LIMIT ? OFFSET ?
  `;
  const queryParams = [...params, perPage, offset];

  const [rows] = await pool.query(query, queryParams);

  return {
    rows,
    total,
    currentPage,
    perPage,
    totalPages,
  };
}

module.exports = paginate;
