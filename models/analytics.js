const pool = require("../database/db");

const Analytics = {
  // ---- PRODUCT ANALYTICS ----
  async productTypeAnalytics() {
    const [rows] = await pool.query(`SELECT * FROM view_product_stock_summary`);
    return rows;
  },

  async topSellingProducts(limit = 10) {
    const [rows] = await pool.query(
      `SELECT * FROM view_top_selling_products LIMIT ?`,
      [limit]
    );
    return rows;
  },

  async revenueByType() {
    const [rows] = await pool.query(`SELECT * FROM view_revenue_by_type`);
    return rows;
  },

  async stockUsage() {
    const [rows] = await pool.query(`SELECT * FROM view_stock_usage`);
    return rows;
  },

  // ---- SALES ANALYTICS ----
  async salesPerMonth() {
    const [rows] = await pool.query(`SELECT * FROM view_sales_per_month`);
    return rows;
  },

  async dailySalesCurrentMonth() {
    const [rows] = await pool.query(
      `SELECT * FROM view_sales_daily_current_month`
    );
    return rows;
  },

  async monthlyGrowth() {
    const [rows] = await pool.query(`SELECT * FROM view_monthly_growth`);
    return rows;
  },

  async revenueByCategory() {
    const [rows] = await pool.query(`SELECT * FROM view_revenue_by_category`);
    return rows;
  },

  async revenueByBrand() {
    const [rows] = await pool.query(`SELECT * FROM view_revenue_by_brand`);
    return rows;
  },

  // ---- USER ANALYTICS ----
  async userStats() {
    const [rows] = await pool.query(`SELECT * FROM view_user_stats`);
    return rows;
  },

  async userStatsById(userId) {
    const [rows] = await pool.query(
      `SELECT * FROM view_user_stats WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0];
  },

  async topCustomers(limit = 5) {
    const [rows] = await pool.query(
      `SELECT * FROM view_top_customers LIMIT ?`,
      [limit]
    );
    return rows;
  },

  async inactiveUsers() {
    const [rows] = await pool.query(`SELECT * FROM view_inactive_users`);
    return rows;
  },
};

module.exports = Analytics;
