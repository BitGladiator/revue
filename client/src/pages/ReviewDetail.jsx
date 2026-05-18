import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPRReview, reReview } from "../api/client.js";



const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function scoreGrade(score) {
  if (score >= 85) return { label: "Excellent", hue: 152 };
  if (score >= 70) return { label: "Good",      hue: 197 };
  if (score >= 50) return { label: "Fair",      hue: 38  };
  return               { label: "Needs work",  hue: 0   };
}



const AnimatedRing = ({ score }) => {
  const R        = 52;
  const circ     = 2 * Math.PI * R;
  const pct      = clamp(score, 0, 100) / 100;
  const { hue, label } = scoreGrade(score);
  const [drawn, setDrawn] = useState(0);

  useEffect(() => {
    let raf;
    let start = null;
    const duration = 900;
    const animate = (ts) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDrawn(ease * pct);
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const dashoffset = circ * (1 - drawn);
  const fg = `hsl(${hue} 70% 42%)`;
  const track = `hsl(${hue} 20% 92%)`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <svg width="132" height="132" viewBox="0 0 132 132" style={{ overflow: "visible" }}>
    
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      
        <circle cx="66" cy="66" r={R} fill="none" stroke={track} strokeWidth="9" />
     
        <circle
          cx="66" cy="66" r={R}
          fill="none"
          stroke={fg}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 66 66)"
          filter="url(#glow)"
          style={{ transition: "stroke 0.4s" }}
        />
       
        <text x="66" y="60" textAnchor="middle" fontSize="28" fontWeight="700"
          fill={fg} fontFamily="system-ui,sans-serif">{score}</text>
        <text x="66" y="78" textAnchor="middle" fontSize="10" fontWeight="500"
          fill={`hsl(${hue} 30% 55%)`} fontFamily="system-ui,sans-serif" textTransform="uppercase"
          letterSpacing="1">/ 100</text>
      </svg>
      <span style={{
        fontSize: 12, fontWeight: 600, letterSpacing: "0.06em",
        textTransform: "uppercase", color: fg,
      }}>{label}</span>
    </div>
  );
};



const SEV = {
  critical: { dot: "#B91C1C", color: "#B91C1C", bg: "rgba(185,28,28,0.07)", border: "rgba(185,28,28,0.22)", label: "Critical" },
  high:     { dot: "#C05621", color: "#C05621", bg: "rgba(192,86,33,0.07)",  border: "rgba(192,86,33,0.22)",  label: "High"     },
  medium:   { dot: "#D97706", color: "#92400E", bg: "rgba(146,64,14,0.07)",  border: "rgba(146,64,14,0.20)",  label: "Medium"   },
  low:      { dot: "#059669", color: "#065F46", bg: "rgba(6,95,70,0.07)",    border: "rgba(6,95,70,0.18)",    label: "Low"      },
};

const getSev = (s) => SEV[s] || SEV.low;



