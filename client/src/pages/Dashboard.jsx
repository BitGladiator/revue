import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { logout, getRepos } from '../api/client.js';

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    getRepos().then(setRepos).catch(console.error);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1a202c', margin: 0 }}>Revue</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={user?.avatar_url} alt={user?.username} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <span style={{ fontSize: '13px', color: '#4a5568' }}>{user?.username}</span>
          <button onClick={handleLogout} style={{ fontSize: '13px', color: '#718096', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748', margin: 0 }}>Connected repos</h2>
        <button
          onClick={() => navigate('/repos')}
          style={{ padding: '8px 16px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
        >
          Connect a repo
        </button>
      </div>

      {repos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#a0aec0', fontSize: '14px', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
          No repos connected yet. Connect a repo to start getting AI reviews.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {repos.map((repo) => (
            <div key={repo.id} style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>{repo.full_name}</div>
                <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                  {repo.total_prs || 0} PRs · {repo.reviewed_prs || 0} reviewed
                </div>
              </div>
              <button
                onClick={() => navigate(`/repos/${repo.id}`)}
                style={{ fontSize: '12px', color: '#3182CE', background: 'none', border: '1px solid #BEE3F8', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}
              >
                View PRs
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;