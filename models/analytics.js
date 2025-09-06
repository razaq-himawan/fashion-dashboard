const pool = require("../database/db");

const Analytics = {
  // ---- PRODUCT ANALYTICS ----
  async productTypeAnalytics() {
    const result = await pool.query(`SELECT * FROM view_product_stock_summary`);
    return result.rows;
  },

  async topSellingProducts(limit = 10) {
    const result = await pool.query(
      `SELECT * FROM view_top_selling_products LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  async revenueByType() {
    const result = await pool.query(`SELECT * FROM view_revenue_by_type`);
    return result.rows;
  },

  async stockUsage() {
    const result = await pool.query(`SELECT * FROM view_stock_usage`);
    return result.rows;
  },

  // ---- SALES ANALYTICS ----
  async salesPerMonth() {
    const result = await pool.query(`SELECT * FROM view_sales_per_month`);
    return result.rows;
  },

  async dailySalesCurrentMonth() {
    const result = await pool.query(
      `SELECT * FROM view_sales_daily_current_month`
    );
    return result.rows;
  },

  async monthlyGrowth() {
    const result = await pool.query(`SELECT * FROM view_monthly_growth`);
    return result.rows;
  },

  async revenueByCategory() {
    const result = await pool.query(`SELECT * FROM view_revenue_by_category`);
    return result.rows;
  },

  async revenueByBrand() {
    const result = await pool.query(`SELECT * FROM view_revenue_by_brand`);
    return result.rows;
  },

  // ---- USER ANALYTICS ----
  async userStats() {
    const result = await pool.query(`SELECT * FROM view_user_stats`);
    return result.rows;
  },

  async userStatsById(userId) {
    const result = await pool.query(
      `SELECT * FROM view_user_stats WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    return result.rows[0];
  },

  async topCustomers(limit = 5) {
    const result = await pool.query(
      `SELECT * FROM view_top_customers LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  async inactiveUsers() {
    const result = await pool.query(`SELECT * FROM view_inactive_users`);
    return result.rows;
  },
};

module.exports = Analytics;
