import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { logout, getRepos } from '../api/client.js';
import useReviewSocket from '../hooks/useReviewSocket.js';
import NotificationBell from '../components/NotificationBell.jsx';

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  const { notifications, unreadCount, markRead, markAllRead } =
    useReviewSocket(user?.id);

  useEffect(() => {
    getRepos()
      .then(setRepos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/login');
  };

  const totalPRs = repos.reduce((s, r) => s + parseInt(r.total_prs || 0), 0);
  const totalReviewed = repos.reduce((s, r) => s + parseInt(r.reviewed_prs || 0), 0);

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1a202c', margin: 0 }}>Revue</h1>
          <p style={{ fontSize: '13px', color: '#718096', margin: '4px 0 0' }}>AI-powered code review</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            markRead={markRead}
            markAllRead={markAllRead}
          />
          <img src={user?.avatar_url} alt={user?.username}
            style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <span style={{ fontSize: '13px', color: '#4a5568' }}>{user?.username}</span>
          <button onClick={handleLogout}
            style={{ fontSize: '13px', color: '#718096', background: 'none', border: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {repos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          <StatCard label="Connected repos" value={repos.length} />
          <StatCard label="Total PRs" value={totalPRs} />
          <StatCard label="PRs reviewed" value={totalReviewed} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#2d3748', margin: 0 }}>
          Connected repositories
        </h2>
        <button
          onClick={() => navigate('/repos')}
          style={{ padding: '8px 16px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
        >
          Connect repo
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#a0aec0', fontSize: '14px', padding: '40px 0' }}>Loading...</div>
      ) : repos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
          <p style={{ color: '#a0aec0', fontSize: '14px', margin: '0 0 16px' }}>No repos connected yet.</p>
          <button
            onClick={() => navigate('/repos')}
            style={{ padding: '9px 20px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
          >
            Connect your first repo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {repos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => navigate(`/repos/${repo.id}`)}
              style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#a0aec0'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>{repo.full_name}</div>
                <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                  {repo.total_prs || 0} PRs · {repo.reviewed_prs || 0} reviewed
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: repo.private ? '#718096' : '#38A169' }}>
                  {repo.private ? 'Private' : 'Public'}
                </span>
                <span style={{ color: '#a0aec0', fontSize: '12px' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
    <div style={{ fontSize: '22px', fontWeight: '600', color: '#1a202c', marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#718096' }}>{label}</div>
  </div>
);

export default Dashboard;