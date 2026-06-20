const { pool } = require("../config/database");

const migrate = async () => {
  const connection = await pool.getConnection();
  try {
    console.log("Starting database hardening...");

    // 1. Unique Constraints
    console.log("Applying unique constraints...");
    await connection.execute("ALTER TABLE pr_so MODIFY prno VARCHAR(100) UNIQUE");
    await connection.execute("ALTER TABLE obligation MODIFY obrno VARCHAR(100) UNIQUE");
    await connection.execute("ALTER TABLE plan_info MODIFY plan_id VARCHAR(100) PRIMARY KEY");

    // 2. Index Optimization
    console.log("Applying indexes...");
    const indexes = [
      "CREATE INDEX idx_activities_plan_id ON activities(plan_id)",
      "CREATE INDEX idx_activities_plan_year ON activities(plan_year)",
      "CREATE INDEX idx_activities_pap_type ON activities(pap_type)",
      "CREATE INDEX idx_activities_allotment ON activities(allotment_class)",
      "CREATE INDEX idx_ps_pap_type ON ps(pap_type)",
      "CREATE INDEX idx_pr_so_activities_id ON pr_so(activities_id)",
      "CREATE INDEX idx_obligation_prno ON obligation(prno)",
      "CREATE INDEX idx_obligation_activities_id ON obligation(activities_id)"
    ];

    for (const sql of indexes) {
      try {
        await connection.execute(sql);
      } catch (e) {
        console.log(`Index already exists or failed: ${sql.split(' ').pop()}`);
      }
    }

    // 3. Database Views
    console.log("Creating optimized views...");

    await connection.execute(`
      CREATE OR REPLACE VIEW vw_pr_balances AS
      SELECT
        p.id,
        p.prno,
        p.transaction_date,
        p.amount,
        a.name,
        a.expense_items,
        a.expense_items_sub,
        a.pap_type,
        a.pap_des,
        a.division,
        a.ref_main_name,
        COALESCE(SUM(o.amount), 0) as amount_obligated,
        (p.amount - COALESCE(SUM(o.amount), 0)) as amount_unobligated
      FROM pr_so p
      LEFT JOIN activities a ON p.activities_id = a.id
      LEFT JOIN obligation o ON p.prno = o.prno
      GROUP BY p.id, p.prno, p.transaction_date, p.amount, a.name, a.expense_items, a.expense_items_sub, a.pap_type, a.pap_des, a.division, a.ref_main_name
    `);

    console.log("Database hardening complete.");
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    connection.release();
    process.exit();
  }
};

migrate();
