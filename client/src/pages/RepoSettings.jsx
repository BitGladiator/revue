import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRepoSettings, updateRepoSettings } from '../api/client.js';



const Toggle = ({ label, description, checked, onChange }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '16px 0',
    borderBottom: '1px solid #f3f4f6',
  }}>
    <div style={{ flex: 1, paddingRight: 24 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{description}</div>
    </div>
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 42, height: 24,
        borderRadius: 99, border: 'none',
        background: checked ? '#111827' : '#e5e7eb',
        cursor: 'pointer', position: 'relative', flexShrink: 0,
        transition: 'background 0.25s',
        boxShadow: checked ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        position: 'absolute', top: 3,
        left: checked ? 21 : 3,
        transition: 'left 0.25s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  </div>
);


const SectionCard = ({ title, children }) => (
  <div style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '0 20px',
    marginBottom: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }}>
    <p style={{
      margin: 0, padding: '16px 0 4px',
      fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em',
      textTransform: 'uppercase', color: '#9ca3af',
    }}>{title}</p>
    {children}
  </div>
);



const RepoSettings = () => {
  const { repoId } = useParams();
  const navigate   = useNavigate();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getRepoSettings(repoId)
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [repoId]);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const updated = await updateRepoSettings(repoId, settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        color: '#9ca3af', fontSize: 13, padding: '80px 24px',
        maxWidth: 640, margin: '0 auto',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          border: '2px solid #e5e7eb', borderTopColor: '#374151',
          animation: 'spin 0.7s linear infinite',
        }} />
        Loading settings…
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    );

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to { transform:rotate(360deg); } }
        .back-btn:hover { color:#374151 !important; }
        .save-btn:hover:not(:disabled) { background:#000 !important; transform:translateY(-1px); }
      `}</style>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '36px 24px 60px', animation: 'fadeUp 0.4s ease both' }}>

        <button
          className="back-btn"
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', color: '#9ca3af',
            cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.15s',
          }}
        >
          ← Back
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            margin: '0 0 6px', fontSize: 20, fontWeight: 700,
            color: '#111827', letterSpacing: '-0.3px',
          }}>
            Review settings
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
            Configure how Revue reviews pull requests for this repository.
          </p>
        </div>

        <SectionCard title="Agents">
          <Toggle
            label="Code quality agent"
            description="Checks complexity, naming, duplication and anti-patterns"
            checked={settings?.enable_quality_agent ?? true}
            onChange={(v) => setSettings((s) => ({ ...s, enable_quality_agent: v }))}
          />
          <Toggle
            label="Security agent"
            description="Finds vulnerabilities, injection risks and exposed secrets"
            checked={settings?.enable_security_agent ?? true}
            onChange={(v) => setSettings((s) => ({ ...s, enable_security_agent: v }))}
          />
          <Toggle
            label="Test coverage agent"
            description="Identifies missing tests and untested edge cases"
            checked={settings?.enable_tests_agent ?? true}
            onChange={(v) => setSettings((s) => ({ ...s, enable_tests_agent: v }))}
          />
        </SectionCard>

        <SectionCard title="Behaviour">
          <Toggle
            label="Auto-review on PR open"
            description="Automatically review every new pull request"
            checked={settings?.auto_review ?? true}
            onChange={(v) => setSettings((s) => ({ ...s, auto_review: v }))}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 0',
          }}>
            <div style={{ flex: 1, paddingRight: 24 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', marginBottom: 3 }}>
                Minimum severity
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                Only report issues at or above this severity
              </div>
            </div>
            <select
              value={settings?.min_severity ?? 'low'}
              onChange={(e) => setSettings((s) => ({ ...s, min_severity: e.target.value }))}
              style={{
                padding: '7px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8, fontSize: 13,
                color: '#374151', background: '#fff',
                cursor: 'pointer', outline: 'none', appearance: 'auto',
              }}
            >
              <option value="low">Low and above</option>
              <option value="medium">Medium and above</option>
              <option value="high">High and above</option>
              <option value="critical">Critical only</option>
            </select>
          </div>
        </SectionCard>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 8 }}>
          {saved && (
            <span style={{ fontSize: 13, color: '#059669', fontWeight: 500, animation: 'fadeUp 0.2s ease both' }}>
              Settings saved
            </span>
          )}
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '9px 24px',
              background: '#111827',
              color: '#fff', border: 'none',
              borderRadius: 9, fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              transition: 'background 0.2s, transform 0.15s',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            }}
          >
            {saving && (
              <span style={{
                width: 13, height: 13, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
                animation: 'spin 0.7s linear infinite', display: 'inline-block',
              }} />
            )}
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </>
  );
};

export default RepoSettings;