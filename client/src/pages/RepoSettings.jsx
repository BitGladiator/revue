import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRepoSettings, updateRepoSettings } from '../api/client.js';

const Toggle = ({ label, description, checked, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid #f7fafc' }}>
    <div>
      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '12px', color: '#718096' }}>{description}</div>
    </div>
    <button
      onClick={() => onChange(!checked)}
      style={{ width: '40px', height: '22px', borderRadius: '99px', border: 'none', background: checked ? '#2d3748' : '#e2e8f0', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
    >
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: checked ? '21px' : '3px', transition: 'left 0.2s' }} />
    </button>
  </div>
);

const RepoSettings = () => {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRepoSettings(repoId)
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [repoId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
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

  if (loading) return <div style={{ padding: '40px', color: '#a0aec0' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>

      <button onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '13px', padding: 0, marginBottom: '24px' }}>
        ← Back
      </button>

      <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#1a202c', margin: '0 0 8px' }}>
        Review settings
      </h1>
      <p style={{ fontSize: '13px', color: '#718096', margin: '0 0 32px' }}>
        Configure how Revue reviews pull requests for this repository.
      </p>

     
      <div style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0 20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '16px 0 8px', margin: 0 }}>
          Agents
        </h2>
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
      </div>

     
      <div style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0 20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '16px 0 8px', margin: 0 }}>
          Behaviour
        </h2>
        <Toggle
          label="Auto-review on PR open"
          description="Automatically review every new pull request"
          checked={settings?.auto_review ?? true}
          onChange={(v) => setSettings((s) => ({ ...s, auto_review: v }))}
        />

       
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '2px' }}>
              Minimum severity
            </div>
            <div style={{ fontSize: '12px', color: '#718096' }}>
              Only report issues at or above this severity
            </div>
          </div>
          <select
            value={settings?.min_severity ?? 'low'}
            onChange={(e) => setSettings((s) => ({ ...s, min_severity: e.target.value }))}
            style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#1a202c', background: '#fff', cursor: 'pointer' }}
          >
            <option value="low">Low and above</option>
            <option value="medium">Medium and above</option>
            <option value="high">High and above</option>
            <option value="critical">Critical only</option>
          </select>
        </div>
      </div>

    
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
        {saved && (
          <span style={{ fontSize: '13px', color: '#38A169' }}>Settings saved</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '9px 24px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>

    </div>
  );
};

export default RepoSettings;