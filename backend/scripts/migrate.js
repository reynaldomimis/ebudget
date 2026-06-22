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
        p.created_at as transaction_date,
        p.amount,
        m.name,
        m.expense_items,
        m.expense_items_sub,
        m.pap_type,
        m.pap_des,
        m.office as division,
        m.ref_main_name,
        COALESCE(SUM(o.amount), 0) as amount_obligated,
        (p.amount - COALESCE(SUM(o.amount), 0)) as amount_unobligated
      FROM pr_so p
      LEFT JOIN mooe m ON p.mooe_id = m.id
      LEFT JOIN obligation o ON p.prno = o.prno AND o.is_deleted = 0
      WHERE p.is_deleted = 0
      GROUP BY p.id, p.prno, p.created_at, p.amount, m.name, m.expense_items, m.expense_items_sub, m.pap_type, m.pap_des, m.office, m.ref_main_name
    `);

    // 4. Financial Summary Views
    console.log("Creating financial summary views...");

    await connection.execute(`
      CREATE OR REPLACE VIEW vw_pap_financial_summary AS
      SELECT
          base.fiscal_year AS fiscal_year,
          base.pap_type AS pap_type,
          MAX(base.pap_type_code) AS pap_type_code,
          base.pap_des_code AS pap_des_code,
          MAX((CASE
              WHEN (base.pap_des_code = '100000100001000') THEN 'General Management and Supervision'
              WHEN (base.pap_des_code = '100000100002000') THEN 'Human Resource Development'
              WHEN (base.pap_des_code = '310100100001000') THEN 'Nutrition Policy, Standards, Plan and Program Development'
              WHEN (base.pap_des_code = '310100100002000') THEN 'Philippine Food and Nutrition Surveillance'
              WHEN (base.pap_des_code = '310100100003000') THEN 'Promotion of Good Nutrition'
              WHEN (base.pap_des_code = '310100100004000') THEN 'Assistance to National, Local Nutrition and Related Programs'
              ELSE base.pap_des
          END)) AS pap_description,
          SUM((CASE
              WHEN (base.source = 'PS') THEN base.amount
              ELSE 0
          END)) AS ps,
          SUM((CASE
              WHEN (base.source = 'RLIP') THEN base.amount
              ELSE 0
          END)) AS rlip,
          SUM((CASE
              WHEN (base.source = 'MOOE') THEN base.amount
              ELSE 0
          END)) AS mooe,
          SUM(base.amount) AS total_allocation,
          COALESCE((SELECT
                          SUM(o.amount)
                      FROM
                          ((obligation o
                          LEFT JOIN mooe m ON ((o.mooe_id = m.id)))
                          LEFT JOIN ps p ON ((o.ps_id = p.id)))
                      WHERE
                          ((o.is_deleted = 0)
                              AND (((m.pap_des_code = base.pap_des_code)
                              AND (YEAR(m.created_at) = base.fiscal_year))
                              OR ((p.pap_des_code = base.pap_des_code)
                              AND (YEAR(p.created_at) = base.fiscal_year))))),
                  0) AS obligated,
          (SUM(base.amount) - COALESCE((SELECT
                          SUM(o.amount)
                      FROM
                          ((obligation o
                          LEFT JOIN mooe m ON ((o.mooe_id = m.id)))
                          LEFT JOIN ps p ON ((o.ps_id = p.id)))
                      WHERE
                          ((o.is_deleted = 0)
                              AND (((m.pap_des_code = base.pap_des_code)
                              AND (YEAR(m.created_at) = base.fiscal_year))
                              OR ((p.pap_des_code = base.pap_des_code)
                              AND (YEAR(p.created_at) = base.fiscal_year))))),
                  0)) AS unobligated
      FROM
          (SELECT
              YEAR(ps.created_at) AS fiscal_year,
                  ps.pap_type AS pap_type,
                  ps.pap_type_code AS pap_type_code,
                  ps.pap_des AS pap_des,
                  ps.pap_des_code AS pap_des_code,
                  ps.amount AS amount,
                  'PS' AS source
          FROM ps
          WHERE (ps.is_deleted = 0)
          UNION ALL
          SELECT
              YEAR(r.created_at) AS fiscal_year,
                  p.pap_type AS pap_type,
                  p.pap_type_code AS pap_type_code,
                  r.pap_des AS pap_des,
                  r.pap_des_code AS pap_des_code,
                  r.amount AS amount,
                  'RLIP' AS source
          FROM (rlip r JOIN ps p ON ((r.ps_id = p.id)))
          WHERE (r.is_deleted = 0)
          UNION ALL
          SELECT
              YEAR(mooe.created_at) AS fiscal_year,
                  mooe.pap_type AS pap_type,
                  mooe.pap_type_code AS pap_type_code,
                  mooe.pap_des AS pap_des,
                  mooe.pap_des_code AS pap_des_code,
                  mooe.totalFq AS amount,
                  'MOOE' AS source
          FROM mooe
          WHERE ((mooe.is_deleted = 0) AND (mooe.is_subtotal = 0))) base
      GROUP BY base.fiscal_year , base.pap_des_code , base.pap_type
    `);

    await connection.execute(`
      CREATE OR REPLACE VIEW vw_program_financial_summary AS
      SELECT
          vw_pap_financial_summary.fiscal_year AS fiscal_year,
          vw_pap_financial_summary.pap_type AS pap_type,
          MAX(vw_pap_financial_summary.pap_type_code) AS pap_type_code,
          SUM(vw_pap_financial_summary.ps) AS total_ps,
          SUM(vw_pap_financial_summary.rlip) AS total_rlip,
          SUM(vw_pap_financial_summary.mooe) AS total_mooe,
          SUM(vw_pap_financial_summary.total_allocation) AS grand_total_allocation,
          SUM(vw_pap_financial_summary.obligated) AS total_obligated,
          SUM(vw_pap_financial_summary.unobligated) AS total_unobligated,
          (CASE
              WHEN (SUM(vw_pap_financial_summary.total_allocation) > 0) THEN ((SUM(vw_pap_financial_summary.obligated) / SUM(vw_pap_financial_summary.total_allocation)) * 100)
              ELSE 0
          END) AS program_utilization_rate
      FROM
          vw_pap_financial_summary
      GROUP BY vw_pap_financial_summary.fiscal_year , vw_pap_financial_summary.pap_type
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
