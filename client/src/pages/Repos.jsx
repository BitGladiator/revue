import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGithubRepos, connectRepo } from '../api/client.js';

const Repos = () => {
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);

  useEffect(() => {
    getGithubRepos()
      .then(setRepos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async (repo) => {
    setConnecting(repo.github_repo_id);
    try {
      await connectRepo(repo);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '24px' }}>
        ← Back to dashboard
      </button>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#1a202c', margin: '0 0 24px' }}>Connect a repository</h1>

      {loading ? (
        <div style={{ color: '#a0aec0', fontSize: '14px' }}>Loading your repos...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {repos.map((repo) => (
            <div key={repo.github_repo_id} style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>{repo.full_name}</div>
                <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '3px' }}>
                  {repo.language || 'Unknown'} · {repo.private ? 'Private' : 'Public'}
                </div>
              </div>
              <button
                onClick={() => handleConnect(repo)}
                disabled={connecting === repo.github_repo_id}
                style={{ padding: '6px 14px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', opacity: connecting === repo.github_repo_id ? 0.6 : 1 }}
              >
                {connecting === repo.github_repo_id ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Repos;