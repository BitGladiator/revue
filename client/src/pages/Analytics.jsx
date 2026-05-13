import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAnalyticsOverview,
  getScoreTrend,
  getCommonIssues,
  getRepoAnalytics,
} from '../api/client.js';

const Analytics = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [issues, setIssues] = useState([]);
  const [repoStats, setRepoStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsOverview(),
      getScoreTrend(),
      getCommonIssues(),
      getRepoAnalytics(),
    ])
      .then(([ov, tr, iss, rs]) => {
        setOverview(ov);
        setTrend(tr);
        setIssues(iss);
        setRepoStats(rs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);


  const W = 600;
  const H = 160;
  const PAD = { top: 16, right: 16, bottom: 32, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const toX = (i) => PAD.left + (i / Math.max(trend.length - 1, 1)) * chartW;
  const toY = (score) => PAD.top + chartH - ((score - 0) / 100) * chartH;
  const polyline = trend.map((d, i) => `${toX(i)},${toY(d.avg_score)}`).join(' ');

  const scoreColor = (score) =>
    score >= 80 ? '#276749' : score >= 60 ? '#744210' : '#9B2335';

  if (loading) return <div style={{ padding: '40px', color: '#a0aec0' }}>Loading analytics...</div>;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>

      <button onClick={() => navigate('/dashboard')}
        style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '24px' }}>
        ← Back to dashboard
      </button>

      <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#1a202c', margin: '0 0 32px' }}>
        Analytics
      </h1>

      {/* Overview stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        <StatCard label="Total reviews"  value={overview?.total_reviews  || 0} />
        <StatCard label="Average score"  value={overview?.avg_score      || 0} />
        <StatCard label="High quality"   value={overview?.high_quality_prs || 0} color="#276749" />
        <StatCard label="Needs work"     value={overview?.needs_work_prs || 0} color="#9B2335" />
      </div>

      
      {trend.length > 0 && (
        <div style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', margin: '0 0 16px' }}>
            Score trend — last 30 days
          </h3>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
           
            {[25, 50, 75, 100].map((y) => (
              <g key={y}>
                <line x1={PAD.left} y1={toY(y)} x2={W - PAD.right} y2={toY(y)}
                  stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                <text x={PAD.left - 6} y={toY(y) + 4} textAnchor="end" fontSize="10" fill="#a0aec0">{y}</text>
              </g>
            ))}
          
            <polyline points={polyline} fill="none" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        
            {trend.map((d, i) => (
              <g key={i}>
                <circle cx={toX(i)} cy={toY(d.avg_score)} r="4"
                  fill={scoreColor(parseInt(d.avg_score))} stroke="#fff" strokeWidth="2" />
                <text x={toX(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#a0aec0">
                  {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

     
        <div style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', margin: '0 0 16px' }}>
            Most common issues
          </h3>
          {issues.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>No issues yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {issues.map((issue, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#2d3748', lineHeight: 1.4, flex: 1 }}>
                    {issue.message}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#718096', background: '#e2e8f0', padding: '1px 7px', borderRadius: '99px', flexShrink: 0 }}>
                    ×{issue.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      
        <div style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', margin: '0 0 16px' }}>
            By repository
          </h3>
          {repoStats.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>No data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {repoStats.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => navigate(`/repos/${repo.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#1a202c' }}>
                      {repo.full_name.split('/')[1]}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: scoreColor(parseInt(repo.avg_score || 0)) }}>
                      {repo.avg_score || 'N/A'}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${repo.avg_score || 0}%`, background: scoreColor(parseInt(repo.avg_score || 0)), borderRadius: '99px', transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '3px' }}>
                    {repo.reviewed || 0} of {repo.total_prs || 0} PRs reviewed
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

const StatCard = ({ label, value, color = '#1a202c' }) => (
  <div style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
    <div style={{ fontSize: '22px', fontWeight: '600', color, marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#718096' }}>{label}</div>
  </div>
);

export default Analytics;