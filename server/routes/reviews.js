const express = require('express');
const authenticate = require('../middleware/authenticate');
const db = require('../db');

const router = express.Router();

router.get('/repo/:repoId', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         pr.*,
         r.overall_summary,
         r.quality_score,
         r.pipeline_meta
       FROM pull_requests pr
       LEFT JOIN reviews r ON r.pr_id = pr.id
       WHERE pr.repo_id = $1
       ORDER BY pr.created_at DESC
       LIMIT 20`,
      [req.params.repoId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/pr/:prId', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         r.*,
         pr.title, pr.author, pr.pr_number,
         pr.base_branch, pr.head_branch, pr.status
       FROM reviews r
       JOIN pull_requests pr ON pr.id = r.pr_id
       WHERE r.pr_id = $1`,
      [req.params.prId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pr/:prId/retry', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT pr.*, r.owner, r.name as repo_name, r.installation_id
       FROM pull_requests pr
       JOIN repos r ON r.id = pr.repo_id
       WHERE pr.id = $1 AND r.user_id = $2`,
      [req.params.prId, req.userId]
    );

    const pr = rows[0];
    if (!pr) return res.status(404).json({ error: 'PR not found or access denied' });
    
    let installationId = pr.installation_id;

    if (!installationId) {
      const { getInstallationIdForRepo } = require('../services/githubAppService');
      installationId = await getInstallationIdForRepo(pr.owner, pr.repo_name);
      
      if (installationId) {
        await db.query(
          'UPDATE repos SET installation_id = $1 WHERE id = $2',
          [String(installationId), pr.repo_id]
        );
      } else {
        return res.status(400).json({ error: 'GitHub App not installed on this repository. Cannot perform review.' });
      }
    }

    await db.query(
      "UPDATE pull_requests SET status = 'pending', updated_at = NOW() WHERE id = $1",
      [pr.id]
    );

    const { reviewQueue } = require('../queues/index');
    await reviewQueue.add(
      'review-pr',
      {
        prId: pr.id,
        owner: pr.owner,
        repo: pr.repo_name,
        prNumber: pr.pr_number,
        prTitle: pr.title,
        prAuthor: pr.author,
        installationId: String(installationId),
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 20 },
      }
    );

    res.json({ success: true, status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;