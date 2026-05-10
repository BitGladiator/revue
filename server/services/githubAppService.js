const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');
const parseDiff = require('parse-diff');
const redis = require('../db/redis');


const getInstallationOctokit = async (installationId) => {
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    installationId,
  });

  const { token } = await auth({ type: 'installation' });

  return new Octokit({ auth: token });
};

const getInstallationIdForRepo = async (owner, repo) => {
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
  const { token } = await auth({ type: 'app' });
  const appOctokit = new Octokit({ auth: token });
  try {
    const { data } = await appOctokit.apps.getRepoInstallation({ owner, repo });
    return data.id;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
};


const getPRDiff = async (owner, repo, prNumber, installationId) => {
  const cacheKey = `diff:${owner}:${repo}:${prNumber}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const octokit = await getInstallationOctokit(installationId);

  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: 'diff' },
  });

  
  const files = parseDiff(data);


  const shaped = files.map((file) => ({
    filename: file.to || file.from,
    additions: file.additions,
    deletions: file.deletions,
    chunks: file.chunks.map((chunk) => ({
      header: chunk.content,
      changes: chunk.changes
        .filter((c) => c.type === 'add' || c.type === 'del')
        .map((c) => ({
          type: c.type,
          ln: c.ln || c.ln2,
          content: c.content,
        })),
    })),
  }));

  
  await redis.setex(cacheKey, 600, JSON.stringify(shaped));
  return shaped;
};



const truncateDiff = (files, maxLinesPerFile = 50) => {
  return files
    .slice(0, 10) 
    .map((file) => ({
      ...file,
      chunks: file.chunks.map((chunk) => ({
        ...chunk,
        changes: chunk.changes.slice(0, maxLinesPerFile),
      })),
    }));
};


const formatDiffForAgent = (files) => {
  return files
    .map((file) => {
      const changes = file.chunks
        .flatMap((c) => c.changes)
        .map((c) => `${c.type === 'add' ? '+' : '-'} ${c.content.slice(1)}`)
        .join('\n');

      return `### ${file.filename} (+${file.additions} -${file.deletions})\n${changes}`;
    })
    .join('\n\n');
};


const postReview = async (owner, repo, prNumber, installationId, summary, comments) => {
  const octokit = await getInstallationOctokit(installationId);

  const validComments = comments
    .filter((c) => c.path && c.line && c.body)
    .map((c) => ({
      path: c.path,
      line: c.line,
      body: c.body,
    }));

  try {
    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      event: 'COMMENT',
      body: summary,
      comments: validComments,
    });
  } catch (err) {
    if (err.status === 422) {
      console.warn(`[PR #${prNumber}] Failed to post inline comments due to validation error. Falling back to summary only. Error: ${err.message}`);
      await octokit.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber,
        event: 'COMMENT',
        body: summary + '\n\n> **Note:** Some inline comments could not be posted to specific lines due to mismatches with the PR diff.',
      });
    } else {
      throw err;
    }
  }
};

module.exports = {
  getPRDiff,
  truncateDiff,
  formatDiffForAgent,
  postReview,
  getInstallationOctokit,
  getInstallationIdForRepo,
};