const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require("../config/database");

const views = [
    `CREATE OR REPLACE VIEW vw_pap_financial_summary AS
    SELECT
        base.fiscal_year,
        base.pap_type,
        MAX(base.pap_type_code) AS pap_type_code,
        base.pap_des_code,

        /* Standardized Label with Fallback */
        COALESCE(
            MAX(CASE
                WHEN base.pap_des_code = '100000100001000' THEN 'General Management and Supervision'
                WHEN base.pap_des_code = '100000100002000' THEN 'Human Resource Development'
                WHEN base.pap_des_code = '310100100001000' THEN 'Nutrition Policy, Standards, Plan and Program Development'
                WHEN base.pap_des_code = '310100100002000' THEN 'Philippine Food and Nutrition Surveillance'
                WHEN base.pap_des_code = '310100100003000' THEN 'Promotion of Good Nutrition'
                WHEN base.pap_des_code = '310100100004000' THEN 'Assistance to National, Local Nutrition and Related Programs'
            END),
            MAX(base.pap_des),
            'Unnamed PAP'
        ) AS pap_description,

        /* ALLOCATION SUMS */
        SUM(CASE WHEN base.source = 'PS'   THEN base.amount ELSE 0 END) AS ps,
        SUM(CASE WHEN base.source = 'RLIP' THEN base.amount ELSE 0 END) AS rlip,
        SUM(CASE WHEN base.source = 'MOOE' THEN base.amount ELSE 0 END) AS mooe,
        SUM(base.amount) AS total_allocation,

        /* OBLIGATED SUMS */
        COALESCE((
            SELECT SUM(o.amount)
            FROM obligation o
            LEFT JOIN mooe m ON o.mooe_id = m.id
            LEFT JOIN ps p   ON o.ps_id = p.id
            WHERE o.is_deleted = 0
              AND (
                  (m.pap_des_code = base.pap_des_code AND YEAR(m.created_at) = base.fiscal_year)
                  OR
                  (p.pap_des_code = base.pap_des_code AND YEAR(p.created_at) = base.fiscal_year)
              )
        ), 0) AS obligated,

        /* UNOBLIGATED */
        (SUM(base.amount) - COALESCE((
            SELECT SUM(o.amount)
            FROM obligation o
            LEFT JOIN mooe m ON o.mooe_id = m.id
            LEFT JOIN ps p   ON o.ps_id = p.id
            WHERE o.is_deleted = 0
              AND (
                  (m.pap_des_code = base.pap_des_code AND YEAR(m.created_at) = base.fiscal_year)
                  OR
                  (p.pap_des_code = base.pap_des_code AND YEAR(p.created_at) = base.fiscal_year)
              )
        ), 0)) AS unobligated

    FROM (
        SELECT YEAR(created_at) as fiscal_year, pap_type, pap_type_code, pap_des, pap_des_code, amount, 'PS' as source FROM ps WHERE is_deleted = 0
        UNION ALL
        SELECT YEAR(r.created_at) as fiscal_year, p.pap_type, p.pap_type_code, r.pap_des, r.pap_des_code, r.amount, 'RLIP' as source FROM rlip r JOIN ps p ON r.ps_id = p.id WHERE r.is_deleted = 0
        UNION ALL
        SELECT YEAR(created_at) as fiscal_year, pap_type, pap_type_code, pap_des, pap_des_code, totalFq as amount, 'MOOE' as source FROM mooe WHERE is_deleted = 0 AND is_subtotal = 0
    ) base
    GROUP BY base.fiscal_year, base.pap_des_code, base.pap_type;`,

    `CREATE OR REPLACE VIEW vw_program_financial_summary AS
    SELECT
        fiscal_year,
        pap_type_code,
        MAX(pap_type) AS pap_type,
        SUM(ps)                AS total_ps,
        SUM(rlip)              AS total_rlip,
        SUM(mooe)              AS total_mooe,
        SUM(total_allocation)  AS grand_total_allocation,
        SUM(obligated)         AS total_obligated,
        SUM(unobligated)       AS total_unobligated,
        CASE
            WHEN SUM(total_allocation) > 0 THEN (SUM(obligated) / SUM(total_allocation)) * 100
            ELSE 0
        END AS program_utilization_rate
    FROM vw_pap_financial_summary
    GROUP BY fiscal_year, pap_type_code;`,

    `CREATE OR REPLACE VIEW vw_pr_items_full AS
    SELECT
        i.id AS item_id, i.description, i.quantity, i.unit, i.unit_cost, i.total AS item_total,
        pr.prno, pr.purpose, m.office, m.pap_des, m.ref_main_name AS activity
    FROM pr_items i
    JOIN pr_so pr ON i.pr_id = pr.id
    LEFT JOIN mooe m ON pr.mooe_id = m.id WHERE pr.is_deleted = 0;`,

    `CREATE OR REPLACE VIEW vw_pr_details AS
    SELECT
        pr.id, pr.prno, pr.purpose, pr.workflow_status, pr.remarks, pr.amount AS pr_amount, pr.created_at, YEAR(pr.created_at) AS fiscal_year,
        m.office, m.pap_type, m.pap_des, m.ref_main_name AS activity, m.performance_indicator, m.expense_items, m.expense_items_sub,
        COALESCE(SUM(CASE WHEN ob.is_deleted = 0 THEN ob.amount ELSE 0 END), 0) AS obligated_amount,
        (pr.amount - COALESCE(SUM(CASE WHEN ob.is_deleted = 0 THEN ob.amount ELSE 0 END), 0)) AS remaining_balance,
        (CASE
            WHEN (COALESCE(SUM(CASE WHEN ob.is_deleted = 0 THEN ob.amount ELSE 0 END), 0) = 0) THEN 'NOT_OBLIGATED'
            WHEN ((pr.amount - COALESCE(SUM(CASE WHEN ob.is_deleted = 0 THEN ob.amount ELSE 0 END), 0)) > 0) THEN 'PARTIALLY_OBLIGATED'
            ELSE 'FULLY_OBLIGATED'
        END) AS budget_status
    FROM pr_so pr LEFT JOIN mooe m ON pr.mooe_id = m.id LEFT JOIN obligation ob ON pr.id = ob.pr_id WHERE pr.is_deleted = 0
    GROUP BY pr.id, pr.prno, pr.purpose, pr.workflow_status, pr.remarks, pr.amount, pr.created_at, m.id;`,

    `CREATE OR REPLACE VIEW vw_obligation_details AS
    SELECT
        o.id, o.obrno, o.prno, o.payee, o.particular, o.amount, o.created_at, YEAR(o.created_at) AS fiscal_year,
        CASE WHEN o.mooe_id IS NOT NULL THEN 'MOOE' WHEN o.ps_id IS NOT NULL THEN 'PS' ELSE 'OTHER' END AS allotment_class,
        COALESCE(m.office, 'N/A') AS office, COALESCE(m.pap_type, p.pap_type) AS pap_type,
        COALESCE(m.pap_des, p.pap_des) AS pap_des, COALESCE(m.expense_items, p.expense_items) AS expense_item
    FROM obligation o LEFT JOIN mooe m ON o.mooe_id = m.id LEFT JOIN ps p ON o.ps_id = p.id WHERE o.is_deleted = 0;`,

    `CREATE OR REPLACE VIEW vw_mooe_excel_full_report AS
    SELECT
        m.plan_id,
        YEAR(m.created_at)     AS plan_year,
        m.pap_type_code,
        m.pap_type,
        m.pap_des_code,
        m.pap_des,
        m.ref_main_name        AS activity,
        m.ref_middle_name      AS performance_indicator,
        m.expense_items        AS object_group,
        m.expense_items_sub    AS sub_object,
        COALESCE(NULLIF(m.sub_total_name, ''), '-') AS row_label,
        m.report_order,
        m.count_type,
        CASE
            WHEN m.is_subtotal = 1 THEN 'SUBTOTAL'
            ELSE 'DETAIL'
        END AS row_type,
        CASE
            WHEN m.is_subtotal = 0 THEN COALESCE(m.totalFq, 0)
            WHEN m.sub_total_name IN ('Difference', 'Difference MOOE', 'Difference CO') THEN 0.00
            WHEN m.sub_total_name IN ('Sub-total, GMS, MOOE', 'Ceiling, GSM') THEN (
                SELECT COALESCE(SUM(x.totalFq), 0) FROM mooe x
                WHERE x.is_deleted = 0 AND x.is_subtotal = 0 AND x.plan_id = m.plan_id
                  AND x.pap_des_code = '100000100001000'
            )
            WHEN m.sub_total_name IN ('Sub-total, HRD, MOOE', 'Ceiling, HRD') THEN (
                SELECT COALESCE(SUM(x.totalFq), 0) FROM mooe x
                WHERE x.is_deleted = 0 AND x.is_subtotal = 0 AND x.plan_id = m.plan_id
                  AND x.pap_des_code = '100000100002000'
            )
            WHEN m.sub_total_name = 'TOTAL GSM, MOOE' THEN (
                SELECT COALESCE(SUM(x.totalFq), 0) FROM mooe x
                WHERE x.is_deleted = 0 AND x.is_subtotal = 0 AND x.plan_id = m.plan_id
                  AND x.pap_type_code = '100000000000000'
            )
            WHEN m.sub_total_name = 'Sub-total, General Management and Supervision (PS)' THEN (
                SELECT COALESCE(SUM(p.amount), 0) FROM ps p
                WHERE p.is_deleted = 0 AND p.plan_id = m.plan_id AND p.pap_des_code = '100000100001000'
            )
            WHEN m.sub_total_name = 'Sub-total, Administration of Personnel Benefits (PS)' THEN (
                SELECT COALESCE(SUM(p.amount), 0) FROM ps p
                WHERE p.is_deleted = 0 AND p.plan_id = m.plan_id AND p.pap_des_code = '100000100002000'
            )
            WHEN m.sub_total_name = 'TOTAL, MOOE' AND m.pap_type_code = '310100000000000' THEN (
                SELECT COALESCE(SUM(x.totalFq), 0) FROM mooe x
                WHERE x.is_deleted = 0 AND x.is_subtotal = 0 AND x.plan_id = m.plan_id AND x.pap_des_code = m.pap_des_code
            )
            WHEN m.sub_total_name = 'GRAND TOTAL, PS' THEN (
                SELECT COALESCE(SUM(p.amount), 0) FROM ps p WHERE p.is_deleted = 0 AND p.plan_id = m.plan_id
            )
            WHEN m.sub_total_name = 'GRAND TOTAL, RLIP' THEN (
                SELECT COALESCE(SUM(r.amount), 0) FROM rlip r JOIN ps p ON r.ps_id = p.id
                WHERE r.is_deleted = 0 AND p.plan_id = m.plan_id
            )
            WHEN m.sub_total_name = 'GRAND TOTAL, MOOE' THEN (
                SELECT COALESCE(SUM(x.totalFq), 0) FROM mooe x
                WHERE x.is_deleted = 0 AND x.is_subtotal = 0 AND x.plan_id = m.plan_id
            )
            ELSE 0.00
        END AS total_amount
    FROM mooe m
    WHERE m.is_deleted = 0;`
];

async function migrate() {
    try {
        console.log("Starting view migration...");
        for (const view of views) {
            await pool.execute(view);
            console.log("View created/updated successfully.");
        }
        console.log("All views migrated successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
