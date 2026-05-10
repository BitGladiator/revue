const express = require('express');
const authenticate = require('../middleware/authenticate');
const db = require('../db');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, 
         COUNT(pr.id) as total_prs,
         COUNT(CASE WHEN pr.status = 'reviewed' THEN 1 END) as reviewed_prs
       FROM repos r
       LEFT JOIN pull_requests pr ON pr.repo_id = r.id
       WHERE r.user_id = $1
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/github', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT access_token FROM users WHERE id = $1',
      [req.userId]
    );

    const token = rows[0]?.access_token;
    if (!token) return res.status(401).json({ error: 'No GitHub token' });

    const repoRes = await fetch(
      'https://api.github.com/user/repos?sort=updated&per_page=50&type=all',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    const githubRepos = await repoRes.json();

    res.json(
      githubRepos.map((r) => ({
        github_repo_id: String(r.id),
        full_name: r.full_name,
        name: r.name,
        owner: r.owner.login,
        private: r.private,
        description: r.description,
        language: r.language,
        updated_at: r.updated_at,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/connect', authenticate, async (req, res) => {
  const { github_repo_id, full_name, name, owner, private: isPrivate } = req.body;

  try {
    const { rows } = await db.query(
      `INSERT INTO repos (user_id, github_repo_id, full_name, name, owner, private)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [req.userId, github_repo_id, full_name, name, owner, isPrivate]
    );
    
    let repo = rows[0];

    if (!repo) {
      const { rows: existingRows } = await db.query(
        'SELECT * FROM repos WHERE user_id = $1 AND github_repo_id = $2',
        [req.userId, github_repo_id]
      );
      repo = existingRows[0];
    }

    const { rows: userRows } = await db.query(
      'SELECT access_token FROM users WHERE id = $1',
      [req.userId]
    );
    const token = userRows[0]?.access_token;

    if (token && repo) {
      const pullsRes = await fetch(
        `https://api.github.com/repos/${full_name}/pulls?state=open&per_page=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );

      if (pullsRes.ok) {
        const pulls = await pullsRes.json();
        for (const pr of pulls) {
          await db.query(
            `INSERT INTO pull_requests
               (repo_id, github_pr_id, pr_number, title, author, base_branch, head_branch, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
             ON CONFLICT (repo_id, github_pr_id) DO NOTHING`,
            [
              repo.id,
              String(pr.id),
              pr.number,
              pr.title,
              pr.user.login,
              pr.base.ref,
              pr.head.ref,
            ]
          );
        }
      }
    }

    res.json(repo || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM repos WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;