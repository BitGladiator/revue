import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotificationBell = ({ notifications, unreadCount, markRead, markAllRead }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  const scoreColor = (score) =>
    score >= 80 ? '#276749' : score >= 60 ? '#744210' : '#9B2335';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ position: 'relative', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#4a5568' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#E53E3E', color: '#fff', fontSize: '10px', fontWeight: '700', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '42px', right: 0, width: '340px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', zIndex: 100, overflow: 'hidden' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>Reviews</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ fontSize: '12px', color: '#3182CE', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
                No reviews yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    markRead(n.id);
                    navigate(`/reviews/${n.prId}`);
                    setOpen(false);
                  }}
                  style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #f7fafc', cursor: 'pointer', background: n.read ? '#fff' : '#EBF8FF' }}
                >
                  <div style={{ paddingTop: '4px', flexShrink: 0 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.read ? '#e2e8f0' : '#3182CE' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a202c', marginBottom: '2px' }}>
                      PR #{n.prNumber} reviewed
                    </div>
                    <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.prTitle}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: scoreColor(n.score) }}>
                        {n.score}/100
                      </span>
                      <span style={{ fontSize: '11px', color: '#a0aec0' }}>
                        {n.totalIssues} {n.totalIssues === 1 ? 'issue' : 'issues'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#a0aec0', marginLeft: 'auto' }}>
                        {formatTime(n.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationBell;