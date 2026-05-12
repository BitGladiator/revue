import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRepoPRs, getRepos, retryPRReview } from '../api/client.js';
import useReviewSocket from '../hooks/useReviewSocket.js';
import { useAuth } from '../hooks/useAuth.jsx';

const STATUS_STYLES = {
  pending:   { bg: '#FEFCBF', color: '#744210', label: 'Pending' },
  reviewing: { bg: '#EBF8FF', color: '#2B6CB0', label: 'Reviewing...' },
  reviewed:  { bg: '#F0FFF4', color: '#276749', label: 'Reviewed' },
  failed:    { bg: '#FFF5F5', color: '#9B2335', label: 'Failed' },
};

const ScoreBadge = ({ score }) => {
  if (score === null || score === undefined) return null;
  const color = score >= 80 ? '#276749' : score >= 60 ? '#744210' : '#9B2335';
  const bg    = score >= 80 ? '#F0FFF4' : score >= 60 ? '#FEFCBF' : '#FFF5F5';
  return (
    <div style={{ background: bg, color, fontSize: '13px', fontWeight: '600', padding: '3px 10px', borderRadius: '99px' }}>
      {score}/100
    </div>
  );
};

const RepoPRs = () => {
  const { repoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prs, setPRs] = useState([]);
  const [repoName, setRepoName] = useState('');
  const [loading, setLoading] = useState(true);

  const { prStatuses } = useReviewSocket(user?.id);

  const handleRetry = async (e, prId) => {
    e.stopPropagation();
    try {
      await retryPRReview(prId);
    } catch (err) {
      alert(err.error || 'Failed to retry review');
    }
  };

  useEffect(() => {
    Promise.all([getRepoPRs(repoId), getRepos()])
      .then(([prData, repos]) => {
        setPRs(prData);
        const repo = repos.find((r) => String(r.id) === String(repoId));
        setRepoName(repo?.full_name || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [repoId]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>

      <div style={{ marginBottom: '32px' }}>
        <button onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '8px' }}>
          ← Back to dashboard
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#1a202c', margin: 0 }}>{repoName}</h1>
        <p style={{ fontSize: '13px', color: '#718096', margin: '4px 0 0' }}>Pull requests reviewed by Revue</p>
      </div>

      {loading ? (
        <div style={{ color: '#a0aec0', fontSize: '14px' }}>Loading...</div>
      ) : prs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed #e2e8f0', borderRadius: '12px', color: '#a0aec0', fontSize: '14px' }}>
          No pull requests yet. Open a PR on this repo to trigger a review.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {prs.map((pr) => {
            const liveStatus = prStatuses[pr.id];
            const status = liveStatus?.status || pr.status;
            const score = liveStatus?.score ?? pr.quality_score;
            const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;
            const isReviewed = status === 'reviewed';

            return (
              <div
                key={pr.id}
                onClick={() => isReviewed && navigate(`/reviews/${pr.id}`)}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isReviewed ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => { if (isReviewed) e.currentTarget.style.borderColor = '#a0aec0'; }}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#a0aec0', flexShrink: 0 }}>#{pr.pr_number}</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pr.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    by @{pr.author} · {formatDate(pr.created_at)} · {pr.head_branch} → {pr.base_branch}
                  </div>
                  {status === 'reviewing' && liveStatus?.message && (
                    <div style={{ fontSize: '12px', color: '#2B6CB0', marginTop: '6px' }}>
                      {liveStatus.message}
                    </div>
                  )}
                  {pr.overall_summary && status === 'reviewed' && (
                    <div style={{ fontSize: '12px', color: '#4a5568', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pr.overall_summary}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '16px' }}>
                  {(status === 'pending' || status === 'failed') && (
                    <button
                      onClick={(e) => handleRetry(e, pr.id)}
                      style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
                    >
                      Retry Review
                    </button>
                  )}
                  <ScoreBadge score={score} />
                  <span style={{ fontSize: '11px', fontWeight: '500', background: statusStyle.bg, color: statusStyle.color, padding: '2px 8px', borderRadius: '99px' }}>
                    {statusStyle.label}
                  </span>
                  {isReviewed && <span style={{ color: '#a0aec0', fontSize: '12px' }}>→</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default RepoPRs;