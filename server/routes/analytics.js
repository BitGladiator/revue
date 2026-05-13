const express = require('express');
const authenticate = require('../middleware/authenticate');
const db = require('../db');

const router = express.Router();


router.get('/overview', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(DISTINCT r.id)                                    as total_repos,
         COUNT(pr.id)                                           as total_prs,
         COUNT(rev.id)                                          as total_reviews,
         ROUND(AVG(rev.quality_score))                          as avg_score,
         COUNT(CASE WHEN rev.quality_score >= 80 THEN 1 END)   as high_quality_prs,
         COUNT(CASE WHEN rev.quality_score < 60 THEN 1 END)    as needs_work_prs
       FROM repos r
       LEFT JOIN pull_requests pr  ON pr.repo_id  = r.id
       LEFT JOIN reviews       rev ON rev.pr_id   = pr.id
       WHERE r.user_id = $1`,
      [req.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Score trend — last 30 days
router.get('/score-trend', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         DATE(pr.created_at)       as date,
         ROUND(AVG(rev.quality_score)) as avg_score,
         COUNT(rev.id)             as review_count
       FROM reviews rev
       JOIN pull_requests pr ON pr.id = rev.pr_id
       JOIN repos r           ON r.id  = pr.repo_id
       WHERE r.user_id = $1
         AND pr.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(pr.created_at)
       ORDER BY date ASC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/common-issues', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         rev.quality_issues,
         rev.security_issues,
         rev.test_coverage_issues
       FROM reviews rev
       JOIN pull_requests pr ON pr.id = rev.pr_id
       JOIN repos r           ON r.id  = pr.repo_id
       WHERE r.user_id = $1
       ORDER BY rev.created_at DESC
       LIMIT 20`,
      [req.userId]
    );

    
    const issueCounts = {};

    rows.forEach((review) => {
      ['quality_issues', 'security_issues', 'test_coverage_issues'].forEach((key) => {
        const issues = typeof review[key] === 'string'
          ? JSON.parse(review[key])
          : review[key] || [];

        issues.forEach((issue) => {
          const msg = issue.message;
          if (!msg) return;
          issueCounts[msg] = (issueCounts[msg] || 0) + 1;
        });
      });
    });

    const sorted = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/repos', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         r.id,
         r.full_name,
         COUNT(pr.id)                  as total_prs,
         COUNT(rev.id)                 as reviewed,
         ROUND(AVG(rev.quality_score)) as avg_score,
         MAX(rev.quality_score)        as best_score,
         MIN(rev.quality_score)        as worst_score
       FROM repos r
       LEFT JOIN pull_requests pr  ON pr.repo_id = r.id
       LEFT JOIN reviews       rev ON rev.pr_id  = pr.id
       WHERE r.user_id = $1
       GROUP BY r.id
       ORDER BY avg_score DESC NULLS LAST`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;