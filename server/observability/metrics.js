const promClient = require('prom-client');

const register = new promClient.Registry();

promClient.collectDefaultMetrics({
  register,
  prefix: 'revue_',
});


const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});


const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});


const httpErrorTotal = new promClient.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});


const activeWebSocketConnections = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});


const reviewJobsTotal = new promClient.Counter({
  name: 'review_jobs_total',
  help: 'Total PR review jobs queued',
  labelNames: ['status'], 
  registers: [register],
});


const reviewPipelineDuration = new promClient.Histogram({
  name: 'review_pipeline_duration_seconds',
  help: 'Time taken to complete a full review pipeline',
  buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
  registers: [register],
});

const groqTokensUsed = new promClient.Histogram({
  name: 'groq_tokens_per_review',
  help: 'Groq tokens used per review pipeline run',
  buckets: [500, 1000, 1500, 2000, 3000, 5000],
  registers: [register],
});


const groqApiCalls = new promClient.Counter({
  name: 'groq_api_calls_total',
  help: 'Total Groq API calls made',
  labelNames: ['agent', 'status'], 
  registers: [register],
});


const githubApiCalls = new promClient.Counter({
  name: 'github_api_calls_total',
  help: 'Total GitHub API calls made',
  labelNames: ['endpoint', 'status'],
  registers: [register],
});


const githubApiDuration = new promClient.Histogram({
  name: 'github_api_duration_seconds',
  help: 'Duration of GitHub API calls',
  labelNames: ['endpoint'],
  buckets: [0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});


const cacheOperations = new promClient.Counter({
  name: 'cache_operations_total',
  help: 'Redis cache hits and misses',
  labelNames: ['operation', 'result'],
  registers: [register],
});


const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['query_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});


const webhookEventsTotal = new promClient.Counter({
  name: 'webhook_events_total',
  help: 'Total GitHub webhook events received',
  labelNames: ['event', 'action'],
  registers: [register],
});


const rateLimitHits = new promClient.Counter({
  name: 'rate_limit_hits_total',
  help: 'Number of rate limit violations',
  labelNames: ['limiter'],
  registers: [register],
});


const reviewScores = new promClient.Histogram({
  name: 'review_quality_scores',
  help: 'Distribution of PR quality scores',
  buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  registers: [register],
});

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  httpErrorTotal,
  activeWebSocketConnections,
  reviewJobsTotal,
  reviewPipelineDuration,
  groqTokensUsed,
  groqApiCalls,
  githubApiCalls,
  githubApiDuration,
  cacheOperations,
  dbQueryDuration,
  webhookEventsTotal,
  rateLimitHits,
  reviewScores,
};