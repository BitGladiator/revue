import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPRReview } from "../api/client.js";
import { reReview } from "../api/client.js";
const SeverityBadge = ({ severity }) => {
  const styles = {
    critical: { bg: "#FFF5F5", color: "#9B2335" },
    high: { bg: "#FFF5F5", color: "#9B2335" },
    medium: { bg: "#FEFCBF", color: "#744210" },
    low: { bg: "#F0FFF4", color: "#276749" },
  };
  const s = styles[severity] || styles.low;
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: "600",
        background: s.bg,
        color: s.color,
        padding: "1px 7px",
        borderRadius: "99px",
        textTransform: "uppercase",
      }}
    >
      {severity}
    </span>
  );
};

const IssueList = ({ title, issues, color }) => {
  if (!issues || issues.length === 0) return null;
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        style={{
          fontSize: "13px",
          fontWeight: "600",
          color,
          margin: "0 0 10px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {title} · {issues.length}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {issues.map((issue, i) => (
          <div
            key={i}
            style={{
              background: "#F7FAFC",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#1a202c",
                  lineHeight: 1.4,
                }}
              >
                {issue.message}
              </span>
              <SeverityBadge severity={issue.severity} />
            </div>
            {issue.filename && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#a0aec0",
                  fontFamily: "monospace",
                  marginBottom: "4px",
                }}
              >
                {issue.filename}
                {issue.line ? `:${issue.line}` : ""}
              </div>
            )}
            {issue.suggestion && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#4a5568",
                  marginTop: "6px",
                  paddingTop: "6px",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                → {issue.suggestion}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ReviewDetail = () => {
  const { prId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);
  const [rereviewing, setRereviewing] = useState(false);
  useEffect(() => {
    getPRReview(prId)
      .then(setReview)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [prId]);
  const handleReReview = async () => {
    setRereviewing(true);
    try {
      await reReview(prId);
      navigate(`/repos/${review.repo_id}`);
    } catch (err) {
      console.error(err);
      setRereviewing(false);
    }
  };

  if (loading)
    return (
      <div style={{ padding: "40px", color: "#a0aec0" }}>Loading review...</div>
    );
  if (!review)
    return (
      <div style={{ padding: "40px", color: "#a0aec0" }}>Review not found.</div>
    );

  const score = review.quality_score || 0;
  const scoreColor =
    score >= 80 ? "#276749" : score >= 60 ? "#744210" : "#9B2335";
  const scoreBg = score >= 80 ? "#F0FFF4" : score >= 60 ? "#FEFCBF" : "#FFF5F5";

  const securityIssues =
    typeof review.security_issues === "string"
      ? JSON.parse(review.security_issues)
      : review.security_issues || [];
  const qualityIssues =
    typeof review.quality_issues === "string"
      ? JSON.parse(review.quality_issues)
      : review.quality_issues || [];
  const testIssues =
    typeof review.test_coverage_issues === "string"
      ? JSON.parse(review.test_coverage_issues)
      : review.test_coverage_issues || [];
  const agentReasoning =
    typeof review.agent_reasoning === "string"
      ? JSON.parse(review.agent_reasoning)
      : review.agent_reasoning || {};
  const pipelineMeta =
    typeof review.pipeline_meta === "string"
      ? JSON.parse(review.pipeline_meta)
      : review.pipeline_meta || {};

  const totalIssues =
    securityIssues.length + qualityIssues.length + testIssues.length;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 24px" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: "#718096",
          cursor: "pointer",
          fontSize: "13px",
          padding: 0,
          marginBottom: "24px",
        }}
      >
        ← Back
      </button>

      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#a0aec0" }}>
            #{review.pr_number}
          </span>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1a202c",
              margin: 0,
            }}
          >
            {review.title}
          </h1>
        </div>
        <p style={{ fontSize: "13px", color: "#718096", margin: 0 }}>
          by @{review.author} · {review.head_branch} → {review.base_branch}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            background: scoreBg,
            border: `1px solid ${scoreColor}40`,
            borderRadius: "12px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: "700",
              color: scoreColor,
              lineHeight: 1,
            }}
          >
            {score}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: scoreColor,
              marginTop: "4px",
              fontWeight: "500",
            }}
          >
            Quality score
          </div>
          <div style={{ fontSize: "11px", color: "#718096", marginTop: "8px" }}>
            {totalIssues} {totalIssues === 1 ? "issue" : "issues"} found
          </div>
        </div>

        <div
          style={{
            background: "#F7FAFC",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#718096",
              margin: "0 0 10px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Summary
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "#2d3748",
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {review.overall_summary}
          </p>
          <div
            style={{
              marginTop: "14px",
              display: "flex",
              gap: "16px",
              fontSize: "12px",
              color: "#a0aec0",
            }}
          >
            <span>{pipelineMeta.total_tokens || 0} tokens</span>
            <span>{pipelineMeta.duration_ms || 0}ms</span>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={handleReReview}
          disabled={rereviewing}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#4a5568",
            cursor: rereviewing ? "not-allowed" : "pointer",
            opacity: rereviewing ? 0.6 : 1,
          }}
        >
          {rereviewing ? "Queuing..." : "Re-review this PR"}
        </button>
      </div>

      <IssueList title="Security" issues={securityIssues} color="#9B2335" />
      <IssueList title="Code quality" issues={qualityIssues} color="#744210" />
      <IssueList title="Test coverage" issues={testIssues} color="#2B6CB0" />

      {totalIssues === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            background: "#F0FFF4",
            border: "1px solid #9AE6B4",
            borderRadius: "12px",
            color: "#276749",
            fontSize: "14px",
          }}
        >
          No issues found — clean PR.
        </div>
      )}

      {Object.keys(agentReasoning).length > 0 && (
        <div
          style={{
            marginTop: "28px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "20px",
          }}
        >
          <button
            onClick={() => setShowReasoning((r) => !r)}
            style={{
              fontSize: "13px",
              color: "#3182CE",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {showReasoning ? "Hide" : "Show"} agent reasoning
          </button>

          {showReasoning && (
            <div
              style={{
                marginTop: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {Object.entries(agentReasoning).map(
                ([agent, reasoning]) =>
                  reasoning && (
                    <div
                      key={agent}
                      style={{
                        background: "#F7FAFC",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#718096",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          marginBottom: "6px",
                        }}
                      >
                        {agent} agent
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#4a5568",
                          lineHeight: 1.6,
                        }}
                      >
                        {reasoning}
                      </div>
                    </div>
                  )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewDetail;
