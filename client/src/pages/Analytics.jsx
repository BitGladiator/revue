import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAnalyticsOverview,
  getScoreTrend,
  getCommonIssues,
  getRepoAnalytics,
} from '../api/client.js';

const scoreHue   = (s) => s >= 80 ? 152 : s >= 60 ? 197 : s >= 40 ? 38 : 0;
const scoreColor = (s) => `hsl(${scoreHue(parseInt(s || 0))} 65% 36%)`;



const StatCard = ({ label, value, hue }) => (
  <div style={{
    background: hue != null ? `hsl(${hue} 60% 97%)` : '#fff',
    border: `1px solid ${hue != null ? `hsl(${hue} 50% 88%)` : '#e5e7eb'}`,
    borderRadius: 12, padding: '18px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      fontSize: 28, fontWeight: 700,
      color: hue != null ? `hsl(${hue} 65% 36%)` : '#111827',
      letterSpacing: '-0.5px', lineHeight: 1,
    }}>{value}</div>
    <div style={{
      fontSize: 11.5, color: hue != null ? `hsl(${hue} 30% 52%)` : '#9ca3af',
      marginTop: 6, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>{label}</div>
  </div>
);

/* ─── SectionBox ───────────────────────────────────────────────── */

const SectionBox = ({ title, children }) => (
  <div style={{
    background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: '18px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }}>
    <p style={{
      margin: '0 0 14px', fontSize: 10.5, fontWeight: 700,
      letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9ca3af',
    }}>{title}</p>
    {children}
  </div>
);


const Analytics = () => {
  const navigate = useNavigate();
  const [overview, setOverview]   = useState(null);
  const [trend, setTrend]         = useState([]);
  const [issues, setIssues]       = useState([]);
  const [repoStats, setRepoStats] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsOverview(),
      getScoreTrend(),
      getCommonIssues(),
      getRepoAnalytics(),
    ])
      .then(([ov, tr, iss, rs]) => {
        setOverview(ov); setTrend(tr); setIssues(iss); setRepoStats(rs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);


  const W = 600, H = 170;
  const PAD = { top: 16, right: 16, bottom: 34, left: 38 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top  - PAD.bottom;
  const toX = (i) => PAD.left + (i / Math.max(trend.length - 1, 1)) * cW;
  const toY = (v) => PAD.top  + cH - (v / 100) * cH;
  const polyline = trend.map((d, i) => `${toX(i)},${toY(d.avg_score)}`).join(' ');
  const areaPath = trend.length > 0
    ? `M${toX(0)},${toY(trend[0].avg_score)} ` +
      trend.slice(1).map((d, i) => `L${toX(i+1)},${toY(d.avg_score)}`).join(' ') +
      ` L${toX(trend.length-1)},${PAD.top+cH} L${toX(0)},${PAD.top+cH} Z`
    : '';

  if (loading)
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        color: '#9ca3af', fontSize: 13, padding: '80px 24px',
        maxWidth: 860, margin: '0 auto',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          border: '2px solid #e5e7eb', borderTopColor: '#374151',
          animation: 'spin 0.7s linear infinite',
        }} />
        Loading analytics…
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    );

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to { transform:rotate(360deg); } }
        .repo-row:hover { background:#fafafa !important; }
        .back-btn:hover { color:#374151 !important; }
      `}</style>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px 60px', animation: 'fadeUp 0.4s ease both' }}>

        <button
          className="back-btn"
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none', border: 'none', color: '#9ca3af',
            cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.15s',
          }}
        >
          ← Back to dashboard
        </button>

        <h1 style={{
          margin: '0 0 28px', fontSize: 20, fontWeight: 700,
          color: '#111827', letterSpacing: '-0.3px',
        }}>Analytics</h1>

    
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total reviews"  value={overview?.total_reviews    || 0} />
          <StatCard label="Average score"  value={overview?.avg_score        || 0} hue={197} />
          <StatCard label="High quality"   value={overview?.high_quality_prs || 0} hue={152} />
          <StatCard label="Needs work"     value={overview?.needs_work_prs   || 0} hue={0}   />
        </div>

        
        {trend.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionBox title="Score trend — last 30 days">
              <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#374151" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#374151" stopOpacity="0"    />
                  </linearGradient>
                </defs>
                {[25, 50, 75, 100].map((y) => (
                  <g key={y}>
                    <line x1={PAD.left} y1={toY(y)} x2={W-PAD.right} y2={toY(y)} stroke="#f3f4f6" strokeWidth="1" />
                    <text x={PAD.left-6} y={toY(y)+4} textAnchor="end" fontSize="10" fill="#d1d5db" fontFamily="system-ui,sans-serif">{y}</text>
                  </g>
                ))}
                <path d={areaPath} fill="url(#areaGrad)" />
                <polyline points={polyline} fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {trend.map((d, i) => (
                  <g key={i}>
                    <circle cx={toX(i)} cy={toY(d.avg_score)} r="4" fill={scoreColor(d.avg_score)} stroke="#fff" strokeWidth="2" />
                    <text x={toX(i)} y={H-6} textAnchor="middle" fontSize="9" fill="#d1d5db" fontFamily="system-ui,sans-serif">
                      {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </text>
                  </g>
                ))}
              </svg>
            </SectionBox>
          </div>
        )}

    
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <SectionBox title="Most common issues">
            {issues.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>No issues yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {issues.map((issue, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5, flex: 1 }}>{issue.message}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#6b7280',
                      background: '#f3f4f6', padding: '1px 8px', borderRadius: 99, flexShrink: 0,
                    }}>×{issue.count}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionBox>

          <SectionBox title="By repository">
            {repoStats.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>No data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {repoStats.map((repo) => {
                  const avg = parseInt(repo.avg_score || 0);
                  const hue = scoreHue(avg);
                  return (
                    <div
                      key={repo.id}
                      className="repo-row"
                      onClick={() => navigate(`/repos/${repo.id}`)}
                      style={{ cursor: 'pointer', borderRadius: 8, padding: '4px 0', transition: 'background 0.15s' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                          {repo.full_name.split('/')[1]}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: `hsl(${hue} 65% 36%)` }}>
                          {repo.avg_score || '—'}
                        </span>
                      </div>
                      <div style={{ height: 5, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{
                          height: '100%', width: `${avg}%`,
                          background: `hsl(${hue} 65% 52%)`,
                          borderRadius: 99, transition: 'width 0.7s ease',
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {repo.reviewed || 0} of {repo.total_prs || 0} PRs reviewed
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionBox>
        </div>
      </div>
    </>
  );
};

export default Analytics;