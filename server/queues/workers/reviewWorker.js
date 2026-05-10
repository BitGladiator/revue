const { Worker } = require('bullmq');
const { connection } = require('../index');
const db = require('../../db');
const {
  getPRDiff,
  truncateDiff,
  formatDiffForAgent,
  postReview,
} = require('../../services/githubAppService');
const { runReviewPipeline } = require('../../agents/reviewOrchestrator');

const worker = new Worker('pr-reviews', async (job) => {
  const { prId, owner, repo, prNumber, prTitle, prAuthor, installationId } = job.data;

  console.log(`Processing review job for PR #${prNumber} in ${owner}/${repo}`);

  try {
    await db.query(
      "UPDATE pull_requests SET status = 'reviewing', updated_at = NOW() WHERE id = $1",
      [prId]
    );

    await job.updateProgress(10);

   
    const rawFiles = await getPRDiff(owner, repo, prNumber, installationId);
    const truncated = truncateDiff(rawFiles, 50);
    const formattedDiff = formatDiffForAgent(truncated);

    await job.updateProgress(30);

   
    const review = await runReviewPipeline(formattedDiff, prTitle, prAuthor);

    await job.updateProgress(70);

   
    const { rows } = await db.query(
      `INSERT INTO reviews
         (pr_id, overall_summary, quality_score,
          security_issues, quality_issues, test_coverage_issues,
          agent_reasoning, pipeline_meta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        prId,
        review.summary,
        review.overall_score,
        JSON.stringify(review.security_issues),
        JSON.stringify(review.quality_issues),
        JSON.stringify(review.test_issues),
        JSON.stringify(review.agent_reasoning),
        JSON.stringify(review.pipeline_meta),
      ]
    );

    await job.updateProgress(85);


    const reviewBody = buildReviewBody(review);
    const inlineComments = buildInlineComments(review.all_issues);

    if (installationId) {
      await postReview(owner, repo, prNumber, installationId, reviewBody, inlineComments);
    }

   
    await db.query(
      "UPDATE pull_requests SET status = 'reviewed', updated_at = NOW() WHERE id = $1",
      [prId]
    );

    await job.updateProgress(100);

    console.log(`Review complete for PR #${prNumber} — score: ${review.overall_score}`);
    return { reviewId: rows[0].id, score: review.overall_score };

  } catch (err) {
    console.error(`Review job failed for PR #${prNumber}:`, err.message);

    await db.query(
      "UPDATE pull_requests SET status = 'failed', updated_at = NOW() WHERE id = $1",
      [prId]
    );

    throw err;
  }
}, {
  connection,
  concurrency: 2,
});


const buildReviewBody = (review) => {
  const scoreEmoji =
    review.overall_score >= 80 ? '' :
    review.overall_score >= 60 ? '' : '';

  return `## Revue AI Review ${scoreEmoji}

**Quality score: ${review.overall_score}/100**

${review.summary}

${review.top_issues.length > 0 ? `### Key issues\n${review.top_issues.map((i) => `- ${i}`).join('\n')}` : ''}

---
*Reviewed by Revue — ${review.pipeline_meta?.total_tokens || 0} tokens used*`;
};


const buildInlineComments = (issues) => {
  return issues
    .filter((i) => i.filename && i.line)
    .slice(0, 10) 
    .map((issue) => ({
      path: issue.filename,
      line: issue.line,
      body: `**[${issue.type.toUpperCase()} — ${issue.severity}]** ${issue.message}\n\n💡 ${issue.suggestion}`,
    }));
};

worker.on('completed', (job, result) => {
  console.log(`Review job ${job.id} completed — review ${result.reviewId}`);
});

worker.on('failed', (job, err) => {
  console.error(`Review job ${job.id} failed:`, err.message);
});

console.log('Review worker started');