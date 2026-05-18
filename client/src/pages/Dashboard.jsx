import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { logout, getRepos } from "../api/client.js";
import useReviewSocket from "../hooks/useReviewSocket.js";
import NotificationBell from "../components/NotificationBell.jsx";



const StatCard = ({ label, value }) => (
  <div style={{
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "18px 20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  }}>
    <div style={{
      fontSize: 28, fontWeight: 700, color: "#111827",
      letterSpacing: "-0.5px", lineHeight: 1,
    }}>{value}</div>
    <div style={{
      fontSize: 11.5, color: "#9ca3af", marginTop: 6,
      fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
    }}>{label}</div>
  </div>
);


const RepoCard = ({ repo, onClick }) => {
  const reviewed = parseInt(repo.reviewed_prs || 0);
  const total    = parseInt(repo.total_prs    || 0);
  const pct      = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="repo-card"
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: "#111827",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginBottom: 6,
        }}>{repo.full_name}</div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            flex: 1, height: 4, background: "#f3f4f6",
            borderRadius: 99, overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: "linear-gradient(90deg, #374151, #111827)",
              borderRadius: 99,
              transition: "width 0.6s ease",
            }} />
          </div>
          <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>
            {reviewed}/{total} reviewed
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{
          fontSize: 10.5, fontWeight: 600, letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: repo.private ? "#6b7280" : "#059669",
          background: repo.private ? "#f3f4f6" : "rgba(5,150,105,0.08)",
          padding: "2px 8px", borderRadius: 99,
        }}>
          {repo.private ? "Private" : "Public"}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
};

/* ─── Dashboard ────────────────────────────────────────────────── */

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [repos, setRepos]     = useState([]);
  const [loading, setLoading] = useState(true);

  const { notifications, unreadCount, markRead, markAllRead } = useReviewSocket(user?.id);

  useEffect(() => {
    getRepos()
      .then(setRepos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/login");
  };

  const totalPRs      = repos.reduce((s, r) => s + parseInt(r.total_prs    || 0), 0);
  const totalReviewed = repos.reduce((s, r) => s + parseInt(r.reviewed_prs || 0), 0);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        .repo-card:hover {
          border-color: #9ca3af !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
          transform: translateY(-1px);
        }
        .nav-btn:hover { background: #f3f4f6 !important; }
        .connect-btn:hover { background: #000 !important; transform: translateY(-1px); }
        .back-btn:hover { color:#374151 !important; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px 60px" }}>

        {/* ── Topbar ── */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 36,
        }}>
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 2,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: "linear-gradient(135deg, #111827, #374151)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
                Revue
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: "#9ca3af" }}>
              AI-powered code review
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              markRead={markRead}
              markAllRead={markAllRead}
            />
            <button
              className="nav-btn"
              onClick={() => navigate("/analytics")}
              style={{
                fontSize: 13, color: "#374151",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "6px 14px",
                cursor: "pointer", fontWeight: 500,
                transition: "background 0.15s",
              }}
            >
              Analytics
            </button>

            {user?.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.username}
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  border: "2px solid #e5e7eb",
                }}
              />
            )}
            <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
              {user?.username}
            </span>

            <button
              onClick={handleLogout}
              style={{
                fontSize: 13, color: "#9ca3af",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                transition: "color 0.15s",
              }}
            >
              Logout
            </button>
          </div>
        </div>

     
        {repos.length > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12, marginBottom: 32,
            animation: "fadeUp 0.4s ease both",
          }}>
            <StatCard label="Connected repos" value={repos.length} />
            <StatCard label="Total PRs"       value={totalPRs}    />
            <StatCard label="PRs reviewed"    value={totalReviewed} />
          </div>
        )}

     
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14,
        }}>
          <h2 style={{
            margin: 0, fontSize: 14, fontWeight: 700,
            color: "#374151", letterSpacing: "-0.1px",
          }}>
            Connected repositories
          </h2>
          <button
            className="connect-btn"
            onClick={() => navigate("/repos")}
            style={{
              padding: "8px 16px",
              background: "#111827",
              color: "#fff", border: "none",
              borderRadius: 9, fontSize: 13, fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s, transform 0.15s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}
          >
            + Connect repo
          </button>
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
            Loading repositories…
          </div>
        ) : repos.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            border: "1px dashed #d1d5db", borderRadius: 14,
            animation: "fadeUp 0.4s ease both",
          }}>
            <p style={{ color: "#9ca3af", fontSize: 13.5, margin: "0 0 18px" }}>
              No repositories connected yet.
            </p>
            <button
              onClick={() => navigate("/repos")}
              style={{
                padding: "10px 22px", background: "#111827", color: "#fff",
                border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Connect your first repo
            </button>
          </div>
        ) : (
          <div style={{
            display: "flex", flexDirection: "column", gap: 10,
            animation: "fadeUp 0.4s ease both",
          }}>
            {repos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                onClick={() => navigate(`/repos/${repo.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
