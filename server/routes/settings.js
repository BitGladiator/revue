const express = require('express');
const authenticate = require('../middleware/authenticate');
const db = require('../db');

const router = express.Router();


router.get('/:repoId', authenticate, async (req, res) => {
  try {
    
    const { rows: repoRows } = await db.query(
      'SELECT id FROM repos WHERE id = $1 AND user_id = $2',
      [req.params.repoId, req.userId]
    );
    if (!repoRows[0]) return res.status(404).json({ error: 'Repo not found' });

    
    const { rows } = await db.query(
      `INSERT INTO repo_settings (repo_id)
       VALUES ($1)
       ON CONFLICT (repo_id) DO NOTHING`,
      [req.params.repoId]
    );

    const { rows: settings } = await db.query(
      'SELECT * FROM repo_settings WHERE repo_id = $1',
      [req.params.repoId]
    );

    res.json(settings[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/:repoId', authenticate, async (req, res) => {
  const {
    enable_quality_agent,
    enable_security_agent,
    enable_tests_agent,
    min_severity,
    auto_review,
  } = req.body;

  try {
    const { rows: repoRows } = await db.query(
      'SELECT id FROM repos WHERE id = $1 AND user_id = $2',
      [req.params.repoId, req.userId]
    );
    if (!repoRows[0]) return res.status(404).json({ error: 'Repo not found' });

    const { rows } = await db.query(
      `INSERT INTO repo_settings
         (repo_id, enable_quality_agent, enable_security_agent,
          enable_tests_agent, min_severity, auto_review, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (repo_id)
       DO UPDATE SET
         enable_quality_agent  = $2,
         enable_security_agent = $3,
         enable_tests_agent    = $4,
         min_severity          = $5,
         auto_review           = $6,
         updated_at            = NOW()
       RETURNING *`,
      [
        req.params.repoId,
        enable_quality_agent  ?? true,
        enable_security_agent ?? true,
        enable_tests_agent    ?? true,
        min_severity          ?? 'low',
        auto_review           ?? true,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;