const pool = require("../../database/db");

async function paginate(
  baseQuery,
  params = [],
  { sort, allowedSorts = {}, page = 1, perPage = 5 }
) {
  page = Math.max(Number(page) || 1, 1);
  perPage = Math.max(Number(perPage) || 1, 1);

  // Count total rows
  const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS t`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  const totalPages = Math.max(Math.ceil(total / perPage), 1);
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * perPage;

  // Sorting
  const orderBy = allowedSorts[sort] || "";

  // Adjust parameter indices for LIMIT and OFFSET
  const limitIndex = params.length + 1;
  const offsetIndex = params.length + 2;

  const query = `
    ${baseQuery}
    ${orderBy ? `ORDER BY ${orderBy}` : ""}
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
  `;

  const queryParams = [...params, perPage, offset];

  const result = await pool.query(query, queryParams);

  return {
    rows: result.rows,
    total,
    currentPage,
    perPage,
    totalPages,
  };
}

module.exports = paginate;
