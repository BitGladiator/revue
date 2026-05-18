import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRepoPRs, getRepos } from "../api/client.js";
import useReviewSocket from "../hooks/useReviewSocket.js";
import { useAuth } from "../hooks/useAuth.jsx";

const STATUS_CONFIG = {
  pending:   { label: "Pending",    color: "#92400E", bg: "rgba(146,64,14,0.08)",  border: "rgba(146,64,14,0.2)"  },
  reviewing: { label: "Reviewing…", color: "#1D4ED8", bg: "rgba(29,78,216,0.08)",  border: "rgba(29,78,216,0.2)"  },
  reviewed:  { label: "Reviewed",   color: "#065F46", bg: "rgba(6,95,70,0.08)",    border: "rgba(6,95,70,0.2)"    },
  failed:    { label: "Failed",     color: "#B91C1C", bg: "rgba(185,28,28,0.08)",  border: "rgba(185,28,28,0.2)"  },
};

const scoreHue = (s) => s >= 80 ? 152 : s >= 60 ? 197 : s >= 40 ? 38 : 0;

const ScoreBadge = ({ score }) => {
  if (score === null || score === undefined) return null;
  const hue = scoreHue(score);
  return (
    <div style={{
      fontSize: 13, fontWeight: 700,
      color: `hsl(${hue} 65% 36%)`,
      background: `hsl(${hue} 60% 96%)`,
      border: `1px solid hsl(${hue} 50% 86%)`,
      padding: "2px 10px", borderRadius: 99,
      letterSpacing: "-0.2px",
    }}>
      {score}<span style={{ fontSize: 10, fontWeight: 500, marginLeft: 1 }}>/100</span>
    </div>
  );
};

const RepoPRs = () => {
  const { repoId } = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [prs, setPRs]           = useState([]);
  const [repoName, setRepoName] = useState("");
  const [loading, setLoading]   = useState(true);

  const { prStatuses } = useReviewSocket(user?.id);

  useEffect(() => {
    Promise.all([getRepoPRs(repoId), getRepos()])
      .then(([prData, repos]) => {
        setPRs(prData);
        const repo = repos.find((r) => String(r.id) === String(repoId));
        setRepoName(repo?.full_name || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [repoId]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse {
          0%,100% { opacity:1; } 50% { opacity:0.4; }
        }
        .pr-card:hover { border-color:#9ca3af !important; box-shadow:0 4px 16px rgba(0,0,0,0.07) !important; transform:translateY(-1px); }
        .back-btn:hover { color:#374151 !important; }
        .settings-btn:hover { background:#f3f4f6 !important; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px 60px" }}>

        <div style={{ marginBottom: 30 }}>
          <button
            className="back-btn"
            onClick={() => navigate("/dashboard")}
            style={{
              background: "none", border: "none", color: "#9ca3af",
              cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 16,
              display: "flex", alignItems: "center", gap: 5, transition: "color 0.15s",
            }}
          >
            ← Back to dashboard
          </button>
          <h1 style={{
            margin: "0 0 4px", fontSize: 20, fontWeight: 700,
            color: "#111827", letterSpacing: "-0.3px",
          }}>
            {repoName}
          </h1>
          <p style={{ margin: 0, fontSize: 12.5, color: "#9ca3af" }}>
            Pull requests reviewed by Revue
          </p>
        </div>

        {loading ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            color: "#9ca3af", fontSize: 13, padding: "40px 0",
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              border: "2px solid #e5e7eb", borderTopColor: "#374151",
              animation: "spin 0.7s linear infinite",
            }} />
            Loading pull requests…
          </div>
        ) : prs.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            border: "1px dashed #d1d5db", borderRadius: 14,
            color: "#9ca3af", fontSize: 13.5,
          }}>
            No pull requests yet. Open a PR on this repo to trigger a review.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.4s ease both" }}>
            {prs.map((pr) => {
              const live       = prStatuses[pr.id];
              const status     = live?.status || pr.status;
              const score      = live?.score  ?? pr.quality_score;
              const cfg        = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
              const isReviewed  = status === "reviewed";
              const isReviewing = status === "reviewing";

              return (
                <div
                  key={pr.id}
                  className="pr-card"
                  onClick={() => isReviewed && navigate(`/reviews/${pr.id}`)}
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "16px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: isReviewed ? "pointer" : "default",
                    transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{
                        fontSize: 11, color: "#9ca3af", flexShrink: 0,
                        fontFamily: "ui-monospace,monospace",
                      }}>#{pr.pr_number}</span>
                      <span style={{
                        fontSize: 14, fontWeight: 600, color: "#111827",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{pr.title}</span>
                    </div>

                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      <strong style={{ color: "#6b7280" }}>@{pr.author}</strong>
                      {" · "}{formatDate(pr.created_at)}
                      {" · "}
                      <code style={{
                        fontSize: 11, background: "#f3f4f6", padding: "0 5px",
                        borderRadius: 4, fontFamily: "ui-monospace,monospace", color: "#374151",
                      }}>{pr.head_branch}</code>
                      {" → "}
                      <code style={{
                        fontSize: 11, background: "#f3f4f6", padding: "0 5px",
                        borderRadius: 4, fontFamily: "ui-monospace,monospace", color: "#374151",
                      }}>{pr.base_branch}</code>
                    </div>

                    {isReviewing && live?.message && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 12, color: "#1D4ED8", marginTop: 6,
                      }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#1D4ED8",
                          animation: "pulse 1.2s ease infinite",
                        }} />
                        {live.message}
                      </div>
                    )}

                    {pr.overall_summary && isReviewed && (
                      <div style={{
                        fontSize: 12, color: "#6b7280", marginTop: 6,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {pr.overall_summary}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <ScoreBadge score={score} />

                    <span style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: cfg.color, background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      padding: "2px 9px", borderRadius: 99,
                    }}>
                      {cfg.label}
                    </span>

                    <button
                      className="settings-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/repos/${repoId}/settings`); }}
                      style={{
                        fontSize: 12, color: "#6b7280",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 7, padding: "5px 11px",
                        cursor: "pointer", transition: "background 0.15s",
                      }}
                    >
                      Settings
                    </button>

                    {isReviewed && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default RepoPRs;
