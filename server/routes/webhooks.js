const express = require('express');
const { Webhooks } = require('@octokit/webhooks');
const db = require('../db');

const router = express.Router();

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET,
});

router.post(
  '/github',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const body = req.body.toString();


    const isValid = await webhooks.verify(body, signature);
    if (!isValid) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.headers['x-github-event'];
    const payload = JSON.parse(body);

    console.log(`Received GitHub event: ${event} action: ${payload.action}`);

    if (event === 'pull_request') {
      const { action, pull_request, repository } = payload;


      if (action === 'opened' || action === 'synchronize') {
        try {
          const { rows: repoRows } = await db.query(
            'SELECT id FROM repos WHERE github_repo_id = $1',
            [String(repository.id)]
          );

          if (repoRows[0]) {
            await db.query(
              `INSERT INTO pull_requests
                 (repo_id, github_pr_id, pr_number, title, author,
                  base_branch, head_branch, diff_url, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
               ON CONFLICT (repo_id, github_pr_id)
               DO UPDATE SET title = $4, status = 'pending', updated_at = NOW()`,
              [
                repoRows[0].id,
                String(pull_request.id),
                pull_request.number,
                pull_request.title,
                pull_request.user.login,
                pull_request.base.ref,
                pull_request.head.ref,
                pull_request.diff_url,
              ]
            );

            console.log(`PR #${pull_request.number} queued for review`);

          }
        } catch (err) {
          console.error('Webhook DB error:', err.message);
        }
      }
    }

    res.status(200).json({ received: true });
  }
);

module.exports = router;