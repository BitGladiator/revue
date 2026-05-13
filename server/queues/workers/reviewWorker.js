const { Worker } = require("bullmq");
const { connection } = require("../index");
const db = require("../../db");
const {
  getPRDiff,
  truncateDiff,
  formatDiffForAgent,
  postReview,
} = require("../../services/githubAppService");
const { runReviewPipeline } = require("../../agents/reviewOrchestrator");

const emitToUser = async (userId, event, data) => {
  try {
    const { io } = require("../../index");
    if (io) io.to(`user:${userId}`).emit(event, data);
  } catch (err) {
    console.error("Socket emit failed:", err.message);
  }
};

const worker = new Worker(
  "pr-reviews",
  async (job) => {
    const {
      prId,
      owner,
      repo,
      prNumber,
      prTitle,
      prAuthor,
      installationId,
      userId,
    } = job.data;

    console.log(`Processing review for PR #${prNumber} in ${owner}/${repo}`);

    try {
      await emitToUser(userId, "pr_status", {
        prId,
        status: "reviewing",
        message: `Revue is reviewing PR #${prNumber}...`,
      });

      await db.query(
        "UPDATE pull_requests SET status = 'reviewing', updated_at = NOW() WHERE id = $1",
        [prId]
      );

      await job.updateProgress(10);
      const rawFiles = await getPRDiff(owner, repo, prNumber, installationId);
      const truncated = truncateDiff(rawFiles, 50);
      const formattedDiff = formatDiffForAgent(truncated);
      
      await job.updateProgress(30);
      const { rows: settingsRows } = await db.query(
        `SELECT rs.* FROM repo_settings rs
         JOIN pull_requests pr ON pr.repo_id = rs.repo_id
         WHERE pr.id = $1`,
        [prId]
      );
      
      const settings = settingsRows[0] || {};
      await emitToUser(userId, "pr_status", {
        prId,
        status: "reviewing",
        message: "Agents are analysing your code...",
      });

      if (settings.auto_review === false) {
        await db.query(
          "UPDATE pull_requests SET status = 'pending', updated_at = NOW() WHERE id = $1",
          [prId]
        );
        return { skipped: true, reason: 'auto_review disabled' };
      }
      
      const review = await runReviewPipeline(formattedDiff, prTitle, prAuthor, settings);

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

      if (installationId) {
        const reviewBody = buildReviewBody(review);
        const inlineComments = buildInlineComments(review.all_issues);
        await postReview(
          owner,
          repo,
          prNumber,
          installationId,
          reviewBody,
          inlineComments
        );
      }

      await db.query(
        "UPDATE pull_requests SET status = 'reviewed', updated_at = NOW() WHERE id = $1",
        [prId]
      );

      await job.updateProgress(100);

      await emitToUser(userId, "pr_reviewed", {
        prId,
        prNumber,
        prTitle,
        status: "reviewed",
        score: review.overall_score,
        summary: review.summary,
        totalIssues:
          review.security_issues.length +
          review.quality_issues.length +
          review.test_issues.length,
        reviewId: rows[0].id,
      });

      console.log(
        `Review complete for PR #${prNumber} — score: ${review.overall_score}`
      );
      return { reviewId: rows[0].id, score: review.overall_score };
    } catch (err) {
      console.error(`Review failed for PR #${prNumber}:`, err.message);

      await db.query(
        "UPDATE pull_requests SET status = 'failed', updated_at = NOW() WHERE id = $1",
        [prId]
      );

      await emitToUser(userId, "pr_status", {
        prId,
        status: "failed",
        message: `Review failed for PR #${prNumber}`,
      });

      throw err;
    }
  },
  { connection, concurrency: 2 }
);

const buildReviewBody = (review) => {
  const scoreEmoji =
    review.overall_score >= 80
      ? ""
      : review.overall_score >= 60
      ? ""
      : "";

  return `## Revue AI Review ${scoreEmoji}

**Quality score: ${review.overall_score}/100**

${review.summary}

${
  review.top_issues?.length > 0
    ? `### Key issues\n${review.top_issues.map((i) => `- ${i}`).join("\n")}`
    : ""
}

---
*Reviewed by Revue · ${review.pipeline_meta?.total_tokens || 0} tokens*`;
};

const buildInlineComments = (issues) => {
  return (issues || [])
    .filter((i) => i.filename && i.line)
    .slice(0, 10)
    .map((issue) => ({
      path: issue.filename,
      line: issue.line,
      body: `**[${issue.type?.toUpperCase()} — ${issue.severity}]** ${
        issue.message
      }\n\n ${issue.suggestion}`,
    }));
};

worker.on("completed", (job, result) => {
  console.log(`Review job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Review job ${job.id} failed:`, err.message);
});

console.log("Review worker started");
