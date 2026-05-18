import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const scoreHue = (s) => s >= 80 ? 152 : s >= 60 ? 197 : s >= 40 ? 38 : 0;

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
    const diffMin = Math.floor((Date.now() - new Date(date)) / 60000);
    if (diffMin < 1)  return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
   
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'relative',
          background: open ? '#f3f4f6' : '#fff',
          border: `1px solid ${open ? '#9ca3af' : '#e5e7eb'}`,
          borderRadius: 8, padding: '6px 10px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          color: open ? '#111827' : '#6b7280',
          transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            background: '#ef4444', color: '#fff',
            fontSize: 9.5, fontWeight: 700,
            width: 17, height: 17, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      
      {open && (
        <div style={{
          position: 'absolute', top: 42, right: 0, width: 348,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
          zIndex: 100, overflow: 'hidden',
        }}>
         
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '13px 16px',
            borderBottom: '1px solid #f3f4f6',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
              Reviews
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 10.5, fontWeight: 700,
                  background: '#f3f4f6', color: '#374151',
                  padding: '1px 7px', borderRadius: 99,
                }}>{unreadCount} new</span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: 12, color: '#374151',
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, fontWeight: 500,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

        
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '36px 16px', textAlign: 'center',
                color: '#9ca3af', fontSize: 13,
              }}>
                No reviews yet
              </div>
            ) : (
              notifications.map((n) => {
                const hue = scoreHue(n.score);
                return (
                  <div
                    key={n.id}
                    onClick={() => { markRead(n.id); navigate(`/reviews/${n.prId}`); setOpen(false); }}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 16px',
                      borderBottom: '1px solid #f9fafb',
                      cursor: 'pointer',
                      background: n.read ? '#fff' : '#fafafa',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? '#fff' : '#fafafa')}
                  >
                    <div style={{ paddingTop: 5, flexShrink: 0 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: n.read ? '#e5e7eb' : '#374151',
                      }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                        PR #{n.prNumber} reviewed
                      </div>
                      <div style={{
                        fontSize: 12, color: '#9ca3af', marginBottom: 5,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {n.prTitle}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: `hsl(${hue} 65% 36%)`,
                          background: `hsl(${hue} 60% 96%)`,
                          padding: '1px 7px', borderRadius: 99,
                          border: `1px solid hsl(${hue} 50% 86%)`,
                        }}>
                          {n.score}/100
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                          {n.totalIssues} {n.totalIssues === 1 ? 'issue' : 'issues'}
                        </span>
                        <span style={{ fontSize: 11, color: '#d1d5db', marginLeft: 'auto' }}>
                          {formatTime(n.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;