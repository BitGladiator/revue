import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGithubRepos, connectRepo } from '../api/client.js';

const Repos = () => {
  const navigate = useNavigate();
  const [repos, setRepos]           = useState([]);
  const [loading, setLoading]       = useState(true);
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
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        .repo-row:hover { border-color:#9ca3af !important; box-shadow:0 4px 16px rgba(0,0,0,0.07) !important; }
        .connect-btn-row:hover:not(:disabled) { background:#000 !important; }
        .back-btn:hover { color:#374151 !important; }
      `}</style>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 24px 60px' }}>

        <button
          className="back-btn"
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none', border: 'none', color: '#9ca3af',
            cursor: 'pointer', fontSize: 13, padding: 0,
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 5,
            transition: 'color 0.15s',
          }}
        >
          ← Back to dashboard
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            margin: '0 0 6px', fontSize: 20, fontWeight: 700,
            color: '#111827', letterSpacing: '-0.3px',
          }}>
            Connect a repository
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
            Choose a GitHub repository to start receiving AI-powered PR reviews.
          </p>
        </div>

        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            color: '#9ca3af', fontSize: 13, padding: '40px 0',
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '2px solid #e5e7eb', borderTopColor: '#374151',
              animation: 'spin 0.7s linear infinite',
            }} />
            Loading your repositories…
          </div>
        ) : repos.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            border: '1px dashed #d1d5db', borderRadius: 14,
            color: '#9ca3af', fontSize: 13.5,
          }}>
            No GitHub repositories found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.4s ease both' }}>
            {repos.map((repo) => {
              const isBusy = connecting === repo.github_repo_id;
              return (
                <div
                  key={repo.github_repo_id}
                  className="repo-row"
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: '#111827',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: 3,
                    }}>
                      {repo.full_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {repo.language && (
                        <span style={{
                          fontSize: 11, color: '#6b7280',
                          background: '#f3f4f6', padding: '1px 7px',
                          borderRadius: 99, fontWeight: 500,
                        }}>{repo.language}</span>
                      )}
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: repo.private ? '#6b7280' : '#059669',
                        background: repo.private ? '#f3f4f6' : 'rgba(5,150,105,0.08)',
                        padding: '1px 7px', borderRadius: 99,
                      }}>
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                    </div>
                  </div>

                  <button
                    className="connect-btn-row"
                    onClick={() => handleConnect(repo)}
                    disabled={!!connecting}
                    style={{
                      padding: '7px 18px',
                      background: '#111827',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13, fontWeight: 600,
                      cursor: connecting ? 'not-allowed' : 'pointer',
                      opacity: connecting && !isBusy ? 0.4 : 1,
                      flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: 7,
                      transition: 'background 0.2s',
                    }}
                  >
                    {isBusy && (
                      <span style={{
                        width: 12, height: 12, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#fff',
                        animation: 'spin 0.7s linear infinite',
                        display: 'inline-block',
                      }} />
                    )}
                    {isBusy ? 'Connecting…' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Repos;