# Revue

An AI-powered code review platform that automatically reviews GitHub pull requests using a multi-agent pipeline. Connect a repository, open a pull request, and Revue posts a structured review directly back to GitHub within seconds — scoring code quality, identifying security vulnerabilities, and flagging missing tests.

---

## What it does

- Automatically reviews pull requests via GitHub webhooks
- Multi-agent AI pipeline — separate agents for code quality, security, and test coverage
- Posts inline review comments directly to GitHub as a bot
- Real-time status updates via WebSockets — no page refresh needed
- Tracks review history and diffs between re-reviews
- Per-repo settings — configure which agents to run and minimum severity
- Analytics dashboard — score trends, common issues, per-repo breakdowns
- Full observability stack — Prometheus, Grafana, Loki, AlertManager

---

## Tech stack

**Frontend** — Vite, React, React Router, Socket.io client

**Backend** — Node.js, Express, Socket.io, BullMQ

**Database** — PostgreSQL with node-pg-migrate for versioned migrations

**Cache** — Redis via ioredis

**AI** — Groq API, llama-3.1-8b-instant and llama-3.3-70b-versatile

**GitHub integration** — @octokit/rest, @octokit/webhooks, @octokit/auth-app

**Infrastructure** — Docker, Prometheus, Grafana, Loki, Promtail, AlertManager, Node Exporter

---

## How the review pipeline works

When a pull request is opened or updated, GitHub sends a webhook to Revue. The webhook handler queues a BullMQ job and immediately returns a 200 response. The review worker picks up the job and runs a four-agent pipeline:

**Quality agent** — checks complexity, naming, duplication, and anti-patterns using llama-3.1-8b-instant

**Security agent** — finds vulnerabilities, injection risks, and exposed secrets using llama-3.1-8b-instant

**Test coverage agent** — identifies missing tests and untested edge cases using llama-3.1-8b-instant

**Aggregator** — synthesises all findings into a final score, verdict, and summary using llama-3.3-70b-versatile

Each agent receives a truncated diff — maximum 50 changed lines per file, maximum 10 files — to stay within token limits. The aggregator runs on the smarter 70B model only after the three specialist agents have produced their findings. Total token cost per review is approximately 1,800 tokens on the Groq free tier.

The finished review is saved to Postgres, posted back to GitHub as inline comments, and pushed to the client via WebSocket.

---

## Review diffing

When a PR is re-reviewed, Revue computes a diff between the two reviews. Issues are normalised by filename and message, then categorised as fixed, new, or persisting. The score delta and issue movement are stored in a dedicated table and displayed in the dashboard on a dedicated tab.

---

## Rate limiting

Three layers protect the API:

- **Global limiter** — 200 requests per minute per IP
- **Auth limiter** — 10 requests per 15 minutes per IP on OAuth routes
- **Webhook limiter** — 60 requests per minute per IP on webhook routes
- **Re-review limiter** — 5 re-reviews per hour per user
- **Speed limiter** — progressive delays above 50 requests per minute

---

## Database migrations

Schema changes are managed with node-pg-migrate. Every change is a numbered file with explicit up and down functions. Migrations run automatically on server startup.

```bash
npm run migrate:up
npm run migrate:down
npm run migrate:create -- migration_name
npm run migrate:status
```

---

## Running locally

**Prerequisites** — Docker Desktop with at least 4GB RAM allocated, Node.js 20, ngrok

```bash
git clone https://github.com/yourusername/revue.git
cd revue

# Start all containers
docker-compose up -d

# Install server dependencies and run migrations
cd server && npm install && npm run migrate:up

# Install client dependencies
cd ../client && npm install
```

**GitHub OAuth App** — go to github.com/settings/developers, create an OAuth App with:
- Homepage URL: `http://localhost:5173`
- Callback URL: `http://localhost:5500/api/auth/callback`

**GitHub App** — create a GitHub App with:
- Webhook URL: your ngrok URL + `/api/webhooks/github`
- Permissions: Pull requests (read and write), Contents (read), Metadata (read)
- Subscribe to events: Pull request

```bash
# Start ngrok for webhook delivery
ngrok http 5500

# Start the server
cd server && npm run dev

# Start the client
cd client && npm run dev
```

Open `http://localhost:5173`

---

## Environment variables

```env
PORT=5500
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DATABASE_URL=postgresql://postgres:postgres@localhost:5433/revue
REDIS_URL=redis://localhost:6379

JWT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
GROQ_API_KEY=
```

Generate JWT_SECRET with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Format the GitHub App private key for the env file:
```bash
cat your-app.pem | awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}'
```

---

## Observability

| Tool | URL | Credentials |
|---|---|---|
| Grafana | http://localhost:3001 | admin / admin123 |
| Prometheus | http://localhost:9090 | none |
| AlertManager | http://localhost:9093 | none |
| Bull queue dashboard | http://localhost:5500/admin/queues | none |
| Raw metrics | http://localhost:5500/metrics | none |

Key Grafana queries:

```promql
# Review pipeline p95 duration
histogram_quantile(0.95, rate(review_pipeline_duration_seconds_bucket[5m]))

# Groq tokens per hour
rate(groq_tokens_per_review_sum[1h]) * 3600

# Review jobs by status
rate(review_jobs_total[5m])

# Error rate
rate(http_errors_total[1m]) / rate(http_requests_total[1m]) * 100
```

---

## Project structure

```
revue/
├── docker-compose.yml
├── observability/
│   ├── prometheus.yml
│   ├── alerts.yml
│   ├── loki.yml
│   ├── promtail.yml
│   ├── alertmanager.yml
│   └── grafana/
│       └── provisioning/
├── client/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       └── pages/
└── server/
    ├── agents/
    │   ├── prompts.js
    │   └── reviewOrchestrator.js
    ├── db/
    ├── middleware/
    ├── migrations/
    ├── observability/
    ├── queues/
    │   └── workers/
    ├── routes/
    └── services/
```

---

## Alerts

AlertManager fires Slack notifications when:

- Error rate exceeds 5% over 2 minutes
- Review pipeline p95 duration exceeds 30 seconds
- Groq token usage spikes above 10,000 per hour
- Any service instance goes down for more than 1 minute
- Review jobs failing at more than 0.1 per 10 minutes