const IssueCard = ({ issue, index }) => {
  const [open, setOpen] = useState(false);
  const sev = getSev(issue.severity);
  const hasSuggestion = Boolean(issue.suggestion);
  const hasFile = Boolean(issue.filename);

  return (
    <div
      style={{
        background: open ? sev.bg : "#fff",
        border: `1px solid ${open ? sev.border : "#e5e7eb"}`,
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 0.2s, background 0.2s",
        cursor: hasSuggestion || hasFile ? "pointer" : "default",
        animationDelay: `${index * 50}ms`,
      }}
      className="issue-card-anim"
      onClick={() => (hasSuggestion || hasFile) && setOpen((o) => !o)}
    >
     
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "12px 14px",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", background: sev.dot,
          flexShrink: 0, marginTop: 5,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 13, fontWeight: 500, color: "#111827",
            lineHeight: 1.5,
          }}>{issue.message}</p>
          {hasFile && (
            <code style={{
              display: "inline-block", marginTop: 5, fontSize: 11,
              color: "#6b7280", background: "#f3f4f6",
              padding: "1px 7px", borderRadius: 4, fontFamily: "ui-monospace,monospace",
            }}>
              {issue.filename}{issue.line ? `:${issue.line}` : ""}
            </code>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
            textTransform: "uppercase", color: sev.color,
            background: sev.bg, border: `1px solid ${sev.border}`,
            padding: "2px 8px", borderRadius: 99,
          }}>{sev.label}</span>
          {(hasSuggestion || hasFile) && (
            <span style={{
              fontSize: 11, color: "#9ca3af",
              transition: "transform 0.2s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              display: "inline-block",
            }}>▾</span>
          )}
        </div>
      </div>

      {open && hasSuggestion && (
        <div style={{
          padding: "0 14px 13px 40px",
          animation: "slideDown 0.18s ease",
        }}>
          <div style={{
            background: "rgba(0,0,0,0.03)",
            border: "1px solid rgba(0,0,0,0.09)",
            borderRadius: 8, padding: "10px 12px",
          }}>
            <p style={{
              margin: "0 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
              textTransform: "uppercase", color: "#374151",
            }}>Suggestion</p>
            <p style={{ margin: 0, fontSize: 12.5, color: "#374151", lineHeight: 1.6 }}>
              {issue.suggestion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};



const SECTION_META = {
  security: { label: "Security",      accent: "#B91C1C" },
  quality:  { label: "Code Quality",  accent: "#92400E" },
  tests:    { label: "Test Coverage", accent: "#1D4ED8" },
};

const IssueSection = ({ type, issues }) => {
  const [collapsed, setCollapsed] = useState(false);
  if (!issues || issues.length === 0) return null;
  const meta = SECTION_META[type];

  return (
    <div style={{ marginBottom: 20 }}>
      {/* section header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between",
          background: "none", border: "none", cursor: "pointer",
          padding: "8px 0", marginBottom: collapsed ? 0 : 10,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, letterSpacing: "0.07em",
            textTransform: "uppercase", color: meta.accent,
          }}>{meta.label}</span>
          <span style={{
            fontSize: 11, fontWeight: 600,
            background: `${meta.accent}15`,
            color: meta.accent,
            padding: "1px 8px", borderRadius: 99,
          }}>{issues.length}</span>
        </span>
        <span style={{
          fontSize: 11, color: "#9ca3af",
          transition: "transform 0.2s",
          transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          display: "inline-block",
        }}>▾</span>
      </button>

      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};


const ScorePill = ({ label, value, hue }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "12px 20px",
    background: `hsl(${hue} 60% 97%)`,
    border: `1px solid hsl(${hue} 50% 88%)`,
    borderRadius: 10, flex: 1, minWidth: 80,
  }}>
    <span style={{
      fontSize: 20, fontWeight: 700, color: `hsl(${hue} 65% 38%)`,
    }}>{value ?? "—"}</span>
    <span style={{
      fontSize: 10.5, marginTop: 3, fontWeight: 600, letterSpacing: "0.06em",
      textTransform: "uppercase", color: `hsl(${hue} 30% 52%)`,
    }}>{label}</span>
  </div>
);





const AgentReasoningPanel = ({ agentReasoning }) => {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(agentReasoning).filter(([, v]) => v);
  if (!entries.length) return null;

  return (
    <div style={{
      marginTop: 28,
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "14px 18px",
          background: open ? "#fafafa" : "#fff",
          border: "none", cursor: "pointer",
          borderBottom: open ? "1px solid #e5e7eb" : "none",
          transition: "background 0.2s",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            Agent Reasoning
          </span>
          <span style={{
            fontSize: 10.5, fontWeight: 600, color: "#6b7280",
            background: "#f3f4f6", padding: "1px 8px", borderRadius: 99,
          }}>{entries.length} agents</span>
        </span>
        <span style={{
          fontSize: 11, color: "#9ca3af",
          transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          display: "inline-block",
        }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {entries.map(([agent, reasoning]) => (
            <AgentCard key={agent} agent={agent} reasoning={reasoning} />
          ))}
        </div>
      )}
    </div>
  );
};

const AgentCard = ({ agent, reasoning }) => {
  const [open, setOpen] = useState(false);
  const preview = reasoning.length > 120 ? reasoning.slice(0, 120) + "…" : reasoning;

  return (
    <div style={{
      border: "1px solid #e5e7eb", borderRadius: 9,
      background: "#fff", overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "flex-start",
          gap: 10, padding: "11px 14px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: "0 0 3px", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.07em", textTransform: "uppercase", color: "#374151",
          }}>{agent} agent</p>
          <p style={{ margin: 0, fontSize: 12.5, color: "#6b7280", lineHeight: 1.5 }}>
            {open ? reasoning : preview}
          </p>
        </div>
        <span style={{
          fontSize: 11, color: "#9ca3af", flexShrink: 0, marginTop: 2,
          transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          display: "inline-block",
        }}>▾</span>
      </button>
    </div>
  );
};



const ReviewDetail = () => {
  const { prId }    = useParams();
  const navigate    = useNavigate();
  const [review, setReview]         = useState(null);
  const [loading, setLoading]       = useState(true);
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
      <div style={stateWrap}>
        <div className="ring-spinner" />
        <span style={{ color: "#9ca3af", fontSize: 13 }}>Loading review…</span>
      </div>
    );
  if (!review)
    return <div style={{ ...stateWrap, color: "#ef4444" }}>Review not found.</div>;


  const parse = (v) => {
    if (!v) return typeof v === "object" ? (Array.isArray(v) ? [] : {}) : [];
    try { return typeof v === "string" ? JSON.parse(v) : v; }
    catch { return []; }
  };

  const securityIssues = parse(review.security_issues) || [];
  const qualityIssues  = parse(review.quality_issues)  || [];
  const testIssues     = parse(review.test_coverage_issues) || [];
  const agentReasoning = parse(review.agent_reasoning) || {};
  const pipelineMeta   = parse(review.pipeline_meta)   || {};

  const score       = review.quality_score ?? 0;
  const totalIssues = securityIssues.length + qualityIssues.length + testIssues.length;
  const { hue }     = scoreGrade(score);

  return (
    <>

      <style>{`
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .issue-card-anim { animation: fadeUp 0.3s ease both; }
        .ring-spinner {
          width:28px; height:28px;
          border:3px solid #e5e7eb;
          border-top-color:#374151;
          border-radius:50%;
          animation:spin 0.7s linear infinite;
          margin-bottom:10px;
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        .rerw-btn:hover { background:#f3f4f6 !important; border-color:#9ca3af !important; }
        .back-btn:hover { color:#374151 !important; }
      `}</style>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "36px 24px 60px" }}>

        {/* ── back + re-review ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <button
            className="back-btn"
            onClick={() => navigate(-1)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "#9ca3af", padding: 0, display: "flex",
              alignItems: "center", gap: 5, transition: "color 0.15s",
            }}
          >
            ← Back
          </button>
          <button
            className="rerw-btn"
            onClick={handleReReview}
            disabled={rereviewing}
            style={{
              padding: "7px 16px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8, fontSize: 13, color: "#374151",
              cursor: rereviewing ? "not-allowed" : "pointer",
              opacity: rereviewing ? 0.6 : 1,
              transition: "background 0.2s, border-color 0.2s",
              fontWeight: 500,
            }}
          >
            {rereviewing ? "Queuing…" : "↺  Re-review"}
          </button>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: "#6b7280",
              background: "#f3f4f6", padding: "2px 8px", borderRadius: 99,
            }}>#{review.pr_number}</span>
            <h1 style={{
              margin: 0, fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1.3,
            }}>{review.title}</h1>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: "#9ca3af" }}>
            by <strong style={{ color: "#6b7280" }}>@{review.author}</strong>
            {" · "}
            <code style={{
              fontSize: 11, background: "#f3f4f6", padding: "1px 6px", borderRadius: 4,
              fontFamily: "ui-monospace,monospace", color: "#374151",
            }}>{review.head_branch}</code>
            {" → "}
            <code style={{
              fontSize: 11, background: "#f3f4f6", padding: "1px 6px", borderRadius: 4,
              fontFamily: "ui-monospace,monospace", color: "#374151",
            }}>{review.base_branch}</code>
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "148px 1fr",
          gap: 16,
          marginBottom: 28,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: "24px 24px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <AnimatedRing score={score} />
            <div style={{
              fontSize: 11, color: "#9ca3af", textAlign: "center",
            }}>
              {totalIssues} issue{totalIssues !== 1 ? "s" : ""} found
            </div>
          </div>


          <div style={{ borderLeft: "1px solid #f3f4f6", paddingLeft: 22 }}>
            <p style={{
              margin: "0 0 6px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em",
              textTransform: "uppercase", color: "#9ca3af",
            }}>Summary</p>
            <p style={{
              margin: "0 0 18px", fontSize: 13.5, color: "#374151", lineHeight: 1.7,
            }}>{review.overall_summary || "No summary available."}</p>

    
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ScorePill label="Security" value={securityIssues.length} hue={0}   />
              <ScorePill label="Quality"  value={qualityIssues.length}  hue={38}  />
              <ScorePill label="Tests"    value={testIssues.length}     hue={220} />
            </div>


            {(pipelineMeta.total_tokens || pipelineMeta.duration_ms) && (
              <div style={{
                marginTop: 14, display: "flex", gap: 16, fontSize: 11.5, color: "#9ca3af",
              }}>
                {pipelineMeta.total_tokens && (
                  <span>{pipelineMeta.total_tokens.toLocaleString()} tokens</span>
                )}
                {pipelineMeta.duration_ms && (
                  <span>{pipelineMeta.duration_ms}ms</span>
                )}
              </div>
            )}
          </div>
        </div>


        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 22,
        }}>
          <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: "#9ca3af",
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>Issues</span>
          <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
        </div>

   
        <IssueSection type="security" issues={securityIssues} />
        <IssueSection type="quality"  issues={qualityIssues}  />
        <IssueSection type="tests"    issues={testIssues}     />


        {totalIssues === 0 && (
          <div style={{
            textAlign: "center", padding: "44px 20px",
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 12, color: "#065F46",
          }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No issues found — clean PR</p>
            <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#34d399" }}>
              This PR passed all security, quality and test coverage checks.
            </p>
          </div>
        )}

        <AgentReasoningPanel agentReasoning={agentReasoning} />
      </div>
    </>
  );
};

const stateWrap = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", padding: "80px 24px", gap: 8,
};

export default ReviewDetail;
